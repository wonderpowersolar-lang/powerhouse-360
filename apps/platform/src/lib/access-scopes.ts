import { prisma, type AccessScope, type AccessScopeType } from "@ph360/database";
import { requirePermission, recordAudit } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { getPowerhouseOrgId } from "./org";

/**
 * AccessScope-Verwaltung (WP-1.3-Rest, ADR-004 / Masterplan §4 Nr. 1):
 * Cross-Tenant-Zugriff (z. B. HV auf Objekte fremder Eigentümer-Mandanten)
 * läuft ausschließlich über explizite, auditierbare Zuweisungen — nie über
 * Sonderfälle in der Fachlogik. Vergabe/Entzug ist Plattform-Sache
 * (`accessscope.manage` im POWERHOUSE-Mandanten); jede Änderung schreibt
 * ein Audit-Event auf die begünstigte Organisation.
 * Die Form-Invariante (PROPERTY↔propertyId, BUILDING↔buildingId, genau ein
 * Ziel) erzwingt zusätzlich die DB (Migration access_scope_shape_constraints).
 */
export type GrantAccessScopeInput = {
  /** Begünstigte Organisation (z. B. die Hausverwaltung). */
  organizationId: string;
  scopeType: AccessScopeType;
  propertyId?: string | null;
  buildingId?: string | null;
};

export async function grantAccessScope(
  ctx: AuthContext | null,
  input: GrantAccessScopeInput,
): Promise<{ scope: AccessScope; created: boolean }> {
  const powerhouseOrgId = await getPowerhouseOrgId();
  const auth = await requirePermission(ctx, "accessscope.manage", {
    organizationId: powerhouseOrgId,
  });

  const propertyId = input.scopeType === "PROPERTY" ? input.propertyId : null;
  const buildingId = input.scopeType === "BUILDING" ? input.buildingId : null;
  if (input.scopeType === "PROPERTY" && !propertyId) {
    throw new Error("PROPERTY-Scope braucht eine propertyId");
  }
  if (input.scopeType === "BUILDING" && !buildingId) {
    throw new Error("BUILDING-Scope braucht eine buildingId");
  }

  // Idempotent: identischer Grant wird wiederverwendet (partielle Unique-Indexe
  // der DB verhindern Duplikate ohnehin — wir vermeiden den Constraint-Fehler).
  const existing = await prisma.accessScope.findFirst({
    where: {
      organizationId: input.organizationId,
      scopeType: input.scopeType,
      propertyId: propertyId ?? undefined,
      buildingId: buildingId ?? undefined,
    },
  });
  if (existing) return { scope: existing, created: false };

  const scope = await prisma.$transaction(async (tx) => {
    const created = await tx.accessScope.create({
      data: {
        organizationId: input.organizationId,
        scopeType: input.scopeType,
        propertyId,
        buildingId,
        grantedById: auth.userId,
      },
    });
    await recordAudit(tx, {
      action: "accessscope.granted",
      subjectType: "AccessScope",
      subjectId: created.id,
      actorType: "USER",
      actorId: auth.userId,
      organizationId: input.organizationId,
      after: { scopeType: created.scopeType, propertyId: created.propertyId, buildingId: created.buildingId },
    });
    return created;
  });
  return { scope, created: true };
}

export async function revokeAccessScope(ctx: AuthContext | null, scopeId: string): Promise<void> {
  const powerhouseOrgId = await getPowerhouseOrgId();
  const auth = await requirePermission(ctx, "accessscope.manage", {
    organizationId: powerhouseOrgId,
  });
  const scope = await prisma.accessScope.findUniqueOrThrow({ where: { id: scopeId } });
  await prisma.$transaction(async (tx) => {
    await tx.accessScope.delete({ where: { id: scope.id } });
    await recordAudit(tx, {
      action: "accessscope.revoked",
      subjectType: "AccessScope",
      subjectId: scope.id,
      actorType: "USER",
      actorId: auth.userId,
      organizationId: scope.organizationId,
      before: { scopeType: scope.scopeType, propertyId: scope.propertyId, buildingId: scope.buildingId },
    });
  });
}
