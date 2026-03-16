import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { CallerProfile } from "../../plugins/auth.js";

const churchSchema = z.object({
  name:    z.string().min(2),
  country: z.string().optional(),
  region:  z.string().optional(),
  commune: z.string().optional(),
  address: z.string().optional(),
  phone:   z.string().optional()
});

function assertCanEdit(profile: CallerProfile, country: string | null | undefined, reply: any) {
  if (profile.role === "viewer") {
    reply.forbidden("Los visualizadores no pueden modificar datos");
    return false;
  }
  if (profile.role === "country_assigned" && country !== profile.assigned_country) {
    reply.forbidden("Solo puedes modificar registros de tu país asignado");
    return false;
  }
  return true;
}

export const churchRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const query = z.object({
      search: z.string().optional(),
      page:   z.coerce.number().int().min(1).default(1),
      limit:  z.coerce.number().int().min(1).max(100).default(50),
      all:    z.coerce.boolean().default(false),
    }).parse(request.query);

    const caller = request.callerProfile;

    let dbQuery = app.supabaseAdmin
      .schema("core")
      .from("churches")
      .select("id, code, name, city, address, phone, country, region, commune", { count: "exact" })
      .order("name", { ascending: true });

    if (query.search) dbQuery = dbQuery.ilike("name", `%${query.search}%`);

    // country_assigned users only see their own country
    if (caller.role === "country_assigned" && caller.assigned_country) {
      dbQuery = dbQuery.eq("country", caller.assigned_country);
    }

    if (!query.all) {
      const offset = (query.page - 1) * query.limit;
      dbQuery = dbQuery.range(offset, offset + query.limit - 1);
    }

    const { data, error, count } = await dbQuery;
    if (error) return reply.badRequest(error.message);
    if (query.all) return data;
    return { data, total: count ?? 0, page: query.page, limit: query.limit };
  });

  app.post("/", async (request, reply) => {
    const caller = request.callerProfile;
    if (caller.role === "viewer") return reply.forbidden("Los visualizadores no pueden modificar datos");

    const payload = churchSchema.parse(request.body);

    // country_assigned: force the church into their assigned country
    if (caller.role === "country_assigned") {
      payload.country = caller.assigned_country ?? payload.country;
    }

    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("churches")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.patch("/:id", async (request, reply) => {
    const caller = request.callerProfile;
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);

    // Fetch existing church to check its country
    const { data: existing, error: fetchError } = await app.supabaseAdmin
      .schema("core")
      .from("churches")
      .select("country")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return reply.notFound("Iglesia no encontrada");
    if (!assertCanEdit(caller, existing.country, reply)) return;

    const payload = churchSchema.partial().parse(request.body);

    // Prevent country_assigned from changing the country field to another country
    if (caller.role === "country_assigned") {
      payload.country = caller.assigned_country ?? existing.country;
    }

    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("churches")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return data;
  });

  app.delete("/:id", async (request, reply) => {
    const caller = request.callerProfile;
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);

    // Only admins can delete churches
    if (caller.role !== "admin") return reply.forbidden("Solo los administradores pueden eliminar iglesias");

    // Get all pastors of this church
    const { data: pastors } = await app.supabaseAdmin.schema("core").from("pastors").select("id").eq("church_id", id);
    const pastorIds = (pastors ?? []).map((p) => p.id);

    if (pastorIds.length > 0) {
      await app.supabaseAdmin.schema("events").from("attendance_records").delete().in("pastor_id", pastorIds);
      await app.supabaseAdmin.schema("credentials").from("credentials").delete().in("pastor_id", pastorIds);
      await app.supabaseAdmin.schema("core").from("pastors").delete().in("id", pastorIds);
    }

    const { error } = await app.supabaseAdmin.schema("core").from("churches").delete().eq("id", id);
    if (error) return reply.badRequest(error.message);
    return reply.code(204).send();
  });
};
