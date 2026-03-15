import { useState } from "react";
import CredentialTemplates from "./CredentialTemplates";

export default function Configuracion() {
  const [tab, setTab] = useState("general"); // "general" | "credenciales"

  return (
    <div>
      <h2 className="view-title">Configuración</h2>

      <div className="filters-row" style={{ marginBottom: 16 }}>
        <button
          className={
            "btn-secondary" + (tab === "general" ? " active-tab" : "")
          }
          onClick={() => setTab("general")}
        >
          General
        </button>
        <button
          className={
            "btn-secondary" + (tab === "credenciales" ? " active-tab" : "")
          }
          onClick={() => setTab("credenciales")}
        >
          Plantillas de credenciales
        </button>
      </div>

      {tab === "general" && (
        <div className="settings-grid">
          <div className="panel">
            <h3>Iglesias</h3>
            <p className="panel-text">
              Administra las iglesias disponibles para asociar a cada pastor.
            </p>
            <button className="btn-secondary">Ver iglesias</button>
          </div>

          <div className="panel">
            <h3>Usuarios</h3>
            <p className="panel-text">
              Define quién puede acceder a la plataforma y sus permisos.
            </p>
            <button className="btn-secondary">Gestionar usuarios</button>
          </div>

          <div className="panel">
            <h3>Parámetros del sistema</h3>
            <p className="panel-text">
              Configura opciones generales como formato de credencial o logo.
            </p>
            <button className="btn-secondary">Editar parámetros</button>
          </div>
        </div>
      )}

      {tab === "credenciales" && <CredentialTemplates />}
    </div>
  );
}
