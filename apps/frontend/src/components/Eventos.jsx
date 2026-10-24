import { useEffect, useState } from "react";
import { Plus, Pencil, Calendar, X, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useEvents, invalidateEvents } from "../lib/hooks";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";
import DatePicker from "./DatePicker";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_JORNADAS, eventDays, groupJornadas, localDateKey, localToIso, missingDayRows } from "../lib/jornadas";

const ESTADOS = ["planned", "active", "completed", "cancelled"];

const STATUS_BADGE = {
  planned:   "badge-info",
  active:    "badge-success",
  completed: "badge-muted",
  cancelled: "badge-danger",
};

const STATUS_LABEL = {
  planned:   "Planificado",
  active:    "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

// Event dates are stored at UTC midnight / end of day, so the calendar date is the UTC date
function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  // Formatted in UTC so the chosen calendar date shows as picked, regardless of the viewer's timezone
  return new Date(value).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const EMPTY_FORM = { title: "", starts_at: "", ends_at: "", status: "planned" };

/* ── Jornadas ──────────────────────────────────────────────────────────
   A jornada is defined once and applies to every day of the event (stored as one
   session row per day, see lib/jornadas). Attendance carries the date it was marked. */
const EMPTY_JORNADA = { label: "", start: "", end: "" };

/** Creates the default AM/PM jornadas on every day of the event. */
export async function createDefaultJornadas(event) {
  const days = eventDays(event);
  const rows = DEFAULT_JORNADAS.flatMap((j) => missingDayRows(j.label, j.start, j.end, days));
  await Promise.all(rows.map((r) => api.createEventSession(event.id, r)));
  return rows.length;
}

function JornadasPanel({ event, canEdit, toast, onChanged }) {
  const [sessions, setSessions]   = useState(null); // null = loading
  const [error, setError]         = useState("");
  const [busy, setBusy]           = useState(false);
  const [form, setForm]           = useState(EMPTY_JORNADA);
  const [editingLabel, setEditingLabel] = useState(null); // null = adding
  const [toDelete, setToDelete]   = useState(null);

  const load = async () => {
    try { setSessions(await api.listEventSessions(event.id)); setError(""); }
    catch (err) { setError(err.message || "No se pudieron cargar las jornadas"); setSessions([]); }
  };
  useEffect(() => { load(); }, [event.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const jornadas = groupJornadas(sessions ?? []);
  const days = eventDays(event);
  const changed = async (message) => { await load(); onChanged(); if (message) toast(message); };

  const startAdd = (preset) => { setEditingLabel(null); setForm(preset ? { ...preset } : EMPTY_JORNADA); setError(""); };
  const startEdit = (j) => { setEditingLabel(j.label); setForm({ label: j.label, start: j.start, end: j.end }); setError(""); };
  const cancelForm = () => { setEditingLabel(null); setForm(EMPTY_JORNADA); };
  const formOpen = editingLabel !== null || form.label || form.start || form.end;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const label = form.label.trim();
    if (!label || !form.start || !form.end) return;
    if (form.end <= form.start) { setError("La hora de término debe ser posterior a la de inicio."); return; }
    if (jornadas.some((j) => j.label.toLowerCase() === label.toLowerCase() && j.label !== editingLabel)) {
      setError(`Ya existe una jornada llamada "${label}".`); return;
    }
    setBusy(true);
    try {
      const current = jornadas.find((j) => j.label === editingLabel);
      // Same name and hours on every existing day, then add the days that are missing
      await Promise.all((current?.sessions ?? []).map((sRow) => {
        const day = localDateKey(sRow.starts_at);
        return api.updateEventSession(event.id, sRow.id, { label, starts_at: localToIso(day, form.start), ends_at: localToIso(day, form.end) });
      }));
      await Promise.all(missingDayRows(label, form.start, form.end, days, current?.sessions).map((r) => api.createEventSession(event.id, r)));
      await changed(current ? "Jornada actualizada" : "Jornada agregada");
      cancelForm();
    } catch (err) { setError(err.message || "No se pudo guardar la jornada"); await load(); }
    finally { setBusy(false); }
  };

  const handleDelete = async (j) => {
    setBusy(true);
    try {
      await Promise.all(j.sessions.map((sRow) => api.deleteEventSession(event.id, sRow.id)));
      await changed("Jornada eliminada");
      if (editingLabel === j.label) cancelForm();
    } catch (err) { setError(err.message || "No se pudo eliminar la jornada"); await load(); }
    finally { setBusy(false); }
  };

  const missingPresets = DEFAULT_JORNADAS.filter((p) => !jornadas.some((j) => j.label.toLowerCase() === p.label.toLowerCase()));

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-4 space-y-4">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Clock size={15} className="text-brand-500" /> Jornadas de {event.title}
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Cada jornada se aplica a todos los días del evento ({days.length} día{days.length !== 1 ? "s" : ""}).
          La asistencia queda registrada con la fecha en que se marca.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {sessions === null ? (
        <div className="h-10 rounded-lg bg-slate-200/70 animate-pulse" />
      ) : jornadas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Este evento no tiene jornadas todavía. Sin jornadas no se puede registrar asistencia.
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
          {jornadas.map((j) => (
            <div key={j.label} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 text-sm ${editingLabel === j.label ? "bg-brand-50" : ""}`}>
              <span className="font-medium text-slate-900 min-w-[120px]">{j.label}</span>
              <span className="text-slate-600 tabular-nums">{j.start} – {j.end}</span>
              <span className="text-xs text-slate-400">todos los días</span>
              {canEdit && (
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" className="btn-ghost btn-sm gap-1" onClick={() => startEdit(j)} disabled={busy}><Pencil size={12} />Editar</button>
                  <button type="button" className="btn-ghost btn-sm gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setToDelete(j)} disabled={busy}><Trash2 size={12} />Eliminar</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && !formOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {missingPresets.map((p) => (
            <button key={p.label} type="button" className="btn-secondary btn-sm gap-1" onClick={() => startAdd(p)} disabled={busy || sessions === null}>
              <Plus size={13} /> {p.label} ({p.start}–{p.end})
            </button>
          ))}
          <button type="button" className="btn-ghost btn-sm gap-1" onClick={() => startAdd({ label: "", start: "09:00", end: "13:00" })} disabled={busy || sessions === null}>
            <Plus size={13} /> Otra jornada
          </button>
        </div>
      )}

      {canEdit && formOpen && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white px-3 py-3 space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{editingLabel ? `Editar ${editingLabel}` : "Nueva jornada"}</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="field-label md:col-span-2">
              Nombre
              <input type="text" className="field-input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ej: Jornada AM" required autoFocus />
            </label>
            <label className="field-label">
              Inicio
              <input type="time" className="field-input" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} required />
            </label>
            <label className="field-label">
              Término
              <input type="time" className="field-input" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} required />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={cancelForm} disabled={busy}>Cancelar</button>
            <button type="submit" className="btn-primary btn-sm" disabled={busy}>{editingLabel ? "Guardar cambios" : "Agregar jornada"}</button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar jornada"
        message={`¿Eliminar "${toDelete?.label}" de todos los días del evento? Se borrará también la asistencia registrada en esa jornada.`}
        confirmLabel="Sí, eliminar jornada"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { const j = toDelete; setToDelete(null); handleDelete(j); }}
      />
    </div>
  );
}

/* ── Events ────────────────────────────────────────────────────────── */
export default function Eventos() {
  const { events, isLoading, error: loadError } = useEvents();
  const [mutateError, setMutateError]           = useState("");
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [editingId, setEditingId]               = useState(null);
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [toDelete, setToDelete]                 = useState(null);
  const [expandedId, setExpandedId]             = useState(null);
  const { canEdit } = useAuth();
  const { toast }   = useToast();

  const error = mutateError || loadError;
  const columns = canEdit ? 6 : 5;

  const openCreateForm = () => { setEditingId(null); setForm(EMPTY_FORM); setIsFormOpen(true); };
  const openEditForm   = (event) => {
    setEditingId(event.id);
    setForm({ title: event.title, starts_at: toDateInput(event.starts_at), ends_at: toDateInput(event.ends_at), status: event.status });
    setIsFormOpen(true);
  };
  const handleCancel = () => { setIsFormOpen(false); setEditingId(null); setForm(EMPTY_FORM); };
  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };

  const handleDelete = async (id) => {
    try { await api.deleteEvent(id); invalidateEvents(); setMutateError(""); toast("Evento eliminado"); }
    catch (err) { setMutateError(err.message || "No se pudo eliminar el evento"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.starts_at || !form.ends_at) return;
    const payload = {
      title: form.title,
      starts_at: new Date(`${form.starts_at}T00:00:00Z`).toISOString(),
      ends_at:   new Date(`${form.ends_at}T23:59:59Z`).toISOString(),
      status: form.status,
    };
    try {
      let created = null;
      if (editingId) { await api.updateEvent(editingId, payload); }
      else {
        created = await api.createEvent(payload);
        // Every day of an event has jornadas: start with AM and PM (editable in the panel)
        try { await createDefaultJornadas(created); }
        catch { /* the event exists; jornadas can still be added from its panel */ }
      }
      const msg = editingId ? "Evento actualizado correctamente" : "Evento creado con Jornada AM y Jornada PM";
      invalidateEvents();
      handleCancel();
      setMutateError("");
      toast(msg);
      if (created?.id) setExpandedId(created.id); // a new event has no sessions yet — open the panel right away
    } catch (err) { setMutateError(err.message || "No se pudo guardar el evento"); }
  };

  return (
    <div className="space-y-5">
      <div className="view-header">
        <div>
          <h2 className="view-title">Eventos</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {events.length} evento{events.length !== 1 ? "s" : ""} registrado{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && !isFormOpen && (
          <button className="btn-primary" onClick={openCreateForm}><Plus size={16} /> Crear evento</button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {canEdit && isFormOpen && (
        <div className="card border-brand-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="flex items-center gap-2 font-semibold text-brand-800">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            {editingId ? "Editar evento" : "Nuevo evento"}
          </h3>
            <button type="button" className="btn-ghost btn-sm p-1.5" onClick={handleCancel}><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="field-label md:col-span-2">
                Nombre del evento
                <input type="text" name="title" className="field-input" value={form.title} onChange={handleChange}
                  placeholder="Ej: Conferencia Nacional 2026" required />
              </label>
              <div className="field-label">
                Fecha de inicio
                <DatePicker value={form.starts_at} onChange={(v) => setForm((p) => ({ ...p, starts_at: v }))} placeholder="Seleccionar fecha de inicio..." />
              </div>
              <div className="field-label">
                Fecha de término
                <DatePicker value={form.ends_at} onChange={(v) => setForm((p) => ({ ...p, ends_at: v }))} placeholder="Seleccionar fecha de término..." />
              </div>
              <label className="field-label">
                Estado
                <select name="status" className="field-input" value={form.status} onChange={handleChange}>
                  {ESTADOS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-100">
              {editingId && (
                <button type="button" className="btn-ghost btn-sm gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 mr-auto"
                  onClick={() => setToDelete(events.find((ev) => ev.id === editingId) ?? null)}>
                  <Trash2 size={13} /> Eliminar evento
                </button>
              )}
              <button type="button" className="btn-secondary ml-auto" onClick={handleCancel}>Cancelar</button>
              <button type="submit" className="btn-primary">{editingId ? "Guardar cambios" : "Crear evento"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Inicio</th>
              <th>Término</th>
              <th>Estado</th>
              <th>Jornadas</th>
              {canEdit && <th style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && events.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[200, 80, 80, 80, 90, 60].slice(0, columns).map((w, j) => (
                      <td key={j}><div className="h-4 rounded bg-slate-200 animate-pulse" style={{ width: w }} /></td>
                    ))}
                  </tr>
                ))
              : events.map((ev) => {
                  const expanded = expandedId === ev.id;
                  const count = ev.jornadas_count ?? ev.sessions_count ?? 0;
                  return [
                    <tr key={ev.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Calendar size={15} className="text-brand-400 flex-shrink-0" />
                          <span className="font-medium text-slate-900">{ev.title}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{formatDate(ev.starts_at)}</td>
                      <td className="text-slate-500">{formatDate(ev.ends_at)}</td>
                      <td><span className={STATUS_BADGE[ev.status] ?? "badge-muted"}>{STATUS_LABEL[ev.status] ?? ev.status}</span></td>
                      <td>
                        <button type="button" className="btn-ghost btn-sm gap-1.5" onClick={() => setExpandedId(expanded ? null : ev.id)}
                          aria-expanded={expanded} title={count === 0 ? "Sin jornadas: no se puede registrar asistencia" : "Ver jornadas"}>
                          <Clock size={13} />
                          <span className={count === 0 ? "badge-danger" : "badge-info"}>{count}</span>
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                      {canEdit && (
                        <td>
                          <button className="btn-ghost btn-sm gap-1" type="button" onClick={() => openEditForm(ev)}><Pencil size={13} />Editar</button>
                        </td>
                      )}
                    </tr>,
                    expanded && (
                      <tr key={`${ev.id}-sessions`}>
                        <td colSpan={columns} className="!py-3">
                          <JornadasPanel event={ev} canEdit={canEdit} toast={toast} onChanged={invalidateEvents} />
                        </td>
                      </tr>
                    ),
                  ];
                })}
            {!isLoading && events.length === 0 && (
              <tr><td colSpan={columns} className="py-12 text-center text-sm text-slate-400">No hay eventos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar el evento completo"
        message={`Vas a eliminar el EVENTO "${toDelete?.title}" entero, con sus ${toDelete?.jornadas_count ?? 0} jornada${(toDelete?.jornadas_count ?? 0) !== 1 ? "s" : ""} y toda la asistencia registrada. Esta acción no se puede deshacer. Si solo quieres borrar una jornada, cancela y usa "Eliminar" dentro del panel Jornadas.`}
        confirmLabel="Sí, eliminar el evento"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { handleDelete(toDelete.id); setToDelete(null); handleCancel(); }}
      />
    </div>
  );
}
