import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { CallerProfile } from "../../plugins/auth.js";

const createPastorSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  document_number: z.string().min(5).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  church_id: z.string().min(1),
  pastoral_status: z.enum(["active", "inactive", "suspended"]).default("active"),
  degree_title: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  foreign_zone: z.string().nullable().optional(),
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

export const pastorRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const query = z.object({
      search:   z.string().optional(),
      iglesia:  z.string().optional(),
      country:  z.string().optional(),
      status:   z.string().optional(),
      page:     z.coerce.number().int().min(1).default(1),
      limit:    z.coerce.number().int().min(1).max(5000).default(50),
    }).parse(request.query);

    const caller = request.callerProfile;
    const offset = (query.page - 1) * query.limit;
    const SELECT = "id, first_name, last_name, document_number, email, phone, pastoral_status, degree_title, photo_url, expiry_date, church_id, country, zone, foreign_zone, churches(id, name, country)";

    let dbQuery = app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .select(SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + query.limit - 1);

    if (query.search)  dbQuery = dbQuery.ilike("full_name", `%${query.search}%`);
    if (query.status)  dbQuery = dbQuery.eq("pastoral_status", query.status);

    // country_assigned users only see their own country
    if (caller.role === "country_assigned" && caller.assigned_country) {
      dbQuery = dbQuery.eq("country", caller.assigned_country);
    }

    const { data, error, count } = await dbQuery;
    if (error) return reply.badRequest(error.message);
    return { data, total: count ?? 0, page: query.page, limit: query.limit };
  });

  app.post("/", async (request, reply) => {
    const caller = request.callerProfile;
    if (caller.role === "viewer") return reply.forbidden("Los visualizadores no pueden modificar datos");

    const payload = createPastorSchema.parse(request.body);

    // country_assigned: force the pastor into their assigned country
    if (caller.role === "country_assigned") {
      (payload as any).country = caller.assigned_country;
    }

    const { data: church, error: churchError } = await app.supabaseAdmin
      .schema("core")
      .from("churches")
      .select("id, country")
      .eq("id", payload.church_id)
      .maybeSingle();

    if (churchError) return reply.badRequest(churchError.message);
    if (!church) return reply.badRequest("Church not found");

    // country_assigned: verify the selected church belongs to their country
    if (caller.role === "country_assigned" && church.country !== caller.assigned_country) {
      return reply.forbidden("La iglesia seleccionada no pertenece a tu país asignado");
    }

    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.patch("/:id", async (request, reply) => {
    const caller = request.callerProfile;
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);

    // Fetch existing pastor to check its country
    const { data: existing, error: fetchError } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .select("country, church_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return reply.notFound("Pastor no encontrado");
    if (!assertCanEdit(caller, existing.country, reply)) return;

    const payload = createPastorSchema.partial().parse(request.body);

    // If changing church, verify new church belongs to caller's country
    if (payload.church_id && caller.role === "country_assigned") {
      const { data: newChurch } = await app.supabaseAdmin
        .schema("core")
        .from("churches")
        .select("country")
        .eq("id", payload.church_id)
        .maybeSingle();

      if (!newChurch || newChurch.country !== caller.assigned_country) {
        return reply.forbidden("La iglesia seleccionada no pertenece a tu país asignado");
      }
    }

    // Prevent country_assigned from changing the country field
    if (caller.role === "country_assigned") {
      (payload as any).country = caller.assigned_country;
    }

    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
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

    // Fetch existing pastor to check its country
    const { data: existing, error: fetchError } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .select("country")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return reply.notFound("Pastor no encontrado");
    if (!assertCanEdit(caller, existing.country, reply)) return;

    await app.supabaseAdmin.schema("events").from("attendance_records").delete().eq("pastor_id", id);
    await app.supabaseAdmin.schema("credentials").from("credentials").delete().eq("pastor_id", id);

    const { error } = await app.supabaseAdmin.schema("core").from("pastors").delete().eq("id", id);
    if (error) return reply.badRequest(error.message);
    return reply.code(204).send();
  });
};
