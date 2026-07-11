# ADR-002 — PostgreSQL + Prisma + better-auth

Status: vorgeschlagen (2026-07-11) · Kontext: Phase 0/1

## Kontext
Es existiert keinerlei Persistenz oder Auth. Vorgaben: selbst gehostet (Hostinger/DE, DSGVO), mandantenfähig, echte Migrationen, ein zentrales Datenmodell.

## Entscheidung
- **PostgreSQL 16**, selbst gehostet als Container (Coolify), tägliche Off-Site-Backups.
- **Prisma** als ORM: deklaratives Schema als Quelle der Wahrheit, `prisma migrate` für versionierte Migrationen, Multi-File-Schema je Domäne, generierte Typen für `packages/domain`.
- **better-auth** für Authentifizierung: DB-Sessions in Postgres, E-Mail+Passwort, Magic-Link (Bewohner-Einladungen), TOTP-2FA, Organizations-Plugin als Basis des Mandantenmodells; Rollen/Permissions/Scopes bleiben eigene Fachtabellen (`packages/permissions`).

## Alternativen
- Supabase (self-hosted): bringt Auth+Storage, aber schwergewichtiger Stack-Betrieb und RLS-zentriertes Modell; wir brauchen App-seitige Scopes (Property/Projekt-Bäume), die RLS nur umständlich abbildet.
- Drizzle: gute Wahl, aber Prisma-Migrationsworkflow und Ökosystem passen besser zu „Schema = Dokumentation" im Masterplan-Prozess.
- NextAuth/Auth.js: schwächere native Organizations-/2FA-Story als better-auth.

## Konsequenzen
+ Ein DB-System für alles (inkl. Outbox/Jobs via pg-boss, ADR-004); Schema dient als lebende Dokumentation neben DATA_MODEL.md.
− Prisma-Kaltstart/Bundlegröße im Serverless-Kontext irrelevant (eigener Node-Container). Telemetrie-Volumen beobachten (R-12).
