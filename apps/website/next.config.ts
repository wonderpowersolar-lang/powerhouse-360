import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (apps/website -> ../../). Used to pin Turbopack's workspace
// root and to make the standalone build trace files from the pnpm workspace.
const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in $HOME confuses inference).
  turbopack: { root: monorepoRoot },
  // Self-contained server build for Node.js hosting (Hostinger): `next build`
  // then emits .next/standalone with a minimal server.js + pruned node_modules.
  // Deploy bundle = .next/standalone + .next/static + public  →  `node server.js`.
  // In a pnpm workspace the traced files live above the app dir, so trace from root.
  outputFileTracingRoot: monorepoRoot,
  output: "standalone",
};

export default nextConfig;
