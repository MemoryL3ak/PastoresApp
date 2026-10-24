/**
 * Jornadas (AM, PM…) of an event.
 *
 * A jornada is defined once per event and applies to every day. In the database each
 * jornada is stored as one event_sessions row per day (same label, that day's times),
 * which lets the same pastor check in to "Jornada AM" on several days. These helpers
 * turn those rows back into jornadas and find/create the row for a given day.
 */
const pad2 = (n) => String(n).padStart(2, "0");

/** Local calendar date (YYYY-MM-DD) of a timestamp. */
export function localDateKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export const todayKey = () => localDateKey(Date.now());

/** Local time (HH:MM) of a timestamp. */
export function localTime(value) {
  const d = new Date(value);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Local date + local time → ISO timestamp (UTC). */
export const localToIso = (dateKey, time) => new Date(`${dateKey}T${time}:00`).toISOString();

/** "sáb 24 oct" */
export function formatDayKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

/** Calendar days (YYYY-MM-DD) of an event. Event dates are stored at UTC midnight / end of day. */
export function eventDays(event) {
  const days = [];
  const start = new Date(event?.starts_at), end = new Date(event?.ends_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return days;
  for (let t = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); t <= end.getTime() && days.length < 120; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Groups an event's session rows into jornadas, ordered by time of day.
 * Times come from the earliest row of each jornada.
 */
export function groupJornadas(sessions) {
  const byLabel = new Map();
  const sorted = [...(sessions ?? [])].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  for (const s of sorted) {
    const label = s.label.trim();
    let j = byLabel.get(label);
    if (!j) {
      j = { label, start: localTime(s.starts_at), end: localTime(s.ends_at), sessions: [] };
      byLabel.set(label, j);
    }
    j.sessions.push(s);
  }
  return [...byLabel.values()].sort((a, b) => a.start.localeCompare(b.start) || a.label.localeCompare(b.label));
}

/** The jornada's row for a given day, or null. */
export function sessionForDay(jornada, dateKey) {
  return jornada?.sessions.find((s) => localDateKey(s.starts_at) === dateKey) ?? null;
}

/** Rows to create so the jornada exists on every given day. */
export function missingDayRows(label, start, end, days, existingSessions = []) {
  const have = new Set(existingSessions.map((s) => localDateKey(s.starts_at)));
  return days
    .filter((d) => !have.has(d))
    .map((d) => ({ label, starts_at: localToIso(d, start), ends_at: localToIso(d, end) }));
}

export const DEFAULT_JORNADAS = [
  { label: "Jornada AM", start: "09:00", end: "13:00" },
  { label: "Jornada PM", start: "15:00", end: "19:00" },
];
