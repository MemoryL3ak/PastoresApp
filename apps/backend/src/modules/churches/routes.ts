import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const churchSchema = z.object({
  name:    z.string().min(2),
  country: z.string().optional(),
  region:  z.string().optional(),
  commune: z.string().optional(),
  address: z.string().optional(),
  phone:   z.string().optional()
});

export const churchRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const query = z.object({
      search: z.string().optional(),
      page:   z.coerce.number().int().min(1).default(1),
      limit:  z.coerce.number().int().min(1).max(100).default(50),
      all:    z.coerce.boolean().default(false),
    }).parse(request.query);

    let dbQuery = app.supabaseAdmin
      .schema("core")
      .from("churches")
      .select("id, code, name, city, address, phone, country, region, commune", { count: "exact" })
      .order("name", { ascending: true });

    if (query.search) dbQuery = dbQuery.ilike("name", `%${query.search}%`);

    // all=true for dropdowns that need the full list (e.g. pastor form)
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
    const payload = churchSchema.parse(request.body);
    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("churches")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);

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

  app.patch("/:id", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = churchSchema.partial().parse(request.body);

    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("churches")
      .update(payload)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return data;
  });
};
