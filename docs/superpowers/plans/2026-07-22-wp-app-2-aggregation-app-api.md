# WP-APP-2 — Bewohner-Fachmodell, Aggregation, App-API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bewohner-Fachmodell (PowerParticipant→PushDevice), Worker-Aggregation (serverseitige Delta-Ableitung + ConsumptionAggregate HOUR→YEAR inkl. PV/Netz-Split) und alle `/api/v1/app/*`-Endpunkte inkl. Teilnahme-Scope, sodass Gate **F-APP-1 (API)** grün ist: Bewohner-Login → eigene Daten, Negativmatrix erzwungen.

**Architecture:** Neue Prisma-Modelle (Ausbaustufe C, Spec §3.3) hängen am WP-1.3-Objektbaum und WP-APP-1-Messkern; die Aggregation läuft als idempotenter Worker-Schritt hinter dem bestehenden Outbox-Event `device.telemetry_received` (reine Funktionen für Delta/Bucketing/Split/Kosten, DB-Orchestrierung separat). Die App-API in `apps/platform` liest ausschließlich `ConsumptionAggregate`/`DeviceState`, validiert alle Ein-/Ausgaben mit Zod-Contracts aus `@ph360/api-contracts` und erzwingt pro Route Zugriffsklasse + `assertParticipantScope` (Kontext-ID = PowerParticipant-ID, Zeitraumbeschnitt `[validFrom, validTo]`).

**Tech Stack:** pnpm 11 + Turborepo · TypeScript strict (ES2022, bundler, verbatimModuleSyntax) · Prisma 6 (Client-Output `packages/database/generated/client`) · Next.js 16.2.7 App Router (Port 3100) · better-auth ^1.6.23 (`@ph360/auth`) · zod ^3.24.1 (`@ph360/api-contracts`) · Vitest 3 (`packages/testing`, Test-DB `ph360_test` :5433) · minio ^8 (Seed-PDF + signierte Download-URLs) · Worker: tsx, Outbox-Poll 3 s.

**Vorbedingungen:**
- **WP-1.2 grün (F-02/F-19/F-20):** `packages/auth` exportiert `getAuthContext(headers)`, `requirePermission(ctx, perm, { organizationId })`, `assertOrgScope`, `AuthnError`, `AuthzError`, `recordAudit`, Typ `AuthContext { userId; email; name; memberships: { organizationId; role }[] }`; Prisma-Modelle `User` (String-id), `Session`, `OrganizationMembership { userId, organizationId, role: SystemRole, status }`, Enum `SystemRole` (12 Rollen inkl. `RESIDENT`). `packages/testing` existiert (globalSetup mit `migrate deploy`, guarded truncate, `createOrg(type?, overrides?)`, `createUserWithMembership(organizationId, role, opts) → { user, email, password, membership }`), Root-`vitest.config.ts` mit Projekten `unit`/`integration` (`*.itest.ts`-Include für `packages/**` und `apps/**`).
- **WP-1.3-Kern grün:** Prisma-Modelle `Property { organizationId, name }`, `Building { propertyId, name, addressId }`, `Address { street, houseNumber, postalCode, city }`, `Unit { buildingId, entranceId?, label, floor? }` mit Delegates `prisma.property/building/address/unit`. `@ph360/testing` exportiert die WP-1.3-Factories `createProperty(organizationId, overrides?)`, `createBuilding(propertyId, overrides?)` (legt intern eine Address an) und `createUnit(buildingId, overrides?)`. Der Kombi-Helfer `createBuildingTree({ organizationId }) → { property, building, unit }` wird HIER in Task 4 definiert (kanonische Festlegung) und nutzt genau diese drei Factories.
- **WP-APP-1 grün (F-08-Kern):** Prisma-Modelle `Hub { serialNumber, status }`, `Meter { manufacturer, model, serialNumber, meterType, unit }`, `MeteringPoint { unitId?, buildingId, pointType }`, `DeviceAssignment { meterId, meteringPointId, hubId, channelRef, validFrom, validTo? }`, `MeterChange { meterOldId, meterNewId, changedAt, endValueOld, startValueNew }`, `IngestBatch { hubId, batchId, … }` (unique `(hubId, batchId)`, Compound-Key `hubId_batchId`), `DeviceReading { meterId, assignmentId, ts, kind, value Decimal(14,3), quality, receivedAt, late, supersedesId?, batchId → IngestBatch.id }` mit Self-Relation-Gegenseite `supersededBy DeviceReading[]`, `DeviceState { meterId unique, lastValue, lastTs, online, gapSince? }`, `DeviceAlert { type, meteringPointId?, hubId?, status, firstAt, lastAt }` (Status-Enum mit Wert `OPEN`; Typ-Wert `DATA_GAP` für Lücken). Enum-Werte: `MeteringPointType.UNIT_CONSUMPTION|PV_GENERATION|GRID_FEED|BUILDING_GENERAL|STORAGE`, `ReadingKind.REGISTER|DELTA`, `ReadingQuality.RAW|VALIDATED|SUBSTITUTE|ESTIMATED|CORRECTED`, `Meter.meterType`-Wert `ELECTRICITY`. `packages/api-contracts` existiert (ESM, zod ^3.24.1, Export `src/index.ts`, Ingest-Contracts inkl. `ingestEnvelopeSchema`). `packages/ingestion` exportiert `processBatch(hub, envelope, rawBody, opts?)` (Idempotenz + Per-Item-Pipeline, persistiert Readings + Outbox-Event). `tools/hub-simulator` (`@ph360/hub-simulator`) exportiert `generateDayLoadProfile(dayStartUtc: Date, opts: { startRegisterKwh: number; gapIntervals?: number[] }): Array<{ ts: string; value: string }>` (96 15-min-REGISTER-Werte als kWh-String mit 3 Nachkommastellen, via `intervalConsumptionKwh` kumuliert; `gapIntervals` = ausgelassene Slot-Indizes). Der Worker registriert in `apps/worker/src/index.ts` einen Handler für `device.telemetry_received`; Event-Payload enthält mindestens `{ hubId: string, batchId: string }` (hub-gelieferte batchId). **Weichen Feldnamen ab, wird ausschließlich die Aufrufstelle angepasst — nie die hiesige Fachlogik.**
- Lokale Infra läuft: `docker compose up -d` (Postgres :5433, Mailpit, MinIO :9000). Kein `git push` (kein Remote).

---

## Dateistruktur

**packages/database**
- `prisma/schema.prisma` (M) — +6 Enums, +12 Modelle Ausbaustufe C, Gegenseiten auf Organization/User/Unit/Building/MeteringPoint
- `prisma/migrations/*_wp_app_2_resident_domain/migration.sql` (C) — Migration inkl. CHECK „Document: genau eine Referenz“
- `prisma/seed.ts` (M) — Pilotdaten: Testtarif, 2 PowerParticipants, Contract, Rechnungs-Dummy + Seed-PDF in MinIO
- `package.json` (M) — devDependency `minio` für den Seed-Upload

**packages/permissions**
- `src/permissions.ts` (M) — +7 `*_own`-Permissions
- `src/roles.ts` (M) — `RESIDENT` erhält alle `*_own`
- `src/can.test.ts` (M) — Positivtests + Negativmatrix-Erweiterung

**packages/auth**
- `src/participant-scope.ts` (C) — `assertParticipantScope` (gehört-mir) + `clampToScope` (Zeitraumbeschnitt)
- `src/participant-scope.itest.ts` (C) — eigener/fremder/beendeter Kontext, Clamp-Regeln
- `src/index.ts` (M) — Re-Export participant-scope

**packages/testing**
- `src/factories.ts` (M) — `createBuildingTree`, `createResidentSetup`, `addParticipant`, `createPvSetup`, `writeRegisterSeries`
- `src/auth-headers.ts` (C) — `signInHeaders` (echte better-auth-Session für Routen-Tests)
- `src/index.ts` (M) — Re-Exporte

**packages/api-contracts**
- `src/app/common.ts` (C) — Fehler-Envelope, Fehlercodes, kWh-String, ISO-UTC, Resolution
- `src/app/format.ts` (C) — `toKwhString`, `kwhToMilli`, `milliToKwh` (kWh-String ↔ Milli-kWh-Ganzzahl, keine Float-Arithmetik)
- `src/app/me.ts` (C) — `/me`-Contract (Contexts inkl. `expired`)
- `src/app/consumption.ts` (C) — Summary-, Zeitreihen-, Data-Status-Contracts
- `src/app/billing.ts` (C) — Invoices (Cursor-Pagination), Document-Download, Contract
- `src/app/settings.ts` (C) — Notification-Preferences, Push-Devices, Support, Config
- `src/app/index.ts` (C) + `src/index.ts` (M) — Re-Exporte
- `src/app/contracts.test.ts` (C) — Schema-Fixtures parsen (Contract-Tests)

**apps/worker**
- `src/aggregation/decimal.ts` (C) — `decimalToMilli` (Prisma-Decimal → Milli-kWh, nutzt `kwhToMilli` aus `@ph360/api-contracts`)
- `src/aggregation/derive-deltas.ts` (C) — serverseitige Delta-Ableitung inkl. MeterChange-Formel
- `src/aggregation/buckets.ts` (C) — DST-sicheres UTC-Bucketing HOUR→YEAR
- `src/aggregation/allocation.ts` (C) — proportionale PV-Zuteilung je 15-min-Intervall
- `src/aggregation/cost.ts` (C) — Arbeitspreis-Kosten + Mieterstrom-Ersparnis
- `src/aggregation/recompute.ts` (C) — DB-Orchestrierung: Readings→Deltas→Allocation→Aggregate (idempotente Upserts)
- `src/aggregation/{decimal,derive-deltas,buckets,allocation,cost}.test.ts` (C) — Unit-Tests (TDD)
- `src/aggregation/recompute.itest.ts` (C) — Aggregat-Kette gegen Test-DB
- `src/aggregation/scenario.itest.ts` (C) — Szenariotests gegen Hub-Simulator-Daten (normal/Lücke/Zählerwechsel)
- `src/index.ts` (M) — Handler `device.telemetry_received` ruft zusätzlich `recomputeForBatch`; +Handler `support.message_created`
- `package.json` (M) — devDeps `@ph360/testing`, `@ph360/ingestion`, `@ph360/hub-simulator`

**apps/platform**
- `src/lib/app/respond.ts` (C) — Fehler-Envelope `{error:{code,message,requestId}}` + `appRoute`-Wrapper (Statusmapping)
- `src/lib/app/scope.ts` (C) — `requireSession`, `requireParticipant`, `requireAnyOrgPermission`
- `src/lib/app/storage.ts` (C) — MinIO-Client + kurzlebige signierte Download-URL
- `src/lib/app/projection.ts` (C) + `projection.test.ts` (C) — Monatsend-Hochrechnung (pure, TDD)
- `src/lib/app/series.ts` (C) — Zeitreihen-Service (Aggregate lesen, Clamp, Vorperiode, Ø-Preis, Ersparnis)
- `src/lib/app/summary.ts` (C) — Dashboard-Summary-Service (DeviceState, heute, Monat, Vormonat, Split, Datenstand)
- `src/app/api/v1/app/config/route.ts` (C) — public Config
- `src/app/api/v1/app/me/route.ts` (C) — Profil + Contexts
- `src/app/api/v1/app/contexts/[id]/summary/route.ts` (C)
- `src/app/api/v1/app/contexts/[id]/consumption/route.ts` (C)
- `src/app/api/v1/app/contexts/[id]/data-status/route.ts` (C)
- `src/app/api/v1/app/contexts/[id]/invoices/route.ts` (C) — Liste mit Cursor-Pagination
- `src/app/api/v1/app/contexts/[id]/invoices/[invoiceId]/route.ts` (C)
- `src/app/api/v1/app/contexts/[id]/contract/route.ts` (C)
- `src/app/api/v1/app/documents/[id]/download/route.ts` (C) — Sichtbarkeitsregel + Audit + signierte URL
- `src/app/api/v1/app/notification-preferences/route.ts` (C) — GET/PUT (INCIDENT nicht abwählbar)
- `src/app/api/v1/app/push-devices/route.ts` (C) — POST/DELETE (Audit)
- `src/app/api/v1/app/support/messages/route.ts` (C) — POST → Outbox
- `src/app/api/v1/app/app-core.itest.ts` (C) — config/me/summary/data-status: Positiv + Authz-Negativ
- `src/app/api/v1/app/consumption.itest.ts` (C) — Zeitreihe + Zeitraumbeschnitt Vormieter/Nachmieter
- `src/app/api/v1/app/billing.itest.ts` (C) — invoices/download/contract: Positiv + Negativ + Pagination + Audit
- `src/app/api/v1/app/settings-support.itest.ts` (C) — preferences/push/support: Positiv + Negativ
- `package.json` (M) — deps `@ph360/auth`, `@ph360/permissions`, `@ph360/api-contracts`, `minio`

**Root**
- `turbo.json` (M) — globalEnv: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_DOCUMENTS`, `APP_MIN_VERSION`, `APP_PRIVACY_URL`, `APP_IMPRINT_URL`, `SUPPORT_NOTIFY_TO`
- `vitest.config.ts` (M) — unit-Include auf `packages/**` + `apps/**` `*.test.ts` erweitern
- `.env.example` (M) — MinIO-/App-Config-Variablen
- `scripts/seed-app.ts` (C) — Resident-Login-Seed (better-auth-User + RESIDENT-Membership + `PowerParticipant.userId`)
- `package.json` (M) — Script `db:seed:app`

---

## Task 1: Prisma-Schema Ausbaustufe C + Migration `wp_app_2_resident_domain`

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/*_wp_app_2_resident_domain/migration.sql` (generiert + CHECK ergänzt)

- [ ] **Step 1: Enums + Modelle PowerParticipant/Contract/Tariff/TariffVersion anfügen**

Ans Ende von `schema.prisma` anfügen:

```prisma
// ---------------------------------------------------------------------------
// resident domain (WP-APP-2, Spec §3.3) — Geld Integer-Cent, Energie numeric(14,3) kWh
// ---------------------------------------------------------------------------

enum ParticipantStatus {
  INVITED
  ACTIVE
  ENDED
}

enum ContractStatus {
  DRAFT
  ACTIVE
  ENDED
  CANCELLED
}

enum AggregateResolution {
  HOUR
  DAY
  WEEK
  MONTH
  YEAR
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  CANCELLED
}

enum NotificationCategory {
  BILLING
  DATA_QUALITY
  INCIDENT
  SERVICE
  CONTRACT
}

enum PushPlatform {
  IOS
  ANDROID
}

/// Scope- und Kontext-Anker der App (D-07): contexts/:id = PowerParticipant.id.
model PowerParticipant {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @db.Uuid
  organization   Organization      @relation(fields: [organizationId], references: [id])
  userId         String?
  user           User?             @relation(fields: [userId], references: [id])
  unitId         String            @db.Uuid
  unit           Unit              @relation(fields: [unitId], references: [id])
  /// Verweis auf den aktiven Vertrag; bewusst ohne FK (Gegenrichtung Contract.participantId trägt die Relation, kein FK-Zyklus).
  contractId     String?           @db.Uuid
  status         ParticipantStatus @default(INVITED)
  validFrom      DateTime
  validTo        DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  contracts   Contract[]
  allocations EnergyAllocation[]
  documents   Document[]

  @@index([userId])
  @@index([unitId, validFrom])
  @@map("power_participant")
}

/// Powermieter-Stromliefervertrag (V1-Teilmenge; Phase-3-Vollmodell erweitert, ersetzt nicht).
model Contract {
  id              String            @id @default(uuid()) @db.Uuid
  organizationId  String            @db.Uuid
  organization    Organization      @relation(fields: [organizationId], references: [id])
  contractNumber  String            @unique
  participantId   String?           @db.Uuid
  participant     PowerParticipant? @relation(fields: [participantId], references: [id])
  unitId          String            @db.Uuid
  unit            Unit              @relation(fields: [unitId], references: [id])
  tariffVersionId String            @db.Uuid
  tariffVersion   TariffVersion     @relation(fields: [tariffVersionId], references: [id])
  status          ContractStatus    @default(ACTIVE)
  startAt         DateTime
  endAt           DateTime?
  /// Rechnungssteller-Referenz (IssuingEntity, WP-1.2-V2); bewusst ohne FK — Belegweg austauschbar (ADR-008).
  issuingEntityId String            @db.Uuid
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  invoices  Invoice[]
  documents Document[]

  @@index([participantId])
  @@map("contract")
}

/// Preise als Daten, nie Code (ADR-005). Arbeitspreise: Cent je kWh; Grundpreis: Cent je Monat.
model Tariff {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  versions TariffVersion[]

  @@map("tariff")
}

model TariffVersion {
  id                 String   @id @default(uuid()) @db.Uuid
  tariffId           String   @db.Uuid
  tariff             Tariff   @relation(fields: [tariffId], references: [id])
  validFrom          DateTime
  workPricePvCents   Int
  workPriceGridCents Int
  basePriceCents     Int
  createdAt          DateTime @default(now())

  contracts Contract[]

  @@unique([tariffId, validFrom])
  @@map("tariff_version")
}
```

- [ ] **Step 2: Modelle MeteringConcept/EnergyAllocation/ConsumptionAggregate anfügen**

```prisma
/// Messkonzept je Gebäude — bestimmt, ob PV/Netz-Split + Ersparnis berechenbar sind (R-A4).
model MeteringConcept {
  id              String       @id @default(uuid()) @db.Uuid
  organizationId  String       @db.Uuid
  organization    Organization @relation(fields: [organizationId], references: [id])
  buildingId      String       @unique @db.Uuid
  building        Building     @relation(fields: [buildingId], references: [id])
  splitCalculable Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@map("metering_concept")
}

/// PV/Netz-Zuteilung je Teilnehmer × 15-min-Intervall (ts = Intervallende, UTC).
/// Berechnungsergebnis (beste aktuelle Kenntnis): Neuberechnung ersetzt den Intervallwert per Upsert.
model EnergyAllocation {
  id            String           @id @default(uuid()) @db.Uuid
  participantId String           @db.Uuid
  participant   PowerParticipant @relation(fields: [participantId], references: [id])
  ts            DateTime
  pvKwh         Decimal          @db.Decimal(14, 3)
  gridKwh       Decimal          @db.Decimal(14, 3)
  computedAt    DateTime         @updatedAt

  @@unique([participantId, ts])
  @@map("energy_allocation")
}

/// Einzige Zeitreihen-Lesequelle der App (§3.3): vorberechnete Aggregate je MeteringPoint × Auflösung.
model ConsumptionAggregate {
  id              String              @id @default(uuid()) @db.Uuid
  meteringPointId String              @db.Uuid
  meteringPoint   MeteringPoint       @relation(fields: [meteringPointId], references: [id])
  resolution      AggregateResolution
  periodStart     DateTime
  kwhTotal        Decimal             @db.Decimal(14, 3)
  kwhPv           Decimal?            @db.Decimal(14, 3)
  kwhGrid         Decimal?            @db.Decimal(14, 3)
  costCents       Int?
  hasGaps         Boolean             @default(false)
  isPreliminary   Boolean             @default(true)
  computedAt      DateTime            @updatedAt

  @@unique([meteringPointId, resolution, periodStart])
  @@map("consumption_aggregate")
}
```

- [ ] **Step 3: Modelle Invoice/Document/Notification/NotificationPreference/PushDevice anfügen**

```prisma
/// Rechnungsmetadaten + PDF-Document (Belegweg dahinter austauschbar, ADR-008).
model Invoice {
  id              String        @id @default(uuid()) @db.Uuid
  organizationId  String        @db.Uuid
  organization    Organization  @relation(fields: [organizationId], references: [id])
  contractId      String        @db.Uuid
  contract        Contract      @relation(fields: [contractId], references: [id])
  number          String        @unique
  periodStart     DateTime
  periodEnd       DateTime
  totalCents      Int
  status          InvoiceStatus @default(ISSUED)
  /// s. Contract.issuingEntityId
  issuingEntityId String        @db.Uuid
  documentId      String        @unique @db.Uuid
  document        Document      @relation(fields: [documentId], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([contractId, periodStart])
  @@map("invoice")
}

/// Datei-Metadaten + MinIO-Objektreferenz. Scope-Anker: organizationId + GENAU EINE
/// fachliche Referenz (unitId | contractId | participantId | buildingId) — DB-CHECK in der Migration.
model Document {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @db.Uuid
  organization   Organization      @relation(fields: [organizationId], references: [id])
  unitId         String?           @db.Uuid
  unit           Unit?             @relation(fields: [unitId], references: [id])
  contractId     String?           @db.Uuid
  contract       Contract?         @relation(fields: [contractId], references: [id])
  participantId  String?           @db.Uuid
  participant    PowerParticipant? @relation(fields: [participantId], references: [id])
  buildingId     String?           @db.Uuid
  building       Building?         @relation(fields: [buildingId], references: [id])
  objectKey      String
  fileName       String
  mimeType       String
  createdAt      DateTime          @default(now())

  invoice Invoice?

  @@map("document")
}

/// In-App-Benachrichtigung. priority-Mapping (§3.3): 1 BILLING · 2 DATA_QUALITY · 3 INCIDENT (nicht abwählbar) · 4 SERVICE · 5 CONTRACT.
/// Kompatibel zum `notification.requested`-Payload (Producer WP-APP-1, Consumer WP-APP-4 Task 8):
/// dessen `priority: 1|2|3` und `category: DATA_QUALITY|BILLING|INCIDENT` sind eine Teilmenge dieses Modells.
model Notification {
  id             String               @id @default(uuid()) @db.Uuid
  userId         String
  user           User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId String?              @db.Uuid
  priority       Int
  category       NotificationCategory
  title          String
  body           String
  readAt         DateTime?
  createdAt      DateTime             @default(now())

  @@index([userId, createdAt])
  @@map("notification")
}

model NotificationPreference {
  id        String               @id @default(uuid()) @db.Uuid
  userId    String
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  NotificationCategory
  enabled   Boolean              @default(true)
  updatedAt DateTime             @updatedAt

  @@unique([userId, category])
  @@map("notification_preference")
}

model PushDevice {
  id            String       @id @default(uuid()) @db.Uuid
  userId        String
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  expoPushToken String       @unique
  platform      PushPlatform
  appVersion    String
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@map("push_device")
}
```

- [ ] **Step 4: Gegenseiten auf bestehenden Modellen ergänzen**

In `model Organization` ergänzen:
```prisma
  powerParticipants PowerParticipant[]
  contracts         Contract[]
  tariffs           Tariff[]
  meteringConcepts  MeteringConcept[]
  invoices          Invoice[]
  documents         Document[]
```
In `model User` (WP-1.2) ergänzen:
```prisma
  powerParticipants       PowerParticipant[]
  notifications           Notification[]
  notificationPreferences NotificationPreference[]
  pushDevices             PushDevice[]
```
In `model Unit` (WP-1.3) ergänzen:
```prisma
  powerParticipants PowerParticipant[]
  contracts         Contract[]
  documents         Document[]
```
In `model Building` (WP-1.3) ergänzen:
```prisma
  meteringConcept MeteringConcept?
  documents       Document[]
```
In `model MeteringPoint` (WP-APP-1) ergänzen:
```prisma
  aggregates ConsumptionAggregate[]
```

- [ ] **Step 5: Migration erzeugen, CHECK-Constraint ergänzen, anwenden**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
docker compose up -d --wait postgres
set -a; . ./.env; set +a
pnpm --filter @ph360/database exec prisma migrate dev --create-only --name wp_app_2_resident_domain
```
Dann in der neu erzeugten `packages/database/prisma/migrations/*_wp_app_2_resident_domain/migration.sql` ans Ende anfügen:
```sql
-- Document: genau eine fachliche Referenz (Spec §3.3, Scope-Anker-Pflicht)
ALTER TABLE "document" ADD CONSTRAINT "document_exactly_one_ref"
  CHECK (num_nonnulls("unitId", "contractId", "participantId", "buildingId") = 1);
-- Notification: Prioritätsmodell 1-5
ALTER TABLE "notification" ADD CONSTRAINT "notification_priority_range"
  CHECK ("priority" BETWEEN 1 AND 5);
```
Anwenden + prüfen:
```bash
pnpm --filter @ph360/database exec prisma migrate dev
pnpm --filter @ph360/database exec prisma migrate status
```
Erwartet: „Database schema is up to date“; Client regeneriert (Delegates `prisma.powerParticipant`, `prisma.consumptionAggregate`, … vorhanden).

- [ ] **Step 6: Commit**

```bash
git add packages/database/prisma
git commit -m "feat(db): WP-APP-2-Schema — Bewohner-Fachmodell (PowerParticipant…PushDevice) + Migration wp_app_2_resident_domain"
```

---

## Task 2: `packages/permissions` — 7 `*_own`-Permissions, RESIDENT-Zuordnung (TDD)

**Files:**
- Modify: `packages/permissions/src/permissions.ts`, `packages/permissions/src/roles.ts`
- Test: `packages/permissions/src/can.test.ts` (Erweiterung + Anpassung Negativmatrix)

- [ ] **Step 1: Fehlschlagende Tests schreiben**

`packages/permissions/src/can.test.ts` — den bestehenden Test `"feature-less roles grant nothing"` ersetzen (RESIDENT ist nicht mehr leer) und am Dateiende einen neuen describe-Block anfügen. Der Test `"feature-less roles grant nothing"` wird zu:

```ts
  it("feature-less roles grant nothing", () => {
    for (const role of ["INSTALLER", "PARKING_USER", "BILLING_CONTACT"] as const) {
      expect(resolvePermissions([role]).size).toBe(0);
    }
  });
```

Neuer Block am Dateiende:

```ts
const OWN_PERMISSIONS = [
  "profile.read_own",
  "consumption.read_own",
  "invoice.read_own",
  "document.read_own",
  "contract.read_own",
  "notification.manage_own",
  "support.create_own",
] as const;

describe("WP-APP-2: *_own-Permissions (Spec §5.2/§5.3)", () => {
  it("RESIDENT hat alle 7 *_own-Permissions", () => {
    for (const p of OWN_PERMISSIONS) {
      expect(roleHasPermission("RESIDENT", p)).toBe(true);
    }
  });

  it("Negativmatrix: KEINE andere Rolle hat irgendeine *_own-Permission (auch PLATFORM_ADMIN nicht — nie App-Sonderrechte)", () => {
    for (const role of SYSTEM_ROLES) {
      if (role === "RESIDENT") continue;
      for (const p of OWN_PERMISSIONS) {
        expect(roleHasPermission(role, p)).toBe(false);
      }
    }
  });

  it("RESIDENT hat weiterhin keine Admin-/CRM-Permissions", () => {
    for (const p of ["lead.read", "audit.read", "member.invite", "organization.read"] as const) {
      expect(roleHasPermission("RESIDENT", p)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/permissions test
```
Erwartet: FAIL — TypeScript-Fehler (`"profile.read_own"` ist kein `Permission`) bzw. Assertion-Fehler `RESIDENT hat alle 7 *_own-Permissions`.

- [ ] **Step 3: Katalog + Rollenzuordnung implementieren**

`packages/permissions/src/permissions.ts` — vollständig ersetzen durch:

```ts
/** The ONLY place permissions are defined (Masterplan §8 — einzige Quelle des Permission-Katalogs). */
export const PERMISSIONS = [
  "lead.read",
  "lead.update",
  "audit.read",
  "member.read",
  "member.invite",
  "member.assign_role",
  "member.remove",
  "organization.read",
  // WP-APP-2 (Spec §5.2): Bewohner-Self-Service, strikt teilnahme-gescoped (assertParticipantScope)
  "profile.read_own",
  "consumption.read_own",
  "invoice.read_own",
  "document.read_own",
  "contract.read_own",
  "notification.manage_own",
  "support.create_own",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
```

`packages/permissions/src/roles.ts` — vollständig ersetzen durch (Änderung: `RESIDENT_OWN`-Liste + Zuordnung; `ALL` bleibt bewusst OHNE `*_own` — PLATFORM_ADMIN erhält nie App-Sonderrechte, Spec §5.3):

```ts
import type { Permission } from "./permissions.js";

/** System roles (mirror of the Prisma SystemRole enum — keep in sync). */
export const SYSTEM_ROLES = [
  "PLATFORM_ADMIN",
  "SALES",
  "OPERATIONS",
  "SERVICE",
  "FINANCE",
  "PROPERTY_MANAGER",
  "OWNER_BOARD",
  "BILLING_CONTACT",
  "INSTALLER_PARTNER_ADMIN",
  "INSTALLER",
  "RESIDENT",
  "PARKING_USER",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

const ALL: Permission[] = [
  "lead.read",
  "lead.update",
  "audit.read",
  "member.read",
  "member.invite",
  "member.assign_role",
  "member.remove",
  "organization.read",
];

/** Bewohner-App-Permissions (Spec §5.2) — ausschließlich RESIDENT (Spec §5.3). */
const RESIDENT_OWN: Permission[] = [
  "profile.read_own",
  "consumption.read_own",
  "invoice.read_own",
  "document.read_own",
  "contract.read_own",
  "notification.manage_own",
  "support.create_own",
];

/** Role → permissions. Empty = no capability until its feature ships. */
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  PLATFORM_ADMIN: ALL,
  SALES: ["lead.read", "lead.update", "member.read", "organization.read"],
  OPERATIONS: ["lead.read", "member.read", "organization.read"],
  SERVICE: ["lead.read", "member.read", "organization.read"],
  FINANCE: ["lead.read", "member.read", "organization.read"],
  PROPERTY_MANAGER: ["lead.read", "organization.read"],
  OWNER_BOARD: ["organization.read"],
  BILLING_CONTACT: [],
  INSTALLER_PARTNER_ADMIN: [],
  INSTALLER: [],
  RESIDENT: RESIDENT_OWN,
  PARKING_USER: [],
};
```

- [ ] **Step 4: Test grün sehen**

```bash
pnpm --filter @ph360/permissions test
```
Erwartet: alle Tests PASS (bestehende 6 + 3 neue).

- [ ] **Step 5: Commit**

```bash
git add packages/permissions
git commit -m "feat(permissions): 7 *_own-Permissions für RESIDENT inkl. Negativmatrix-Erweiterung (Spec §5.2/§5.3)"
```

---

## Task 3: `packages/api-contracts` — alle App-Contracts (§4.2) als Zod-Schemas (TDD)

**Files:**
- Create: `packages/api-contracts/src/app/common.ts`, `src/app/format.ts`, `src/app/me.ts`, `src/app/consumption.ts`, `src/app/billing.ts`, `src/app/settings.ts`, `src/app/index.ts`
- Modify: `packages/api-contracts/src/index.ts`
- Test: `packages/api-contracts/src/app/contracts.test.ts`

- [ ] **Step 1: Fehlschlagenden Contract-Test schreiben**

`packages/api-contracts/src/app/contracts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  kwhStringSchema,
  appResolutionSchema,
  kwhToMilli,
  milliToKwh,
  meResponseSchema,
  summaryResponseSchema,
  consumptionQuerySchema,
  consumptionResponseSchema,
  dataStatusResponseSchema,
  invoiceListResponseSchema,
  invoiceDetailResponseSchema,
  documentDownloadResponseSchema,
  contractResponseSchema,
  notificationPreferencesResponseSchema,
  notificationPreferencePutSchema,
  pushDeviceCreateSchema,
  supportMessageCreateSchema,
  configResponseSchema,
} from "./index.js";

