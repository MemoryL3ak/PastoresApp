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

export const authPlugin = fp(async (app) => {
  app.decorateRequest("callerProfile", null as unknown as CallerProfile);

  app.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    if (PUBLIC_PATHS.has(request.url.split("?")[0])) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.unauthorized("Token requerido");
    }

    const token = authHeader.slice(7);
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
  });
});
