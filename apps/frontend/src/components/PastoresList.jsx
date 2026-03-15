// src/components/PastoresList.jsx

export default function PastoresList({ pastores, onEditPastor, onAddPastor }) {
  return (
    <div>
      <div className="view-header">
        <h2 className="view-title">Gestión de Pastores</h2>
        <button className="btn-primary" onClick={onAddPastor}>
          Agregar Pastor
        </button>
      </div>

      <div className="filters-row">
        <input
          className="field-input"
          placeholder="Buscar por nombre..."
        />
        <select className="field-input">
          <option value="">Todas las iglesias</option>
          <option>Iglesia Central</option>
          <option>Iglesia Norte</option>
          <option>Iglesia Sur</option>
        </select>
        <select className="field-input">
          <option value="">Todos los estados</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>RUT</th>
              <th>Nombre</th>
              <th>Iglesia</th>
              <th>Estado</th>
              <th style={{ width: "120px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pastores.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.nombre}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#e5e7eb",
                      }}
                    />
                  )}
                </td>
                <td>{p.rut}</td>
                <td>{p.nombre}</td>
                <td>{p.iglesia}</td>
                <td>
                  <span
                    className={
                      p.estado === "Activo"
                        ? "badge badge-success"
                        : "badge badge-muted"
                    }
                  >
                    {p.estado}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-link"
                    onClick={() => onEditPastor(p)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {pastores.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  No hay pastores registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
