import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence multi-lockfile warning in monorepo
  outputFileTracingRoot: path.join(__dirname, "../../"),
  eslint: {
    // ESLint runs separately in CI; skip during next build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
