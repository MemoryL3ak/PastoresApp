"use client";

import { useEffect, useMemo, useState } from "react";
import PastorForm from "@/components/PastorForm";
import PastoresList from "@/components/PastoresList";
import { api } from "@/lib/api";
import { usePastors, useAllChurches, useAllPastors, invalidatePastors } from "@/lib/hooks";
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

function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const statusMap = { "Activo": "active", "Honorario": "suspended", "Inactivo": "inactive" };

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

  const debouncedName    = useDebounce(searchName);
  const debouncedIglesia = useDebounce(searchIglesia);
  const debouncedCountry = useDebounce(searchCountry);

  const { pastors, total, isLoading, isValidating, error: loadError } = usePastors({
    page,
    limit: PAGE_SIZE,
    search:   debouncedName,
    status:   filterEstado ? statusMap[filterEstado] : "",
    iglesia:  debouncedIglesia,
    country:  debouncedCountry,
  });
  const { churches } = useAllChurches();
  const { pastors: allPastors } = useAllPastors();

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedName, debouncedIglesia, debouncedCountry, filterEstado]);

  const error = mutateError || loadError;

  const churchById = useMemo(() => new Map(churches.map((c) => [c.id, c])), [churches]);

  const pastorsView = pastors.map((pastor) => ({
    id: pastor.id,
    nombre: `${pastor.first_name ?? ""} ${pastor.last_name ?? ""}`.trim(),
    rut: pastor.document_number ?? "",
    church_id: pastor.church_id,
    iglesia: pastor.churches?.name ?? churchById.get(pastor.church_id)?.name ?? "",
    churchCountry: (() => {
      const code = pastor.churches?.country ?? churchById.get(pastor.church_id)?.country ?? "";
      return COUNTRIES.find((c) => c.code === code)?.name ?? code;
    })(),
    estado: pastor.pastoral_status === "inactive" ? "Inactivo" : pastor.pastoral_status === "suspended" ? "Honorario" : "Activo",
    degreeTitle: pastor.degree_title ?? "",
    photoUrl: pastor.photo_url ?? "",
    fechaVencimiento: pastor.expiry_date ?? "",
    pastorCountry: pastor.country ?? "",
    email: pastor.email ?? "",
    zone: pastor.zone ?? "",
    foreignZone: pastor.foreign_zone ?? "",
  }));

  const handleDelete = async (id) => {
    try { await api.deletePastor(id); invalidatePastors(); setMutateError(""); toast("Pastor eliminado"); }
    catch (err) { setMutateError(err.message || "No se pudo eliminar el pastor"); }
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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {error && <div className="alert-error mb-4">{error}</div>}
      {view === "list" && (
        <PastoresList
          loading={isLoading && pastors.length === 0}
          searching={isValidating && !isLoading}
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
          onEditPastor={(pastor) => { setSelectedPastor(pastor); setView("form"); }}
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
