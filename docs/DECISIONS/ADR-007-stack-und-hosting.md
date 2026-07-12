# ADR-007 — Stack & Hosting-Topologie

Status: **ENTWURF — zur Freigabe durch den Product Owner** (2026-07-12) · absorbiert alt-ADR-001/002/005 (2026-07-11)

> V2-Vorgabe: Stack-Entscheidung als ADR-Entwurf vorlegen; keine Stack-Wechsel ohne Freigabe. Der hier beschriebene Stack ist bereits teilweise implementiert und verifiziert (WP-1.0/1.1) — die Freigabe bestätigt ihn bzw. löst eine dokumentierte Korrektur aus.

## Vorschlag (Ist-basiert)

| Ebene | Festlegung | Stand |
|---|---|---|
| Monorepo | pnpm-Workspaces + Turborepo; **3 Apps**: `apps/website` (Marketing), `apps/platform` (Admin/CRM + Portale + Monteur-PWA als Route-Groups + `/api/v1` + Webhooks), `apps/worker` (Outbox/Jobs). Split-Kriterien dokumentiert (PWA/Ingest/White-Label) | implementiert, verifiziert |
| Frontend/Backend | Next.js 16 (App Router) + React 19, TypeScript strict | implementiert |
| ORM/Migrationen | Prisma (`prisma migrate`), Multi-File-Schema je Domäne (ab WP-1.3), generierter Client als Workspace-Package | implementiert (Migration `init`) |
| AuthN | better-auth (nur Authentifizierung: E-Mail+Passwort, DB-Sessions in Postgres, Magic-Link später; **kein** Organization-Plugin) | geplant (WP-1.2-Plan liegt vor) |
| AuthZ/Tenancy | eigene Modelle (`OrganizationMembership`, `Invitation`, `AccessScope`) + `packages/permissions` (Code-Katalog) + Guards (ADR-004) | Katalog implementiert |
| Events/Jobs | Outbox + pg-boss (ADR-001) | Outbox implementiert |
| Grenzen | Bounded Contexts als Packages (`packages/domain/<context>`), erzwungen per eslint-boundaries; Fachmodule importieren nie einander; Adapter kapseln Fremdsysteme | Regel-Setup offen (WP-1.4/1.5) |
| Objektspeicher | MinIO (S3-kompatibel) auf VPS | compose vorhanden |
| Deployment | Docker-Images je App (verifiziert), Coolify auf Hostinger-VPS (`powerhouse.dvnii.de`), Runbook `docs/DEPLOYMENT.md` | Images verifiziert; Rollout beim PO |

## Hosting-Bewertung Datenbank (V2-NFR-Pflicht: Hostinger hat kein Managed Postgres)

**Option A — Postgres auf Hostinger-VPS (Vorschlag für Pilot-Phase):** volle Datenhoheit (DE, DSGVO ohne weitere AVV), keine Zusatzkosten; **Pflichtauflagen:** tägliche Off-Site-Backups (Objektspeicher außerhalb der VPS), **getesteter** Restore (ungetestet = nicht vorhanden), Monitoring, dokumentiertes RTO/RPO (Vorschlag: RPO ≤ 24 h, RTO ≤ 4 h für Pilot; Verschärfung vor Skalierung).
**Option B — Managed-EU-Postgres** (z. B. deutscher/EU-Anbieter mit AVV): geringere Betriebslast, PITR, Failover; Zusatzkosten + AVV nötig.
**Empfehlung:** A für Phase 1–6 (Pilot, 21 Messstellen — Last trivial), Wechselprüfung zu B vor Breitenrollout bzw. wenn Smokemieter-NFR (Alarmkette) es erfordert. Entscheidung wird hier per Freigabe fixiert.

## Konsequenzen
+ Ein bereits verifizierter, schlanker Stack; keine Umbaukosten.
− VPS-Single-Point (R-14) bis Backup-/Restore-Nachweis erbracht ist; eslint-boundaries noch nicht aktiv (Grenzen bisher Konvention).
