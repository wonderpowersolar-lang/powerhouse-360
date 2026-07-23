"use client";

import Link from "next/link";

/**
 * Admin error boundary. A denied `requirePermission` throws AuthzError during
 * server render; Next.js surfaces it here as a 403-style "Kein Zugriff" view.
 * (redirect()/notFound() errors are re-thrown by Next automatically.)
 */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap">
      <h1>Kein Zugriff</h1>
      <p className="muted">
        Du hast keine Berechtigung für diese Ansicht. Falls das ein Fehler ist,
        wende dich an eine Administratorin oder einen Administrator.
      </p>
      <p style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <Link href="/admin/leads">Zu den Leads</Link>
        <button type="button" onClick={reset} className="linklike">
          Erneut versuchen
        </button>
      </p>
    </main>
  );
}
