import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { AuthzError } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { createOrg, createProperty } from "@ph360/testing";
import { createProject, listProjects } from "./projects";

function ctx(memberships: AuthContext["memberships"], userId = "u-proj-test"): AuthContext {
  return { userId, email: "t@example.test", name: "Test", memberships };
}

describe("Projekt-Grundgerüst (WP-1.5-Gate: Projekt-Anlage mit Berechtigung)", () => {
  it("legt Projekt mit Phasen an, gehört der Kunden-Org, schreibt Audit + Outbox", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const property = await createProperty(weg.id);
    const ops = ctx([{ organizationId: powerhouse.id, role: "OPERATIONS" }]);

    const project = await createProject(ops, {
      organizationId: weg.id,
      propertyId: property.id,
      name: "Powermieter Umsetzung",
      phases: ["Objektaufnahme", "Technische Planung", "Installation"],
    });

    expect(project.organizationId).toBe(weg.id);
    expect(project.status).toBe("DRAFT");
    expect(project.phases.map((p) => p.label)).toEqual([
      "Objektaufnahme",
      "Technische Planung",
      "Installation",
    ]);
    expect(project.phases.map((p) => p.position)).toEqual([0, 1, 2]);

    // Milestone + WorkOrder am Gerüst nutzbar
    await prisma.projectMilestone.create({
      data: { projectId: project.id, label: "Kickoff" },
    });
    await prisma.workOrder.create({
      data: { organizationId: weg.id, projectId: project.id, title: "Begehung" },
    });
    const loaded = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
      include: { milestones: true, workOrders: true },
    });
    expect(loaded.milestones).toHaveLength(1);
    expect(loaded.workOrders[0]!.status).toBe("OPEN");

    const audit = await prisma.auditEvent.findFirst({
      where: { action: "project.created", subjectId: project.id },
    });
    expect(audit?.organizationId).toBe(weg.id);
    const outbox = await prisma.domainEvent.findFirst({
      where: { eventType: "project.created", aggregateId: project.id },
    });
    expect(outbox?.status).toBe("PENDING");
  });

  it("verweigert Rollen ohne project.create (F-20) und doppelte Projektnamen je Org", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const weg = await createOrg("WEG");
    const input = { organizationId: weg.id, name: "Projekt X" };

    await expect(
      createProject(ctx([{ organizationId: powerhouse.id, role: "SALES" }]), input),
    ).rejects.toBeInstanceOf(AuthzError);
    await expect(
      createProject(ctx([{ organizationId: weg.id, role: "OPERATIONS" }]), input),
    ).rejects.toBeInstanceOf(AuthzError); // OPERATIONS außerhalb POWERHOUSE-Org
    expect(await prisma.project.count()).toBe(0);

    const admin = ctx([{ organizationId: powerhouse.id, role: "PLATFORM_ADMIN" }]);
    await createProject(admin, input);
    await expect(createProject(admin, input)).rejects.toThrow(); // @@unique([organizationId, name])
  });

  it("listProjects verlangt project.read", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    await expect(
      listProjects(ctx([{ organizationId: powerhouse.id, role: "RESIDENT" }])),
    ).rejects.toBeInstanceOf(AuthzError);
    expect(
      await listProjects(ctx([{ organizationId: powerhouse.id, role: "SERVICE" }])),
    ).toEqual([]);
  });
});
