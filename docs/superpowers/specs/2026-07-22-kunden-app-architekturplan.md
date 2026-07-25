# Powerhouse 360 — Kunden-App: Anforderungs- & Architekturplan

**Version:** 0.1.1 (durch PO freigegeben am 2026-07-22; danach Konsistenz-Nachführung §13)
**Datum:** 2026-07-22
**Status:** 🔵 analysiert/konzipiert
**Pflege:** Dieses Dokument wird während der Umsetzung kontinuierlich aktualisiert (Änderungsverlauf §13). Es ergänzt den Masterplan (`docs/POWERHOUSE_360_MASTER_PLAN.md`); bei Freigabe wird der Masterplan nachgeführt (§12).
**Bezug:** ADR-001 (Outbox), ADR-002 (Timescale), ADR-004 (Mandantenisolation), ADR-005 (Billing-Engine), ADR-006 (Testmandant), **ADR-009 (neu: Telemetrie-Ingestion, Entwurf)**, WP-1.2-Plan (`docs/superpowers/plans/2026-07-11-wp-1.2-auth-rollen-mandanten.md`)
**Qualitätssicherung:** Erstfassung adversarial geprüft (Fakten gegen Repo: 0 Abweichungen; Vollständigkeit gegen PO-Vorgaben und interne Konsistenz: 33 Findings, alle in dieser Fassung eingearbeitet).

---

## §0 Leitentscheidung (vom PO vorgegeben, 2026-07-22)

Die Kunden-App ist **kein fachliches Silo**, sondern ein **zusätzlicher Client des zentralen Powerhouse-360-Betriebssystems**. Alle Funktionen bauen auf gemeinsamen Domain-Modellen und APIs auf (Auth/Rollen, Organisationen, Gebäude, Einheiten, Bewohner, Verträge, Tarife, Geräte, Messstellen, Messwerte, Rechnungen, Dokumente, Benachrichtigungen, Audit-Events). Web-Portal und App verwenden dieselben fachlichen Services, Berechtigungen und Datenquellen.

**V1-Zielgruppe:** Bewohner / Powermieter-Endkunden. Die Architektur ist von Anfang an rollenbasiert, damit Eigentümer-, Bestandshalter-, HV- und Installateur-Sichten später **in derselben App** ergänzt werden können. **Plattformen:** iOS zuerst (TestFlight), Android folgt; ein Codebase für beide. **Formfaktor V1:** ausschließlich Smartphones; Layouts responsiv/adaptiv, sodass Tablet-Unterstützung später ohne Architektur- oder Designbruch ergänzbar ist (iPad-Auslieferung V1 deaktiviert, Expo `supportsTablet: false`).

---

## §1 Ist-Analyse des Repositories (verifiziert 2026-07-22, Branch `feat/platform-foundation`)

### 1.1 Monorepo

pnpm 11.11.0 + Turborepo, Node ≥ 20 (Prod-Images Node 22), TypeScript strict (`tsconfig.base.json`: ES2022, `moduleResolution: bundler`, `noUncheckedIndexedAccess`). Workspaces: `apps/{mobile,platform,website,worker}`, `packages/{database,permissions}`.

| Bestandteil | Ist-Stand |
|---|---|
| `apps/platform` | Next.js 16.2.7 / React 19.2.4, Port 3100. **Nur 7 Quelldateien**: `POST /api/v1/leads` (Lead-Intake mit optionalem `x-ingest-token`), Admin-Lead-Liste `/admin/leads` hinter **HTTP-Basic-Auth** (Interim), Startseite. Kein Login, keine Sessions, kein Portal-Code. |
| `apps/website` | Marketing-3D-Site (Next 16, R3F, GSAP, Lenis). Kein Code-Sharing mit platform; einzige Kopplung: server-to-server Lead-Forwarding an die Plattform-API. |
| `apps/worker` | Outbox-Dispatcher (Poll alle 3 s, Batch 20, Backoff bis 300 s, ab 5 Versuchen DEAD). Genau **1 Handler**: `lead.created` → Benachrichtigungs-Mail. |
| `apps/mobile` | Leer (nur README, angelegt 2026-07-22, Commit `2f21de0`). |
| `packages/database` | Prisma 6, PostgreSQL. **5 Modelle:** Organization, Lead, LeadActivity, AuditEvent, DomainEvent (Outbox) + 7 Enums. Genau 1 Migration (`20260711112509_init`). Seed: 1 Organization (POWERHOUSE). Tenant-Anker `organizationId`; kein RLS, Scoping ist App-Sache (ADR-004). |
| `packages/permissions` | 8 Permissions, 12 Systemrollen (`PLATFORM_ADMIN` … `RESIDENT`, `PARKING_USER`), Resolver (`roleHasPermission`, `resolvePermissions`, `canAny`), 6 Unit-Tests grün. **`RESIDENT` hat aktuell 0 Permissions** (leer bis Feature kommt). |
| Auth | **better-auth ist NICHT installiert.** WP-1.2 (better-auth ^1.6.23, Prisma-Adapter, DB-Sessions, invitation-only Signup, `OrganizationMembership`, `Invitation`, `SystemRole`-Enum) ist detailliert geplant (13 Tasks) — **nur Task 1 (`packages/permissions`) ist fertig.** |
| Telemetrie/Hub/Fleet | **0 Zeilen Code.** Grep über Repo: keine Treffer für MQTT/ChirpStack/Fleet/Telemetrie-Implementierung. Nur Planung: Masterplan §7 (Hub-Plattform P1), ADR-002 (TimescaleDB, Umsetzung Phase 4), geplante Modelle DeviceReading/DeviceTelemetry (Zuschnitt für V1: §3.2). |
| Deploy | Hostinger-VPS (`powerhouse.dvnii.de`), Coolify, `docker-compose.prod.yml` (postgres:16-alpine, migrate-One-shot, platform, worker, website). Deploy per `git archive | scp` (kein Git-Remote, R-02). Domains: `app.powerhouse360.de` → platform:3100. VPS-Rollout + DNS-Cutover noch offen (beim PO). Lokale Dev-Infra: Postgres :5433, Mailpit, MinIO. |

### 1.2 Konsequenzen für die App

1. **Nichts, was die App braucht, existiert bereits** — Auth, Objektbaum, Bewohner, Messstellen, Messwerte, Rechnungen, Dokumente, Push müssen aufgebaut werden. Die App-Initiative ist daher primär ein **Plattform-Ausbauprogramm** mit der App als erstem sichtbarem Abnehmer.
2. Die im Masterplan geplante Grundlagenarbeit (WP-1.2 Auth, WP-1.3 Immobilien/CRM) ist **identisch mit dem Unterbau der App** — es entsteht keine Doppelarbeit, die Reihenfolge bleibt masterplan-konform.
3. Teile von Phase 4 (Geräte-/Messwert-Kernmodell + Ingestion) werden **vorgezogen** (dokumentierte Planabweichung, §12). Die Monteur-PWA (Phase 5) ist davon unberührt.
4. Eine Kunden-**Mobile-App kommt im Masterplan bisher nicht vor** — dieses Dokument ist die fachliche Grundlage für ihre Aufnahme (PO-Auftrag vom 2026-07-22).

---

## §2 Zielarchitektur

### 2.1 Datenfluss (verbindliches Zielbild)

