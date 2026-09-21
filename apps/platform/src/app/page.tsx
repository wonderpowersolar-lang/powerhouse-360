import Link from "next/link";

export default function Home() {
  return (
    <main className="wrap">
      <h1>
        POWERHOUSE <span className="brand-gradient-text">360</span> — Plattform
      </h1>
      <p className="muted">
        Interne Plattform (Phase 1). CRM, Onboarding, Geräte, Abrechnung folgen
        gemäß Masterplan.
      </p>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/admin">→ Zum Dashboard</Link>
      </p>
    </main>
  );
}
