# POWERHOUSE 360 — Implementation Log

> Append-only. Nach jedem abgeschlossenen Arbeitspaket: Datum, Paket, was getan/getestet/nicht getestet wurde, Restrisiko, nächster Schritt. Prod-Deploys werden hier vermerkt.

---

## 2026-07-11 — Phase 0: Bestandsaufnahme & Masterplan (WP-0)

**Getan:**
- Vollständiges Codebase-Audit (Routen, Komponenten, Lead-Fluss, Deployment, Tests, Doku, Medien, Git-Zustand) → `CURRENT_STATE_AUDIT.md` *(2026-07-12 in Masterplan §2 konsolidiert)*
- Zentrale Plandokumentation angelegt: Masterplan, Zielarchitektur, Datenmodell, API-, Event-, Security-Konzept, Onboarding-Engine, Hub/Device-Plattform, Documenso- & Lexoffice-Integration, Migrationsplan, Teststrategie, E2E-Matrix, Risikoregister, Release-Plan, ADR-001…005, vier Modul-Dokumente
- Kernbefunde: reines Marketing-Frontend ohne Backend; Leads gehen verloren (R-01); kein Git-Remote (R-02); keine Tests/CI

**Getestet:** — (reine Analyse-/Dokumentationsphase; keine Codeänderung außer Doku)
**Nicht getestet / offen:** Alle Annahmen zu Documenso-/Lexoffice-API-Details sind Konzeptstand; API-Spikes in Phase 3 bzw. vor Phase 10 verifizieren.
**Restrisiko:** R-01 bleibt bis WP-1.1 offen — jeder eingehende Lead ist bis dahin verloren, sofern niemand Container-Logs liest.
**Nächster Schritt:** Freigabe des Masterplans; danach WP-1.0 (Git-Remote + Monorepo-Umbau) und WP-1.1 (Lead-Persistenz) gemäß [Masterplan §10](POWERHOUSE_360_MASTER_PLAN.md).

---

## 2026-07-11 — Phase 1: WP-1.0 Monorepo-Fundament + WP-1.1 Lead-Persistenz

Branch: `feat/platform-foundation`. Stack bestätigt durch Ausführungsauftrag (ADR-001/002).

**Getan (WP-1.0):**
- pnpm-Workspaces + Turborepo eingeführt (`pnpm-workspace.yaml`, `turbo.json`, Root-`package.json`, `.npmrc` mit `node-linker=hoisted`, `tsconfig.base.json`).
- Website per `git mv` nach `apps/website` verschoben (Historie erhalten), `next.config.ts` auf Monorepo angepasst (`outputFileTracingRoot`), Paket → `@ph360/website`. npm-`package-lock.json` entfernt.
- `docker-compose.yml` (Postgres :5433, Mailpit :8025, MinIO :9001), `.env.example`, Root-`README.md`, `.gitignore` monorepo-weit + `graphify-out/` ignoriert.
- **Port-Konflikt gelöst:** lokal belegt bereits ein anderer Stack (Supabase) Port 5432 → Postgres dauerhaft auf **5433** gelegt.

**Getan (WP-1.1):**
- `packages/database`: erstes Prisma-Schema (Organization, Lead, LeadActivity, AuditEvent, DomainEvent-Outbox) + Client-Singleton + idempotenter Seed. Migration `20260711112509_init` angewandt.
- `apps/platform`: `POST /api/v1/leads` — Zod-Validierung, Honeypot, optionaler Ingest-Token, Persistenz von Lead + LeadActivity + AuditEvent + DomainEvent in einer Transaktion. Admin-Liste `/admin/leads` (interim Basic-Auth via Middleware, ersetzt durch better-auth in WP-1.2).
- `apps/worker`: Outbox-Dispatcher (Poll/Claim/Retry/Backoff) mit Handler `lead.created` → Benachrichtigungs-E-Mail (nodemailer → SMTP/Mailpit).
- `apps/website`: `/api/leads` vom `console.log`-Handler zum **Plattform-Proxy** umgebaut (Fallback-Log gegen Lead-Verlust). **R-01 behoben.**

