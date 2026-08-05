import { headers } from "next/headers";
import { prisma } from "@ph360/database";
import { getAuthContext, requirePermission } from "@ph360/auth";
import { canAny } from "@ph360/permissions";
import { getPowerhouseOrgId } from "../../../lib/org";
import { qualifyLeadAction } from "./actions";

const CUSTOMER_ORG_OPTIONS = [
  ["PROPERTY_MANAGER", "Hausverwaltung"],
  ["WEG", "WEG"],
  ["OWNER", "Eigentümer"],
  ["ASSET_HOLDER", "Bestandshalter"],
  ["COOPERATIVE", "Genossenschaft"],
  ["OTHER", "Sonstige"],
] as const;

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
  const mayQualify = ctx!.memberships.some(
    (m) => m.organizationId === organizationId && canAny([m.role], "lead.qualify"),
  );

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
              <th>Aktion</th>
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
                <td>
                  {lead.status === "CONVERTED" ? (
                    <a href="/admin/customers">→ Kunde</a>
                  ) : mayQualify ? (
                    <details>
                      <summary>Qualifizieren</summary>
                      {/* F-03: Lead → Kunde/Objekt ohne Doppelerfassung — Kontaktdaten wandern automatisch mit. */}
                      <form action={qualifyLeadAction} className="form-row">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <label>
                          Organisationstyp
                          <select name="organizationType" required defaultValue="WEG">
                            {CUSTOMER_ORG_OPTIONS.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Organisation
                          <input
                            name="organizationName"
                            required
                            defaultValue={lead.company ?? ""}
                            placeholder="z. B. WEG Christinenstraße 36"
                          />
                        </label>
                        <label>
                          Objekt (optional)
                          <input name="propertyName" placeholder="Objektname" />
                        </label>
                        <button type="submit">Übernehmen</button>
                      </form>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
