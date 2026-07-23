import { PrismaClient } from "@ph360/database";

export function makeTestPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("DATABASE_URL_TEST is not set");
  return new PrismaClient({ datasourceUrl: url });
}

/** A database is a test DB only if its name ends in `_test` (covers ph360_test). */
const LOOKS_LIKE_TEST = /_test$|ph360_test/;

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  // Guard on the ACTUAL connected database, not an env-var string: the passed
  // client may be the app singleton bound to DATABASE_URL (dev), while
  // DATABASE_URL_TEST is also set — an env-based check would fail open and wipe dev.
  const rows = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
  const dbName = rows[0]?.current_database ?? "";
  if (!LOOKS_LIKE_TEST.test(dbName)) {
    throw new Error(`Refusing to truncate: connected database "${dbName}" is not a test DB`);
  }
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
