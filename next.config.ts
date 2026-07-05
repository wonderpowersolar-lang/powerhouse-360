import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in $HOME confuses inference).
  turbopack: { root: __dirname },
  // Self-contained server build for Node.js hosting (Hostinger): `next build`
  // then emits .next/standalone with a minimal server.js + pruned node_modules.
  // Deploy bundle = .next/standalone + .next/static + public  →  `node server.js`.
  output: "standalone",
};

export default nextConfig;
