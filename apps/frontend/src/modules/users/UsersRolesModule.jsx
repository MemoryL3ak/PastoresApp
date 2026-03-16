"use client";

import { useEffect, useState } from "react";
import { Plus, X, ShieldCheck, Globe, Eye, Pencil, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { COUNTRIES } from "@/lib/geography";

const ROLES = [
  { value: "admin",            label: "Administrador",     description: "Acceso completo: crear, editar y eliminar todo.",                          icon: ShieldCheck },
  { value: "country_assigned", label: "Solo País Asignado", description: "Ver y editar únicamente registros del país que se le asigne.",             icon: Globe },
  { value: "viewer",           label: "Visualizador",      description: "Solo lectura. Puede ver todo pero no modificar nada.",                      icon: Eye },
];

const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.value, r]));

const emptyCreate = { email: "", password: "", full_name: "", role: "viewer", assigned_country: "" };
const emptyEdit   = { email: "", full_name: "", role: "viewer", assigned_country: "", is_active: true };

/* ── Modal wrapper ──────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-1.5">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function UsersRolesModule() {
  const [users, setUsers]       = useState([]);
  const [error, setError]       = useState("");
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);   // user object
  const [resetUser, setResetUser]     = useState(null);   // user object
  const [createForm, setCreateForm]   = useState(emptyCreate);
  const [editForm, setEditForm]       = useState(emptyEdit);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => {
    try { setUsers(await api.listUsers()); setError(""); }
    catch (err) { setError(err.message || "No se pudieron cargar usuarios"); }
  };

  useEffect(() => { void loadUsers(); }, []);

  /* ── Create ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        ...createForm,
        assigned_country: createForm.role === "country_assigned" ? createForm.assigned_country : undefined,
      });
      setCreateForm(emptyCreate);
      setCreating(false);
      await loadUsers();
    } catch (err) { setError(err.message || "No se pudo crear el usuario"); }
  };

  /* ── Edit ── */
  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      email:            user.email ?? "",
      full_name:        user.full_name ?? "",
      role:             user.role ?? "viewer",
      assigned_country: user.assigned_country ?? "",
      is_active:        user.is_active ?? true,
    });
    setError("");
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, {
        email:            editForm.email || undefined,
        full_name:        editForm.full_name,
        role:             editForm.role,
        assigned_country: editForm.role === "country_assigned" ? (editForm.assigned_country || null) : null,
        is_active:        editForm.is_active,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err) { setError(err.message || "No se pudo guardar los cambios"); }
  };

  /* ── Reset password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.resetUserPassword(resetUser.id, newPassword);
      setResetUser(null);
      setNewPassword("");
    } catch (err) { setError(err.message || "No se pudo resetear la contraseña"); }
  };

  const setCreate = (k, v) => setCreateForm((p) => ({ ...p, [k]: v }));
  const setEdit   = (k, v) => setEditForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Roles y usuarios</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button type="button"
          className={creating ? "btn-secondary" : "btn-primary"}
          onClick={() => { setCreating((v) => !v); setError(""); setCreateForm(emptyCreate); }}>
          {creating ? <><X size={15} /> Cerrar</> : <><Plus size={15} /> Nuevo usuario</>}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Role legend */}
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
                  value={createForm.full_name} onChange={(e) => setCreate("full_name", e.target.value)} />
              </label>
              <label className="field-label">
                Correo electrónico
                <input type="email" className="field-input" required placeholder="correo@ejemplo.com"
                  value={createForm.email} onChange={(e) => setCreate("email", e.target.value)} />
              </label>
              <div className="field-label">
                Contraseña temporal
                <input type="password" className="field-input" required minLength={6} placeholder="Mínimo 6 caracteres"
                  value={createForm.password} onChange={(e) => setCreate("password", e.target.value)} />
                <span className="mt-1 text-xs text-slate-400">El usuario deberá cambiarla en su primer ingreso.</span>
              </div>
              <label className="field-label">
                Rol
                <select className="field-input" value={createForm.role}
                  onChange={(e) => setCreate("role", e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              {createForm.role === "country_assigned" && (
                <label className="field-label md:col-span-2">
                  País asignado
                  <select className="field-input" required value={createForm.assigned_country}
                    onChange={(e) => setCreate("assigned_country", e.target.value)}>
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
              <th>Correo</th>
              <th>Rol</th>
              <th>País asignado</th>
              <th>Estado</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const country = COUNTRIES.find((c) => c.code === user.assigned_country);
              return (
                <tr key={user.id}>
                  <td className="font-medium text-slate-900">{user.full_name}</td>
                  <td className="text-slate-500 text-sm">{user.email ?? "—"}</td>
                  <td className="text-slate-600 text-sm">{ROLE_MAP[user.role]?.label ?? user.role}</td>
                  <td className="text-slate-500 text-sm">
                    {user.role === "country_assigned" ? (country?.name ?? user.assigned_country ?? "Sin asignar") : "—"}
                  </td>
                  <td>
                    <span className={user.is_active ? "badge-success" : "badge-muted"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-link text-xs" onClick={() => openEdit(user)}>
                        <Pencil size={12} className="inline mr-1" />Editar
                      </button>
                      <button type="button" className="btn-link text-xs text-amber-600 hover:text-amber-800"
                        onClick={() => { setResetUser(user); setNewPassword(""); setError(""); }}>
                        <KeyRound size={12} className="inline mr-1" />Clave
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editingUser && (
        <Modal title={`Editar usuario — ${editingUser.full_name}`} onClose={() => setEditingUser(null)}>
          <form onSubmit={handleEdit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="field-label">
                Nombre completo
                <input className="field-input" required value={editForm.full_name}
                  onChange={(e) => setEdit("full_name", e.target.value)} />
              </label>
              <label className="field-label">
                Correo electrónico
                <input type="email" className="field-input" required value={editForm.email}
                  onChange={(e) => setEdit("email", e.target.value)} />
              </label>
              <label className="field-label">
                Rol
                <select className="field-input" value={editForm.role}
                  onChange={(e) => setEdit("role", e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              <label className="field-label">
                Estado
                <select className="field-input" value={editForm.is_active ? "1" : "0"}
                  onChange={(e) => setEdit("is_active", e.target.value === "1")}>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </label>
              {editForm.role === "country_assigned" && (
                <label className="field-label sm:col-span-2">
                  País asignado
                  <select className="field-input" value={editForm.assigned_country}
                    onChange={(e) => setEdit("assigned_country", e.target.value)}>
                    <option value="">Sin asignar</option>
                    {COUNTRIES.filter((c) => c.code !== "OTHER").map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
              <button type="submit" className="btn-primary">Guardar cambios</button>
              <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset password modal */}
      {resetUser && (
        <Modal title={`Resetear contraseña — ${resetUser.full_name}`} onClose={() => setResetUser(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Se asignará una nueva contraseña temporal. El usuario deberá cambiarla en su próximo ingreso.
          </p>
          <form onSubmit={handleResetPassword}>
            <label className="field-label">
              Nueva contraseña temporal
              <input type="password" className="field-input" required minLength={6}
                placeholder="Mínimo 6 caracteres" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} autoFocus />
            </label>
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
              <button type="submit" className="btn-primary">Resetear contraseña</button>
              <button type="button" className="btn-secondary" onClick={() => setResetUser(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
