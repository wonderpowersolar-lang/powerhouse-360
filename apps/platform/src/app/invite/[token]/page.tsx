import Link from "next/link";
import { prisma } from "@ph360/database";
import { AcceptForm } from "./accept-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Einladung annehmen — Powerhouse 360" };

function InviteMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="wrap">
      <h1>{title}</h1>
      <p className="muted">{children}</p>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/login">Zur Anmeldung</Link>
      </p>
    </main>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return (
      <InviteMessage title="Einladung ungültig">
        Diese Einladung existiert nicht oder wurde bereits verwendet. Bitte fordere
        eine neue Einladung an.
      </InviteMessage>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <InviteMessage title="Einladung abgelaufen">
        Diese Einladung ist abgelaufen. Bitte fordere eine neue Einladung an.
      </InviteMessage>
    );
  }

  return (
    <main className="wrap">
      <h1>Zugang einrichten</h1>
      <p className="muted">
        Du wurdest zu <strong>{invitation.organization.name}</strong> eingeladen.
        Lege ein Passwort fest, um deinen Zugang zu aktivieren.
      </p>
      <AcceptForm token={token} email={invitation.email} />
    </main>
  );
}
