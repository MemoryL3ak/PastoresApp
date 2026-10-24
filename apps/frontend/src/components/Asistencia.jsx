import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCheck, Search, X, CheckSquare2, ScanBarcode, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  eventDays, formatDayKey, groupJornadas, localDateKey, localTime, localToIso, sessionForDay, todayKey,
} from "../lib/jornadas";

/* ── Barcode scanner hook ──────────────────────────────────────── */
// Physical barcode scanners type very fast (< 50ms/char) then press Enter.
// This hook captures that pattern globally.
function useBarcodeScanner({ enabled, onScan, ignoreRef }) {
  const buffer = useRef("");
  const lastTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      // The scan input handles its own Enter; avoid processing the same scan twice
      if (ignoreRef?.current && e.target === ignoreRef.current) {
        buffer.current = "";
        return;
      }

      const now = Date.now();
      const delta = now - lastTime.current;
      lastTime.current = now;

      if (e.key === "Enter") {
        if (buffer.current.length >= 3) onScan(buffer.current.trim());
        buffer.current = "";
        return;
      }

      // If gap > 100ms, it's manual typing — reset buffer
      if (delta > 100) buffer.current = "";
      if (e.key.length === 1) buffer.current += e.key;
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onScan, ignoreRef]);
}

function formatCheckin(dateIso) {
  if (!dateIso) return "—";
  const d = new Date(dateIso);
  const date = d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time}`;
}

/* ── Feedback toast ────────────────────────────────────────────── */
function ScanResult({ result }) {
  if (!result) return null;
  const isOk = result.type === "success";
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
      isOk ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
    }`}>
      {isOk
        ? <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-600" />
        : <AlertCircle size={18} className="flex-shrink-0 text-red-500" />}
      {result.message}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
const ALL_DAYS = "all";

// Default jornada: the one happening now, else the first of the day
function pickDefaultJornada(jornadas) {
  if (jornadas.length === 0) return "";
  const now = localTime(Date.now());
  return (jornadas.find((j) => j.start <= now && now <= j.end) ?? jornadas[0]).label;
}

