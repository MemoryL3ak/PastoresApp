// src/App.jsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import PastoresList from "./components/PastoresList";
import PastorForm from "./components/PastorForm";
import Eventos from "./components/Eventos";
import Asistencia from "./components/Asistencia";
import Reportes from "./components/Reportes";
import Configuracion from "./components/Configuracion";
import Login from "./components/Login";
import initialPastores from "./mockPastores";
import "./styles.css";

export default function App() {
  const [isLogged, setIsLogged] = useState(true); // maqueta
  const [view, setView] = useState("dashboard");
  const [selectedPastor, setSelectedPastor] = useState(null);
  const [pastores, setPastores] = useState(initialPastores);

  const handleEditPastor = (pastor) => {
    setSelectedPastor(pastor);
    setView("pastorForm");
  };

  const handleSavePastor = (pastorData) => {
    if (pastorData.id) {
      setPastores((prev) =>
        prev.map((p) => (p.id === pastorData.id ? { ...p, ...pastorData } : p))
      );
    } else {
      const newId =
        pastores.length > 0 ? Math.max(...pastores.map((p) => p.id)) + 1 : 1;
      setPastores((prev) => [...prev, { ...pastorData, id: newId }]);
    }

    setSelectedPastor(null);
    setView("pastores");
  };

  if (!isLogged) {
    return <Login onLogin={() => setIsLogged(true)} />;
  }

  return (
    <div className="app">
      <Sidebar currentView={view} onChangeView={setView} />
      <div className="app-main">
        <Header onLogout={() => setIsLogged(false)} />
        <div className="app-content">
          {view === "dashboard" && <Dashboard />}

          {view === "pastores" && (
            <PastoresList
              pastores={pastores}
              onEditPastor={handleEditPastor}
              onAddPastor={() => {
                setSelectedPastor(null);
                setView("pastorForm");
              }}
            />
          )}

          {view === "pastorForm" && (
            <PastorForm
              pastor={selectedPastor}
              onBack={() => {
                setSelectedPastor(null);
                setView("pastores");
              }}
              onSave={handleSavePastor}
            />
          )}

          {view === "eventos" && <Eventos />}
          {view === "asistencia" && <Asistencia />}
          {view === "reportes" && <Reportes />}
          {view === "config" && <Configuracion />}
        </div>
      </div>
    </div>
  );
}
