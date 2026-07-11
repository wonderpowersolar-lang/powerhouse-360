# POWERHOUSE 360 — Zielarchitektur

> Status: 🔵 Entwurf v1 (2026-07-11). Verbindlich nach Freigabe; Änderungen via ADR unter [DECISIONS/](DECISIONS/).

## 1. Leitbild

**Ein modularer Monolith** in **einem Monorepo** mit **einer PostgreSQL-Datenbank**, **einer Authentifizierung** und **einem Mandantenmodell**. Klare Bounded Contexts, interne Domain-Events, Adapter für externe Systeme (Documenso, Lexoffice, Geräteprotokolle). Keine Microservices, aber Auslagerungsfähigkeit einzelner Kontexte (Ingest, Worker) ist Designziel.

## 2. Monorepo-Struktur (Ziel)

Werkzeuge: **pnpm workspaces + Turborepo** (ADR-005). Bestehende Website wird verschoben, nicht neu gebaut.

```
/apps
  /website          ← heutige Marketing-Site (Root-Inhalt zieht hierher um), unverändert deployt auf powerhouse360.de & Modul-Domains
  /platform         ← NEUE Next.js-App: Admin/CRM + Kundenportal + Bewohnerportal + Monteur-PWA als Route-Groups (ADR-001)
      /(admin)         internes CRM, Operations, Geräte, Abrechnung, Retry-Konsolen
      /(portal)        Kunden-/Projektportal (HV, Eigentümer, WEG)
      /(resident)      Bewohnerportal
      /(installer)     Monteur-PWA (installierbar, offlinefähig)
      /api             versionierte HTTP-API + Webhooks (documenso, lexoffice, hubs)
  /worker           ← Job-Runner (pg-boss): Outbox-Dispatcher, Reminders, Syncs, Dokumentgenerierung
/packages
  /database         Prisma-Schema (nach Domänen aufgeteilt), Migrationen, Org-Scope-Guards, Seed
  /auth             better-auth-Konfiguration, Session-Helpers, 2FA
  /permissions      Permission-Katalog, Rollen, Scope-Auflösung (einzige Quelle)
  /domain           Bounded-Context-Services (crm, commercial, contracts, onboarding, projects, devices, billing, module-*)
  /events           Event-Typen (Zod), Outbox-Publisher, Handler-Registry
  /validation       Zod-Schemata für alle API-Eingaben
  /api-client       typisierter Client für apps (aus Routern generiert)
  /documents        Dokumentobjekt, Storage-Abstraktion, PDF-Generierung (Protokolle)
  /notifications    E-Mail (SMTP Hostinger)/Portal-Benachrichtigungen, Templates
  /documenso-adapter  Documenso-API-Client, Feldmapping, Webhook-Verarbeitung
  /lexoffice-adapter  Lexoffice-API-Client, ID-Mapping, Sync
  /device-sdk       Hub-seitige Bibliothek (Ingest-Protokoll, Auth) — später auch auf RPi5 genutzt
  /ui               geteilte UI-Basis (Tokens aus Website-Design abgeleitet)
  /testing          Test-Utilities, Fixtures, Factories
  /observability    Logger (mit Redaction), Request-Kontext, Metriken
```

Anpassung gegenüber dem Masterprompt-Vorschlag (§7): statt sechs getrennter Apps (`admin`, `customer-portal`, `installer-pwa`, `resident-portal`, `platform`, `api`) **eine Platform-App mit Route-Groups** — Begründung und Split-Kriterien in [ADR-001](DECISIONS/ADR-001-monorepo-und-app-schnitt.md). `/modules`-Top-Level entfällt; Modul-Fachlogik lebt als Bounded Contexts in `packages/domain`, Modul-UI in der Platform-App.

## 3. Bounded Contexts & Abhängigkeitsregeln

```
identity ──┐
realestate ─┼──> von allen nutzbar (Kern)
platform    ┘   (documents, events, audit, notifications)

crm → commercial → contracts → projects → onboarding
                                  │
devices ──────────────────────────┤
                                  ▼
powermieter · heatmieter · chargemieter · smokemieter   (Fachmodule)
                                  │
                                  ▼
                               billing
```

