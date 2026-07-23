import { headers } from "next/headers";
import { prisma, type Prisma } from "@ph360/database";
import { getAuthContext, requirePermission } from "@ph360/auth";
import { getPowerhouseOrgId } from "../../../lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function parseDate(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function preview(value: Prisma.JsonValue | null): string {
  if (value == null) return "—";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s.length > 80 ? `${s.slice(0, 79)}…` : s;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "audit.read", { organizationId });

  const sp = await searchParams;
  const action = firstParam(sp.action);
  const subjectType = firstParam(sp.subjectType);
  const from = firstParam(sp.from);
  const to = firstParam(sp.to);

  // `<input type="date">` yields a day; align both bounds to the server-local day
  // frame so gte/lte and the local `fmt` rendering stay consistent (a non-UTC
  // server would otherwise drop boundary-day events, since new Date("YYYY-MM-DD")
  // parses as UTC midnight).
  const fromDate = parseDate(from);
  if (fromDate) fromDate.setHours(0, 0, 0, 0);
  const toDate = parseDate(to);
  if (toDate) toDate.setHours(23, 59, 59, 999);

  const where: Prisma.AuditEventWhereInput = {};
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (subjectType) where.subjectType = { contains: subjectType, mode: "insensitive" };
  if (fromDate || toDate) {
    where.createdAt = { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) };
  }

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE_SIZE }),
    prisma.auditEvent.count({ where }),
  ]);

  const capped = total > PAGE_SIZE;

  return (
    <main className="wrap">
      <h1>Audit-Log</h1>
      <p className="muted">
        {total} {total === 1 ? "Ereignis" : "Ereignisse"}
        {capped ? ` · neueste ${PAGE_SIZE} angezeigt` : ""}
      </p>

      <form method="get" className="inline-form">
        <input type="text" name="action" defaultValue={action} placeholder="Aktion (z. B. auth.login)" aria-label="Aktion" />
        <input type="text" name="subjectType" defaultValue={subjectType} placeholder="Objekttyp (z. B. User)" aria-label="Objekttyp" />
        <input type="date" name="from" defaultValue={from} aria-label="Von" />
        <input type="date" name="to" defaultValue={to} aria-label="Bis" />
        <button type="submit">Filtern</button>
        {action || subjectType || from || to ? (
          <a href="/admin/audit" className="linklike">Zurücksetzen</a>
        ) : null}
      </form>

      {events.length === 0 ? (
        <div className="empty">Keine Audit-Ereignisse für diese Filter.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Zeit</th>
              <th>Aktion</th>
              <th>Akteur</th>
              <th>Objekt</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="muted">{fmt(e.createdAt)}</td>
                <td>
                  <span className="badge">{e.action}</span>
                </td>
                <td>
                  {e.actorType}
                  {e.actorId ? <div className="muted">{e.actorId}</div> : null}
                </td>
                <td>
                  {e.subjectType}
                  <div className="muted">{e.subjectId}</div>
                </td>
                <td className="muted">{preview(e.after ?? e.before)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
