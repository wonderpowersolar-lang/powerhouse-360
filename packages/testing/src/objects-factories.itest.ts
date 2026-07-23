import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { createOrg, createProperty, createBuilding, createEntrance, createUnit } from "./index.js";

describe("Objekt-Factories (WP-1.3-Kern)", () => {
  it("erzeugt einen vollständigen Objektbaum mit Defaults", async () => {
    const org = await createOrg("WEG");
    const property = await createProperty(org.id);
    const building = await createBuilding(property.id);
    const entrance = await createEntrance(building.id);
    const unit = await createUnit(building.id, { entranceId: entrance.id, floor: 2 });

    const loaded = await prisma.property.findUniqueOrThrow({
      where: { id: property.id },
      include: { buildings: { include: { address: true, entrances: true, units: true } } },
    });
    expect(loaded.organizationId).toBe(org.id);
    expect(loaded.buildings).toHaveLength(1);
    expect(loaded.buildings[0]!.address.city).toBe("Berlin");
    expect(loaded.buildings[0]!.units[0]!.id).toBe(unit.id);
    expect(loaded.buildings[0]!.units[0]!.floor).toBe(2);
    expect(loaded.buildings[0]!.units[0]!.entranceId).toBe(entrance.id);
  });

  it("Defaults kollidieren nicht (zwei Units ohne Label-Override im selben Gebäude)", async () => {
    const org = await createOrg("WEG");
    const property = await createProperty(org.id);
    const building = await createBuilding(property.id);
    await createUnit(building.id);
    await createUnit(building.id);
    expect(await prisma.unit.count({ where: { buildingId: building.id } })).toBe(2);
  });
});
