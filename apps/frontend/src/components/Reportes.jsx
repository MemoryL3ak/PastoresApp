import { useEffect, useMemo, useState } from "react";
import {
  Download, Users, Building2, Globe2, CalendarCheck,
  TrendingUp, FileSpreadsheet, Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList,
} from "recharts";
import { api } from "@/lib/api";
import { COUNTRIES } from "@/lib/geography";
import { exportToCSV } from "@/lib/csv";

/* ── Color palette ──────────────────────────────────────────────────── */
const CHART_COLORS = ["#0a6ed1", "#3b82f6", "#60a5fa", "#93c5fd", "#a78bfa", "#34d399", "#f59e0b", "#f43f5e", "#06b6d4", "#94a3b8"];
const STATUS_COLORS = {
  active:        "#10b981",
  inactive:      "#94a3b8",
  suspended:     "#f59e0b",
  fallecido:     "#64748b",
  descontinuado: "#f43f5e",
};
const STATUS_LABELS = {
  active:        "Activos",
  inactive:      "Inactivos",
  suspended:     "Honorarios",
  fallecido:     "Fallecidos",
  descontinuado: "Descontinuados",
};

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDate(dateIso) {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function tally(items, getter) {
  const map = new Map();
  for (const item of items) {
    const key = getter(item);
    if (key === null || key === undefined || key === "") continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function countryName(code) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/* ── Reusable bits ──────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, trend, color, bg, border }) {
  return (
    <div className={`card flex items-start gap-4 ${border}`}>
      <div className={`${bg} ${color} rounded-xl p-3 flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="mt-0.5 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        {trend && (
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, accent = "bg-brand-500", actions }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-[3px] h-4 rounded-full ${accent} flex-shrink-0`} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-brand-800 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color || entry.payload.fill }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut with center stat ─────────────────────────────────────────── */
function DonutChart({ data, total, height = 260 }) {
  if (!data?.length) {
    return <div className="text-center text-sm text-slate-400 py-12">Sin datos</div>;
  }
  return (
    <div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              strokeWidth={2}
              stroke="#fff"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{total}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Total</p>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color || CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-slate-600">{entry.name}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────── */
function ChartSkeleton({ height = 260 }) {
  return <div className="rounded-xl bg-slate-100 animate-pulse" style={{ height }} />;
}

/* ── Main module ───────────────────────────────────────────────────── */
export default function Reportes() {
  const [pastors, setPastors]               = useState([]);
  const [churches, setChurches]             = useState([]);
  const [events, setEvents]                 = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [attendance, setAttendance]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");

  /* ── Load all data once ── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [pas, ch, ev] = await Promise.all([
          api.listAllPastors(),
          api.listAllChurches(),
          api.listEvents(),
        ]);
        setPastors(pas);
        setChurches(ch);
        setEvents(ev);
        if (ev[0]) setSelectedEventId(ev[0].id);
        setError("");
      } catch (err) {
        setError(err.message || "No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Load attendance when event changes ── */
  useEffect(() => {
    if (!selectedEventId) { setAttendance([]); return; }
    (async () => {
      try {
        const data = await api.getAttendanceSummaryByEvent(selectedEventId);
        setAttendance(data);
      } catch (err) {
        setError(err.message || "No se pudo cargar la asistencia");
      }
    })();
  }, [selectedEventId]);

  /* ── Aggregations (memoized) ── */
  const stats = useMemo(() => {
    const totalPastors    = pastors.length;
    const totalChurches   = churches.length;
    const activePastors   = pastors.filter((p) => p.pastoral_status === "active").length;
    const distinctCountries = new Set(
      [...pastors.map((p) => p.country), ...churches.map((c) => c.country)].filter(Boolean)
    ).size;

    // Status distribution
    const byStatus = tally(pastors, (p) => p.pastoral_status)
      .map((d) => ({ ...d, name: STATUS_LABELS[d.name] ?? d.name, key: d.name, color: STATUS_COLORS[d.name] }));

    // Degree title distribution (normalize whitespace, group "Sin grado")
    const byDegree = tally(pastors, (p) => (p.degree_title || "Sin grado").replace(/\s+/g, " ").trim())
      .slice(0, 8);

    // Country distribution (top 10)
    const byCountry = tally(pastors, (p) => p.country)
      .slice(0, 10)
      .map((d) => ({ ...d, name: countryName(d.name) }));

    // Churches by country
    const churchesByCountry = tally(churches, (c) => c.country)
      .slice(0, 10)
      .map((d) => ({ ...d, name: countryName(d.name) }));

    return { totalPastors, totalChurches, activePastors, distinctCountries, byStatus, byDegree, byCountry, churchesByCountry };
  }, [pastors, churches]);

  const totalAttendees = attendance.reduce((s, r) => s + (r.attendance_count ?? 0), 0);
  const selectedEvent  = events.find((e) => e.id === selectedEventId);

  /* ── Export handlers ── */
  const exportPastors = () => {
    exportToCSV("pastores", pastors, [
      { key: "first_name",      label: "Nombres" },
      { key: "last_name",       label: "Apellidos" },
      { key: "document_number", label: "Documento" },
      { key: "email",           label: "Email" },
      { key: "phone",           label: "Teléfono" },
      { label: "Iglesia", value: (r) => r.churches?.name ?? "" },
      { label: "País",    value: (r) => countryName(r.country) },
      { label: "Estado",  value: (r) => STATUS_LABELS[r.pastoral_status] ?? r.pastoral_status },
      { key: "degree_title",    label: "Grado" },
      { key: "birth_date",      label: "Nacimiento" },
    ]);
  };

  const exportChurches = () => {
    exportToCSV("iglesias", churches, [
      { key: "name",    label: "Nombre" },
      { label: "País",  value: (r) => countryName(r.country) },
      { key: "region",  label: "Región" },
      { key: "commune", label: "Comuna" },
      { key: "address", label: "Dirección" },
      { key: "phone",   label: "Teléfono" },
    ]);
  };

  const exportAttendance = () => {
    if (!selectedEvent) return;
    exportToCSV(`asistencia-${selectedEvent.title.replace(/\s+/g, "_")}`, attendance, [
      { label: "Evento",      value: () => selectedEvent.title },
      { label: "Fecha",       value: (r) => formatDate(r.starts_at) },
      { key: "session_label", label: "Sesión" },
      { key: "attendance_count", label: "Asistentes" },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Reportería</h2>
          <p className="mt-0.5 text-sm text-slate-500">Métricas, distribución geográfica y asistencia a eventos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={exportPastors} disabled={loading || !pastors.length}>
            <FileSpreadsheet size={15} /> Pastores
          </button>
          <button className="btn-secondary" type="button" onClick={exportChurches} disabled={loading || !churches.length}>
            <FileSpreadsheet size={15} /> Iglesias
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* ── KPI row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users} label="Pastores totales" value={stats.totalPastors}
          trend={stats.activePastors ? `${stats.activePastors} activos` : null}
          color="text-blue-600" bg="bg-blue-50" border="border-l-[3px] border-blue-400"
        />
        <KpiCard
          icon={Building2} label="Iglesias" value={stats.totalChurches}
          color="text-violet-600" bg="bg-violet-50" border="border-l-[3px] border-violet-400"
        />
        <KpiCard
          icon={Globe2} label="Países con presencia" value={stats.distinctCountries}
          color="text-cyan-600" bg="bg-cyan-50" border="border-l-[3px] border-cyan-400"
        />
        <KpiCard
          icon={CalendarCheck} label="Eventos registrados" value={events.length}
          color="text-amber-600" bg="bg-amber-50" border="border-l-[3px] border-amber-400"
        />
      </div>

      {/* ── Charts row 1: donuts ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribución por estado" subtitle="Pastores agrupados por su estado pastoral">
          {loading ? <ChartSkeleton /> : <DonutChart data={stats.byStatus} total={stats.totalPastors} />}
        </ChartCard>
        <ChartCard title="Distribución por grado" subtitle="Top 8 grados pastorales" accent="bg-violet-500">
          {loading ? <ChartSkeleton /> : <DonutChart data={stats.byDegree} total={stats.byDegree.reduce((s, d) => s + d.value, 0)} />}
        </ChartCard>
      </div>

      {/* ── Charts row 2: bars side-by-side ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Pastores por país" subtitle="Top 10" accent="bg-cyan-500">
          {loading ? <ChartSkeleton height={320} /> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.byCountry} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(10,110,209,0.06)" }} />
                <Bar dataKey="value" name="Pastores" fill="#0a6ed1" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Iglesias por país" subtitle="Top 10" accent="bg-violet-500">
          {loading ? <ChartSkeleton height={320} /> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.churchesByCountry} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                <Bar dataKey="value" name="Iglesias" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Attendance section ──────────────────────────────────── */}
      <ChartCard
        title="Asistencia por evento"
        subtitle={selectedEvent ? `${selectedEvent.title} · ${formatDate(selectedEvent.starts_at)}` : "Seleccioná un evento"}
        accent="bg-emerald-500"
        actions={
          <button className="btn-secondary btn-sm" onClick={exportAttendance} disabled={!attendance.length}>
            <Download size={14} /> CSV
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
            <select className="field-input pl-9" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              <option value="">Seleccionar evento...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-5 px-4 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div>
              <p className="text-[10px] font-semibold text-emerald-700/70 uppercase tracking-wider">Asistencias</p>
              <p className="text-xl font-bold text-emerald-700 tabular-nums">{totalAttendees}</p>
            </div>
            <div className="h-8 w-px bg-emerald-200" />
            <div>
              <p className="text-[10px] font-semibold text-emerald-700/70 uppercase tracking-wider">Sesiones</p>
              <p className="text-xl font-bold text-emerald-700 tabular-nums">{attendance.length}</p>
            </div>
          </div>
        </div>

        {attendance.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attendance} margin={{ left: 0, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="session_label" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
              <Bar dataKey="attendance_count" name="Asistentes" fill="url(#attendanceGradient)" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="attendance_count" position="top" style={{ fontSize: 11, fill: "#047857", fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : selectedEventId && !loading ? (
          <p className="text-center text-sm text-slate-400 py-12">Sin asistencia registrada para este evento.</p>
        ) : null}

        {/* Detail table */}
        {attendance.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sesión</th>
                  <th>Asistentes</th>
                  <th>% del total</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((row) => {
                  const pct = totalAttendees ? Math.round((row.attendance_count / totalAttendees) * 100) : 0;
                  return (
                    <tr key={row.session_id}>
                      <td className="text-slate-500">{formatDate(row.starts_at)}</td>
                      <td className="font-medium text-slate-900">{row.session_label}</td>
                      <td className="font-semibold tabular-nums text-slate-900">{row.attendance_count}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 tabular-nums w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
