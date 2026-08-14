import { headers } from "next/headers";
import { getAuthContext, requirePermission } from "@ph360/auth";
import { getPowerhouseOrgId } from "../../../lib/org";
import { listCustomers } from "../../../lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Kunden — Powerhouse 360" };

const ORG_TYPE_LABEL: Record<string, string> = {
  PROPERTY_MANAGER: "Hausverwaltung",
  WEG: "WEG",
  OWNER: "Eigentümer",
  ASSET_HOLDER: "Bestandshalter",
  COOPERATIVE: "Genossenschaft",
  OTHER: "Sonstige",
};

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(d);
}

export default async function CustomersPage() {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "customer.read", { organizationId });

  const customers = await listCustomers(organizationId);

  return (
    <main className="wrap">
      <h1>Kunden</h1>
      <p className="muted">
        {customers.length} {customers.length === 1 ? "Kunde" : "Kunden"} · aus
        qualifizierten Leads (F-03) — Objekte gehören der jeweiligen Kunden-Organisation
      </p>

      {customers.length === 0 ? (
        <div className="empty">
          Noch keine Kunden. Qualifiziere einen Lead unter „Leads“, um den
          ersten Kunden samt Organisation und Objekt anzulegen.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Typ</th>
              <th>Ansprechpartner</th>
              <th>Leads</th>
              <th>Opportunities</th>
              <th>Seit</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const contact = customer.contacts[0];
              return (
                <tr key={customer.id}>
                  <td>{customer.customerOrganization.name}</td>
                  <td>
                    <span className="badge">
                      {ORG_TYPE_LABEL[customer.customerOrganization.type] ??
                        customer.customerOrganization.type}
                    </span>
                  </td>
                  <td>
                    {contact ? (
                      <>
                        {contact.firstName} {contact.lastName}
                        <div className="muted">
                          <a href={`mailto:${contact.email}`}>{contact.email}</a>
                          {contact.phone ? ` · ${contact.phone}` : null}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{customer._count.convertedLeads}</td>
                  <td>{customer._count.opportunities}</td>
                  <td className="muted">{fmt(customer.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
