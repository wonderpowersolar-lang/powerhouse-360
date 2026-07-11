import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  outputFileTracingRoot: monorepoRoot,
  output: "standalone",
  // The Prisma client is a workspace source package; Next must transpile it.
  transpilePackages: ["@ph360/database"],
};

export default nextConfig;
