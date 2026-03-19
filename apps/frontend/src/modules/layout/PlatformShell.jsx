"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  BadgeCheck,
  Calendar,
  ClipboardCheck,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCog,
} from "lucide-react";

const MENU = [
  { href: "/dashboard",      label: "Dashboard",        icon: LayoutDashboard },
  { href: "/pastores",       label: "Pastores",         icon: Users },
  { href: "/iglesias",       label: "Iglesias",         icon: Building2 },
  { href: "/credenciales",   label: "Credenciales",     icon: BadgeCheck,  roles: ["admin", "country_assigned"] },
  { href: "/eventos",        label: "Eventos",          icon: Calendar },
  { href: "/asistencia",     label: "Asistencia",       icon: ClipboardCheck },
  { href: "/reportes",       label: "Reportería",       icon: BarChart2 },
  { href: "/usuarios-roles", label: "Roles y usuarios", icon: UserCog,     roles: ["admin"] },
];

const PAGE_TITLES = {
  "/dashboard":      "Dashboard",
  "/pastores":       "Gestión de Pastores",
  "/iglesias":       "Iglesias",
  "/credenciales":   "Credenciales",
  "/eventos":        "Eventos",
  "/asistencia":     "Control de Asistencia",
  "/reportes":       "Reportería",
  "/usuarios-roles": "Roles y Usuarios",
};

export default function PlatformShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const visibleMenu = MENU.filter((item) => !item.roles || item.roles.includes(profile?.role));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleToggleNav = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const pageTitle = PAGE_TITLES[pathname] ?? "Plataforma Pastores";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#eef4fc" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden cursor-default"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        style={{
          width: isMobile ? undefined : collapsed ? 72 : 240,
          background: "linear-gradient(160deg, #1a3f7a 0%, #1e4d8c 45%, #2563b0 100%)",
          boxShadow: isMobile
            ? mobileOpen ? "4px 0 32px rgba(15,45,92,0.35)" : "none"
            : "4px 0 24px rgba(15,45,92,0.18)",
        }}
        className={[
          "flex flex-shrink-0 flex-col overflow-hidden",
          // Mobile: siempre fixed, desliza con transform
          "fixed inset-y-0 left-0 z-30 w-60 transition-transform duration-200",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          // Desktop: posición relativa en el flujo, transición de ancho
          "md:relative md:inset-auto md:translate-x-0 md:transition-[width] md:duration-200 md:ease-in-out",
        ].join(" ")}
      >
        {/* Brand */}
        <div className={`relative flex h-20 items-center gap-3 border-b border-white/10 flex-shrink-0 ${collapsed && !isMobile ? "justify-center px-2" : "px-5"}`}>
          <img
            src="/logo.png"
            alt="Logo"
            className={`object-contain flex-shrink-0 drop-shadow-md ${collapsed && !isMobile ? "h-12 w-12" : "h-16 w-16"}`}
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-bold text-white leading-none">Gestión Pastoral</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-widest text-blue-200/70">
                Plataforma
              </p>
            </div>
          )}
        </div>

        {/* Separador con gradiente */}
        <div className="mx-4 h-px flex-shrink-0" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-0.5">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                style={active ? {
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.13)",
                } : undefined}
                className={[
                  "relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200 group whitespace-nowrap overflow-hidden",
                  active
                    ? "text-white"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                {/* Barra indicadora izquierda */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white/90" />
                )}
                <Icon
                  size={18}
                  className={[
                    "flex-shrink-0 transition-colors",
                    active
                      ? "text-cyan-300"
                      : "text-white/45 group-hover:text-white/75",
                  ].join(" ")}
                />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <div className="relative border-t border-white/10 p-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              title={collapsed ? "Expandir menú" : "Contraer menú"}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
            >
              {collapsed ? (
                <ChevronRight size={16} className="flex-shrink-0" />
              ) : (
                <>
                  <ChevronLeft size={16} className="flex-shrink-0" />
                  <span className="truncate text-xs">Contraer</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between px-3 sm:px-5 gap-4" style={{ background: "linear-gradient(90deg, #e8f0fb 0%, #f0f6fc 100%)", borderBottom: "1px solid #ccddf5", boxShadow: "0 1px 3px rgba(37,99,176,0.07)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggleNav}
              className="rounded-lg p-2 text-brand-600 hover:bg-brand-100/70 hover:text-brand-800 transition-colors flex-shrink-0"
              aria-label="Abrir o cerrar menú"
            >
              {isMobile && mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="hidden sm:block w-[3px] h-5 rounded-full flex-shrink-0" style={{ background: "linear-gradient(180deg, #2563b0, #22d3ee)" }} />
              <h1 className="text-base font-semibold text-brand-800 truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {profile && (
              <div className="flex items-center gap-2 mr-1">
                <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #2563b0, #1e4d8c)" }}>
                  <span className="text-xs font-bold text-white">
                    {profile.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700 hidden md:block truncate max-w-[140px]">
                  {profile.full_name}
                </span>
              </div>
            )}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={async () => { await signOut(); router.push("/login"); }}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
