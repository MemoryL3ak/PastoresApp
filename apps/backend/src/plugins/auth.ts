import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";

export interface CallerProfile {
  id: string;
  role: "admin" | "country_assigned" | "viewer";
  assigned_country: string | null;
  is_active: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    callerProfile: CallerProfile;
  }
}

/** Routes that don't require authentication */
const PUBLIC_PATHS = new Set(["/v1/health"]);

/**
 * Verified token → profile cache. Validating a token costs two round trips to
 * Supabase (auth + profile); caching them briefly makes every other request skip both.
 * Entries never outlive the token's own expiry.
 */
const AUTH_CACHE_TTL_MS = 60_000;
const AUTH_CACHE_MAX = 1000;
const authCache = new Map<string, { profile: CallerProfile; expiresAt: number }>();

/** Call after changing a user's role, country or active status so it applies immediately. */
export function clearAuthCache() {
  authCache.clear();
}

function tokenExpiryMs(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorateRequest("callerProfile", null as unknown as CallerProfile);

  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    if (PUBLIC_PATHS.has(request.url.split("?")[0])) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.unauthorized("Token requerido");
    }

    const token = authHeader.slice(7);
    const now = Date.now();
    const cached = authCache.get(token);
    if (cached && cached.expiresAt > now) {
      request.callerProfile = cached.profile;
      return;
    }
    if (cached) authCache.delete(token);

    const { data: { user }, error: authError } = await app.supabaseAdmin.auth.getUser(token);
    if (authError || !user) return reply.unauthorized("Token inválido");

    const { data: profile, error: profileError } = await app.supabaseAdmin
      .schema("core")
      .from("profiles")
      .select("id, role, assigned_country, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) return reply.unauthorized("Perfil no encontrado");
    if (!profile.is_active) return reply.forbidden("Usuario inactivo");

    request.callerProfile = profile as CallerProfile;

    if (authCache.size >= AUTH_CACHE_MAX) {
      for (const [key, entry] of authCache) if (entry.expiresAt <= now) authCache.delete(key);
      if (authCache.size >= AUTH_CACHE_MAX) authCache.clear();
    }
    authCache.set(token, {
      profile: profile as CallerProfile,
      expiresAt: Math.min(now + AUTH_CACHE_TTL_MS, tokenExpiryMs(token)),
    });
  });
});
