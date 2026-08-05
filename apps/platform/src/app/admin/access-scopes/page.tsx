import { headers } from "next/headers";
import { prisma } from "@ph360/database";
import { getAuthContext, requirePermission } from "@ph360/auth";
import { getPowerhouseOrgId } from "../../../lib/org";
import { grantScopeAction, revokeScopeAction } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Zugriffe — Powerhouse 360" };

/**
 * AccessScope-Verwaltung (Basis, WP-1.3-Rest): explizite, auditierbare
 * Cross-Tenant-Zuweisungen (ADR-004 / Masterplan §4 Nr. 1) — z. B. HV auf
 * Objekte fremder Eigentümer-Mandanten. Nur `accessscope.manage`.
 */
export default async function AccessScopesPage() {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "accessscope.manage", { organizationId });

  const [scopes, orgs, properties, buildings] = await Promise.all([
    prisma.accessScope.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true } },
        property: { select: { name: true } },
        building: { select: { name: true, property: { select: { name: true } } } },
      },
    }),
    prisma.organization.findMany({
      where: { type: { not: "POWERHOUSE" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, organization: { select: { name: true } } },
    }),
    prisma.building.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, property: { select: { name: true } } },
    }),
  ]);

  return (
    <main className="wrap">
      <h1>Zugriffe (AccessScopes)</h1>
      <p className="muted">
        Explizite, auditierbare Teilbaum-Zugriffe fremder Organisationen
        (z. B. Hausverwaltung) auf Objekte — ADR-004. Jede Vergabe und jeder
        Entzug erscheint im Audit.
      </p>

      <section>
        <h2>Zugriff gewähren</h2>
        <form action={grantScopeAction} className="form-row">
          <label>
            Organisation
            <select name="organizationId" required defaultValue="">
              <option value="" disabled>
                — wählen —
              </option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            Typ
            <select name="scopeType" required defaultValue="PROPERTY">
              <option value="PROPERTY">Objekt (ganze Property)</option>
              <option value="BUILDING">Einzelnes Gebäude</option>
            </select>
          </label>
          <label>
            Property (bei Typ „Objekt")
            <select name="propertyId" defaultValue="">
              <option value="">—</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.organization.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gebäude (bei Typ „Gebäude")
            <select name="buildingId" defaultValue="">
              <option value="">—</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.property.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Gewähren</button>
        </form>
      </section>

      <section>
        <h2>Bestehende Zugriffe</h2>
        {scopes.length === 0 ? (
          <div className="empty">Keine Cross-Tenant-Zugriffe vergeben.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Typ</th>
                <th>Ziel</th>
                <th>Seit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scopes.map((s) => (
                <tr key={s.id}>
                  <td>{s.organization.name}</td>
                  <td>
                    <span className="badge">{s.scopeType}</span>
                  </td>
                  <td>
                    {s.scopeType === "PROPERTY"
                      ? (s.property?.name ?? "—")
                      : s.building
                        ? `${s.building.name} · ${s.building.property.name}`
                        : "—"}
                  </td>
                  <td className="muted">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(s.createdAt)}
                  </td>
                  <td>
                    <form action={revokeScopeAction}>
                      <input type="hidden" name="scopeId" value={s.id} />
                      <button type="submit">Entziehen</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