```
Zähler/Sensor ──LoRaWAN/Modbus──▶ PowerHub (RPi5)
                                    │  · nimmt Messwerte entgegen, normalisiert, validiert technisch
                                    │  · puffert lokal append-only (Internetausfall)
                                    │  · überträgt signierte, idempotente HTTPS-Batches
                                    ▼
                  POST /api/v1/ingest/telemetry   (Hub-Credential, ADR-009)
                                    │
              ┌─────────────────────┴──────────────────────┐
              │        Powerhouse-360-Plattform            │
              │                                            │
              │  Ingest-Pfad (synchron):                   │
              │  packages/ingestion → DeviceReading        │
              │  (append-only) + DomainEvent (Outbox)      │
              │                     │                      │
              │  apps/worker (asynchron):                  │
              │  device.telemetry_received →               │
              │  ConsumptionAggregate · DeviceState ·      │
              │  Lückenerkennung · DeviceAlert ·           │
              │  Push/Mail                                 │
              └────────┬───────────────────┬───────────────┘
                       ▼                   ▼
            /api/v1/app/* (Session, RBAC, Teilnahme-Scope)
                       │                   │
            Web-Portale (apps/platform)  Mobile-App (apps/mobile, Expo iOS/Android)
```

**Fachliche Trennung Fleet-Tool ↔ Plattform (PO-Vorgabe):** Das Fleet-Tool (eigene Powerhouse-360-Lösung, künftig) verwaltet Geräte und deren technischen Zustand (Hubs, RPis, Firmware, Rollouts, ChirpStack/LoRaWAN, Modbus, Fernwartung, Inbetriebnahme). Die Plattform verwaltet Kunden, Gebäude, Wohnungen, Verträge, Tarife, Abrechnung, Berechtigungen. Das Fleet-Tool nutzt dieselbe Geräte-Registry und Telemetrie der Plattform lesend/steuernd, ist aber **niemals** die dauerhafte Datenquelle für Abrechnung oder Kundenanzeige. Abrechnung, Portale und App greifen **ausschließlich** auf Plattformdaten zu.

**Verbotene Zugriffe der App (hart):** Fleet-Tool, Hub, Raspberry Pi, ChirpStack, LoRaWAN-Gateway, Modbus-Gerät, Zähler, interne Datenbank. Die App spricht nur `app.powerhouse360.de`.

### 2.2 Komponenten (neu bzw. ausgebaut)

