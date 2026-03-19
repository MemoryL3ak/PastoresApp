"use client";

// Templates 1 (clásico) & 2 (moderno) are imported but hidden from the selector.
// Only Elite (3) and Elite Azul (4) are exposed.
import IEPCredential from "@/components/IEPCredential";
import IEPCredentialElite from "@/components/IEPCredentialElite";
import IEPCredentialEliteAzul from "@/components/IEPCredentialEliteAzul";
import IEPCredentialModern from "@/components/IEPCredentialModern";
import CredentialEditorCanvas, {
  defaultLayout,
  defaultBackLayout,
  CredentialControlPanel,
} from "@/components/CredentialEditorCanvas";
import RoleGuard from "@/components/RoleGuard";
import { usePastors } from "@/lib/hooks";
import { resolveCountry } from "@/lib/credentialShared";
import { Check, Filter, Pencil, Printer, Search, Settings, Upload, UserCircle2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

/* ── Unused imports kept to avoid tree-shaking warnings ── */
void IEPCredential; void IEPCredentialEliteAzul; void IEPCredentialModern;

/* ── Demo pastor used in the template editor (no real pastor needed) ── */
const DEMO_PASTOR = {
  first_name: "Juan", last_name: "González",
  document_number: "12.345.678-9",
  degree_title: "Pastor",
  churches: { name: "Iglesia Central" },
  country: "cl",
  photo_url: null,
  expiry_date: "2026-12-31",
};

/* ── All templates (1 & 2 kept but not shown in selector) ── */
const TEMPLATES = [
  { id: "clasico",    label: "Clásico",    description: "Header azul con logo centrado",          Component: IEPCredential,       hidden: true },
  { id: "moderno",    label: "Moderno",    description: "Foto a borde, acento lateral azul",      Component: IEPCredentialModern, hidden: true },
  { id: "elite",      label: "Elite",      description: "Fondo blanco, geometría moderna",        Component: IEPCredentialElite },
  { id: "elite-azul", label: "Elite Azul", description: "Tono celeste institucional, card elevada", Component: IEPCredentialEliteAzul },
];

const VISIBLE_TEMPLATES = TEMPLATES.filter((t) => !t.hidden);
const EDITOR_SCALE = 0.72;

/* ── localStorage helpers ── */
function loadLayout(templateId) {
  if (typeof window === "undefined") return defaultLayout(templateId);
  try {
    const stored = localStorage.getItem(`credential_layout_${templateId}`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return defaultLayout(templateId);
}

function loadBackLayout(templateId) {
  if (typeof window === "undefined") return defaultBackLayout(templateId);
  try {
    const stored = localStorage.getItem(`credential_back_layout_${templateId}`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return defaultBackLayout(templateId);
}

/* ── Template selector ── */
function TemplateSelector({ value, onChange }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="text-sm font-semibold text-slate-700 mb-2">Plantilla</div>
      <div className="flex gap-2">
        {VISIBLE_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex-1 text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
              value === t.id
                ? "border-brand-600 bg-brand-50 text-brand-800 font-semibold"
                : "border-slate-200 hover:border-slate-300 text-slate-600"
            }`}
          >
            <div className="font-medium">{t.label}</div>
            <div className="text-xs text-slate-400 mt-0.5 font-normal">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Superintendent config panel ── */
function SuperintendentPanel({ name, onNameChange, signatureUrl, onSignatureChange }) {
  const fileRef = useRef(null);
  const [saved, setSaved] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSignatureChange(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Settings size={15} /> Configuración del Superintendente
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Nombre</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          placeholder="Ej: Aldo Córdova Muñoz"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Firma (imagen)</label>
        <div className="flex items-center gap-2">
          {signatureUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureUrl} alt="firma" className="h-10 w-auto border rounded" />
              <button onClick={() => onSignatureChange(null)} className="text-slate-400 hover:text-red-500">
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800 border border-dashed border-brand-300 rounded-lg px-3 py-2 w-full justify-center"
            >
              <Upload size={14} /> Subir firma
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all ${
          saved
            ? "bg-green-50 border border-green-300 text-green-700"
            : "bg-brand-700 hover:bg-brand-800 text-white"
        }`}
      >
        {saved ? <><Check size={14} /> Guardado</> : "Guardar configuración"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1 — Template editor
═══════════════════════════════════════════════════════════════════ */
function TemplateEditorTab({
  templateId, setTemplateId,
  layout, setLayout,
  backLayout, setBackLayout,
  superintendent, setSuperintendente,
  signatureUrl, setSignatureUrl,
}) {
  const [editFace, setEditFace] = useState("front"); // "front" | "back"
  const [selectedEl, setSelectedEl] = useState(null);

  /* ── Front layout handlers ── */
  function handleFrontUpdate(key, el) {
    setLayout((prev) => {
      const next = { ...prev, [key]: el };
      localStorage.setItem(`credential_layout_${templateId}`, JSON.stringify(next));
      return next;
    });
  }

  /* ── Back layout handlers ── */
  function handleBackUpdate(key, el) {
    setBackLayout((prev) => {
      const next = { ...prev, [key]: el };
      localStorage.setItem(`credential_back_layout_${templateId}`, JSON.stringify(next));
      return next;
    });
  }

  function handleResetElement(key) {
    if (editFace === "front") {
      handleFrontUpdate(key, defaultLayout(templateId)[key]);
    } else {
      handleBackUpdate(key, defaultBackLayout(templateId)[key]);
    }
  }

  function handleResetAll() {
    if (editFace === "front") {
      const def = defaultLayout(templateId);
      setLayout(def);
      localStorage.setItem(`credential_layout_${templateId}`, JSON.stringify(def));
    } else {
      const def = defaultBackLayout(templateId);
      setBackLayout(def);
      localStorage.setItem(`credential_back_layout_${templateId}`, JSON.stringify(def));
    }
    setSelectedEl(null);
  }

  function handleTemplateChange(id) {
    setTemplateId(id);
    setLayout(loadLayout(id));
    setBackLayout(loadBackLayout(id));
    setSelectedEl(null);
  }

  function handleNameChange(val) {
    setSuperintendente(val);
    localStorage.setItem("super_name", val);
  }

  function handleSignatureChange(val) {
    setSignatureUrl(val);
    if (val) localStorage.setItem("super_signature", val);
    else localStorage.removeItem("super_signature");
  }

  const currentLayout = editFace === "front" ? layout : backLayout;
  const currentUpdate = editFace === "front" ? handleFrontUpdate : handleBackUpdate;

  return (
    <div className="flex gap-5 items-start">
      {/* Left sidebar */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <TemplateSelector value={templateId} onChange={handleTemplateChange} />
        <SuperintendentPanel
          name={superintendent}
          onNameChange={handleNameChange}
          signatureUrl={signatureUrl}
          onSignatureChange={handleSignatureChange}
        />

        {/* Face toggle */}
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cara a editar</div>
          <div className="flex gap-2">
            <button
              onClick={() => { setEditFace("front"); setSelectedEl(null); }}
              className={`flex-1 text-sm py-2 rounded-lg border transition-all ${
                editFace === "front"
                  ? "border-brand-600 bg-brand-50 text-brand-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Frente
            </button>
            <button
              onClick={() => { setEditFace("back"); setSelectedEl(null); }}
              className={`flex-1 text-sm py-2 rounded-lg border transition-all ${
                editFace === "back"
                  ? "border-brand-600 bg-brand-50 text-brand-700 font-medium"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Reverso
            </button>
          </div>
        </div>
      </div>

      {/* Right: canvas + control panel */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 mb-3">
          Editor de plantilla — arrastra los elementos para reposicionarlos
        </p>

        <div className="flex gap-4 items-start">
          {/* Canvas */}
          <div className="flex-shrink-0">
            <div
              style={{
                transform: `scale(${EDITOR_SCALE})`,
                transformOrigin: "top left",
                marginBottom: -(CARD_H * (1 - EDITOR_SCALE)),
                marginRight: -(CARD_W * (1 - EDITOR_SCALE)),
              }}
            >
              <CredentialEditorCanvas
                templateId={templateId}
                pastor={DEMO_PASTOR}
                superintendent={superintendent}
                signatureUrl={signatureUrl}
                layout={layout}
                backLayout={backLayout}
                onUpdate={handleFrontUpdate}
                onBackUpdate={handleBackUpdate}
                editMode
                editFace={editFace}
                selected={selectedEl}
                onSelect={setSelectedEl}
                scale={EDITOR_SCALE}
              />
            </div>
          </div>

          {/* Controls panel */}
          <div className="flex-1 min-w-[200px] max-w-xs">
            <CredentialControlPanel
              selected={selectedEl}
              layout={currentLayout}
              onUpdate={currentUpdate}
              onSelect={setSelectedEl}
              onResetElement={handleResetElement}
              onResetAll={handleResetAll}
              face={editFace}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2 — Mass print
═══════════════════════════════════════════════════════════════════ */

/* Pastor row with checkbox */
function PastorCheckRow({ pastor, checked, onToggle }) {
  const name = `${pastor.first_name ?? ""} ${pastor.last_name ?? ""}`.trim();
  const church = pastor.churches?.name || "";
  return (
    <label
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${
        checked ? "bg-brand-50 border border-brand-300" : "hover:bg-slate-50 border border-transparent"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="accent-brand-600 flex-shrink-0"
      />
      {pastor.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pastor.photo_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
      ) : (
        <UserCircle2 size={32} className="text-slate-300 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
        {church && <div className="text-xs text-slate-500 truncate">{church}</div>}
      </div>
    </label>
  );
}

function MassPrintTab({ templateId, layout, backLayout, superintendent, signatureUrl, onPrintPastorsChange }) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterCountry, setFilterCountry] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterChurch, setFilterChurch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { pastors, isLoading } = usePastors({ search, limit: 500 });

  /* ── Filter options derived from loaded data ── */
  const uniqueCountries = useMemo(
    () => [...new Set(pastors.map((p) => p.country).filter(Boolean))].sort(),
    [pastors]
  );
  const uniqueTitles = useMemo(
    () => [...new Set(pastors.map((p) => p.degree_title || p.titulo).filter(Boolean))].sort(),
    [pastors]
  );
  const uniqueChurches = useMemo(
    () => [...new Set(pastors.map((p) => p.churches?.name).filter(Boolean))].sort(),
    [pastors]
  );

  const filteredPastors = useMemo(
    () =>
      pastors.filter((p) => {
        if (filterCountry && p.country !== filterCountry) return false;
        if (filterTitle && (p.degree_title || p.titulo) !== filterTitle) return false;
        if (filterChurch && !p.churches?.name?.toLowerCase().includes(filterChurch.toLowerCase())) return false;
        return true;
      }),
    [pastors, filterCountry, filterTitle, filterChurch]
  );

  const activeFilterCount = [filterCountry, filterTitle, filterChurch].filter(Boolean).length;

  /* ── Fix: call onPrintPastorsChange OUTSIDE the state updater ── */
  function syncPrint(nextIds) {
    onPrintPastorsChange(pastors.filter((p) => nextIds.has(p.id)));
  }

  function toggle(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
    syncPrint(next);
  }

  function toggleAllFiltered() {
    const filteredIds = filteredPastors.map((p) => p.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) filteredIds.forEach((id) => next.delete(id));
    else filteredIds.forEach((id) => next.add(id));
    setSelectedIds(next);
    syncPrint(next);
  }

  function clearFilters() {
    setFilterCountry("");
    setFilterTitle("");
    setFilterChurch("");
  }

  const selectedPastors = pastors.filter((p) => selectedIds.has(p.id));
  const filteredAllSelected =
    filteredPastors.length > 0 && filteredPastors.every((p) => selectedIds.has(p.id));

  function handlePrint() {
    const prev = document.title;
    document.title = "Credenciales IEP";
    window.print();
    document.title = prev;
  }

  return (
    <div className="flex gap-5 items-start">
      {/* ── Left: pastor list with filters ── */}
      <div className="w-96 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        {/* Search + filter toggle */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all ${
                filtersOpen || activeFilterCount > 0
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              <Filter size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable filter panel */}
          {filtersOpen && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                {/* Country filter */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">País</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="">Todos</option>
                    {uniqueCountries.map((c) => {
                      const { name } = resolveCountry(c);
                      return <option key={c} value={c}>{name || c}</option>;
                    })}
                  </select>
                </div>

                {/* Title filter */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">Grado</label>
                  <select
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="">Todos</option>
                    {uniqueTitles.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Church filter — text input with datalist suggestions */}
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1 font-medium">Iglesia</label>
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      list="church-suggestions"
                      value={filterChurch}
                      onChange={(e) => setFilterChurch(e.target.value)}
                      placeholder="Escribir nombre de iglesia..."
                      className="w-full border border-slate-300 bg-white rounded-lg pl-6 pr-6 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                    {filterChurch && (
                      <button
                        onClick={() => setFilterChurch("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <datalist id="church-suggestions">
                    {uniqueChurches.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  <X size={11} /> Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {!filtersOpen && activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filterCountry && (
                <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-2 py-0.5 rounded-full">
                  {resolveCountry(filterCountry).name || filterCountry}
                  <button onClick={() => setFilterCountry("")} className="hover:text-brand-900"><X size={10} /></button>
                </span>
              )}
              {filterTitle && (
                <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-2 py-0.5 rounded-full">
                  {filterTitle}
                  <button onClick={() => setFilterTitle("")} className="hover:text-brand-900"><X size={10} /></button>
                </span>
              )}
              {filterChurch && (
                <span className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs px-2 py-0.5 rounded-full">
                  {filterChurch}
                  <button onClick={() => setFilterChurch("")} className="hover:text-brand-900"><X size={10} /></button>
                </span>
              )}
            </div>
          )}

          {/* Select all + count */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              onClick={toggleAllFiltered}
              disabled={filteredPastors.length === 0}
              className="text-xs text-brand-700 hover:text-brand-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {filteredAllSelected ? "Deseleccionar visibles" : "Seleccionar visibles"}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {activeFilterCount > 0 && (
                <span className="text-slate-400">{filteredPastors.length} visible{filteredPastors.length !== 1 ? "s" : ""} ·</span>
              )}
              <span className={selectedIds.size > 0 ? "text-brand-700 font-semibold" : ""}>
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Pastor rows */}
        <div className="p-2 max-h-[520px] overflow-y-auto space-y-0.5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))
          ) : filteredPastors.length === 0 ? (
            <div className="text-center py-8 space-y-1">
              <p className="text-sm text-slate-400">Sin resultados</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-brand-600 hover:text-brand-800">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            filteredPastors.map((p) => (
              <PastorCheckRow
                key={p.id}
                pastor={p}
                checked={selectedIds.has(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: selected + print ── */}
      <div className="flex-1 min-w-0">
        {selectedPastors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
            <UserCircle2 size={48} strokeWidth={1} />
            <p className="mt-3 text-sm">Selecciona pastores de la lista para imprimir</p>
            <p className="text-xs text-slate-300 mt-1">Usa los filtros para encontrarlos rápido</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedPastors.length} credencial{selectedPastors.length !== 1 ? "es" : ""} seleccionada{selectedPastors.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Frente y reverso · Plantilla {VISIBLE_TEMPLATES.find(t => t.id === templateId)?.label}</p>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                <Printer size={15} /> Imprimir ({selectedPastors.length})
              </button>
            </div>

            {/* Selected list */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {selectedPastors.map((p) => {
                const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
                const country = resolveCountry(p.country);
                return (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition-colors">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <UserCircle2 size={40} className="text-slate-300 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.churches?.name && (
                          <span className="text-xs text-slate-500 truncate">{p.churches.name}</span>
                        )}
                        {country.code && (
                          <>
                            <span className="text-slate-300 text-xs">·</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://flagcdn.com/w40/${country.code}.png`}
                              alt={country.name}
                              className="h-3 w-auto rounded-sm flex-shrink-0"
                            />
                          </>
                        )}
                        {(p.degree_title || p.titulo) && (
                          <>
                            <span className="text-slate-300 text-xs">·</span>
                            <span className="text-xs text-brand-600 font-medium truncate">{p.degree_title || p.titulo}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(p.id)}
                      className="text-slate-300 hover:text-red-400 flex-shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
// CARD_W / CARD_H needed for margin calculation in editor scale
const CARD_W = 648;
const CARD_H = 408;

export default function CredencialesPage() {
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "print"
  const [templateId, setTemplateId] = useState("elite");
  const [layout, setLayout] = useState(() => loadLayout("elite"));
  const [backLayout, setBackLayout] = useState(() => loadBackLayout("elite"));
  const [superintendent, setSuperintendente] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("super_name") || "" : ""
  );
  const [signatureUrl, setSignatureUrl] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("super_signature") || null : null
  );
  const [printPastors, setPrintPastors] = useState([]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab !== "print") setPrintPastors([]);
  }

  return (
    <RoleGuard allowed={["admin", "country_assigned"]}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #credential-print-area,
          #credential-print-area * { visibility: visible; }
          #credential-print-area {
            position: absolute;
            top: 0; left: 0;
            display: flex !important;
            flex-direction: column;
          }
          #credential-print-area > div {
            page-break-inside: avoid;
            page-break-after: always;
          }
          #credential-print-area > div:last-child {
            page-break-after: avoid;
          }
          @page { size: 85.60mm 53.98mm; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          #credential-print-area { display: none; }
        }
      `}</style>

      {/* ── Print-only area (outside no-print) ── */}
      {printPastors.length > 0 && (
        <div id="credential-print-area">
          {printPastors.map((p) => (
            <CredentialEditorCanvas
              key={p.id}
              templateId={templateId}
              pastor={p}
              superintendent={superintendent}
              signatureUrl={signatureUrl}
              layout={layout}
              backLayout={backLayout}
              onUpdate={() => {}}
              onBackUpdate={() => {}}
              printMode
            />
          ))}
        </div>
      )}

      {/* ── Screen layout ── */}
      <div className="no-print">
        <div className="view-header mb-5">
          <h2 className="view-title">Credenciales</h2>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => handleTabChange("editor")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "editor" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Pencil size={14} /> Editor de Plantilla
          </button>
          <button
            onClick={() => handleTabChange("print")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "print" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Printer size={14} /> Impresión Masiva
          </button>
        </div>

        {activeTab === "editor" && (
          <TemplateEditorTab
            templateId={templateId}
            setTemplateId={setTemplateId}
            layout={layout}
            setLayout={setLayout}
            backLayout={backLayout}
            setBackLayout={setBackLayout}
            superintendent={superintendent}
            setSuperintendente={setSuperintendente}
            signatureUrl={signatureUrl}
            setSignatureUrl={setSignatureUrl}
          />
        )}

        {activeTab === "print" && (
          <MassPrintTab
            templateId={templateId}
            layout={layout}
            backLayout={backLayout}
            superintendent={superintendent}
            signatureUrl={signatureUrl}
            onPrintPastorsChange={setPrintPastors}
          />
        )}
      </div>
    </RoleGuard>
  );
}
