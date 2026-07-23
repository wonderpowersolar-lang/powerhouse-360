import { headers } from "next/headers";
import { prisma } from "@ph360/database";
import { getAuthContext, requirePermission } from "@ph360/auth";
import { SYSTEM_ROLES } from "@ph360/permissions";
import { getPowerhouseOrgId } from "../../../lib/org";
import { inviteAction, changeRoleAction } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(d);
}

export default async function MembersPage() {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "member.read", { organizationId });

  const [members, invitations] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { organizationId },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="wrap">
      <h1>Mitglieder</h1>
      <p className="muted">
        {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"} ·{" "}
        {invitations.length} offene{" "}
        {invitations.length === 1 ? "Einladung" : "Einladungen"}
      </p>

      <form action={inviteAction} className="inline-form">
        <input type="email" name="email" placeholder="neue.person@firma.de" required autoComplete="off" />
        <select name="role" defaultValue="SALES" aria-label="Rolle">
          {SYSTEM_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button type="submit">Einladen</button>
      </form>

      <h2 className="section-title">Aktive Mitglieder</h2>
      {members.length === 0 ? (
        <div className="empty">Noch keine Mitglieder.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Status</th>
              <th>Seit</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.user.name}</td>
                <td>{m.user.email}</td>
                <td>
                  <form action={changeRoleAction} className="inline-form" style={{ margin: 0 }}>
                    <input type="hidden" name="membershipId" value={m.id} />
                    <select name="role" defaultValue={m.role} aria-label={`Rolle von ${m.user.email}`}>
                      {SYSTEM_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button type="submit">Speichern</button>
                  </form>
                </td>
                <td>
                  <span className="badge">{m.status}</span>
                </td>
                <td className="muted">{fmt(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="section-title">Offene Einladungen</h2>
      {invitations.length === 0 ? (
        <div className="empty">Keine offenen Einladungen.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Eingeladen</th>
              <th>Gültig bis</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.email}</td>
                <td>
                  <span className="badge">{inv.role}</span>
                </td>
                <td className="muted">{fmt(inv.createdAt)}</td>
                <td className="muted">{fmt(inv.expiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
