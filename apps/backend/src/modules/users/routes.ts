import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const ROLES = ["admin", "country_assigned", "viewer"] as const;

const createUserSchema = z.object({
  email:            z.string().email(),
  password:         z.string().min(6),
  full_name:        z.string().min(1),
  role:             z.enum(ROLES).default("viewer"),
  assigned_country: z.string().optional(),
});

const updateUserSchema = z.object({
  email:            z.string().email().optional(),
  full_name:        z.string().min(1).optional(),
  role:             z.enum(ROLES).optional(),
  assigned_country: z.string().nullable().optional(),
  is_active:        z.boolean().optional(),
});

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (_request, reply) => {
    // Fetch profiles and auth users in parallel, then merge emails
    const [profilesResult, authResult] = await Promise.all([
      app.supabaseAdmin
        .schema("core")
        .from("profiles")
        .select("id, full_name, role, assigned_country, is_active, created_at")
        .order("created_at", { ascending: false }),
      app.supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (profilesResult.error) return reply.badRequest(profilesResult.error.message);
    if (authResult.error)     return reply.badRequest(authResult.error.message);

    const emailMap = new Map(authResult.data.users.map((u) => [u.id, u.email]));

    return (profilesResult.data ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? null,
    }));
  });

  app.post("/", async (request, reply) => {
    const payload = createUserSchema.parse(request.body);

    const { data: authData, error: authError } = await app.supabaseAdmin.auth.admin.createUser({
      email:         payload.email,
      password:      payload.password,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (authError) return reply.badRequest(authError.message);
    if (!authData.user) return reply.badRequest("No se pudo crear el usuario");

    const { data, error } = await app.supabaseAdmin
      .schema("core")
      .from("profiles")
      .upsert({
        id:               authData.user.id,
        full_name:        payload.full_name,
        role:             payload.role,
        assigned_country: payload.assigned_country ?? null,
        is_active:        true,
      })
      .select("id, full_name, role, assigned_country, is_active")
      .single();

    if (error) return reply.badRequest(error.message);
    return reply.code(201).send({ ...data, email: payload.email });
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = updateUserSchema.parse(request.body);
    const { email, ...profilePayload } = payload;

    // Update email in auth if provided
    if (email) {
      const { error: authError } = await app.supabaseAdmin.auth.admin.updateUserById(id, { email });
      if (authError) return reply.badRequest(authError.message);
    }

    // Update profile fields if any
    if (Object.keys(profilePayload).length > 0) {
      const { data, error } = await app.supabaseAdmin
        .schema("core")
        .from("profiles")
        .update(profilePayload)
        .eq("id", id)
        .select("id, full_name, role, assigned_country, is_active")
        .single();

      if (error) return reply.badRequest(error.message);
      return { ...data, email: email ?? undefined };
    }

    return reply.code(204).send();
  });

  app.patch("/:id/reset-password", async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const { password } = z.object({ password: z.string().min(6) }).parse(request.body);

    const { error } = await app.supabaseAdmin.auth.admin.updateUserById(id, {
      password,
      user_metadata: { must_change_password: true },
    });

    if (error) return reply.badRequest(error.message);
    return reply.code(204).send();
  });
};
