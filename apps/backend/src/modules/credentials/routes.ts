import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const issueCredentialSchema = z.object({
  pastor_id: z.string().min(1),
  template_id: z.string().min(1),
  qr_payload: z.string().min(8)
});

export const credentialRoutes: FastifyPluginAsync = async (app) => {
  app.post("/issue", async (request, reply) => {
    const payload = issueCredentialSchema.parse(request.body);

    const { data: pastor, error: pastorError } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .select("id")
      .eq("id", payload.pastor_id)
      .maybeSingle();
    if (pastorError) return reply.badRequest(pastorError.message);
    if (!pastor) return reply.badRequest("Pastor not found");

    const { data: template, error: templateError } = await app.supabaseAdmin
      .schema("credentials")
      .from("credential_templates")
      .select("id")
      .eq("id", payload.template_id)
      .maybeSingle();
    if (templateError) return reply.badRequest(templateError.message);
    if (!template) return reply.badRequest("Template not found");

    const { data, error } = await app.supabaseAdmin
      .schema("credentials")
      .from("credentials")
      .insert({
        pastor_id: payload.pastor_id,
        template_id: payload.template_id,
        qr_payload: payload.qr_payload,
        status: "active"
      })
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.get("/", async (request, reply) => {
    const query = z.object({ pastor_id: z.string().min(1).optional() }).parse(request.query);

    let dbQuery = app.supabaseAdmin
      .schema("credentials")
      .from("credentials")
      .select("id, pastor_id, template_id, status, issued_at, expires_at")
      .order("issued_at", { ascending: false });

    if (query.pastor_id) dbQuery = dbQuery.eq("pastor_id", query.pastor_id);

    const { data, error } = await dbQuery;
    if (error) return reply.badRequest(error.message);
    return data;
  });
};
