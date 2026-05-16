"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText, Download } from "lucide-react";

/**
 * Dropdown export button.
 *
 * Props:
 *   onExport(format)   → called with "csv" | "xlsx"
 *   disabled           → disables the trigger
 *   label              → trigger label (default: "Exportar")
 */
export default function ExportMenu({ onExport, disabled = false, label = "Exportar" }) {
  const [open, setOpen]   = useState(false);
  const wrapperRef        = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (format) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Download size={15} />
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5"
        >
          <li>
            <button
              type="button"
              role="option"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => pick("csv")}
            >
              <FileText size={15} className="text-slate-400" />
              <span className="flex-1 text-left">CSV</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">.csv</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              role="option"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => pick("xlsx")}
            >
              <FileSpreadsheet size={15} className="text-emerald-500" />
              <span className="flex-1 text-left">Excel</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">.xlsx</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
