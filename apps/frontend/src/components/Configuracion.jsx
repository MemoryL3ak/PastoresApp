import { useState } from "react";
import { Building2, Users, SlidersHorizontal, ExternalLink } from "lucide-react";
import CredentialTemplates from "./CredentialTemplates";

const TABS = [
  { id: "general",      label: "General" },
  { id: "credenciales", label: "Plantillas de credenciales" },
];

const SETTINGS_CARDS = [
  {
    icon: Building2,
    title: "Iglesias",
    description: "Administra las iglesias disponibles para asociar a cada pastor.",
    action: "Ver iglesias",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Users,
    title: "Usuarios",
    description: "Define quién puede acceder a la plataforma y sus permisos.",
    action: "Gestionar usuarios",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: SlidersHorizontal,
    title: "Parámetros del sistema",
    description: "Configura opciones generales como formato de credencial o logo.",
    action: "Editar parámetros",
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
];

export default function Configuracion() {
  const [tab, setTab] = useState("general");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="view-title">Configuración</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Administra la plataforma y sus parámetros
        </p>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-item${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SETTINGS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="card flex flex-col gap-4">
                <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-sm">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <button className="btn-secondary btn-sm self-start gap-1.5">
                  {card.action}
                  <ExternalLink size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "credenciales" && <CredentialTemplates />}
    </div>
  );
}
