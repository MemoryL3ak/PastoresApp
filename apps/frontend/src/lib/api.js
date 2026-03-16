const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  getDashboardSummary: () => apiFetch("/dashboard/summary"),

  listChurches: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/churches${qs ? "?" + qs : ""}`);
  },
  listAllChurches: () => apiFetch("/churches?all=true"),
  createChurch: (payload) =>
    apiFetch("/churches", { method: "POST", body: JSON.stringify(payload) }),
  updateChurch: (id, payload) =>
    apiFetch(`/churches/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteChurch: (id) =>
    apiFetch(`/churches/${id}`, { method: "DELETE" }),

  listUsers: () => apiFetch("/users"),
  createUser: (payload) =>
    apiFetch("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) =>
    apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  listPastors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/pastors${qs ? "?" + qs : ""}`);
  },
  listAllPastors: () => apiFetch("/pastors?limit=5000").then((r) => r.data ?? r),
  createPastor: (payload) =>
    apiFetch("/pastors", { method: "POST", body: JSON.stringify(payload) }),
  updatePastor: (id, payload) =>
    apiFetch(`/pastors/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deletePastor: (id) =>
    apiFetch(`/pastors/${id}`, { method: "DELETE" }),

  listEvents: () => apiFetch("/events"),
  createEvent: (payload) =>
    apiFetch("/events", { method: "POST", body: JSON.stringify(payload) }),
  updateEvent: (id, payload) =>
    apiFetch(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteEvent: (id) =>
    apiFetch(`/events/${id}`, { method: "DELETE" }),
  listEventSessions: (eventId) => apiFetch(`/events/${eventId}/sessions`),

  checkinAttendance: (payload) =>
    apiFetch("/attendance/checkin", { method: "POST", body: JSON.stringify(payload) }),
  listAttendanceBySession: (eventSessionId) =>
    apiFetch(`/attendance?event_session_id=${eventSessionId}`),

  getAttendanceSummaryByEvent: (eventId) =>
    apiFetch(`/reports/attendance-summary?event_id=${eventId}`)
};
