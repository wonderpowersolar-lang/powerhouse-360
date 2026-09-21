import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { AuthzError } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { createOrg, createProperty, createBuilding } from "@ph360/testing";
import { grantAccessScope, revokeAccessScope } from "./access-scopes";
import { resolvePropertyVisibility, getReadablePropertyTree } from "./objects";

function ctx(memberships: AuthContext["memberships"], userId = "u-scope-test"): AuthContext {
  return { userId, email: "t@example.test", name: "Test", memberships };
}

describe("AccessScope-Guard-Integration (WP-1.3-Rest, ADR-004 / Masterplan §4 Nr. 1)", () => {
  it("PROPERTY-Scope macht ein fremdes Objekt für die HV sichtbar — auditiert", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const hv = await createOrg("PROPERTY_MANAGER");
    const property = await createProperty(weg.id);
    await createBuilding(property.id);
    const admin = ctx([{ organizationId: powerhouse.id, role: "PLATFORM_ADMIN" }]);
    const hvCtx = ctx([{ organizationId: hv.id, role: "PROPERTY_MANAGER" }]);

    // Vorher: HV sieht nichts Fremdes (deny-by-default).
    expect(await getReadablePropertyTree(hvCtx)).toEqual([]);

    const { created } = await grantAccessScope(admin, {
      organizationId: hv.id,
      scopeType: "PROPERTY",
      propertyId: property.id,
    });
    expect(created).toBe(true);

    const vis = await resolvePropertyVisibility(hvCtx);
    expect(vis).toMatchObject({ platform: false, propertyIds: [property.id] });
    const tree = await getReadablePropertyTree(hvCtx);
    expect(tree.map((p) => p.id)).toEqual([property.id]);
    expect(tree[0]!.buildings).toHaveLength(1); // voller Teilbaum bei PROPERTY-Scope

    const audit = await prisma.auditEvent.findFirst({ where: { action: "accessscope.granted" } });
    expect(audit?.organizationId).toBe(hv.id);
    expect(audit?.actorId).toBe("u-scope-test");
  });

  it("BUILDING-Scope zeigt nur das gewährte Gebäude (Teilbaum)", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const hv = await createOrg("PROPERTY_MANAGER");
    const property = await createProperty(weg.id);
    const granted = await createBuilding(property.id, { name: "Gebäude A" });
    await createBuilding(property.id, { name: "Gebäude B" });
    const admin = ctx([{ organizationId: powerhouse.id, role: "PLATFORM_ADMIN" }]);
    const hvCtx = ctx([{ organizationId: hv.id, role: "PROPERTY_MANAGER" }]);

    await grantAccessScope(admin, {
      organizationId: hv.id,
      scopeType: "BUILDING",
      buildingId: granted.id,
    });

    const tree = await getReadablePropertyTree(hvCtx);
    expect(tree.map((p) => p.id)).toEqual([property.id]);
    expect(tree[0]!.buildings.map((b) => b.id)).toEqual([granted.id]);
  });

  it("Revoke entzieht die Sicht wieder — auditiert", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const hv = await createOrg("PROPERTY_MANAGER");
    const property = await createProperty(weg.id);
    const admin = ctx([{ organizationId: powerhouse.id, role: "PLATFORM_ADMIN" }]);
    const hvCtx = ctx([{ organizationId: hv.id, role: "PROPERTY_MANAGER" }]);

    const { scope } = await grantAccessScope(admin, {
      organizationId: hv.id,
      scopeType: "PROPERTY",
      propertyId: property.id,
    });
    expect(await getReadablePropertyTree(hvCtx)).toHaveLength(1);

    await revokeAccessScope(admin, scope.id);
    expect(await getReadablePropertyTree(hvCtx)).toEqual([]);
    expect(await prisma.accessScope.count()).toBe(0);
    expect(
      await prisma.auditEvent.count({ where: { action: "accessscope.revoked" } }),
    ).toBe(1);
  });

  it("Vergabe verlangt accessscope.manage im POWERHOUSE-Mandanten (F-20)", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const hv = await createOrg("PROPERTY_MANAGER");
    const property = await createProperty(weg.id);

    await expect(
      grantAccessScope(ctx([{ organizationId: powerhouse.id, role: "SALES" }]), {
        organizationId: hv.id,
        scopeType: "PROPERTY",
        propertyId: property.id,
      }),
    ).rejects.toBeInstanceOf(AuthzError);
    // PLATFORM_ADMIN einer Fremd-Org (nicht POWERHOUSE) darf ebenfalls nicht.
    await expect(
      grantAccessScope(ctx([{ organizationId: hv.id, role: "PLATFORM_ADMIN" }]), {
        organizationId: hv.id,
        scopeType: "PROPERTY",
        propertyId: property.id,
      }),
    ).rejects.toBeInstanceOf(AuthzError);
    expect(await prisma.accessScope.count()).toBe(0);
  });

  it("doppelter Grant ist idempotent", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const hv = await createOrg("PROPERTY_MANAGER");
    const property = await createProperty(weg.id);
    const admin = ctx([{ organizationId: powerhouse.id, role: "PLATFORM_ADMIN" }]);

    const first = await grantAccessScope(admin, {
      organizationId: hv.id,
      scopeType: "PROPERTY",
      propertyId: property.id,
    });
    const second = await grantAccessScope(admin, {
      organizationId: hv.id,
      scopeType: "PROPERTY",
      propertyId: property.id,
    });
    expect(second.created).toBe(false);
    expect(second.scope.id).toBe(first.scope.id);
    expect(await prisma.accessScope.count()).toBe(1);
  });
});
