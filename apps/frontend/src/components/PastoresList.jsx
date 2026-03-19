import { ChevronLeft, ChevronRight, Plus, Search, UserCircle2 } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useAuth } from "@/context/AuthContext";

function SkeletonRow() {
  return (
    <tr>
      <td><div className="w-20 h-28 rounded-lg bg-slate-200 animate-pulse" /></td>
      {[120, 80, 100, 60, 80].map((w, i) => (
        <td key={i}><div className={`h-4 rounded bg-slate-200 animate-pulse`} style={{ width: w }} /></td>
      ))}
    </tr>
  );
}

export default function PastoresList({
  loading, pastores, total, page, totalPages, onPageChange,
  searchName, onSearchName,
  searchIglesia, onSearchIglesia,
  searchCountry, onSearchCountry,
  filterEstado, onFilterEstado,
  onEditPastor, onAddPastor, onDeletePastor,
}) {
  const [toDelete, setToDelete] = useState(null);
  const { canEdit } = useAuth();

  return (
    <div className="space-y-5">
      <div className="view-header">
        <div>
          <h2 className="view-title">Pastores</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} pastor{total !== 1 ? "es" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={onAddPastor}>
            <Plus size={16} />
            Agregar pastor
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
          <input type="text" className="field-input pl-9" placeholder="Buscar por nombre..."
            value={searchName} onChange={(e) => onSearchName(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
          <input type="text" className="field-input pl-9" placeholder="Buscar por iglesia..."
            value={searchIglesia} onChange={(e) => onSearchIglesia(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
          <input type="text" className="field-input pl-9" placeholder="Buscar por país..."
            value={searchCountry} onChange={(e) => onSearchCountry(e.target.value)} />
        </div>
        <select className="field-input w-auto min-w-[160px]" value={filterEstado} onChange={(e) => onFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Honorario">Honorario</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Foto</th>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Iglesia</th>
              <th>Estado</th>
              {canEdit && <th style={{ width: 120 }}></th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : pastores.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.nombre}
                      className="w-20 max-h-36 rounded-lg object-contain ring-1 ring-slate-200 bg-slate-50" />
                  ) : (
                    <div className="h-28 w-20 rounded-lg bg-slate-100 flex items-center justify-center">
                      <UserCircle2 size={40} className="text-slate-400" />
                    </div>
                  )}
                </td>
                <td><span className="font-medium text-slate-900">{p.nombre}</span></td>
                <td className="text-slate-500">{p.rut || "—"}</td>
                <td>{p.iglesia || "—"}</td>
                <td>
                  <span className={p.estado === "Activo" ? "badge-success" : p.estado === "Honorario" ? "badge-info" : "badge-muted"}>
                    {p.estado}
                  </span>
                </td>
                {canEdit && (
                  <td>
                    <div className="flex items-center gap-3">
                      <button className="btn-link text-xs" onClick={() => onEditPastor(p)}>Editar</button>
                      <button className="btn-link text-xs text-red-500 hover:text-red-700" onClick={() => setToDelete(p)}>Eliminar</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!loading && pastores.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                  No hay pastores registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button className="btn-ghost btn-sm p-1.5" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => onPageChange(p)}
                  className={`btn-ghost btn-sm w-8 h-8 ${p === page ? "bg-brand-50 text-brand-700 font-semibold" : ""}`}>
                  {p}
                </button>
              );
            })}
            <button className="btn-ghost btn-sm p-1.5" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar pastor"
        message={`¿Estás seguro que deseas eliminar a ${toDelete?.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { onDeletePastor(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}