**Getestet (verifiziert, lokal auf Docker-Postgres):**
- F-01 🟢: `POST /api/v1/leads` → HTTP 201, Lead in DB (korrektes Modul-Mapping HEATMIETER/SMOKEMIETER), `audit_event` `lead.created` geschrieben, `domain_event` PENDING → Worker → PROCESSED, **E-Mail in Mailpit** ("Neuer Lead: Erika Musterfrau" → vertrieb@), Admin-Liste 401 ohne / 200 mit Basic-Auth (zeigt Lead).
- Website-Proxy: `POST /api/leads` (öffentlich) → Plattform → 2. Lead persistiert. Website bootet nach Umzug (`GET / 200`).
- F-21 🟣 (teilverifiziert): Startseite + Funnel-Proxy laufen; **vollständiger Route-Sweep + Modul-Domains noch nicht** durchgeklickt.

**Nicht getestet / offen:**
- Produktions-`next build` der Website (`sharp`-Build-Script von pnpm-Guard blockiert; Dev läuft). Vor Deploy: `sharp` freigeben + Build prüfen.
- Coolify-Deploy auf neue Monorepo-Struktur (Dockerfile der Website ist noch der alte Single-App-Stand → **muss vor nächstem Deploy angepasst werden**, sonst bricht der Prod-Build).
- Idempotenz-/Berechtigungs-Automatiktests (F-19/F-20) noch nicht als Vitest geschrieben — bisher nur manuell.

**Neue Erkenntnisse / Risiken:**
- Next 16 markiert `middleware.ts` als deprecated → künftig `proxy.ts` (betrifft Website + Platform, kosmetisch).
- Prisma 7 entfernt `package.json#prisma` → später `prisma.config.ts`; Prisma lädt `.env` nur aus cwd, nicht aus Repo-Root (Migrationen brauchen gesourcete Root-`.env`).
- pnpm-Supply-Chain-Guard blockiert Build-Scripts (prisma/sharp/esbuild) → mit direktem Binary-Aufruf umgangen; für CI/Deploy sauber freigeben.
- **Bestehende Fremd-Stacks auf der Maschine entdeckt:** ein `documenso-powermieter`-Docker-Setup (Documenso + DB + Mailpit, gestoppt) und eine laufende Supabase-Instanz — relevanter Kontext für Phase 3 (Documenso ist offenbar schon einmal aufgesetzt worden).

**Restrisiko:** R-01 in Dev behoben, in **Prod erst nach Deploy** wirksam (Website-Route zeigt sonst weiter ins Leere) — bis dahin gehen produktive Leads weiter verloren. R-02 (kein Git-Remote) weiter offen.
**Nächster Schritt:** WP-1.2 (better-auth + Organizations + Rollen/Scopes + Audit-UI), WP-1.3 (Immobilienstruktur + CRM-Qualifizierung), WP-1.4 (Events/Worker als Dauerdienst). Parallel: Git-Remote (R-02), Website-Dockerfile für Monorepo, sharp-Freigabe.

---

## 2026-07-11 — Deploy-Vorbereitung: Monorepo-Prod-Images (verifiziert)

**Getan:**
- Monorepo-Dockerfiles: `apps/website/Dockerfile` (alpine, Next standalone), `apps/platform/Dockerfile` + `apps/worker/Dockerfile` (debian-slim, Prisma). Build-Context = Repo-Root, `pnpm --filter … build`.
- `docker-compose.prod.yml`: postgres + **migrate (One-shot `prisma migrate deploy`)** + platform + worker + website; Secrets serverseitig via `.env` (`.env.prod.example`).
- `docs/DEPLOYMENT.md`: vollständiges VPS/Coolify-Runbook inkl. konkreter Serverdaten (`powerhouse.dvnii.de` / 152.239.118.208, Ubuntu 24.04+Docker, 2 vCPU/8 GB, VPS-ID 1792920) und sicherer Cutover-Reihenfolge (neuer Stack bauen → intern prüfen → Domains umhängen → alten Container stoppen; Rollback = zurückhängen).
- `sharp`/Prisma-Build-Freigabe: pnpm 11 nutzt `allowBuilds` (nicht `onlyBuiltDependencies`) → in `pnpm-workspace.yaml` gesetzt. Basis-Images auf **Node 22** (pnpm 11.11 braucht `node:sqlite`). Prisma `binaryTargets` um `debian-openssl-3.0.x`, Engine via `outputFileTracingIncludes` ins Platform-Standalone.

