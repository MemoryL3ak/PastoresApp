// Photos stored in Supabase Storage have a small "_thumb" sibling for lists
// (see apps/backend/src/lib/photos.ts). Older inline photos don't, so they're returned as-is.
export function photoThumbUrl(url) {
  if (!url || !url.includes("/object/public/pastor-photos/")) return url;
  return url.replace(/\.jpg$/, "_thumb.jpg");
}
