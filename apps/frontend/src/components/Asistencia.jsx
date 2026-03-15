import { useState, useMemo } from "react";

// Para la maqueta: lista de pastores disponible para marcar asistencia
const PASTORES = [
  { id: 1, nombre: "Carlos Pérez", iglesia: "Iglesia Central" },
  { id: 2, nombre: "Meda Zehata", iglesia: "Iglesia Norte" },
  { id: 3, nombre: "Juan Morales", iglesia: "Iglesia Sur" },
  { id: 4, nombre: "Ana López", iglesia: "Iglesia Oriente" },
];

export default function Asistencia() {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSession, setSelectedSession] = useState("");

  // Tabla final de asistencia registrada
  const [asistencia, setAsistencia] = useState([]);

  // Estado del panel de selección manual
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedPastorIds, setSelectedPastorIds] = useState([]);

  // Filtros dentro del panel
  const [filterName, setFilterName] = useState("");
  const [filterChurch, setFilterChurch] = useState("");

  // Filtrado de pastores por nombre e iglesia
  const filteredPastores = useMemo(() => {
    const name = filterName.toLowerCase();
    const church = filterChurch.toLowerCase();
    return PASTORES.filter((p) => {
      const matchesName = p.nombre.toLowerCase().includes(name);
      const matchesChurch = p.iglesia.toLowerCase().includes(church);
      return matchesName && matchesChurch;
    });
  }, [filterName, filterChurch]);

  const handleTogglePastor = (id) => {
    setSelectedPastorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenSelection = () => {
    setIsSelecting(true);
    setSelectedPastorIds([]);
    setFilterName("");
    setFilterChurch("");
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    setSelectedPastorIds([]);
  };

  const handleSaveSelection = () => {
    const seleccionados = PASTORES.filter((p) =>
      selectedPastorIds.includes(p.id)
    );

    // Evitar duplicar registros del mismo pastor
    const nuevos = seleccionados.filter(
      (p) => !asistencia.some((a) => a.nombre === p.nombre)
    );

    const registros = nuevos.map((p) => ({
      id: `${p.id}-${Date.now()}`,
      nombre: p.nombre,
      iglesia: p.iglesia,
      resultado: "Asistencia correcta",
    }));

    setAsistencia((prev) => [...prev, ...registros]);
    setIsSelecting(false);
    setSelectedPastorIds([]);
  };

  return (
    <div className="page-main">
      <h2 className="section-title">Control de Asistencia</h2>

      {/* Filtros superiores: Evento - Fecha - Sesión */}
      <div className="flex gap-3" style={{ marginBottom: "1rem" }}>
        {/* Evento */}
        <select
          className="field-input"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="">Seleccionar evento</option>
          <option value="Conferencia">Conferencia</option>
          <option value="Estudio">Estudio</option>
        </select>

        {/* Fecha */}
        <input
          type="date"
          className="field-input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {/* Sesión */}
        <select
          className="field-input"
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
        >
          <option value="">Seleccionar sesión</option>
          <option value="AM">Sesión AM</option>
          <option value="PM">Sesión PM</option>
        </select>
      </div>

      {/* Botón para abrir el panel de selección */}
      <button className="btn-primary" onClick={handleOpenSelection}>
        Registrar asistencia
      </button>

      {/* Panel / frame para selección manual de pastores */}
      {isSelecting && (
        <div className="card" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Registrar asistencia manual</h3>

          {/* Filtros dentro del panel */}
          <div className="flex gap-3" style={{ marginBottom: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label className="field-label">Filtrar por nombre</label>
              <input
                type="text"
                className="field-input"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ej: Carlos"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">Filtrar por iglesia</label>
              <input
                type="text"
                className="field-input"
                value={filterChurch}
                onChange={(e) => setFilterChurch(e.target.value)}
                placeholder="Ej: Central"
              />
            </div>
          </div>

          {/* Lista de pastores */}
          <div className="card" style={{ maxHeight: "260px", overflowY: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
                  <th>Nombre</th>
                  <th>Iglesia</th>
                </tr>
              </thead>
              <tbody>
                {filteredPastores.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPastorIds.includes(p.id)}
                        onChange={() => handleTogglePastor(p.id)}
                      />
                    </td>
                    <td>{p.nombre}</td>
                    <td>{p.iglesia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botones del panel */}
          <div
            className="flex justify-end gap-2"
            style={{ marginTop: "0.75rem" }}
          >
            <button className="btn-secondary" onClick={handleCancelSelection}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleSaveSelection}
              disabled={selectedPastorIds.length === 0}
            >
              Guardar asistencia
            </button>
          </div>
        </div>
      )}

      {/* Tabla principal con resultados de asistencia */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Iglesia</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {asistencia.map((a) => (
              <tr key={a.id}>
                <td>{a.nombre}</td>
                <td>{a.iglesia}</td>
                <td>
                  <span className="badge-success">{a.resultado}</span>
                </td>
              </tr>
            ))}
            {asistencia.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "1rem" }}>
                  No hay asistencia registrada aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
