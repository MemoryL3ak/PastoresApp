const MENU = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "pastores", label: "Gestión de Pastores", icon: "👤" },
  { id: "eventos", label: "Eventos", icon: "📅" },
  { id: "asistencia", label: "Asistencia", icon: "✅" },
  { id: "reportes", label: "Reportes", icon: "📊" },
  { id: "config", label: "Configuración", icon: "⚙️" },
];



export default function Sidebar({ currentView, onChangeView }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Pastores</div>
      <nav className="sidebar-menu">
        {MENU.map((item) => (
          <button
            key={item.id}
            className={
              "sidebar-item" + (currentView === item.id ? " active" : "")
            }
            onClick={() => onChangeView(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
