import { useEffect, useState, useMemo } from "react";
import {
  Users, Building2, ClipboardCheck, Calendar, Clock,
  TrendingUp, Globe2, ArrowRight, Activity, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { useDashboard } from "@/lib/hooks";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { COUNTRIES } from "@/lib/geography";

/* ── Helpers ──────────────────────────────────────────────────────── */
function formatDate(dateIso) {
  if (!dateIso) return "-";
  return new Date(dateIso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(dateIso) {
  if (!dateIso) return "";
  return new Date(dateIso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function countryName(code) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

function tally(items, getter) {
  const map = new Map();
  for (const it of items) {
    const k = getter(it);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/* ── Status palette ──────────────────────────────────────────────── */
const STATUS_COLORS = {
  active: "#10b981", inactive: "#94a3b8", suspended: "#f59e0b",
  fallecido: "#64748b", descontinuado: "#f43f5e",
};
const STATUS_LABELS = {
  active: "Activos", inactive: "Inactivos", suspended: "Honorarios",
  fallecido: "Fallecidos", descontinuado: "Descontinuados",
};

/* ── KPI Card ────────────────────────────────────────────────────── */
const KPI_CONFIG = [
  { key: "pastors",          label: "Pastores",        icon: Users,         color: "text-blue-600",    bg: "bg-blue-50",    border: "border-l-[3px] border-blue-400",    iconBg: "from-blue-500 to-blue-600" },
  { key: "churches",         label: "Iglesias",        icon: Building2,     color: "text-violet-600",  bg: "bg-violet-50",  border: "border-l-[3px] border-violet-400",  iconBg: "from-violet-500 to-violet-600" },
  { key: "attendance_today", label: "Asistencia hoy",  icon: ClipboardCheck,color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-[3px] border-emerald-400", iconBg: "from-emerald-500 to-emerald-600" },
  { key: "active_events",    label: "Eventos activos", icon: Calendar,      color: "text-amber-600",   bg: "bg-amber-50",   border: "border-l-[3px] border-amber-400",   iconBg: "from-amber-500 to-amber-600" },
];

function KpiCard({ config, value, hint }) {
  const { label, icon: Icon, color, bg, border } = config;
  return (
    <div className={`card group relative overflow-hidden flex items-start gap-4 ${border} hover:shadow-md transition-shadow`}>
      {/* Subtle bg orb */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${bg} opacity-40 blur-xl pointer-events-none`} />

      <div className={`${bg} ${color} rounded-xl p-3 flex-shrink-0 relative`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1 relative">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="mt-0.5 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        {hint && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-500 flex-shrink-0" />
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="card flex items-start gap-4">
      <div className="rounded-xl p-3 bg-slate-100 flex-shrink-0 w-12 h-12 animate-pulse" />
      <div className="space-y-2 flex-1 pt-1">
        <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
        <div className="h-8 w-14 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

/* ── Custom tooltip ──────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color || entry.payload.fill }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHead({ icon: Icon, title, accent = "bg-brand-500", iconColor = "text-brand-500", action }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-[3px] h-4 rounded-full ${accent} flex-shrink-0`} />
        {Icon && <Icon size={15} className={iconColor} />}
        <h3 className="font-semibold text-brand-800 text-sm">{title}</h3>
      </div>
      {action}
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

/* ── Main ────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();
  const { profile } = useAuth();

  const [pastorsList, setPastorsList] = useState([]);
  const [pastorsLoading, setPastorsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listAllPastors();
        setPastorsList(list);
      } catch { /* silent — KPIs still work */ }
      finally { setPastorsLoading(false); }
    })();
  }, []);

  const counts = data?.counts ?? { pastors: 0, churches: 0, attendance_today: 0, active_events: 0 };

  /* ── Derived stats ── */
  const { byStatus, byCountry, activePastors, distinctCountries } = useMemo(() => {
    const byStatus = tally(pastorsList, (p) => p.pastoral_status)
      .map((d) => ({ ...d, key: d.name, name: STATUS_LABELS[d.name] ?? d.name, color: STATUS_COLORS[d.name] }));
    const byCountry = tally(pastorsList, (p) => p.country)
      .slice(0, 6)
      .map((d) => ({ ...d, name: countryName(d.name) }));
    const activePastors = pastorsList.filter((p) => p.pastoral_status === "active").length;
    const distinctCountries = new Set(pastorsList.map((p) => p.country).filter(Boolean)).size;
    return { byStatus, byCountry, activePastors, distinctCountries };
  }, [pastorsList]);

  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const today = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* ── Welcome banner ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white px-6 py-5 shadow-lg">
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-20 w-32 h-32 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium uppercase tracking-wider">
              <Sparkles size={13} />
              <span>{today}</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight">
              {greeting()}{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="mt-1 text-white/80 text-sm">Resumen general de la plataforma</p>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-medium flex items-center gap-1.5">
              <Activity size={12} />
              <span>{counts.active_events} evento{counts.active_events !== 1 ? "s" : ""} activo{counts.active_events !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading && !data
          ? KPI_CONFIG.map(({ key }) => <KpiSkeleton key={key} />)
          : KPI_CONFIG.map((cfg) => {
              let hint = null;
              if (cfg.key === "pastors")  hint = activePastors ? `${activePastors} activos` : null;
              if (cfg.key === "churches") hint = distinctCountries ? `${distinctCountries} país${distinctCountries !== 1 ? "es" : ""}` : null;
              return <KpiCard key={cfg.key} config={cfg} value={counts[cfg.key]} hint={hint} />;
            })}
      </div>

      {/* ── Mini charts row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pastors by status — donut */}
        <div className="card space-y-3">
          <SectionHead icon={Users} title="Distribución de pastores" accent="bg-brand-500" iconColor="text-brand-500" />
          {pastorsLoading ? (
            <div className="rounded-xl bg-slate-100 animate-pulse h-[220px]" />
          ) : byStatus.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">Sin datos</p>
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={48} outerRadius={78} paddingAngle={2} strokeWidth={2} stroke="#fff">
                    {byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color || "#0a6ed1"} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{pastorsList.length}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 justify-center">
                {byStatus.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    <span className="text-slate-600">{entry.name}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top countries — horizontal bars */}
        <div className="card space-y-3">
          <SectionHead icon={Globe2} title="Top países" accent="bg-cyan-500" iconColor="text-cyan-500" />
          {pastorsLoading ? (
            <div className="rounded-xl bg-slate-100 animate-pulse h-[220px]" />
          ) : byCountry.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCountry} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashCountryGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0a6ed1" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} width={100} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(10,110,209,0.06)" }} />
                <Bar dataKey="value" name="Pastores" fill="url(#dashCountryGrad)" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "#0a6ed1", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Activity panels ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming events */}
        <div className="card space-y-4">
          <SectionHead icon={Calendar} title="Próximos eventos" accent="bg-brand-500" iconColor="text-brand-500" />
          {isLoading && !data ? <ListSkeleton rows={3} /> : (
            <div className="space-y-2">
              {(data?.upcoming_events ?? []).length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No hay eventos programados.</p>
                </div>
              ) : (
                (data?.upcoming_events ?? []).map((event) => {
                  const d = new Date(event.starts_at);
                  return (
                    <div key={event.id} className="group flex items-center justify-between gap-3 py-2.5 px-3 -mx-3 rounded-xl border border-transparent hover:border-brand-100 hover:bg-brand-50/40 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200/60">
                          <span className="text-[10px] font-semibold text-brand-600 uppercase leading-none">
                            {d.toLocaleDateString("es-CL", { month: "short" }).replace(".", "")}
                          </span>
                          <span className="text-base font-bold text-brand-800 leading-none mt-0.5">
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
                          <p className="text-xs text-slate-500">{formatDate(event.starts_at)}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Latest attendance */}
        <div className="card space-y-4">
          <SectionHead icon={Clock} title="Última asistencia registrada" accent="bg-emerald-500" iconColor="text-emerald-500" />
          {isLoading && !data ? <ListSkeleton rows={3} /> : (
            <div className="space-y-1">
              {(data?.latest_attendance ?? []).length === 0 ? (
                <div className="py-8 text-center">
                  <ClipboardCheck size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No hay asistencia registrada.</p>
                </div>
              ) : (
                (data?.latest_attendance ?? []).map((item, idx, arr) => (
                  <div key={item.id} className="relative flex items-start gap-3 py-2.5">
                    {/* Timeline dot + line */}
                    <div className="relative flex-shrink-0 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      {idx < arr.length - 1 && <span className="absolute top-3 w-px h-full bg-emerald-100" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.pastor_name}</p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">{formatTime(item.checked_in_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="badge-info text-[10px]">{item.session_label}</span>
                        <p className="text-xs text-slate-500 truncate">{item.event_title}</p>
                      </div>
                    </div>
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
