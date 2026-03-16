"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordModal({ onDone }) {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showP, setShowP]         = useState(false);
  const [showC, setShowC]         = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });
      if (updateError) throw updateError;
      onDone();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-brand-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">Cambio de contraseña</h2>
              <p className="mt-1 text-xs text-brand-200">Primer ingreso al sistema</p>
            </div>
          </div>
          <p className="text-sm text-brand-100 leading-relaxed">
            Por seguridad, debes crear una contraseña personal antes de continuar. La contraseña temporal ya no será válida.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showP ? "text" : "password"}
                className="field-input pr-10"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button type="button" tabIndex={-1} onClick={() => setShowP(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showP ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showC ? "text" : "password"}
                className="field-input pr-10"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button type="button" tabIndex={-1} onClick={() => setShowC(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showC ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15}/>
                  Establecer contraseña
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
