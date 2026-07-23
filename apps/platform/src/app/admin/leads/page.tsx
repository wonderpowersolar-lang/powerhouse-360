import { headers } from "next/headers";
import { prisma } from "@ph360/database";
import { getAuthContext, requirePermission } from "@ph360/auth";
import { getPowerhouseOrgId } from "../../../lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function LeadsPage() {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "lead.read", { organizationId });

  const where = { organizationId };
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.lead.count({ where }),
  ]);

  return (
    <main className="wrap">
      <h1>Lead-Eingang</h1>
      <p className="muted">
        {total} {total === 1 ? "Lead" : "Leads"} gesamt · neueste 200 angezeigt
      </p>

      {leads.length === 0 ? (
        <div className="empty">
          Noch keine Leads. Sobald ein Funnel-Formular abgeschickt wird,
          erscheint es hier.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Eingang</th>
              <th>Typ</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Module</th>
              <th>Einheiten</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="muted">{fmt(lead.createdAt)}</td>
                <td>
                  {lead.leadType === "DEMO_REQUEST" ? "Demo" : "Projekt"}
                </td>
                <td>
                  {lead.firstName} {lead.lastName}
                  {lead.company ? (
                    <div className="muted">{lead.company}</div>
                  ) : null}
                </td>
                <td>
                  <a href={`mailto:${lead.email}`}>{lead.email}</a>
                  {lead.phone ? (
                    <div className="muted">{lead.phone}</div>
                  ) : null}
                </td>
                <td>
                  {lead.modules.length ? lead.modules.join(", ") : "—"}
                </td>
                <td>{lead.dwellingUnits ?? "—"}</td>
                <td>
                  <span className="badge">{lead.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
