import { BadgeCheck } from "lucide-react";

export default function Login({ onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/25 mb-4">
            <BadgeCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Plataforma Pastores</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Administración pastoral institucional
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Iniciar sesión</h2>
            <p className="mt-0.5 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            onClick={onLogin}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91C16.63 14.25 17.64 11.94 17.64 9.2Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26C11.25 14.27 10.2 14.6 9 14.6c-2.34 0-4.32-1.58-5.03-3.71H.97v2.33A9 9 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.97 10.89A5.4 5.4 0 0 1 3.69 9c0-.65.11-1.28.28-1.89V4.78H.97A9 9 0 0 0 0 9c0 1.45.35 2.82.97 4.22l3-2.33Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .97 4.78l3 2.33C4.68 5.16 6.66 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400">o continúa con email</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="field-label">
              Correo electrónico
              <input
                className="field-input"
                type="email"
                placeholder="admin@pastores.org"
                autoComplete="email"
              />
            </label>

            <label className="field-label">
              Contraseña
              <input
                className="field-input"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
          </div>

          <button
            type="button"
            className="btn-primary w-full justify-center py-2.5"
            onClick={onLogin}
          >
            Iniciar sesión
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Plataforma de uso institucional — acceso restringido
        </p>
      </div>
    </div>
  );
}
