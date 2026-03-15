export default function Dashboard() {
  return (
    <div>
      <h2 className="view-title">Dashboard</h2>

      <div className="cards-grid">
        <div className="card">
          <p className="card-label">Pastores registrados</p>
          <p className="card-value">450</p>
        </div>
        <div className="card">
          <p className="card-label">Iglesias</p>
          <p className="card-value">120</p>
        </div>
        <div className="card">
          <p className="card-label">Asistencia hoy</p>
          <p className="card-value">300</p>
        </div>
        <div className="card">
          <p className="card-label">Eventos activos</p>
          <p className="card-value">3</p>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="panel">
          <h3>Próximos eventos</h3>
          <ul className="simple-list">
            <li>Conferencia Internacional de Pastores– 15/02/2026</li>
            <li>Estudio Biblico – 10/10/2026</li>
          </ul>
        </div>
        <div className="panel">
          <h3>Última asistencia registrada</h3>
          <ul className="simple-list">
            <li>Carlos Pérez – Conferencia Internacional – Sesión AM</li>
            <li>Ramón Arriagada – Conferencia Internacional – Sesión PM</li>
            <li>Juan Díaz – Conferencia Internacional – Única sesión</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
