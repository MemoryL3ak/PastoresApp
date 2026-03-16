import { useEffect, useState } from "react";
import { BarChart2, Download } from "lucide-react";
import { api } from "../lib/api";

function formatDate(dateIso) {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Reportes() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.listEvents();
        setEvents(data);
        const first = data[0]?.id ?? "";
        setSelectedEventId(first);
      } catch (err) {
        setError(err.message || "No se pudieron cargar eventos");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    (async () => {
      try {
        setRows(await api.getAttendanceSummaryByEvent(selectedEventId));
        setError("");
      } catch (err) {
        setError(err.message || "No se pudo cargar reporte");
      }
    })();
  }, [selectedEventId]);

  const totalAttendees = rows.reduce((sum, r) => sum + (r.attendance_count ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="view-title">Reportería</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Asistencia y métricas por evento
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <BarChart2 size={16} className="text-slate-400 flex-shrink-0" />
            <select
              className="field-input"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">Seleccionar evento...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-secondary" type="button" disabled>
            <Download size={15} />
            Exportar
          </button>
        </div>

        {/* Summary stat */}
        {rows.length > 0 && (
          <div className="flex items-center gap-6 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total asistencias
              </p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums mt-0.5">
                {totalAttendees}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Sesiones
              </p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums mt-0.5">
                {rows.length}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sesión</th>
                <th>Asistentes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.session_id}>
                  <td className="text-slate-500">{formatDate(row.starts_at)}</td>
                  <td className="font-medium text-slate-900">{row.session_label}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 rounded-full bg-brand-200"
                        style={{
                          width: Math.max(4, (row.attendance_count / (Math.max(...rows.map((r) => r.attendance_count)) || 1)) * 80),
                        }}
                      />
                      <span className="font-semibold tabular-nums text-slate-900">
                        {row.attendance_count}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-sm text-slate-400">
                    {selectedEventId
                      ? "Sin datos para el evento seleccionado."
                      : "Selecciona un evento para ver el reporte."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
