import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  outputFileTracingRoot: monorepoRoot,
  output: "standalone",
  // The Prisma client is a workspace source package; Next must transpile it.
  transpilePackages: ["@ph360/database"],
  // Force the generated Prisma client + query engine into the standalone bundle
  // (the engine .node binary is otherwise not traced reliably).
  outputFileTracingIncludes: {
    "/api/**": ["../../packages/database/generated/**"],
  },
};

export default nextConfig;