const UUID = "018c2f7e-0000-4000-8000-000000000001";
const TS = "2026-07-01T00:00:00.000Z";

describe("kWh-Format (Spec §4.1: Dezimal-String, 3 Nachkommastellen)", () => {
  it("akzeptiert exakt 3 Nachkommastellen, lehnt andere ab", () => {
    expect(kwhStringSchema.safeParse("14.400").success).toBe(true);
    expect(kwhStringSchema.safeParse("0.000").success).toBe(true);
    expect(kwhStringSchema.safeParse("1.2").success).toBe(false);
    expect(kwhStringSchema.safeParse("1,200").success).toBe(false);
    expect(kwhStringSchema.safeParse("abc").success).toBe(false);
  });

  it("kwhToMilli/milliToKwh sind verlustfreie Ganzzahl-Umrechnungen", () => {
    expect(kwhToMilli("14.400")).toBe(14400);
    expect(kwhToMilli("0.001")).toBe(1);
    expect(kwhToMilli("1000")).toBe(1000000);
    expect(milliToKwh(14400)).toBe("14.400");
    expect(milliToKwh(0)).toBe("0.000");
    expect(milliToKwh(-150)).toBe("-0.150");
    expect(() => kwhToMilli("1.2345")).toThrow();
  });
});

describe("App-Contracts parsen realistische Fixtures (Single Source of Truth, §9 Contract-Ebene)", () => {
  it("me", () => {
    const r = meResponseSchema.safeParse({
      user: { id: "u1", email: "a@b.test", name: "Test", locale: "de" },
      contexts: [{
        id: UUID, unitLabel: "WE 01", buildingName: "Christinenstraße 1",
        contractNumber: "PM-2026-0001", validFrom: TS, validTo: null, expired: false,
      }],
    });
    expect(r.success).toBe(true);
  });

  it("summary", () => {
    const r = summaryResponseSchema.safeParse({
      lastReading: { valueKwh: "5012.375", ts: TS },
      today: { kwh: "3.250", hasGaps: false },
      month: { kwh: "84.125", costCents: 3120, projectedMonthEndCents: 6240, previousMonthKwh: "80.000", deltaToPreviousMonthPct: 5.2 },
      split: { available: true, pvKwh: "40.000", gridKwh: "44.125", savingsCents: 480 },
      dataStatus: { lastReceivedAt: TS, hasOpenGaps: false, isPreliminary: true },
    });
    expect(r.success).toBe(true);
  });

  it("consumption query + response; ungültige resolution wird abgelehnt", () => {
    expect(consumptionQuerySchema.safeParse({ resolution: "day", from: TS, to: TS }).success).toBe(true);
    expect(consumptionQuerySchema.safeParse({ resolution: "minute", from: TS, to: TS }).success).toBe(false);
    const r = consumptionResponseSchema.safeParse({
      resolution: "day", from: TS, to: TS,
      points: [{ periodStart: TS, kwhTotal: "14.400", kwhPv: "4.800", kwhGrid: "9.600", costCents: 288, hasGaps: false, isPreliminary: false }],
      previousPeriodKwh: "13.000", deltaToPreviousPeriodPct: 10.8, avgPriceCentsPerKwh: 32.5, savingsCents: 48,
    });
    expect(r.success).toBe(true);
  });

  it("data-status", () => {
    const r = dataStatusResponseSchema.safeParse({
      lastReceivedAt: TS, openGaps: [{ firstAt: TS, lastAt: TS }], disturbance: false,
    });
    expect(r.success).toBe(true);
  });

  it("invoices (Liste mit Cursor) + Detail + Download + Contract", () => {
    expect(invoiceListResponseSchema.safeParse({
      items: [{ id: UUID, number: "RE-2026-0001", periodStart: TS, periodEnd: TS, totalCents: 4200, status: "ISSUED" }],
      nextCursor: null,
    }).success).toBe(true);
    expect(invoiceDetailResponseSchema.safeParse({
      id: UUID, number: "RE-2026-0001", periodStart: TS, periodEnd: TS, totalCents: 4200, status: "ISSUED", documentId: UUID,
    }).success).toBe(true);
    expect(documentDownloadResponseSchema.safeParse({
      url: "http://localhost:9000/ph360-documents/x?sig=1", expiresAt: TS, fileName: "RE-2026-0001.pdf", mimeType: "application/pdf",
    }).success).toBe(true);
    expect(contractResponseSchema.safeParse({
      contractNumber: "PM-2026-0001", status: "ACTIVE", startAt: TS, endAt: null,
      tariff: { name: "Powermieter Pilot", validFrom: TS, workPricePvCents: 27, workPriceGridCents: 39, basePriceCents: 995 },
    }).success).toBe(true);
  });

  it("settings + support + config", () => {
    expect(notificationPreferencesResponseSchema.safeParse({
      categories: [{ category: "INCIDENT", enabled: true, locked: true }],
    }).success).toBe(true);
    expect(notificationPreferencePutSchema.safeParse({ category: "BILLING", enabled: false }).success).toBe(true);
    expect(pushDeviceCreateSchema.safeParse({ expoPushToken: "ExponentPushToken[x]", platform: "ios", appVersion: "1.0.0" }).success).toBe(true);
    expect(pushDeviceCreateSchema.safeParse({ expoPushToken: "", platform: "web", appVersion: "1.0.0" }).success).toBe(false);
    expect(supportMessageCreateSchema.safeParse({ subject: "Frage", body: "Text", contextId: UUID }).success).toBe(true);
    expect(configResponseSchema.safeParse({
      minAppVersion: "1.0.0", privacyUrl: "https://powerhouse360.de/datenschutz",
      imprintUrl: "https://powerhouse360.de/impressum", features: { co2: false },
    }).success).toBe(true);
  });

  it("resolution-Enum deckt hour|day|week|month|year ab", () => {
    for (const r of ["hour", "day", "week", "month", "year"]) {
      expect(appResolutionSchema.safeParse(r).success).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm --filter @ph360/api-contracts test
```
Erwartet: FAIL — `./index.js` (in `src/app/`) existiert nicht.

- [ ] **Step 3: `common.ts` + `format.ts` implementieren**

`packages/api-contracts/src/app/common.ts`:

```ts
import { z } from "zod";

/** Energie: kWh als Dezimal-String mit exakt 3 Nachkommastellen (Spec §4.1). */
export const kwhStringSchema = z
  .string()
  .regex(/^-?\d+\.\d{3}$/, "kWh als Dezimal-String mit exakt 3 Nachkommastellen");

/** Zeiten: ISO 8601 UTC (Z-Suffix, Spec §4.1). */
export const isoUtcSchema = z.string().datetime();

/** Auflösungen des Consumption-Endpunkts (Spec §4.2, klein geschrieben im Wire-Format). */
export const appResolutionSchema = z.enum(["hour", "day", "week", "month", "year"]);
export type AppResolution = z.infer<typeof appResolutionSchema>;

/** Cursor-Pagination für Mengen-Endpunkte (Spec §4.1). */
export const cursorQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
```

`packages/api-contracts/src/app/format.ts`:

```ts
/**
 * kWh-Dezimal-String (max. 3 Nachkommastellen) ↔ ganzzahlige Milli-kWh.
 * Alle Energie-Arithmetik läuft über Ganzzahlen — keine Float-Rundungsfehler.
 * Wertebereich numeric(14,3) → max ±1e14 Milli-kWh, sicher unter Number.MAX_SAFE_INTEGER.
 */
export function kwhToMilli(kwh: string): number {
  const m = /^(-?)(\d+)(?:\.(\d{1,3}))?$/.exec(kwh.trim());
  if (!m) throw new Error(`Ungültiger kWh-Wert: ${kwh}`);
  const sign = m[1] === "-" ? -1 : 1;
  const whole = Number(m[2]);
  const frac = Number((m[3] ?? "0").padEnd(3, "0"));
  return sign * (whole * 1000 + frac);
}

export function milliToKwh(milli: number): string {
  if (!Number.isSafeInteger(milli)) throw new Error(`Ungültige Milli-kWh: ${milli}`);
  const sign = milli < 0 ? "-" : "";
  const abs = Math.abs(milli);
  return `${sign}${Math.floor(abs / 1000)}.${String(abs % 1000).padStart(3, "0")}`;
}

/** Prisma-Decimal-artige Werte (alles mit toFixed) → kWh-String mit 3 Nachkommastellen. */
export function toKwhString(value: { toFixed(digits: number): string }): string {
  return value.toFixed(3);
}
```

- [ ] **Step 4: `me.ts` + `consumption.ts` implementieren**

`packages/api-contracts/src/app/me.ts`:

```ts
import { z } from "zod";
import { isoUtcSchema } from "./common.js";

/** Ein Context = eine PowerParticipant-Teilnahme (D-07). Grundlage des Kontext-Umschalters. */
export const appContextSchema = z.object({
  id: z.string().uuid(),
  unitLabel: z.string(),
  buildingName: z.string(),
  contractNumber: z.string().nullable(),
  validFrom: isoUtcSchema,
  validTo: isoUtcSchema.nullable(),
  expired: z.boolean(),
});
export type AppContext = z.infer<typeof appContextSchema>;

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    locale: z.string(),
  }),
  contexts: z.array(appContextSchema),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
```

`packages/api-contracts/src/app/consumption.ts`:

```ts
import { z } from "zod";
import { appResolutionSchema, isoUtcSchema, kwhStringSchema } from "./common.js";

/** Dashboard-Aggregat (Spec §4.2 summary). Alle Werte aus ConsumptionAggregate/DeviceState — nie Rohdaten. */
export const summaryResponseSchema = z.object({
  lastReading: z.object({ valueKwh: kwhStringSchema, ts: isoUtcSchema }).nullable(),
  /**
   * Mittlere Wirkleistung über das letzte ABGESCHLOSSENE Messintervall —
   * ausdrücklich kein Momentanwert: bei 15-Minuten-Messung gibt es keinen.
   * `intervalMinutes` mitliefern, damit die App korrekt beschriften kann.
   * Ganzzahlig in Watt (keine Floats, analog zur kWh-Milli-Arithmetik).
   */
  recentPower: z
    .object({
      watts: z.number().int(),
      intervalEnd: isoUtcSchema,
      intervalMinutes: z.number().int().positive(),
    })
    .nullable(),
  today: z.object({
    kwh: kwhStringSchema,
    hasGaps: z.boolean(),
    /** Kosten des laufenden Tages; null, wenn kein Tarif hinterlegt ist. */
    costCents: z.number().int().nullable(),
    /** Tagesbezogene Aufteilung — nur bei splitCalculable, sonst null. */
    pvKwh: kwhStringSchema.nullable(),
    gridKwh: kwhStringSchema.nullable(),
  }),
  month: z.object({
    kwh: kwhStringSchema,
    costCents: z.number().int().nullable(),
    projectedMonthEndCents: z.number().int().nullable(),
    /** Vormonat, gleicher Zeitraumanteil (Tagesbasis). */
    previousMonthKwh: kwhStringSchema.nullable(),
    deltaToPreviousMonthPct: z.number().nullable(),
  }),
  /**
   * MONATSBEZOGENE Aufteilung (der Tageswert steht in `today`).
   * Nur wenn MeteringConcept.splitCalculable (R-A4) — sonst available=false
   * und null-Werte.
   */
  split: z.object({
    available: z.boolean(),
    pvKwh: kwhStringSchema.nullable(),
    gridKwh: kwhStringSchema.nullable(),
    savingsCents: z.number().int().nullable(),
  }),
  dataStatus: z.object({
    lastReceivedAt: isoUtcSchema.nullable(),
    hasOpenGaps: z.boolean(),
    isPreliminary: z.boolean(),
  }),
});
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

export const consumptionQuerySchema = z.object({
  resolution: appResolutionSchema,
  from: isoUtcSchema,
  to: isoUtcSchema,
});
export type ConsumptionQuery = z.infer<typeof consumptionQuerySchema>;

export const consumptionPointSchema = z.object({
  periodStart: isoUtcSchema,
  kwhTotal: kwhStringSchema,
  kwhPv: kwhStringSchema.nullable(),
  kwhGrid: kwhStringSchema.nullable(),
  costCents: z.number().int().nullable(),
  hasGaps: z.boolean(),
  isPreliminary: z.boolean(),
});
export type ConsumptionPoint = z.infer<typeof consumptionPointSchema>;

/** Zeitreihe (Spec §4.2). from/to sind die EFFEKTIVEN Grenzen nach Teilnahme-Zeitraumbeschnitt (§5.1). */
export const consumptionResponseSchema = z.object({
  resolution: appResolutionSchema,
  from: isoUtcSchema,
  to: isoUtcSchema,
  points: z.array(consumptionPointSchema),
  previousPeriodKwh: kwhStringSchema.nullable(),
  deltaToPreviousPeriodPct: z.number().nullable(),
  avgPriceCentsPerKwh: z.number().nullable(),
  savingsCents: z.number().int().nullable(),
});
export type ConsumptionResponse = z.infer<typeof consumptionResponseSchema>;

export const dataStatusResponseSchema = z.object({
  lastReceivedAt: isoUtcSchema.nullable(),
  openGaps: z.array(z.object({ firstAt: isoUtcSchema, lastAt: isoUtcSchema })),
  disturbance: z.boolean(),
});
export type DataStatusResponse = z.infer<typeof dataStatusResponseSchema>;
```

- [ ] **Step 5: `billing.ts` + `settings.ts` implementieren**

`packages/api-contracts/src/app/billing.ts`:

```ts
import { z } from "zod";
import { cursorQuerySchema, isoUtcSchema } from "./common.js";

export const invoiceStatusSchema = z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]);

export const invoiceSummarySchema = z.object({
  id: z.string().uuid(),
  number: z.string(),
  periodStart: isoUtcSchema,
  periodEnd: isoUtcSchema,
  totalCents: z.number().int(),
  status: invoiceStatusSchema,
});
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const invoiceListQuerySchema = cursorQuerySchema;
export const invoiceListResponseSchema = z.object({
  items: z.array(invoiceSummarySchema),
  nextCursor: z.string().uuid().nullable(),
});
export type InvoiceListResponse = z.infer<typeof invoiceListResponseSchema>;

export const invoiceDetailResponseSchema = invoiceSummarySchema.extend({
  documentId: z.string().uuid(),
});
export type InvoiceDetailResponse = z.infer<typeof invoiceDetailResponseSchema>;

/** Kurzlebige signierte MinIO-URL (Spec §3.3: Download nur über signierte URLs, auditiert). */
export const documentDownloadResponseSchema = z.object({
  url: z.string().url(),
  expiresAt: isoUtcSchema,
  fileName: z.string(),
  mimeType: z.string(),
});
export type DocumentDownloadResponse = z.infer<typeof documentDownloadResponseSchema>;

export const contractResponseSchema = z.object({
  contractNumber: z.string(),
  status: z.enum(["DRAFT", "ACTIVE", "ENDED", "CANCELLED"]),
  startAt: isoUtcSchema,
  endAt: isoUtcSchema.nullable(),
  tariff: z.object({
    name: z.string(),
    validFrom: isoUtcSchema,
    workPricePvCents: z.number().int(),
    workPriceGridCents: z.number().int(),
    basePriceCents: z.number().int(),
  }),
});
export type ContractResponse = z.infer<typeof contractResponseSchema>;
```

`packages/api-contracts/src/app/settings.ts`:

```ts
import { z } from "zod";

export const notificationCategorySchema = z.enum(["BILLING", "DATA_QUALITY", "INCIDENT", "SERVICE", "CONTRACT"]);
export type AppNotificationCategory = z.infer<typeof notificationCategorySchema>;

/** locked=true ⇒ Kategorie nicht abwählbar (INCIDENT, Priorität 3 — Spec §3.3). */
export const notificationPreferencesResponseSchema = z.object({
  categories: z.array(z.object({
    category: notificationCategorySchema,
    enabled: z.boolean(),
    locked: z.boolean(),
  })),
});
export type NotificationPreferencesResponse = z.infer<typeof notificationPreferencesResponseSchema>;

export const notificationPreferencePutSchema = z.object({
  category: notificationCategorySchema,
  enabled: z.boolean(),
});

export const pushDeviceCreateSchema = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  appVersion: z.string().min(1),
});
export const pushDeviceDeleteSchema = z.object({
  expoPushToken: z.string().min(1),
});