| Komponente | Zweck | Entsteht in |
|---|---|---|
| `packages/api-contracts` | **Ein** Satz Zod-Schemas + TS-Typen für alle `/api/v1/app/*`- und Ingest-Contracts; konsumiert von platform (Validierung), mobile (Client + Mocks) und Hub-Simulator. Single Source of Truth → Mock und echter Client sind garantiert typgleich. | WP-APP-1 (Ingest-Teil), WP-APP-2 (App-Teil) |
| `packages/ingestion` | Ingest-Fachlogik: Hub-Auth, Batch-Idempotenz, Messwert-Validierung, Qualitätsstatus, Duplikat-/Lückenerkennung. Von platform-Route aufgerufen; später in eigenen Ingest-Service extrahierbar (Split-Kriterium „Ingest" ist in ADR-007 bereits vorgesehen). | WP-APP-1 |
| `packages/auth` | better-auth-Instanz, AuthContext, Guards (`requirePermission`, `assertOrgScope`) — wie WP-1.2 geplant. Der neue Teilnahme-Scope-Guard `assertParticipantScope` (§5.1) wird als Erweiterung in WP-APP-2 ergänzt (er setzt `PowerParticipant` voraus). | WP-1.2 (+WP-APP-2) |
| `packages/testing` | Real-Postgres-Vitest-Harness (`ph360_test` :5433), Factories — wie WP-1.2 Task 3 geplant, plus Telemetrie-Factories. | WP-1.2 (+WP-APP-1) |
| `tools/hub-simulator` | **Hub-Simulator** (im Dokument immer so benannt; „iOS-Simulator" bezeichnet Apples Gerätesimulator): erzeugt realistische 15-min-Lastprofile (Tag/Nacht, Wochenende, Saison), PV-Profile, Datenlücken, Nachlieferungen, Duplikate, Zählerwechsel, fehlerhafte Werte; sendet gegen die echte Ingest-API. Testdaten strikt von Produktivdaten getrennt (nur Testmandant, ADR-006). | WP-APP-1 |
| `apps/mobile` | Expo-App (React Native, TypeScript), Details §7/§11. | WP-APP-3 |
| `apps/platform` | + `/api/auth/[...all]`, + `/api/v1/app/*`, + `/api/v1/ingest/*`, + Aggregations-Services; Web-Portale später als Route-Groups (masterplan-konform). | WP-1.2 ff. |
| `apps/worker` | + Handler: Aggregat-Berechnung nach Ingest, Lücken-/Offline-Erkennung, Push-Versand (inkl. Anti-Spam-Regeln §3.3), Rechnungs-Benachrichtigung. | WP-APP-1/2/4 |

### 2.3 Architekturprinzipien (bindend)

1. **API-first:** Kein App-Feature ohne definierten, versionierten Contract in `packages/api-contracts`.
2. **Server erzwingt alles:** Jede Route deklariert Permission + Scope-Quelle + Zod-Schema (Masterplan §3; zulässige Deklarationsklassen: §4.1); die App ist reine Darstellung.
3. **Messwert-Qualitätskette (präzisiert, verbindlich auch in ADR-009):** `quality` ist ein Statusfeld je Messwertsatz. Der einzige zulässige In-place-Übergang ist RAW→VALIDATED (Validierung des Originals; `value`, `ts`, `kind` sind unveränderlich). SUBSTITUTE/ESTIMATED/CORRECTED entstehen **immer als neue Datensätze** mit `supersedesId` (Ketten erlaubt, auch CORRECTED→CORRECTED). **Leseregel:** je (meterId, ts, kind) gilt der neueste, nicht-supersedete Satz. Abrechnungsrelevante Datenstände werden über unveränderliche Finalisierungs-Snapshots fixiert (Billing-Domäne, nicht Teil dieses Plans — §3.3 ConsumptionAggregate).
4. **Keine Demo-Architektur:** Die App hat ein Repository-Interface (`DataSource`); `MockDataSource` (typisierte, realistische Fixtures) und `ApiDataSource` (HTTP) sind austauschbar — gleiche Typen aus `packages/api-contracts`.
5. **Ereignisgetrieben:** Ingest, Aggregation, Benachrichtigung laufen über die bestehende Outbox (ADR-001); Handler idempotent.
6. **Latenzziel V1:** Datenverzug ≤ 15–30 min (15-min-Batches). Die Architektur erlaubt später „nahezu live" (kleinere Batch-Intervalle bzw. Streaming-Kanal), ohne dass die Abrechnung davon abhängt.

---

## §3 Datenmodell (Delta zu `schema.prisma`)

Namen folgen dem Masterplan-Zielbild (§5). Alle Tabellen: UUID, `organizationId` (sofern nicht global), `createdAt/updatedAt`, Org-Scope-Guard. Geld = Integer-Cent, Energie = `numeric(14,3)` kWh.

### 3.1 Ausbaustufe A — mit WP-1.2/WP-1.3 (ohnehin geplant)

- **Auth/RBAC (WP-1.2):** `User`, `Session`, `Account`, `Verification` (better-auth), `OrganizationMembership` (userId+orgId unique, `role: SystemRole`), `Invitation`, Enum `SystemRole`.
- **Immobilien (WP-1.3):** `Property`, `Building`, `Entrance`, `Unit`, `Address` (+ `TechnicalRoom`, `GridConnection` nach Bedarf). Pilotstruktur: Property → Buildings → 21 Units (ADR-006-Seed).

### 3.2 Ausbaustufe B — Mess-/Gerätekern (WP-APP-1, vorgezogener Phase-4-Teil)

| Modell | Kernfelder / Zweck |
|---|---|
| `Hub` | Identität + Status eines PowerHub (RPi5): `serialNumber` unique, `status` (registered→active→…→replaced), `lastSeenAt`. |
| `HubCredential` | Token-Hash je Hub, `status ACTIVE\|REVOKED`, `expiresAt?`, `rotatedAt` — Revocation sofort serverseitig, ohne andere Hubs (Masterplan §7). Während einer Rotation dürfen **zwei** gültige Credentials je Hub existieren (altes mit `expiresAt` = Ende der Übergangsfrist). Erst-Provisionierung: Token wird beim Registrieren des Hubs im Admin (bzw. Seed für den Testmandanten) ausgestellt — Teil von WP-APP-1. |
| `Meter` | Physischer Zähler: `(manufacturer, model, serialNumber)` unique, `meterType` (V1: Strom; Enum erweiterbar für Heat/Charge/Smoke-Module), `unit`. |
| `MeteringPoint` | Fachlicher Zählpunkt/Messlokation je Unit oder Allgemeinstrom/PV: `unitId?`, `buildingId`, `pointType` (UNIT_CONSUMPTION, PV_GENERATION, GRID_FEED, BUILDING_GENERAL, STORAGE; erweiterbar), `externalId?` (MaKo später). |
| `DeviceAssignment` | **Versioniertes, historisierbares Mapping** Meter ↔ MeteringPoint (+ Hub, Kanal, technische IDs wie DevEUI/Modbus-Adresse): `validFrom`/`validTo`. Zählerwechsel = alter Datensatz endet, neuer beginnt — historische Messwerte bleiben korrekt zugeordnet (PO-Vorgabe Frage 11). |
| `MeterChange` | Wechselvorgang mit Endstand alt / Anfangsstand neu (Masterplan-Powermieter-Modell). |
| `IngestBatch` | Idempotenz-Anker je Hub-Batch: `(hubId, batchId)` unique, `payloadHash`, persistiertes Antwort-Ergebnis (wird bei Wiederholung wörtlich zurückgegeben), Zählwerte accepted/duplicate/rejected. Bekannte `batchId` mit abweichendem `payloadHash` ⇒ 409 `CONFLICT` + `DeviceAlert` (ADR-009 §3). |
| `DeviceReading` | **Append-only** 15-min-Messwerte: `meterId`, `assignmentId`, `ts` (UTC, Intervallende), `kind` (REGISTER = Zählerstand \| DELTA = Intervallverbrauch), `value`, `quality` (RAW\|VALIDATED\|SUBSTITUTE\|ESTIMATED\|CORRECTED), `receivedAt`, `late: boolean`, `supersedesId?`, `batchId`. **Duplikatschutz:** partieller Unique-Index `(meterId, ts, kind) WHERE supersedesId IS NULL` — genau ein Original je Intervall; Qualitäts-/Korrektursätze bilden Ketten über `supersedesId` (Leseregel §2.3 Nr. 3). Das Masterplan-Modell `DeviceTelemetry` (technische Gerätetelemetrie) entfällt für V1 — Gesundheits-/Statusdaten gehen in `DeviceState` auf; ein eigener Telemetrie-Speicher folgt mit Phase-4-Vollausbau (§12 Nr. 1). |
| `DeviceState` | Materialisierter Zustand je Meter/Hub (letzter Wert + Zeitstempel, online/offline, Lückenstatus) — **einzige Lesequelle** für Status-/„Letzter-Messwert"-Anzeigen; Dashboards/App lesen nie Rohtabellen (ADR-002). |
| `DeviceAlert` | Störung/Lücke → später Ticket-Kopplung. **Lückenerkennung (Regel):** je MeteringPoint mit zum Intervall gültigem `DeviceAssignment` werden 96 Intervalle/Tag erwartet (alle pointTypes — PV liefert nachts 0-Werte, keine Ausnahme); Alert ab 8 fehlenden Intervallen in Folge (2 h), Bewohner-Push „gestörte Messwerte" ab 12 h ohne Daten (beides konfigurierbar). |

**Speicher-Entscheidung (D-04, §11):** `DeviceReading` startet als normale append-only-Postgres-Tabelle (Pilot: 21 Messstellen × 96 Werte/Tag ≈ 0,7 Mio. Zeilen/Jahr — unkritisch). Tabellen-Layout ist Timescale-kompatibel; die Umstellung auf das Timescale-Image + Hypertables erfolgt gemäß ADR-002, spätestens mit Phase-4-Vollausbau.

### 3.3 Ausbaustufe C — Bewohner-Fachbezug + App-Services (WP-APP-2/4)

| Modell | Zweck |
|---|---|
| `PowerParticipant` | Bewohner/Teilnehmer je Unit mit Statuskette (eingeladen→…→aktiv→beendet) und `validFrom/validTo`; Felder u. a. `userId?`, `unitId`, `contractId?`. **Das ist der Scope- und Kontext-Anker der App** (§4.2, §5.1). |
| `Contract` | Powermieter-Stromliefervertrag: `contractNumber`, `participantId`/`unitId`, Referenz auf `TariffVersion`, Laufzeit/Status, `issuingEntityId`, verknüpfte `Document`-Referenzen. Datenbasis für den `/contract`-Endpunkt und die Rechnungs-Scope-Prüfung. (Volles Vertrags-Domänenmodell inkl. Signatur folgt Phase 3 — dieses V1-Modell ist dessen Teilmenge und wird dann erweitert, nicht ersetzt.) |
| `Tariff` / `TariffVersion` | Versionierte Tarife (Preise als Daten, nie Code — ADR-005): Arbeitspreis PV-/Mieterstrom, Arbeitspreis Netz, Grundpreis, Gültigkeit. Grundlage für €-Anzeige, Ø-Preis und Mieterstrom-Ersparnis. |
| `MeteringConcept` (+Version) | Messkonzept je Gebäude — bestimmt, ob PV/Netz-Split und Mieterstrom-Ersparnis berechenbar sind (PO-Vorgabe: „soweit Messdaten dies ermöglichen"). |
| `EnergyAllocation` | Zuordnung PV-Erzeugung/Netzbezug auf Teilnehmer je Intervall (Berechnungsergebnis, append-only). |
| `ConsumptionAggregate` | Vorberechnete Aggregate je MeteringPoint × Auflösung (HOUR\|DAY\|WEEK\|MONTH\|YEAR): kWh gesamt/PV/Netz, Kosten-Cent, Qualitätsflags (`hasGaps`, `isPreliminary`), `computedAt`. Worker-Job aktualisiert nach jedem Ingest — **auch nach Abrechnungs-Finalisierung** (Aggregate = beste aktuelle Kenntnis; die Abrechnung nutzt ausschließlich separate, unveränderliche Finalisierungs-Snapshots der Billing-Domäne, Phase 6 — Differenzen sind zulässig und werden in der App nicht als Rechnungskorrektur dargestellt). `isPreliminary = false`, sobald die Periode abgeschlossen ist und alle Intervalle lückenlos in Qualität ≥ VALIDATED vorliegen. **Leseregel App/BFF:** Zeitreihen ausschließlich aus `ConsumptionAggregate` (Tages-Drilldown = HOUR-Aggregate); Status/letzter Messwert ausschließlich aus `DeviceState`; kein Endpunkt liest `DeviceReading` direkt. |
| `Invoice` / `InvoiceReference` | Rechnungsmetadaten (Nummer, Zeitraum, Betrag, Status, `issuingEntityId`, `contractId`) + PDF-`Document`. Belegweg dahinter austauschbar (ADR-008). |
| `Document` | Datei-Metadaten + MinIO-Objektreferenz. **Scope-Anker (Pflicht):** `organizationId` + genau eine fachliche Referenz — `unitId` \| `contractId` \| `participantId` \| `buildingId` (Hausdokumente). Sichtbarkeitsregel je Referenztyp: contract/participant ⇒ nur zugehöriger Teilnehmer; unit ⇒ Teilnehmer der Unit im Gültigkeitszeitraum; building ⇒ alle aktiven Teilnehmer des Gebäudes. Download nur über kurzlebige signierte URLs. |
| `Notification` / `NotificationPreference` / `PushDevice` | In-App-/Push-Benachrichtigungen. **Prioritätsmodell (PO-Vorgabe Frage 20):** Feld `priority (1–5)` mit Mapping: 1 = neue Rechnung (BILLING, Info, abwählbar) · 2 = fehlende/gestörte Messwerte (DATA_QUALITY, wichtig, abwählbar) · 3 = kritische technische Störung, die den Nutzer konkret betrifft (INCIDENT, **kritisch, nicht abwählbar**) · 4 = Servicefall-Update (SERVICE, später) · 5 = Vertrags-/Projektstatus (CONTRACT, später). **Anti-Spam (bindend):** keine Pushes für einzelne Messabweichungen; Dedupe je DeviceAlert (eine Störung = max. 1 Push + 1 Entwarnung), Bündelung gleichartiger Ereignisse, konfigurierbares Tageslimit je Kategorie. Durchsetzung im Worker-Push-Handler. |

**DSGVO (PO-Vorgabe Frage 21, vollständig):** Verbrauchsdaten je Einheit sind personenbezogen. (a) HV/Eigentümer sehen **keine** Einzelverbrauchsprofile ohne dokumentierte Rechtsgrundlage — spätere Sichten aggregieren. (b) **Auskunft/Export:** V1-Prozessweg über Support (Auskunfts-/Exportanfrage, manuell bedient), Selbstbedienungs-Export als V1.1-Backlog. (c) **Verantwortlichkeiten/AVV:** Matrix Verantwortlicher (Betreiber/AKL) ↔ Auftragsverarbeiter (Hostinger, Apple/APNs, Google/FCM, Expo/EAS) wird als Teil von WP-APP-4/5 erstellt. (d) **Protokollierung sicherheitsrelevanter Zugriffe:** Login, Dokument-/Rechnungs-Download und jeder Admin-Zugriff auf wohnungsbezogene Daten erzeugen AuditEvents (§5.4, §9). (e) Lösch-/Aufbewahrungskonzept je Datenart (abrechnungsrelevante Readings dauerhaft, technischer Rest rolliert). (f) Keine Werbenetzwerke, keine Tracking-SDKs ohne ausdrückliche fachliche Freigabe. (g) Hosting/E-Mail in Deutschland bzw. bestehender Infrastruktur (Verifikation V-04, §10).

---

## §4 API-Contracts

### 4.1 Konventionen

- **Basis:** `https://app.powerhouse360.de` · App-Endpunkte unter **`/api/v1/app/*`** (BFF-Aggregationen für die App), Ingest unter **`/api/v1/ingest/*`**, Auth unter `/api/auth/*` (better-auth, web+app gemeinsam). Domain-APIs (Admin/CRM) bleiben unter `/api/v1/*` — Trennung dokumentiert in `packages/api-contracts/README`.
- **Format:** JSON, camelCase, Zeiten ISO 8601 UTC, Energie kWh als Dezimal-String (3 Nachkommastellen), Geld Integer-Cent, Mengen-Endpunkte mit Cursor-Pagination.
- **Fehlermodell:** `{ error: { code, message, requestId } }` mit stabilen Codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL`); HTTP 401/403/404/409/422/429/500.
- **Deklarationspflicht:** Jede Route deklariert Zod-Schema + genau eine Zugriffsklasse: `public` (nur unkritische Konfiguration), `session` (nur gültige Session nötig) oder `permission` (Permission + Scope-Quelle). ≥ 1 Positiv- + 1 Berechtigungs-Negativtest je Route.
- **Kontext-ID (verbindlich):** `contexts/:id` ist die **`PowerParticipant`-ID**. Sie bündelt Unit, Vertrag und Gültigkeitszeitraum und erzwingt strukturell die Vormieter-/Nachmieter-Trennung (der Nachmieter einer Unit sieht nie die Historie des Vormieters — Zeitraumbeschnitt auf `[validFrom, validTo]`, §5.1).
- **Versionierung:** Breaking Changes nur via `/api/v2/app/*`; die App sendet `x-app-version`, der Server kann Mindestversionen erzwingen (Force-Update-Mechanismus von Anfang an).

### 4.2 App-Endpunkte V1

| Endpunkt | Zweck | Zugriffsklasse (Scope) |
|---|---|---|
| `GET /api/v1/app/me` | Profil + **Contexts** (alle Verbrauchsstellen des Users als PowerParticipant-Liste: Unit, Gebäude, Vertrag, Rolle, `expired`-Flag für beendete Teilnahmen) — Grundlage des Umschalters (nur >1 Context ⇒ UI zeigt Umschalter) | permission: `profile.read_own` |
| `GET /api/v1/app/contexts/:id/summary` | Dashboard-Aggregat: letzter Messwert + Zeitstempel (aus `DeviceState`), **mittlere Leistung des letzten abgeschlossenen Messintervalls** (`recentPower`, s. u.), Verbrauch heute **inkl. Tageskosten und Tages-PV/Netz-Split**, Hochrechnung Monatsende, **Vormonatsvergleich** (laufender Monat vs. Vormonat gleicher Zeitraum), Monats-PV/Netz-Split, **Mieterstrom-Ersparnis** (Cent + Verfügbarkeits-Flag), Datenstand/Lücken-Status | permission: `consumption.read_own` (Teilnahme) |

> **`recentPower` — bewusst kein Momentanwert.** Das Standard-Messkonzept liefert 15-Minuten-Werte; eine momentane Wirkleistung existiert dort schlicht nicht. Der Endpunkt liefert deshalb die **mittlere** Leistung über das letzte abgeschlossene Intervall, zusammen mit dessen Ende und Länge, damit die App das korrekt beschriften kann („Ø letzte 15 Min" statt „aktuell"). Eine Kachel, die einen 15-Minuten-Mittelwert als Live-Wert ausgibt, wäre eine Falschaussage gegenüber dem Bewohner.

> **Offen:** Diese App-API ist ausschließlich bewohnerbezogen (`PowerParticipant`, `assertParticipantScope`). Die Vermieter- und Verwaltungsansichten der App haben bislang **keinen** Contract — Gebäudeaggregate, Wohneinheiten-Vergleich und Anlagenstatus sind hier nicht abgedeckt und brauchen eine eigene Entscheidung.
| `GET /api/v1/app/contexts/:id/consumption?resolution=hour\|day\|week\|month\|year&from&to` | Zeitreihe aus `ConsumptionAggregate` + Vergleich Vorperiode (%), Ø-Preis, Mieterstrom-Ersparnis, optional CO₂ (mit Berechnungsgrundlage); Lücken als explizite Segmente, `isPreliminary`-Flag | permission: `consumption.read_own` (Teilnahme) |
| `GET /api/v1/app/contexts/:id/data-status` | Letzte erfolgreiche Übertragung, bekannte Lücken, Störungshinweis | permission: `consumption.read_own` (Teilnahme) |
| `GET /api/v1/app/contexts/:id/invoices` · `GET …/invoices/:invoiceId` | Rechnungsliste/-detail | permission: `invoice.read_own` (Vertrag des Kontexts) |
| `GET /api/v1/app/documents/:id/download` | Kurzlebige signierte Download-URL (MinIO); Download wird auditiert (§3.3 d) | permission: `document.read_own` (Document-Scope-Anker) |
| `GET /api/v1/app/contexts/:id/contract` | Vertrags-/Tarifinfo aus `Contract` (read-only V1) | permission: `contract.read_own` (Vertrag des Kontexts) |
| `GET/PUT /api/v1/app/notification-preferences` | Kategorien an/aus (Priorität-3-Meldungen nicht abwählbar) | permission: `notification.manage_own` |
| `POST/DELETE /api/v1/app/push-devices` | Expo-Push-Token registrieren/entfernen | permission: `notification.manage_own` |
| `POST /api/v1/app/support/messages` | Kontakt/Support-Anfrage (→ Notification an Service; auch Kanal für DSGVO-Auskunfts-/Exportanfragen V1) | permission: `support.create_own` |
| `GET /api/v1/app/config` | Feature-Flags, Mindest-App-Version, rechtliche URLs | public (dokumentierte Ausnahme, kein Scope) |

Ingest-Contracts (`/api/v1/ingest/telemetry`, `/api/v1/ingest/credentials/rotate`): §6 / ADR-009. Auth-Flows (Login, Logout, Passwort-Reset, Invitation-Accept) laufen über better-auth-Endpunkte + `/invite/[token]`-Flow aus WP-1.2; die App nutzt den better-auth-Expo-Client (Verifikation V-01, §10).

---

## §5 Auth- & Berechtigungsmatrix

### 5.1 Mechanik

- **Sessions:** better-auth, DB-Sessions (WP-1.2). Mobile: better-auth-**Expo-Plugin** — Session-Token im **iOS Keychain / Android Keystore** (`expo-secure-store`), lange Session-Laufzeit mit Rotation; Logout invalidiert serverseitig.
- **Biometrie:** Face ID/Touch ID entsperrt die lokal gespeicherte Session (App-Lock), ersetzt nie die Server-Session. Opt-in nach erstem Login.
- **Accounts:** invitation-only (WP-1.2-Hook). Bewohner-Einladung entsteht aus dem Onboarding (V1-Übergang: Admin lädt Pilotbewohner manuell ein). Magic Link: Architektur lässt spätere Aktivierung als better-auth-Plugin zu (modular, PO-Vorgabe Frage 4); QR-/Vertragsnummern-Registrierung später.
- **Scoping (zweistufig, ADR-004-konform):** (1) Org-Scope via `OrganizationMembership`; (2) **Teilnahme-Scope** via `PowerParticipant`: `assertParticipantScope(ctx, participantId)` prüft, dass der Kontext dem User gehört, und **beschneidet jeden Datenzugriff auf den Zeitraum `[validFrom, validTo]`**. Beendete Teilnahmen bleiben lesbar (eigene Zeiträume, `expired`-Flag in `/me`), bis das Löschkonzept greift — das deckt DSGVO-Auskunft und die Negativmatrix konsistent ab. Cross-Tenant nur via `AccessScope` (WP-1.3).

### 5.2 Neue Permissions (Erweiterung `packages/permissions`)

`profile.read_own` · `consumption.read_own` · `invoice.read_own` · `document.read_own` · `contract.read_own` · `notification.manage_own` · `support.create_own` (Bearbeitung später: `profile.update_own`).

### 5.3 Matrix (V1 + Ausblick)

| Rolle | V1 (App) | Später (gleiche App) |
|---|---|---|
| `RESIDENT` | alle `*_own`-Permissions, strikt teilnahme-gescoped | Servicefälle (inkl. Foto), Abschläge, SEPA, Datenexport |
| `OWNER_BOARD` (Wohnungseigentümer/Beirat) | — (kein App-Zugang V1) | Gebäude-Aggregate, Dokumente, Beschlüsse — **keine Einzelprofile** |
| Bestandshalter/Portfolio-Eigentümer (Rollenzuschnitt beim Eigentümer-Ausbau, Org-Typ `ASSET_HOLDER`) | — | Mehrobjekt-Aggregate, Portfolio-Kennzahlen — **keine Einzelprofile** |
| `PROPERTY_MANAGER` | — (Web-Portal) | Mehrgebäude-Sicht, Aggregate, Servicefälle |
| `INSTALLER` / `INSTALLER_PARTNER_ADMIN` | — | Installateur-Sichten werden später in derselben App ergänzt; kurzfristig bleibt die Monteur-PWA (Phase 5) primär |
| `PLATFORM_ADMIN` | Web/Admin (nie App-Sonderrechte; Impersonation nur auditiert, später) | — |

### 5.4 Negativmatrix & Audit (F-20-Erweiterung)

Bewohner A sieht niemals Unit B; Bewohner sieht keine Gebäude-Rohdaten; Zugriffe außerhalb `[validFrom, validTo]` der eigenen Teilnahme ⇒ 403/leer; revokierter Hub kann nicht ingesten. **Auditpflicht:** Login (bestehender WP-1.2-Hook), Dokument-/Rechnungs-Download, Push-Token-Änderungen und jeder Admin-Zugriff auf wohnungsbezogene Daten erzeugen AuditEvents.

---

## §6 Fleet-/Hub-Ingestion-Konzept (Kurzfassung — verbindlich: ADR-009)

**Entscheidung (D-02):** Primärkanal ist **signiertes HTTPS-Batch-Push vom Hub an die Plattform** — masterplan-konform (§7: „Cloud nur signiertes HTTPS-Push/Pull, idempotente Batches"), robust, ohne zusätzlichen Broker-Betrieb. MQTT+TLS bleibt als späterer Zusatzkanal für „nahezu live" möglich; eine MQTT-Bridge würde in dieselbe idempotente Ingest-Pipeline einspeisen (kein Architekturwechsel). Kein Plattform-Polling am Fleet-Tool.

Kernpunkte (Payload-Schema, Grenzwerte und Alternativenabwägung in `docs/DECISIONS/ADR-009-telemetrie-ingestion-hub-plattform.md`):

1. `POST /api/v1/ingest/telemetry` — Bearer-Hub-Token (individuell je Hub, Hash serverseitig, Revocation sofort, Rotation über `POST /api/v1/ingest/credentials/rotate` ohne Vor-Ort-Einsatz), TLS verpflichtend.
2. Batch-Envelope mit `batchId` (UUID, Idempotenzschlüssel), `hubSerial` (muss zum authentifizierten Credential gehören, sonst 403 + Audit), `sentAt`, Readings mit Kanal-Referenz, `ts`, `kind` (register/delta), Wert, Sequenz. Antwort mit Per-Item-Ergebnis (accepted/duplicate/rejected + Grund); Antworten werden je `(hubId, batchId)` persistiert und bei Wiederholung wörtlich zurückgegeben.
3. Hub puffert lokal append-only; Nachlieferung nach Verbindungswiederherstellung in Originalreihenfolge; Werte mit `receivedAt − ts >` **LATE_THRESHOLD (Default 60 min, konfigurierbar; bewusst getrennt von der Clock-Skew-Toleranz)** werden als `late` markiert und lösen Aggregat-Neuberechnung der betroffenen Zeiträume aus.
4. Mapping-Präzedenz: maßgeblich ist ausschließlich `channelRef` → zum `ts` gültiges `DeviceAssignment`; `meterSerial` dient nur der Plausibilisierung (Mismatch ⇒ rejected + DeviceAlert). Readings ohne zum `ts` gültiges Assignment ⇒ rejected + DeviceAlert (kein stilles Verwerfen).
5. Delta-Ableitung aus Zählerständen erfolgt **serverseitig im Aggregations-Worker** (Hub sendet nur rohe Kanalwerte), inkl. definierter Regeln für Zählerwechsel (`MeterChange`: Endstand alt/Anfangsstand neu) und Lücken (kein Delta, `hasGaps = true`).
6. Lückenerkennung + Alert-/Push-Schwellwerte: §3.2 (`DeviceAlert`-Zeile).
7. **Hub-Simulator zuerst** (PO-Vorgabe Frage 10): `tools/hub-simulator` spielt normale Verläufe, Lücken, Zählerwechsel, Duplikate, fehlerhafte Werte gegen dieselbe API — Grundlage für F-08-Tests und App-Entwicklung, ausschließlich gegen den Testmandanten (ADR-006). Soll-Ergebnisse je Szenario sind durch die ADR-009-Regeln deterministisch (z. B. wertverschiedenes Duplikat ⇒ `rejected: conflicting_value`).

---

## §7 App-Sitemap & Kernflows

### 7.1 Technologie (D-01, D-05, D-06)

Expo (React Native, TypeScript) + expo-router · TanStack Query (Server-State) · better-auth-Expo-Client · **Sichere Speicherung:** Session-Token in `expo-secure-store` (Keychain/Keystore); Offline-Lesecache **verschlüsselt** (MMKV mit Verschlüsselung, Schlüssel im Keychain/Keystore); heruntergeladene PDFs nur im App-Sandbox-Dokumentverzeichnis ohne Cloud-Backup-Flag · `expo-local-authentication` (Biometrie) · i18next (de aktiv, en vorbereitet — keine Texte im UI verstreut) · Victory Native XL/Skia (Charts) · `expo-notifications` (Push via APNs/FCM) · EAS Build/Submit (TestFlight); lokale iOS-Simulator-Builds unabhängig von Accounts. Nur Smartphone-Formfaktor in V1 (`supportsTablet: false`), Layouts adaptiv für spätere Tablet-Erweiterung (§0).

### 7.2 Sitemap V1

```
Nicht angemeldet:  Willkommen → Login · Einladung annehmen (Deep Link /invite/[token]) · Passwort vergessen
Angemeldet (Tabs):
  1 Übersicht   Kontext-Umschalter (nur bei >1) · Heute-Karte (Verbrauch, letzter Messwert
                + Zeitstempel, Datenstand-Badge) · Kosten-Karte (Zeitraum + Hochrechnung,
                als Hochrechnung gekennzeichnet, Vormonatsvergleich) · PV/Netz-Split-Karte
                inkl. Mieterstrom-Ersparnis (nur wenn berechenbar) · Hinweis-Banner
                (Lücken/Störung/vorläufige Werte)
  2 Verbrauch   Segmente Tag·Woche·Monat·Jahr (Stunden per Drilldown im Tag) · Chart mit
                expliziter Lücken-Darstellung · Vergleich Vorperiode (%) + Vormonat · Ø-Preis ·
                Mieterstrom-Ersparnis (sofern berechenbar) · optional CO₂ (mit Grundlagen-Hinweis)
  3 Rechnungen  Liste (Status) · Detail · PDF ansehen/teilen (offline erneut öffenbar)
  4 Mehr        Verträge & Dokumente · Profil (read-only V1) · Benachrichtigungen (Kategorien)
                · Support/Kontakt (inkl. Datenauskunft/-export) · Sprache · Rechtliches
                (Datenschutz, Impressum, Lizenzen) · App-Info/Version · Abmelden
```

Modulare Navigation ohne funktionslose Platzhalter (PO-Vorgabe Frage 5): nicht verfügbare Module erscheinen nicht.

### 7.3 Kernflows (je mit Loading-/Empty-/Error-/Offline-Zustand)

1. **Einladung → Konto:** Mail-Link → App/Store → Passwort setzen → Login → Biometrie-Opt-in → Push-Opt-in (mit erklärendem Pre-Prompt) → Übersicht.
2. **Login/Entsperren:** E-Mail+Passwort; danach Biometrie-Entsperren; Passwort-Reset per Mail.
3. **Verbrauch erkunden:** Übersicht → Verbrauch → Zeitraum wechseln → Drilldown; Pull-to-Refresh aktualisiert und zeigt Datenstand („Stand 14:32").
4. **Rechnung:** Push „neue Rechnung" → Detail → PDF laden → offline erneut öffnen.
5. **Datenlücke/Störung:** Banner in Übersicht + Verbrauch, Detail unter Datenstand; kritische Störung ⇒ Push (Priorität 3, nicht abwählbar).
6. **Kontextwechsel:** Umschalter in der Titelzeile; Auswahl persistiert.
7. **Offline:** Zuletzt geladene Daten + Dokumente bleiben lesbar (verschlüsselter Cache); **alle Aktionen (Support-Anfrage, Einstellungs-/Präferenzänderungen, Aktualisierungen) erfordern Netz** und zeigen offline einen klaren Hinweis statt zu queuen.

### 7.4 Design

Brand Guidelines + `docs/DESIGN-DIRECTION.md` als Grundlage (Deep Navy `#0D1626`, Powerhouse Green `#3DB36A`, Warm Window `#F5BE75`, Sora); native Interpretation statt verkleinertem Web: große Verbrauchs-/Kostenwerte, wenige klare Hauptaktionen, modulare Karten, hochwertige Mikroanimationen, keine überladene Dashboard-Optik. **Dark + Light vollständig** (Default: Systemeinstellung). Barrierearm: Dynamic Type, Kontraste, VoiceOver/TalkBack-Labels, Chart-Werte zusätzlich als Text.

---

## §8 Umsetzungsreihenfolge (WP-Zuschnitt)

Traceability zur verbindlichen PO-Reihenfolge (Frage 14):

| PO-Schritt | WP |
|---|---|
| 1 Auth + Rollenmodell | WP-1.2 |
| 2 Org-/Gebäude-/Einheiten-/Bewohnerdatenmodell | WP-1.3 (+ `PowerParticipant` in WP-APP-2) |
| 3 Geräte-/Zähler-/Messstellen-/Mapping-Modell | WP-APP-1 |
| 4 Telemetrie-Ingestion mit Simulator | WP-APP-1 |
| 5 Messwertspeicherung + Aggregationen | WP-APP-1 (Speicherung) + WP-APP-2 (Aggregation) |
| 6 App-API | WP-APP-2 |
| 7 Mobile-App mit echten API-Contracts | WP-APP-3 (Mocks auf finalen Contracts) + WP-APP-4 (echte API) |
| 8 Pilotdaten anbinden | WP-APP-5 |
| 9 E2E-Tests + TestFlight-Build | WP-APP-5 (E2E-Anteile laufen je WP mit) |

| WP | Inhalt | Gate | Abhängigkeit |
|---|---|---|---|
| **WP-1.2** (bestehender Plan) | better-auth + RBAC + Invitations + Admin/Audit-UI, Tasks 2–13; inkl. V2-Deltas (Testmandant-Seed, IssuingEntity) | F-02, F-19, F-20 | — |
| **WP-1.3** (bestehend, App-relevanter Kern zuerst) | Property→Unit-Baum, Adressen, Pilotstruktur-Seed (21 Units), AccessScope-Grundlage | F-03 (Teil) | WP-1.2 |
| **WP-APP-1** | Mess-/Gerätekern (§3.2), `packages/api-contracts` anlegen (Ingest-Contracts), Ingest-API + `packages/ingestion`, Hub-Credentials inkl. Erst-Provisionierung + Rotation + Revocation, **Hub-Simulator**, Lückenerkennung | **F-08 (Kern)**: Idempotenz + raw→validated + Lücken | WP-1.3-Kern |
| **WP-APP-2** | `PowerParticipant` + `Contract`, Tarife (minimal), `ConsumptionAggregate` + Worker-Aggregation (inkl. serverseitiger Delta-Ableitung), PV/Netz-Split + Ersparnis (soweit Messkonzept), `assertParticipantScope`, Rechnungs-/Dokument-Serverseite (Invoice/Document + MinIO + Seed-PDFs), **alle `/api/v1/app/*`-Contracts final** in `packages/api-contracts`, Endpunkte + Tests | **F-APP-1 (API)**: Bewohner-Login → eigene Daten, Negativmatrix | WP-APP-1 |
| **WP-APP-3** *(parallel ab Contract-Freeze in WP-APP-2)* | `apps/mobile`-Grundgerüst: Expo, Navigation, Theme (Light/Dark), i18n, Auth-Flow, `DataSource`-Interface + `MockDataSource` mit realistischen Fixtures, Kern-Screens gegen Mocks (Demo-fähig) | interner Demo-Build im **iOS-Simulator gegen MockDataSource** | Contracts aus WP-APP-2 |
| **WP-APP-4** | `ApiDataSource` gegen echte API, Rechnungs-/Dokument-UI inkl. Offline-PDF, Push-Kette (Expo → APNs/FCM; Prioritätsmodell + Anti-Spam), verschlüsselter Offline-Lesecache, Datenstand-UI, DSGVO-Paket Teil 1 (AVV-Matrix, In-App-Datenschutzhinweise) | **F-APP-1 (E2E)** komplett gegen Staging | WP-APP-2 + 3 |
| **WP-APP-5** | Pilot-Anbindung: echte Hubs → Ingest (Verifikation V-02), Datenabgleich Hub-Simulator↔Real, TestFlight-Build + interner Test, DSGVO-Paket Teil 2 (Privacy-URL, Store-Angaben, VVT-Beitrag) | **F-APP-2**: Pilotdaten Ende-zu-Ende in App | WP-APP-4 + PO-Punkte |
| danach | Android-Beta (gleiche Codebase) · V1.1-Backlog (vollständige PO-Liste): Servicefall melden **inkl. Foto-Upload** + Bearbeitungsstatus, Projekt-/Installationsstatus, Angebote ansehen/bestätigen/unterschreiben, vollständige Stammdaten-Bearbeitung, Abschlagsänderungen, SEPA-Mandate, Datenauskunft/-export als Selbstbedienung, Eigentümer-/Bestandshalter-/HV-Sichten, **Heatmieter-/Chargemieter-/Smokemieter-Module** (Datenmodell dafür erweiterbar ausgelegt: `meterType`/`pointType`) | — | — |

**Parallel beim PO (nicht code-blockierend, aber terminkritisch):** Apple Developer Account (voraussichtlich AKL Powerhouse 360 GmbH — bis Bestätigung keine Festlegung auf Privatperson/Wonderpower; blockiert nur TestFlight/Push, nicht die Entwicklung) · VPS-Rollout + DNS (Staging-/Prod-URL für App-Tests) · Git-Remote/CI (R-02) · Pilotdaten-Verifikation · Pilottarife (R-A5) · Google Play Console (später).

---

## §9 Teststrategie

| Ebene | Werkzeug | Inhalt |
|---|---|---|
| Unit | Vitest | permissions (erweitert), ingestion-Validierung/Idempotenz (inkl. `conflicting_value`, Payload-Hash-Konflikt 409), Delta-Ableitung (inkl. Zählerwechsel, Lücken, DST-Wechsel), Aggregationslogik, Tarifrechnung, Hochrechnung, Ersparnis |
| Integration | Vitest + `packages/testing` (`ph360_test`, :5433, ADR-006) | jede App-/Ingest-Route ≥ 1 Positiv- + 1 Berechtigungs-Negativtest (Masterplan-Regel); Ingest-Ketten: Duplikat-Batch (persistierte Antwort), Nachlieferung/late, revokierter + rotierter Hub, `hubSerial`-Mismatch (403), Cross-Unit-Zugriff (403), Zeitraumbeschnitt beendeter Teilnahmen; Audit-Events für Downloads/Logins vorhanden |
| Contract | `packages/api-contracts` | Zod-Schemas als Single Source; Mock-Fixtures werden gegen dieselben Schemas geparst — Mock ≠ API ist damit build-brechend |
| Hub-Simulator-E2E | `tools/hub-simulator` | Szenario-Suiten (normal, Lücke, Zählerwechsel, Duplikat wertgleich/wertverschieden, fehlerhafte Werte) → deterministische Soll-Ergebnisse (ADR-009) als Assertions; Grundlage F-08 |
| App | RN Testing Library + **Maestro** (iOS-Simulator) | Komponenten-/Screen-Tests; E2E-Flows: Login, Biometrie-Gate (mockbar), Kontextwechsel, Verbrauchsansichten, Rechnungs-PDF, Offline-Banner + Aktionen-brauchen-Netz-Hinweis; Dark+Light-Screenshots |
| E2E-Gates (§12-Erweiterung) | manuell + skriptgestützt | **F-APP-1** Bewohner-Login → Verbrauch → Rechnung inkl. Negativmatrix; **F-APP-2** Pilot-Hub → Ingest → App zeigt echten Messwert; F-08-Kern vorgezogen |
| Nicht-funktional | — | Chart-Performance (Jahresansicht ≤ 400 Aggregatpunkte, kein Rohdaten-Transfer), API-Antwortzeiten, Push-Zustellung + Anti-Spam-Limits, Secure-Store-/verschlüsselter-Cache-Verhalten nach App-Kill/Update |

Statusregel: 🟢 nur nach tatsächlich durchlaufenem Nutzerfluss (Masterplan §12); Nichtgetestetes wird im IMPLEMENTATION_LOG dokumentiert.

---

## §10 Risiken & offene technische Verifikationen

| # | Risiko / Verifikation | Auswirkung | Maßnahme |
|---|---|---|---|
| V-01 | **better-auth-Expo-Client-Kompatibilität** (^1.6.23) mit invitation-only-Flow ungeprüft | Auth-Flow App | Spike in WP-APP-3-Start; Fallback: schlanker eigener Token-Client gegen better-auth-Endpunkte |
| V-02 | **Pilotdaten-Pipeline unverifiziert** (PO-Vorgabe: nicht voraussetzen) | Verzug WP-APP-5 | Hub-Simulator zuerst; Pilot-Verifikation als eigener Schritt mit dokumentiertem Ergebnis |
| V-03 | Hub-Hardware/-Software existiert nicht im Repo („Marketing-3D-Modell") | Ingest bleibt simulatorgetrieben | ADR-009 definiert die Schnittstelle hub-seitig verbindlich; Fleet-Tool/Hub-Code separates Vorhaben |
| V-04 | **Hosting-DE-Zusage verifizieren:** Rechenzentrum-Standort des Hostinger-VPS dokumentieren; Datenflüsse über Nicht-DE-Dienste (APNs/FCM, Expo/EAS) benennen und DSGVO-seitig bewerten (Push-Payloads minimieren: keine Verbrauchswerte im Push, nur Referenzen) | DSGVO-Zusage PO-Frage 21 | Teil von WP-APP-4/5-DSGVO-Paket |
| R-A1 | Kein Git-Remote/CI (R-02), Deploy per scp | Qualitätssicherung | PO-Punkt; bis dahin lokale Suite als Gate vor jedem Deploy |
| R-A2 | VPS/Prod nicht ausgerollt (R-01 prod offen) | kein Staging für App-E2E | PO-Punkt; App bis dahin gegen lokale Plattform + Mocks |
| R-A3 | Apple-Account-Gesellschaft unbestätigt | TestFlight/Push-Termin | nur organisatorisch; Entwicklung via iOS-Simulator unblockiert |
| R-A4 | PV/Netz-Split + Ersparnis hängen am Messkonzept des Pilotgebäudes | Feature ggf. teilweise | `MeteringConcept` prüft Berechenbarkeit; UI blendet Karte sonst aus (kein leerer Platzhalter) |
| R-A5 | Tarifdaten-Pflege für €-Anzeige ungeklärt (wer pflegt Pilottarife?) | Kostenanzeige | Admin-Minimal-UI bzw. Seed in WP-APP-2; PO liefert Pilottarife |
| R-A6 | DSGVO-Umfang App (VVT, Privacy-URL, Store-Angaben, AVV-Matrix, Löschkonzept, Auskunftsprozess) | Store-Freigabe | DSGVO-Pakete in WP-APP-4/5 (§3.3, §8); keine Tracking-/Werbe-SDKs (PO-Vorgabe) |
| R-A7 | Ingestion in Next.js-Route langfristig (Durchsatz bei Flottenwachstum) | Skalierung | für Pilot unkritisch; `packages/ingestion` ist service-extrahierbar (ADR-007-Splitkriterium „Ingest") |
| R-A8 | Zod-Versionsabgleich (Repo: ^3.24.1) über contracts/platform/mobile | Build | eine Version im Workspace-Root pinnen |
| R-A9 | Masterplan-P1-Regel: App + vorgezogene Phase-4-Teile = Scope-Erweiterung | Governance | mit diesem Dokument durch PO freigegeben; §12 führt Masterplan nach |

---

## §11 Entscheidungspunkte (mit Alternativen)

| # | Entscheidung | Alternativen (verworfen, Grund) | Status |
|---|---|---|---|
| D-01 | **Expo (React Native, TypeScript)** für `apps/mobile` | Flutter (Dart — kein Typ-Sharing mit TS-Monorepo, zweites Ökosystem); natives Swift+Kotlin (doppelte Codebase, widerspricht „für beides bauen" mit kleinem Team); Bare RN (mehr Native-Pflege ohne V1-Nutzen) | Empfehlung — mit Plan freigeben |
| D-02 | **HTTPS-Batch-Push Hub→Plattform** als Primärkanal (ADR-009) | MQTT+TLS als Primärkanal (eigener Broker-Betrieb, TLS-/Cert-Management, für 15-min-Werte ohne Nutzen); Plattform-Pull am Fleet-Tool (vom PO ausgeschlossen; Fleet-Tool keine Abrechnungsquelle) | Empfehlung — mit Plan freigeben |
| D-03 | **REST `/api/v1/app/*` + geteilte Zod-Contracts** (`packages/api-contracts`) | tRPC (eleganter im TS-Monorepo, aber schwächere Versionierung/Doku für einen langlebigen Mobile-Contract); GraphQL (Overhead ohne V1-Nutzen) | Empfehlung — mit Plan freigeben |
| D-04 | `DeviceReading` zunächst **Plain-Postgres append-only**, Timescale-Umstellung gemäß ADR-002 | sofort Timescale-Image (Prod-Image-Wechsel jetzt unnötig; Pilotvolumen klein) | Empfehlung |
| D-05 | Charts: **Victory Native XL (Skia)** | react-native-svg-Charts (Performance bei Interaktion), eigene Skia-Charts (Aufwand) | Empfehlung; finale Wahl nach UI-Spike in WP-APP-3 |
| D-06 | Push: **expo-notifications** (APNs/FCM) | direkte APNs/FCM-Integration (mehr Native-Aufwand, kein V1-Nutzen) | Empfehlung |
| D-07 | Kontext-ID = **PowerParticipant-ID** (§4.1) | Unit-ID (Nachmieter sähe Vormieter-Historie — DSGVO-Verstoß); Vertrags-ID (bildet Teilnahme-Zeitraum nicht ab) | Empfehlung — mit Plan freigeben |

---

## §12 Masterplan-Integration (bei Freigabe dieses Plans)

1. **§15 Änderungsverlauf:** Eintrag „Kunden-App (Bewohner-V1) als neuer P1-Bestandteil; Phase-4-Teilvorzug (Messwertkern + Ingestion) per PO-Freigabe 2026-07-22; `DeviceTelemetry` V1-Zuschnitt: geht in DeviceReading/DeviceState auf (§3.2)".
2. **§10:** WP-APP-1…5 aufnehmen (Zuschnitt aus §8); EXECUTION_ROADMAP entsprechend ergänzen.
3. **§12 E2E-Matrix:** F-APP-1 (Bewohner-Login→Verbrauch→Rechnung inkl. Negativmatrix), F-APP-2 (Pilot-Hub→Ingest→App) ergänzen; F-08-Kern als vorgezogen markieren.
4. **ADR-009** in `docs/DECISIONS/` aufnehmen (liegt als Entwurf bei).
5. `packages/permissions`-Katalog um `*_own`-Permissions erweitern (einzige Quelle bleibt das Paket).
6. IMPLEMENTATION_LOG-Eintrag je WP (append-only, bestehende Regel).

---

## §13 Änderungsverlauf

| Datum | Version | Änderung | Begründung |
|---|---|---|---|
| 2026-07-22 | 0.1.0 | Erstfassung nach PO-Anforderungsklärung (21 Fragen) + verifizierter Repo-Ist-Analyse; adversariale Review (33 Findings) eingearbeitet | PO-Auftrag Kunden-App |
| 2026-07-23 | 0.1.1 | §8: Rechnungs-/Dokument-Serverseite von WP-APP-4 nach WP-APP-2 verschoben (WP-APP-4 = nur UI/Offline-PDF) | Konsistenz mit WP-Detailplänen (Cross-Plan-Review) |
