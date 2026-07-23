import { defineConfig } from "vitest/config";
import "dotenv/config";

const TEST_DB = process.env.DATABASE_URL_TEST;

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["packages/permissions/**/*.{test,spec}.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["packages/**/*.itest.ts", "apps/**/*.itest.ts"],
          globalSetup: ["./packages/testing/src/global-setup.ts"],
          setupFiles: ["./packages/testing/src/setup.ts"],
          env: TEST_DB ? { DATABASE_URL: TEST_DB, DIRECT_DATABASE_URL: TEST_DB } : {},
          fileParallelism: false,
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
          sequence: { concurrent: false },
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
