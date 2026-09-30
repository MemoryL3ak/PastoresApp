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
  // Local testing against the deployed backend: set API_PROXY_TARGET (e.g. the Railway URL,
  // no trailing /v1) and NEXT_PUBLIC_API_BASE_URL=/api-proxy/v1. Requests then go through
  // Next's own server, so the backend's CORS allow-list (production origin) doesn't block
  // localhost. Inactive unless API_PROXY_TARGET is set.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    if (!target || !/^https?:\/\//.test(target)) return [];
    return [{ source: "/api-proxy/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
