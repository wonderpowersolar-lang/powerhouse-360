import { PrismaClient } from "../generated/client/index.js";
import { seedPilotStructure } from "./seed-objects.js";

const prisma = new PrismaClient();

/**
 * Idempotent seed: ensures the Powerhouse 360 tenant exists. This is the
 * organization that receives inbound leads (WP-1.1). Re-runnable.
 * WP-1.3-Kern: + Pilotstruktur im ADR-006-Testmandanten.
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

  const pilot = await seedPilotStructure(prisma);
  console.log(
    `[seed] Pilotstruktur im Testmandanten ${pilot.organizationId}: Property ${pilot.propertyId} (2 Gebäude, 21 Units)`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[seed] failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
