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
    // Auto-complete events whose end date has passed
    await app.supabaseAdmin
      .schema("events")
      .from("events")
      .update({ status: "completed" })
      .in("status", ["planned", "active"])
      .lt("ends_at", new Date().toISOString());

    const { data, error } = await app.supabaseAdmin
      .schema("events")
      .from("events")
      .select("id, title, starts_at, ends_at, status")
      .order("starts_at", { ascending: false });

    if (error) return reply.badRequest(error.message);
    return data;
  });

  app.post("/", async (request, reply) => {
    const payload = createEventSchema.parse(request.body);
    const { data, error } = await app.supabaseAdmin
      .schema("events")
      .from("events")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.delete("/:eventId", async (request, reply) => {
    const { eventId } = z.object({ eventId: z.string().min(1) }).parse(request.params);

    // Get sessions then delete attendance records and sessions before the event
    const { data: sessions } = await app.supabaseAdmin.schema("events").from("event_sessions").select("id").eq("event_id", eventId);
    const sessionIds = (sessions ?? []).map((s) => s.id);

    if (sessionIds.length > 0) {
      await app.supabaseAdmin.schema("events").from("attendance_records").delete().in("event_session_id", sessionIds);
      await app.supabaseAdmin.schema("events").from("event_sessions").delete().in("id", sessionIds);
    }

    const { error } = await app.supabaseAdmin.schema("events").from("events").delete().eq("id", eventId);
    if (error) return reply.badRequest(error.message);
    return reply.code(204).send();
  });

  app.patch("/:eventId", async (request, reply) => {
    const params = z.object({ eventId: z.string().min(1) }).parse(request.params);
    const payload = createEventSchema.partial().parse(request.body);

    const { data, error } = await app.supabaseAdmin
      .schema("events")
      .from("events")
      .update(payload)
      .eq("id", params.eventId)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return data;
  });

  app.post("/:eventId/sessions", async (request, reply) => {
    const params = z.object({ eventId: z.string().min(1) }).parse(request.params);
    const payload = createSessionSchema.parse(request.body);

    const { data: event, error: eventError } = await app.supabaseAdmin
      .schema("events")
      .from("events")
      .select("id")
      .eq("id", params.eventId)
      .maybeSingle();

    if (eventError) return reply.badRequest(eventError.message);
    if (!event) return reply.badRequest("Event not found");

    const { data, error } = await app.supabaseAdmin
      .schema("events")
      .from("event_sessions")
      .insert({ ...payload, event_id: params.eventId })
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });

  app.get("/:eventId/sessions", async (request, reply) => {
    const params = z.object({ eventId: z.string().min(1) }).parse(request.params);

    const { data, error } = await app.supabaseAdmin
      .schema("events")
      .from("event_sessions")
      .select("id, event_id, label, starts_at, ends_at")
      .eq("event_id", params.eventId)
      .order("starts_at", { ascending: true });

    if (error) return reply.badRequest(error.message);
    return data;
  });
};
