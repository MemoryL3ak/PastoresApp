"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(({ id, message }) => (
          <div key={id} className="toast-item pointer-events-auto flex items-center gap-3 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl max-w-xs">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="flex-1 leading-snug">{message}</span>
            <button type="button" onClick={() => dismiss(id)} className="text-slate-400 hover:text-white flex-shrink-0 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
