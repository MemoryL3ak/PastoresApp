import { createBrowserClient } from "@supabase/ssr";

// Fallbacks prevent build-time crash when env vars are absent (Railway CI).
// At runtime the real values are always present.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build"
);