export const supportMessageCreateSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  /** Optionaler Teilnahme-Kontext — wird serverseitig gegen assertParticipantScope geprüft. */
  contextId: z.string().uuid().optional(),
});
export const supportMessageResponseSchema = z.object({ received: z.literal(true) });

/** Public-Konfiguration (dokumentierte Zugriffsklassen-Ausnahme, Spec §4.2). */
export const configResponseSchema = z.object({
  minAppVersion: z.string(),
  privacyUrl: z.string().url(),
  imprintUrl: z.string().url(),
  features: z.object({ co2: z.boolean() }),
});
export type ConfigResponse = z.infer<typeof configResponseSchema>;
```

- [ ] **Step 6: Re-Exporte verdrahten**

`packages/api-contracts/src/app/index.ts`:

```ts
export * from "./common.js";
export * from "./format.js";
export * from "./me.js";
export * from "./consumption.js";
export * from "./billing.js";
export * from "./settings.js";
```

In `packages/api-contracts/src/index.ts` am Ende anfügen:

```ts
export * from "./app/index.js";
```

- [ ] **Step 7: Test grün sehen + Typecheck**

```bash
pnpm --filter @ph360/api-contracts test
pnpm --filter @ph360/api-contracts exec tsc --noEmit
```
Erwartet: alle Contract-Tests PASS, Typecheck ohne Fehler.

- [ ] **Step 8: Commit**

```bash
git add packages/api-contracts
git commit -m "feat(contracts): alle /api/v1/app-Contracts als Zod-Schemas inkl. kWh-Milli-Helfer (Spec §4.2)"
```

---

## Task 4: `packages/testing` — Bewohner-/Mess-Factories + Session-Header-Helper

**Files:**
- Modify: `packages/testing/src/factories.ts`, `packages/testing/src/index.ts`
- Create: `packages/testing/src/auth-headers.ts`

Keine eigene Test-Datei (reine Test-Infrastruktur) — verifiziert durch Typecheck hier und die Integrationstests der Tasks 5, 7, 8, 10–14.

- [ ] **Step 1: Factories anfügen**

An `packages/testing/src/factories.ts` am Dateiende anfügen (Imports oben ergänzen: `import { randomUUID } from "node:crypto";` sowie `type ParticipantStatus, type ReadingQuality` in den bestehenden `@ph360/database`-Typ-Import aufnehmen):

```ts
// ---------------------------------------------------------------------------
// WP-APP-2: Bewohner-/Mess-Setups
// ---------------------------------------------------------------------------

/**
 * Kanonischer Kombi-Helfer (Festlegung: hier definiert): Property → Building
 * (inkl. Address) → Unit. Nutzt die WP-1.3-Factories aus dieser Datei.
 */
export async function createBuildingTree(input: { organizationId: string }) {
  const property = await createProperty(input.organizationId);
  const building = await createBuilding(property.id);
  const unit = await createUnit(building.id);
  return { property, building, unit };
}

/** User + Membership(RESIDENT) + PowerParticipant + Contract für eine bestehende Unit. */
export async function addParticipant(input: {
  organizationId: string;
  unitId: string;
  tariffVersionId: string;
  validFrom: Date;
  validTo?: Date | null;
  status?: ParticipantStatus;
}) {
  const { user, email, password } = await createUserWithMembership(input.organizationId, "RESIDENT");
  const participant = await prisma.powerParticipant.create({
    data: {
      organizationId: input.organizationId,
      userId: user.id,
      unitId: input.unitId,
      status: input.status ?? "ACTIVE",
      validFrom: input.validFrom,
      validTo: input.validTo ?? null,
    },
  });
  const contract = await prisma.contract.create({
    data: {
      organizationId: input.organizationId,
      contractNumber: `PM-T-${uniq()}`,
      participantId: participant.id,
      unitId: input.unitId,
      tariffVersionId: input.tariffVersionId,
      status: "ACTIVE",
      startAt: input.validFrom,
      endAt: input.validTo ?? null,
      issuingEntityId: randomUUID(),
    },
  });
  const updated = await prisma.powerParticipant.update({
    where: { id: participant.id },
    data: { contractId: contract.id },
  });
  return { user, email, password, participant: updated, contract };
}

/**
 * Komplettes Bewohner-Setup: Org → Gebäude → Unit → RESIDENT-User → Teilnahme →
 * Tarif/Vertrag → Hub → Meter → MeteringPoint(UNIT_CONSUMPTION) → DeviceAssignment.
 * `reuse` hängt weitere Bewohner an dasselbe Gebäude/denselben Hub (PV-Split-Tests).
 */
export async function createResidentSetup(opts: {
  validFrom?: Date;
  validTo?: Date | null;
  status?: ParticipantStatus;
  reuse?: { organizationId: string; buildingId: string; hubId: string; tariffVersionId: string };
} = {}) {
  const validFrom = opts.validFrom ?? new Date("2026-01-01T00:00:00.000Z");
  let organizationId: string;
  let buildingId: string;
  let hubId: string;
  let tariffVersionId: string;
  if (opts.reuse) {
    ({ organizationId, buildingId, hubId, tariffVersionId } = opts.reuse);
  } else {
    const organization = await createOrg();
    organizationId = organization.id;
    const tree = await createBuildingTree({ organizationId });
    buildingId = tree.building.id;
    const hub = await prisma.hub.create({
      data: { organizationId, serialNumber: `PH360-T-${uniq()}`, status: "ACTIVE" },
    });
    hubId = hub.id;
    const tariff = await prisma.tariff.create({ data: { organizationId, name: `Testtarif ${uniq()}` } });
    const tariffVersion = await prisma.tariffVersion.create({
      data: {
        tariffId: tariff.id,
        validFrom: new Date("2026-01-01T00:00:00.000Z"),
        workPricePvCents: 25,
        workPriceGridCents: 35,
        basePriceCents: 995,
      },
    });
    tariffVersionId = tariffVersion.id;
  }
  const unit = await prisma.unit.create({ data: { buildingId, label: `WE-${uniq()}` } });
  const resident = await addParticipant({
    organizationId, unitId: unit.id, tariffVersionId, validFrom,
    validTo: opts.validTo ?? null, status: opts.status,
  });
  const meter = await prisma.meter.create({
    data: { organizationId, manufacturer: "EMH", model: "ED300L", serialNumber: `T-${uniq()}` },
  });
  const meteringPoint = await prisma.meteringPoint.create({
    data: { organizationId, buildingId, unitId: unit.id, pointType: "UNIT_CONSUMPTION" },
  });
  const assignment = await prisma.deviceAssignment.create({
    data: {
      organizationId, meterId: meter.id, meteringPointId: meteringPoint.id,
      hubId, channelRef: `devEUI:${uniq()}:1`, validFrom,
    },
  });
  return {
    organizationId, buildingId, hubId, tariffVersionId, unit,
    ...resident, meter, meteringPoint, assignment,
  };
}

