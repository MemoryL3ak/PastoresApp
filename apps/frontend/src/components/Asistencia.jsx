import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardCheck, Search, X, CheckSquare2, ScanBarcode, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/* ── Barcode scanner hook ──────────────────────────────────────── */
// Physical barcode scanners type very fast (< 50ms/char) then press Enter.
// This hook captures that pattern globally.
function useBarcodeScanner({ enabled, onScan }) {
  const buffer = useRef("");
  const lastTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
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
  }, [enabled, onScan]);
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
export default function Asistencia() {
  const { canEdit } = useAuth();
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pastores, setPastores] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
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
    if (!selectedEvent) { setSessions([]); setSelectedSession(""); return; }
    (async () => {
      try {
        const sessionData = await api.listEventSessions(selectedEvent);
        setSessions(sessionData);
        setSelectedSession(sessionData[0]?.id ?? "");
      } catch (err) { setError(err.message || "No se pudieron cargar sesiones"); }
    })();
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedSession) { setAsistencia([]); return; }
    (async () => {
      try { setAsistencia(await api.listAttendanceBySession(selectedSession)); }
      catch (err) { setError(err.message || "No se pudo cargar asistencia"); }
    })();
  }, [selectedSession]);

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

  const alreadyCheckedIn = useMemo(() =>
    new Set(asistencia.map((a) => a.pastors?.id).filter(Boolean)),
    [asistencia]
  );

  const showScanResult = (type, message) => {
    setScanResult({ type, message });
    clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => setScanResult(null), 4000);
  };

  const processScan = useCallback(async (code) => {
    if (!selectedSession) {
      showScanResult("error", "Selecciona una sesión antes de escanear.");
      return;
    }
    // Match by RUT (document_number) — strips formatting for flexible match
    const clean = (s) => s.replace(/[.\-\s]/g, "").toLowerCase();
    const pastor = normalizedPastores.find((p) => clean(p.rut) === clean(code));

    if (!pastor) {
      showScanResult("error", `Código "${code}" no corresponde a ningún pastor registrado.`);
      setScanInput("");
      return;
    }

    if (alreadyCheckedIn.has(pastor.id)) {
      showScanResult("error", `${pastor.nombre} ya tiene asistencia registrada.`);
      setScanInput("");
      return;
    }

    try {
      await api.checkinAttendance({
        event_session_id: selectedSession,
        pastor_id: pastor.id,
        checkin_method: "barcode",
      });
      setAsistencia(await api.listAttendanceBySession(selectedSession));
      showScanResult("success", `✓ Asistencia registrada: ${pastor.nombre} — ${pastor.iglesia || "sin iglesia"}`);
    } catch (err) {
      showScanResult("error", err.message || "Error al registrar asistencia.");
    }
    setScanInput("");
    scanInputRef.current?.focus();
  }, [selectedSession, normalizedPastores, alreadyCheckedIn]);

  // Global keyboard capture for physical scanners
  useBarcodeScanner({ enabled: scannerActive, onScan: processScan });

  // Focus input when scanner mode activates
  useEffect(() => {
    if (scannerActive) setTimeout(() => scanInputRef.current?.focus(), 50);
  }, [scannerActive]);

  const handleTogglePastor = (id) => {
    setSelectedPastorIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSaveSelection = async () => {
    if (!selectedSession || selectedPastorIds.length === 0) return;
    try {
      await Promise.all(
        selectedPastorIds.map((pastorId) =>
          api.checkinAttendance({ event_session_id: selectedSession, pastor_id: pastorId, checkin_method: "manual" })
        )
      );
      setAsistencia(await api.listAttendanceBySession(selectedSession));
      setIsSelecting(false);
      setSelectedPastorIds([]);
      setError("");
    } catch (err) { setError(err.message || "No se pudo registrar asistencia"); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="view-title">Control de Asistencia</h2>
        <p className="mt-0.5 text-sm text-slate-500">Selecciona un evento y sesión para gestionar la asistencia</p>
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
            Sesión
            <select className="field-input" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} disabled={!selectedEvent}>
              <option value="">Seleccionar sesión...</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={() => { setIsSelecting(true); setScannerActive(false); setSelectedPastorIds([]); setFilterName(""); setFilterChurch(""); }} disabled={!selectedSession}>
              <ClipboardCheck size={16} />
              Registro manual
            </button>
            <button
              className={`btn-primary gap-2 ${scannerActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              onClick={() => { setScannerActive((v) => !v); setIsSelecting(false); setScanResult(null); }}
              disabled={!selectedSession}
            >
              <ScanBarcode size={16} />
              {scannerActive ? "Escáner activo" : "Escanear código"}
            </button>
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
            {asistencia.length} pastor{asistencia.length !== 1 ? "es" : ""} registrado{asistencia.length !== 1 ? "s" : ""} en esta sesión
          </p>
        </div>
      )}

      {/* Manual selection */}
      {isSelecting && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Registro manual
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
                      onChange={(e) => setSelectedPastorIds(e.target.checked ? filteredPastores.map((p) => p.id) : [])}
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
                      {alreadyCheckedIn.has(p.id) && <span className="ml-2 badge-success text-xs">Ya registrado</span>}
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
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Pastor</th>
              <th>Iglesia</th>
              <th>Método</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asistencia.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-slate-900">{a.pastors?.full_name ?? "—"}</td>
                <td className="text-slate-500">{a.pastors?.churches?.name ?? "—"}</td>
                <td>
                  <span className={a.checkin_method === "barcode" ? "badge-info" : "badge-muted"}>
                    {a.checkin_method === "barcode" ? "Escáner" : a.checkin_method === "qr" ? "QR" : "Manual"}
                  </span>
                </td>
                <td><span className="badge-success">Presente</span></td>
              </tr>
            ))}
            {asistencia.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                  {selectedSession ? "No hay asistencia registrada para esta sesión." : "Selecciona un evento y sesión para ver la asistencia."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
