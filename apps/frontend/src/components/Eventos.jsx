import { useState } from "react";
import { Plus, Pencil, Calendar, X } from "lucide-react";
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

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = { title: "", starts_at: "", ends_at: "", status: "planned" };

export default function Eventos() {
  const { events, isLoading, error: loadError } = useEvents();
  const [mutateError, setMutateError]           = useState("");
  const [isFormOpen, setIsFormOpen]             = useState(false);
  const [editingId, setEditingId]               = useState(null);
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [toDelete, setToDelete]                 = useState(null);
  const { canEdit } = useAuth();
  const { toast }   = useToast();

  const error = mutateError || loadError;

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
      if (editingId) { await api.updateEvent(editingId, payload); }
      else           { await api.createEvent(payload); }
      const msg = editingId ? "Evento actualizado correctamente" : "Evento creado correctamente";
      invalidateEvents();
      handleCancel();
      setMutateError("");
      toast(msg);
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
              {canEdit && <th style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && events.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[200, 80, 80, 80, 60].map((w, j) => (
                      <td key={j}><div className="h-4 rounded bg-slate-200 animate-pulse" style={{ width: w }} /></td>
                    ))}
                  </tr>
                ))
              : events.map((ev) => (
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
                    {canEdit && (
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn-ghost btn-sm gap-1" type="button" onClick={() => openEditForm(ev)}><Pencil size={13} />Editar</button>
                          <button className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50" type="button" onClick={() => setToDelete(ev)}>Eliminar</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            {!isLoading && events.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No hay eventos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar evento"
        message={`¿Estás seguro que deseas eliminar "${toDelete?.title}"? Se eliminarán también todas sus sesiones y registros de asistencia. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { handleDelete(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
