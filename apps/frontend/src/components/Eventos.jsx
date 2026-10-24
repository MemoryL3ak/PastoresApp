import { useEffect, useState } from "react";
import { Plus, Pencil, Calendar, X, Clock, ChevronDown, ChevronUp, Trash2, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useEvents, invalidateEvents } from "../lib/hooks";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";
import DatePicker from "./DatePicker";
import { useAuth } from "../context/AuthContext";

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

/* ── Sessions ("jornadas") ─────────────────────────────────────────── */
const SESSION_PRESETS = {
  AM: { label: "Jornada AM", start: "09:00", end: "13:00" },
  PM: { label: "Jornada PM", start: "15:00", end: "19:00" },
};
const pad2 = (n) => String(n).padStart(2, "0");

// Session times are entered and shown in local time; the API stores them in UTC
const localToIso = (date, time) => new Date(`${date}T${time}:00`).toISOString();
function toLocalDateInput(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toTimeInput(value) {
  const d = new Date(value);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatTime(value) {
  return new Date(value).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function formatSessionDate(value) {
  return new Date(value).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

/** Calendar days (YYYY-MM-DD) covered by the event, capped to avoid runaway ranges. */
function eventDays(event) {
  const days = [];
  const start = new Date(event.starts_at), end = new Date(event.ends_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return days;
  for (let t = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); t <= end.getTime() && days.length < 60; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

function emptySessionForm(event) {
  const days = eventDays(event);
  return { label: SESSION_PRESETS.AM.label, date: days[0] ?? toDateInput(event.starts_at), start: SESSION_PRESETS.AM.start, end: SESSION_PRESETS.AM.end };
}

function SessionsPanel({ event, canEdit, toast, onChanged }) {
  const [sessions, setSessions] = useState(null); // null = loading
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [form, setForm]         = useState(() => emptySessionForm(event));
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [genPlan, setGenPlan]   = useState(null); // { toCreate: [...] }

  const load = async () => {
    try { setSessions(await api.listEventSessions(event.id)); setError(""); }
    catch (err) { setError(err.message || "No se pudieron cargar las jornadas"); setSessions([]); }
  };
  useEffect(() => { load(); }, [event.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changed = async (message) => { await load(); onChanged(); if (message) toast(message); };

  const applyPreset = (key) => {
    const p = SESSION_PRESETS[key];
    setForm((f) => ({ ...f, label: p.label, start: p.start, end: p.end }));
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({ label: s.label, date: toLocalDateInput(s.starts_at), start: toTimeInput(s.starts_at), end: toTimeInput(s.ends_at) });
  };
  const cancelEdit = () => { setEditingId(null); setForm(emptySessionForm(event)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.date || !form.start || !form.end) return;
    if (form.end <= form.start) { setError("La hora de término debe ser posterior a la de inicio."); return; }
    const payload = { label: form.label.trim(), starts_at: localToIso(form.date, form.start), ends_at: localToIso(form.date, form.end) };
    setBusy(true);
    try {
      if (editingId) await api.updateEventSession(event.id, editingId, payload);
      else           await api.createEventSession(event.id, payload);
      await changed(editingId ? "Jornada actualizada" : "Jornada creada");
      cancelEdit();
    } catch (err) { setError(err.message || "No se pudo guardar la jornada"); }
    finally { setBusy(false); }
  };

  const handleDelete = async (s) => {
    setBusy(true);
    try { await api.deleteEventSession(event.id, s.id); await changed("Jornada eliminada"); }
    catch (err) { setError(err.message || "No se pudo eliminar la jornada"); }
    finally { setBusy(false); }
  };

  // AM + PM for every day of the event, skipping the ones that already exist
  const planGenerate = () => {
    const existing = new Set((sessions ?? []).map((s) => `${toLocalDateInput(s.starts_at)}|${s.label}`));
    const toCreate = [];
    for (const day of eventDays(event)) {
      for (const p of Object.values(SESSION_PRESETS)) {
        if (!existing.has(`${day}|${p.label}`)) toCreate.push({ label: p.label, starts_at: localToIso(day, p.start), ends_at: localToIso(day, p.end) });
      }
    }
    if (toCreate.length === 0) { toast("Todos los días ya tienen sus jornadas AM y PM"); return; }
    setGenPlan({ toCreate });
  };
  const runGenerate = async () => {
    const plan = genPlan; setGenPlan(null); setBusy(true);
    try {
      for (const s of plan.toCreate) await api.createEventSession(event.id, s);
      await changed(`${plan.toCreate.length} jornada${plan.toCreate.length !== 1 ? "s" : ""} creada${plan.toCreate.length !== 1 ? "s" : ""}`);
    } catch (err) { setError(err.message || "No se pudieron crear las jornadas"); await load(); }
    finally { setBusy(false); }
  };

  const days = eventDays(event);

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Clock size={15} className="text-brand-500" /> Jornadas de {event.title}
        </h4>
        {canEdit && (
          <button type="button" className="btn-secondary btn-sm gap-1.5" onClick={planGenerate} disabled={busy || sessions === null}>
            <Sparkles size={13} /> Generar AM y PM para cada día ({days.length} día{days.length !== 1 ? "s" : ""})
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {sessions === null ? (
        <div className="h-10 rounded-lg bg-slate-200/70 animate-pulse" />
      ) : sessions.length === 0 ? (
        <p className="text-sm text-slate-500">
          Este evento no tiene jornadas todavía. Sin jornadas no se puede registrar asistencia.
          {canEdit && " Crea una abajo o genera las de todos los días."}
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
          {sessions.map((s) => (
            <div key={s.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm ${editingId === s.id ? "bg-brand-50" : ""}`}>
              <span className="font-medium text-slate-900 min-w-[120px]">{s.label}</span>
              <span className="text-slate-500 capitalize">{formatSessionDate(s.starts_at)}</span>
              <span className="text-slate-500 tabular-nums">{formatTime(s.starts_at)} – {formatTime(s.ends_at)}</span>
              {canEdit && (
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" className="btn-ghost btn-sm gap-1" onClick={() => startEdit(s)} disabled={busy}><Pencil size={12} />Editar</button>
                  <button type="button" className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setToDelete(s)} disabled={busy}><Trash2 size={12} /></button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white px-3 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{editingId ? "Editar jornada" : "Nueva jornada"}</span>
            <span className="text-xs text-slate-400">Atajos:</span>
            {Object.keys(SESSION_PRESETS).map((key) => (
              <button key={key} type="button" className="badge-info hover:bg-brand-100 cursor-pointer" onClick={() => applyPreset(key)}>
                {key} · {SESSION_PRESETS[key].start}–{SESSION_PRESETS[key].end}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <label className="field-label md:col-span-2">
              Nombre
              <input type="text" className="field-input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ej: Jornada AM" required />
            </label>
            <div className="field-label">
              Fecha
              <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="Fecha..." />
            </div>
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
            {editingId && <button type="button" className="btn-secondary btn-sm" onClick={cancelEdit} disabled={busy}>Cancelar</button>}
            <button type="submit" className="btn-primary btn-sm gap-1" disabled={busy}>
              <Plus size={13} /> {editingId ? "Guardar cambios" : "Agregar jornada"}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar jornada"
        message={`¿Eliminar "${toDelete?.label}" del ${toDelete ? formatSessionDate(toDelete.starts_at) : ""}? Se borrará también la asistencia registrada en esa jornada.`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { const s = toDelete; setToDelete(null); handleDelete(s); }}
      />
      <ConfirmDialog
        open={Boolean(genPlan)}
        title="Generar jornadas"
        message={`Se crearán ${genPlan?.toCreate.length ?? 0} jornadas (AM 09:00–13:00 y PM 15:00–19:00) para los días del evento que aún no las tienen. Después puedes editar sus horarios.`}
        confirmLabel="Crear jornadas"
        danger={false}
        onCancel={() => setGenPlan(null)}
        onConfirm={runGenerate}
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
      else           { created = await api.createEvent(payload); }
      const msg = editingId ? "Evento actualizado correctamente" : "Evento creado. Ahora agrega sus jornadas.";
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
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancelar</button>
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
                  const count = ev.sessions_count ?? 0;
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
                          aria-expanded={expanded} title={count === 0 ? "Sin jornadas: no se puede registrar asistencia" : undefined}>
                          <Clock size={13} />
                          <span className={count === 0 ? "badge-danger" : "badge-info"}>{count}</span>
                          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                      {canEdit && (
                        <td>
                          <div className="flex items-center gap-2">
                            <button className="btn-ghost btn-sm gap-1" type="button" onClick={() => openEditForm(ev)}><Pencil size={13} />Editar</button>
                            <button className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50" type="button" onClick={() => setToDelete(ev)}>Eliminar</button>
                          </div>
                        </td>
                      )}
                    </tr>,
                    expanded && (
                      <tr key={`${ev.id}-sessions`}>
                        <td colSpan={columns} className="!py-3">
                          <SessionsPanel event={ev} canEdit={canEdit} toast={toast} onChanged={invalidateEvents} />
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
        title="Eliminar evento"
        message={`¿Estás seguro que deseas eliminar "${toDelete?.title}"? Se eliminarán también todas sus jornadas y registros de asistencia. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { handleDelete(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
