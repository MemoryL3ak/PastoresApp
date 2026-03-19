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
    <>
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
        @keyframes pulseRing {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 18px rgba(255,255,255,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .logo-pulse { animation: pulseRing 3s ease-out infinite; }
      `}</style>

      {/* ════════════════════════════════════════════
          MOBILE  (oculto en lg+)
          Pantalla completa azul con form glassmorphism
      ════════════════════════════════════════════ */}
      <div className="lg:hidden relative min-h-screen flex flex-col justify-between overflow-hidden text-white"
        style={{ background: "linear-gradient(145deg, #1a3a6e 0%, #1e4d8c 35%, #2563b0 70%, #1a3f7a 100%)" }}>

        {/* Gradient overlay animado */}
        <div className="pointer-events-none absolute inset-0" style={{ animation: "gradShift 10s ease-in-out infinite alternate" }} />

        {/* Orbes difuminados */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-300 opacity-30 blur-3xl"
            style={{ animation: "float1 9s ease-in-out infinite" }} />
          <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-white opacity-[0.12] blur-3xl"
            style={{ animation: "float2 11s ease-in-out infinite" }} />
          <div className="absolute bottom-1/4 -left-16 h-56 w-56 rounded-full bg-indigo-300 opacity-[0.18] blur-3xl"
            style={{ animation: "float3 13s ease-in-out infinite" }} />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-200 opacity-[0.10] blur-3xl"
            style={{ animation: "float1 8s ease-in-out infinite reverse" }} />
        </div>

        {/* Grilla de puntos animada */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
            animation: "driftGrid 25s linear infinite",
          }}
        />

        {/* Header: logo + título */}
        <div className="relative flex flex-col items-center pt-14 pb-4 px-6"
          style={{ animation: "fadeUp 0.7s ease-out both" }}>
          <div className="logo-pulse mb-4 rounded-full p-1">
            <img src="/logo.png" alt="Logo"
              className="h-20 w-20 object-contain drop-shadow-2xl"
              style={{ animation: "logoSpin 8s ease-in-out infinite" }} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-center drop-shadow">
            Plataforma de Gestión Pastoral
          </h1>
          <p className="mt-2 text-blue-200 text-sm text-center max-w-xs leading-relaxed"
            style={{ animation: "fadeUp 0.8s ease-out 0.1s both" }}>
            Administra iglesias, pastores, credenciales y eventos de nuestra misión.
          </p>
        </div>

        {/* Tarjeta glassmorphism con el formulario */}
        <div className="relative flex-1 flex flex-col justify-center px-5 py-6"
          style={{ animation: "fadeUp 0.9s ease-out 0.2s both" }}>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl"
            style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>

            <h2 className="text-xl font-bold text-white mb-1">Iniciar sesión</h2>
            <p className="text-blue-200 text-sm mb-6">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-blue-100">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm text-white placeholder-blue-200/70 outline-none focus:border-white/50 focus:bg-white/20 transition"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-blue-100">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="w-full rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 pr-10 text-sm text-white placeholder-blue-200/70 outline-none focus:border-white/50 focus:bg-white/20 transition"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-blue-700 shadow-lg hover:bg-blue-50 active:scale-[0.98] transition-all mt-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-center gap-2 pb-8 text-xs text-blue-300"
          style={{ animation: "fadeUp 1s ease-out 0.35s both" }}>
          <ShieldCheck size={14} />
          Acceso restringido a usuarios autorizados
        </div>
      </div>

      {/* ════════════════════════════════════════════
          DESKTOP  (oculto en < lg)
          Layout original: panel izquierdo + formulario derecho
      ════════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen w-full">

        {/* Left panel */}
        <div className="lg:w-1/2 relative flex flex-col justify-between overflow-hidden p-12 text-white"
          style={{ background: "linear-gradient(145deg, #0f2d5c 0%, #1a4080 28%, #1e5caa 60%, #2d7dd6 100%)" }}>

          {/* Animated gradient overlay */}
          <div className="pointer-events-none absolute inset-0" style={{ animation: "gradShift 10s ease-in-out infinite alternate" }} />

          {/* Orbes de colores */}
          <div className="pointer-events-none absolute inset-0">
            {/* Cyan top-right */}
            <div className="absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full blur-3xl"
              style={{ background: "#22d3ee", opacity: 0.20, animation: "float1 9s ease-in-out infinite" }} />
            {/* Azul brillante bottom-left */}
            <div className="absolute -bottom-24 -left-16 h-[400px] w-[400px] rounded-full blur-3xl"
              style={{ background: "#3b82f6", opacity: 0.24, animation: "float2 11s ease-in-out infinite" }} />
            {/* Índigo mid */}
            <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] rounded-full blur-3xl"
              style={{ background: "#818cf8", opacity: 0.16, animation: "float3 13s ease-in-out infinite" }} />
            {/* Blanco suave */}
            <div className="absolute top-1/4 left-1/4 h-[200px] w-[200px] rounded-full bg-white blur-3xl"
              style={{ opacity: 0.09, animation: "float2 7s ease-in-out infinite reverse" }} />
          </div>

          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.13,
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)",
              backgroundSize: "28px 28px",
              animation: "driftGrid 30s linear infinite",
            }}
          />

          {/* Shimmer sweep */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div style={{
              position: "absolute",
              top: "-50%", left: "-120%",
              width: "55%", height: "200%",
              background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
              animation: "shimmer 8s ease-in-out infinite 1.5s",
              transform: "skewX(-15deg)",
            }} />
          </div>

          {/* Logo con glow */}
          <div className="relative flex items-center gap-4" style={{ animation: "fadeUp 0.8s ease-out both" }}>
            <div style={{ borderRadius: "50%", padding: 4, background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)", animation: "pulseRing 3s ease-out infinite" }}>
              <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain drop-shadow-2xl" />
            </div>
            <span className="text-lg font-bold tracking-tight drop-shadow">Plataforma de Gestión Pastoral</span>
          </div>

          {/* Heading vibrante */}
          <div className="relative" style={{ animation: "fadeUp 0.9s ease-out 0.15s both" }}>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-3 drop-shadow">
              Gestión <span style={{ color: "#93c5fd" }}>pastoral</span>
            </h1>
            <div style={{ width: 64, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #60a5fa, #22d3ee)", marginBottom: 18 }} />
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              Administra iglesias, pastores, credenciales y eventos de nuestra misión.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-sm"
            style={{ color: "#93c5fd", animation: "fadeUp 1s ease-out 0.3s both" }}>
            <ShieldCheck size={16} />
            Acceso restringido a usuarios autorizados
          </div>
        </div>

        {/* Right panel — form */}
        <div className="relative flex flex-1 flex-col justify-center items-center px-8 py-12 overflow-hidden"
          style={{ background: "linear-gradient(160deg, #f0f6ff 0%, #e8f0fe 40%, #f5f8ff 100%)" }}>

          {/* Orbes de fondo muy sutiles */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full blur-3xl"
              style={{ background: "#bfdbfe", opacity: 0.55, animation: "float1 11s ease-in-out infinite" }} />
            <div className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full blur-3xl"
              style={{ background: "#dbeafe", opacity: 0.65, animation: "float2 14s ease-in-out infinite" }} />
            <div className="absolute top-1/2 right-1/4 h-40 w-40 rounded-full blur-3xl"
              style={{ background: "#e0e7ff", opacity: 0.50, animation: "float3 9s ease-in-out infinite" }} />
          </div>

          <div className="relative w-full max-w-sm">
            {/* Card elevada */}
            <div className="rounded-3xl bg-white/80 border border-blue-100 shadow-xl shadow-blue-100/40 px-8 py-9"
              style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>

            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain flex-shrink-0 drop-shadow" />
              <div>
                <h2 className="text-xl font-bold text-brand-800 leading-tight">Iniciar sesión</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ingresa tus credenciales para continuar</p>
              </div>
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
            </div>{/* /card */}
          </div>{/* /relative max-w-sm */}
        </div>
      </div>
    </>
  );
}
