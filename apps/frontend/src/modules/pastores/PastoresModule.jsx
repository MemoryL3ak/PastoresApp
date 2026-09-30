"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PastorForm from "@/components/PastorForm";
import PastoresList from "@/components/PastoresList";
import { api } from "@/lib/api";
import { useAllPastorsLite, useAllChurches, invalidatePastors } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";
import { COUNTRIES } from "@/lib/geography";
import { exportToCSV, exportToXLSX } from "@/lib/csv";

const STATUS_LABELS = {
  active:        "Activo",
  inactive:      "Inactivo",
  suspended:     "Honorario",
  fallecido:     "Fallecido",
  descontinuado: "Descontinuado",
};

function countryName(code) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "";
}

const PAGE_SIZE = 50;
const PHOTO_FETCH_DELAY = 150; // ms — skip photo requests for result sets that only flash by while typing

const statusMap = { "Activo": "active", "Honorario": "suspended", "Inactivo": "inactive" };

/* ── Search helpers (mirror the backend's accent-insensitive matching) ── */
const normalize = (text) => (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const rutKey    = (text) => (text ?? "").toUpperCase().replace(/[^0-9K]/g, "");

/** Free-text country query → ISO codes. 2 letters = exact code, otherwise partial name match. */
function countryCodesFor(text) {
  const query = text.trim();
  if (/^[A-Za-z]{2}$/.test(query)) return [query.toUpperCase()];
  const needle = normalize(query);
  return COUNTRIES.filter((c) => normalize(c.name).includes(needle)).map((c) => c.code);
}

/**
 * Relevance of a pastor for the name/RUT box: -1 = no match. Every word typed must appear
 * in the name; words matching the start of a name word rank higher ("aldo" → Aldo before Maldonado).
 */
function searchScore(entry, tokens, rutQuery) {
  if (rutQuery && entry.rut.includes(rutQuery)) return 100;
  let score = 0;
  for (const token of tokens) {
    if (!entry.name.includes(token)) return -1;
    if (entry.nameWords.includes(` ${token}`)) score++;
  }
  return score;
}

function toView(pastor, churchById) {
  const churchCountryCode = pastor.churches?.country ?? churchById.get(pastor.church_id)?.country ?? "";
  return {
    id: pastor.id,
    nombre: `${pastor.first_name ?? ""} ${pastor.last_name ?? ""}`.trim(),
    rut: pastor.document_number ?? "",
    church_id: pastor.church_id,
    iglesia: pastor.churches?.name ?? churchById.get(pastor.church_id)?.name ?? "",
    churchCountry: COUNTRIES.find((c) => c.code === churchCountryCode)?.name ?? churchCountryCode,
    estado: pastor.pastoral_status === "inactive" ? "Inactivo" : pastor.pastoral_status === "suspended" ? "Honorario" : "Activo",
    degreeTitle: pastor.degree_title ?? "",
    photoUrl: pastor.photo_url ?? "",
    fechaVencimiento: pastor.expiry_date ?? "",
    pastorCountry: pastor.country ?? "",
    email: pastor.email ?? "",
    zone: pastor.zone ?? "",
    foreignZone: pastor.foreign_zone ?? "",
  };
}

export default function PastoresModule() {
  const [page, setPage]               = useState(1);
  const [selectedPastor, setSelectedPastor] = useState(null);
  const [view, setView]               = useState("list");
  const [mutateError, setMutateError] = useState("");
  const { toast } = useToast();

  const [searchName, setSearchName]     = useState("");
  const [searchIglesia, setSearchIglesia] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // All pastors (no photos) are loaded once and filtered locally, so typing filters instantly
  const { pastors: allPastors, isLoading, error: loadError } = useAllPastorsLite();
  const { churches } = useAllChurches();

  // Full records (with photo) for rows that have been on screen: id → record | null (deleted)
  const fullById  = useRef(new Map());
  const requested = useRef(new Set());
  const [, setFullVersion] = useState(0);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchName, searchIglesia, searchCountry, filterEstado]);

  const error = mutateError || loadError;

  const churchById = useMemo(() => new Map(churches.map((c) => [c.id, c])), [churches]);

  // Normalized fields computed once per load, not on every keystroke
  const index = useMemo(() => allPastors.map((p) => {
    const name = normalize(`${p.first_name ?? ""} ${p.last_name ?? ""}`);
    return {
      pastor: p,
      name,
      nameWords: ` ${name}`,
      rut: rutKey(p.document_number),
      church: normalize(p.churches?.name ?? churchById.get(p.church_id)?.name),
      churchCountry: p.churches?.country ?? churchById.get(p.church_id)?.country ?? "",
    };
  }), [allPastors, churchById]);

  const filtered = useMemo(() => {
    const tokens   = normalize(searchName).split(/\s+/).filter(Boolean);
    const rutQuery = /\d/.test(searchName) ? rutKey(searchName) : "";
    const church   = normalize(searchIglesia);
    const codes    = searchCountry.trim() ? new Set(countryCodesFor(searchCountry)) : null;
    const status   = filterEstado ? statusMap[filterEstado] : "";

    const matches = [];
    for (const entry of index) {
      if (status && entry.pastor.pastoral_status !== status) continue;
      if (church && !entry.church.includes(church)) continue;
      if (codes && !codes.has(entry.churchCountry)) continue;
      const score = tokens.length || rutQuery ? searchScore(entry, tokens, rutQuery) : 0;
      if (score < 0) continue;
      matches.push({ pastor: entry.pastor, score });
    }
    // Stable sort keeps the server order (newest first) among equally relevant results
    if (tokens.length || rutQuery) matches.sort((a, b) => b.score - a.score);
    return matches.map((m) => m.pastor);
  }, [index, searchName, searchIglesia, searchCountry, filterEstado]);

  const total      = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds    = pageRows.map((p) => p.id).join(",");

  // Load photos for the visible rows only
  useEffect(() => {
    const missing = pageIds.split(",").filter((id) => id && !fullById.current.has(id) && !requested.current.has(id));
    if (missing.length === 0) return;
    const timer = setTimeout(() => {
      missing.forEach((id) => requested.current.add(id));
      api.listPastorsByIds(missing)
        .then((rows) => {
          rows.forEach((r) => fullById.current.set(r.id, r));
          missing.forEach((id) => { if (!fullById.current.has(id)) fullById.current.set(id, null); });
          setFullVersion((v) => v + 1);
        })
        .catch(() => { /* rows keep the placeholder; they'll retry when shown again */ })
        .finally(() => missing.forEach((id) => requested.current.delete(id)));
    }, PHOTO_FETCH_DELAY);
    return () => clearTimeout(timer);
  }, [pageIds]);

  // Keep the page in range when results shrink (e.g. after a delete)
  useEffect(() => {
    if (page > 1 && page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  // Fields come from the (fresh) list; only the photo comes from the full-record cache
  const pastorsView = pageRows.map((p) => {
    const full = fullById.current.get(p.id);
    return { ...toView({ ...p, photo_url: full?.photo_url }, churchById), photoLoading: full === undefined };
  });

  const forgetFull = (id) => { if (id) fullById.current.delete(id); };

  const handleDelete = async (id) => {
    try {
      await api.deletePastor(id);
      forgetFull(id);
      invalidatePastors();
      setMutateError("");
      toast("Pastor eliminado");
    }
    catch (err) { setMutateError(err.message || "No se pudo eliminar el pastor"); }
  };

  // The form needs the full record: saving without the photo loaded would erase it
  const handleEdit = async (row) => {
    let full = fullById.current.get(row.id);
    if (full === undefined) {
      try {
        [full] = await api.listPastorsByIds([row.id]);
        fullById.current.set(row.id, full ?? null);
      } catch (err) {
        setMutateError(err.message || "No se pudo abrir el pastor");
        return;
      }
    }
    if (!full) { setMutateError("Pastor no encontrado"); return; }
    const fresh = allPastors.find((p) => p.id === row.id) ?? full;
    setMutateError("");
    setSelectedPastor(toView({ ...fresh, photo_url: full.photo_url }, churchById));
    setView("form");
  };

  const handleSave = async (pastorData) => {
    const fullName  = pastorData.nombre.trim();
    const parts     = fullName.split(" ");
    const firstName = parts.shift() ?? "";
    const lastName  = parts.join(" ") || firstName;
    const payload   = {
      first_name:      firstName,
      last_name:       lastName,
      ...(pastorData.rut ? { document_number: pastorData.rut } : {}),
      church_id:       pastorData.church_id,
      pastoral_status: pastorData.estado === "Inactivo" ? "inactive" : pastorData.estado === "Honorario" ? "suspended" : "active",
      degree_title:    pastorData.degreeTitle || null,
      photo_url:       pastorData.photoUrl || null,
      expiry_date:     pastorData.fechaVencimiento || null,
      country:         pastorData.pastorCountry || null,
      email:           pastorData.email || null,
      zone:            pastorData.zone || null,
      foreign_zone:    pastorData.foreignZone || null,
    };
    try {
      if (pastorData.id) { await api.updatePastor(pastorData.id, payload); }
      else               { await api.createPastor(payload); }
      forgetFull(pastorData.id);
      invalidatePastors();
      setSelectedPastor(null);
      setView("list");
      setMutateError("");
      toast(pastorData.id ? "Pastor actualizado correctamente" : "Pastor creado correctamente");
    } catch (err) { setMutateError(err.message || "No se pudo guardar el pastor"); }
  };

  const handleExport = (format) => {
    const columns = [
      { key: "first_name",      label: "Nombres" },
      { key: "last_name",       label: "Apellidos" },
      { key: "document_number", label: "Documento" },
      { key: "email",           label: "Email" },
      { key: "phone",           label: "Teléfono" },
      { label: "Iglesia",       value: (r) => r.churches?.name ?? churchById.get(r.church_id)?.name ?? "" },
      { label: "País iglesia",  value: (r) => countryName(r.churches?.country ?? churchById.get(r.church_id)?.country) },
      { label: "País pastor",   value: (r) => countryName(r.country) },
      { label: "Estado",        value: (r) => STATUS_LABELS[r.pastoral_status] ?? r.pastoral_status ?? "" },
      { key: "degree_title",    label: "Grado" },
      { key: "zone",            label: "Zona" },
      { key: "expiry_date",     label: "Vencimiento" },
    ];
    if (format === "xlsx") exportToXLSX("pastores", allPastors, columns, "Pastores");
    else                    exportToCSV("pastores", allPastors, columns);
  };

  return (
    <div>
      {error && <div className="alert-error mb-4">{error}</div>}
      {view === "list" && (
        <PastoresList
          loading={isLoading && allPastors.length === 0}
          searching={false}
          pastores={pastorsView}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchName={searchName}
          onSearchName={setSearchName}
          searchIglesia={searchIglesia}
          onSearchIglesia={setSearchIglesia}
          searchCountry={searchCountry}
          onSearchCountry={setSearchCountry}
          filterEstado={filterEstado}
          onFilterEstado={setFilterEstado}
          onDeletePastor={handleDelete}
          onEditPastor={handleEdit}
          onAddPastor={() => { setSelectedPastor(null); setView("form"); }}
          onExport={handleExport}
          canExport={allPastors.length > 0}
        />
      )}
      {view === "form" && (
        <PastorForm pastor={selectedPastor} churches={churches} onBack={() => setView("list")} onSave={handleSave} />
      )}
    </div>
  );
}
