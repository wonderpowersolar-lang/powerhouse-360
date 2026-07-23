import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  outputFileTracingRoot: monorepoRoot,
  output: "standalone",
  // Workspace source packages (raw TS, no build step) Next must transpile.
  transpilePackages: ["@ph360/database", "@ph360/auth", "@ph360/permissions"],
  // better-auth stays external (node built-ins + dynamic next/headers import).
  // @ph360/database is transpiled above, so it must NOT also be external here.
  serverExternalPackages: ["better-auth"],
  // Force the generated Prisma client + query engine into the standalone bundle
  // (the engine .node binary is otherwise not traced reliably).
  outputFileTracingIncludes: {
    "/api/**": ["../../packages/database/generated/**"],
  },
};

export default nextConfig;