/** PV-Erzeugungs-Messstelle + MeteringConcept(splitCalculable) für ein bestehendes Gebäude. */
export async function createPvSetup(base: { organizationId: string; buildingId: string; hubId: string }) {
  await prisma.meteringConcept.upsert({
    where: { buildingId: base.buildingId },
    update: { splitCalculable: true },
    create: { organizationId: base.organizationId, buildingId: base.buildingId, splitCalculable: true },
  });
  const meter = await prisma.meter.create({
    data: { organizationId: base.organizationId, manufacturer: "SMA", model: "PV-M1", serialNumber: `PV-${uniq()}` },
  });
  const meteringPoint = await prisma.meteringPoint.create({
    data: { organizationId: base.organizationId, buildingId: base.buildingId, pointType: "PV_GENERATION" },
  });
  const assignment = await prisma.deviceAssignment.create({
    data: {
      organizationId: base.organizationId, meterId: meter.id, meteringPointId: meteringPoint.id,
      hubId: base.hubId, channelRef: `devEUI:${uniq()}:2`, validFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  return { meter, meteringPoint, assignment };
}

/** Schreibt eine REGISTER-Serie als IngestBatch + DeviceReadings (Default-Qualität VALIDATED). */
export async function writeRegisterSeries(input: {
  hubId: string;
  meterId: string;
  assignmentId: string;
  points: { ts: Date; valueKwh: string }[];
  quality?: ReadingQuality;
}) {
  const batch = await prisma.ingestBatch.create({
    data: {
      hubId: input.hubId,
      batchId: randomUUID(),
      payloadHash: randomUUID(),
      responseJson: {},
      acceptedCount: input.points.length,
      duplicateCount: 0,
      rejectedCount: 0,
    },
  });
  await prisma.deviceReading.createMany({
    data: input.points.map((p) => ({
      meterId: input.meterId,
      assignmentId: input.assignmentId,
      ts: p.ts,
      kind: "REGISTER" as const,
      value: p.valueKwh,
      quality: input.quality ?? ("VALIDATED" as const),
      receivedAt: p.ts,
      late: false,
      batchId: batch.id,
    })),
  });
  return { batch };
}
```

- [ ] **Step 2: Session-Header-Helper**

`packages/testing/src/auth-headers.ts`:

```ts
import { auth } from "@ph360/auth";

/**
 * Echte better-auth-Session für Routen-Integrationstests: signInEmail als Response,
 * Set-Cookie → Cookie-Header für nachfolgende Route-Handler-Aufrufe.
 */
export async function signInHeaders(email: string, password: string): Promise<Headers> {
  const res = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("signInEmail lieferte kein Set-Cookie");
  const cookie = setCookie
    .split(",")
    .map((part) => part.split(";")[0]!.trim())
    .filter((part) => part.includes("="))
    .join("; ");
  return new Headers({ cookie });
}
```

`packages/testing/src/index.ts` — Export ergänzen:

```ts
export { signInHeaders } from "./auth-headers.js";
```

- [ ] **Step 3: Typecheck + Commit**

```bash
pnpm install
pnpm --filter @ph360/testing exec tsc --noEmit
git add packages/testing
git commit -m "test(testing): Bewohner-/PV-/Messreihen-Factories + signInHeaders für App-Routen-Tests"
```
Erwartet: Typecheck ohne Fehler (setzt Task-1-Migration und generierten Client voraus).

---

## Task 5: `packages/auth` — `assertParticipantScope` + `clampToScope` (TDD)

**Files:**
- Create: `packages/auth/src/participant-scope.ts`
- Modify: `packages/auth/src/index.ts`
- Test: `packages/auth/src/participant-scope.itest.ts`

- [ ] **Step 1: Fehlschlagenden Integrationstest schreiben**

`packages/auth/src/participant-scope.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createResidentSetup } from "@ph360/testing";
import { assertParticipantScope, clampToScope } from "./participant-scope.js";
import { AuthnError, AuthzError } from "./guard.js";
import type { AuthContext } from "./context.js";

function ctxOf(userId: string, organizationId: string): AuthContext {
  return {
    userId,
    email: "x@example.test",
    name: "x",
    memberships: [{ organizationId, role: "RESIDENT" }],
  };
}

describe("assertParticipantScope (Spec §5.1/§5.4)", () => {
  it("liefert den Scope für die eigene Teilnahme", async () => {
    const a = await createResidentSetup();
    const scope = await assertParticipantScope(ctxOf(a.user.id, a.organizationId), a.participant.id);
    expect(scope.participantId).toBe(a.participant.id);
    expect(scope.unitId).toBe(a.unit.id);
    expect(scope.buildingId).toBe(a.buildingId);
    expect(scope.organizationId).toBe(a.organizationId);
    expect(scope.expired).toBe(false);
  });

  it("wirft AuthzError für fremde Teilnahme (Bewohner A sieht niemals Unit B)", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    await expect(
      assertParticipantScope(ctxOf(a.user.id, a.organizationId), b.participant.id),
    ).rejects.toBeInstanceOf(AuthzError);
  });

  it("wirft AuthzError für unbekannte Teilnahme-ID (kein ID-Probing via 404)", async () => {
    const a = await createResidentSetup();
    await expect(
      assertParticipantScope(ctxOf(a.user.id, a.organizationId), "018c2f7e-0000-4000-8000-00000000dead"),
    ).rejects.toBeInstanceOf(AuthzError);
  });

  it("wirft AuthnError ohne Context", async () => {
    await expect(assertParticipantScope(null, "018c2f7e-0000-4000-8000-000000000001")).rejects.toBeInstanceOf(AuthnError);
  });

  it("beendete Teilnahme bleibt lesbar und ist als expired markiert (DSGVO-Auskunft, §5.1)", async () => {
    const a = await createResidentSetup({
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: new Date("2026-03-31T23:59:59.000Z"),
      status: "ENDED",
    });
    const scope = await assertParticipantScope(ctxOf(a.user.id, a.organizationId), a.participant.id);
    expect(scope.expired).toBe(true);
    expect(scope.validTo?.toISOString()).toBe("2026-03-31T23:59:59.000Z");
  });
});

describe("clampToScope — Zeitraumbeschnitt [validFrom, validTo]", () => {
  const scope = {
    validFrom: new Date("2026-02-01T00:00:00.000Z"),
    validTo: new Date("2026-05-01T00:00:00.000Z"),
  };

  it("beschneidet from und to auf den Teilnahmezeitraum", () => {
    const r = clampToScope(scope, new Date("2026-01-01T00:00:00.000Z"), new Date("2026-12-31T00:00:00.000Z"));
    expect(r?.from.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(r?.to.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("liefert null bei leerem Schnitt (Anfrage komplett außerhalb ⇒ leer, §5.4)", () => {
    expect(clampToScope(scope, new Date("2026-06-01T00:00:00.000Z"), new Date("2026-07-01T00:00:00.000Z"))).toBeNull();
    expect(clampToScope(scope, new Date("2025-01-01T00:00:00.000Z"), new Date("2026-01-31T00:00:00.000Z"))).toBeNull();
  });

  it("validTo=null bedeutet unbegrenzt", () => {
    const open = { validFrom: new Date("2026-02-01T00:00:00.000Z"), validTo: null };
    const r = clampToScope(open, new Date("2026-01-01T00:00:00.000Z"), new Date("2027-01-01T00:00:00.000Z"));
    expect(r?.to.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm test:integration -- packages/auth/src/participant-scope.itest.ts
```
Erwartet: FAIL — `./participant-scope.js` existiert nicht.

- [ ] **Step 3: Implementieren**

`packages/auth/src/participant-scope.ts`:

```ts
import { prisma } from "@ph360/database";
import { AuthnError, AuthzError } from "./guard.js";
import type { AuthContext } from "./context.js";

export interface ParticipantScope {
  participantId: string;
  organizationId: string;
  unitId: string;
  buildingId: string;
  userId: string;
  validFrom: Date;
  validTo: Date | null;
  expired: boolean;
}

/**
 * Teilnahme-Scope (Spec §5.1, D-07): prüft, dass der Kontext (PowerParticipant)
 * dem eingeloggten User gehört. Beendete Teilnahmen bleiben lesbar (expired-Flag);
 * fremde UND unbekannte Kontexte werfen einheitlich AuthzError (403 — kein ID-Probing).
 */
export async function assertParticipantScope(
  ctx: AuthContext | null,
  participantId: string,
): Promise<ParticipantScope> {
  if (!ctx) throw new AuthnError();
  const participant = await prisma.powerParticipant.findUnique({
    where: { id: participantId },
    include: { unit: { select: { buildingId: true } } },
  });
  if (!participant || participant.userId !== ctx.userId) {
    throw new AuthzError("Outside participant scope");
  }
  const now = new Date();
  return {
    participantId: participant.id,
    organizationId: participant.organizationId,
    unitId: participant.unitId,
    buildingId: participant.unit.buildingId,
    userId: ctx.userId,
    validFrom: participant.validFrom,
    validTo: participant.validTo,
    expired: participant.status === "ENDED" || (participant.validTo !== null && participant.validTo < now),
  };
}

/**
 * Zeitraumbeschnitt (Spec §5.1): schneidet [from, to] auf [validFrom, validTo] der
 * Teilnahme. null ⇒ leerer Schnitt — die Route liefert dann leere Daten (403/leer, §5.4).
 * Der Nachmieter einer Unit sieht so strukturell nie die Historie des Vormieters.
 */
export function clampToScope(
  scope: Pick<ParticipantScope, "validFrom" | "validTo">,
  from: Date,
  to: Date,
): { from: Date; to: Date } | null {
  const f = from < scope.validFrom ? scope.validFrom : from;
  const t = scope.validTo !== null && to > scope.validTo ? scope.validTo : to;
  if (f.getTime() >= t.getTime()) return null;
  return { from: f, to: t };
}
```

In `packages/auth/src/index.ts` am Ende anfügen:

```ts
export * from "./participant-scope.js";
```

- [ ] **Step 4: Test grün sehen**

```bash
pnpm test:integration -- packages/auth/src/participant-scope.itest.ts
```
Erwartet: alle 8 Tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/auth
git commit -m "feat(auth): assertParticipantScope + clampToScope — Teilnahme-Scope mit Zeitraumbeschnitt (Spec §5.1)"
```

---

## Task 6: Worker — reine Aggregationsfunktionen (Delta, Bucketing, Allocation, Kosten) (TDD)

**Files:**
- Create: `apps/worker/src/aggregation/decimal.ts`, `derive-deltas.ts`, `buckets.ts`, `allocation.ts`, `cost.ts`
- Test: `apps/worker/src/aggregation/derive-deltas.test.ts`, `buckets.test.ts`, `allocation.test.ts`, `cost.test.ts`
- Modify: `apps/worker/package.json` (dep `@ph360/api-contracts`), ggf. Root-`vitest.config.ts`

- [ ] **Step 1: Worker-Abhängigkeit + Unit-Test-Include prüfen**

In `apps/worker/package.json` unter `dependencies` ergänzen: `"@ph360/api-contracts": "workspace:*"`. Danach `pnpm install`.

Root-`vitest.config.ts` prüfen: Das `unit`-Projekt muss `apps/**/src/**/*.test.ts` einschließen (WP-APP-1-Vorbedingung). Falls der Include enger ist, auf exakt dieses Muster erweitern:
```ts
include: ["packages/**/src/**/*.{test,spec}.ts", "apps/**/src/**/*.{test,spec}.ts"],
```

- [ ] **Step 2: Fehlschlagende Tests für Delta-Ableitung + Buckets schreiben**

`apps/worker/src/aggregation/derive-deltas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveDeltas, INTERVAL_MS, type RegisterPoint } from "./derive-deltas.js";

const T0 = Date.parse("2026-06-10T00:00:00.000Z");
const reg = (i: number, valueMilli: number, meterId = "m1", quality: RegisterPoint["quality"] = "VALIDATED"): RegisterPoint => ({
  ts: new Date(T0 + i * INTERVAL_MS), meterId, valueMilli, quality,
});

describe("deriveDeltas — serverseitige Delta-Ableitung (ADR-009 §5.5)", () => {
  it("bildet Deltas aus aufeinanderfolgenden 15-min-Registern", () => {
    const out = deriveDeltas([reg(0, 1000000), reg(1, 1000150), reg(2, 1000450)]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ valueMilli: 150, raw: false });
    expect(out[0]!.ts.toISOString()).toBe("2026-06-10T00:15:00.000Z");
    expect(out[1]!.valueMilli).toBe(300);
  });

  it("Lücke (> 15 min Abstand) ⇒ KEIN Delta für das fehlende Intervall", () => {
    const out = deriveDeltas([reg(0, 1000000), reg(1, 1000150), reg(3, 1000500)]);
    expect(out).toHaveLength(1);
    expect(out[0]!.valueMilli).toBe(150);
  });

  it("MeterChange-Formel: Endstand_alt − letzter_Stand + neuer_Stand − Anfangsstand_neu", () => {
    const out = deriveDeltas(
      [reg(0, 5000000, "alt"), reg(1, 100250, "neu")],
      [{ changedAt: new Date(T0 + 7 * 60 * 1000), meterOldId: "alt", meterNewId: "neu", endValueOldMilli: 5001000, startValueNewMilli: 100000 }],
    );
    expect(out).toHaveLength(1);
    // 5001000 − 5000000 + 100250 − 100000 = 1250
    expect(out[0]!.valueMilli).toBe(1250);
  });

  it("Meterwechsel OHNE dokumentierten MeterChange ⇒ kein Delta (Lücke statt Fantasiewert)", () => {
    const out = deriveDeltas([reg(0, 5000000, "alt"), reg(1, 100250, "neu")]);
    expect(out).toHaveLength(0);
  });

  it("RAW-Beteiligung markiert das Delta als raw (fließt in isPreliminary)", () => {
    const out = deriveDeltas([reg(0, 1000000, "m1", "RAW"), reg(1, 1000150)]);
    expect(out[0]!.raw).toBe(true);
  });
});
```

`apps/worker/src/aggregation/buckets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { bucketStart, nextBucketStart, intervalStart } from "./buckets.js";

describe("buckets — DST-sicheres Bucketing via UTC (§9: DST-Wechsel)", () => {
  it("Intervallende 00:00 gehört zum VORTAG (ts = Intervallende)", () => {
    const start = intervalStart(new Date("2026-06-11T00:00:00.000Z"));
    expect(bucketStart(start, "DAY").toISOString()).toBe("2026-06-10T00:00:00.000Z");
    expect(bucketStart(start, "HOUR").toISOString()).toBe("2026-06-10T23:00:00.000Z");
  });

  it("WEEK beginnt am UTC-Montag; MONTH/YEAR am Monats-/Jahresanfang", () => {
    const d = intervalStart(new Date("2026-07-22T10:15:00.000Z")); // Mittwoch
    expect(bucketStart(d, "WEEK").toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(bucketStart(d, "MONTH").toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(bucketStart(d, "YEAR").toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("europäischer DST-Wechseltag (2026-03-29) hat in UTC exakt 96 Intervalle — kein Sonderfall", () => {
    const dayStart = new Date("2026-03-29T00:00:00.000Z");
    const dayEnd = nextBucketStart(dayStart, "DAY");
    expect((dayEnd.getTime() - dayStart.getTime()) / (15 * 60 * 1000)).toBe(96);
  });

  it("nextBucketStart über Monats-/Jahresgrenzen", () => {
    expect(nextBucketStart(new Date("2026-12-01T00:00:00.000Z"), "MONTH").toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(nextBucketStart(new Date("2026-01-01T00:00:00.000Z"), "YEAR").toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
```

Rot sehen:
```bash
pnpm test:unit -- apps/worker/src/aggregation
```
Erwartet: FAIL — Module existieren nicht.

- [ ] **Step 3: `decimal.ts`, `derive-deltas.ts`, `buckets.ts` implementieren**

`apps/worker/src/aggregation/decimal.ts`:

```ts
import { kwhToMilli } from "@ph360/api-contracts";

/** Prisma-Decimal (numeric 14,3) → ganzzahlige Milli-kWh, verlustfrei über toFixed(3). */
export function decimalToMilli(value: { toFixed(digits: number): string }): number {
  return kwhToMilli(value.toFixed(3));
}
```

`apps/worker/src/aggregation/derive-deltas.ts`:

```ts
export const INTERVAL_MS = 15 * 60 * 1000;

export interface RegisterPoint {
  ts: Date; // Intervallende, UTC
  meterId: string;
  valueMilli: number;
  quality: "RAW" | "VALIDATED" | "SUBSTITUTE" | "ESTIMATED" | "CORRECTED";
}

export interface MeterChangeInfo {
  changedAt: Date;
  meterOldId: string;
  meterNewId: string;
  endValueOldMilli: number;
  startValueNewMilli: number;
}

export interface IntervalDelta {
  ts: Date; // Intervallende
  valueMilli: number;
  raw: boolean;
}

/**
 * Serverseitige Delta-Ableitung (ADR-009 §5.5) aus Registerständen EINER Messstelle,
 * aufsteigend nach ts. Regeln:
 * - exakt 15 min Abstand ⇒ Delta = curr − prev
 * - Lücke (> 15 min) ⇒ KEIN Delta (hasGaps entsteht im Bucketing)
 * - Zählerwechsel mit MeterChange ⇒ Delta = Endstand_alt − letzter_Stand + neuer_Stand − Anfangsstand_neu
 * - Zählerwechsel ohne MeterChange ⇒ kein Delta (nie raten)
 * - negatives Delta bei gleichem Meter ⇒ kein Delta (non-monotonic wird beim Ingest rejected;
 *   defensiv gegen SUBSTITUTE/CORRECTED-Ketten)
 */
export function deriveDeltas(registers: RegisterPoint[], meterChanges: MeterChangeInfo[] = []): IntervalDelta[] {
  const out: IntervalDelta[] = [];
  for (let i = 1; i < registers.length; i++) {
    const prev = registers[i - 1]!;
    const curr = registers[i]!;
    if (curr.ts.getTime() - prev.ts.getTime() !== INTERVAL_MS) continue;
    const raw = prev.quality === "RAW" || curr.quality === "RAW";
    if (prev.meterId === curr.meterId) {
      const delta = curr.valueMilli - prev.valueMilli;
      if (delta >= 0) out.push({ ts: curr.ts, valueMilli: delta, raw });
      continue;
    }
    const change = meterChanges.find((c) => c.meterOldId === prev.meterId && c.meterNewId === curr.meterId);
    if (!change) continue;
    out.push({
      ts: curr.ts,
      valueMilli: change.endValueOldMilli - prev.valueMilli + curr.valueMilli - change.startValueNewMilli,
      raw,
    });
  }
  return out;
}
```

`apps/worker/src/aggregation/buckets.ts`:

```ts
import { INTERVAL_MS } from "./derive-deltas.js";

export type BucketResolution = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

/** ts ist das Intervallende — das Intervall (ts−15min, ts] gehört zum Bucket seines ANFANGS. */
export function intervalStart(tsEnd: Date): Date {
  return new Date(tsEnd.getTime() - INTERVAL_MS);
}

/**
 * Bucket-Anfang in UTC. DST-sicher, weil ausschließlich UTC gerechnet wird:
 * jeder UTC-Tag hat exakt 96 Intervalle (auch am europäischen DST-Wechseltag);
 * lokale Darstellung ist Sache des Clients.
 */
export function bucketStart(instant: Date, resolution: BucketResolution): Date {
  const y = instant.getUTCFullYear();
  const m = instant.getUTCMonth();
  const d = instant.getUTCDate();
  switch (resolution) {
    case "HOUR":
      return new Date(Date.UTC(y, m, d, instant.getUTCHours()));
    case "DAY":
      return new Date(Date.UTC(y, m, d));
    case "WEEK": {
      const day = new Date(Date.UTC(y, m, d));
      const sinceMonday = (day.getUTCDay() + 6) % 7;
      return new Date(day.getTime() - sinceMonday * 86_400_000);
    }
    case "MONTH":
      return new Date(Date.UTC(y, m, 1));
    case "YEAR":
      return new Date(Date.UTC(y, 0, 1));
  }
}

export function nextBucketStart(start: Date, resolution: BucketResolution): Date {
  switch (resolution) {
    case "HOUR":
      return new Date(start.getTime() + 3_600_000);
    case "DAY":
      return new Date(start.getTime() + 86_400_000);
    case "WEEK":
      return new Date(start.getTime() + 7 * 86_400_000);
    case "MONTH":
      return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    case "YEAR":
      return new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
  }
}
```

Grün sehen:
```bash
pnpm test:unit -- apps/worker/src/aggregation
```
Erwartet: `derive-deltas.test.ts` + `buckets.test.ts` PASS.

- [ ] **Step 4: Fehlschlagende Tests für Allocation + Kosten schreiben**

`apps/worker/src/aggregation/allocation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { allocatePv } from "./allocation.js";

describe("allocatePv — proportionale PV-Zuteilung je 15-min-Intervall", () => {
  it("teilt PV proportional zum Verbrauch zu, Rest ist Netz", () => {
    const out = allocatePv({
      pvMilli: 200,
      consumers: [
        { key: "a", consumptionMilli: 100 },
        { key: "b", consumptionMilli: 300 },
      ],
    });
    expect(out).toEqual([
      { key: "a", pvMilli: 50, gridMilli: 50 },
      { key: "b", pvMilli: 150, gridMilli: 150 },
    ]);
  });

  it("PV-Überschuss: Zuteilung nie über den Eigenverbrauch hinaus", () => {
    const out = allocatePv({ pvMilli: 10_000, consumers: [{ key: "a", consumptionMilli: 400 }] });
    expect(out).toEqual([{ key: "a", pvMilli: 400, gridMilli: 0 }]);
  });

  it("Rundungsreste werden deterministisch verteilt — Summe bleibt exakt", () => {
    const out = allocatePv({
      pvMilli: 100,
      consumers: [
        { key: "a", consumptionMilli: 100 },
        { key: "b", consumptionMilli: 100 },
        { key: "c", consumptionMilli: 100 },
      ],
    });
    const pvSum = out.reduce((s, o) => s + o.pvMilli, 0);
    expect(pvSum).toBe(100);
    for (const o of out) expect(o.pvMilli + o.gridMilli).toBe(100);
  });

  it("keine PV / kein Verbrauch ⇒ alles Netz bzw. leer", () => {
    expect(allocatePv({ pvMilli: 0, consumers: [{ key: "a", consumptionMilli: 100 }] }))
      .toEqual([{ key: "a", pvMilli: 0, gridMilli: 100 }]);
    expect(allocatePv({ pvMilli: 100, consumers: [] })).toEqual([]);
  });
});
```

`apps/worker/src/aggregation/cost.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { costCentsSplit, costCentsFlat, savingsCents } from "./cost.js";

const prices = { workPricePvCents: 25, workPriceGridCents: 35 };

describe("cost — Arbeitspreis-Kosten + Mieterstrom-Ersparnis (Integer-Cent)", () => {
  it("Split-Kosten: pv×PV-Preis + grid×Netz-Preis, kaufmännisch gerundet", () => {
    // 4.800 kWh × 25 + 4.800 kWh × 35 = 120 + 168 = 288 Cent
    expect(costCentsSplit(prices, 4800, 4800)).toBe(288);
  });

  it("Flat-Kosten ohne Split: alles zum Netz-Arbeitspreis", () => {
    // 9.600 kWh × 35 = 336 Cent
    expect(costCentsFlat(prices, 9600)).toBe(336);
  });

  it("Ersparnis = PV-Anteil × (Netzpreis − PV-Preis), nie negativ", () => {
    expect(savingsCents(prices, 4800)).toBe(48);
    expect(savingsCents({ workPricePvCents: 40, workPriceGridCents: 35 }, 4800)).toBe(0);
  });
});
```

Rot sehen:
```bash
pnpm test:unit -- apps/worker/src/aggregation
```
Erwartet: FAIL — `allocation.js`/`cost.js` fehlen.

- [ ] **Step 5: `allocation.ts` + `cost.ts` implementieren**

`apps/worker/src/aggregation/allocation.ts`:

```ts
export interface AllocationInput {
  pvMilli: number;
  consumers: { key: string; consumptionMilli: number }[];
}

export interface AllocationShare {
  key: string;
  pvMilli: number;
  gridMilli: number;
}

/**
 * Proportionale PV-Zuteilung je 15-min-Intervall (Spec §3.3 EnergyAllocation):
 * Zuteilung proportional zum Verbrauch, nie über den Eigenverbrauch hinaus;
 * Rest ist Netzbezug. Ganzzahlig und deterministisch (Rundungsreste in
 * Consumer-Reihenfolge aufgefüllt) — Neuberechnung ergibt identische Werte.
 */
export function allocatePv({ pvMilli, consumers }: AllocationInput): AllocationShare[] {
  const total = consumers.reduce((s, c) => s + c.consumptionMilli, 0);
  if (total <= 0 || pvMilli <= 0) {
    return consumers.map((c) => ({ key: c.key, pvMilli: 0, gridMilli: Math.max(0, c.consumptionMilli) }));
  }
  const available = Math.min(pvMilli, total);
  let assigned = 0;
  const shares = consumers.map((c) => {
    const share = Math.floor((available * c.consumptionMilli) / total);
    assigned += share;
    return { key: c.key, pvMilli: share, gridMilli: c.consumptionMilli - share };
  });
  let rest = available - assigned;
  for (const s of shares) {
    if (rest === 0) break;
    const add = Math.min(s.gridMilli, rest);
    s.pvMilli += add;
    s.gridMilli -= add;
    rest -= add;
  }
  return shares;
}
```

`apps/worker/src/aggregation/cost.ts`:

```ts
export interface TariffPrices {
  workPricePvCents: number;
  workPriceGridCents: number;
}

/** Kosten bei berechenbarem PV/Netz-Split (Milli-kWh × Cent/kWh ÷ 1000, gerundet). */
export function costCentsSplit(prices: TariffPrices, pvMilli: number, gridMilli: number): number {
  return Math.round((pvMilli * prices.workPricePvCents + gridMilli * prices.workPriceGridCents) / 1000);
}

/** Kosten ohne Split: konservativ alles zum Netz-Arbeitspreis. */
export function costCentsFlat(prices: TariffPrices, totalMilli: number): number {
  return Math.round((totalMilli * prices.workPriceGridCents) / 1000);
}

/** Mieterstrom-Ersparnis: PV-Anteil × Preisdifferenz; nie negativ. */
export function savingsCents(prices: TariffPrices, pvMilli: number): number {
  return Math.max(0, Math.round((pvMilli * (prices.workPriceGridCents - prices.workPricePvCents)) / 1000));
}
```

- [ ] **Step 6: Alles grün + Commit**

```bash
pnpm test:unit -- apps/worker/src/aggregation
git add apps/worker/src/aggregation apps/worker/package.json vitest.config.ts pnpm-lock.yaml
git commit -m "feat(worker): reine Aggregationsfunktionen — Delta-Ableitung inkl. MeterChange, UTC-Buckets, PV-Allocation, Kosten (TDD)"
```
Erwartet: 4 Test-Dateien, alle PASS.

---

## Task 7: Worker — `recompute.ts` (DB-Orchestrierung) + Handler-Verdrahtung (TDD)

**Files:**
- Create: `apps/worker/src/aggregation/recompute.ts`
- Modify: `apps/worker/src/index.ts`, `apps/worker/package.json` (devDeps `@ph360/testing`, `@ph360/hub-simulator`)
- Test: `apps/worker/src/aggregation/recompute.itest.ts`

- [ ] **Step 1: Fehlschlagenden Integrationstest schreiben**

`apps/worker/src/aggregation/recompute.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { createResidentSetup, createPvSetup, writeRegisterSeries } from "@ph360/testing";
import { recomputeForBatch } from "./recompute.js";
import { INTERVAL_MS } from "./derive-deltas.js";

const DAY = new Date("2026-06-10T00:00:00.000Z"); // Vergangenheit ⇒ isPreliminary kann false werden
const kwh = (milli: number) => `${Math.floor(milli / 1000)}.${String(milli % 1000).padStart(3, "0")}`;

/** 97 Registerstände (Tagesanfang bis Tagesende), Schrittweite stepMilli, Lücken via skip. */
function series(startMilli: number, stepMilli: number, skip: number[] = []) {
  const points: { ts: Date; valueKwh: string }[] = [];
  for (let i = 0; i <= 96; i++) {
    if (skip.includes(i)) continue;
    points.push({ ts: new Date(DAY.getTime() + i * INTERVAL_MS), valueKwh: kwh(startMilli + i * stepMilli) });
  }
  return points;
}

async function aggregate(meteringPointId: string, resolution: "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR", periodStart: Date) {
  return prisma.consumptionAggregate.findUnique({
    where: { meteringPointId_resolution_periodStart: { meteringPointId, resolution, periodStart } },
  });
}

describe("recomputeForBatch — Readings → Deltas → Aggregate (idempotent)", () => {
  it("berechnet HOUR/DAY/WEEK/MONTH/YEAR-Aggregate und ist idempotent", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    const { batch } = await writeRegisterSeries({
      hubId: s.hubId, meterId: s.meter.id, assignmentId: s.assignment.id,
      points: series(1_000_000, 150), // 0,150 kWh je Intervall ⇒ 14,400 kWh/Tag
    });
    await recomputeForBatch({ hubId: s.hubId, batchId: batch.batchId });

    const hour0 = await aggregate(s.meteringPoint.id, "HOUR", DAY);
    expect(hour0?.kwhTotal.toFixed(3)).toBe("0.600");
    expect(hour0?.hasGaps).toBe(false);
    expect(hour0?.isPreliminary).toBe(false); // Vergangenheit + lückenlos + VALIDATED

    const day = await aggregate(s.meteringPoint.id, "DAY", DAY);
    expect(day?.kwhTotal.toFixed(3)).toBe("14.400");
    expect(day?.costCents).toBe(504); // 14,400 kWh × 35 Cent (kein Split)
    expect(day?.kwhPv).toBeNull();

    const month = await aggregate(s.meteringPoint.id, "MONTH", new Date("2026-06-01T00:00:00.000Z"));
    expect(month?.kwhTotal.toFixed(3)).toBe("14.400");
    expect(month?.isPreliminary).toBe(true); // Monat hat nicht alle Tage ⇒ vorläufig

    const before = await prisma.consumptionAggregate.count();
    await recomputeForBatch({ hubId: s.hubId, batchId: batch.batchId }); // Wiederholung
    expect(await prisma.consumptionAggregate.count()).toBe(before);
    expect((await aggregate(s.meteringPoint.id, "DAY", DAY))?.kwhTotal.toFixed(3)).toBe("14.400");
  });

  it("Lücke (8 fehlende Intervalle) ⇒ hasGaps auf Stunde und Tag, kein erfundenes Delta", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    const { batch } = await writeRegisterSeries({
      hubId: s.hubId, meterId: s.meter.id, assignmentId: s.assignment.id,
      points: series(1_000_000, 150, [20, 21, 22, 23, 24, 25, 26, 27]), // Intervalle 05:00–07:00 fehlen
    });
    await recomputeForBatch({ hubId: s.hubId, batchId: batch.batchId });

    const hour5 = await aggregate(s.meteringPoint.id, "HOUR", new Date("2026-06-10T05:00:00.000Z"));
    expect(hour5?.hasGaps).toBe(true);
    expect(hour5?.isPreliminary).toBe(true);

    const day = await aggregate(s.meteringPoint.id, "DAY", DAY);
    expect(day?.hasGaps).toBe(true);
    // 9 fehlende Deltas (Intervalle 20–28 haben keinen Vorgänger/Wert): 96−9 = 87 × 0,150 = 13,050
    expect(day?.kwhTotal.toFixed(3)).toBe("13.050");
  });

  it("PV-Split: EnergyAllocation je Teilnehmer + kwhPv/kwhGrid/costCents auf dem Aggregat", async () => {
    const a = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    const b = await createResidentSetup({
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      reuse: { organizationId: a.organizationId, buildingId: a.buildingId, hubId: a.hubId, tariffVersionId: a.tariffVersionId },
    });
    const pv = await createPvSetup({ organizationId: a.organizationId, buildingId: a.buildingId, hubId: a.hubId });

    await writeRegisterSeries({ hubId: a.hubId, meterId: a.meter.id, assignmentId: a.assignment.id, points: series(1_000_000, 100) });
    await writeRegisterSeries({ hubId: a.hubId, meterId: b.meter.id, assignmentId: b.assignment.id, points: series(2_000_000, 300) });
    const { batch } = await writeRegisterSeries({ hubId: a.hubId, meterId: pv.meter.id, assignmentId: pv.assignment.id, points: series(0, 200) });
    await recomputeForBatch({ hubId: a.hubId, batchId: batch.batchId });

    // Je Intervall: PV 200, Verbrauch a=100/b=300 ⇒ a bekommt 50, b bekommt 150
    const allocA = await prisma.energyAllocation.findMany({ where: { participantId: a.participant.id } });
    expect(allocA).toHaveLength(96);
    expect(allocA[0]!.pvKwh.toFixed(3)).toBe("0.050");
    expect(allocA[0]!.gridKwh.toFixed(3)).toBe("0.050");

    const dayA = await aggregate(a.meteringPoint.id, "DAY", DAY);
    expect(dayA?.kwhTotal.toFixed(3)).toBe("9.600");
    expect(dayA?.kwhPv?.toFixed(3)).toBe("4.800");
    expect(dayA?.kwhGrid?.toFixed(3)).toBe("4.800");
    expect(dayA?.costCents).toBe(288); // 4,8×25 + 4,8×35

    const dayB = await aggregate(b.meteringPoint.id, "DAY", DAY);
    expect(dayB?.kwhPv?.toFixed(3)).toBe("14.400"); // 150 Milli × 96
  });
});
```

- [ ] **Step 2: Test rot sehen**

In `apps/worker/package.json` unter `devDependencies` ergänzen: `"@ph360/testing": "workspace:*"`, `"@ph360/hub-simulator": "workspace:*"` (Letzteres für Task 8). Dann:

```bash
pnpm install
pnpm test:integration -- apps/worker/src/aggregation/recompute.itest.ts
```
Erwartet: FAIL — `./recompute.js` existiert nicht.

- [ ] **Step 3: `recompute.ts` implementieren**

`apps/worker/src/aggregation/recompute.ts`:

```ts
import { prisma } from "@ph360/database";
import { milliToKwh } from "@ph360/api-contracts";
import { deriveDeltas, INTERVAL_MS, type MeterChangeInfo, type RegisterPoint } from "./derive-deltas.js";
import { bucketStart, nextBucketStart, type BucketResolution } from "./buckets.js";
import { decimalToMilli } from "./decimal.js";
import { allocatePv } from "./allocation.js";
import { costCentsFlat, costCentsSplit, type TariffPrices } from "./cost.js";

const DAY_MS = 96 * INTERVAL_MS;

interface IntervalValue { milli: number; raw: boolean; }
type IntervalMap = Map<number, IntervalValue>; // tsEnd (ms) → Wert

interface PointWithAssignments {
  id: string;
  unitId: string | null;
  pointType: string;
  assignments: { id: string; validFrom: Date; validTo: Date | null }[];
}

/**
 * Einstieg nach Ingest (Outbox `device.telemetry_received`): ermittelt betroffene
 * (Gebäude, UTC-Tag)-Paare aus dem Batch und rechnet sie vollständig neu.
 * Idempotent: reine Upserts auf deterministisch berechneten Werten.
 */
export async function recomputeForBatch(input: { hubId: string; batchId: string }): Promise<void> {
  const batch = await prisma.ingestBatch.findUnique({
    where: { hubId_batchId: { hubId: input.hubId, batchId: input.batchId } },
    include: {
      readings: {
        select: { ts: true, assignment: { select: { meteringPoint: { select: { buildingId: true } } } } },
      },
    },
  });
  if (!batch) return;
  const targets = new Map<string, { buildingId: string; dayStart: Date }>();
  for (const r of batch.readings) {
    const dayStart = bucketStart(new Date(r.ts.getTime() - INTERVAL_MS), "DAY");
    const buildingId = r.assignment.meteringPoint.buildingId;
    targets.set(`${buildingId}|${dayStart.toISOString()}`, { buildingId, dayStart });
  }
  for (const t of targets.values()) {
    await recomputeBuildingDay(t.buildingId, t.dayStart);
  }
}

/** Rechnet einen UTC-Tag eines Gebäudes neu: Deltas → Allocation → HOUR/DAY → Rollups. */
export async function recomputeBuildingDay(buildingId: string, dayStart: Date): Promise<void> {
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);
  const points: PointWithAssignments[] = await prisma.meteringPoint.findMany({
    where: { buildingId },
    select: {
      id: true, unitId: true, pointType: true,
      assignments: { select: { id: true, validFrom: true, validTo: true } },
    },
  });
  if (points.length === 0) return;

  // 1) Effektive Intervalldeltas je Messstelle (Leseregel §2.3: neuester nicht-supersedeter Satz)
  const intervals = new Map<string, IntervalMap>();
  for (const point of points) {
    const assignmentIds = point.assignments.map((a) => a.id);
    if (assignmentIds.length === 0) continue;
    const readings = await prisma.deviceReading.findMany({
      where: {
        assignmentId: { in: assignmentIds },
        ts: { gte: dayStart, lte: dayEnd },
        supersededBy: { none: {} },
      },
      orderBy: { ts: "asc" },
    });
    const registers: RegisterPoint[] = readings
      .filter((r) => r.kind === "REGISTER")
      .map((r) => ({ ts: r.ts, meterId: r.meterId, valueMilli: decimalToMilli(r.value), quality: r.quality }));
    const meterIds = [...new Set(registers.map((r) => r.meterId))];
    const changes: MeterChangeInfo[] =
      meterIds.length < 2
        ? []
        : (
            await prisma.meterChange.findMany({
              where: { meterOldId: { in: meterIds }, meterNewId: { in: meterIds } },
            })
          ).map((c) => ({
            changedAt: c.changedAt,
            meterOldId: c.meterOldId,
            meterNewId: c.meterNewId,
            endValueOldMilli: decimalToMilli(c.endValueOld),
            startValueNewMilli: decimalToMilli(c.startValueNew),
          }));
    const map: IntervalMap = new Map();
    for (const d of deriveDeltas(registers, changes)) {
      if (d.ts > dayStart) map.set(d.ts.getTime(), { milli: d.valueMilli, raw: d.raw });
    }
    for (const r of readings) {
      // Vom Zähler gelieferte Intervallwerte (kind=DELTA) haben Vorrang vor Ableitung
      if (r.kind === "DELTA" && r.ts > dayStart) {
        map.set(r.ts.getTime(), { milli: decimalToMilli(r.value), raw: r.quality === "RAW" });
      }
    }
    intervals.set(point.id, map);
  }

  // 2) PV/Netz-Split + EnergyAllocation — NUR wenn MeteringConcept.splitCalculable (R-A4)
  const concept = await prisma.meteringConcept.findUnique({ where: { buildingId } });
  const split = concept?.splitCalculable ?? false;
  const pvPoint = points.find((p) => p.pointType === "PV_GENERATION");
  const unitPoints = points.filter((p) => p.pointType === "UNIT_CONSUMPTION" && p.unitId !== null);
  const pvByPoint = new Map<string, Map<number, number>>(); // meteringPointId → tsEnd → pvMilli
  if (split && pvPoint) {
    const participants = await prisma.powerParticipant.findMany({
      where: { unitId: { in: unitPoints.map((p) => p.unitId!) } },
    });
    const participantAt = (unitId: string, tsEnd: Date) =>
      participants.find(
        (p) => p.unitId === unitId && p.validFrom < tsEnd && (p.validTo === null || tsEnd <= p.validTo),
      ) ?? null;
    const pvMap = intervals.get(pvPoint.id) ?? new Map<number, IntervalValue>();
    for (let ts = dayStart.getTime() + INTERVAL_MS; ts <= dayEnd.getTime(); ts += INTERVAL_MS) {
      const consumers: { key: string; consumptionMilli: number }[] = [];
      for (const p of unitPoints) {
        const v = intervals.get(p.id)?.get(ts);
        if (v && participantAt(p.unitId!, new Date(ts))) {
          consumers.push({ key: p.id, consumptionMilli: v.milli });
        }
      }
      if (consumers.length === 0) continue;
      const shares = allocatePv({ pvMilli: pvMap.get(ts)?.milli ?? 0, consumers });
      for (const share of shares) {
        const point = unitPoints.find((p) => p.id === share.key)!;
        const participant = participantAt(point.unitId!, new Date(ts))!;
        let m = pvByPoint.get(share.key);
        if (!m) { m = new Map(); pvByPoint.set(share.key, m); }
        m.set(ts, share.pvMilli);
        await prisma.energyAllocation.upsert({
          where: { participantId_ts: { participantId: participant.id, ts: new Date(ts) } },
          update: { pvKwh: milliToKwh(share.pvMilli), gridKwh: milliToKwh(share.gridMilli) },
          create: {
            participantId: participant.id, ts: new Date(ts),
            pvKwh: milliToKwh(share.pvMilli), gridKwh: milliToKwh(share.gridMilli),
          },
        });
      }
    }
  }

  // 3) HOUR + DAY je Messstelle, danach WEEK/MONTH/YEAR-Rollup aus DAY
  const now = new Date();
  for (const point of points) {
    const map = intervals.get(point.id);
    if (!map) continue;
    const prices = await pricesForUnit(point.unitId, dayStart, dayEnd);
    const pvMap = pvByPoint.get(point.id) ?? null;
    const useSplit = split && point.pointType === "UNIT_CONSUMPTION";
    for (let h = 0; h < 24; h++) {
      const hourStart = new Date(dayStart.getTime() + h * 3_600_000);
      await writeIntervalBucket(point, "HOUR", hourStart, map, pvMap, useSplit, prices, now);
    }
    await writeIntervalBucket(point, "DAY", dayStart, map, pvMap, useSplit, prices, now);
    for (const res of ["WEEK", "MONTH", "YEAR"] as const) {
      await rollupFromDays(point.id, res, dayStart, now);
    }
  }
}

async function pricesForUnit(unitId: string | null, dayStart: Date, dayEnd: Date): Promise<TariffPrices | null> {
  if (unitId === null) return null;
  const contract = await prisma.contract.findFirst({
    where: { unitId, startAt: { lt: dayEnd }, OR: [{ endAt: null }, { endAt: { gte: dayStart } }] },
    orderBy: { startAt: "desc" },
    include: { tariffVersion: true },
  });
  if (!contract) return null;
  return {
    workPricePvCents: contract.tariffVersion.workPricePvCents,
    workPriceGridCents: contract.tariffVersion.workPriceGridCents,
  };
}

async function writeIntervalBucket(
  point: PointWithAssignments,
  resolution: "HOUR" | "DAY",
  periodStart: Date,
  map: IntervalMap,
  pvMap: Map<number, number> | null,
  useSplit: boolean,
  prices: TariffPrices | null,
  now: Date,
): Promise<void> {
  const periodEnd = nextBucketStart(periodStart, resolution);
  let total = 0, pv = 0, present = 0, expected = 0, anyRaw = false;
  for (let ts = periodStart.getTime() + INTERVAL_MS; ts <= periodEnd.getTime(); ts += INTERVAL_MS) {
    const tsEnd = new Date(ts);
    // Erwartung nur bei zum Intervallende gültigem Assignment (96er-Regel, Spec §3.2)
    if (point.assignments.some((a) => a.validFrom < tsEnd && (a.validTo === null || tsEnd <= a.validTo))) {
      expected++;
    }
    const v = map.get(ts);
    if (!v) continue;
    present++;
    total += v.milli;
    if (v.raw) anyRaw = true;
    pv += pvMap?.get(ts) ?? 0;
  }
  if (expected === 0 && present === 0) return; // Messstelle in diesem Bucket nicht aktiv
  const hasGaps = present < expected;
  const isPreliminary = periodEnd.getTime() > now.getTime() || hasGaps || anyRaw;
  const kwhPv = useSplit ? milliToKwh(pv) : null;
  const kwhGrid = useSplit ? milliToKwh(total - pv) : null;
  const costCents = prices === null ? null : useSplit ? costCentsSplit(prices, pv, total - pv) : costCentsFlat(prices, total);
  const data = { kwhTotal: milliToKwh(total), kwhPv, kwhGrid, costCents, hasGaps, isPreliminary };
  await prisma.consumptionAggregate.upsert({
    where: { meteringPointId_resolution_periodStart: { meteringPointId: point.id, resolution, periodStart } },
    update: data,
    create: { meteringPointId: point.id, resolution, periodStart, ...data },
  });
}

async function rollupFromDays(
  meteringPointId: string,
  resolution: Extract<BucketResolution, "WEEK" | "MONTH" | "YEAR">,
  dayStart: Date,
  now: Date,
): Promise<void> {
  const periodStart = bucketStart(dayStart, resolution);
  const periodEnd = nextBucketStart(periodStart, resolution);
  const days = await prisma.consumptionAggregate.findMany({
    where: { meteringPointId, resolution: "DAY", periodStart: { gte: periodStart, lt: periodEnd } },
  });
  if (days.length === 0) return;
  const totalMilli = days.reduce((s, d) => s + decimalToMilli(d.kwhTotal), 0);
  const anySplit = days.some((d) => d.kwhPv !== null);
  const pvMilli = anySplit ? days.reduce((s, d) => s + (d.kwhPv ? decimalToMilli(d.kwhPv) : 0), 0) : null;
  const anyCost = days.some((d) => d.costCents !== null);
  const expectedDays = Math.round((periodEnd.getTime() - periodStart.getTime()) / 86_400_000);
  const hasGaps = days.some((d) => d.hasGaps);
  const data = {
    kwhTotal: milliToKwh(totalMilli),
    kwhPv: pvMilli === null ? null : milliToKwh(pvMilli),
    kwhGrid: pvMilli === null ? null : milliToKwh(totalMilli - pvMilli),
    costCents: anyCost ? days.reduce((s, d) => s + (d.costCents ?? 0), 0) : null,
    hasGaps,
    isPreliminary:
      periodEnd.getTime() > now.getTime() || hasGaps || days.length < expectedDays || days.some((d) => d.isPreliminary),
  };
  await prisma.consumptionAggregate.upsert({
    where: { meteringPointId_resolution_periodStart: { meteringPointId, resolution, periodStart } },
    update: data,
    create: { meteringPointId, resolution, periodStart, ...data },
  });
}
```

- [ ] **Step 4: Test grün sehen**

```bash
pnpm test:integration -- apps/worker/src/aggregation/recompute.itest.ts
```
Erwartet: 3 Tests PASS.

- [ ] **Step 5: Worker-Handler verdrahten (Aggregation nach Ingest + Support-Mail)**

In `apps/worker/src/index.ts`: Import ergänzen

```ts
import { recomputeForBatch } from "./aggregation/recompute.js";
```

und den bestehenden WP-APP-1-Handler-Eintrag für `device.telemetry_received` in der `handlers`-Registry so erweitern, dass NACH der bestehenden Verarbeitung (DeviceState/Lücken aus `telemetry.js`) zusätzlich aggregiert wird — bestehenden Aufruf beibehalten, nur die Recompute-Zeile ergänzen:

```ts
  "device.telemetry_received": async (payload) => {
    await handleTelemetryReceived(payload); // bestehend aus WP-APP-1 (Name ggf. an Ist-Stand anpassen)
    await recomputeForBatch({ hubId: String(payload.hubId), batchId: String(payload.batchId) });
  },
```

Zusätzlich neuen Handler in derselben Registry ergänzen (nutzt den bestehenden Mailer):

```ts
  "support.message_created": async (payload) => {
    await sendMail({
      to: process.env.SUPPORT_NOTIFY_TO ?? leadNotifyTo,
      subject: `Support-Anfrage: ${String(payload.subject ?? "(ohne Betreff)")}`,
      text: [
        `Neue Support-Anfrage aus der Kunden-App.`,
        ``,
        `Von:     ${String(payload.email ?? "—")}`,
        `Kontext: ${String(payload.participantId ?? "—")}`,
        ``,
        String(payload.body ?? ""),
      ].join("\n"),
    });
  },
```

- [ ] **Step 6: Typecheck + Commit**

```bash
pnpm --filter @ph360/worker typecheck
git add apps/worker pnpm-lock.yaml
git commit -m "feat(worker): ConsumptionAggregate-Orchestrierung hinter device.telemetry_received + support.message_created-Handler"
```

---

## Task 8: Worker — Aggregations-Szenariotests gegen Hub-Simulator-Daten

**Files:**
- Test: `apps/worker/src/aggregation/scenario.itest.ts`

- [ ] **Step 1: Szenariotests schreiben**

Die Soll-Werte werden aus dem deterministischen Simulator-Profil selbst berechnet (Summe der 15-min-Differenzen) — der Test bleibt korrekt, egal welches Lastprofil der Simulator liefert.

`apps/worker/src/aggregation/scenario.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { generateDayLoadProfile } from "@ph360/hub-simulator";
import { kwhToMilli, milliToKwh } from "@ph360/api-contracts";
import { createResidentSetup, writeRegisterSeries } from "@ph360/testing";
import { recomputeForBatch } from "./recompute.js";
import { INTERVAL_MS } from "./derive-deltas.js";

const DAY = new Date("2026-06-15T00:00:00.000Z");

/** Soll-Tagessumme aus dem Profil: Summe aller Differenzen benachbarter 15-min-Register. */
function expectedDayMilli(points: { ts: string; value: string }[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    if (Date.parse(curr.ts) - Date.parse(prev.ts) === INTERVAL_MS) {
      sum += kwhToMilli(curr.value) - kwhToMilli(prev.value);
    }
  }
  return sum;
}

async function dayAggregate(meteringPointId: string) {
  return prisma.consumptionAggregate.findUnique({
    where: { meteringPointId_resolution_periodStart: { meteringPointId, resolution: "DAY", periodStart: DAY } },
  });
}

describe("Aggregations-Szenarien gegen Hub-Simulator-Daten (§9 Hub-Simulator-E2E-Ebene)", () => {
  it("Szenario normal: DAY-Aggregat = Summe der Profil-Deltas, lückenlos, final", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    const profile = generateDayLoadProfile(DAY, { startRegisterKwh: 1000 });
    const { batch } = await writeRegisterSeries({
      hubId: s.hubId, meterId: s.meter.id, assignmentId: s.assignment.id,
      points: profile.map((p) => ({ ts: new Date(p.ts), valueKwh: p.value })),
    });
    await recomputeForBatch({ hubId: s.hubId, batchId: batch.batchId });

    const day = await dayAggregate(s.meteringPoint.id);
    expect(day?.kwhTotal.toFixed(3)).toBe(milliToKwh(expectedDayMilli(profile)));
    expect(day?.isPreliminary).toBe(false);
  });

  it("Szenario Lücke: fehlende Intervalle ⇒ hasGaps=true, Summe nur aus vorhandenen Deltas", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    const profile = generateDayLoadProfile(DAY, { startRegisterKwh: 1000, gapIntervals: [30, 31, 32, 33] });
    const { batch } = await writeRegisterSeries({
      hubId: s.hubId, meterId: s.meter.id, assignmentId: s.assignment.id,
      points: profile.map((p) => ({ ts: new Date(p.ts), valueKwh: p.value })),
    });
    await recomputeForBatch({ hubId: s.hubId, batchId: batch.batchId });

    const day = await dayAggregate(s.meteringPoint.id);
    expect(day?.hasGaps).toBe(true);
    expect(day?.isPreliminary).toBe(true);
    expect(day?.kwhTotal.toFixed(3)).toBe(milliToKwh(expectedDayMilli(profile)));
  });

  it("Szenario Zählerwechsel: MeterChange-Formel über die Wechselgrenze, kein Datenverlust", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    const changeAt = new Date(DAY.getTime() + 48 * INTERVAL_MS); // 12:00 UTC

    // Alter Zähler: Register bis 12:00 (Intervalle 0–48), 0,150 kWh je Intervall
    const oldPoints = Array.from({ length: 49 }, (_, i) => ({
      ts: new Date(DAY.getTime() + i * INTERVAL_MS),
      valueKwh: milliToKwh(5_000_000 + i * 150),
    }));
    // Neuer Zähler: Register ab 12:15 (Intervalle 49–96), Start 100,000, ebenfalls 0,150/Intervall
    const newMeter = await prisma.meter.create({
      data: { organizationId: s.organizationId, manufacturer: "EMH", model: "ED300L", serialNumber: `T-neu-${Date.now()}` },
    });
    await prisma.deviceAssignment.update({ where: { id: s.assignment.id }, data: { validTo: changeAt } });
    const newAssignment = await prisma.deviceAssignment.create({
      data: {
        organizationId: s.organizationId, meterId: newMeter.id, meteringPointId: s.meteringPoint.id,
        hubId: s.hubId, channelRef: `devEUI:wechsel:1`, validFrom: changeAt,
      },
    });
    await prisma.meterChange.create({
      data: {
        organizationId: s.organizationId, meterOldId: s.meter.id, meterNewId: newMeter.id,
        changedAt: new Date(changeAt.getTime() + 5 * 60 * 1000),
        endValueOld: "5007.250", // 0,050 kWh nach letztem Register verbraucht
        startValueNew: "100.000",
      },
    });
    const newPoints = Array.from({ length: 48 }, (_, i) => ({
      ts: new Date(DAY.getTime() + (49 + i) * INTERVAL_MS),
      valueKwh: milliToKwh(100_100 + i * 150), // 100,100 beim ersten Register (0,100 nach Einbau)
    }));

    await writeRegisterSeries({ hubId: s.hubId, meterId: s.meter.id, assignmentId: s.assignment.id, points: oldPoints });
    const { batch } = await writeRegisterSeries({
      hubId: s.hubId, meterId: newMeter.id, assignmentId: newAssignment.id, points: newPoints,
    });
    await recomputeForBatch({ hubId: s.hubId, batchId: batch.batchId });

    const day = await dayAggregate(s.meteringPoint.id);
    // 48 Deltas alt × 150 + Wechselintervall (5007250−5007200 + 100100−100000 = 150) + 47 Deltas neu × 150
    expect(day?.kwhTotal.toFixed(3)).toBe(milliToKwh(48 * 150 + 150 + 47 * 150));
    expect(day?.hasGaps).toBe(false);
  });
});
```

- [ ] **Step 2: Tests ausführen**

```bash
pnpm test:integration -- apps/worker/src/aggregation/scenario.itest.ts
```
Erwartet: 3 Tests PASS (die Implementierung aus Task 6/7 deckt alle Szenarien ab). Falls rot: superpowers:systematic-debugging, Fix in `recompute.ts`/`derive-deltas.ts`, NICHT im Test.

- [ ] **Step 3: Commit**

```bash
git add apps/worker/src/aggregation/scenario.itest.ts
git commit -m "test(worker): Aggregations-Szenariotests gegen Hub-Simulator-Profile (normal, Lücke, Zählerwechsel)"
```

---

## Task 9: `apps/platform` — App-API-Basis: Fehler-Envelope, Scope-Helfer, MinIO, Hochrechnung (TDD)

**Files:**
- Create: `apps/platform/src/lib/app/respond.ts`, `src/lib/app/scope.ts`, `src/lib/app/storage.ts`, `src/lib/app/projection.ts`
- Test: `apps/platform/src/lib/app/projection.test.ts`
- Modify: `apps/platform/package.json`, `turbo.json`, `.env`, `.env.example`

- [ ] **Step 1: Dependencies + Env**

`apps/platform/package.json` `dependencies` ergänzen (falls noch nicht vorhanden): `"@ph360/auth": "workspace:*"`, `"@ph360/permissions": "workspace:*"`, `"@ph360/api-contracts": "workspace:*"`, `"minio": "^8.0.3"`. Dann `pnpm install`.

`turbo.json` `globalEnv` ergänzen:
```json
"MINIO_ENDPOINT", "MINIO_PORT", "MINIO_USE_SSL", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY",
"MINIO_BUCKET_DOCUMENTS", "APP_MIN_VERSION", "APP_PRIVACY_URL", "APP_IMPRINT_URL", "SUPPORT_NOTIFY_TO"
```

`.env` und `.env.example` ergänzen (Werte an die lokale MinIO-Compose-Config anpassen):
```
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_DOCUMENTS=ph360-documents
APP_MIN_VERSION=1.0.0
APP_PRIVACY_URL=https://powerhouse360.de/datenschutz
APP_IMPRINT_URL=https://powerhouse360.de/impressum
SUPPORT_NOTIFY_TO=service@powerhouse360.de
```

- [ ] **Step 2: Fehlschlagenden Hochrechnungs-Test schreiben**

`apps/platform/src/lib/app/projection.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { projectMonthEndCents } from "./projection.js";

const monthStart = new Date("2026-06-01T00:00:00.000Z");
const monthEnd = new Date("2026-07-01T00:00:00.000Z");

describe("projectMonthEndCents — lineare Monatsend-Hochrechnung (Spec §4.2 summary)", () => {
  it("rechnet linear hoch: 10 von 30 Tagen, 1000 Cent ⇒ 3000 Cent", () => {
    const now = new Date("2026-06-11T00:00:00.000Z");
    expect(projectMonthEndCents({ monthToDateCents: 1000, monthStart, monthEnd, now })).toBe(3000);
  });

  it("liefert null bei < 24 h Datenbasis (keine belastbare Hochrechnung)", () => {
    const now = new Date("2026-06-01T10:00:00.000Z");
    expect(projectMonthEndCents({ monthToDateCents: 100, monthStart, monthEnd, now })).toBeNull();
  });

  it("nach Monatsende: Ist-Wert statt Hochrechnung", () => {
    const now = new Date("2026-07-02T00:00:00.000Z");
    expect(projectMonthEndCents({ monthToDateCents: 4200, monthStart, monthEnd, now })).toBe(4200);
  });
});
```

Rot sehen:
```bash
pnpm test:unit -- apps/platform/src/lib/app
```
Erwartet: FAIL — `projection.js` existiert nicht.

- [ ] **Step 3: `projection.ts` implementieren + grün sehen**

`apps/platform/src/lib/app/projection.ts`:

```ts
/**
 * Lineare Monatsend-Hochrechnung (in der App als Hochrechnung gekennzeichnet, §7.2).
 * null bei < 24 h verstrichenem Monatsanteil — keine belastbare Basis.
 */
export function projectMonthEndCents(input: {
  monthToDateCents: number;
  monthStart: Date;
  monthEnd: Date;
  now: Date;
}): number | null {
  const elapsed = input.now.getTime() - input.monthStart.getTime();
  if (elapsed < 24 * 3_600_000) return null;
  if (input.now.getTime() >= input.monthEnd.getTime()) return input.monthToDateCents;
  const total = input.monthEnd.getTime() - input.monthStart.getTime();
  return Math.round((input.monthToDateCents * total) / elapsed);
}
```

```bash
pnpm test:unit -- apps/platform/src/lib/app
```
Erwartet: 3 Tests PASS.

- [ ] **Step 4: `respond.ts` implementieren**

`apps/platform/src/lib/app/respond.ts`:

```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { AuthnError, AuthzError } from "@ph360/auth";

export class NotFoundError extends Error {}

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL";

/** Fehler-Envelope {error:{code,message,requestId}} (Spec §4.1). */
export function errorResponse(code: AppErrorCode, message: string, requestId: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

type AppHandler = (
  req: Request,
  ctx: { requestId: string; params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * Wrapper für alle /api/v1/app-Routen: requestId, einheitliches Statusmapping.
 * AuthnError→401, AuthzError→403, NotFoundError→404, ZodError→422, sonst 500.
 */
export function appRoute(handler: AppHandler) {
  return async (req: Request, routeCtx: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    try {
      return await handler(req, { requestId, params: routeCtx.params });
    } catch (err) {
      if (err instanceof AuthnError) return errorResponse("UNAUTHENTICATED", "Anmeldung erforderlich.", requestId, 401);
      if (err instanceof AuthzError) return errorResponse("FORBIDDEN", "Kein Zugriff.", requestId, 403);
      if (err instanceof NotFoundError) return errorResponse("NOT_FOUND", "Nicht gefunden.", requestId, 404);
      if (err instanceof ZodError) return errorResponse("VALIDATION_FAILED", "Ungültige Eingabe.", requestId, 422);
      console.error(`[app-api] ${requestId}`, err);
      return errorResponse("INTERNAL", "Interner Fehler.", requestId, 500);
    }
  };
}
```

- [ ] **Step 5: `scope.ts` implementieren**

`apps/platform/src/lib/app/scope.ts`:

```ts
import {
  getAuthContext,
  requirePermission,
  assertParticipantScope,
  recordAudit,
  AuthnError,
  AuthzError,
  type AuthContext,
  type ParticipantScope,
} from "@ph360/auth";
import { canAny, type Permission } from "@ph360/permissions";
import { prisma } from "@ph360/database";

/** Zugriffsklasse `session`: gültige Session nötig (Spec §4.1). */
export async function requireSession(req: Request): Promise<AuthContext> {
  const ctx = await getAuthContext(req.headers);
  if (!ctx) throw new AuthnError();
  return ctx;
}

/**
 * Permission über IRGENDEINE aktive Membership (für nicht kontext-gebundene
 * Self-Service-Routen wie /me, notification-preferences, push-devices, support).
 * Der Datenzugriff selbst bleibt über userId bzw. assertParticipantScope beschnitten.
 */
export async function requireAppPermission(ctx: AuthContext, permission: Permission): Promise<AuthContext> {
  const roles = ctx.memberships.map((m) => m.role);
  if (roles.length > 0 && canAny(roles, permission)) return ctx;
  await recordAudit(prisma, {
    action: "authz.denied",
    subjectType: "Permission",
    subjectId: permission,
    actorType: "USER",
    actorId: ctx.userId,
    after: { permission, reason: roles.length === 0 ? "no_membership" : "role_lacks_permission" },
  });
  throw new AuthzError();
}

export interface ParticipantRequest {
  ctx: AuthContext;
  scope: ParticipantScope;
}

/**
 * Zugriffsklasse `permission` mit Teilnahme-Scope (Spec §5.1, zweistufig):
 * (1) Teilnahme gehört dem User (assertParticipantScope),
 * (2) Permission + Org-Scope über die Organisation der Teilnahme (requirePermission).
 */
export async function requireParticipant(
  req: Request,
  participantId: string,
  permission: Permission,
): Promise<ParticipantRequest> {
  const ctx = await requireSession(req);
  const scope = await assertParticipantScope(ctx, participantId);
  await requirePermission(ctx, permission, { organizationId: scope.organizationId });
  return { ctx, scope };
}
```

- [ ] **Step 6: `storage.ts` implementieren**

`apps/platform/src/lib/app/storage.ts`:

```ts
import { Client } from "minio";

export const DOCUMENTS_BUCKET = process.env.MINIO_BUCKET_DOCUMENTS ?? "ph360-documents";
export const DOWNLOAD_URL_TTL_SECONDS = 300;

let client: Client | null = null;

export function getMinio(): Client {
  client ??= new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  });
  return client;
}

export async function ensureDocumentsBucket(): Promise<void> {
  const minio = getMinio();
  if (!(await minio.bucketExists(DOCUMENTS_BUCKET))) {
    await minio.makeBucket(DOCUMENTS_BUCKET);
  }
}

/** Kurzlebige signierte Download-URL (Spec §3.3: nie direkte Objekt-URLs). */
export async function getDocumentDownloadUrl(
  objectKey: string,
  fileName: string,
): Promise<{ url: string; expiresAt: Date }> {
  const url = await getMinio().presignedGetObject(DOCUMENTS_BUCKET, objectKey, DOWNLOAD_URL_TTL_SECONDS, {
    "response-content-disposition": `attachment; filename="${fileName.replaceAll('"', "")}"`,
  });
  return { url, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000) };
}
```

- [ ] **Step 7: Typecheck + Commit**

```bash
pnpm --filter @ph360/platform typecheck
git add apps/platform turbo.json .env.example pnpm-lock.yaml
git commit -m "feat(platform): App-API-Basis — Fehler-Envelope, Session-/Teilnahme-Scope-Helfer, MinIO-Downloads, Hochrechnung (TDD)"
```

---

## Task 10: Routen `GET /api/v1/app/config` + `GET /api/v1/app/me` (TDD)

**Files:**
- Create: `apps/platform/src/app/api/v1/app/config/route.ts`, `apps/platform/src/app/api/v1/app/me/route.ts`
- Test: `apps/platform/src/app/api/v1/app/app-core.itest.ts` (Teil 1 — wird in Task 11 erweitert)

- [ ] **Step 1: Fehlschlagenden Routen-Test schreiben**

`apps/platform/src/app/api/v1/app/app-core.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createOrg, createUserWithMembership, createResidentSetup, signInHeaders } from "@ph360/testing";
import { configResponseSchema, meResponseSchema } from "@ph360/api-contracts";
import { GET as configGET } from "./config/route.js";
import { GET as meGET } from "./me/route.js";

const noParams = { params: Promise.resolve({}) };
const url = (p: string) => `http://localhost:3100/api/v1/app${p}`;

describe("GET /api/v1/app/config — Zugriffsklasse public", () => {
  it("liefert Konfiguration ohne Session", async () => {
    const res = await configGET(new Request(url("/config")), noParams);
    expect(res.status).toBe(200);
    expect(configResponseSchema.safeParse(await res.json()).success).toBe(true);
  });
});

describe("GET /api/v1/app/me — permission: profile.read_own", () => {
  it("liefert Profil + Contexts (aktive Teilnahme, expired=false)", async () => {
    const s = await createResidentSetup();
    const headers = await signInHeaders(s.email, s.password);
    const res = await meGET(new Request(url("/me"), { headers }), noParams);
    expect(res.status).toBe(200);
    const body = meResponseSchema.parse(await res.json());
    expect(body.user.email).toBe(s.email);
    expect(body.contexts).toHaveLength(1);
    expect(body.contexts[0]).toMatchObject({
      id: s.participant.id,
      unitLabel: s.unit.label,
      contractNumber: s.contract.contractNumber,
      expired: false,
    });
  });

  it("markiert beendete Teilnahmen als expired (bleiben lesbar, §5.1)", async () => {
    const s = await createResidentSetup({
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: new Date("2026-03-31T23:59:59.000Z"),
      status: "ENDED",
    });
    const headers = await signInHeaders(s.email, s.password);
    const res = await meGET(new Request(url("/me"), { headers }), noParams);
    const body = meResponseSchema.parse(await res.json());
    expect(body.contexts[0]?.expired).toBe(true);
  });

  it("Authz-Negativ: ohne Session 401, Rolle ohne profile.read_own 403 — je mit Fehler-Envelope", async () => {
    const anon = await meGET(new Request(url("/me")), noParams);
    expect(anon.status).toBe(401);
    const anonBody = await anon.json();
    expect(anonBody.error.code).toBe("UNAUTHENTICATED");
    expect(typeof anonBody.error.requestId).toBe("string");

    const org = await createOrg();
    const parking = await createUserWithMembership(org.id, "PARKING_USER");
    const res = await meGET(new Request(url("/me"), { headers: await signInHeaders(parking.email, parking.password) }), noParams);
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/app-core.itest.ts
```
Erwartet: FAIL — Routen-Module existieren nicht.

- [ ] **Step 3: Routen implementieren**

`apps/platform/src/app/api/v1/app/config/route.ts`:

```ts
import { NextResponse } from "next/server";
import { configResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";

export const runtime = "nodejs";

/** Zugriffsklasse: public — dokumentierte Ausnahme, nur unkritische Konfiguration (Spec §4.2). */
export const GET = appRoute(async () => {
  const body = configResponseSchema.parse({
    minAppVersion: process.env.APP_MIN_VERSION ?? "1.0.0",
    privacyUrl: process.env.APP_PRIVACY_URL ?? "https://powerhouse360.de/datenschutz",
    imprintUrl: process.env.APP_IMPRINT_URL ?? "https://powerhouse360.de/impressum",
    features: { co2: false },
  });
  return NextResponse.json(body);
});
```

`apps/platform/src/app/api/v1/app/me/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@ph360/database";
import { meResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";
import { requireSession, requireAppPermission } from "@/lib/app/scope";

export const runtime = "nodejs";

/** Zugriffsklasse: permission profile.read_own — Datenbeschnitt über userId (Spec §4.2). */
export const GET = appRoute(async (req) => {
  const ctx = await requireSession(req);
  await requireAppPermission(ctx, "profile.read_own");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { id: true, email: true, name: true, locale: true },
  });
  const participants = await prisma.powerParticipant.findMany({
    where: { userId: ctx.userId },
    include: { unit: { include: { building: true } }, contracts: true },
    orderBy: { validFrom: "asc" },
  });
  const now = new Date();
  const body = meResponseSchema.parse({
    user,
    contexts: participants.map((p) => ({
      id: p.id,
      unitLabel: p.unit.label,
      buildingName: p.unit.building.name,
      contractNumber: p.contracts.find((c) => c.id === p.contractId)?.contractNumber ?? null,
      validFrom: p.validFrom.toISOString(),
      validTo: p.validTo?.toISOString() ?? null,
      expired: p.status === "ENDED" || (p.validTo !== null && p.validTo < now),
    })),
  });
  return NextResponse.json(body);
});
```

- [ ] **Step 4: Test grün sehen + Commit**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/app-core.itest.ts
git add apps/platform/src/app/api/v1/app
git commit -m "feat(platform): App-Routen config + me — Contexts inkl. expired-Flag, Fehler-Envelope (F-APP-1-Basis)"
```
Erwartet: 4 Tests PASS.

---

## Task 11: Summary-/Data-Status-Service + Routen `summary` + `data-status` (TDD)

**Files:**
- Create: `apps/platform/src/lib/app/summary.ts`, `apps/platform/src/app/api/v1/app/contexts/[id]/summary/route.ts`, `apps/platform/src/app/api/v1/app/contexts/[id]/data-status/route.ts`
- Test: `apps/platform/src/app/api/v1/app/app-core.itest.ts` (Erweiterung)

- [ ] **Step 1: Fehlschlagende Tests ergänzen**

An `apps/platform/src/app/api/v1/app/app-core.itest.ts` anfügen (Imports oben ergänzen):

```ts
import { prisma } from "@ph360/database";
import { summaryResponseSchema, dataStatusResponseSchema } from "@ph360/api-contracts";
import { GET as summaryGET } from "./contexts/[id]/summary/route.js";
import { GET as dataStatusGET } from "./contexts/[id]/data-status/route.js";

function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/v1/app/contexts/:id/summary — permission: consumption.read_own", () => {
  it("liefert letzten Messwert (DeviceState), Heute-/Monatswerte aus Aggregaten", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2020-01-01T00:00:00.000Z") });
    const now = new Date();
    const today = utcDayStart(now);
    await prisma.deviceState.create({
      data: { meterId: s.meter.id, lastValue: "5012.375", lastTs: now, online: true },
    });
    await prisma.consumptionAggregate.create({
      data: {
        meteringPointId: s.meteringPoint.id, resolution: "DAY", periodStart: today,
        kwhTotal: "3.250", costCents: 114, hasGaps: false, isPreliminary: true,
      },
    });
    const headers = await signInHeaders(s.email, s.password);
    const res = await summaryGET(new Request(url(`/contexts/${s.participant.id}/summary`), { headers }), params(s.participant.id));
    expect(res.status).toBe(200);
    const body = summaryResponseSchema.parse(await res.json());
    expect(body.lastReading?.valueKwh).toBe("5012.375");
    expect(body.today.kwh).toBe("3.250");
    expect(body.month.kwh).toBe("3.250");
    expect(body.month.costCents).toBe(114);
    expect(body.split.available).toBe(false);
    expect(body.dataStatus.isPreliminary).toBe(true);
  });

  it("Authz-Negativ: fremder Kontext ⇒ 403 FORBIDDEN (Bewohner A sieht niemals Unit B)", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const res = await summaryGET(
      new Request(url(`/contexts/${b.participant.id}/summary`), { headers: await signInHeaders(a.email, a.password) }),
      params(b.participant.id),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
  });
});

describe("GET /api/v1/app/contexts/:id/data-status — permission: consumption.read_own", () => {
  it("liefert letzte Übertragung + offene Lücken aus DeviceAlerts", async () => {
    const s = await createResidentSetup();
    const now = new Date();
    await prisma.deviceState.create({ data: { meterId: s.meter.id, lastValue: "1.000", lastTs: now, online: true } });
    await prisma.deviceAlert.create({
      data: {
        organizationId: s.organizationId, type: "DATA_GAP", meteringPointId: s.meteringPoint.id,
        status: "OPEN", firstAt: new Date(now.getTime() - 7_200_000), lastAt: now,
      },
    });
    const headers = await signInHeaders(s.email, s.password);
    const res = await dataStatusGET(new Request(url(`/contexts/${s.participant.id}/data-status`), { headers }), params(s.participant.id));
    expect(res.status).toBe(200);
    const body = dataStatusResponseSchema.parse(await res.json());
    expect(body.lastReceivedAt).toBe(now.toISOString());
    expect(body.openGaps).toHaveLength(1);
    expect(body.disturbance).toBe(false);
  });

  it("Authz-Negativ: fremder Kontext ⇒ 403", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const res = await dataStatusGET(
      new Request(url(`/contexts/${b.participant.id}/data-status`), { headers: await signInHeaders(a.email, a.password) }),
      params(b.participant.id),
    );
    expect(res.status).toBe(403);
  });
});
```

Rot sehen:
```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/app-core.itest.ts
```
Erwartet: FAIL — `summary.ts`/Routen fehlen.

- [ ] **Step 2: Service `summary.ts` implementieren**

`apps/platform/src/lib/app/summary.ts`:

```ts
import { prisma } from "@ph360/database";
import { clampToScope, type ParticipantScope } from "@ph360/auth";
import {
  kwhToMilli,
  milliToKwh,
  toKwhString,
  type DataStatusResponse,
  type SummaryResponse,
} from "@ph360/api-contracts";
import { projectMonthEndCents } from "./projection.js";

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function utcMonthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** UNIT_CONSUMPTION-Messstelle der Unit — einzige Zeitreihen-Quelle der App (§3.3). */
export async function findUnitPoint(unitId: string) {
  return prisma.meteringPoint.findFirst({ where: { unitId, pointType: "UNIT_CONSUMPTION" } });
}

interface DaySum {
  rowCount: number;
  totalMilli: number;
  pvMilli: number | null;
  costCents: number | null;
  hasGaps: boolean;
  isPreliminary: boolean;
}

const EMPTY_SUM: DaySum = { rowCount: 0, totalMilli: 0, pvMilli: null, costCents: null, hasGaps: false, isPreliminary: false };

async function sumDays(meteringPointId: string, from: Date, to: Date): Promise<DaySum> {
  const rows = await prisma.consumptionAggregate.findMany({
    where: { meteringPointId, resolution: "DAY", periodStart: { gte: from, lt: to } },
  });
  return {
    rowCount: rows.length,
    totalMilli: rows.reduce((s, r) => s + kwhToMilli(r.kwhTotal.toFixed(3)), 0),
    pvMilli: rows.some((r) => r.kwhPv !== null)
      ? rows.reduce((s, r) => s + (r.kwhPv ? kwhToMilli(r.kwhPv.toFixed(3)) : 0), 0)
      : null,
    costCents: rows.some((r) => r.costCents !== null) ? rows.reduce((s, r) => s + (r.costCents ?? 0), 0) : null,
    hasGaps: rows.some((r) => r.hasGaps),
    isPreliminary: rows.some((r) => r.isPreliminary),
  };
}

/** Mieterstrom-Ersparnis aus dem Vertragstarif des Kontexts; null ohne Split/Vertrag (R-A4). */
export async function savingsFor(scope: ParticipantScope, pvMilli: number | null): Promise<number | null> {
  if (pvMilli === null) return null;
  const participant = await prisma.powerParticipant.findUnique({ where: { id: scope.participantId } });
  if (!participant?.contractId) return null;
  const contract = await prisma.contract.findUnique({
    where: { id: participant.contractId },
    include: { tariffVersion: true },
  });
  if (!contract) return null;
  const diff = contract.tariffVersion.workPriceGridCents - contract.tariffVersion.workPricePvCents;
  return Math.max(0, Math.round((pvMilli * diff) / 1000));
}

export async function getSummary(scope: ParticipantScope, now = new Date()): Promise<SummaryResponse> {
  const point = await findUnitPoint(scope.unitId);

  let lastReading: SummaryResponse["lastReading"] = null;
  let lastReceivedAt: string | null = null;
  let hasOpenGaps = false;
  if (point) {
    const assignment = await prisma.deviceAssignment.findFirst({
      where: { meteringPointId: point.id },
      orderBy: { validFrom: "desc" },
    });
    const state = assignment ? await prisma.deviceState.findUnique({ where: { meterId: assignment.meterId } }) : null;
    if (state?.lastValue != null && state.lastTs != null) {
      lastReading = { valueKwh: toKwhString(state.lastValue), ts: state.lastTs.toISOString() };
    }
    lastReceivedAt = state?.lastTs?.toISOString() ?? null;
    hasOpenGaps =
      (await prisma.deviceAlert.count({ where: { meteringPointId: point.id, type: "DATA_GAP", status: "OPEN" } })) > 0;
  }

  const dayStart = utcDayStart(now);
  const monthStart = utcMonthStart(now);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const todayClamp = clampToScope(scope, dayStart, new Date(dayStart.getTime() + 86_400_000));
  const today = point && todayClamp ? await sumDays(point.id, todayClamp.from, todayClamp.to) : EMPTY_SUM;

  const monthClamp = clampToScope(scope, monthStart, monthEnd);
  const month = point && monthClamp ? await sumDays(point.id, monthClamp.from, monthClamp.to) : EMPTY_SUM;

  // Vormonatsvergleich: laufender Monat vs. Vormonat, gleicher Zeitraumanteil (Tagesbasis)
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevWindowEnd = new Date(
    Math.min(prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()), monthStart.getTime()),
  );
  const prevClamp = clampToScope(scope, prevMonthStart, prevWindowEnd);
  const prev = point && prevClamp ? await sumDays(point.id, prevClamp.from, prevClamp.to) : EMPTY_SUM;

  return {
    lastReading,
    today: { kwh: milliToKwh(today.totalMilli), hasGaps: today.hasGaps },
    month: {
      kwh: milliToKwh(month.totalMilli),
      costCents: month.costCents,
      projectedMonthEndCents:
        month.costCents === null
          ? null
          : projectMonthEndCents({ monthToDateCents: month.costCents, monthStart, monthEnd, now }),
      previousMonthKwh: prev.rowCount > 0 ? milliToKwh(prev.totalMilli) : null,
      deltaToPreviousMonthPct:
        prev.rowCount > 0 && prev.totalMilli > 0
          ? Math.round(((month.totalMilli - prev.totalMilli) / prev.totalMilli) * 1000) / 10
          : null,
    },
    split: {
      available: month.pvMilli !== null,
      pvKwh: month.pvMilli === null ? null : milliToKwh(month.pvMilli),
      gridKwh: month.pvMilli === null ? null : milliToKwh(month.totalMilli - month.pvMilli),
      savingsCents: await savingsFor(scope, month.pvMilli),
    },
    dataStatus: { lastReceivedAt, hasOpenGaps, isPreliminary: month.isPreliminary || today.isPreliminary },
  };
}

export async function getDataStatus(scope: ParticipantScope): Promise<DataStatusResponse> {
  const point = await findUnitPoint(scope.unitId);
  if (!point) return { lastReceivedAt: null, openGaps: [], disturbance: false };
  const assignment = await prisma.deviceAssignment.findFirst({
    where: { meteringPointId: point.id },
    orderBy: { validFrom: "desc" },
  });
  const state = assignment ? await prisma.deviceState.findUnique({ where: { meterId: assignment.meterId } }) : null;
  const alerts = await prisma.deviceAlert.findMany({ where: { meteringPointId: point.id, status: "OPEN" } });
  return {
    lastReceivedAt: state?.lastTs?.toISOString() ?? null,
    openGaps: alerts
      .filter((a) => a.type === "DATA_GAP")
      .map((a) => ({ firstAt: a.firstAt.toISOString(), lastAt: a.lastAt.toISOString() })),
    disturbance: alerts.some((a) => a.type !== "DATA_GAP"),
  };
}
```

- [ ] **Step 3: Routen implementieren**

`apps/platform/src/app/api/v1/app/contexts/[id]/summary/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { summaryResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";
import { requireParticipant } from "@/lib/app/scope";
import { getSummary } from "@/lib/app/summary";

export const runtime = "nodejs";

/** Zugriffsklasse: permission consumption.read_own, Scope: Teilnahme (Spec §4.2). */
export const GET = appRoute(async (req, { params }) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(await params);
  const { scope } = await requireParticipant(req, id, "consumption.read_own");
  return NextResponse.json(summaryResponseSchema.parse(await getSummary(scope)));
});
```

`apps/platform/src/app/api/v1/app/contexts/[id]/data-status/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dataStatusResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";
import { requireParticipant } from "@/lib/app/scope";
import { getDataStatus } from "@/lib/app/summary";

export const runtime = "nodejs";

/** Zugriffsklasse: permission consumption.read_own, Scope: Teilnahme (Spec §4.2). */
export const GET = appRoute(async (req, { params }) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(await params);
  const { scope } = await requireParticipant(req, id, "consumption.read_own");
  return NextResponse.json(dataStatusResponseSchema.parse(await getDataStatus(scope)));
});
```

- [ ] **Step 4: Test grün sehen + Commit**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/app-core.itest.ts
git add apps/platform/src/lib/app apps/platform/src/app/api/v1/app
git commit -m "feat(platform): summary- + data-status-Route — DeviceState/Aggregate-Lesepfad, Vormonatsvergleich, Hochrechnung"
```
Erwartet: 8 Tests PASS.

---

## Task 12: Zeitreihen-Service + Route `consumption` inkl. Vormieter-/Nachmieter-Beschnitt (TDD)

**Files:**
- Create: `apps/platform/src/lib/app/series.ts`, `apps/platform/src/app/api/v1/app/contexts/[id]/consumption/route.ts`
- Test: `apps/platform/src/app/api/v1/app/consumption.itest.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`apps/platform/src/app/api/v1/app/consumption.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { addParticipant, createResidentSetup, signInHeaders } from "@ph360/testing";
import { consumptionResponseSchema } from "@ph360/api-contracts";
import { GET as consumptionGET } from "./contexts/[id]/consumption/route.js";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const url = (id: string, q: string) => `http://localhost:3100/api/v1/app/contexts/${id}/consumption?${q}`;

async function dayAggregate(meteringPointId: string, periodStart: string, kwhTotal: string, costCents: number | null = null) {
  return prisma.consumptionAggregate.create({
    data: { meteringPointId, resolution: "DAY", periodStart: new Date(periodStart), kwhTotal, costCents, hasGaps: false, isPreliminary: false },
  });
}

describe("GET /api/v1/app/contexts/:id/consumption — permission: consumption.read_own", () => {
  it("liefert Zeitreihe aus ConsumptionAggregate + Vorperioden-Vergleich + Ø-Preis", async () => {
    const s = await createResidentSetup({ validFrom: new Date("2026-01-01T00:00:00.000Z") });
    await dayAggregate(s.meteringPoint.id, "2026-02-09T00:00:00.000Z", "10.000", 350); // Vorperiode
    await dayAggregate(s.meteringPoint.id, "2026-02-10T00:00:00.000Z", "14.400", 504);
    const headers = await signInHeaders(s.email, s.password);
    const res = await consumptionGET(
      new Request(url(s.participant.id, "resolution=day&from=2026-02-10T00:00:00.000Z&to=2026-02-11T00:00:00.000Z"), { headers }),
      params(s.participant.id),
    );
    expect(res.status).toBe(200);
    const body = consumptionResponseSchema.parse(await res.json());
    expect(body.points).toHaveLength(1);
    expect(body.points[0]).toMatchObject({ kwhTotal: "14.400", costCents: 504, hasGaps: false, isPreliminary: false });
    expect(body.previousPeriodKwh).toBe("10.000");
    expect(body.deltaToPreviousPeriodPct).toBe(44);
    expect(body.avgPriceCentsPerKwh).toBe(35);
  });

  it("Zeitraumbeschnitt: Vormieter sieht nur eigene Zeiträume, Nachmieter derselben Unit nie die Historie des Vormieters (§5.1/D-07)", async () => {
    // Vormieter A: Jan–Mär (beendet), Nachmieter B: ab April — DIESELBE Unit + Messstelle
    const a = await createResidentSetup({
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: new Date("2026-03-31T23:59:59.000Z"),
      status: "ENDED",
    });
    const b = await addParticipant({
      organizationId: a.organizationId,
      unitId: a.unit.id,
      tariffVersionId: a.tariffVersionId,
      validFrom: new Date("2026-04-01T00:00:00.000Z"),
    });
    await dayAggregate(a.meteringPoint.id, "2026-02-10T00:00:00.000Z", "12.000"); // Zeitraum des Vormieters
    await dayAggregate(a.meteringPoint.id, "2026-04-10T00:00:00.000Z", "9.000"); // Zeitraum des Nachmieters
    const q = "resolution=day&from=2026-01-01T00:00:00.000Z&to=2026-12-31T00:00:00.000Z";

    // Vormieter A (beendete Teilnahme bleibt lesbar): NUR Februar, to auf validTo beschnitten
    const resA = await consumptionGET(
      new Request(url(a.participant.id, q), { headers: await signInHeaders(a.email, a.password) }),
      params(a.participant.id),
    );
    expect(resA.status).toBe(200);
    const bodyA = consumptionResponseSchema.parse(await resA.json());
    expect(bodyA.points.map((p) => p.kwhTotal)).toEqual(["12.000"]);
    expect(bodyA.to).toBe("2026-03-31T23:59:59.000Z");

    // Nachmieter B: NUR April, from auf validFrom beschnitten
    const resB = await consumptionGET(
      new Request(url(b.participant.id, q), { headers: await signInHeaders(b.email, b.password) }),
      params(b.participant.id),
    );
    const bodyB = consumptionResponseSchema.parse(await resB.json());
    expect(bodyB.points.map((p) => p.kwhTotal)).toEqual(["9.000"]);
    expect(bodyB.from).toBe("2026-04-01T00:00:00.000Z");
  });

  it("Anfrage komplett außerhalb der Teilnahme ⇒ 200 mit leeren Punkten (403/leer-Regel, §5.4)", async () => {
    const a = await createResidentSetup({
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: new Date("2026-03-31T23:59:59.000Z"),
      status: "ENDED",
    });
    const res = await consumptionGET(
      new Request(url(a.participant.id, "resolution=day&from=2026-06-01T00:00:00.000Z&to=2026-07-01T00:00:00.000Z"), {
        headers: await signInHeaders(a.email, a.password),
      }),
      params(a.participant.id),
    );
    expect(res.status).toBe(200);
    expect(consumptionResponseSchema.parse(await res.json()).points).toEqual([]);
  });

  it("Authz-Negativ: fremder Kontext ⇒ 403; ungültige resolution ⇒ 422 VALIDATION_FAILED", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const foreign = await consumptionGET(
      new Request(url(b.participant.id, "resolution=day&from=2026-01-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z"), {
        headers: await signInHeaders(a.email, a.password),
      }),
      params(b.participant.id),
    );
    expect(foreign.status).toBe(403);

    const invalid = await consumptionGET(
      new Request(url(a.participant.id, "resolution=minute&from=2026-01-01T00:00:00.000Z&to=2026-02-01T00:00:00.000Z"), {
        headers: await signInHeaders(a.email, a.password),
      }),
      params(a.participant.id),
    );
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).error.code).toBe("VALIDATION_FAILED");
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/consumption.itest.ts
```
Erwartet: FAIL — `series.ts`/Route fehlen.

- [ ] **Step 3: Service `series.ts` implementieren**

`apps/platform/src/lib/app/series.ts`:

```ts
import { prisma } from "@ph360/database";
import { clampToScope, type ParticipantScope } from "@ph360/auth";
import {
  kwhToMilli,
  milliToKwh,
  toKwhString,
  type AppResolution,
  type ConsumptionResponse,
} from "@ph360/api-contracts";
import { findUnitPoint, savingsFor } from "./summary.js";

const RESOLUTION_MAP = { hour: "HOUR", day: "DAY", week: "WEEK", month: "MONTH", year: "YEAR" } as const;

/**
 * Zeitreihe ausschließlich aus ConsumptionAggregate (§3.3 Leseregel — nie DeviceReading).
 * from/to werden auf [validFrom, validTo] der Teilnahme beschnitten (§5.1); leerer
 * Schnitt ⇒ leere Punkte. Vorperioden-Vergleich über ein gleich langes Fenster davor.
 */
export async function getConsumptionSeries(
  scope: ParticipantScope,
  query: { resolution: AppResolution; from: Date; to: Date },
): Promise<ConsumptionResponse> {
  const clamped = clampToScope(scope, query.from, query.to);
  const point = await findUnitPoint(scope.unitId);
  if (!clamped || !point) {
    return {
      resolution: query.resolution,
      from: (clamped?.from ?? scope.validFrom).toISOString(),
      to: (clamped?.to ?? scope.validFrom).toISOString(),
      points: [],
      previousPeriodKwh: null,
      deltaToPreviousPeriodPct: null,
      avgPriceCentsPerKwh: null,
      savingsCents: null,
    };
  }
  const resolution = RESOLUTION_MAP[query.resolution];
  const rows = await prisma.consumptionAggregate.findMany({
    where: { meteringPointId: point.id, resolution, periodStart: { gte: clamped.from, lt: clamped.to } },
    orderBy: { periodStart: "asc" },
  });
  const totalMilli = rows.reduce((s, r) => s + kwhToMilli(r.kwhTotal.toFixed(3)), 0);
  const pvMilli = rows.some((r) => r.kwhPv !== null)
    ? rows.reduce((s, r) => s + (r.kwhPv ? kwhToMilli(r.kwhPv.toFixed(3)) : 0), 0)
    : null;
  const totalCost = rows.some((r) => r.costCents !== null) ? rows.reduce((s, r) => s + (r.costCents ?? 0), 0) : null;

  // Vorperiode: gleich langes Fenster unmittelbar davor, ebenfalls teilnahme-beschnitten
  const len = clamped.to.getTime() - clamped.from.getTime();
  const prevClamped = clampToScope(scope, new Date(clamped.from.getTime() - len), clamped.from);
  let previousPeriodKwh: string | null = null;
  let deltaToPreviousPeriodPct: number | null = null;
  if (prevClamped) {
    const prevRows = await prisma.consumptionAggregate.findMany({
      where: { meteringPointId: point.id, resolution, periodStart: { gte: prevClamped.from, lt: prevClamped.to } },
    });
    if (prevRows.length > 0) {
      const prevMilli = prevRows.reduce((s, r) => s + kwhToMilli(r.kwhTotal.toFixed(3)), 0);
      previousPeriodKwh = milliToKwh(prevMilli);
      if (prevMilli > 0) {
        deltaToPreviousPeriodPct = Math.round(((totalMilli - prevMilli) / prevMilli) * 1000) / 10;
      }
    }
  }

  return {
    resolution: query.resolution,
    from: clamped.from.toISOString(),
    to: clamped.to.toISOString(),
    points: rows.map((r) => ({
      periodStart: r.periodStart.toISOString(),
      kwhTotal: toKwhString(r.kwhTotal),
      kwhPv: r.kwhPv ? toKwhString(r.kwhPv) : null,
      kwhGrid: r.kwhGrid ? toKwhString(r.kwhGrid) : null,
      costCents: r.costCents,
      hasGaps: r.hasGaps,
      isPreliminary: r.isPreliminary,
    })),
    previousPeriodKwh,
    deltaToPreviousPeriodPct,
    avgPriceCentsPerKwh:
      totalCost !== null && totalMilli > 0 ? Math.round(((totalCost * 1000) / totalMilli) * 10) / 10 : null,
    savingsCents: await savingsFor(scope, pvMilli),
  };
}
```

- [ ] **Step 4: Route implementieren**

`apps/platform/src/app/api/v1/app/contexts/[id]/consumption/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumptionQuerySchema, consumptionResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";
import { requireParticipant } from "@/lib/app/scope";
import { getConsumptionSeries } from "@/lib/app/series";

export const runtime = "nodejs";

/** Zugriffsklasse: permission consumption.read_own, Scope: Teilnahme + Zeitraumbeschnitt (Spec §4.2). */
export const GET = appRoute(async (req, { params }) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(await params);
  const query = consumptionQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { scope } = await requireParticipant(req, id, "consumption.read_own");
  const body = await getConsumptionSeries(scope, {
    resolution: query.resolution,
    from: new Date(query.from),
    to: new Date(query.to),
  });
  return NextResponse.json(consumptionResponseSchema.parse(body));
});
```

- [ ] **Step 5: Test grün sehen + Commit**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/consumption.itest.ts
git add apps/platform/src/lib/app/series.ts "apps/platform/src/app/api/v1/app/contexts/[id]/consumption" apps/platform/src/app/api/v1/app/consumption.itest.ts
git commit -m "feat(platform): consumption-Zeitreihe — Aggregate-Lesepfad, Vorperioden-Vergleich, Vormieter-/Nachmieter-Zeitraumbeschnitt"
```
Erwartet: 4 Tests PASS (inkl. Zeitraumbeschnitt-Test Vormieter/Nachmieter derselben Unit).

---

## Task 13: Billing-Routen — `invoices` (Cursor-Pagination), `contract`, `documents/:id/download` (TDD)

**Files:**
- Create: `apps/platform/src/app/api/v1/app/contexts/[id]/invoices/route.ts`, `.../invoices/[invoiceId]/route.ts`, `.../contexts/[id]/contract/route.ts`, `apps/platform/src/app/api/v1/app/documents/[id]/download/route.ts`
- Test: `apps/platform/src/app/api/v1/app/billing.itest.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`apps/platform/src/app/api/v1/app/billing.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@ph360/database";
import { createResidentSetup, signInHeaders } from "@ph360/testing";
import {
  invoiceListResponseSchema,
  invoiceDetailResponseSchema,
  documentDownloadResponseSchema,
  contractResponseSchema,
} from "@ph360/api-contracts";
import { GET as invoicesGET } from "./contexts/[id]/invoices/route.js";
import { GET as invoiceDetailGET } from "./contexts/[id]/invoices/[invoiceId]/route.js";
import { GET as contractGET } from "./contexts/[id]/contract/route.js";
import { GET as downloadGET } from "./documents/[id]/download/route.js";

const base = "http://localhost:3100/api/v1/app";

async function createInvoiceWithDocument(s: Awaited<ReturnType<typeof createResidentSetup>>, n: number) {
  const document = await prisma.document.create({
    data: {
      organizationId: s.organizationId,
      contractId: s.contract.id,
      objectKey: `test/RE-${n}-${randomUUID()}.pdf`,
      fileName: `RE-${n}.pdf`,
      mimeType: "application/pdf",
    },
  });
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: s.organizationId,
      contractId: s.contract.id,
      number: `RE-T-${randomUUID()}`,
      periodStart: new Date(Date.UTC(2026, n, 1)),
      periodEnd: new Date(Date.UTC(2026, n + 1, 1)),
      totalCents: 4000 + n,
      status: "ISSUED",
      issuingEntityId: randomUUID(),
      documentId: document.id,
    },
  });
  return { document, invoice };
}

describe("GET /contexts/:id/invoices (+ Detail) — permission: invoice.read_own", () => {
  it("listet Rechnungen mit Cursor-Pagination (neueste zuerst)", async () => {
    const s = await createResidentSetup();
    await createInvoiceWithDocument(s, 0);
    await createInvoiceWithDocument(s, 1);
    const { invoice: newest } = await createInvoiceWithDocument(s, 2);
    const headers = await signInHeaders(s.email, s.password);

    const page1 = await invoicesGET(
      new Request(`${base}/contexts/${s.participant.id}/invoices?limit=2`, { headers }),
      { params: Promise.resolve({ id: s.participant.id }) },
    );
    expect(page1.status).toBe(200);
    const body1 = invoiceListResponseSchema.parse(await page1.json());
    expect(body1.items).toHaveLength(2);
    expect(body1.items[0]!.id).toBe(newest.id);
    expect(body1.nextCursor).not.toBeNull();

    const page2 = await invoicesGET(
      new Request(`${base}/contexts/${s.participant.id}/invoices?limit=2&cursor=${body1.nextCursor}`, { headers }),
      { params: Promise.resolve({ id: s.participant.id }) },
    );
    const body2 = invoiceListResponseSchema.parse(await page2.json());
    expect(body2.items).toHaveLength(1);
    expect(body2.nextCursor).toBeNull();
  });

  it("Detail liefert documentId; fremde Rechnung im eigenen Kontext ⇒ 404", async () => {
    const s = await createResidentSetup();
    const other = await createResidentSetup();
    const { invoice, document } = await createInvoiceWithDocument(s, 3);
    const { invoice: foreignInvoice } = await createInvoiceWithDocument(other, 3);
    const headers = await signInHeaders(s.email, s.password);

    const res = await invoiceDetailGET(
      new Request(`${base}/contexts/${s.participant.id}/invoices/${invoice.id}`, { headers }),
      { params: Promise.resolve({ id: s.participant.id, invoiceId: invoice.id }) },
    );
    expect(res.status).toBe(200);
    expect(invoiceDetailResponseSchema.parse(await res.json()).documentId).toBe(document.id);

    const miss = await invoiceDetailGET(
      new Request(`${base}/contexts/${s.participant.id}/invoices/${foreignInvoice.id}`, { headers }),
      { params: Promise.resolve({ id: s.participant.id, invoiceId: foreignInvoice.id }) },
    );
    expect(miss.status).toBe(404);
    expect((await miss.json()).error.code).toBe("NOT_FOUND");
  });

  it("Authz-Negativ: fremder Kontext ⇒ 403", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const res = await invoicesGET(
      new Request(`${base}/contexts/${b.participant.id}/invoices`, { headers: await signInHeaders(a.email, a.password) }),
      { params: Promise.resolve({ id: b.participant.id }) },
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /contexts/:id/contract — permission: contract.read_own", () => {
  it("liefert Vertrags- und Tarifdaten des Kontexts", async () => {
    const s = await createResidentSetup();
    const res = await contractGET(
      new Request(`${base}/contexts/${s.participant.id}/contract`, { headers: await signInHeaders(s.email, s.password) }),
      { params: Promise.resolve({ id: s.participant.id }) },
    );
    expect(res.status).toBe(200);
    const body = contractResponseSchema.parse(await res.json());
    expect(body.contractNumber).toBe(s.contract.contractNumber);
    expect(body.tariff.workPriceGridCents).toBe(35);
  });

  it("Authz-Negativ: fremder Kontext ⇒ 403", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const res = await contractGET(
      new Request(`${base}/contexts/${b.participant.id}/contract`, { headers: await signInHeaders(a.email, a.password) }),
      { params: Promise.resolve({ id: b.participant.id }) },
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /documents/:id/download — permission: document.read_own + Audit (§3.3 d)", () => {
  it("liefert kurzlebige signierte URL und schreibt AuditEvent document.downloaded", async () => {
    const s = await createResidentSetup();
    const { document } = await createInvoiceWithDocument(s, 4);
    const res = await downloadGET(
      new Request(`${base}/documents/${document.id}/download`, { headers: await signInHeaders(s.email, s.password) }),
      { params: Promise.resolve({ id: document.id }) },
    );
    expect(res.status).toBe(200);
    const body = documentDownloadResponseSchema.parse(await res.json());
    expect(body.url).toContain(encodeURI(document.objectKey));
    expect(body.mimeType).toBe("application/pdf");

    const audits = await prisma.auditEvent.findMany({
      where: { action: "document.downloaded", subjectId: document.id, actorId: s.user.id },
    });
    expect(audits).toHaveLength(1);
  });

  it("Authz-Negativ: fremdes Dokument ⇒ 403 (auch bei existierender ID — kein ID-Probing)", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const { document } = await createInvoiceWithDocument(b, 5);
    const res = await downloadGET(
      new Request(`${base}/documents/${document.id}/download`, { headers: await signInHeaders(a.email, a.password) }),
      { params: Promise.resolve({ id: document.id }) },
    );
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/billing.itest.ts
```
Erwartet: FAIL — Routen fehlen.

- [ ] **Step 3: Invoice-Routen implementieren**

`apps/platform/src/app/api/v1/app/contexts/[id]/invoices/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ph360/database";
import { invoiceListQuerySchema, invoiceListResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";
import { requireParticipant } from "@/lib/app/scope";

export const runtime = "nodejs";

/** Zugriffsklasse: permission invoice.read_own, Scope: Vertrag des Kontexts (Spec §4.2). */
export const GET = appRoute(async (req, { params }) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(await params);
  const query = invoiceListQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { scope } = await requireParticipant(req, id, "invoice.read_own");
  const rows = await prisma.invoice.findMany({
    where: { contract: { participantId: scope.participantId } },
    orderBy: [{ periodStart: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, query.limit);
  const body = invoiceListResponseSchema.parse({
    items: page.map((i) => ({
      id: i.id,
      number: i.number,
      periodStart: i.periodStart.toISOString(),
      periodEnd: i.periodEnd.toISOString(),
      totalCents: i.totalCents,
      status: i.status,
    })),
    nextCursor: rows.length > query.limit ? page[page.length - 1]!.id : null,
  });
  return NextResponse.json(body);
});
```

`apps/platform/src/app/api/v1/app/contexts/[id]/invoices/[invoiceId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ph360/database";
import { invoiceDetailResponseSchema } from "@ph360/api-contracts";
import { appRoute, NotFoundError } from "@/lib/app/respond";
import { requireParticipant } from "@/lib/app/scope";

export const runtime = "nodejs";

/** Zugriffsklasse: permission invoice.read_own, Scope: Vertrag des Kontexts (Spec §4.2). */
export const GET = appRoute(async (req, { params }) => {
  const p = z.object({ id: z.string().uuid(), invoiceId: z.string().uuid() }).parse(await params);
  const { scope } = await requireParticipant(req, p.id, "invoice.read_own");
  const invoice = await prisma.invoice.findFirst({
    where: { id: p.invoiceId, contract: { participantId: scope.participantId } },
  });
  if (!invoice) throw new NotFoundError();
  const body = invoiceDetailResponseSchema.parse({
    id: invoice.id,
    number: invoice.number,
    periodStart: invoice.periodStart.toISOString(),
    periodEnd: invoice.periodEnd.toISOString(),
    totalCents: invoice.totalCents,
    status: invoice.status,
    documentId: invoice.documentId,
  });
  return NextResponse.json(body);
});
```

- [ ] **Step 4: Contract- + Download-Route implementieren**

`apps/platform/src/app/api/v1/app/contexts/[id]/contract/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ph360/database";
import { contractResponseSchema } from "@ph360/api-contracts";
import { appRoute, NotFoundError } from "@/lib/app/respond";
import { requireParticipant } from "@/lib/app/scope";

export const runtime = "nodejs";

/** Zugriffsklasse: permission contract.read_own, Scope: Vertrag des Kontexts (read-only V1, Spec §4.2). */
export const GET = appRoute(async (req, { params }) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(await params);
  const { scope } = await requireParticipant(req, id, "contract.read_own");
  const contract = await prisma.contract.findFirst({
    where: { participantId: scope.participantId },
    orderBy: { startAt: "desc" },
    include: { tariffVersion: { include: { tariff: true } } },
  });
  if (!contract) throw new NotFoundError();
  const body = contractResponseSchema.parse({
    contractNumber: contract.contractNumber,
    status: contract.status,
    startAt: contract.startAt.toISOString(),
    endAt: contract.endAt?.toISOString() ?? null,
    tariff: {
      name: contract.tariffVersion.tariff.name,
      validFrom: contract.tariffVersion.validFrom.toISOString(),
      workPricePvCents: contract.tariffVersion.workPricePvCents,
      workPriceGridCents: contract.tariffVersion.workPriceGridCents,
      basePriceCents: contract.tariffVersion.basePriceCents,
    },
  });
  return NextResponse.json(body);
});
```

`apps/platform/src/app/api/v1/app/documents/[id]/download/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ph360/database";
import { AuthzError, recordAudit, requirePermission } from "@ph360/auth";
import { documentDownloadResponseSchema } from "@ph360/api-contracts";
import { appRoute } from "@/lib/app/respond";
import { requireSession } from "@/lib/app/scope";
import { getDocumentDownloadUrl } from "@/lib/app/storage";

export const runtime = "nodejs";

/**
 * Zugriffsklasse: permission document.read_own, Scope: Document-Scope-Anker (Spec §3.3):
 * contract/participant ⇒ nur zugehöriger Teilnehmer · unit ⇒ Teilnehmer der Unit im
 * Gültigkeitszeitraum · building ⇒ alle aktiven Teilnehmer des Gebäudes.
 * Unbekannte und fremde IDs antworten einheitlich 403 (kein ID-Probing). Download wird auditiert.
 */
export const GET = appRoute(async (req, { params, requestId }) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(await params);
  const ctx = await requireSession(req);
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new AuthzError("Outside document scope");
  const participants = await prisma.powerParticipant.findMany({
    where: { userId: ctx.userId },
    include: { unit: { select: { buildingId: true } } },
  });
  const allowed = participants.some((p) => {
    if (doc.participantId) return doc.participantId === p.id;
    if (doc.contractId) return p.contractId === doc.contractId;
    if (doc.unitId) {
      return (
        p.unitId === doc.unitId &&
        p.validFrom <= doc.createdAt &&
        (p.validTo === null || doc.createdAt <= p.validTo)
      );
    }
    if (doc.buildingId) return p.unit.buildingId === doc.buildingId && p.status === "ACTIVE";
    return false;
  });
  if (!allowed) throw new AuthzError("Outside document scope");
  await requirePermission(ctx, "document.read_own", { organizationId: doc.organizationId });

  const { url, expiresAt } = await getDocumentDownloadUrl(doc.objectKey, doc.fileName);
  await recordAudit(prisma, {
    action: "document.downloaded",
    subjectType: "Document",
    subjectId: doc.id,
    actorType: "USER",
    actorId: ctx.userId,
    organizationId: doc.organizationId,
    requestId,
  });
  const body = documentDownloadResponseSchema.parse({
    url,
    expiresAt: expiresAt.toISOString(),
    fileName: doc.fileName,
    mimeType: doc.mimeType,
  });
  return NextResponse.json(body);
});
```

- [ ] **Step 5: Test grün sehen + Commit**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/billing.itest.ts
git add apps/platform/src/app/api/v1/app
git commit -m "feat(platform): Billing-Routen — invoices mit Cursor-Pagination, contract, auditierter Dokument-Download"
```
Erwartet: 7 Tests PASS.

---

## Task 14: Settings-/Push-/Support-Routen (TDD)

**Files:**
- Create: `apps/platform/src/app/api/v1/app/notification-preferences/route.ts`, `apps/platform/src/app/api/v1/app/push-devices/route.ts`, `apps/platform/src/app/api/v1/app/support/messages/route.ts`
- Test: `apps/platform/src/app/api/v1/app/settings-support.itest.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`apps/platform/src/app/api/v1/app/settings-support.itest.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { createResidentSetup, signInHeaders } from "@ph360/testing";
import { notificationPreferencesResponseSchema, supportMessageResponseSchema } from "@ph360/api-contracts";
import { GET as prefsGET, PUT as prefsPUT } from "./notification-preferences/route.js";
import { POST as pushPOST, DELETE as pushDELETE } from "./push-devices/route.js";
import { POST as supportPOST } from "./support/messages/route.js";

const base = "http://localhost:3100/api/v1/app";
const noParams = { params: Promise.resolve({}) };
const json = (method: string, body: unknown, headers: Headers) =>
  new Request(`${base}/x`, { method, headers: new Headers([...headers, ["content-type", "application/json"]]), body: JSON.stringify(body) });

describe("GET/PUT /notification-preferences — permission: notification.manage_own", () => {
  it("liefert alle 5 Kategorien, INCIDENT ist locked; PUT persistiert Abwahl", async () => {
    const s = await createResidentSetup();
    const headers = await signInHeaders(s.email, s.password);

    const res = await prefsGET(new Request(`${base}/notification-preferences`, { headers }), noParams);
    expect(res.status).toBe(200);
    const body = notificationPreferencesResponseSchema.parse(await res.json());
    expect(body.categories).toHaveLength(5);
    expect(body.categories.find((c) => c.category === "INCIDENT")).toMatchObject({ enabled: true, locked: true });
    expect(body.categories.every((c) => c.enabled)).toBe(true); // Default an

    const put = await prefsPUT(json("PUT", { category: "BILLING", enabled: false }, headers), noParams);
    expect(put.status).toBe(200);
    const after = notificationPreferencesResponseSchema.parse(await (await prefsGET(new Request(`${base}/notification-preferences`, { headers }), noParams)).json());
    expect(after.categories.find((c) => c.category === "BILLING")?.enabled).toBe(false);
  });

  it("INCIDENT (Priorität 3) ist NICHT abwählbar ⇒ 422 VALIDATION_FAILED (§3.3)", async () => {
    const s = await createResidentSetup();
    const headers = await signInHeaders(s.email, s.password);
    const res = await prefsPUT(json("PUT", { category: "INCIDENT", enabled: false }, headers), noParams);
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("Authz-Negativ: ohne Session ⇒ 401", async () => {
    const res = await prefsGET(new Request(`${base}/notification-preferences`), noParams);
    expect(res.status).toBe(401);
  });
});

describe("POST/DELETE /push-devices — permission: notification.manage_own + Audit (§5.4)", () => {
  it("registriert und entfernt Expo-Push-Token inkl. AuditEvents", async () => {
    const s = await createResidentSetup();
    const headers = await signInHeaders(s.email, s.password);
    const token = `ExponentPushToken[test-${Date.now()}]`;

    const post = await pushPOST(json("POST", { expoPushToken: token, platform: "ios", appVersion: "1.0.0" }, headers), noParams);
    expect(post.status).toBe(201);
    expect(await prisma.pushDevice.findUnique({ where: { expoPushToken: token } })).toMatchObject({ userId: s.user.id, platform: "IOS" });

    const del = await pushDELETE(json("DELETE", { expoPushToken: token }, headers), noParams);
    expect(del.status).toBe(200);
    expect(await prisma.pushDevice.findUnique({ where: { expoPushToken: token } })).toBeNull();

    const audits = await prisma.auditEvent.findMany({ where: { subjectType: "PushDevice", actorId: s.user.id } });
    expect(audits.map((a) => a.action).sort()).toEqual(["push_device.registered", "push_device.removed"]);
  });

  it("Authz-Negativ: ohne Session ⇒ 401", async () => {
    const res = await pushPOST(
      new Request(`${base}/push-devices`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expoPushToken: "x", platform: "ios", appVersion: "1" }) }),
      noParams,
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /support/messages — permission: support.create_own", () => {
  it("legt Outbox-Event support.message_created an (Worker mailt an Service)", async () => {
    const s = await createResidentSetup();
    const headers = await signInHeaders(s.email, s.password);
    const res = await supportPOST(json("POST", { subject: "Frage zur Rechnung", body: "Bitte um Rückruf.", contextId: s.participant.id }, headers), noParams);
    expect(res.status).toBe(201);
    expect(supportMessageResponseSchema.parse(await res.json()).received).toBe(true);

    const events = await prisma.domainEvent.findMany({ where: { eventType: "support.message_created", aggregateId: s.user.id } });
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ subject: "Frage zur Rechnung", participantId: s.participant.id });
  });

  it("Authz-Negativ: fremder contextId ⇒ 403, kein Event", async () => {
    const a = await createResidentSetup();
    const b = await createResidentSetup();
    const headers = await signInHeaders(a.email, a.password);
    const res = await supportPOST(json("POST", { subject: "x", body: "y", contextId: b.participant.id }, headers), noParams);
    expect(res.status).toBe(403);
    expect(await prisma.domainEvent.count({ where: { eventType: "support.message_created" } })).toBe(0);
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/settings-support.itest.ts
```
Erwartet: FAIL — Routen fehlen.

- [ ] **Step 3: Routen implementieren**

`apps/platform/src/app/api/v1/app/notification-preferences/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@ph360/database";
import {
  notificationPreferencePutSchema,
  notificationPreferencesResponseSchema,
  type AppNotificationCategory,
} from "@ph360/api-contracts";
import { appRoute, errorResponse } from "@/lib/app/respond";
import { requireSession, requireAppPermission } from "@/lib/app/scope";

export const runtime = "nodejs";

const ALL_CATEGORIES: AppNotificationCategory[] = ["BILLING", "DATA_QUALITY", "INCIDENT", "SERVICE", "CONTRACT"];
const LOCKED: AppNotificationCategory = "INCIDENT"; // Priorität 3 — nicht abwählbar (§3.3)

/** Zugriffsklasse: permission notification.manage_own (Spec §4.2). */
export const GET = appRoute(async (req) => {
  const ctx = await requireSession(req);
  await requireAppPermission(ctx, "notification.manage_own");
  const prefs = await prisma.notificationPreference.findMany({ where: { userId: ctx.userId } });
  const body = notificationPreferencesResponseSchema.parse({
    categories: ALL_CATEGORIES.map((category) => ({
      category,
      enabled: category === LOCKED ? true : (prefs.find((p) => p.category === category)?.enabled ?? true),
      locked: category === LOCKED,
    })),
  });
  return NextResponse.json(body);
});

export const PUT = appRoute(async (req, { requestId }) => {
  const ctx = await requireSession(req);
  await requireAppPermission(ctx, "notification.manage_own");
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "Ungültiger JSON-Body.", requestId, 422);
  }
  const body = notificationPreferencePutSchema.parse(raw);
  if (body.category === LOCKED && !body.enabled) {
    return errorResponse("VALIDATION_FAILED", "Kritische Störungsmeldungen sind nicht abwählbar.", requestId, 422);
  }
  await prisma.notificationPreference.upsert({
    where: { userId_category: { userId: ctx.userId, category: body.category } },
    update: { enabled: body.enabled },
    create: { userId: ctx.userId, category: body.category, enabled: body.enabled },
  });
  return NextResponse.json({ ok: true });
});
```

`apps/platform/src/app/api/v1/app/push-devices/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@ph360/database";
import { recordAudit } from "@ph360/auth";
import { pushDeviceCreateSchema, pushDeviceDeleteSchema } from "@ph360/api-contracts";
import { appRoute, errorResponse } from "@/lib/app/respond";
import { requireSession, requireAppPermission } from "@/lib/app/scope";

export const runtime = "nodejs";

/** Zugriffsklasse: permission notification.manage_own; Token-Änderungen werden auditiert (§5.4). */
export const POST = appRoute(async (req, { requestId }) => {
  const ctx = await requireSession(req);
  await requireAppPermission(ctx, "notification.manage_own");
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "Ungültiger JSON-Body.", requestId, 422);
  }
  const body = pushDeviceCreateSchema.parse(raw);
  const platform = body.platform === "ios" ? ("IOS" as const) : ("ANDROID" as const);
  await prisma.pushDevice.upsert({
    where: { expoPushToken: body.expoPushToken },
    update: { userId: ctx.userId, platform, appVersion: body.appVersion },
    create: { userId: ctx.userId, expoPushToken: body.expoPushToken, platform, appVersion: body.appVersion },
  });
  await recordAudit(prisma, {
    action: "push_device.registered",
    subjectType: "PushDevice",
    subjectId: body.expoPushToken,
    actorType: "USER",
    actorId: ctx.userId,
    requestId,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = appRoute(async (req, { requestId }) => {
  const ctx = await requireSession(req);
  await requireAppPermission(ctx, "notification.manage_own");
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "Ungültiger JSON-Body.", requestId, 422);
  }
  const body = pushDeviceDeleteSchema.parse(raw);
  await prisma.pushDevice.deleteMany({ where: { expoPushToken: body.expoPushToken, userId: ctx.userId } });
  await recordAudit(prisma, {
    action: "push_device.removed",
    subjectType: "PushDevice",
    subjectId: body.expoPushToken,
    actorType: "USER",
    actorId: ctx.userId,
    requestId,
  });
  return NextResponse.json({ ok: true });
});
```

`apps/platform/src/app/api/v1/app/support/messages/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma, Prisma } from "@ph360/database";
import { assertParticipantScope } from "@ph360/auth";
import { supportMessageCreateSchema, supportMessageResponseSchema } from "@ph360/api-contracts";
import { appRoute, errorResponse } from "@/lib/app/respond";
import { requireSession, requireAppPermission } from "@/lib/app/scope";

export const runtime = "nodejs";

/**
 * Zugriffsklasse: permission support.create_own (Spec §4.2). Auch V1-Kanal für
 * DSGVO-Auskunfts-/Exportanfragen. Erzeugt NUR ein Outbox-Event — Mail-Versand
 * übernimmt der Worker (support.message_created).
 */
export const POST = appRoute(async (req, { requestId }) => {
  const ctx = await requireSession(req);
  await requireAppPermission(ctx, "support.create_own");
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "Ungültiger JSON-Body.", requestId, 422);
  }
  const body = supportMessageCreateSchema.parse(raw);
  let participantId: string | null = null;
  let organizationId: string | null = null;
  if (body.contextId) {
    const scope = await assertParticipantScope(ctx, body.contextId);
    participantId = scope.participantId;
    organizationId = scope.organizationId;
  }
  await prisma.domainEvent.create({
    data: {
      eventType: "support.message_created",
      aggregateType: "SupportMessage",
      aggregateId: ctx.userId,
      organizationId,
      correlationId: requestId,
      payload: {
        userId: ctx.userId,
        email: ctx.email,
        subject: body.subject,
        body: body.body,
        participantId,
      } as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json(supportMessageResponseSchema.parse({ received: true }), { status: 201 });
});
```

- [ ] **Step 4: Test grün sehen + Commit**

```bash
pnpm test:integration -- apps/platform/src/app/api/v1/app/settings-support.itest.ts
git add apps/platform/src/app/api/v1/app
git commit -m "feat(platform): notification-preferences (INCIDENT gesperrt), push-devices mit Audit, Support-Anfrage via Outbox"
```
Erwartet: 7 Tests PASS.

---

## Task 15: Tarif-/Pilotdaten-Seed — Testtarif, 2 PowerParticipants, Contract, Rechnungs-Dummy + Seed-PDF in MinIO + Resident-Login-Seed (`db:seed:app`)

**Files:**
- Modify: `packages/database/prisma/seed.ts`, `packages/database/package.json` (devDependency `minio`), Root-`package.json` (Script `db:seed:app`)
- Create: `scripts/seed-app.ts` (Root — better-auth-Resident-User, analog `scripts/create-admin.ts` aus WP-1.2)

- [ ] **Step 1: Dependency + Seed-Funktion**

`packages/database/package.json` `devDependencies` ergänzen: `"minio": "^8.0.3"`, dann `pnpm install`.

In `packages/database/prisma/seed.ts` oben ergänzen:

```ts
import { Client as MinioClient } from "minio";
```

und am Dateiende folgende Funktion anfügen; ihr Aufruf `await seedResidentDomain();` wird als LETZTE Zeile in die bestehende `main()`/Seed-Sequenz eingehängt (nach dem WP-1.3-/WP-APP-1-Seed, da Testmandant + Units + Gebäude existieren müssen):

```ts
/**
 * WP-APP-2 (R-A5): Pilottarif als Daten (ADR-005), 2 Test-PowerParticipants (zunächst ohne
 * User — `pnpm db:seed:app` verknüpft resident@test.powerhouse360.de mit dem ersten
 * Teilnehmer; echte Pilotbewohner kommen per Invitation), Contracts, Rechnungs-Dummy mit
 * Seed-PDF in MinIO. Idempotent (Upserts/find-or-create) — mehrfacher Seed ist sicher.
 * Läuft ausschließlich gegen den Testmandanten (ADR-006).
 */
async function seedResidentDomain(): Promise<void> {
  const testOrg = await prisma.organization.findFirstOrThrow({ where: { name: "Testmandant" } });
  const building = await prisma.building.findFirstOrThrow({
    where: { property: { organizationId: testOrg.id } },
  });
  const units = await prisma.unit.findMany({
    where: { buildingId: building.id },
    orderBy: { label: "asc" },
    take: 2,
  });
  if (units.length < 2) {
    throw new Error("Seed erwartet ≥ 2 Units im Testmandant-Gebäude (WP-1.3-Seed zuerst ausführen)");
  }

  // Tarif (Preise als Daten, nie Code — ADR-005)
  let tariff = await prisma.tariff.findFirst({ where: { organizationId: testOrg.id, name: "Powermieter Pilot" } });
  tariff ??= await prisma.tariff.create({ data: { organizationId: testOrg.id, name: "Powermieter Pilot" } });
  const tariffVersion = await prisma.tariffVersion.upsert({
    where: { tariffId_validFrom: { tariffId: tariff.id, validFrom: new Date("2026-01-01T00:00:00.000Z") } },
    update: { workPricePvCents: 27, workPriceGridCents: 39, basePriceCents: 995 },
    create: {
      tariffId: tariff.id,
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      workPricePvCents: 27,
      workPriceGridCents: 39,
      basePriceCents: 995,
    },
  });
  await prisma.meteringConcept.upsert({
    where: { buildingId: building.id },
    update: { splitCalculable: true },
    create: { organizationId: testOrg.id, buildingId: building.id, splitCalculable: true },
  });

  // 2 Teilnehmer + Verträge (issuingEntityId: fixer Platzhalter bis IssuingEntity-Modell, WP-1.2-V2)
  const issuingEntityId = "00000000-0000-4000-8000-000000000001";
  const contractNumbers = ["PM-2026-0001", "PM-2026-0002"] as const;
  const created: { participantId: string; contractId: string }[] = [];
  for (let i = 0; i < 2; i++) {
    const unit = units[i]!;
    let participant = await prisma.powerParticipant.findFirst({ where: { unitId: unit.id } });
    participant ??= await prisma.powerParticipant.create({
      data: {
        organizationId: testOrg.id,
        unitId: unit.id,
        status: "ACTIVE",
        validFrom: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    const contract = await prisma.contract.upsert({
      where: { contractNumber: contractNumbers[i]! },
      update: {},
      create: {
        organizationId: testOrg.id,
        contractNumber: contractNumbers[i]!,
        participantId: participant.id,
        unitId: unit.id,
        tariffVersionId: tariffVersion.id,
        status: "ACTIVE",
        startAt: new Date("2026-01-01T00:00:00.000Z"),
        issuingEntityId,
      },
    });
    await prisma.powerParticipant.update({ where: { id: participant.id }, data: { contractId: contract.id } });
    created.push({ participantId: participant.id, contractId: contract.id });
  }

  // Seed-PDF nach MinIO (docker compose muss laufen — bewusst KEIN try/catch: Seed-PDF ist Pflicht)
  const bucket = process.env.MINIO_BUCKET_DOCUMENTS ?? "ph360-documents";
  const objectKey = "seed/RE-2026-0001.pdf";
  const minio = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  });
  if (!(await minio.bucketExists(bucket))) await minio.makeBucket(bucket);
  const pdf = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
      "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n" +
      "trailer<</Size 4/Root 1 0 R>>\n%%EOF\n",
    "utf8",
  );
  await minio.putObject(bucket, objectKey, pdf, pdf.length, { "Content-Type": "application/pdf" });

  // Rechnungs-Dummy am ersten Vertrag
  const first = created[0]!;
  let document = await prisma.document.findFirst({ where: { objectKey } });
  document ??= await prisma.document.create({
    data: {
      organizationId: testOrg.id,
      contractId: first.contractId,
      objectKey,
      fileName: "RE-2026-0001.pdf",
      mimeType: "application/pdf",
    },
  });
  await prisma.invoice.upsert({
    where: { number: "RE-2026-0001" },
    update: {},
    create: {
      organizationId: testOrg.id,
      contractId: first.contractId,
      number: "RE-2026-0001",
      periodStart: new Date("2026-01-01T00:00:00.000Z"),
      periodEnd: new Date("2026-03-31T23:59:59.000Z"),
      totalCents: 12934,
      status: "ISSUED",
      issuingEntityId,
      documentId: document.id,
    },
  });
  console.log("[seed] WP-APP-2: Pilottarif, 2 PowerParticipants, Contracts, Rechnungs-Dummy + Seed-PDF angelegt");
}
```

> Hinweis: Feldpfad `building.property.organizationId` folgt dem WP-1.3-Schema; weicht der Relationsname ab, nur die Lookup-Query anpassen (Vorbedingungs-Regel).

- [ ] **Step 2: Resident-Login-Seed als Root-Script `db:seed:app`**

Der better-auth-User kann nicht in `packages/database/prisma/seed.ts` angelegt werden (Zyklus: `@ph360/auth` hängt von `@ph360/database`). Deshalb — analog `scripts/create-admin.ts` aus WP-1.2 — ein Root-Script. `scripts/seed-app.ts` (neu):

```ts
import { prisma } from "@ph360/database";
import { auth } from "@ph360/auth";

const EMAIL = "resident@test.powerhouse360.de";
const PASSWORD = "Test1234!powerhouse";

/**
 * App-Seed (WP-APP-2): legt den Test-Bewohner als better-auth-User an (echte
 * Credential-Session für App-Login), gibt ihm eine OrganizationMembership
 * (RESIDENT) im Testmandanten und verknüpft ihn via PowerParticipant.userId mit
 * dem ersten Seed-Teilnehmer (Vertrag PM-2026-0001). Idempotent — mehrfacher
 * Lauf ist sicher. Voraussetzung: `pnpm db:seed` ist gelaufen.
 */
async function main() {
  const org = await prisma.organization.findFirstOrThrow({ where: { name: "Testmandant" } });
  const contract = await prisma.contract.findUniqueOrThrow({ where: { contractNumber: "PM-2026-0001" } });

  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    // user.create.before verlangt eine offene Invitation (WP-1.2) — Bootstrap-Invitation wie in create-admin.ts.
    await prisma.invitation.create({
      data: {
        email: EMAIL,
        organizationId: org.id,
        role: "RESIDENT",
        token: `seed-app-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    const res = await auth.api.signUpEmail({ body: { email: EMAIL, password: PASSWORD, name: "Test Bewohner" } });
    user = await prisma.user.update({ where: { id: res.user.id }, data: { emailVerified: true } });
  }

  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: "RESIDENT", status: "ACTIVE" },
    create: { userId: user.id, organizationId: org.id, role: "RESIDENT" },
  });

  await prisma.powerParticipant.update({
    where: { id: contract.participantId },
    data: { userId: user.id },
  });

  console.log(`[seed:app] ${EMAIL} ist RESIDENT im Testmandanten und mit Teilnehmer ${contract.participantId} verknüpft`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[seed:app] failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Root-`package.json` — in `scripts` NUR diese eine Zeile ergänzen (direkt nach `"db:seed"`), Rest unverändert:

```json
"db:seed:app": "tsx scripts/seed-app.ts",
```

> Hinweis: Weicht der WP-1.2-Hook-/Invitation-Mechanismus ab (z. B. kein `user.create.before`-Guard oder anderes Invitation-Feldset), NUR den Bootstrap-Invitation-Block an `scripts/create-admin.ts` angleichen — Ziel-Zustand (User + RESIDENT-Membership + `PowerParticipant.userId`) bleibt unverändert.

- [ ] **Step 3: Seed ausführen + verifizieren**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
docker compose up -d --wait
set -a; . ./.env; set +a
pnpm db:seed
pnpm db:seed       # zweiter Lauf beweist Idempotenz
pnpm db:seed:app
pnpm db:seed:app   # zweiter Lauf beweist Idempotenz
```
Erwartet: beide `db:seed`-Läufe enden mit `[seed] WP-APP-2: …`, beide `db:seed:app`-Läufe mit `[seed:app] resident@test.powerhouse360.de …`; keine Unique-Fehler. Verifikation:
```bash
docker compose exec postgres psql -U ph360 -d ph360 -c \
  "SELECT count(*) FROM power_participant; SELECT number, \"totalCents\" FROM invoice; \
   SELECT p.\"userId\" IS NOT NULL AS linked FROM power_participant p \
   JOIN contract c ON c.\"participantId\" = p.id WHERE c.\"contractNumber\" = 'PM-2026-0001';"
```
Erwartet: ≥ 2 Teilnehmer; Rechnung `RE-2026-0001` mit 12934 Cent; `linked = t` (Resident-User verknüpft).

- [ ] **Step 4: Commit**

```bash
git add packages/database scripts/seed-app.ts package.json
git commit -m "feat(db): Pilotdaten-Seed — Pilottarif, 2 Test-Teilnehmer, Rechnungs-Dummy mit Seed-PDF + Resident-Login-Seed db:seed:app (R-A5)"
```

---

## Task 16: Gate F-APP-1 (API) — Gesamtlauf, Log, Masterplan-Pflege

**Files:**
- Modify: `docs/IMPLEMENTATION_LOG.md`, `docs/POWERHOUSE_360_MASTER_PLAN.md`, `docs/EXECUTION_ROADMAP.md` (Statuszeilen)

- [ ] **Step 1: Gesamte Suite + Typechecks grün**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
docker compose up -d --wait
pnpm test:unit
pnpm test:integration
pnpm typecheck
```
Erwartet: alle Unit- und Integrationstests PASS (inkl. WP-1.2/WP-APP-1-Bestand — keine Regression), Typecheck über alle Pakete ohne Fehler.

- [ ] **Step 2: Gate-Nachweis F-APP-1 (API) dokumentieren**

Das Gate ist durch folgende Integrationstests belegt (testgestützter Nutzerfluss; Statusregel §9):
1. **Bewohner-Login → eigene Daten:** `app-core.itest.ts` (echte better-auth-Session via `signInHeaders` → `/me` → Contexts; `summary`/`data-status` mit `consumption.read_own`), `consumption.itest.ts`, `billing.itest.ts` (Rechnung + auditierter PDF-Download), `settings-support.itest.ts`.
2. **Negativmatrix (§5.4):** fremder Kontext ⇒ 403 (summary, data-status, consumption, invoices, contract, download, support-contextId) · ohne Session ⇒ 401 · Rolle ohne Permission (PARKING_USER) ⇒ 403 · Zugriff außerhalb `[validFrom, validTo]` ⇒ leere Daten (consumption-Clamp-Test) · `*_own` exklusiv für RESIDENT (`can.test.ts`).
3. **Aggregationskette:** `recompute.itest.ts` + `scenario.itest.ts` (Hub-Simulator-Profile: normal, Lücke, Zählerwechsel).

Zusätzlich manueller Smoke gegen den Dev-Server (dokumentieren, nicht skripten):
```bash
pnpm platform:dev   # Port 3100
curl -s http://localhost:3100/api/v1/app/config | head -c 300
```
Erwartet: 200 mit `minAppVersion`/URLs; ein Aufruf von `/api/v1/app/me` ohne Cookie liefert den 401-Envelope.

- [ ] **Step 3: IMPLEMENTATION_LOG-Eintrag (append-only)**

An `docs/IMPLEMENTATION_LOG.md` anfügen (Datum = Ausführungstag):

```markdown
## <YYYY-MM-DD> — WP-APP-2: Bewohner-Fachmodell, Aggregation, App-API (F-APP-1 API grün)

- Prisma: 12 Modelle Ausbaustufe C (PowerParticipant…PushDevice) + Migration `wp_app_2_resident_domain` (CHECK: Document genau eine Referenz, priority 1–5).
- permissions: 7 `*_own`-Permissions, exklusiv RESIDENT (Negativmatrix-Test über alle 12 Rollen).
- auth: `assertParticipantScope` + `clampToScope` (Teilnahme-Scope, Vormieter-/Nachmieter-Trennung, beendete Teilnahmen lesbar).
- worker: serverseitige Delta-Ableitung (inkl. MeterChange-Formel), UTC-Bucketing HOUR→YEAR, PV-Allocation + EnergyAllocation, ConsumptionAggregate-Upserts (hasGaps/isPreliminary), Handler-Kette hinter `device.telemetry_received`, `support.message_created`-Mail.
- api-contracts: alle §4.2-App-Contracts (Zod) + kWh-Milli-Helfer.
- platform: 12 `/api/v1/app/*`-Routen (Zugriffsklassen public|session|permission, Fehler-Envelope, Cursor-Pagination, auditierter MinIO-Download).
- Seed: Pilottarif 27/39/995, 2 Test-PowerParticipants, Contracts PM-2026-000x, Rechnung RE-2026-0001 + Seed-PDF in MinIO.
- Tests: je App-Route ≥ 1 Positiv + 1 Authz-Negativ; Zeitraumbeschnitt-Test; Aggregations-Szenariotests gegen Hub-Simulator-Profile. Suiten: `pnpm test:unit` + `pnpm test:integration` grün.
- Nicht getestet: Web-Browser-E2E gegen laufenden Server (nur curl-Smoke auf config/me) — vollständiges F-APP-1-E2E folgt in WP-APP-4 gegen Staging.
```

- [ ] **Step 4: Masterplan-/Roadmap-Statuspflege**

- `docs/POWERHOUSE_360_MASTER_PLAN.md`: WP-APP-2 auf 🟢 setzen, Gate **F-APP-1 (API)** als testgestützt-grün mit Verweis auf den Log-Eintrag markieren (F-APP-1 (E2E) bleibt offen → WP-APP-4).
- `docs/EXECUTION_ROADMAP.md`: WP-APP-2-Schritte abhaken; nächster Schritt WP-APP-3 (Contract-Freeze ist mit Task 3 erfolgt).

- [ ] **Step 5: Abschluss-Commit**

```bash
git add docs/IMPLEMENTATION_LOG.md docs/POWERHOUSE_360_MASTER_PLAN.md docs/EXECUTION_ROADMAP.md
git commit -m "docs: WP-APP-2 abgeschlossen — F-APP-1 (API) testgestützt grün, Statuspflege Masterplan/Roadmap"
```

---

## Abschluss-Checkliste

- [ ] **Gate-Verifikation F-APP-1 (API):** `pnpm test:unit` und `pnpm test:integration` vollständig grün; jede der 12 App-Routen hat ≥ 1 Positiv- + 1 Authz-Negativtest; Negativmatrix nachweisbar (403 fremder Kontext, 401 ohne Session, 403 Rolle ohne Permission, leere Daten außerhalb `[validFrom, validTo]`, `*_own` exklusiv RESIDENT).
- [ ] **Qualitätsregeln eingehalten:** Zeitreihen lesen ausschließlich `ConsumptionAggregate`, Status ausschließlich `DeviceState` (kein Endpunkt liest `DeviceReading`); Delta-Ableitung nur im Worker; Energie als kWh-String(3), Geld als Integer-Cent, Zeiten ISO-8601 UTC; Fehler-Envelope auf allen Routen.
- [ ] **Migration + Seed idempotent:** `prisma migrate status` clean; `pnpm db:seed` und `pnpm db:seed:app` je zweimal ausgeführt ohne Fehler; Seed-PDF liegt in MinIO (`ph360-documents/seed/RE-2026-0001.pdf`); resident@test.powerhouse360.de existiert mit RESIDENT-Membership und verknüpftem PowerParticipant.
- [ ] **Typechecks:** `pnpm typecheck` über alle Workspaces grün.
- [ ] **IMPLEMENTATION_LOG-Eintrag** angefügt (append-only, inkl. „Nicht getestet"-Abschnitt).
- [ ] **Masterplan-Statuspflege:** WP-APP-2 🟢, F-APP-1 (API) markiert, F-APP-1 (E2E) offen für WP-APP-4; EXECUTION_ROADMAP nachgeführt.
- [ ] **Kein `git push`** (kein Remote, R-02) — alle Commits lokal, Conventional Commits deutsch.
