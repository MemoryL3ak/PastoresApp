import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  status: z.enum(["planned", "active", "completed", "cancelled"]).default("planned")
});

const createSessionSchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  label: z.string().min(2)
});

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (_request, reply) => {
    const { data, error } = await app.supabaseAdmin
      .from("events")
      .select("id, title, starts_at, ends_at, status")
      .order("starts_at", { ascending: false });

    if (error) return reply.badRequest(error.message);
    return data;
  });

  app.post("/", async (request, reply) => {
    const payload = createEventSchema.parse(request.body);
    const { data, error } = await app.supabaseAdmin.from("events").insert(payload).select("*").single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.post("/:eventId/sessions", async (request, reply) => {
    const params = z.object({ eventId: z.string().uuid() }).parse(request.params);
    const payload = createSessionSchema.parse(request.body);

    const { data, error } = await app.supabaseAdmin
      .from("event_sessions")
      .insert({ ...payload, event_id: params.eventId })
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });
};
