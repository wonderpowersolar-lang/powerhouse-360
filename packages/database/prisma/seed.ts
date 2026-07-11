import { PrismaClient } from "../generated/client/index.js";

const prisma = new PrismaClient();

/**
 * Idempotent seed: ensures the Powerhouse 360 tenant exists. This is the
 * organization that receives inbound leads (WP-1.1). Re-runnable.
 */
async function main() {
  const existing = await prisma.organization.findFirst({
    where: { type: "POWERHOUSE" },
  });

  const org =
    existing ??
    (await prisma.organization.create({
      data: { type: "POWERHOUSE", name: "AKL Powerhouse 360 GmbH" },
    }));

  console.log(`[seed] Powerhouse organization: ${org.id} (${org.name})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[seed] failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
