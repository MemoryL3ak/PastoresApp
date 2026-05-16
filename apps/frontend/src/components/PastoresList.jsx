import { ChevronLeft, ChevronRight, Loader2, Plus, Search, UserCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import ExportMenu from "./ExportMenu";
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
  loading, searching, pastores, total, page, totalPages, onPageChange,
  searchName, onSearchName,
  searchIglesia, onSearchIglesia,
  searchCountry, onSearchCountry,
  filterEstado, onFilterEstado,
  onEditPastor, onAddPastor, onDeletePastor,
  onExport, canExport = false,
}) {
  const SearchIcon = ({ active }) =>
    active
      ? <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none animate-spin" />
      : <Search   size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />;
  const [toDelete, setToDelete] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(null); // { url, name, x, y, placement }
  const { canEdit } = useAuth();

  // Close photo zoom on Escape
  useEffect(() => {
    if (!photoZoom) return;
    const onKey = (e) => { if (e.key === "Escape") setPhotoZoom(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photoZoom]);

  function openPhoto(e, pastor) {
    const rect = e.currentTarget.getBoundingClientRect();
    const POPOVER_W = 240;
    const POPOVER_H = 320;
    const GAP = 12;
    // Default: place to the right of the thumbnail
    let x = rect.right + GAP;
    let placement = "right";
    if (x + POPOVER_W > window.innerWidth - 16) {
      // Flip to the left if it would overflow
      x = rect.left - POPOVER_W - GAP;
      placement = "left";
    }
    // Vertically align with the row, clamp to viewport
    let y = rect.top + rect.height / 2 - POPOVER_H / 2;
    if (y < 16) y = 16;
    if (y + POPOVER_H > window.innerHeight - 16) y = window.innerHeight - POPOVER_H - 16;
    setPhotoZoom({ url: pastor.photoUrl, name: pastor.nombre, x, y, placement });
  }

  return (
    <div className="space-y-5">
      <div className="view-header">
        <div>
          <h2 className="view-title">Pastores</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} pastor{total !== 1 ? "es" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onExport && <ExportMenu onExport={onExport} disabled={!canExport} />}
          {canEdit && (
            <button className="btn-primary" onClick={onAddPastor}>
              <Plus size={16} />
              Agregar pastor
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <div className="relative flex-1 min-w-[160px]">
          <SearchIcon active={searching && !!searchName} />
          <input type="text" className="field-input pl-9" placeholder="Buscar por nombre..."
            value={searchName} onChange={(e) => onSearchName(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <SearchIcon active={searching && !!searchIglesia} />
          <input type="text" className="field-input pl-9" placeholder="Buscar por iglesia..."
            value={searchIglesia} onChange={(e) => onSearchIglesia(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <SearchIcon active={searching && !!searchCountry} />
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
                    <button
                      type="button"
                      onClick={(e) => openPhoto(e, p)}
                      className="block group relative focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
                      aria-label={`Ver foto de ${p.nombre}`}
                    >
                      <img src={p.photoUrl} alt={p.nombre}
                        className="w-20 max-h-36 rounded-lg object-contain ring-1 ring-slate-200 bg-slate-50 transition-transform group-hover:scale-[1.03] group-hover:ring-brand-400 cursor-zoom-in" />
                    </button>
                  ) : (
                    <div className="h-28 w-20 rounded-lg bg-slate-100 flex items-center justify-center">
                      <UserCircle2 size={40} className="text-slate-400" />
                    </div>
                  )}
                </td>
                <td>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => onEditPastor(p)}
                      className="font-medium text-slate-900 text-left hover:text-brand-700 hover:underline underline-offset-2 transition-colors"
                    >
                      {p.nombre}
                    </button>
                  ) : (
                    <span className="font-medium text-slate-900">{p.nombre}</span>
                  )}
                </td>
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

      {/* Photo popover anchored to the clicked thumbnail */}
      {photoZoom && (
        <>
          {/* transparent click-trap to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setPhotoZoom(null)} />
          <div
            className="fixed z-50 w-[240px] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden animate-[zoomIn_160ms_ease-out]"
            style={{ left: photoZoom.x, top: photoZoom.y }}
            role="dialog"
            aria-label={photoZoom.name}
          >
            <button
              type="button"
              onClick={() => setPhotoZoom(null)}
              className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-slate-500 hover:text-red-600 rounded-full p-1 shadow-sm ring-1 ring-slate-200 transition-colors"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
            <img
              src={photoZoom.url}
              alt={photoZoom.name}
              className="w-full h-[260px] object-cover bg-slate-50"
            />
            {photoZoom.name && (
              <div className="px-3 py-2 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{photoZoom.name}</p>
              </div>
            )}
          </div>
        </>
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
