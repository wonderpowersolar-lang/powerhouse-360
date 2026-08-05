import type { PrismaClient, IssuingEntity } from "../generated/client/index.js";

/**
 * IssuingEntity-Stammdaten (Masterplan §4): getrennte Rechtsträger, ein System.
 * Idempotent per upsert über den stabilen technischen `key`. Namensänderungen
 * laufen über den upsert-update-Zweig — der `key` ändert sich nie.
 */
export const ISSUING_ENTITIES = [
  { key: "WONDERPOWER", name: "Wonderpower GmbH" },
  { key: "AKL_POWERHOUSE", name: "AKL Powerhouse 360 GmbH" },
] as const;

export async function seedIssuingEntities(prisma: PrismaClient): Promise<IssuingEntity[]> {
  const out: IssuingEntity[] = [];
  for (const spec of ISSUING_ENTITIES) {
    out.push(
      await prisma.issuingEntity.upsert({
        where: { key: spec.key },
        update: { name: spec.name },
        create: { key: spec.key, name: spec.name },
      }),
    );
  }
  return out;
}
