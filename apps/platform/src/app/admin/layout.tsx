import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthContext } from "@ph360/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext(await headers());
  if (!ctx) redirect("/login");
  if (ctx.memberships.length === 0) {
    return (
      <main className="wrap">
        <h1>Kein Zugriff</h1>
        <p className="muted">Dein Konto ist noch keiner Organisation zugeordnet.</p>
      </main>
    );
  }
  return (
    <div className="admin">
      <nav className="admin-nav">
        <strong>Powerhouse 360</strong>
        <Link href="/admin/leads">Leads</Link>
        <Link href="/admin/objects">Objekte</Link>
        <Link href="/admin/members">Mitglieder</Link>
        <Link href="/admin/audit">Audit</Link>
        <span className="spacer" />
        <span className="muted">{ctx.email}</span>
      </nav>
      {children}
    </div>
  );
}
