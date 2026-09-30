import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pastor photos live in Supabase Storage; the pastors table only keeps the public URL.
 * Each photo is stored twice: a credential-sized image and a small thumbnail for lists
 * (same path with a `_thumb` suffix — the frontend derives it from the photo URL).
 * Paths are random UUIDs, so URLs can't be guessed or enumerated.
 */
export const PHOTO_BUCKET = "pastor-photos";

const FULL  = { width: 600, height: 800, quality: 82 };
const THUMB = { width: 160, height: 200, quality: 75 };
const CACHE_SECONDS = "31536000"; // paths never change content, so cache for a year

let bucketReady: Promise<void> | null = null;

function ensurePhotoBucket(supabase: SupabaseClient): Promise<void> {
  bucketReady ??= (async () => {
    const { data } = await supabase.storage.getBucket(PHOTO_BUCKET);
    if (data) return;
    const { error } = await supabase.storage.createBucket(PHOTO_BUCKET, {
      public: true,
      allowedMimeTypes: ["image/jpeg"],
      fileSizeLimit: "2MB",
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  })().catch((err) => {
    bucketReady = null; // retry on the next upload
    throw err;
  });
  return bucketReady;
}

export function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

/** Resizes an inline (data URL) photo, uploads it and returns its public URL. */
export async function storePhoto(supabase: SupabaseClient, dataUrl: string): Promise<string> {
  const input = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");

  const [full, thumb] = await Promise.all([
    sharp(input)
      .rotate()
      .resize(FULL.width, FULL.height, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: FULL.quality, mozjpeg: true })
      .toBuffer(),
    sharp(input)
      .rotate()
      .resize(THUMB.width, THUMB.height, { fit: "cover", position: "top" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: THUMB.quality, mozjpeg: true })
      .toBuffer(),
  ]);

  await ensurePhotoBucket(supabase);

  const base = randomUUID();
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const options = { contentType: "image/jpeg", cacheControl: CACHE_SECONDS, upsert: false };
  const [fullRes, thumbRes] = await Promise.all([
    bucket.upload(`${base}.jpg`, full, options),
    bucket.upload(`${base}_thumb.jpg`, thumb, options),
  ]);
  if (fullRes.error) throw fullRes.error;
  if (thumbRes.error) throw thumbRes.error;

  return bucket.getPublicUrl(`${base}.jpg`).data.publicUrl;
}

/** Deletes a stored photo and its thumbnail. Best effort: failures only leave orphan files. */
export async function removePhoto(supabase: SupabaseClient, url: string | null | undefined): Promise<void> {
  const marker = `/object/public/${PHOTO_BUCKET}/`;
  if (!url || !url.includes(marker)) return;
  const path = url.slice(url.indexOf(marker) + marker.length);
  await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([path, path.replace(/\.jpg$/, "_thumb.jpg")])
    .catch(() => undefined);
}
