import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const createPastorSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  document_number: z.string().min(5),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  church_id: z.string().uuid(),
  pastoral_status: z.enum(["active", "inactive", "suspended"]).default("active")
});

export const pastorRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const query = z
      .object({
        church_id: z.string().uuid().optional(),
        search: z.string().min(2).optional()
      })
      .parse(request.query);

    let dbQuery = app.supabaseAdmin
      .from("pastors")
      .select("id, first_name, last_name, document_number, email, phone, pastoral_status, churches(name)")
      .order("created_at", { ascending: false });

    if (query.church_id) dbQuery = dbQuery.eq("church_id", query.church_id);
    if (query.search) dbQuery = dbQuery.ilike("full_name", `%${query.search}%`);

    const { data, error } = await dbQuery;
    if (error) return reply.badRequest(error.message);
    return data;
  });

  app.post("/", async (request, reply) => {
    const payload = createPastorSchema.parse(request.body);
    const { data, error } = await app
      .supabaseAdmin
      .from("pastors")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });
};
