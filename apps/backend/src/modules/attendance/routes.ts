import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const markAttendanceSchema = z.object({
  event_session_id: z.string().min(1),
  pastor_id: z.string().min(1),
  checkin_method: z.enum(["manual", "qr", "barcode"]).default("manual")
});

export const attendanceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const query = z.object({ event_session_id: z.string().min(1) }).parse(request.query);

    const { data: records, error } = await app.supabaseAdmin
      .schema("events")
      .from("attendance_records")
      .select("id, checked_in_at, checkin_method, pastor_id")
      .eq("event_session_id", query.event_session_id)
      .order("checked_in_at", { ascending: false });

    if (error) return reply.badRequest(error.message);
    if (!records || records.length === 0) return [];

    const pastorIds = [...new Set(records.map((r) => r.pastor_id))];
    const { data: pastors, error: pastorsError } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .select("id, full_name, churches(name)")
      .in("id", pastorIds);

    if (pastorsError) return reply.badRequest(pastorsError.message);

    const pastorsById = new Map((pastors ?? []).map((pastor) => [pastor.id, pastor]));
    return records.map((record) => ({
      id: record.id,
      checked_in_at: record.checked_in_at,
      checkin_method: record.checkin_method,
      pastors: pastorsById.get(record.pastor_id) ?? null
    }));
  });

  app.post("/checkin", async (request, reply) => {
    const payload = markAttendanceSchema.parse(request.body);

    const { data: pastor, error: pastorError } = await app.supabaseAdmin
      .schema("core")
      .from("pastors")
      .select("id")
      .eq("id", payload.pastor_id)
      .maybeSingle();
    if (pastorError) return reply.badRequest(pastorError.message);
    if (!pastor) return reply.badRequest("Pastor not found");

    const { data: session, error: sessionError } = await app.supabaseAdmin
      .schema("events")
      .from("event_sessions")
      .select("id")
      .eq("id", payload.event_session_id)
      .maybeSingle();
    if (sessionError) return reply.badRequest(sessionError.message);
    if (!session) return reply.badRequest("Session not found");

    const { data, error } = await app.supabaseAdmin
      .schema("events")
      .from("attendance_records")
      .insert(payload)
      .select("*")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send(data);
  });
};