Regeln (per `eslint-boundaries` erzwungen):
1. Fachmodule importieren nur Kern-Kontexte, **nie einander**.
2. Adapter (`documenso-adapter`, `lexoffice-adapter`, Geräteprotokolle) werden nur von `contracts`/`billing`/`devices` aufgerufen — Fachlogik kennt keine Anbieter-APIs.
3. Apps enthalten keine Fachlogik; sie orchestrieren `packages/domain`-Services.
4. Kommunikation zwischen Kontexten, die nicht Aufrufer/Aufgerufener sind, läuft über Domain-Events.

## 4. Laufzeit-Topologie (Deployment)

Alles auf der vorhandenen Hostinger-VPS via **Coolify** (Bestand), Deutschland:

| Container | Inhalt |
|---|---|
| `website` | apps/website (heute schon produktiv, Domains: powerhouse360.de, chargemieter.de, smokemieter.de, künftig heatmieter.de/powermieter.de) |
| `platform` | apps/platform (Subdomain: `app.powerhouse360.de`) |
| `worker` | apps/worker (kein öffentlicher Port) |
| `postgres` | PostgreSQL 16 + tägliche Off-Site-Backups (Pflicht, R-02) |
| `documenso` | Selbst gehosteter Documenso-Server (`sign.powerhouse360.de`), eigene DB-Instanz/Schema |
| `storage` | S3-kompatibler Objektspeicher (MinIO) für Dokumente/Fotos |

Umgebungen: `dev` (lokal, docker-compose), `staging` (VPS, eigene Subdomains + eigene DB + eigener Documenso-Testspace), `prod`. Getrennte Secrets je Umgebung (Coolify).

## 5. API-Architektur (Kurzfassung)

Details in [API_ARCHITECTURE.md](API_ARCHITECTURE.md). Eckpunkte: interne typisierte Router (tRPC-Stil) für die eigenen Apps; versionierte REST-Endpunkte (`/api/v1/...`) für Hubs und externe Konsumenten; Webhook-Endpunkte mit Signaturprüfung + `WebhookInbox`; jede Route deklariert Permission + Zod-Schema.

## 6. Kern-Invarianten der Architektur

1. **Eine Quelle der Wahrheit:** Kunden, Gebäude, Einheiten, Geräte, Projekte, Verträge existieren genau einmal ([DATA_MODEL.md](DATA_MODEL.md)). Kein Modul legt Parallelstrukturen an.
2. **Prozessautomatik über Events:** Angebot angenommen → Projekt entsteht → Onboarding startet → Vertragssignatur schaltet Schritte frei → Aktivierungsprüfung → Modulbetrieb ([EVENT_MODEL.md](EVENT_MODEL.md)).
3. **Führende Systeme:** Powerhouse operativ führend; Documenso führend für Signaturprozesse/-nachweise; Lexoffice führend für Rechnungsnummer/Belegstatus/Zahlungsstatus.
4. **Keine Mock-Daten in Produktivpfaden.** Demo-Overlays der Website bleiben Marketing; die Plattform zeigt nur echte Daten (oder ehrliche Leerzustände).
5. **Website bleibt eigenständig:** Marketing iteriert weiter (Medien, Stories) ohne die Plattform zu berühren; Kopplung ausschließlich über `POST /api/v1/leads` der Platform-App.

## 7. Technologie-Festlegungen (Zusammenfassung der ADRs)

| Thema | Entscheidung | ADR |
|---|---|---|
| Repo/App-Schnitt | pnpm+Turborepo-Monorepo; 3 Apps (website, platform, worker) | ADR-001, ADR-005 |
| DB/ORM/Auth | PostgreSQL 16 (self-hosted) + Prisma + better-auth | ADR-002 |
| Verträge | Documenso self-hosted, Adapter-Package, Webhook-Inbox | ADR-003 |
| Events/Jobs | Transactional Outbox in Postgres + pg-boss-Worker (kein Redis/Kafka) | ADR-004 |
| Rechnungen | Lexoffice via Adapter, idempotente `InvoiceRequest`s | (Konzept: LEXOFFICE_INTEGRATION.md) |
| Geräte-Ingest | HTTPS-Push vom Hub (signiert) in Phase 4; MQTT/LoRaWAN-NS-Anbindung hub-lokal | DEVICE_AND_HUB_PLATFORM.md |
