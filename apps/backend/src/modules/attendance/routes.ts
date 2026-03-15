import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const markAttendanceSchema = z.object({
  event_session_id: z.string().uuid(),
  pastor_id: z.string().uuid(),
  checkin_method: z.enum(["manual", "qr", "barcode"]).default("manual")
});

export const attendanceRoutes: FastifyPluginAsync = async (app) => {
  app.post("/checkin", async (request, reply) => {
    const payload = markAttendanceSchema.parse(request.body);

    const { data, error } = await app.supabaseAdmin
      .from("attendance_records")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });
};
