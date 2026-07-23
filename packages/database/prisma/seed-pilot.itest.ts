import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { seedPilotStructure } from "./seed-objects.js";

describe("Pilotstruktur-Seed (ADR-006, WP-1.3-Kern)", () => {
  it("legt 1 Property, 2 Gebäude, 21 Units an und ist idempotent", async () => {
    const first = await seedPilotStructure(prisma);
    const second = await seedPilotStructure(prisma); // zweiter Lauf: keine Duplikate
    expect(second.propertyId).toBe(first.propertyId);
    expect(second.organizationId).toBe(first.organizationId);

    expect(await prisma.property.count()).toBe(1);
    expect(await prisma.building.count()).toBe(2);
    expect(await prisma.entrance.count()).toBe(2);
    expect(await prisma.unit.count()).toBe(21);

    const buildings = await prisma.building.findMany({
      include: { address: true, units: true },
      orderBy: { name: "asc" },
    });
    expect(buildings.map((b) => b.name)).toEqual(["Christinenstraße 36", "Lottumstraße 22"]);
    expect(buildings[0]!.units).toHaveLength(11);
    expect(buildings[1]!.units).toHaveLength(10);
    expect(buildings[0]!.address.street).toBe("Christinenstraße");
    expect(buildings[0]!.address.postalCode).toBe("10119");
    expect(buildings[1]!.address.street).toBe("Lottumstraße");
    // Jede Unit hängt am Haupteingang ihres Gebäudes
    for (const b of buildings) for (const u of b.units) expect(u.entranceId).not.toBeNull();
  });

  it("verwendet einen als TEST gekennzeichneten Mandanten und legt keinen zweiten an", async () => {
    const preexisting = await prisma.organization.create({
      data: { type: "WEG", name: "TEST — Pilot Christinenstraße" },
    });
    const { organizationId } = await seedPilotStructure(prisma);
    expect(organizationId).toBe(preexisting.id);
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
    expect(org.name.startsWith("TEST — ")).toBe(true);
    expect(await prisma.organization.count({ where: { name: { startsWith: "TEST — " } } })).toBe(1);
  });
});
