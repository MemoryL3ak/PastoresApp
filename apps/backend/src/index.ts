import { createApp } from "./app.js";
import { env } from "./config/env.js";

const bootstrap = async () => {
  const app = await createApp();

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
