import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { attendanceRoutes } from "./modules/attendance/routes.js";
import { credentialRoutes } from "./modules/credentials/routes.js";
import { eventRoutes } from "./modules/events/routes.js";
import { healthRoutes } from "./modules/health/routes.js";
import { pastorRoutes } from "./modules/pastors/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";
import { supabasePlugin } from "./plugins/supabase.js";

export async function createApp() {
  const app = Fastify({
    logger: true
  });

  await app.register(sensible);
  await app.register(helmet);
  await app.register(cors, {
    origin: env.APP_ORIGIN,
    credentials: true
  });
  await app.register(supabasePlugin);

  await app.register(healthRoutes, { prefix: "/v1" });
  await app.register(pastorRoutes, { prefix: "/v1/pastors" });
  await app.register(eventRoutes, { prefix: "/v1/events" });
  await app.register(attendanceRoutes, { prefix: "/v1/attendance" });
  await app.register(reportRoutes, { prefix: "/v1/reports" });
  await app.register(credentialRoutes, { prefix: "/v1/credentials" });

  return app;
}
