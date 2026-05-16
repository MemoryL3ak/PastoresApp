import { stripAccents } from "./text.js";

// Keep in sync with apps/frontend/src/lib/geography.js COUNTRIES.
export const COUNTRY_NAMES: Record<string, string> = {
  CL: "Chile",        AR: "Argentina",     AO: "Angola",
  AU: "Australia",    BO: "Bolivia",       BR: "Brasil",
  CO: "Colombia",     CR: "Costa Rica",    CU: "Cuba",
  DO: "República Dominicana",
  EC: "Ecuador",      SV: "El Salvador",   ES: "España",
  US: "Estados Unidos", GT: "Guatemala",   HN: "Honduras",
  MX: "México",       NI: "Nicaragua",     PA: "Panamá",
  PY: "Paraguay",     PE: "Perú",          PR: "Puerto Rico",
  SE: "Suecia",       UY: "Uruguay",       VE: "Venezuela",
  OTHER: "Otro",
};

/** Resolve a free-text country query to matching ISO codes (partial, accent-insensitive). */
export function resolveCountryCodes(text: string): string[] {
  const needle = stripAccents(text);
  return Object.entries(COUNTRY_NAMES)
    .filter(([, name]) => stripAccents(name).includes(needle))
    .map(([code]) => code);
}
