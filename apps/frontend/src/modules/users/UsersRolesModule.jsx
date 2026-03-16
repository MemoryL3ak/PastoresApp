"use client";

import { useEffect, useState } from "react";
import { Plus, X, ShieldCheck, Globe, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { COUNTRIES } from "@/lib/geography";

const ROLES = [
  {
    value: "admin",
    label: "Administrador",
    description: "Acceso completo: crear, editar y eliminar todo.",
    icon: ShieldCheck,
    badge: "badge-success",
  },
  {
    value: "country_assigned",
    label: "Solo País Asignado",
    description: "Ver y editar únicamente registros del país que se le asigne.",
    icon: Globe,
    badge: "badge-info",
  },
  {
    value: "viewer",
    label: "Visualizador",
    description: "Solo lectura. Puede ver todo pero no modificar nada.",
    icon: Eye,
    badge: "badge-muted",
  },
];

const emptyForm = { email: "", password: "", full_name: "", role: "viewer", assigned_country: "" };

export default function UsersRolesModule() {
  const [users, setUsers]       = useState([]);
  const [error, setError]       = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState(emptyForm);

  const loadUsers = async () => {
    try {
      setUsers(await api.listUsers());
      setError("");
    } catch (err) {
      setError(err.message || "No se pudieron cargar usuarios");
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        email:            form.email,
        password:         form.password,
        full_name:        form.full_name,
        role:             form.role,
        assigned_country: form.role === "country_assigned" ? form.assigned_country : undefined,
      });
      setForm(emptyForm);
      setCreating(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario");
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.updateUser(id, { role, assigned_country: null });
      await loadUsers();
    } catch (err) { setError(err.message || "No se pudo actualizar el rol"); }
  };

  const updateCountry = async (id, assigned_country) => {
    try {
      await api.updateUser(id, { assigned_country: assigned_country || null });
      await loadUsers();
    } catch (err) { setError(err.message || "No se pudo actualizar el país"); }
  };

  const updateStatus = async (id, is_active) => {
    try {
      await api.updateUser(id, { is_active });
      await loadUsers();
    } catch (err) { setError(err.message || "No se pudo actualizar el estado"); }
  };

  return (
    <div className="space-y-5">
      <div className="view-header">
        <div>
          <h2 className="view-title">Roles y usuarios</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          className={creating ? "btn-secondary" : "btn-primary"}
          onClick={() => { setCreating((v) => !v); setError(""); setForm(emptyForm); }}
        >
          {creating ? <><X size={15} /> Cerrar</> : <><Plus size={15} /> Nuevo usuario</>}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Role legend cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ROLES.map(({ value, label, description, icon: Icon }) => (
          <div key={value} className="card py-4 flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {creating && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Nuevo usuario</h3>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <label className="field-label">
                Nombre completo
                <input className="field-input" required placeholder="Ej: María González"
                  value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
              </label>

              <label className="field-label">
                Correo electrónico
                <input type="email" className="field-input" required placeholder="correo@ejemplo.com"
                  value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </label>

              <div className="field-label">
                Contraseña temporal
                <input type="password" className="field-input" required minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password} onChange={(e) => setField("password", e.target.value)} />
                <span className="mt-1 text-xs text-slate-400">
                  El usuario deberá cambiarla en su primer ingreso.
                </span>
              </div>

              <label className="field-label">
                Rol
                <select className="field-input" value={form.role}
                  onChange={(e) => setField("role", e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>

              {form.role === "country_assigned" && (
                <label className="field-label md:col-span-2">
                  País asignado
                  <select className="field-input" required
                    value={form.assigned_country}
                    onChange={(e) => setField("assigned_country", e.target.value)}>
                    <option value="">Seleccionar país...</option>
                    {COUNTRIES.filter((c) => c.code !== "OTHER").map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
              <button type="submit" className="btn-primary">Crear usuario</button>
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>País asignado</th>
              <th>Estado</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium text-slate-900">{user.full_name}</td>
                <td>
                  <select className="field-input w-auto text-xs py-1.5" value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {user.role === "country_assigned" ? (
                    <select className="field-input w-auto text-xs py-1.5"
                      value={user.assigned_country ?? ""}
                      onChange={(e) => updateCountry(user.id, e.target.value)}>
                      <option value="">Sin asignar</option>
                      {COUNTRIES.filter((c) => c.code !== "OTHER").map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </td>
                <td>
                  <span className={user.is_active ? "badge-success" : "badge-muted"}>
                    {user.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn-link text-xs"
                    onClick={() => updateStatus(user.id, !user.is_active)}>
                    {user.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
