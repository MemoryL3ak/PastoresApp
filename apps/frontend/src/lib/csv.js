/**
 * Export helpers for CSV and XLSX.
 * Both formats share the same `columns` shape: { key, label, value? }.
 *   - key  → reads row[key]
 *   - value(row) → function form, useful for derived/computed cells
 */
import * as XLSX from "xlsx";

const BOM = "﻿";

function readCell(row, col) {
  return typeof col.value === "function" ? col.value(row) : row[col.key];
}

// ── CSV ─────────────────────────────────────────────────────────────

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCSV(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(readCell(row, c))).join(","))
    .join("\n");
  return BOM + header + "\n" + body;
}

export function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function exportToCSV(filename, rows, columns) {
  downloadCSV(filename, toCSV(rows, columns));
}

// ── XLSX ────────────────────────────────────────────────────────────

export function exportToXLSX(filename, rows, columns, sheetName = "Datos") {
  const header = columns.map((c) => c.label);
  const body   = rows.map((row) => columns.map((c) => {
    const v = readCell(row, c);
    return v === null || v === undefined ? "" : v;
  }));

  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);

  // Column widths: fit to longest value in each column (capped).
  sheet["!cols"] = columns.map((_, idx) => {
    const lengths = [header[idx], ...body.map((r) => r[idx])].map((v) => String(v ?? "").length);
    const max = Math.max(8, ...lengths);
    return { wch: Math.min(40, max + 2) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31));

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

// ── Internal ────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
