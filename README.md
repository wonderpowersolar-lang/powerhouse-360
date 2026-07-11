# POWERHOUSE 360 — Monorepo

Betriebssystem für Mehrfamilienhäuser. pnpm + Turborepo Monorepo.

> Planungsgrundlage: [`docs/POWERHOUSE_360_MASTER_PLAN.md`](docs/POWERHOUSE_360_MASTER_PLAN.md). Vor Plattform-Arbeit lesen und nach jedem Arbeitspaket pflegen.

## Struktur

```
apps/
  website     Marketing-Site (powerhouse360.de, chargemieter.de, smokemieter.de) — Next.js 16, Scroll-Kino
  platform    Plattform: Admin/CRM, Portale, Monteur-PWA, /api/v1 + Webhooks — Next.js 16
  worker      Hintergrund-Jobs: Outbox-Dispatcher, Syncs, Reminder
packages/
  database    Prisma-Schema + Client (eine PostgreSQL, Quelle der Wahrheit)
docs/         Masterplan & Architektur-Konzepte
```

## Entwicklung

```bash
pnpm install                 # Abhängigkeiten (alle Workspaces)
docker compose up -d         # Postgres :5432, Mailpit :8025, MinIO :9001
cp .env.example .env         # lokale Konfiguration
pnpm db:migrate              # Datenbankschema anlegen
pnpm db:seed                 # Grunddaten (Powerhouse-Organisation)
pnpm platform:dev            # Plattform  http://localhost:3100
pnpm website:dev             # Website     http://localhost:3005
pnpm worker:dev              # Worker (Outbox-Dispatcher)
```

## Status

Phase 1 (Core & Fundament) — siehe Masterplan §10 und [`docs/IMPLEMENTATION_LOG.md`](docs/IMPLEMENTATION_LOG.md).
