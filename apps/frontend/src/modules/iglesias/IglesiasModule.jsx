"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useChurches, invalidateChurches } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";
import { IEP_COUNTRIES, COUNTRIES, getRegions, getCommunes } from "@/lib/geography";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";

const emptyForm  = { name: "", country: "", region: "", commune: "", address: "", phone: "", zone: "" };
const PAGE_SIZE  = 50;

function useDebounce(value, delay = 400) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

export default function IglesiasModule() {
  const { canEdit } = useAuth();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const debouncedSearch               = useDebounce(search);
  const [form, setForm]               = useState(emptyForm);
  const [editingId, setEditingId]     = useState(null);
  const [mutateError, setMutateError] = useState("");
  const [toDelete, setToDelete]       = useState(null);
  const { toast } = useToast();

  const { churches, total, isLoading, error: loadError } = useChurches({ page, limit: PAGE_SIZE, search: debouncedSearch });

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const error = mutateError || loadError;

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") { next.region = ""; next.commune = ""; }
      if (key === "region")  { next.commune = ""; }
      return next;
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) { await api.updateChurch(editingId, form); }
      else           { await api.createChurch(form); }
      const msg = editingId ? "Iglesia actualizada correctamente" : "Iglesia creada correctamente";
      setForm(emptyForm); setEditingId(null);
      invalidateChurches(); setMutateError("");
      toast(msg);
    } catch (err) { setMutateError(err.message || "No se pudo guardar la iglesia"); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteChurch(id); invalidateChurches(); setMutateError(""); toast("Iglesia eliminada"); }
    catch (err) { setMutateError(err.message || "No se pudo eliminar la iglesia"); }
  };

  const startEdit = (church) => {
    setEditingId(church.id);
    setForm({ name: church.name ?? "", country: church.country ?? "", region: church.region ?? "", commune: church.commune ?? "", address: church.address ?? "", phone: church.phone ?? "", zone: church.zone ?? "" });
  };

  const regions    = getRegions(form.country);
  const communes   = getCommunes(form.region);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="view-header">
        <div>
          <h2 className="view-title">Gestión de Iglesias</h2>
          <p className="mt-0.5 text-sm text-slate-500">{total} iglesia{total !== 1 ? "s" : ""} registrada{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
          <input type="text" className="field-input pl-9" placeholder="Buscar iglesia..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {canEdit && (
        <div className="card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-800 mb-5">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            {editingId ? "Editar iglesia" : "Nueva iglesia"}
          </h3>
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="field-label md:col-span-2">
                Nombre de la iglesia
                <input className="field-input" placeholder="Ej: Iglesia Central" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </label>

              <label className="field-label">
                País
                <div className="flex items-center gap-3">
                  <select className="field-input" value={form.country} onChange={(e) => set("country", e.target.value)}>
                    <option value="">Seleccionar país...</option>
                    {IEP_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  {form.country && (
                    <img src={`https://flagcdn.com/w320/${form.country.toLowerCase()}.png`}
                      alt={IEP_COUNTRIES.find((c) => c.code === form.country)?.name}
                      className="w-14 h-10 rounded object-cover ring-1 ring-slate-200 flex-shrink-0" />
                  )}
                </div>
              </label>

              <label className="field-label">
                Región / Estado / Provincia
                <select className="field-input" value={form.region} onChange={(e) => set("region", e.target.value)} disabled={!form.country || regions.length === 0}>
                  <option value="">{!form.country ? "Selecciona un país primero" : regions.length === 0 ? "Sin regiones disponibles" : "Seleccionar región..."}</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              {communes.length > 0 || form.country === "CL" ? (
                <label className="field-label">
                  Comuna
                  <select className="field-input" value={form.commune} onChange={(e) => set("commune", e.target.value)} disabled={!form.region || communes.length === 0}>
                    <option value="">{!form.region ? "Selecciona una región primero" : communes.length === 0 ? "Sin comunas disponibles" : "Seleccionar comuna..."}</option>
                    {communes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              ) : form.country && form.country !== "OTHER" ? (
                <label className="field-label">
                  Ciudad / Municipio
                  <input className="field-input" placeholder="Ej: Bogotá" value={form.commune} onChange={(e) => set("commune", e.target.value)} />
                </label>
              ) : null}

              <label className="field-label">
                Dirección
                <input className="field-input" placeholder="Ej: Av. Providencia 1234" value={form.address} onChange={(e) => set("address", e.target.value)} />
              </label>
              <label className="field-label">
                Teléfono
                <input className="field-input" placeholder="Ej: +56 9 1234 5678" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>

              <label className="field-label">
                Zona
                <input className="field-input" placeholder="Ej: Zona Norte" value={form.zone} onChange={(e) => set("zone", e.target.value)} />
              </label>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
              <button type="submit" className="btn-primary">{editingId ? "Actualizar iglesia" : "Crear iglesia"}</button>
              {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar edición</button>}
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th><th>País</th><th>Región</th><th>Comuna</th><th>Zona</th><th>Teléfono</th>
              {canEdit && <th style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && churches.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[160, 100, 120, 100, 90, 80, 60].map((w, j) => (
                      <td key={j}><div className="h-4 rounded bg-slate-200 animate-pulse" style={{ width: w }} /></td>
                    ))}
                  </tr>
                ))
              : churches.map((church) => {
                  const country = COUNTRIES.find((c) => c.code === church.country);
                  return (
                    <tr key={church.id}>
                      <td className="font-medium text-slate-900">{church.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {church.country && <img src={`https://flagcdn.com/w40/${church.country.toLowerCase()}.png`} alt={country?.name ?? church.country} className="w-7 h-5 rounded-sm object-cover flex-shrink-0" />}
                          <span className="text-slate-500">{country?.name ?? church.country ?? "—"}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{church.region ?? "—"}</td>
                      <td className="text-slate-500">{church.commune ?? "—"}</td>
                      <td className="text-slate-500">{church.zone ?? "—"}</td>
                      <td className="text-slate-500">{church.phone ?? "—"}</td>
                      {canEdit && (
                        <td>
                          <div className="flex items-center gap-3">
                            <button type="button" className="btn-link text-xs" onClick={() => startEdit(church)}>Editar</button>
                            <button type="button" className="btn-link text-xs text-red-500 hover:text-red-700" onClick={() => setToDelete(church)}>Eliminar</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            {!isLoading && churches.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No hay iglesias registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button className="btn-ghost btn-sm p-1.5" onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return <button key={p} onClick={() => setPage(p)} className={`btn-ghost btn-sm w-8 h-8 ${p === page ? "bg-brand-50 text-brand-700 font-semibold" : ""}`}>{p}</button>;
            })}
            <button className="btn-ghost btn-sm p-1.5" onClick={() => setPage(page + 1)} disabled={page === totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar iglesia"
        message={`¿Estás seguro que deseas eliminar "${toDelete?.name}"? Se eliminarán también los pastores asociados. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { handleDelete(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
