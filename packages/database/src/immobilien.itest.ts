import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";

let n = 0;
function makeOrg(type: "WEG" | "PROPERTY_MANAGER" = "WEG") {
  return prisma.organization.create({
    data: { type, name: `${type} ${Date.now()}-${n++}` },
  });
}

async function makeTree() {
  const org = await makeOrg();
  const property = await prisma.property.create({
    data: { organizationId: org.id, name: "Testobjekt" },
  });
  const address = await prisma.address.create({
    data: { street: "Christinenstraße", houseNumber: "36", postalCode: "10119", city: "Berlin" },
  });
  const building = await prisma.building.create({
    data: { propertyId: property.id, name: "Christinenstraße 36", addressId: address.id },
  });
  const entrance = await prisma.entrance.create({
    data: { buildingId: building.id, label: "Haupteingang" },
  });
  const unit = await prisma.unit.create({
    data: { buildingId: building.id, entranceId: entrance.id, label: "WE 01", floor: 0 },
  });
  return { org, property, address, building, entrance, unit };
}

describe("Immobilien-Kern — Schema (WP-1.3-Kern)", () => {
  it("erzeugt Property → Building(+Address) → Entrance → Unit", async () => {
    const { property, unit } = await makeTree();
    const tree = await prisma.property.findUniqueOrThrow({
      where: { id: property.id },
      include: { buildings: { include: { address: true, entrances: true, units: true } } },
    });
    expect(tree.buildings).toHaveLength(1);
    expect(tree.buildings[0]!.address.postalCode).toBe("10119");
    expect(tree.buildings[0]!.entrances[0]!.label).toBe("Haupteingang");
    expect(tree.buildings[0]!.units[0]!.id).toBe(unit.id);
    expect(tree.buildings[0]!.units[0]!.floor).toBe(0);
  });

  it("verhindert doppelte Unit-Labels je Gebäude und doppelte Property-Namen je Org", async () => {
    const { org, property, building } = await makeTree();
    await expect(
      prisma.unit.create({ data: { buildingId: building.id, label: "WE 01" } }),
    ).rejects.toThrow();
    await expect(
      prisma.property.create({ data: { organizationId: org.id, name: property.name } }),
    ).rejects.toThrow();
  });

  it("Property-Löschung kaskadiert auf Buildings/Entrances/Units", async () => {
    const { property } = await makeTree();
    await prisma.property.delete({ where: { id: property.id } });
    expect(await prisma.building.count()).toBe(0);
    expect(await prisma.entrance.count()).toBe(0);
    expect(await prisma.unit.count()).toBe(0);
  });

  it("Entrance-Löschung setzt Unit.entranceId auf null (Unit bleibt)", async () => {
    const { entrance, unit } = await makeTree();
    await prisma.entrance.delete({ where: { id: entrance.id } });
    const reloaded = await prisma.unit.findUniqueOrThrow({ where: { id: unit.id } });
    expect(reloaded.entranceId).toBeNull();
  });

  it("AccessScope-Stub: Property-Scope für eine fremde Org (HV) ist anlegbar", async () => {
    const { property } = await makeTree();
    const hv = await makeOrg("PROPERTY_MANAGER");
    const scope = await prisma.accessScope.create({
      data: { organizationId: hv.id, scopeType: "PROPERTY", propertyId: property.id },
    });
    expect(scope.scopeType).toBe("PROPERTY");
    expect(scope.buildingId).toBeNull();
  });
});
