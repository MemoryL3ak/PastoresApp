/**
 * Normalize text for accent-insensitive comparisons.
 * Lowercases and strips Unicode combining diacritical marks (U+0300–U+036F)
 * after NFD decomposition. Mirrors the SQL transformation used by the
 * *_unaccent generated columns (lower(immutable_unaccent(value))).
 */
export function stripAccents(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
