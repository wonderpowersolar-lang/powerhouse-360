import { describe, it, expect } from "vitest";
import { prisma, Prisma } from "@ph360/database";

let n = 0;
function makeOrg(type: "WEG" | "POWERHOUSE" = "WEG") {
  return prisma.organization.create({
    data: { type, name: `WP15-Org ${Date.now()}-${n++}` },
  });
}

describe("Modul-Gerüst (WP-1.5, ohne Fachlogik)", () => {
  it("Subscription je (Org, Modul) einmalig; Activation + versionierte Configuration hängen daran", async () => {
    const org = await makeOrg();
    const sub = await prisma.moduleSubscription.create({
      data: { organizationId: org.id, moduleKey: "POWERMIETER" },
    });
    expect(sub.status).toBe("PLANNED");
    await expect(
      prisma.moduleSubscription.create({
        data: { organizationId: org.id, moduleKey: "POWERMIETER" },
      }),
    ).rejects.toThrow(); // @@unique([organizationId, moduleKey])

    const property = await prisma.property.create({
      data: { organizationId: org.id, name: "Objekt A" },
    });
    const activation = await prisma.moduleActivation.create({
      data: { subscriptionId: sub.id, propertyId: property.id },
    });
    expect(activation.status).toBe("PENDING");

    await prisma.moduleConfiguration.create({
      data: { subscriptionId: sub.id, version: 1, config: { tarif: "dyn" } as Prisma.InputJsonValue },
    });
    await expect(
      prisma.moduleConfiguration.create({
        data: { subscriptionId: sub.id, version: 1, config: {} as Prisma.InputJsonValue },
      }),
    ).rejects.toThrow(); // @@unique([subscriptionId, version])
  });
});

describe("P3-Datenmodell-Stubs (Masterplan §5: null Fachlogik/UI/Adapter)", () => {
  it("Heat-Stubs sind migriert und anlegbar", async () => {
    const org = await makeOrg();
    const hp = await prisma.heatProject.create({
      data: { organizationId: org.id, name: "Heat Pilot" },
    });
    await prisma.readingSchedule.create({
      data: { heatProjectId: hp.id, label: "Jahresablesung", intervalDays: 365 },
    });
    await prisma.allocationKey.create({
      data: { heatProjectId: hp.id, key: "70/30", description: "Verbrauch/Grundkosten" },
    });
    await prisma.heatStatement.create({
      data: {
        heatProjectId: hp.id,
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-12-31"),
      },
    });
    expect(await prisma.heatProject.count()).toBe(1);
  });

  it("Charge-Stubs sind migriert; Energie als numeric(14,3)", async () => {
    const org = await makeOrg();
    const cp = await prisma.chargingProject.create({
      data: { organizationId: org.id, name: "Charge Pilot" },
    });
    const point = await prisma.chargePoint.create({
      data: { chargingProjectId: cp.id, label: "TG-01" },
    });
    const session = await prisma.chargingSession.create({
      data: {
        chargePointId: point.id,
        startedAt: new Date(),
        energyKwh: new Prisma.Decimal("12.345"),
      },
    });
    expect(session.energyKwh?.toString()).toBe("12.345");
    await prisma.chargingAuthorization.create({
      data: { chargingProjectId: cp.id, kind: "RFID", identifier: "CARD-001" },
    });
    await prisma.fundingCase.create({
      data: { organizationId: org.id, chargingProjectId: cp.id, program: "KfW 440" },
    });
    expect(await prisma.fundingCase.count()).toBe(1);
  });
});

describe("AccessScope PROJECT-Scope (WP-1.5: Datenmodell + Shape-CHECK)", () => {
  it("PROJECT-Scope braucht genau projectId — DB-CHECK weist falsche Formen ab", async () => {
    const powerhouse = await makeOrg("POWERHOUSE");
    const weg = await makeOrg();
    const hv = await prisma.organization.create({
      data: { type: "PROPERTY_MANAGER", name: `HV ${Date.now()}-${n++}` },
    });
    const project = await prisma.project.create({
      data: { organizationId: weg.id, name: "Scope-Projekt" },
    });

    const scope = await prisma.accessScope.create({
      data: { organizationId: hv.id, scopeType: "PROJECT", projectId: project.id },
    });
    expect(scope.projectId).toBe(project.id);

    // Shape-Verstöße: PROJECT ohne projectId / mit zusätzlichem Ziel
    await expect(
      prisma.accessScope.create({
        data: { organizationId: powerhouse.id, scopeType: "PROJECT" },
      }),
    ).rejects.toThrow();
    const property = await prisma.property.create({
      data: { organizationId: weg.id, name: "P" },
    });
    await expect(
      prisma.accessScope.create({
        data: {
          organizationId: powerhouse.id,
          scopeType: "PROJECT",
          projectId: project.id,
          propertyId: property.id,
        },
      }),
    ).rejects.toThrow();
  });
});