export default function Asistencia() {
  const { canEdit } = useAuth();
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pastores, setPastores] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [viewDay, setViewDay] = useState(todayKey());
  const [asistencia, setAsistencia] = useState([]);
  const [error, setError] = useState("");

  // Manual selection mode
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedPastorIds, setSelectedPastorIds] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterChurch, setFilterChurch] = useState("");

  // Barcode scanner mode
  const [scannerActive, setScannerActive] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const scanInputRef = useRef(null);
  const resultTimeout = useRef(null);
  const creatingToday = useRef(null); // in-flight creation of today's row, so fast scans don't duplicate it

  const today = todayKey();
  const event = events.find((e) => e.id === selectedEvent) ?? null;
  const jornadas = useMemo(() => groupJornadas(sessions), [sessions]);
  const jornada = jornadas.find((j) => j.label === selectedLabel) ?? null;
  const todaySession = sessionForDay(jornada, today);
  const todayInEvent = event ? eventDays(event).includes(today) : true;
  const sessionIdsKey = (jornada?.sessions ?? []).map((s) => s.id).join(",");

  useEffect(() => {
    (async () => {
      try {
        const [eventsData, pastorsData] = await Promise.all([
          api.listEvents(),
          api.listAllPastors(),
        ]);
        setEvents(eventsData);
        setPastores(pastorsData);
      } catch (err) {
        setError(err.message || "No se pudo cargar asistencia");
      }
    })();
  }, []);

  useEffect(() => {
    setViewDay(todayKey());
    if (!selectedEvent) { setSessions([]); setSelectedLabel(""); return; }
    (async () => {
      try {
        const sessionData = await api.listEventSessions(selectedEvent);
        setSessions(sessionData);
        setSelectedLabel(pickDefaultJornada(groupJornadas(sessionData)));
      } catch (err) { setError(err.message || "No se pudieron cargar las jornadas"); }
    })();
  }, [selectedEvent]);

  const loadAttendance = useCallback(async (ids) => {
    try { setAsistencia(await api.listAttendanceBySessions(ids)); }
    catch (err) { setError(err.message || "No se pudo cargar asistencia"); }
  }, []);

  useEffect(() => {
    if (!sessionIdsKey) { setAsistencia([]); return; }
    loadAttendance(sessionIdsKey.split(","));
  }, [sessionIdsKey, loadAttendance]);

  /** Row of the selected jornada for today; created on first use (days added later, or outside the generated range). */
  const ensureTodaySession = useCallback(async () => {
    if (!jornada || !selectedEvent) throw new Error("Selecciona una jornada.");
    const existing = sessionForDay(jornada, today);
    if (existing) return existing.id;
    creatingToday.current ??= api
      .createEventSession(selectedEvent, { label: jornada.label, starts_at: localToIso(today, jornada.start), ends_at: localToIso(today, jornada.end) })
      .then((created) => { setSessions((prev) => [...prev, created]); return created.id; })
      .finally(() => { creatingToday.current = null; });
    return creatingToday.current;
  }, [jornada, selectedEvent, today]);

  const reloadAttendance = (extraId) => {
    const ids = new Set((jornada?.sessions ?? []).map((s) => s.id));
    if (extraId) ids.add(extraId);
    return loadAttendance([...ids]);
  };

  const normalizedPastores = useMemo(() =>
    pastores.map((p) => ({
      id: p.id,
      nombre: p.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      iglesia: p.churches?.name ?? "",
      rut: p.document_number ?? "",
    })),
    [pastores]
  );

  const filteredPastores = useMemo(() => {
    const name = filterName.toLowerCase();
    const church = filterChurch.toLowerCase();
    return normalizedPastores.filter(
      (p) => p.nombre.toLowerCase().includes(name) && p.iglesia.toLowerCase().includes(church)
    );
  }, [filterName, filterChurch, normalizedPastores]);

  // Duplicates are per day: the same pastor can attend Jornada AM every day
  const alreadyCheckedIn = useMemo(() =>
    new Set(asistencia.filter((a) => todaySession && a.event_session_id === todaySession.id).map((a) => a.pastors?.id).filter(Boolean)),
    [asistencia, todaySession]
  );

  // Table: filtered by the date the attendance was marked
  const daysWithRecords = useMemo(() =>
    [...new Set(asistencia.map((a) => localDateKey(a.checked_in_at)))].sort().reverse(),
    [asistencia]
  );
  const visibleAsistencia = viewDay === ALL_DAYS ? asistencia : asistencia.filter((a) => localDateKey(a.checked_in_at) === viewDay);
  const todayCount = asistencia.filter((a) => localDateKey(a.checked_in_at) === today).length;

  const showScanResult = (type, message) => {
    setScanResult({ type, message });
    clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => setScanResult(null), 4000);
  };

  const processScan = useCallback(async (code) => {
    if (!jornada) {
      showScanResult("error", "Selecciona una jornada antes de escanear.");
      return;
    }
    // Match by RUT (document_number) keeping only digits and the K verifier.
    // Scanners configured with a US layout on a Spanish-layout PC send "-" as "'",
    // so any separator character is ignored.
    const clean = (s) => s.toUpperCase().replace(/[^0-9K]/g, "").replace(/^0+/, "");
    const pastor = normalizedPastores.find((p) => p.rut && clean(p.rut) === clean(code));

    if (!pastor) {
      showScanResult("error", `Código "${code}" no corresponde a ningún pastor registrado.`);
      setScanInput("");
      return;
    }

    if (alreadyCheckedIn.has(pastor.id)) {
      showScanResult("error", `${pastor.nombre} ya tiene asistencia registrada hoy en ${jornada.label}.`);
      setScanInput("");
      return;
    }

    try {
      const sessionId = await ensureTodaySession();
      await api.checkinAttendance({
        event_session_id: sessionId,
        pastor_id: pastor.id,
        checkin_method: "barcode",
      });
      await reloadAttendance(sessionId);
      showScanResult("success", `✓ Asistencia registrada: ${pastor.nombre} — ${pastor.iglesia || "sin iglesia"}`);
    } catch (err) {
      showScanResult("error", err.message || "Error al registrar asistencia.");
    }
    setScanInput("");
    scanInputRef.current?.focus();
  }, [jornada, normalizedPastores, alreadyCheckedIn, ensureTodaySession]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard capture for physical scanners
  useBarcodeScanner({ enabled: scannerActive, onScan: processScan, ignoreRef: scanInputRef });

  // Focus input when scanner mode activates
  useEffect(() => {
    if (scannerActive) setTimeout(() => scanInputRef.current?.focus(), 50);
  }, [scannerActive]);

  const handleTogglePastor = (id) => {
    setSelectedPastorIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSaveSelection = async () => {
    if (!jornada || selectedPastorIds.length === 0) return;
    try {
      const sessionId = await ensureTodaySession();
      await Promise.all(
        selectedPastorIds.map((pastorId) =>
          api.checkinAttendance({ event_session_id: sessionId, pastor_id: pastorId, checkin_method: "manual" })
        )
      );
      await reloadAttendance(sessionId);
      setIsSelecting(false);
      setSelectedPastorIds([]);
      setViewDay(today);
      setError("");
    } catch (err) { setError(err.message || "No se pudo registrar asistencia"); }
  };

  const noJornadas = Boolean(selectedEvent) && jornadas.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="view-title">Control de Asistencia</h2>
        <p className="mt-0.5 text-sm text-slate-500">Selecciona el evento y la jornada. La asistencia se registra con la fecha y hora en que se marca.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Selectors */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="field-label">
            Evento
            <select className="field-input" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="">Seleccionar evento...</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </label>
          <label className="field-label">
            Jornada
            <select className="field-input" value={selectedLabel} onChange={(e) => setSelectedLabel(e.target.value)} disabled={!selectedEvent || noJornadas}>
              <option value="">{noJornadas ? "Este evento no tiene jornadas" : "Seleccionar jornada..."}</option>
              {jornadas.map((j) => <option key={j.label} value={j.label}>{j.label} ({j.start}–{j.end})</option>)}
            </select>
          </label>
        </div>

        {noJornadas && (
          <p className="text-sm text-amber-700 mb-3">Este evento no tiene jornadas. Agrégalas en Eventos → columna Jornadas.</p>
        )}
        {jornada && !todayInEvent && (
          <p className="text-sm text-amber-700 mb-3">Hoy ({formatDayKey(today)}) no está dentro de las fechas del evento; la asistencia se registrará igual con la fecha de hoy.</p>
        )}

        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" onClick={() => { setIsSelecting(true); setScannerActive(false); setSelectedPastorIds([]); setFilterName(""); setFilterChurch(""); }} disabled={!jornada}>
              <ClipboardCheck size={16} />
              Registro manual
            </button>
            <button
              className={`btn-primary gap-2 ${scannerActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              onClick={() => { setScannerActive((v) => !v); setIsSelecting(false); setScanResult(null); }}
              disabled={!jornada}
            >
              <ScanBarcode size={16} />
              {scannerActive ? "Escáner activo" : "Escanear código"}
            </button>
            {jornada && <span className="text-xs text-slate-500">Se registra para hoy, {formatDayKey(today)}</span>}
          </div>
        )}
      </div>

      {/* Scanner mode */}
      {scannerActive && (
        <div className="card border-emerald-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <ScanBarcode size={18} className="text-emerald-600" />
                Modo escáner activo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Escanea el código de barras de la credencial o ingrésalo manualmente
              </p>
            </div>
            <button type="button" className="btn-ghost btn-sm p-1.5" onClick={() => { setScannerActive(false); setScanResult(null); }}>
              <X size={16} />
            </button>
          </div>

          <ScanResult result={scanResult} />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
              <input
                ref={scanInputRef}
                type="text"
                className="field-input pl-9 font-mono"
                placeholder="Escanea o escribe el RUT y presiona Enter..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && scanInput.trim()) processScan(scanInput.trim()); }}
                autoComplete="off"
              />
            </div>
            <button className="btn-primary" onClick={() => { if (scanInput.trim()) processScan(scanInput.trim()); }}>
              Registrar
            </button>
          </div>

          <p className="text-xs text-slate-400">
            {todayCount} pastor{todayCount !== 1 ? "es" : ""} registrado{todayCount !== 1 ? "s" : ""} hoy en {jornada?.label}
          </p>
        </div>
      )}

      {/* Manual selection */}
      {isSelecting && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Registro manual · {jornada?.label} · hoy
              {selectedPastorIds.length > 0 && (
                <span className="ml-2 badge-info">{selectedPastorIds.length} seleccionado{selectedPastorIds.length !== 1 ? "s" : ""}</span>
              )}
            </h3>
            <button type="button" className="btn-ghost btn-sm p-1.5" onClick={() => { setIsSelecting(false); setSelectedPastorIds([]); }}>
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
              <input type="text" className="field-input pl-9" placeholder="Filtrar por nombre..." value={filterName} onChange={(e) => setFilterName(e.target.value)} />
            </div>
            <input type="text" className="field-input" placeholder="Filtrar por iglesia..." value={filterChurch} onChange={(e) => setFilterChurch(e.target.value)} />
          </div>

          <div className="table-wrapper max-h-64 overflow-y-auto">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input type="checkbox"
                      checked={filteredPastores.length > 0 && filteredPastores.every((p) => selectedPastorIds.includes(p.id))}
                      onChange={(e) => setSelectedPastorIds(e.target.checked ? filteredPastores.filter((p) => !alreadyCheckedIn.has(p.id)).map((p) => p.id) : [])}
                      className="rounded border-slate-300 accent-brand-600"
                    />
                  </th>
                  <th>Nombre</th>
                  <th>Iglesia</th>
                </tr>
              </thead>
              <tbody>
                {filteredPastores.map((p) => (
                  <tr key={p.id} className={`cursor-pointer ${alreadyCheckedIn.has(p.id) ? "opacity-40" : ""}`} onClick={() => !alreadyCheckedIn.has(p.id) && handleTogglePastor(p.id)}>
                    <td>
                      <input type="checkbox" checked={selectedPastorIds.includes(p.id)} onChange={() => handleTogglePastor(p.id)}
                        className="rounded border-slate-300 accent-brand-600" onClick={(e) => e.stopPropagation()} disabled={alreadyCheckedIn.has(p.id)} />
                    </td>
                    <td className="font-medium text-slate-900">
                      {p.nombre}
                      {alreadyCheckedIn.has(p.id) && <span className="ml-2 badge-success text-xs">Ya registrado hoy</span>}
                    </td>
                    <td className="text-slate-500">{p.iglesia || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button className="btn-secondary" onClick={() => { setIsSelecting(false); setSelectedPastorIds([]); }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSaveSelection} disabled={selectedPastorIds.length === 0}>
              <CheckSquare2 size={15} />
              Guardar asistencia ({selectedPastorIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Attendance table */}
      {jornada && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{visibleAsistencia.length}</span> registro{visibleAsistencia.length !== 1 ? "s" : ""} en {jornada.label}
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Fecha de asistencia
            <select className="field-input !w-auto py-1.5" value={viewDay} onChange={(e) => setViewDay(e.target.value)}>
              <option value={today}>Hoy ({formatDayKey(today)})</option>
              <option value={ALL_DAYS}>Todos los días</option>
              {daysWithRecords.filter((d) => d !== today).map((d) => <option key={d} value={d}>{formatDayKey(d)}</option>)}
            </select>
          </label>
        </div>
      )}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Pastor</th>
              <th>Iglesia</th>
              <th>Método</th>
              <th>Fecha y hora</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibleAsistencia.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-slate-900">{a.pastors?.full_name ?? "—"}</td>
                <td className="text-slate-500">{a.pastors?.churches?.name ?? "—"}</td>
                <td>
                  <span className={a.checkin_method === "barcode" ? "badge-info" : "badge-muted"}>
                    {a.checkin_method === "barcode" ? "Escáner" : a.checkin_method === "qr" ? "QR" : "Manual"}
                  </span>
                </td>
                <td className="text-slate-500 tabular-nums whitespace-nowrap">{formatCheckin(a.checked_in_at)}</td>
                <td><span className="badge-success">Presente</span></td>
              </tr>
            ))}
            {visibleAsistencia.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  {!jornada
                    ? "Selecciona un evento y una jornada para ver la asistencia."
                    : viewDay === ALL_DAYS ? `Todavía no hay asistencia en ${jornada.label}.`
                    : `No hay asistencia en ${jornada.label} ${viewDay === today ? "hoy" : `el ${formatDayKey(viewDay)}`}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
