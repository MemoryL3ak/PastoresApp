import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-600 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Página no encontrada</h1>
        <p className="text-slate-500 mb-6">La ruta que buscas no existe.</p>
        <Link href="/login" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
