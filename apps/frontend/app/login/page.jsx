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
    <div className="min-h-screen flex">

      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white">

        {/* Orbes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-white opacity-20 blur-2xl" />
          <div className="absolute top-1/2 -right-40 h-[420px] w-[420px] rounded-full bg-white opacity-15 blur-2xl" />
          <div className="absolute -bottom-28 left-1/4 h-[360px] w-[360px] rounded-full bg-white opacity-10 blur-2xl" />
        </div>

        {/* Grilla de puntos */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Contenido */}
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
          <span className="text-lg font-bold tracking-tight">Plataforma de Gestión Pastoral</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Gestión pastoral
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed max-w-sm">
            Administra iglesias, pastores, credenciales y eventos de nuestra misión.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-sm text-brand-300">
          <ShieldCheck size={16} />
          Acceso restringido a usuarios autorizados
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center items-center px-5 py-10 sm:px-8 sm:py-12 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="Logo" className="h-14 w-14 object-contain flex-shrink-0" />
            <span className="text-base font-bold text-slate-900 lg:hidden">Plataforma de Gestión Pastoral</span>
          </div>

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