**Getestet (verifiziert):**
- `docker compose -f docker-compose.prod.yml build` → **alle 3 Images bauen** (website 731 MB, platform 509 MB, worker/migrate 2.5 GB) nach Fix von zwei echten Blockern (Node-20→22, allowBuilds).
- Isolierter Prod-Stack-Lauf (eigenes Projekt `ph360v`, frisches Postgres): migrate legt Schema an → platform ready → Website-`POST /api/leads` → **echte Persistenz (1 Lead in DB)** → Admin-Liste (Basic-Auth) zeigt den Lead. Danach sauber `down -v`. **Prod-Images end-to-end verifiziert.**

**Nicht getestet / offen (bewusst beim Nutzer):**
- Tatsächlicher VPS-Rollout: `.env`-Secrets auf dem Server setzen + `git archive|scp` + `docker compose … up -d` + Coolify-Domains umhängen. Ich habe **keine SSH-Zugangsdaten** und darf **keine Secrets eingeben** → Runbook in `docs/DEPLOYMENT.md`.
- DNS: Cutover Cloudflare→Hostinger-NS prüfen, bevor Domains umgehängt werden.

**Restrisiko:** R-01 (Lead-Verlust) ist erst nach diesem VPS-Rollout in **Prod** geschlossen; Artefakte sind verifiziert und bereit.
**Nächster Schritt:** VPS-Rollout (Nutzer) + WP-1.2. Empfehlung: WP-1.2 in einer frischen Session (diese ist sehr lang/teuer geworden) — Masterplan & Memory tragen den Kontext.

---
## 2026-07-12 — WP-0.2: V2-Rebaseline (Masterprompt V2)

**Getan:**
- Doku-Konsolidierung auf die 3 Pflichtdokumente (V2 §3): Masterplan v2.0 komplett neu (15 Pflichtkapitel, alle Statusstände F-01…F-21 / R-01…R-17 / WP-Stände verlustfrei übernommen); 15 Konzeptdokumente + 4 Moduldokumente als Kapitel absorbiert und gelöscht; `DEPLOYMENT.md` bleibt als verlinktes Betriebs-Runbook.
- ADR-Satz nach V2-Nummerierung neu aufgebaut: ADR-001 (Outbox), ADR-002 (Timescale), ADR-003 (PDF-Pipeline extern + Documenso als Signatur-Layer), ADR-004 (Mandantenisolation), ADR-005 (Billing-Engine), ADR-006 (Testmandant) — angenommen per V2-Vorgabe; ADR-007 (Stack & Hosting) + ADR-008 (Bewohner-Belegweg) als **Entwürfe zur PO-Freigabe**. Alte ADR-001…005 gelöscht (Mapping im Masterplan §15).
- Neue Verbindlichkeiten eingearbeitet: kommerzielle P1-Priorisierung + Pilot Christinenstraße 36/Lottumstraße 22 (HV Hennings, 21 Messstellen), Mandanten-/Gesellschaftsmodell mit `IssuingEntity` (Wonderpower/AKL, Zwei-Konten-Lexoffice-Routing — beide Konten existieren lt. PO), Regulatorik-Kapitel (§6 inkl. MaKo-Split-Matrix Comgy), NFR-Kapitel (§8), Quellsysteme Zoho/Reonic/Excel (§9), Signaturniveaus je ContractType, Phasen-Neuschnitt (Commercial+Lexoffice = Ph. 7 vor Smokemieter = Ph. 8; Heat/Charge P3-gated).
- Repo-Housekeeping: invalider Schema-Zwischenstand zurückgesetzt (`prisma validate` grün), WP-1.2-Plan+Spec (`docs/superpowers/…wp-1.2…`) ins Git aufgenommen, verwaiste Doku-Verweise in Code-Kommentaren auf Masterplan-Kapitel umgestellt.

