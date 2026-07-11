# POWERHOUSE 360 — API-Architektur

> Status: 🔵 Entwurf v1 (2026-07-11). Umsetzung ab Phase 1.

## 1. Drei API-Flächen

| Fläche | Konsument | Technik | Versionierung |
|---|---|---|---|
| **Interne App-API** | apps/platform (Admin, Portale, PWA) | typisierte Router (tRPC oder Next Server Actions + `packages/api-client`), Session-Auth | keine externe Versionierung; Typen im Monorepo |
| **Externe REST-API** `/api/v1/*` | Website-Funnel, Hubs, spätere Drittsysteme | REST + JSON, OpenAPI-Beschreibung, Token-/Hub-Auth | `v1`, additive Änderungen; Breaking → `v2` |
| **Webhooks (eingehend)** `/api/webhooks/*` | Documenso, Lexoffice, ggf. OCPP-Backend | POST + Signaturprüfung → `WebhookInbox` → Verarbeitung im Worker | Payload-Version wird mitgespeichert |

## 2. Verbindliche Regeln für jede Route/Prozedur

1. **Deklaration:** benötigte `Permission`, Org-Scope-Quelle (Pfadparameter/Session), Zod-Input- und Output-Schema. Ohne Deklaration kein Merge (Lint/Review-Gate).
2. **Validierung serverseitig** via `packages/validation`; Fehler als strukturierte Fehlerobjekte (`code`, `message`, `fieldErrors`) — keine rohen Exceptions an Clients.
3. **Mandanten-Scope** wird aus der Session/dem Token aufgelöst und an die Domain-Services übergeben; Services akzeptieren keine Queries ohne Scope.
4. **Idempotenz** für alle extern aufrufbaren mutierenden Endpunkte: `Idempotency-Key`-Header (Hub-Ingest, Funnel-Submit) bzw. natürliche Schlüssel.
5. **Audit:** mutierende Aufrufe erzeugen `AuditEvent` mit `requestId`.
6. **Rate-Limits** auf `/api/v1/leads`, Auth-Routen, Webhooks.

## 3. Wichtige externe Endpunkte (v1, Auszug)

| Endpunkt | Zweck | Auth |
|---|---|---|
| `POST /api/v1/leads` | Lead-Eingang von apps/website (ersetzt heutige `/api/leads` der Website) | öffentlicher Endpunkt + Honeypot + Rate-Limit + Origin-Check |
| `POST /api/v1/hubs/{hubId}/heartbeat` | Online-Status, Version, Diagnose | Hub-Credential |
| `POST /api/v1/hubs/{hubId}/readings` | Batch-Messwerte/Telemetrie (idempotent via Batch-ID) | Hub-Credential |
| `POST /api/v1/hubs/{hubId}/alerts` | Geräte-Alarme (Demontage, Batterie…) | Hub-Credential |
| `GET  /api/v1/hubs/{hubId}/config` | Soll-Konfiguration (LoRaWAN/Modbus, Gerätezuordnung) | Hub-Credential |
| `POST /api/webhooks/documenso` | Signaturstatus-Änderungen | Webhook-Secret (Signatur) |
| `POST /api/webhooks/lexoffice` | Beleg-/Zahlungsstatus (sofern verfügbar; sonst Polling im Worker) | Webhook-Secret |

## 4. Interne API — Schnitt nach Bounded Contexts

Router je Kontext (`crm`, `commercial`, `contracts`, `projects`, `onboarding`, `devices`, `billing`, `module-powermieter`, …). Jeder Router ruft ausschließlich Services seines Kontexts in `packages/domain` auf; Cross-Kontext-Bedarf läuft über die Service-Schicht, nie über direkte DB-Zugriffe fremder Tabellen.

## 5. Fehler- & Retry-Semantik gegenüber Adaptern

- Aufrufe an Documenso/Lexoffice laufen **nur im Worker** (Job mit Retry/Backoff), nie synchron im Request-Pfad — Ausnahme: rein lesende Statusabfragen.
- Jeder fehlgeschlagene Sync erzeugt einen sichtbaren Fehlerzustand (`AccountingSyncError`, `ContractSignatureRequest.status=failed`) mit manueller Retry-Aktion im Admin (auditiert).
- Timeouts/5xx der Fremdsysteme dürfen nie Powerhouse-Zustände raten: Status bleibt beim letzten bestätigten Wert, Retry übernimmt.

## 6. OpenAPI & Doku

- `/api/v1` wird aus den Zod-Schemata generiert (openapi-Generator) und unter `app.powerhouse360.de/api-docs` (intern geschützt) veröffentlicht.
- Hub-Protokoll zusätzlich in [DEVICE_AND_HUB_PLATFORM.md](DEVICE_AND_HUB_PLATFORM.md) beschrieben; `packages/device-sdk` ist die Referenzimplementierung.
