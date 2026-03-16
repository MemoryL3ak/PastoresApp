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
    <div className="flex h-screen overflow-hidden bg-slate-50">
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
        style={{ width: isMobile ? undefined : collapsed ? 72 : 240 }}
        className={[
          "z-30 flex flex-shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-in-out overflow-hidden",
          isMobile
            ? `fixed inset-y-0 left-0 w-60 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} transition-transform duration-200`
            : "",
        ].join(" ")}
      >
        {/* Brand */}
        <div className={`flex h-20 items-center gap-3 border-b border-slate-100 flex-shrink-0 ${collapsed && !isMobile ? "justify-center px-2" : "px-5"}`}>
          <img
            src="/logo.png"
            alt="Logo"
            className={`object-contain flex-shrink-0 ${collapsed && !isMobile ? "h-12 w-12" : "h-16 w-16"}`}
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900 leading-none">Gestión Pastoral</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Plataforma
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-0.5">
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
                className={[
                  "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors duration-150 group whitespace-nowrap",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  className={[
                    "flex-shrink-0 transition-colors",
                    active
                      ? "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600",
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
          <div className="border-t border-slate-100 p-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              title={collapsed ? "Expandir menú" : "Contraer menú"}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggleNav}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors flex-shrink-0"
              aria-label="Abrir o cerrar menú"
            >
              {isMobile && mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-base font-semibold text-slate-900 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {profile && (
              <div className="flex items-center gap-2 mr-1">
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-700">
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
          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
