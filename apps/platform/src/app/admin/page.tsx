import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@ph360/database";
import { getAuthContext } from "@ph360/auth";
import { canAny } from "@ph360/permissions";
import { getPowerhouseOrgId } from "../../lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard — Powerhouse 360" };

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Admin-Dashboard: Überblick über den kritischen Pfad (Lead → Kunde →
 * Objekt → Betrieb). Kacheln erscheinen nur, wenn die Rolle die jeweilige
 * Leseberechtigung hat — deny-by-default wie überall (F-20).
 */
export default async function AdminDashboard() {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  const roles = (ctx?.memberships ?? [])
    .filter((m) => m.organizationId === organizationId)
    .map((m) => m.role);

  const may = {
    leads: canAny(roles, "lead.read"),
    customers: canAny(roles, "customer.read"),
    objects: canAny(roles, "object.read"),
    members: canAny(roles, "member.read"),
    audit: canAny(roles, "audit.read"),
  };

  const [leadsTotal, leadsNew, leadsConverted, customers, properties, units, members, events] =
    await Promise.all([
      may.leads ? prisma.lead.count({ where: { organizationId } }) : null,
      may.leads
        ? prisma.lead.count({ where: { organizationId, status: "NEW" } })
        : null,
      may.leads
        ? prisma.lead.count({ where: { organizationId, status: "CONVERTED" } })
        : null,
      may.customers ? prisma.customer.count({ where: { organizationId } }) : null,
      may.objects ? prisma.property.count() : null,
      may.objects ? prisma.unit.count() : null,
      may.members
        ? prisma.organizationMembership.count({ where: { organizationId } })
        : null,
      may.audit
        ? prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 8 })
        : null,
    ]);

  const conversion =
    leadsTotal && leadsConverted !== null && leadsTotal > 0
      ? leadsConverted / leadsTotal
      : null;

  return (
    <main className="wrap">
      <h1>Dashboard</h1>
      <p className="muted">
        Der kritische Pfad auf einen Blick: Lead → Kunde → Objekt → Betrieb.
      </p>

      <div className="kpi-grid">
        {may.leads && (
          <Link href="/admin/leads" className="kpi" style={{ textDecoration: "none" }}>
            <span className="label">
              <span className={`dot${leadsNew ? " info" : ""}`} aria-hidden />
              Leads offen
            </span>
            <p className="value">{leadsNew}</p>
            <p className="sub">{leadsTotal} gesamt</p>
          </Link>
        )}
        {may.leads && (
          <div className="kpi">
            <span className="label">
              <span className="dot" aria-hidden />
              Konvertiert
            </span>
            <p className="value">{leadsConverted}</p>
            {conversion !== null && (
              <>
                <p className="sub">{Math.round(conversion * 100)} % der Leads</p>
                <div className="bar" aria-hidden>
                  <span style={{ width: `${Math.round(conversion * 100)}%` }} />
                </div>
              </>
            )}
          </div>
        )}
        {may.customers && (
          <Link href="/admin/customers" className="kpi" style={{ textDecoration: "none" }}>
            <span className="label">
              <span className="dot" aria-hidden />
              Kunden
            </span>
            <p className="value">{customers}</p>
            <p className="sub">aus qualifizierten Leads</p>
          </Link>
        )}
        {may.objects && (
          <Link href="/admin/objects" className="kpi" style={{ textDecoration: "none" }}>
            <span className="label">
              <span className="dot" aria-hidden />
              Objekte
            </span>
            <p className="value">{properties}</p>
            <p className="sub">{units} Einheiten</p>
          </Link>
        )}
        {may.members && (
          <Link href="/admin/members" className="kpi" style={{ textDecoration: "none" }}>
            <span className="label">
              <span className="dot" aria-hidden />
              Mitglieder
            </span>
            <p className="value">{members}</p>
            <p className="sub">Powerhouse-Organisation</p>
          </Link>
        )}
      </div>

      <div className="dash-cols">
        {may.audit && events && (
          <section className="panel">
            <h2>Letzte Ereignisse</h2>
            {events.length === 0 ? (
              <p className="muted">Noch keine Audit-Ereignisse.</p>
            ) : (
              <table>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {fmt(e.createdAt)}
                      </td>
                      <td>
                        <span className="badge">{e.action}</span>
                      </td>
                      <td className="muted">
                        {e.subjectType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
        <section className="panel">
          <h2>Schnellzugriff</h2>
          <div className="quicklinks">
            {may.leads && <Link href="/admin/leads">Lead-Eingang öffnen</Link>}
            {may.members && <Link href="/admin/members">Mitglied einladen</Link>}
            {may.audit && <Link href="/admin/audit">Audit-Log filtern</Link>}
            {may.objects && <Link href="/admin/objects">Objektbaum ansehen</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
