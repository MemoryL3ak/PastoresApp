// src/components/PastorForm.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileDown, Save, UserCircle2, Upload, X, ChevronDown, Search } from "lucide-react";
import { IEP_COUNTRIES, getDocumentInfo } from "../lib/geography";
import CredentialEditorCanvas, { defaultLayout, defaultBackLayout } from "@/components/CredentialEditorCanvas";

const IEP_FOREIGN_COUNTRIES = IEP_COUNTRIES.filter((c) => c.code !== "CL");
import { useToast } from "../context/ToastContext";
import DatePicker from "./DatePicker";

/* ── Searchable combobox ───────────────────────────────────────── */
function SearchSelect({ value, onChange, options, placeholder = "Buscar..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((o) => o.id === value);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((prev) => !prev); setQuery(""); }}
        className="field-input flex items-center justify-between text-left"
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={15} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
              placeholder="Escribir para filtrar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">
                Sin resultados
              </li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.id}
                  onClick={() => handleSelect(o.id)}
                  className={[
                    "flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors",
                    o.id === value
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {o.name}
                  {o.id === value && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-600 flex-shrink-0" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── PastorForm ────────────────────────────────────────────────── */
export default function PastorForm({ pastor, churches = [], onBack, onSave }) {
  const isEdit = Boolean(pastor);
  const { toast } = useToast();

  const [nombre, setNombre] = useState(pastor?.nombre ?? pastor?.fullName ?? "");
  const [rut, setRut] = useState(pastor?.rut ?? "");
  const [email, setEmail] = useState(pastor?.email ?? "");
  const [degreeTitle, setDegreeTitle] = useState(pastor?.degreeTitle ?? "");
  const [estado, setEstado] = useState(pastor?.estado ?? "Activo");
  const [photoUrl, setPhotoUrl] = useState(pastor?.photoUrl ?? "");
  const photoRef = useRef(null);
  const [fechaVencimiento, setFechaVencimiento] = useState(pastor?.fechaVencimiento ?? "");

  // Zona administrada (sólo Presbítero)
  const [zone, setZone] = useState(pastor?.zone ?? "");
  const [foreignZone, setForeignZone] = useState(pastor?.foreignZone ?? "");

  const isPresbitero = degreeTitle === "Presbítero";

  // País pastor (nacionalidad)
  const [pastorCountry, setPastorCountry] = useState(pastor?.pastorCountry ?? "");

  // País iglesia → filtra listado de iglesias
  const initialChurch = churches.find((c) => c.id === pastor?.church_id);
  const [churchCountry, setChurchCountry] = useState(pastor?.church_id ? (initialChurch?.country ?? "") : "");
  const [churchId, setChurchId] = useState(pastor?.church_id ?? "");

  const churchesByCountry = churchCountry
    ? churches.filter((c) => c.country === churchCountry)
    : churches;

  const docInfo = getDocumentInfo(pastorCountry);

  const handleChurchCountryChange = (code) => {
    setChurchCountry(code);
    setChurchId("");
  };

  const pastorFlagUrl = pastorCountry ? `https://flagcdn.com/w320/${pastorCountry.toLowerCase()}.png` : "";
  const churchFlagUrl = churchCountry ? `https://flagcdn.com/w320/${churchCountry.toLowerCase()}.png` : "";

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // Load credential layout and superintendent from localStorage (elite-azul template)
  const credLayout = useMemo(() => {
    if (typeof window === "undefined") return defaultLayout("elite-azul");
    try {
      const stored = localStorage.getItem("credential_layout_v2_elite-azul");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return defaultLayout("elite-azul");
  }, []);

  const credBackLayout = useMemo(() => {
    if (typeof window === "undefined") return defaultBackLayout("elite-azul");
    try {
      const stored = localStorage.getItem("credential_back_layout_v2_elite-azul");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return defaultBackLayout("elite-azul");
  }, []);

  const credSuperintendent = typeof window !== "undefined" ? localStorage.getItem("super_name") || "" : "";
  const credSignatureUrl   = typeof window !== "undefined" ? localStorage.getItem("super_signature") || null : null;

  const pastorForCredential = {
    full_name:       nombre,
    document_number: rut,
    degree_title:    degreeTitle,
    churches:        { name: churches.find((c) => c.id === churchId)?.name ?? "" },
    country:         pastorCountry,
    photo_url:       photoUrl,
    expiry_date:     fechaVencimiento,
  };

  const handlePrint = () => {
    const prev = document.title;
    document.title = "Credencial IEP";
    window.print();
    document.title = prev;
  };

  const handleSave = () => {
    onSave({ id: pastor?.id, nombre, rut, email, church_id: churchId, degreeTitle, estado, photoUrl, fechaVencimiento, pastorCountry, zone: isPresbitero ? zone : "", foreignZone: isPresbitero ? foreignZone : "" });
  };

  return (
    <>
    {/* ── Print-only credential area ── */}
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #credential-print-area-pastor,
        #credential-print-area-pastor * { visibility: visible; }
        #credential-print-area-pastor {
          position: absolute; top: 0; left: 0;
          display: flex !important; flex-direction: column;
        }
        #credential-print-area-pastor > div { page-break-inside: avoid; page-break-after: always; }
        #credential-print-area-pastor > div:last-child { page-break-after: avoid; }
        @page { size: 85.60mm 53.98mm; margin: 0; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
      @media screen { #credential-print-area-pastor { display: none; } }
    `}</style>
    <div id="credential-print-area-pastor">
      <CredentialEditorCanvas
        templateId="elite-azul"
        pastor={pastorForCredential}
        superintendent={credSuperintendent}
        signatureUrl={credSignatureUrl}
        layout={credLayout}
        backLayout={credBackLayout}
        onUpdate={() => {}}
        onBackUpdate={() => {}}
        printMode
      />
    </div>

    <div className="space-y-6">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">{isEdit ? "Editar pastor" : "Agregar pastor"}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? "Modifica los datos del registro" : "Completa los datos del nuevo pastor"}
          </p>
        </div>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={15} />
          Volver al listado
        </button>
      </div>

      {/* Form */}
      <div className="card space-y-6">

        {/* Sección: Información personal */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-brand-800">Información personal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="field-label">
              Nombre completo
              <input className="field-input" placeholder="Ej: Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <div className="field-label">
              <span>Nacionalidad</span>
              <div className="flex items-center gap-3">
                <select className="field-input" value={pastorCountry} onChange={(e) => setPastorCountry(e.target.value)}>
                  <option value="">Seleccionar país...</option>
                  {IEP_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {pastorFlagUrl && <img src={pastorFlagUrl} alt={pastorCountry} className="w-14 h-10 rounded object-cover ring-1 ring-slate-200 flex-shrink-0" />}
              </div>
            </div>
            <label className="field-label">
              {docInfo.label}
              <input className="field-input" placeholder={docInfo.placeholder} value={rut} onChange={(e) => setRut(e.target.value)} />
            </label>
            <label className="field-label">
              Correo electrónico
              <input className="field-input" type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Sección: Iglesia */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-brand-800">Iglesia</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="field-label">
              <span>País Iglesia</span>
              <div className="flex items-center gap-3">
                <select className="field-input" value={churchCountry} onChange={(e) => handleChurchCountryChange(e.target.value)}>
                  <option value="">Seleccionar país...</option>
                  {IEP_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {churchFlagUrl && <img src={churchFlagUrl} alt={churchCountry} className="w-14 h-10 rounded object-cover ring-1 ring-slate-200 flex-shrink-0" />}
              </div>
            </div>
            <div className="field-label">
              <span>Iglesia</span>
              <SearchSelect
                value={churchId}
                onChange={setChurchId}
                options={churchesByCountry.map((c) => ({ id: c.id, name: c.name }))}
                placeholder={churchCountry ? "Seleccionar iglesia..." : "Selecciona un país primero..."}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Sección: Ministerio */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-brand-800">Ministerio</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="field-label">
              Grado
              <select className="field-input" value={degreeTitle} onChange={(e) => setDegreeTitle(e.target.value)}>
                <option value="">Seleccionar grado...</option>
                <option>Probando</option>
                <option>Diácono</option>
                <option>Presbítero</option>
                <option>Superintendente</option>
              </select>
            </label>
            <label className="field-label">
              Estado
              <select className="field-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option>Activo</option>
                <option>Honorario</option>
                <option>Inactivo</option>
              </select>
            </label>
            <label className="field-label">
              Fecha de vencimiento
              <DatePicker value={fechaVencimiento} onChange={setFechaVencimiento} placeholder="Seleccionar fecha..." />
            </label>
          </div>

          {/* Zona Administrada — sólo para Presbítero */}
          {isPresbitero && (
            <div className="mt-5 bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-[3px] h-4 rounded-full bg-brand-400 flex-shrink-0" />
                <div className="text-sm font-semibold text-brand-800">Zona Administrada</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="field-label">
                  Zona local
                  <select className="field-input" value={zone} onChange={(e) => setZone(e.target.value)}>
                    <option value="">Sin Zona</option>
                    {Array.from({ length: 33 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={String(n)}>{n}</option>
                    ))}
                  </select>
                </label>
                <div className="field-label">
                  <span>Zona extranjero</span>
                  <div className="flex items-center gap-3">
                    <select className="field-input" value={foreignZone} onChange={(e) => setForeignZone(e.target.value)}>
                      <option value="">Sin zona extranjero</option>
                      {IEP_FOREIGN_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    {foreignZone && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://flagcdn.com/w160/${foreignZone.toLowerCase()}.png`} alt={foreignZone} className="w-14 h-10 rounded object-cover ring-1 ring-slate-200 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* Sección: Foto */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-brand-800">Foto del pastor</h3>
          </div>
          <div className="flex items-center gap-5">
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            {photoUrl ? (
              <div className="relative flex-shrink-0">
                <img src={photoUrl} alt="Preview" className="w-32 h-40 rounded-xl object-cover ring-2 ring-brand-200" />
                <button type="button" onClick={() => setPhotoUrl("")}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => photoRef.current?.click()}
                className="w-32 h-40 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 flex flex-col items-center justify-center gap-2 hover:border-brand-400 hover:bg-brand-100/60 transition-colors flex-shrink-0">
                <UserCircle2 size={40} className="text-brand-300" />
                <span className="text-xs text-brand-400 font-medium">Subir foto</span>
              </button>
            )}
            {photoUrl && (
              <button type="button" onClick={() => photoRef.current?.click()} className="btn-secondary btn-sm gap-2">
                <Upload size={14} />
                Cambiar foto
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center gap-3 shadow-sm">
        <button className="btn-primary" onClick={handleSave}>
          <Save size={15} />
          Guardar
        </button>
        <button className="btn-secondary" onClick={handlePrint}>
          <FileDown size={15} />
          Imprimir credencial
        </button>
      </div>
    </div>
    </>
  );
}
