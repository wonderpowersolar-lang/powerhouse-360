import { prisma } from "@ph360/database";
import { canAny } from "@ph360/permissions";
import type { AuthContext } from "@ph360/auth";

/**
 * Sichtbarkeit der Objekt-Lesesicht (WP-1.3-Rest: inkl. AccessScope-Auflösung,
 * ADR-004 / Masterplan §4 Nr. 1). Routen-Deklaration: permission `object.read`,
 * Scope-Quellen = OrganizationMembership + AccessScope.
 * - `platform: true` → plattformweite Sicht (Membership mit object.read in
 *   einer POWERHOUSE-Org, Masterplan §4 Nr. 4)
 * - sonst: eigene Mandanten (`orgIds`) + explizit gewährte Teilbäume
 *   (`propertyIds`/`buildingIds` aus AccessScope — z. B. HV auf fremde
 *   Eigentümer-Objekte). Alles leer → keine Sicht (deny-by-default).
 */
export type PropertyVisibility =
  | { platform: true }
  | { platform: false; orgIds: string[]; propertyIds: string[]; buildingIds: string[] };

export async function resolvePropertyVisibility(ctx: AuthContext): Promise<PropertyVisibility> {
  const permitted = ctx.memberships
    .filter((m) => canAny([m.role], "object.read"))
    .map((m) => m.organizationId);
  if (permitted.length === 0) {
    return { platform: false, orgIds: [], propertyIds: [], buildingIds: [] };
  }
  const powerhouse = await prisma.organization.findFirst({
    where: { id: { in: permitted }, type: "POWERHOUSE" },
    select: { id: true },
  });
  if (powerhouse) return { platform: true };

  const scopes = await prisma.accessScope.findMany({
    where: { organizationId: { in: permitted } },
    select: { scopeType: true, propertyId: true, buildingId: true },
  });
  return {
    platform: false,
    orgIds: permitted,
    propertyIds: scopes
      .filter((s) => s.scopeType === "PROPERTY" && s.propertyId)
      .map((s) => s.propertyId as string),
    buildingIds: scopes
      .filter((s) => s.scopeType === "BUILDING" && s.buildingId)
      .map((s) => s.buildingId as string),
  };
}

/**
 * Kompatibilitäts-Sicht auf Org-Ebene (WP-1.3-Kern-Vertrag):
 * `null` = plattformweite Sicht · `[]` = keine · `[ids]` = genau diese
 * Mandanten. AccessScope-Teilbäume tauchen hier bewusst NICHT auf — wer
 * Property-genaue Sichtbarkeit braucht, nutzt `resolvePropertyVisibility`.
 */
export async function readablePropertyOrgIds(ctx: AuthContext): Promise<string[] | null> {
  const vis = await resolvePropertyVisibility(ctx);
  return vis.platform ? null : vis.orgIds;
}

/**
 * Lesebaum Property→Building(+Address,+Entrances)→Units für eine aufgelöste
 * Sichtbarkeit. Properties, die ausschließlich über einen BUILDING-Scope
 * sichtbar sind, enthalten nur die gewährten Gebäude (Teilbaum-Zugriff).
 */
export async function getPropertyTreeForVisibility(vis: PropertyVisibility) {
  if (
    !vis.platform &&
    vis.orgIds.length === 0 &&
    vis.propertyIds.length === 0 &&
    vis.buildingIds.length === 0
  ) {
    return [];
  }
  const properties = await prisma.property.findMany({
    where: vis.platform
      ? {}
      : {
          OR: [
            { organizationId: { in: vis.orgIds } },
            { id: { in: vis.propertyIds } },
            { buildings: { some: { id: { in: vis.buildingIds } } } },
          ],
        },
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
  if (vis.platform) return properties;

  const ownOrgs = new Set(vis.orgIds);
  const fullProperties = new Set(vis.propertyIds);
  const grantedBuildings = new Set(vis.buildingIds);
  return properties.map((p) =>
    ownOrgs.has(p.organizationId) || fullProperties.has(p.id)
      ? p
      : { ...p, buildings: p.buildings.filter((b) => grantedBuildings.has(b.id)) },
  );
}

/** Kompatibilität (WP-1.3-Kern): Baum für eine Org-Sichtbarkeit ohne Scopes. */
export async function getPropertyTreeForOrgIds(orgIds: string[] | null) {
  return getPropertyTreeForVisibility(
    orgIds === null
      ? { platform: true }
      : { platform: false, orgIds, propertyIds: [], buildingIds: [] },
  );
}

/** Vollständiger Lesebaum inkl. AccessScope-Teilbäumen. */
export async function getReadablePropertyTree(ctx: AuthContext) {
  return getPropertyTreeForVisibility(await resolvePropertyVisibility(ctx));
}

export type PropertyTree = Awaited<ReturnType<typeof getPropertyTreeForVisibility>>[number];
