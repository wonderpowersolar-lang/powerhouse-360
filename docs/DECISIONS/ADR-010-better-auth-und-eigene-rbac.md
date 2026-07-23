# ADR-010 — Authentifizierung via better-auth, RBAC/Mandanten in eigenen Tabellen

**Status:** Angenommen (WP-1.2, 2026-07-23). Präzisiert [ADR-002](ADR-002-telemetrie-zeitreihenspeicher.md) (Stack) und [ADR-004](ADR-004-mandantenisolation.md) (Mandantenisolation).

## Kontext
WP-1.2 ersetzt die interimistische HTTP-Basic-Auth durch echte Authentifizierung plus ein serverseitig erzwungenes, mandantengebundenes Rollen-/Rechtesystem. Gates F-02 (Mandant & Rollen), F-19 (Audit-Vollständigkeit) und F-20 (Berechtigungs-Negativmatrix) sollen grün werden.

## Entscheidung
- **better-auth (v1.6.x, Prisma-Adapter, Postgres-DB-Sessions)** besitzt **nur die Authentifizierung**: Tabellen `user`/`session`/`account`/`verification` mit **String-IDs** (KEINE `@db.Uuid` — better-auth erzeugt eigene, nicht-UUID-IDs). E-Mail+Passwort, **invitation-only** Signup über den `user.create.before`-Hook (erlaubt nur bei gültiger PENDING-Einladung oder Bootstrap-Admin), E-Mail-Verifikation/Passwort-Reset via Outbox→Worker.
- **Tenancy + RBAC in EIGENEN Prisma-Modellen:** `OrganizationMembership`, `Invitation`, Enum `SystemRole` (12 Rollen). Permissions leben **ausschließlich im Code** (`packages/permissions`, Schema `<domain>.<action>`) — nie in der DB.
- **Deny-by-default-Guard:** jede Admin-Page/Server-Action löst einen `AuthContext` auf und ruft `requirePermission(ctx, perm, { organizationId })` + `assertOrgScope`. Verweigerungen werden auditiert (`authz.denied`, best-effort).
- **Audit (F-19)** über die bestehende `AuditEvent`-Tabelle; `actorId` ist TEXT (Migration `audit_actor_id_text`, da better-auth-IDs keine UUIDs sind). Ereignisse: `auth.login`, `member.invited`, `member.joined`, `member.role_changed`, `authz.denied`.

## Konsequenzen
- Saubere Trennung: die Auth-Bibliothek ist austauschbar, RBAC/Mandanten bleiben unter eigener, testbarer Kontrolle (real-Postgres-Integrationstests).
- Gates **F-02/F-19/F-20 grün** (Guard-Layer + Route-Level-Negativtests + Browser-E2E der positiven Flows).
- Interim-Basic-Auth entfernt (`apps/platform/src/middleware.ts` → Session-Cookie-Gate; prod-Env `AUTH_SECRET`/`AUTH_URL` statt `ADMIN_BASIC_*`; Bootstrap via `scripts/create-admin.ts`).
- Betriebs-Hinweis: Workspace-Source-Packages mit TS-`exports` müssen **extensionslose** relative Imports nutzen (nicht `./x.js`) — Turbopack mappt `.js`→`.ts` nicht.
- **Deferred (bewusst, dokumentiert):** TOTP-2FA für interne Rollen, Bewohner-Magic-Link, automatischer org-scope-Prisma-Wrapper, `AccessScope`-Subtree (WP-1.3), Custom-Role-Tabelle, Rate-Limiting/CSP-Hardening.
