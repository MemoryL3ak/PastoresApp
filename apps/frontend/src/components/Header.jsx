export default function Header({ onLogout }) {
  return (
    <header className="header">
      <div>
        <h1 className="header-title">Plataforma Pastores</h1>
        <p className="header-subtitle">
          Gestión de pastores, credenciales y control de asistencia.
        </p>
      </div>
      <button className="btn-secondary" onClick={onLogout}>
        Cerrar sesión
      </button>
    </header>
  );
}
