import { describe, it, expect } from "vitest";
import type { AuthContext } from "@ph360/auth";
import { createOrg, createProperty, createBuilding, createUnit } from "@ph360/testing";
import { getReadablePropertyTree, readablePropertyOrgIds } from "./objects";

function ctx(memberships: AuthContext["memberships"]): AuthContext {
  return { userId: "u-test", email: "t@example.test", name: "Test", memberships };
}

describe("Objekt-Lesesicht — Scoping (Deklaration: permission object.read)", () => {
  it("OPERATIONS sieht nur Properties der eigenen Organisation (F-02)", async () => {
    const orgA = await createOrg("WEG");
    const orgB = await createOrg("WEG");
    const mine = await createProperty(orgA.id);
    await createProperty(orgB.id);

    const tree = await getReadablePropertyTree(
      ctx([{ organizationId: orgA.id, role: "OPERATIONS" }]),
    );
    expect(tree).toHaveLength(1);
    expect(tree[0]!.id).toBe(mine.id);
  });

  it("RESIDENT sieht nichts — deny-by-default (F-20)", async () => {
    const org = await createOrg("WEG");
    await createProperty(org.id);
    const c = ctx([{ organizationId: org.id, role: "RESIDENT" }]);
    expect(await readablePropertyOrgIds(c)).toEqual([]);
    expect(await getReadablePropertyTree(c)).toEqual([]);
  });

  it("ohne Membership: leeres Ergebnis", async () => {
    const org = await createOrg("WEG");
    await createProperty(org.id);
    expect(await getReadablePropertyTree(ctx([]))).toEqual([]);
  });

  it("PLATFORM_ADMIN einer POWERHOUSE-Org sieht mandantenübergreifend (Masterplan §4 Nr. 4)", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const property = await createProperty(weg.id);
    const building = await createBuilding(property.id);
    await createUnit(building.id, { label: "WE 01" });

    const c = ctx([{ organizationId: powerhouse.id, role: "PLATFORM_ADMIN" }]);
    expect(await readablePropertyOrgIds(c)).toBeNull(); // null = plattformweite Sicht

    const tree = await getReadablePropertyTree(c);
    const found = tree.find((p) => p.id === property.id);
    expect(found).toBeDefined();
    expect(found!.buildings[0]!.units.map((u) => u.label)).toContain("WE 01");
    expect(found!.organization.name).toBe(weg.name);
  });

  it("OPERATIONS in einer Nicht-POWERHOUSE-Org erhält KEINE Plattformsicht", async () => {
    const hv = await createOrg("PROPERTY_MANAGER");
    const weg = await createOrg("WEG");
    await createProperty(weg.id);
    const c = ctx([{ organizationId: hv.id, role: "OPERATIONS" }]);
    expect(await readablePropertyOrgIds(c)).toEqual([hv.id]);
    expect(await getReadablePropertyTree(c)).toEqual([]);
  });
});
