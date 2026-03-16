"use client";
import { TriangleAlert } from "lucide-react";

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Eliminar", danger = true }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${danger ? "bg-red-50" : "bg-amber-50"}`}>
            <TriangleAlert size={20} className={danger ? "text-red-500" : "text-amber-500"} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn-primary ${danger ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
