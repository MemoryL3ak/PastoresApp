/**
 * One-time migration: moves inline (base64) pastor photos to Supabase Storage.
 *
 *   npm run migrate:photos -w apps/backend             → dry run: counts photos and their size
 *   npm run migrate:photos -w apps/backend -- --apply  → migrates them
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (apps/backend/.env or the environment).
 * Before touching a pastor, its original photo is appended to a local backup file
 * (photo-backup-<timestamp>.jsonl). A pastor is only updated if its photo didn't change
 * meanwhile, and the script can be re-run safely: it only picks up remaining inline photos.
 */
import { appendFileSync } from "node:fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { storePhoto } from "../src/lib/photos.js";

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const CONCURRENCY = 4;
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const pastors = () => supabase.schema("core").from("pastors");

async function listInlinePhotoIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await pastors()
      .select("id")
      .like("photo_url", "data:%")
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    ids.push(...(data ?? []).map((r) => r.id as string));
    if (!data || data.length < 1000) return ids;
  }
}

async function main() {
  const ids = await listInlinePhotoIds();
  console.log(`${ids.length} pastores con foto guardada dentro de la base de datos`);
  if (ids.length === 0) return;

  const backupFile = `photo-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
  let done = 0, failed = 0, skipped = 0, bytesBefore = 0;

  const queue = [...ids];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      try {
        const { data: row, error } = await pastors().select("photo_url").eq("id", id).single();
        if (error) throw error;
        const original = row.photo_url as string | null;
        if (!original?.startsWith("data:")) { skipped++; continue; }
        bytesBefore += original.length;

        if (!apply) { done++; continue; }

        appendFileSync(backupFile, JSON.stringify({ id, photo_url: original }) + "\n");
        const publicUrl = await storePhoto(supabase, original);
        const { data: updated, error: updateError } = await pastors()
          .update({ photo_url: publicUrl })
          .eq("id", id)
          .eq("photo_url", original) // skip if someone changed the photo meanwhile
          .select("id");
        if (updateError) throw updateError;
        if (!updated?.length) { skipped++; continue; }
        done++;
      } catch (err) {
        failed++;
        console.error(`  ✗ ${id}:`, err instanceof Error ? err.message : err);
      }
      const n = done + failed + skipped;
      if (n % 25 === 0) console.log(`  ${n}/${ids.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const mb = (bytesBefore / 1024 / 1024).toFixed(1);
  if (!apply) {
    console.log(`Tamaño total de esas fotos: ${mb} MB. Ejecuta con --apply para migrarlas.`);
    return;
  }
  console.log(`Migradas: ${done} · omitidas: ${skipped} · con error: ${failed} · ${mb} MB fuera de la base de datos`);
  console.log(`Respaldo de las fotos originales: ${backupFile}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
