import { useState } from "react";

const ESTADOS = ["Planeado", "Activo", "Finalizado", "Cancelado"];

export default function Events() {
  // Datos de ejemplo para la maqueta
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "Conferencia",
      startDate: "20/11/2025",
      endDate: "22/11/2025",
      status: "Activo",
    },
    {
      id: 2,
      name: "Estudio",
      startDate: "10/01/2026",
      endDate: "12/01/2026",
      status: "Planeado",
    },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creando
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "Planeado",
  });

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      startDate: "",
      endDate: "",
      status: "Planeado",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (event) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      startDate: event.startDate, // si luego cambias formato, ajustas aquí
      endDate: event.endDate,
      status: event.status,
    });
    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({
      name: "",
      startDate: "",
      endDate: "",
      status: "Planeado",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;

    if (editingId) {
      // Editar evento existente
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingId
            ? {
                ...ev,
                name: form.name,
                startDate: form.startDate,
                endDate: form.endDate,
                status: form.status,
              }
            : ev
        )
      );
    } else {
      // Crear evento nuevo
      const newEvent = {
        id: Date.now(),
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    handleCancel();
  };

  return (
    <div className="page-main">
      {/* Ojo: aquí solo mostramos “Eventos”.
          El título general “Plataforma Pastores” y el botón Cerrar sesión
          deben ir en tu layout principal, no aquí. */}

      <h2 className="section-title">Eventos</h2>

      <button className="btn-primary" onClick={openCreateForm}>
        Crear evento
      </button>

      {/* Formulario de crear / editar */}
      {isFormOpen && (
        <div className="card" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>
            {editingId ? "Editar evento" : "Nuevo evento"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="form-grid"
            style={{ display: "grid", gap: "0.75rem", maxWidth: "520px" }}
          >
            <div>
              <label className="field-label">Nombre</label>
              <input
                type="text"
                name="name"
                className="field-input"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Conferencia Nacional"
              />
            </div>

            <div>
              <label className="field-label">Fecha inicio</label>
              <input
                type="date"
                name="startDate"
                className="field-input"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="field-label">Fecha fin</label>
              <input
                type="date"
                name="endDate"
                className="field-input"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="field-label">Estado</label>
              <select
                name="status"
                className="field-input"
                value={form.status}
                onChange={handleChange}
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de eventos */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>Estado</th>
              <th style={{ width: "130px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.name}</td>
                <td>{ev.startDate}</td>
                <td>{ev.endDate}</td>
                <td>{ev.status}</td>
                <td>
                  <button
                    className="btn-link"
                    type="button"
                    onClick={() => openEditForm(ev)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
