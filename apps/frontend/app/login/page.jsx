"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

const AUTH_ERRORS = {
  "Invalid login credentials":  "Correo o contraseña incorrectos.",
  "Email not confirmed":         "Debes confirmar tu correo antes de ingresar.",
  "Too many requests":           "Demasiados intentos. Espera unos minutos.",
  "User not found":              "No existe una cuenta con ese correo.",
  "Invalid email":               "El formato del correo no es válido.",
  "Password should be at least": "La contraseña debe tener al menos 6 caracteres.",
};

function translateError(message = "") {
  for (const [key, translation] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(key)) return translation;
  }
  return "Ocurrió un error al iniciar sesión. Intenta nuevamente.";
}

export default function LoginPage() {
  const { signIn, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Already authenticated → go straight to dashboard
  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/dashboard");
    }
  }, [authLoading, session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Keyframes (global para ambos paneles) ───────────────── */}
      <style>{`
        @keyframes float1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(30px, -25px) scale(1.05); }
          66%  { transform: translate(-20px, 20px) scale(0.97); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-35px, 30px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          40%  { transform: translate(25px, -20px) scale(1.04); }
          80%  { transform: translate(-15px, 15px) scale(0.96); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftGrid {
          from { background-position: 0px 0px; }
          to   { background-position: 56px 56px; }
        }
        @keyframes gradShift {
          0%   { background: radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 60%); }
          50%  { background: radial-gradient(ellipse at 75% 65%, rgba(255,255,255,0.09) 0%, transparent 60%); }
          100% { background: radial-gradient(ellipse at 40% 80%, rgba(255,255,255,0.05) 0%, transparent 60%); }
        }
        @keyframes logoSpin {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(4deg) scale(1.04); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Left panel ─────────────────────────────────────────── */}
      {/* Mobile: banner compacto en la parte superior            */}
      {/* Desktop: panel izquierdo a pantalla completa            */}
      <div
        className="relative flex flex-col overflow-hidden text-white
                   lg:w-1/2 lg:justify-between lg:p-12
                   p-6 justify-center items-center"
        style={{ background: "linear-gradient(135deg, #2563b0 0%, #1e4d8c 40%, #1a3f7a 100%)" }}
      >
        {/* Animated gradient overlay */}
        <div className="pointer-events-none absolute inset-0" style={{ animation: "gradShift 12s ease-in-out infinite alternate" }} />

        {/* Orbes animados */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-white opacity-20 blur-2xl"
            style={{ animation: "float1 9s ease-in-out infinite" }} />
          <div className="absolute top-1/2 -right-40 h-[420px] w-[420px] rounded-full bg-white opacity-[0.13] blur-2xl"
            style={{ animation: "float2 11s ease-in-out infinite" }} />
          <div className="absolute -bottom-28 left-1/4 h-[360px] w-[360px] rounded-full bg-white opacity-[0.08] blur-2xl"
            style={{ animation: "float3 13s ease-in-out infinite" }} />
          <div className="absolute top-1/3 left-1/3 h-[220px] w-[220px] rounded-full bg-blue-300 opacity-[0.07] blur-3xl"
            style={{ animation: "float2 7s ease-in-out infinite reverse" }} />
        </div>

        {/* Grilla de puntos animada */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
            animation: "driftGrid 30s linear infinite",
          }}
        />

        {/* Logo + nombre — siempre visible */}
        <div className="relative flex items-center gap-3 lg:self-start w-full lg:w-auto justify-center lg:justify-start"
          style={{ animation: "fadeUp 0.8s ease-out both" }}>
          <img src="/logo.png" alt="Logo" className="h-12 w-12 lg:h-16 lg:w-16 object-contain drop-shadow-lg"
            style={{ animation: "logoSpin 8s ease-in-out infinite" }} />
          <span className="text-base lg:text-lg font-bold tracking-tight">Plataforma de Gestión Pastoral</span>
        </div>

        {/* Texto central — oculto en móvil para mantener el banner compacto */}
        <div className="relative hidden lg:block" style={{ animation: "fadeUp 0.9s ease-out 0.15s both" }}>
          <h1 className="text-4xl font-bold leading-tight mb-4">Gestión pastoral</h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            Administra iglesias, pastores, credenciales y eventos de nuestra misión.
          </p>
        </div>

        {/* Descripción compacta — solo en móvil, debajo del logo */}
        <p className="relative lg:hidden text-blue-200 text-sm text-center mt-2 max-w-xs"
          style={{ animation: "fadeUp 0.9s ease-out 0.15s both" }}>
          Administra iglesias, pastores y credenciales de nuestra misión.
        </p>

        {/* Footer — solo desktop */}
        <div className="relative hidden lg:flex items-center gap-3 text-sm text-blue-300"
          style={{ animation: "fadeUp 1s ease-out 0.3s both" }}>
          <ShieldCheck size={16} />
          Acceso restringido a usuarios autorizados
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center items-center px-5 py-10 sm:px-8 sm:py-12 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1.5 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
              <input
                type="email"
                className="field-input"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="field-input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={15} />
                  Iniciar sesión
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
