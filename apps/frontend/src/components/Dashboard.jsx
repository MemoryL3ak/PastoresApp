import { Users, Building2, ClipboardCheck, Calendar, Clock } from "lucide-react";
import { useDashboard } from "@/lib/hooks";

function formatDate(dateIso) {
  if (!dateIso) return "-";
  return new Date(dateIso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const KPI_CONFIG = [
  { key: "pastors",          label: "Pastores",         icon: Users,         color: "text-blue-600",    bg: "bg-blue-50",    border: "border-l-[3px] border-blue-400"    },
  { key: "churches",         label: "Iglesias",         icon: Building2,     color: "text-violet-600",  bg: "bg-violet-50",  border: "border-l-[3px] border-violet-400"  },
  { key: "attendance_today", label: "Asistencia hoy",   icon: ClipboardCheck,color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-[3px] border-emerald-400" },
  { key: "active_events",    label: "Eventos activos",  icon: Calendar,      color: "text-amber-600",   bg: "bg-amber-50",   border: "border-l-[3px] border-amber-400"   },
];

function KpiSkeleton() {
  return (
    <div className="card flex items-start gap-4">
      <div className="rounded-xl p-3 bg-slate-100 flex-shrink-0 w-12 h-12 animate-pulse" />
      <div className="space-y-2 flex-1 pt-1">
        <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
        <div className="h-8 w-14 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
          <div className="h-3 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();

  const counts = data?.counts ?? { pastors: 0, churches: 0, attendance_today: 0, active_events: 0 };

  return (
    <div className="space-y-6">
      <div className="view-header">
        <div>
          <h2 className="view-title">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500">Resumen general de la plataforma</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading && !data
          ? KPI_CONFIG.map(({ key }) => <KpiSkeleton key={key} />)
          : KPI_CONFIG.map(({ key, label, icon: Icon, color, bg, border }) => (
              <div key={key} className={`card flex items-start gap-4 ${border}`}>
                <div className={`${bg} ${color} rounded-xl p-3 flex-shrink-0`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500 font-medium">{label}</p>
                  <p className="mt-0.5 text-3xl font-bold text-slate-900 tabular-nums">{counts[key]}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-4 rounded-full bg-brand-500 flex-shrink-0" />
            <Calendar size={15} className="text-brand-500" />
            <h3 className="font-semibold text-brand-800 text-sm">Próximos eventos</h3>
          </div>
          {isLoading && !data ? <ListSkeleton rows={3} /> : (
            <div className="space-y-2">
              {(data?.upcoming_events ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No hay eventos programados.</p>
              ) : (
                (data?.upcoming_events ?? []).map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-800">{event.title}</span>
                    </div>
                    <span className="text-xs text-slate-400 ml-4 flex-shrink-0">{formatDate(event.starts_at)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-4 rounded-full bg-emerald-500 flex-shrink-0" />
            <Clock size={15} className="text-emerald-500" />
            <h3 className="font-semibold text-brand-800 text-sm">Última asistencia registrada</h3>
          </div>
          {isLoading && !data ? <ListSkeleton rows={3} /> : (
            <div className="space-y-2">
              {(data?.latest_attendance ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No hay asistencia registrada.</p>
              ) : (
                (data?.latest_attendance ?? []).map((item) => (
                  <div key={item.id} className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.pastor_name}</p>
                      <p className="text-xs text-slate-400 truncate">{item.event_title}</p>
                    </div>
                    <span className="badge-info flex-shrink-0">{item.session_label}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
