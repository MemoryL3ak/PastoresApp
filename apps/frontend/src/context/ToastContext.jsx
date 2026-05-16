"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const ToastContext = createContext(null);
const TOAST_DURATION = 3500;
const EXIT_DURATION  = 250;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  const toast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, leaving: false }]);
    setTimeout(() => dismiss(id), TOAST_DURATION);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(({ id, message, leaving }) => (
          <div
            key={id}
            data-leaving={leaving || undefined}
            className="toast-item pointer-events-auto group relative flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-white to-brand-50/40 border border-brand-100 text-brand-800 text-sm font-medium pl-3 pr-4 py-3 shadow-[0_10px_25px_-12px_rgba(10,110,209,0.25),0_4px_10px_-4px_rgba(15,36,65,0.08)] ring-1 ring-black/5 min-w-[280px] max-w-sm backdrop-blur-sm transition-shadow hover:shadow-[0_15px_30px_-12px_rgba(10,110,209,0.35),0_6px_12px_-4px_rgba(15,36,65,0.12)]"
          >
            {/* Left accent bar */}
            <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 via-brand-500 to-brand-600" />

            {/* Icon in colored circle */}
            <span className="toast-icon relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_4px_10px_-2px_rgba(10,110,209,0.45)]">
              <CheckCircle2 size={17} className="text-white" strokeWidth={2.5} />
              <span className="absolute inset-0 rounded-full bg-brand-400 opacity-30 animate-ping" />
            </span>

            {/* Message */}
            <span className="flex-1 leading-snug pr-1">{message}</span>

            {/* Close button */}
            <button
              type="button"
              onClick={() => dismiss(id)}
              aria-label="Cerrar"
              className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-brand-400 hover:text-brand-700 hover:bg-brand-100/60 transition-all"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Progress bar */}
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-100 overflow-hidden">
              <span className="toast-progress block h-full w-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
