// src/components/PastorForm.jsx
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileDown, Save, UserCircle2, Upload, X, ChevronDown, Search } from "lucide-react";
import { getActiveTemplate } from "../credentialTemplatesStorage";
import { generateCredentialPdf } from "../generateCredentialPdf";
import { COUNTRIES, getDocumentInfo } from "../lib/geography";
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

  const handleGeneratePdf = async () => {
    const tpl = getActiveTemplate();
    if (!tpl) {
      alert("No hay plantilla activa. Ve a Configuración → Plantillas de credenciales y marca una como activa.");
      return;
    }
    const pastorData = {
      id: pastor?.id,
      fullName: nombre,
      nombre,
      rut,
      iglesia: churches.find((c) => c.id === churchId)?.name ?? "",
      degreeTitle,
      estado,
      photoUrl,
      countryImageUrl: flagUrl,
      fechaVencimiento,
    };
    try {
      await generateCredentialPdf(tpl, pastorData);
      toast("Credencial descargada correctamente");
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al generar la credencial.");
    }
  };

  const handleSave = () => {
    onSave({ id: pastor?.id, nombre, rut, email, church_id: churchId, degreeTitle, estado, photoUrl, fechaVencimiento, pastorCountry });
  };

  return (
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
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <label className="field-label">
            Nombre completo
            <input
              className="field-input"
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>

          {/* Nacionalidad */}
          <div className="field-label">
            <span>Nacionalidad</span>
            <div className="flex items-center gap-3">
              <select
                className="field-input"
                value={pastorCountry}
                onChange={(e) => setPastorCountry(e.target.value)}
              >
                <option value="">Seleccionar país...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              {pastorFlagUrl && (
                <img src={pastorFlagUrl} alt={pastorCountry} className="w-14 h-10 rounded object-cover ring-1 ring-slate-200 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* País Iglesia */}
          <div className="field-label">
            <span>País Iglesia</span>
            <div className="flex items-center gap-3">
              <select
                className="field-input"
                value={churchCountry}
                onChange={(e) => handleChurchCountryChange(e.target.value)}
              >
                <option value="">Seleccionar país...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              {churchFlagUrl && (
                <img src={churchFlagUrl} alt={churchCountry} className="w-14 h-10 rounded object-cover ring-1 ring-slate-200 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Iglesia */}
          <div className="field-label">
            <span>Iglesia</span>
            <SearchSelect
              value={churchId}
              onChange={setChurchId}
              options={churchesByCountry.map((c) => ({ id: c.id, name: c.name }))}
              placeholder={churchCountry ? "Seleccionar iglesia..." : "Selecciona un país primero..."}
            />
          </div>

          <label className="field-label">
            {docInfo.label}
            <input
              className="field-input"
              placeholder={docInfo.placeholder}
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
          </label>

          <label className="field-label">
            Correo electrónico
            <input
              className="field-input"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field-label">
            Grado
            <select
              className="field-input"
              value={degreeTitle}
              onChange={(e) => setDegreeTitle(e.target.value)}
            >
              <option value="">Seleccionar grado...</option>
              <option>Probando</option>
              <option>Diácono</option>
              <option>Presbítero</option>
              <option>Superintendente</option>
            </select>
          </label>

          <label className="field-label">
            Estado
            <select
              className="field-input"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option>Activo</option>
              <option>Honorario</option>
              <option>Inactivo</option>
            </select>
          </label>

          <label className="field-label">
            Fecha de vencimiento
            <DatePicker
              value={fechaVencimiento}
              onChange={setFechaVencimiento}
              placeholder="Seleccionar fecha..."
            />
          </label>

          {/* Photo upload */}
          <div className="field-label">
            <span>Foto del pastor</span>
            <div className="flex items-center gap-4">
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              {photoUrl ? (
                <div className="relative flex-shrink-0">
                  <img src={photoUrl} alt="Preview" className="w-32 h-40 rounded-lg object-cover ring-1 ring-slate-200" />
                  <button type="button" onClick={() => setPhotoUrl("")}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-40 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 size={56} className="text-slate-300" />
                </div>
              )}
              <button type="button" onClick={() => photoRef.current?.click()} className="btn-secondary btn-sm gap-2">
                <Upload size={14} />
                {photoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
            </div>
          </div>



        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave}>
          <Save size={15} />
          Guardar
        </button>
        <button className="btn-secondary" onClick={handleGeneratePdf}>
          <FileDown size={15} />
          Generar credencial PDF
        </button>
      </div>
    </div>
  );
}