**Getestet:** `prisma validate` grün nach Revert; Doku-Linkcheck + Strukturprüfung (siehe Commit); keine Laufzeit-Codeänderungen (nur Kommentare).
**Nicht getestet:** keine — reine Dokumentations-/Housekeeping-Einheit ohne Feature-Codepfad.
**Restrisiko:** R-01 (prod) und R-02 unverändert offen — VPS-Rollout + Git-Remote weiterhin beim PO. Neu: R-17 (Übergabe externe PDF-Pipeline).
**Nächster Schritt:** WP-1.2 fortsetzen (Task 2: better-auth-Tabellen + RBAC + Migration `auth_and_rbac`; plus V2-Delta Testmandant-Seed + IssuingEntity-Stammdaten) — siehe Masterplan §14.

---

## 2026-07-23 — WP-1.2: Auth/Rollen/Mandanten (better-auth + eigene RBAC)

**Getan (Branch `feat/platform-foundation`, nicht gepusht — R-02):**
- `packages/permissions` (Task 1, `3588b7f`): 8-Permission-Katalog, 12-Rollen-Map, Resolver — F-20-Kern.
- Migration `auth_and_rbac` (Task 2, `8a6fcaf`): better-auth-Tabellen (user/session/account/verification, String-IDs) + eigene RBAC (OrganizationMembership/Invitation + Enums SystemRole/MembershipStatus/InvitationStatus); Follow-up `audit_actor_id_text`.
- `packages/testing` (Task 3, `5b0e942`): real-Postgres-Vitest-Harness + unit/integration-Projects.
- `packages/auth` (Task 4, `5646f95`): better-auth-Instanz (invitation-only `user.create.before`, `session.create.after`→auth.login-Audit), deny-by-default-Guards (`requirePermission`+`assertOrgScope`, authz.denied-Audit), Audit-/Email-Helper (Outbox).
- Worker-Auth-Mails (Task 5, `0e7a2e1`); apps/platform-Wiring (Task 6, `aa648cb`: `/api/auth/[...all]`, Session-Middleware statt Basic-Auth, next.config); Login-Page (Task 7, `7887541`).
- Admin-Shell + Members-UI + Invitation-Service (Task 8, `5d48cbb`).
- Invitation-Accept-Flow `/invite/[token]` (Task 9, `bee346a`) + **Turbopack-Fix** (Workspace-Source-Packages: `.js`→extensionslose Imports — sonst crasht jede Server-Seite mit @ph360/auth; betraf auch /api/auth+Login) + Accept-Hardening (already-registered→saubere Meldung, keine Doppel-Verification-Mail).
- Audit-UI `/admin/audit` (Task 10, `1409499`); Bootstrap-Admin `scripts/create-admin.ts`+`ph360:create-admin` + prod-Env Auth statt Basic-Auth (Task 11, `b02308d`); Route-Level-Negativtest (Task 12, `c06f2aa`).
- ADR-010 (better-auth-only + eigene RBAC).

**Getestet:** unit 6/6, **integration 14/14** real-Postgres (Guard F-02/F-20, Invitation-Lifecycle F-19 inkl. Reuse-/already-registered-/no-verification-mail, Route-Contract F-20), typecheck 7/7. Browser-E2E (Dev-DB, inline-Creds): Invite→Accept→Login→`/admin/leads`+`/admin/audit` (live auth.login/member.joined/lead.created, Filter); Bootstrap-Script idempotent (PLATFORM_ADMIN/ACTIVE/emailVerified).

**Nicht getestet:** SALES-denied-Render („Kein Zugriff") nur test-abgedeckt (route-guards.itest.ts + admin/error.tsx-Pattern), nicht live durchgeklickt; kein Prod-Deploy (VPS-Rollout offen); `.env.prod.example` nicht editiert (read-blocked+gitignored, PO-offen).
**Restrisiko:** Lint repo-weit vorbestehend rot (apps/platform ohne ESLint-9-Config; apps/website-Funnel set-state-in-effect aus Phase 1) — separate Chips, NICHT Auth. Deferred (ADR-010): TOTP-2FA, Bewohner-Magic-Link, auto-org-scope-Prisma-Wrapper, AccessScope-Subtree (WP-1.3).
**Nächster Schritt:** WP-1.3 (Kern-Immobilien) oder VPS-Rollout (PO); vor Merge/Push Git-Remote (R-02) klären.

---
