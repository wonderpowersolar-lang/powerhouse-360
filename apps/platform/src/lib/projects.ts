import { prisma } from "@ph360/database";
import { requirePermission, recordAudit } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { publishEvent } from "@ph360/events";
import { getPowerhouseOrgId } from "./org";

/**
 * Projekt-Grundgerüst (WP-1.5). Anlage ist Plattform-Sache
 * (`project.create` im POWERHOUSE-Mandanten — wie accessscope.manage);
 * der Datensatz gehört der Kunden-Organisation (Tenant-Anker wie Property).
 * Die automatische Projekterzeugung aus der Quote kommt in Phase 4 (F-23)
 * und nutzt genau diesen Service.
 */
export async function createProject(
  ctx: AuthContext | null,
  input: {
    /** Kunden-Organisation, der das Projekt gehört. */
    organizationId: string;
    customerId?: string | null;
    propertyId?: string | null;
    name: string;
    /** Optionale Phasen-Labels in Reihenfolge (Position = Index). */
    phases?: string[];
  },
) {
  const powerhouseOrgId = await getPowerhouseOrgId();
  const auth = await requirePermission(ctx, "project.create", {
    organizationId: powerhouseOrgId,
  });

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        organizationId: input.organizationId,
        customerId: input.customerId ?? null,
        propertyId: input.propertyId ?? null,
        name: input.name,
        phases: input.phases?.length
          ? { create: input.phases.map((label, i) => ({ label, position: i })) }
          : undefined,
      },
      include: { phases: { orderBy: { position: "asc" } } },
    });
    await recordAudit(tx, {
      action: "project.created",
      subjectType: "Project",
      subjectId: project.id,
      actorType: "USER",
      actorId: auth.userId,
      organizationId: input.organizationId,
      after: { name: project.name, customerId: project.customerId, propertyId: project.propertyId },
    });
    await publishEvent(tx, {
      eventType: "project.created",
      aggregateType: "Project",
      aggregateId: project.id,
      organizationId: input.organizationId,
      actorId: auth.userId,
      payload: { projectId: project.id },
    });
    return project;
  });
}

/** Projektliste für die Plattform-Sicht (Guard: `project.read`). */
export async function listProjects(ctx: AuthContext | null) {
  const powerhouseOrgId = await getPowerhouseOrgId();
  await requirePermission(ctx, "project.read", { organizationId: powerhouseOrgId });
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true } },
      property: { select: { name: true } },
      _count: { select: { phases: true, milestones: true, workOrders: true, documents: true } },
    },
  });
}
