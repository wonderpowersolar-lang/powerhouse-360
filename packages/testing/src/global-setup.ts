import { execSync } from "node:child_process";
import { Client } from "pg";

export default async function setup(): Promise<void> {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("DATABASE_URL_TEST is not set (see .env.example)");
  // Never CREATE DATABASE / migrate deploy against a non-test DB (misconfigured DATABASE_URL_TEST).
  const dbName = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  if (!/_test$|ph360_test/.test(dbName)) {
    throw new Error(`Refusing to run test setup: "${dbName}" is not a test database (DATABASE_URL_TEST)`);
  }
  await ensureDatabaseExists(url);
  execSync("pnpm --filter @ph360/database exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url },
  });
}

async function ensureDatabaseExists(url: string): Promise<void> {
  const target = new URL(url);
  const dbName = decodeURIComponent(target.pathname.replace(/^\//, ""));
  target.pathname = "/postgres";
  const admin = new Client({ connectionString: target.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.end();
  }
}
