import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/attendance-summary", async (request, reply) => {
    const query = z.object({ event_id: z.string().min(1) }).parse(request.query);

    const { data: event, error: eventError } = await app.supabaseAdmin
      .schema("events")
      .from("events")
      .select("id")
      .eq("id", query.event_id)
      .maybeSingle();

    if (eventError) return reply.badRequest(eventError.message);
    if (!event) return reply.badRequest("Event not found");

    const { data, error } = await app.supabaseAdmin.rpc("attendance_summary_by_event", {
      p_event_id: query.event_id
    });

    if (error) return reply.badRequest(error.message);
    return data;
  });
};
