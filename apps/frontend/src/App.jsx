// src/App.jsx
import { useEffect, useState } from "react";
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
import { api } from "./lib/api";
import "./styles.css";

export default function App() {
  const [isLogged, setIsLogged] = useState(true); // maqueta
  const [view, setView] = useState("dashboard");
  const [selectedPastor, setSelectedPastor] = useState(null);
  const [pastores, setPastores] = useState([]);
  const [churches, setChurches] = useState([]);
  const [error, setError] = useState("");
  const churchById = new Map(churches.map((c) => [c.id, c.name]));
  const pastoresView = pastores.map((p) => ({
    id: p.id,
    nombre: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    rut: p.document_number ?? "",
    church_id: p.church_id,
    iglesia: p.churches?.name ?? churchById.get(p.church_id) ?? "",
    estado: p.pastoral_status === "inactive" ? "Inactivo" : "Activo"
  }));

  const loadBaseData = async () => {
    try {
      const [pastorsData, churchesData] = await Promise.all([
        api.listAllPastors(),
        api.listAllChurches()
      ]);
      setPastores(pastorsData);
      setChurches(churchesData);
      setError("");
    } catch (err) {
      setError(err.message || "No se pudo cargar informacion");
    }
  };

  useEffect(() => {
    void (async () => {
      await loadBaseData();
    })();
  }, []);

  const handleEditPastor = (pastor) => {
    setSelectedPastor(pastor);
    setView("pastorForm");
  };

  const handleSavePastor = async (pastorData) => {
    const fullName = pastorData.nombre.trim();
    const parts = fullName.split(" ");
    const firstName = parts.shift() ?? "";
    const lastName = parts.join(" ") || firstName;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      document_number: pastorData.rut,
      church_id: pastorData.church_id,
      pastoral_status: pastorData.estado === "Inactivo" ? "inactive" : "active"
    };

    try {
      if (pastorData.id) {
        await api.updatePastor(pastorData.id, payload);
      } else {
        await api.createPastor(payload);
      }
      await loadBaseData();
      setSelectedPastor(null);
      setView("pastores");
      setError("");
    } catch (err) {
      setError(err.message || "No se pudo guardar el pastor");
    }
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
          {error && <div className="alert-error mb-4">{error}</div>}
          {view === "dashboard" && <Dashboard />}

          {view === "pastores" && (
            <PastoresList
              pastores={pastoresView}
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
              churches={churches}
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
