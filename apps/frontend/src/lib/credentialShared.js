/**
 * Shared constants and helpers for credential templates.
 */
import { COUNTRIES } from "@/lib/geography";

export const BRAND_BLUE  = "#3878be";
export const CARD_W      = 648;
export const CARD_H      = 408;
export const PRINT_W     = 324;
export const PRINT_H     = 204;

// Exact countries shown in the Presbítero banner (in display order)
export const PRESBYTER_COUNTRIES = [
  "ar", // Argentina
  "au", // Australia
  "ao", // Angola
  "bo", // Bolivia
  "br", // Brasil
  "cl", // Chile
  "cr", // Costa Rica
  "ec", // Ecuador
  "sv", // El Salvador
  "es", // España
  "us", // Estados Unidos
  "mx", // México
  "pa", // Panamá
  "py", // Paraguay
  "pe", // Perú
  "se", // Suecia
  "uy", // Uruguay
  "ve", // Venezuela
];

export function formatExpiry(dateStr) {
  if (!dateStr) return "";
  const months = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const [y, m] = dateStr.split("-");
  if (!y || !m) return dateStr.toUpperCase();
  return `${months[parseInt(m, 10) - 1]} DEL ${y}`;
}

export function resolveCountry(val) {
  if (!val) return { name: "", code: "" };
  const found = COUNTRIES.find((c) => c.code === val || c.name === val);
  return found ? { name: found.name, code: found.code.toLowerCase() } : { name: val, code: "" };
}

export function buildTitle(title) {
  if (!title) return "PASTOR";
  const u = title.toUpperCase().trim();
  return u.startsWith("PASTOR") ? u : `PASTOR ${u}`;
}

export function isPresbitero(title) {
  return title.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("PRESBIT");
}

export function parsePastor(pastor) {
  return {
    name:         `${pastor.first_name ?? ""} ${pastor.last_name ?? ""}`.trim() || pastor.full_name || "",
    doc:          pastor.document_number || pastor.rut || "",
    rawTitle:     pastor.degree_title    || pastor.titulo || "",
    church:       pastor.churches?.name  || pastor.iglesia || "",
    country:      resolveCountry(pastor.country),
    photo:        pastor.photo_url       || pastor.photoUrl || null,
    expiry:       pastor.expiry_date     || pastor.fechaVencimiento || "",
  };
}

/** Wrapper that scales a full-size card (648×408) down to print size (324×204) */
export function PrintCard({ children }) {
  return (
    <div style={{ width: PRINT_W, height: PRINT_H, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ transform: "scale(0.5)", transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

/** Reusable flag image with high-res source */
export function FlagImg({ code, style = {} }) {
  if (!code) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w160/${code}.png`}
      alt={code}
      style={{ borderRadius: 2, border: "0.5px solid rgba(0,0,0,0.15)", ...style }}
    />
  );
}

/** Barcode hook — call inside the Back component */
export function useBarcode(ref, doc) {
  const { useEffect } = require("react");
  useEffect(() => {
    if (!ref.current || !doc) return;
    try {
      const JsBarcode = require("jsbarcode");
      JsBarcode(ref.current, doc, {
        format: "CODE128", displayValue: false,
        width: 1.6, height: 40, margin: 0,
        background: "#fff", lineColor: "#000",
      });
    } catch { /* invalid chars */ }
  }, [ref, doc]);
}
