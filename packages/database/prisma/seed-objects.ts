import type { PrismaClient } from "../generated/client/index.js";

/** ADR-006: dauerhafter, klar gekennzeichneter Testmandant („TEST — …"). */
export const TEST_TENANT_NAME = "TEST — Pilot Christinenstraße";

/**
 * Pilotstruktur (Masterplan §1: WEG Christinenstraße 36 / Lottumstraße 22,
 * Berlin, 21 Messstellen/Einheiten). Dokumentierte Annahme bis zum
 * Pilot-CSV-Realimport (WP-1.3-Rest): Verteilung 11/10 Units, 2 WE je Etage.
 * Der Realimport korrigiert Verteilung/Etagen; Summe 21 ist verbindlich.
 */
const PILOT = {
  propertyName: "WEG Christinenstraße 36 / Lottumstraße 22",
  buildings: [
    { name: "Christinenstraße 36", street: "Christinenstraße", houseNumber: "36", postalCode: "10119", city: "Berlin", unitCount: 11 },
    { name: "Lottumstraße 22", street: "Lottumstraße", houseNumber: "22", postalCode: "10119", city: "Berlin", unitCount: 10 },
  ],
} as const;

/**
 * Idempotent: Wiederverwendung eines vorhandenen Testmandanten (Namenspräfix
 * „TEST — ", z. B. aus dem WP-1.2-V2-Delta-Seed); alle Strukturknoten per
 * upsert über ihre natürlichen Unique-Keys. Beliebig oft ausführbar.
 */
export async function seedPilotStructure(
  prisma: PrismaClient,
): Promise<{ organizationId: string; propertyId: string }> {
  const org =
    (await prisma.organization.findFirst({
      where: { name: { startsWith: "TEST — " } },
      orderBy: { createdAt: "asc" },
    })) ?? (await prisma.organization.create({ data: { type: "WEG", name: TEST_TENANT_NAME } }));

  const property = await prisma.property.upsert({
    where: { organizationId_name: { organizationId: org.id, name: PILOT.propertyName } },
    update: {},
    create: { organizationId: org.id, name: PILOT.propertyName },
  });

  for (const spec of PILOT.buildings) {
    let building = await prisma.building.findUnique({
      where: { propertyId_name: { propertyId: property.id, name: spec.name } },
    });
    if (!building) {
      building = await prisma.building.create({
        data: {
          property: { connect: { id: property.id } },
          name: spec.name,
          address: {
            create: { street: spec.street, houseNumber: spec.houseNumber, postalCode: spec.postalCode, city: spec.city },
          },
        },
      });
    }

    const entrance = await prisma.entrance.upsert({
      where: { buildingId_label: { buildingId: building.id, label: "Haupteingang" } },
      update: {},
      create: { buildingId: building.id, label: "Haupteingang" },
    });

    for (let i = 1; i <= spec.unitCount; i++) {
      const label = `WE ${String(i).padStart(2, "0")}`;
      await prisma.unit.upsert({
        where: { buildingId_label: { buildingId: building.id, label } },
        update: {},
        create: {
          buildingId: building.id,
          entranceId: entrance.id,
          label,
          floor: Math.floor((i - 1) / 2), // 0 = EG; Annahme 2 WE je Etage (s. o.)
        },
      });
    }
  }

  return { organizationId: org.id, propertyId: property.id };
}
