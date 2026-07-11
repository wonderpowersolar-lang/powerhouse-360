# ADR-001 — Monorepo-Umbau und App-Schnitt (3 Apps statt 7)

Status: vorgeschlagen (2026-07-11) · Entscheider: Leon Liedtke · Kontext: Phase 0

## Kontext
Der Masterprompt (§7) schlägt `/apps` mit admin, customer-portal, installer-pwa, resident-portal, platform, api, workers, hub-management vor — erlaubt aber ausdrücklich Anpassung an den Bestand. Ist-Zustand: eine produktive Next.js-Marketing-Site, Kleinst-Team, eine VPS.

## Entscheidung
pnpm-Workspaces + Turborepo-Monorepo mit **drei Apps**:
1. `apps/website` — bestehende Marketing-Site (unverändert verschoben)
2. `apps/platform` — EINE Next.js-App für Admin/CRM, Kundenportal, Bewohnerportal, Monteur-PWA (Route-Groups `(admin)`, `(portal)`, `(resident)`, `(installer)`) inkl. `/api/v1` und Webhooks
3. `apps/worker` — Job-Runner (Outbox-Dispatcher, Syncs, Reminders, PDF-Generierung)

Fachlogik lebt in `packages/domain` (Bounded Contexts), nicht in den Apps.

## Begründung
- Sieben Apps bedeuten sieben Deployments, sieben Auth-Konfigurationen und Grenzziehungs-Overhead ohne Nutzen bei dieser Teamgröße.
- Gemeinsame Session/Cookies, gemeinsames UI-Paket, ein Deployment — Portale unterscheiden sich durch Rollen/Scopes (serverseitig erzwungen), nicht durch Infrastruktur.
- Die Bounded-Context-Trennung passiert auf Package-Ebene (eslint-boundaries) — das ist die Grenze, die späteres Herauslösen ermöglicht, nicht der App-Ordner.

## Split-Kriterien (wann wir doch trennen)
- Installer-PWA: wenn Offline-Bundle/Service-Worker-Anforderungen die Haupt-App belasten → eigene App.
- API/Ingest: wenn Hub-Telemetrie-Last das Portal-Deployment beeinträchtigt → `apps/ingest`.
- Resident-Portal: bei White-Labeling je Kunde.

## Konsequenzen
+ Minimaler Betriebsaufwand, schnelle Entwicklung, eine Codebasis für alle Oberflächen.
− Route-Group-Disziplin nötig; Bundle-Splitting beachten. Risiko akzeptiert, Split-Kriterien definiert.
