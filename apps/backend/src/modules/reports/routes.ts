import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/attendance-summary", async (request, reply) => {
    const query = z.object({ event_id: z.string().uuid() }).parse(request.query);

    const { data, error } = await app.supabaseAdmin.rpc("attendance_summary_by_event", {
      p_event_id: query.event_id
    });

    if (error) return reply.badRequest(error.message);
    return data;
  });
};
