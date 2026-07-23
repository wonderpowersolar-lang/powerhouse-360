import { prisma } from "@ph360/database";
import { canAny } from "@ph360/permissions";
import type { AuthContext } from "@ph360/auth";

/**
 * Org-Sichtbarkeit der Objekt-Lesesicht. Routen-Deklaration: permission
 * `object.read`, Scope-Quelle = OrganizationMembership (ADR-004).
 * Rückgabe:
 * - `null`  → plattformweite Sicht: Membership mit object.read in einer
 *             POWERHOUSE-Org (Masterplan §4 Nr. 4 — Plattform-Mitarbeiter
 *             mandantenübergreifend per Systemrolle)
 * - `[]`    → keine Sicht (deny-by-default)
 * - `[ids]` → genau diese Mandanten
 */
export async function readablePropertyOrgIds(ctx: AuthContext): Promise<string[] | null> {
  const permitted = ctx.memberships
    .filter((m) => canAny([m.role], "object.read"))
    .map((m) => m.organizationId);
  if (permitted.length === 0) return [];
  const powerhouse = await prisma.organization.findFirst({
    where: { id: { in: permitted }, type: "POWERHOUSE" },
    select: { id: true },
  });
  return powerhouse ? null : permitted;
}

/** Vollständiger Lesebaum Property→Building(+Address,+Entrances)→Units. */
export async function getReadablePropertyTree(ctx: AuthContext) {
  const orgIds = await readablePropertyOrgIds(ctx);
  if (orgIds !== null && orgIds.length === 0) return [];
  return prisma.property.findMany({
    where: orgIds === null ? {} : { organizationId: { in: orgIds } },
    orderBy: { name: "asc" },
    include: {
      organization: { select: { name: true } },
      buildings: {
        orderBy: { name: "asc" },
        include: {
          address: true,
          entrances: true,
          units: { orderBy: { label: "asc" } },
        },
      },
    },
  });
}

export type PropertyTree = Awaited<ReturnType<typeof getReadablePropertyTree>>[number];
