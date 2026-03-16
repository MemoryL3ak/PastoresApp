"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function DatePicker({ value, onChange, placeholder = "Seleccionar fecha..." }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // value is "YYYY-MM-DD" string or ""
  const selected = value ? new Date(value + "T12:00:00") : undefined;

  const handleSelect = (date) => {
    if (!date) return;
    const iso = date.toISOString().slice(0, 10);
    onChange(iso);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatted = selected
    ? selected.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field-input flex items-center justify-between text-left gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays size={15} className="text-slate-400 flex-shrink-0" />
          <span className={formatted ? "text-slate-900 truncate" : "text-slate-400"}>
            {formatted ?? placeholder}
          </span>
        </div>
        {formatted && (
          <span onClick={handleClear} className="text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-pointer">
            <X size={14} />
          </span>
        )}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 min-w-[300px]">
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? new Date()}
            classNames={{
              root: "text-sm",
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex items-center justify-between px-1",
              caption_label: "font-semibold text-slate-900 capitalize text-sm",
              nav: "flex items-center gap-1",
              button_previous: "h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors",
              button_next: "h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors",
              weekdays: "grid grid-cols-7 mb-1",
              weekday: "text-center text-xs font-medium text-slate-400 uppercase py-1",
              weeks: "space-y-1",
              week: "grid grid-cols-7",
              day: "text-center p-0",
              day_button: "h-8 w-8 mx-auto rounded-lg text-sm flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-700 cursor-pointer",
              selected: "bg-brand-600 text-white rounded-lg hover:bg-brand-700",
              today: "font-bold text-brand-600",
              outside: "text-slate-300",
              disabled: "text-slate-200 cursor-not-allowed",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left"
                  ? <ChevronLeft size={15} />
                  : <ChevronRight size={15} />,
            }}
          />
        </div>
      )}
    </div>
  );
}
