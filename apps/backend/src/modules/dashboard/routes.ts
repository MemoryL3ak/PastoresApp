import { FastifyPluginAsync } from "fastify";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/summary", async (_request, reply) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      pastorsRes,
      churchesRes,
      activeEventsRes,
      upcomingEventsRes,
      todayAttendanceRes,
      latestAttendanceRes
    ] = await Promise.all([
      app.supabaseAdmin.schema("core").from("pastors").select("id", { count: "exact", head: true }),
      app.supabaseAdmin.schema("core").from("churches").select("id", { count: "exact", head: true }),
      app.supabaseAdmin
        .schema("events")
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      app.supabaseAdmin
        .schema("events")
        .from("events")
        .select("id, title, starts_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      app.supabaseAdmin
        .schema("events")
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .gte("checked_in_at", todayStart.toISOString())
        .lte("checked_in_at", todayEnd.toISOString()),
      app.supabaseAdmin
        .schema("events")
        .from("attendance_records")
        .select("id, pastor_id, event_session_id, checked_in_at")
        .order("checked_in_at", { ascending: false })
        .limit(5)
    ]);

    const errors = [
      pastorsRes.error,
      churchesRes.error,
      activeEventsRes.error,
      upcomingEventsRes.error,
      todayAttendanceRes.error,
      latestAttendanceRes.error
    ].filter(Boolean);
    if (errors.length > 0) return reply.badRequest(errors[0]?.message ?? "Dashboard query failed");

    const latestAttendance = latestAttendanceRes.data ?? [];
    if (latestAttendance.length === 0) {
      return {
        counts: {
          pastors: pastorsRes.count ?? 0,
          churches: churchesRes.count ?? 0,
          attendance_today: todayAttendanceRes.count ?? 0,
          active_events: activeEventsRes.count ?? 0
        },
        upcoming_events: upcomingEventsRes.data ?? [],
        latest_attendance: []
      };
    }

    const pastorIds = [...new Set(latestAttendance.map((item) => item.pastor_id))];
    const sessionIds = [...new Set(latestAttendance.map((item) => item.event_session_id))];

    const [pastorsDataRes, sessionsDataRes] = await Promise.all([
      app.supabaseAdmin.schema("core").from("pastors").select("id, full_name").in("id", pastorIds),
      app.supabaseAdmin
        .schema("events")
        .from("event_sessions")
        .select("id, label, event_id")
        .in("id", sessionIds)
    ]);

    if (pastorsDataRes.error) return reply.badRequest(pastorsDataRes.error.message);
    if (sessionsDataRes.error) return reply.badRequest(sessionsDataRes.error.message);

    const eventIds = [...new Set((sessionsDataRes.data ?? []).map((session) => session.event_id))];
    const eventsRes = await app.supabaseAdmin
      .schema("events")
      .from("events")
      .select("id, title")
      .in("id", eventIds);
    if (eventsRes.error) return reply.badRequest(eventsRes.error.message);

    const pastorById = new Map((pastorsDataRes.data ?? []).map((item) => [item.id, item]));
    const sessionById = new Map((sessionsDataRes.data ?? []).map((item) => [item.id, item]));
    const eventById = new Map((eventsRes.data ?? []).map((item) => [item.id, item]));

    return {
      counts: {
        pastors: pastorsRes.count ?? 0,
        churches: churchesRes.count ?? 0,
        attendance_today: todayAttendanceRes.count ?? 0,
        active_events: activeEventsRes.count ?? 0
      },
      upcoming_events: upcomingEventsRes.data ?? [],
      latest_attendance: latestAttendance.map((item) => {
        const session = sessionById.get(item.event_session_id);
        const eventTitle = eventById.get(session?.event_id ?? "")?.title;

        return {
          id: item.id,
          checked_in_at: item.checked_in_at,
          pastor_name: pastorById.get(item.pastor_id)?.full_name ?? "N/A",
          session_label: session?.label ?? "N/A",
          event_title: eventTitle ?? "N/A"
        };
      })
    };
  });
};
