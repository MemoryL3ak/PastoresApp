import fp from "fastify-plugin";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    supabaseAdmin: SupabaseClient;
  }
}

export const supabasePlugin = fp(async (app) => {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  app.decorate("supabaseAdmin", client);
});
