# WP-APP-1 — Mess-/Gerätekern + Telemetrie-Ingestion + Hub-Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständige Umsetzung von ADR-009: Mess-/Gerätekern-Datenmodell (Hub…DeviceAlert), idempotente Telemetrie-Ingestion (`/api/v1/ingest/*`) mit Hub-Token-Auth/Rotation/Revocation, Worker-seitige DeviceState-Materialisierung + Lückenerkennung sowie deterministischer Hub-Simulator — Gate **F-08-Kern** grün.

**Architecture:** `packages/api-contracts` (neu) hält die Zod-Contracts des Ingest-Vertrags als Single Source of Truth für Platform-Route, Tests und Hub-Simulator. `packages/ingestion` (neu) kapselt die gesamte Fachlogik (Hub-Auth via Token-Hash, Batch-Idempotenz mit persistierter Antwort, Per-Item-Pipeline in ADR-009-§5-Reihenfolge, append-only `DeviceReading`-Schreiben, Outbox-Event) und wird von einer dünnen Next.js-Route in `apps/platform` aufgerufen (später als Ingest-Service extrahierbar, ADR-007). `apps/worker` konsumiert `device.telemetry_received` aus der bestehenden Outbox und materialisiert `DeviceState` + Lücken-Alerts; Push-Bedarf wird nur als `notification.requested`-DomainEvent signalisiert (kein Versand in diesem WP).

**Tech Stack:** pnpm 11.11.0 + Turborepo, Node ≥ 20, TypeScript strict (ES2022, `moduleResolution: bundler`, `verbatimModuleSyntax`), Prisma 6 (ESM, Client → `packages/database/generated/client`), Next.js 16.2.7 App Router (Port 3100), Vitest 3 (Projekte `unit`/`integration` gegen `ph360_test` :5433), zod ^3.24.1, tsx (Worker/CLI), node:crypto (sha256).

**Vorbedingungen:**
- **WP-1.2 grün (F-02/F-19/F-20):** better-auth-Tabellen + `OrganizationMembership` + Enum `SystemRole` in `schema.prisma`; `packages/testing` (`@ph360/testing`) existiert mit `src/global-setup.ts` (`prisma migrate deploy` auf `DATABASE_URL_TEST`, `ph360_test` :5433), `src/setup.ts` (guarded `truncateAll` via `beforeEach`) und `src/factories.ts` (exportiert `createOrg(type?, overrides?)` und internes `uniq()`); Root-`vitest.config.ts` mit Projekten **`unit`** (Include `packages/permissions/**/*.{test,spec}.ts` — wird in Task 2 erweitert) und **`integration`** (Include `packages/**/*.itest.ts` + `apps/**/*.itest.ts`, globalSetup/setupFiles aus `packages/testing`, env `DATABASE_URL=DATABASE_URL_TEST`, singleFork); Root-devDependency `vitest`; Root-Scripts `test:unit`, `test:integration`, `db:test:up`.
- **WP-1.3-Kern grün:** Prisma-Modelle `Property {id, organizationId, name}`, `Building {id, propertyId, name, addressId}`, `Entrance {id, buildingId, label}`, `Unit {id, buildingId, entranceId?, label, floor?}`, `Address {street, houseNumber, postalCode, city}` existieren und sind migriert (Migration `*_immobilien_kern`). `@ph360/testing` exportiert zusätzlich `createProperty(organizationId, overrides?)`, `createBuilding(propertyId, overrides?)`, `createEntrance(buildingId, overrides?)`, `createUnit(buildingId, overrides?)`. Der Seed legt den ADR-006-Testmandanten (Organization mit Namenspräfix `TEST — `) samt Pilotstruktur (1 Property, 2 Gebäude, 21 Units) idempotent an (`seedPilotStructure` in `packages/database/prisma/seed-objects.ts`).
- **Ist-Stand (verifiziert):** `@ph360/database` exportiert `prisma` (Singleton) und re-exportiert den generierten Prisma-Client (inkl. `Prisma`-Namespace, Modell-Typen); Outbox = `DomainEvent` (Worker-Poll 3 s, Handler-Registry nach `eventType` in `apps/worker/src/index.ts`); `pnpm-workspace.yaml` enthält nur `apps/*` + `packages/*` (Task 9 ergänzt `tools/*`).
- Lokale Dev-DB: `docker compose up -d --wait postgres` (Postgres :5433, Dev-DB `ph360`, Test-DB `ph360_test`).
- Commits: Conventional Commits deutsch; **kein `git push`** (kein Remote, R-02).
---

## Dateistruktur

**Create**
- `packages/api-contracts/package.json` — Paketdefinition `@ph360/api-contracts` (ESM, Export `src/index.ts`, zod ^3.24.1).
- `packages/api-contracts/tsconfig.json` — TS-Konfig (erbt `tsconfig.base.json`).
- `packages/api-contracts/src/errors.ts` — Fehler-Envelope `{error:{code,message,requestId}}` + stabile Fehlercodes.
- `packages/api-contracts/src/ingest.ts` — Ingest-Envelope-, Reading-, Response-, Rotate-Schemas + Reject-Reason-Enum.
- `packages/api-contracts/src/index.ts` — Paket-Export.
- `packages/api-contracts/src/ingest.test.ts` — Schema-Unit-Tests.
- `packages/ingestion/package.json` — Paketdefinition `@ph360/ingestion`.
- `packages/ingestion/tsconfig.json` — TS-Konfig.
- `packages/ingestion/src/config.ts` — Ingest-Konfiguration aus env (Skew, ts-Grenzen, LATE_THRESHOLD, Rate-Limit, Rotations-Grace).
- `packages/ingestion/src/errors.ts` — `IngestAuthError` (401), `HubSerialMismatchError` (403), `BatchConflictError` (409).
- `packages/ingestion/src/token.ts` — Token-Erzeugung + sha256-Hashing (nur Hash in DB).
- `packages/ingestion/src/token.test.ts` — Unit-Tests Token/Hash.
- `packages/ingestion/src/rate-limit.ts` — In-Memory-Fixed-Window-Limiter je Hub.
- `packages/ingestion/src/rate-limit.test.ts` — Unit-Tests Limiter.
- `packages/ingestion/src/payload-hash.ts` — sha256 über den Roh-Request-Body (Batch-Payload-Hash).
- `packages/ingestion/src/alerts.ts` — `raiseAlert` (OPEN-Alert je (type, hubId, meteringPointId) deduplizieren).
- `packages/ingestion/src/provision.ts` — `registerHub`, `rotateHubCredential`, `revokeHubCredentials`.
- `packages/ingestion/src/auth.ts` — `authenticateHub` (Bearer-Token → Hash-Vergleich → Hub).
- `packages/ingestion/src/auth.itest.ts` — Integrationstests Auth/Rotation/Revocation/Expiry.
- `packages/ingestion/src/process-batch.ts` — Batch-Verarbeitung: Idempotenz, Per-Item-Pipeline (ADR-009-§5-Reihenfolge), Schreiben, Outbox.
- `packages/ingestion/src/process-batch.itest.ts` — Integrationstests: jeder Reject-Grund, Duplikat, Idempotenz, 409, late, Skew.
- `packages/ingestion/src/test-fixtures.ts` — Fixture-Helper (Org→Gebäude→Hub→Meter→MeteringPoint→Assignment) für Integrationstests.
- `packages/ingestion/src/register-hub-cli.ts` — Admin-Skript: Hub registrieren + Token einmalig ausgeben.
- `packages/ingestion/src/index.ts` — Paket-Export.
- `apps/platform/src/app/api/v1/ingest/telemetry/route.ts` — POST-Route Telemetrie (Auth, Envelope, 401/403/409/422/429, Audit).
- `apps/platform/src/app/api/v1/ingest/telemetry/route.itest.ts` — Routen-Integrationstests (200/401/403/409/422).
- `apps/platform/src/app/api/v1/ingest/credentials/rotate/route.ts` — POST-Route Token-Rotation.
- `apps/platform/src/app/api/v1/ingest/credentials/rotate/route.itest.ts` — Routen-Integrationstests Rotation (alt+neu gültig, Revocation → 401).
- `packages/database/prisma/seed-hub.ts` — idempotenter Testmandant-Hub-Seed (Hub, Credential, Simulator-Kanäle, MeterChange-Fixture).
- `apps/worker/src/telemetry.ts` — Handler `device.telemetry_received`: DeviceState, Lückenerkennung (96er-Regel), `notification.requested`.
- `apps/worker/src/telemetry.test.ts` — Unit-Tests Intervallrechnung.
- `apps/worker/src/telemetry.itest.ts` — Integrationstests DeviceState/Gap/Push-Event/Entwarnung.
- `tools/hub-simulator/package.json` — Paketdefinition `@ph360/hub-simulator` (CLI via tsx).
- `tools/hub-simulator/tsconfig.json` — TS-Konfig.
- `tools/hub-simulator/src/rng.ts` — Deterministischer RNG (mulberry32, einstellbarer Seed) + deterministische Batch-IDs.
- `tools/hub-simulator/src/profile.ts` — 15-min-Lastprofil (Tag/Nacht) + Dezimal-String-Formatierung + kanonischer Export `generateDayLoadProfile` (wird von WP-APP-2 Task 8 aus `@ph360/hub-simulator` importiert).
- `tools/hub-simulator/src/profile.test.ts` — Unit-Tests `generateDayLoadProfile` (96er-Raster, Determinismus, gapIntervals).
- `tools/hub-simulator/src/index.ts` — Paket-Export (`generateDayLoadProfile` u. a. für WP-APP-2).
- `tools/hub-simulator/src/scenarios.ts` — Szenario-Generator `normal|gap|meter_change|duplicate_same|duplicate_conflict|faulty` + deterministische Soll-Ergebnisse.
- `tools/hub-simulator/src/scenarios.test.ts` — Determinismus- + Soll-Ergebnis-Unit-Tests.
- `tools/hub-simulator/src/client.ts` — HTTP-Client gegen die echte Ingest-API (Response-Schema-validiert).
- `tools/hub-simulator/src/cli.ts` — CLI-Einstieg (Argumente, Ausführung, Soll-Ist-Vergleich, Exit-Code).

**Modify**
- `packages/database/prisma/schema.prisma` — +8 Enums, +10 Modelle (Hub…DeviceAlert), Back-Relations auf Organization/Building/Unit.
- `packages/database/prisma/migrations/<ts>_messkern_ingestion/migration.sql` — generierte Migration + **raw SQL: partieller Unique-Index** auf `device_reading`.
- `packages/database/prisma/seed.ts` — Aufruf `seedTestHub(prisma)` ergänzen.
- `apps/platform/package.json` — Dependencies `@ph360/api-contracts`, `@ph360/ingestion`.
- `apps/worker/src/index.ts` — Handler-Registrierung `device.telemetry_received` + periodischer Gap-Sweep.
- `vitest.config.ts` (Root) — Unit-Include auf `packages/apps/tools` erweitern.
- `turbo.json` — globalEnv: `INGEST_*`, `HUB_SEED_TOKEN`, `GAP_*`.
- `.env.example` / `.env` — neue env-Variablen (Defaults dokumentiert).
- `pnpm-workspace.yaml` — Workspace-Eintrag `tools/*`.
- `docs/IMPLEMENTATION_LOG.md` — WP-APP-1-Eintrag (append-only).
- `docs/POWERHOUSE_360_MASTER_PLAN.md` — Statuspflege WP-APP-1 / F-08-Kern.

---

## Task 1: Prisma-Schema Mess-/Gerätekern + Migration mit partiellem Unique-Index

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/<ts>_messkern_ingestion/migration.sql` (generiert + raw SQL)

- [ ] **Step 1: Enums + Modelle an `schema.prisma` anhängen**

Am Ende von `packages/database/prisma/schema.prisma` anhängen:

```prisma
// ---------------------------------------------------------------------------
// devices & telemetry (WP-APP-1, Spec §3.2 + ADR-009)
// ---------------------------------------------------------------------------

enum HubStatus {
  REGISTERED
  ACTIVE
  INACTIVE
  REPLACED
}

enum HubCredentialStatus {
  ACTIVE
  REVOKED
}

enum MeterType {
  ELECTRICITY
}

enum MeteringPointType {
  UNIT_CONSUMPTION
  PV_GENERATION
  GRID_FEED
  BUILDING_GENERAL
  STORAGE
}

enum ReadingKind {
  REGISTER
  DELTA
}

enum ReadingQuality {
  RAW
  VALIDATED
  SUBSTITUTE
  ESTIMATED
  CORRECTED
}

enum DeviceAlertType {
  UNKNOWN_CHANNEL
  NO_VALID_ASSIGNMENT
  SERIAL_MISMATCH
  CONFLICTING_VALUE
  NON_MONOTONIC_REGISTER
  CLOCK_SKEW
  PAYLOAD_HASH_CONFLICT
  DATA_GAP
}

enum DeviceAlertStatus {
  OPEN
  RESOLVED
}

model Hub {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  organization   Organization @relation(fields: [organizationId], references: [id])
  serialNumber   String       @unique
  status         HubStatus    @default(REGISTERED)
  lastSeenAt     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  credentials HubCredential[]
  assignments DeviceAssignment[]
  batches     IngestBatch[]

  @@map("hub")
}

model HubCredential {
  id        String              @id @default(uuid()) @db.Uuid
  hubId     String              @db.Uuid
  hub       Hub                 @relation(fields: [hubId], references: [id], onDelete: Cascade)
  tokenHash String              @unique
  status    HubCredentialStatus @default(ACTIVE)
  expiresAt DateTime?
  rotatedAt DateTime?
  createdAt DateTime            @default(now())

  @@index([hubId, status])
  @@map("hub_credential")
}

model Meter {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @db.Uuid
  manufacturer   String
  model          String
  serialNumber   String
  meterType      MeterType @default(ELECTRICITY)
  unit           String    @default("kWh")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  assignments  DeviceAssignment[]
  readings     DeviceReading[]
  state        DeviceState?
  changesAsOld MeterChange[]      @relation("MeterChangeOld")
  changesAsNew MeterChange[]      @relation("MeterChangeNew")

  @@unique([manufacturer, model, serialNumber])
  @@map("meter")
}

model MeteringPoint {
  id             String            @id @default(uuid()) @db.Uuid
  organizationId String            @db.Uuid
  buildingId     String            @db.Uuid
  building       Building          @relation(fields: [buildingId], references: [id])
  unitId         String?           @db.Uuid
  unit           Unit?             @relation(fields: [unitId], references: [id])
  pointType      MeteringPointType
  externalId     String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  assignments DeviceAssignment[]

  @@index([buildingId])
  @@map("metering_point")
}

model DeviceAssignment {
  id              String        @id @default(uuid()) @db.Uuid
  organizationId  String        @db.Uuid
  meterId         String        @db.Uuid
  meter           Meter         @relation(fields: [meterId], references: [id])
  meteringPointId String        @db.Uuid
  meteringPoint   MeteringPoint @relation(fields: [meteringPointId], references: [id])
  hubId           String        @db.Uuid
  hub             Hub           @relation(fields: [hubId], references: [id])
  channelRef      String
  validFrom       DateTime
  validTo         DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  readings DeviceReading[]

  @@index([hubId, channelRef])
  @@index([meterId, validFrom])
  @@map("device_assignment")
}

model MeterChange {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  meterOldId     String   @db.Uuid
  meterOld       Meter    @relation("MeterChangeOld", fields: [meterOldId], references: [id])
  meterNewId     String   @db.Uuid
  meterNew       Meter    @relation("MeterChangeNew", fields: [meterNewId], references: [id])
  changedAt      DateTime
  endValueOld    Decimal  @db.Decimal(14, 3)
  startValueNew  Decimal  @db.Decimal(14, 3)
  createdAt      DateTime @default(now())

  @@map("meter_change")
}

model IngestBatch {
  id             String   @id @default(uuid()) @db.Uuid
  hubId          String   @db.Uuid
  hub            Hub      @relation(fields: [hubId], references: [id])
  batchId        String
  payloadHash    String
  responseJson   Json
  acceptedCount  Int
  duplicateCount Int
  rejectedCount  Int
  createdAt      DateTime @default(now())

  readings DeviceReading[]

  @@unique([hubId, batchId])
  @@map("ingest_batch")
}

/// Append-only 15-min-Messwerte. Einziger In-place-Übergang: quality RAW→VALIDATED.
/// SUBSTITUTE/ESTIMATED/CORRECTED entstehen als neue Sätze mit supersedesId (ADR-009 §5.4).
model DeviceReading {
  id               String           @id @default(uuid()) @db.Uuid
  meterId          String           @db.Uuid
  meter            Meter            @relation(fields: [meterId], references: [id])
  assignmentId     String           @db.Uuid
  assignment       DeviceAssignment @relation(fields: [assignmentId], references: [id])
  ts               DateTime
  kind             ReadingKind
  value            Decimal          @db.Decimal(14, 3)
  quality          ReadingQuality   @default(RAW)
  receivedAt       DateTime
  late             Boolean          @default(false)
  clockSkewSuspect Boolean          @default(false)
  supersedesId     String?          @db.Uuid
  supersedes       DeviceReading?   @relation("ReadingSupersedes", fields: [supersedesId], references: [id])
  supersededBy     DeviceReading[]  @relation("ReadingSupersedes")
  batchId          String           @db.Uuid
  batch            IngestBatch      @relation(fields: [batchId], references: [id])
  createdAt        DateTime         @default(now())

  // Partieller Unique-Index (meterId, ts, kind) WHERE supersedesId IS NULL:
  // raw SQL in Migration messkern_ingestion (Prisma kann keine partiellen Indizes).
  @@index([meterId, ts, kind])
  @@map("device_reading")
}

/// Materialisierter Zustand je Meter — einzige Lesequelle für Status-/Letzter-Messwert-Anzeigen.
model DeviceState {
  id        String   @id @default(uuid()) @db.Uuid
  meterId   String   @unique @db.Uuid
  meter     Meter    @relation(fields: [meterId], references: [id])
  lastValue Decimal? @db.Decimal(14, 3)
  lastTs    DateTime?
  online    Boolean  @default(false)
  gapSince  DateTime?
  updatedAt DateTime @updatedAt

  @@map("device_state")
}

/// Störungen/Lücken. hubId/meteringPointId bewusst ohne FK (Alerts überleben Umbauten).
model DeviceAlert {
  id              String            @id @default(uuid()) @db.Uuid
  organizationId  String?           @db.Uuid
  type            DeviceAlertType
  meteringPointId String?           @db.Uuid
  hubId           String?           @db.Uuid
  status          DeviceAlertStatus @default(OPEN)
  message         String?
  firstAt         DateTime
  lastAt          DateTime
  notifiedAt      DateTime?
  createdAt       DateTime          @default(now())

  @@index([status, type])
  @@index([meteringPointId, status])
  @@map("device_alert")
}
```

- [ ] **Step 2: Back-Relations ergänzen**

Im bestehenden `model Organization { … }` ergänzen:
```prisma
  hubs Hub[]
```
Im `model Building { … }` (aus WP-1.3) ergänzen:
```prisma
  meteringPoints MeteringPoint[]
```
Im `model Unit { … }` (aus WP-1.3) ergänzen:
```prisma
  meteringPoints MeteringPoint[]
```
Hinweis: `organizationId` auf Meter/MeteringPoint/DeviceAssignment/MeterChange/DeviceAlert ist bewusst eine reine Scope-Spalte ohne FK-Relation (gleiches Muster wie `DomainEvent.organizationId`) — vermeidet Back-Relation-Wildwuchs auf `Organization`; Org-Scoping bleibt App-Sache (ADR-004).

- [ ] **Step 3: Migration erzeugen (create-only) und partiellen Unique-Index anhängen**

```bash
docker compose up -d --wait postgres
set -a; . ./.env; set +a
pnpm --filter @ph360/database exec prisma migrate dev --name messkern_ingestion --create-only
```
Erwartet: neues Verzeichnis `packages/database/prisma/migrations/<ts>_messkern_ingestion/` mit `migration.sql` (Enums + 10 Tabellen), noch nicht angewendet.

Ans Ende der generierten `migration.sql` anhängen:
```sql
-- ADR-009 §3/§5.4: genau EIN Original je (meterId, ts, kind); Qualitäts-/Korrektursätze
-- (supersedesId IS NOT NULL) bilden Ketten und sind vom Unique ausgenommen.
CREATE UNIQUE INDEX "device_reading_original_unique"
  ON "device_reading" ("meterId", "ts", "kind")
  WHERE "supersedesId" IS NULL;
```

- [ ] **Step 4: Migration anwenden + Client generieren**

```bash
pnpm --filter @ph360/database exec prisma migrate dev
pnpm --filter @ph360/database exec prisma migrate status
```
Erwartet: Migration angewendet, „Database schema is up to date", Client regeneriert. Danach Index verifizieren:
```bash
docker compose exec postgres psql -U ph360 -d ph360 -c "\d device_reading" | grep device_reading_original_unique
```
Erwartet: `"device_reading_original_unique" UNIQUE, btree ("meterId", ts, kind) WHERE "supersedesId" IS NULL`.

- [ ] **Step 5: Typecheck + Commit**

```bash
pnpm --filter @ph360/database typecheck
git add packages/database/prisma
git commit -m "feat(ingest): Messkern-Schema — Hub…DeviceAlert + partieller Unique-Index auf device_reading (ADR-009)"
```

---

## Task 2: `packages/api-contracts` — Ingest-Contracts (Zod) als Single Source of Truth

**Files:**
- Create: `packages/api-contracts/package.json`, `packages/api-contracts/tsconfig.json`, `packages/api-contracts/src/errors.ts`, `packages/api-contracts/src/ingest.ts`, `packages/api-contracts/src/index.ts`
- Test: `packages/api-contracts/src/ingest.test.ts`
- Modify: `vitest.config.ts` (Root, Unit-Include)

- [ ] **Step 1: Paket-Gerüst anlegen**

`packages/api-contracts/package.json`:
```json
{
  "name": "@ph360/api-contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^3.2.0"
  }
}
```

`packages/api-contracts/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

Root-`vitest.config.ts`: im Projekt `unit` das `include` ersetzen —

alt:
```ts
include: ["packages/permissions/**/*.{test,spec}.ts"]
```
neu:
```ts
include: [
  "packages/**/src/**/*.{test,spec}.ts",
  "apps/**/src/**/*.{test,spec}.ts",
  "tools/**/src/**/*.{test,spec}.ts",
],
exclude: ["**/node_modules/**", "**/*.itest.ts"],
```

Dann:
```bash
pnpm install
```
Erwartet: Lockfile enthält `@ph360/api-contracts`; keine Fehler.

- [ ] **Step 2: Fehlschlagenden Schema-Test schreiben**

`packages/api-contracts/src/ingest.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  ingestEnvelopeSchema,
  ingestEnvelopeLooseSchema,
  ingestReadingSchema,
  ingestResponseSchema,
  rotateResponseSchema,
  REJECT_REASONS,
} from "./ingest.js";
import { errorEnvelope, errorEnvelopeSchema } from "./errors.js";

const reading = {
  channelRef: "devEUI:70B3D5A1B2C3D4E5:1",
  meterSerial: "1EMH0067512345",
  ts: "2026-07-22T14:15:00.000Z",
  kind: "register",
  value: "004321.375",
  seq: 4711,
};

const envelope = {
  batchId: "018c2f7e-1111-4222-8333-444455556666",
  hubSerial: "PH360-TEST-0001",
  sentAt: "2026-07-22T14:31:07.000Z",
  readings: [reading],
};

describe("ingest contracts (ADR-009 §2/§3)", () => {
  it("akzeptiert einen gültigen Envelope", () => {
    const parsed = ingestEnvelopeSchema.parse(envelope);
    expect(parsed.readings[0]?.kind).toBe("register");
  });

  it("meterSerial ist optional", () => {
    const { meterSerial: _drop, ...rest } = reading;
    expect(
      ingestEnvelopeSchema.safeParse({ ...envelope, readings: [rest] }).success,
    ).toBe(true);
  });

  it("lehnt Nicht-Dezimal-Werte, negative Werte und >3 Nachkommastellen ab", () => {
    for (const value of ["abc", "-1.000", "1.2345", ""]) {
      expect(ingestReadingSchema.safeParse({ ...reading, value }).success).toBe(false);
    }
  });

  it("lehnt batchId ohne UUID-Format und leere readings ab", () => {
    expect(ingestEnvelopeSchema.safeParse({ ...envelope, batchId: "x" }).success).toBe(false);
    expect(ingestEnvelopeSchema.safeParse({ ...envelope, readings: [] }).success).toBe(false);
  });

  it("loose-Envelope lässt kaputte Items durch (Per-Item-Reject 'schema' passiert serverseitig)", () => {
    const parsed = ingestEnvelopeLooseSchema.parse({
      ...envelope,
      readings: [reading, { garbage: true }],
    });
    expect(parsed.readings).toHaveLength(2);
  });

  it("Response-Schema roundtrippt (persistierte Antwort, ADR-009 §3)", () => {
    const response = {
      batchId: envelope.batchId,
      clockSkewSuspect: false,
      acceptedCount: 1,
      duplicateCount: 0,
      rejectedCount: 1,
      results: [
        { index: 0, status: "accepted" },
        { index: 1, status: "rejected", reason: "unknown_channel" },
      ],
    };
    expect(ingestResponseSchema.parse(response)).toEqual(response);
  });

  it("kennt exakt die 7 ADR-009-Reject-Gründe", () => {
    expect([...REJECT_REASONS].sort()).toEqual(
      [
        "conflicting_value",
        "no_valid_assignment",
        "non_monotonic_register",
        "schema",
        "serial_mismatch",
        "ts_out_of_bounds",
        "unknown_channel",
      ].sort(),
    );
  });

  it("rotate-Response enthält Token + Ablauf des Alt-Credentials", () => {
    expect(
      rotateResponseSchema.safeParse({
        token: "pht_neu",
        previousExpiresAt: "2026-07-29T14:31:07.000Z",
      }).success,
    ).toBe(true);
  });

  it("errorEnvelope baut den Spec-§4.1-Fehler", () => {
    const env = errorEnvelope("CONFLICT", "batchId bekannt, payloadHash abweichend.", "req-1");
    expect(errorEnvelopeSchema.parse(env).error.code).toBe("CONFLICT");
  });
});
```

- [ ] **Step 3: Test rot sehen**

```bash
pnpm exec vitest run --project unit packages/api-contracts/src/ingest.test.ts
```
Erwartet: FAIL — `Cannot find module './ingest.js'` (Dateien existieren noch nicht).

- [ ] **Step 4: Contracts implementieren**

`packages/api-contracts/src/errors.ts`:
```ts
import { z } from "zod";

/** Stabile Fehlercodes (Spec §4.1) — für App- UND Ingest-Endpunkte. */
export const ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "RATE_LIMITED",
  "CONFLICT",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    requestId: z.string(),
  }),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export function errorEnvelope(
  code: ErrorCode,
  message: string,
  requestId: string,
): ErrorEnvelope {
  return { error: { code, message, requestId } };
}
```

`packages/api-contracts/src/ingest.ts`:
```ts
import { z } from "zod";

/** Per-Item-Reject-Gründe (ADR-009 §3, abschließend). */
export const REJECT_REASONS = [
  "unknown_channel",
  "no_valid_assignment",
  "serial_mismatch",
  "ts_out_of_bounds",
  "non_monotonic_register",
  "conflicting_value",
  "schema",
] as const;

export type RejectReason = (typeof REJECT_REASONS)[number];
export const rejectReasonSchema = z.enum(REJECT_REASONS);

/** kWh als Dezimal-String, max. 3 Nachkommastellen, nie negativ (Spec §4.1). */
export const kwhDecimalString = z.string().regex(/^\d{1,11}(\.\d{1,3})?$/);

/** Ein roher Kanalwert vom Hub (ADR-009 §2). Der Hub leitet NIE ab. */
export const ingestReadingSchema = z.object({
  channelRef: z.string().min(1).max(200),
  meterSerial: z.string().min(1).max(100).optional(),
  ts: z.string().datetime(),
  kind: z.enum(["register", "delta"]),
  value: kwhDecimalString,
  seq: z.number().int().nonnegative(),
});

export type IngestReading = z.infer<typeof ingestReadingSchema>;

const envelopeBase = {
  batchId: z.string().uuid(),
  hubSerial: z.string().min(1).max(100),
  sentAt: z.string().datetime(),
};

/** Voll validierter Envelope — genutzt vom Hub-Simulator (Erzeugerseite). */
export const ingestEnvelopeSchema = z.object({
  ...envelopeBase,
  readings: z.array(ingestReadingSchema).min(1).max(2000),
});

export type IngestEnvelope = z.infer<typeof ingestEnvelopeSchema>;

/**
 * Serverseitiger Envelope: Items bleiben `unknown`, damit ein einzelnes
 * kaputtes Item NICHT den Batch scheitern lässt, sondern per Item als
 * `rejected: schema` beantwortet wird (Teilerfolge sind normal, ADR-009 §3).
 */
export const ingestEnvelopeLooseSchema = z.object({
  ...envelopeBase,
  readings: z.array(z.unknown()).min(1).max(2000),
});

export type IngestEnvelopeLoose = z.infer<typeof ingestEnvelopeLooseSchema>;

export const ingestItemResultSchema = z.object({
  index: z.number().int().nonnegative(),
  status: z.enum(["accepted", "duplicate", "rejected"]),
  reason: rejectReasonSchema.optional(),
});

export type IngestItemResult = z.infer<typeof ingestItemResultSchema>;

/** Wird je (hubId, batchId) persistiert und bei Wiederholung wörtlich zurückgegeben. */
export const ingestResponseSchema = z.object({
  batchId: z.string().uuid(),
  clockSkewSuspect: z.boolean(),
  acceptedCount: z.number().int().nonnegative(),
  duplicateCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  results: z.array(ingestItemResultSchema),
});

export type IngestResponse = z.infer<typeof ingestResponseSchema>;

/** Antwort von POST /api/v1/ingest/credentials/rotate (ADR-009 §1). */
export const rotateResponseSchema = z.object({
  token: z.string().min(1),
  previousExpiresAt: z.string().datetime(),
});

export type RotateResponse = z.infer<typeof rotateResponseSchema>;
```

`packages/api-contracts/src/index.ts`:
```ts
export * from "./errors.js";
export * from "./ingest.js";
```

- [ ] **Step 5: Test grün + Typecheck + Commit**

```bash
pnpm exec vitest run --project unit packages/api-contracts/src/ingest.test.ts
pnpm --filter @ph360/api-contracts typecheck
```
Erwartet: 8 Tests PASS; Typecheck ohne Fehler.

```bash
git add packages/api-contracts vitest.config.ts pnpm-lock.yaml
git commit -m "feat(contracts): @ph360/api-contracts — Ingest-Envelope/-Response/-Reject-Gründe als Zod-Single-Source (ADR-009 §2/§3)"
```

---

## Task 3: `packages/ingestion` — Grundgerüst: Config, Fehler, Token, Payload-Hash, Rate-Limit

**Files:**
- Create: `packages/ingestion/package.json`, `packages/ingestion/tsconfig.json`, `packages/ingestion/src/config.ts`, `packages/ingestion/src/errors.ts`, `packages/ingestion/src/token.ts`, `packages/ingestion/src/payload-hash.ts`, `packages/ingestion/src/rate-limit.ts`, `packages/ingestion/src/index.ts`
- Test: `packages/ingestion/src/token.test.ts`, `packages/ingestion/src/rate-limit.test.ts`

- [ ] **Step 1: Paket-Gerüst anlegen**

`packages/ingestion/package.json`:
```json
{
  "name": "@ph360/ingestion",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./test-fixtures": "./src/test-fixtures.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "register-hub": "tsx src/register-hub-cli.ts"
  },
  "dependencies": {
    "@ph360/api-contracts": "workspace:*",
    "@ph360/database": "workspace:*",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@ph360/testing": "workspace:*",
    "@types/node": "^20",
    "tsx": "^4.19.2",
    "typescript": "^5",
    "vitest": "^3.2.0"
  }
}
```

`packages/ingestion/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["src"]
}
```

```bash
pnpm install
```
Erwartet: keine Fehler.

- [ ] **Step 2: Fehlschlagende Unit-Tests für Token + Rate-Limit schreiben**

`packages/ingestion/src/token.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateHubToken, hashHubToken } from "./token.js";

describe("hub token (ADR-009 §1: serverseitig nur Hash)", () => {
  it("erzeugt pht_-Tokens mit ≥ 32 Byte Entropie und ohne Kollision", () => {
    const a = generateHubToken();
    const b = generateHubToken();
    expect(a).toMatch(/^pht_[A-Za-z0-9_-]{43,}$/);
    expect(a).not.toBe(b);
  });

  it("hasht deterministisch auf 64 Hex-Zeichen (sha256)", () => {
    const token = "pht_fixture";
    expect(hashHubToken(token)).toBe(hashHubToken(token));
    expect(hashHubToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashHubToken(token)).not.toContain("fixture");
  });
});
```

`packages/ingestion/src/rate-limit.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit.js";

describe("fixed-window rate limit je Hub (ADR-009 §1)", () => {
  beforeEach(() => resetRateLimits());

  it("erlaubt bis zum Limit und blockt danach", () => {
    const opts = { limit: 3, windowMs: 60_000, now: 1_000 };
    expect(checkRateLimit("hub-1", opts)).toBe(true);
    expect(checkRateLimit("hub-1", opts)).toBe(true);
    expect(checkRateLimit("hub-1", opts)).toBe(true);
    expect(checkRateLimit("hub-1", opts)).toBe(false);
  });

  it("zählt je Hub getrennt", () => {
    const opts = { limit: 1, windowMs: 60_000, now: 1_000 };
    expect(checkRateLimit("hub-1", opts)).toBe(true);
    expect(checkRateLimit("hub-2", opts)).toBe(true);
  });

  it("setzt im nächsten Fenster zurück", () => {
    expect(checkRateLimit("hub-1", { limit: 1, windowMs: 60_000, now: 1_000 })).toBe(true);
    expect(checkRateLimit("hub-1", { limit: 1, windowMs: 60_000, now: 2_000 })).toBe(false);
    expect(checkRateLimit("hub-1", { limit: 1, windowMs: 60_000, now: 61_001 })).toBe(true);
  });
});
```

```bash
pnpm exec vitest run --project unit packages/ingestion/src
```
Erwartet: FAIL — `Cannot find module './token.js'` bzw. `'./rate-limit.js'`.

- [ ] **Step 3: Implementieren (config, errors, token, payload-hash, rate-limit, index)**

`packages/ingestion/src/config.ts`:
```ts
/** Ingest-Konfiguration (ADR-009 §1/§4/§5.1). Alle Werte via env übersteuerbar. */
export interface IngestConfig {
  /** §5.1a: |sentAt − Serverzeit| über dieser Toleranz ⇒ Skew-Kennzeichnung (kein Reject). */
  clockSkewToleranceMs: number;
  /** §5.1b: Reading-ts mehr als so weit in der Zukunft ⇒ rejected ts_out_of_bounds. */
  maxFutureMs: number;
  /** §5.1b: Reading-ts älter als so viele Tage ⇒ rejected ts_out_of_bounds. */
  maxAgeDays: number;
  /** §4: receivedAt − ts über dieser Schwelle ⇒ late = true (Default 60 min). */
  lateThresholdMs: number;
  /** §1: Requests je Hub und Minute. */
  rateLimitPerMinute: number;
  /** §1: Übergangsfrist des Alt-Credentials bei Rotation (Default 7 Tage). */
  rotationGraceMs: number;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`env ${name} muss eine positive Ganzzahl sein, ist: ${raw}`);
  }
  return parsed;
}

export function loadIngestConfig(): IngestConfig {
  return {
    clockSkewToleranceMs: envInt("INGEST_CLOCK_SKEW_MIN", 5) * 60_000,
    maxFutureMs: envInt("INGEST_TS_MAX_FUTURE_MIN", 5) * 60_000,
    maxAgeDays: envInt("INGEST_TS_MAX_AGE_DAYS", 90),
    lateThresholdMs: envInt("INGEST_LATE_THRESHOLD_MIN", 60) * 60_000,
    rateLimitPerMinute: envInt("INGEST_RATE_LIMIT_PER_MIN", 120),
    rotationGraceMs: envInt("INGEST_ROTATION_GRACE_DAYS", 7) * 86_400_000,
  };
}
```

`packages/ingestion/src/errors.ts`:
```ts
/** Unbekanntes/revokiertes/abgelaufenes Token ⇒ HTTP 401 (ADR-009 §1). */
export class IngestAuthError extends Error {
  readonly status = 401 as const;
  constructor(message: string) {
    super(message);
    this.name = "IngestAuthError";
  }
}

/** hubSerial gehört nicht zum authentifizierten Credential ⇒ gesamter Batch HTTP 403 (ADR-009 §2). */
export class HubSerialMismatchError extends Error {
  readonly status = 403 as const;
  constructor(
    readonly claimedSerial: string,
    readonly actualSerial: string,
  ) {
    super(`hubSerial ${claimedSerial} gehört nicht zum authentifizierten Hub ${actualSerial}`);
    this.name = "HubSerialMismatchError";
  }
}

/** Bekannte batchId mit abweichendem payloadHash ⇒ HTTP 409 (ADR-009 §3). */
export class BatchConflictError extends Error {
  readonly status = 409 as const;
  constructor(readonly batchId: string) {
    super(`batchId ${batchId} bereits mit anderem payloadHash verarbeitet`);
    this.name = "BatchConflictError";
  }
}
```

`packages/ingestion/src/token.ts`:
```ts
import { createHash, randomBytes } from "node:crypto";

/** Klartext-Token: nur bei Registrierung/Rotation einmalig sichtbar. */
export function generateHubToken(): string {
  return `pht_${randomBytes(32).toString("base64url")}`;
}

/** In der DB liegt ausschließlich dieser Hash (HubCredential.tokenHash). */
export function hashHubToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
```

`packages/ingestion/src/payload-hash.ts`:
```ts
import { createHash } from "node:crypto";

/** sha256 über den ROH-Request-Body — Grundlage des 409-Konflikts (ADR-009 §3). */
export function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}
```

`packages/ingestion/src/rate-limit.ts`:
```ts
import { loadIngestConfig } from "./config.js";

interface Window {
  windowStart: number;
  count: number;
}

const windows = new Map<string, Window>();

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
  now?: number;
}

/**
 * In-Memory-Fixed-Window-Limiter je Hub. Bewusst prozess-lokal: die Plattform
 * läuft als EIN platform-Container (docker-compose.prod.yml); bei horizontaler
 * Skalierung wandert das Limit in die Ingest-Service-Extraktion (R-A7).
 */
export function checkRateLimit(key: string, opts: RateLimitOptions = {}): boolean {
  const limit = opts.limit ?? loadIngestConfig().rateLimitPerMinute;
  const windowMs = opts.windowMs ?? 60_000;
  const now = opts.now ?? Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  const current = windows.get(key);
  if (!current || current.windowStart !== windowStart) {
    windows.set(key, { windowStart, count: 1 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/** Nur für Tests. */
export function resetRateLimits(): void {
  windows.clear();
}
```

`packages/ingestion/src/index.ts` (wächst in Task 4/5 weiter):
```ts
export { loadIngestConfig, type IngestConfig } from "./config.js";
export { IngestAuthError, HubSerialMismatchError, BatchConflictError } from "./errors.js";
export { generateHubToken, hashHubToken } from "./token.js";
export { hashPayload } from "./payload-hash.js";
export { checkRateLimit, resetRateLimits, type RateLimitOptions } from "./rate-limit.js";
```

- [ ] **Step 4: Tests grün + Typecheck + Commit**

```bash
pnpm exec vitest run --project unit packages/ingestion/src
pnpm --filter @ph360/ingestion typecheck
```
Erwartet: 5 Tests PASS; Typecheck ohne Fehler.

```bash
git add packages/ingestion pnpm-lock.yaml
git commit -m "feat(ingest): @ph360/ingestion Grundgerüst — Config, Fehlerklassen, Token-Hashing, Payload-Hash, Rate-Limit"
```

---

## Task 4: Provisionierung + Hub-Auth (Registrierung, Rotation, Revocation)

**Files:**
- Create: `packages/ingestion/src/provision.ts`, `packages/ingestion/src/auth.ts`, `packages/ingestion/src/alerts.ts`, `packages/ingestion/src/test-fixtures.ts`, `packages/ingestion/src/register-hub-cli.ts`
- Test: `packages/ingestion/src/auth.itest.ts`
- Modify: `packages/ingestion/src/index.ts`

- [ ] **Step 1: Fixture-Helper schreiben (wird von allen Integrationstests genutzt)**

`packages/ingestion/src/test-fixtures.ts`:
```ts
import { prisma } from "@ph360/database";
import type {
  Building,
  DeviceAssignment,
  Hub,
  Meter,
  MeteringPoint,
  Organization,
  Unit,
} from "@ph360/database";
import { createBuilding, createOrg, createProperty, createUnit } from "@ph360/testing";
import { registerHub } from "./provision.js";

export interface IngestFixture {
  org: Organization;
  building: Building;
  unit: Unit;
  hub: Hub;
  token: string;
  meter: Meter;
  meteringPoint: MeteringPoint;
  assignment: DeviceAssignment;
}

let serial = 0;

/** Org→Property→Building→Unit→Hub(+Token)→Meter→MeteringPoint→Assignment. */
export async function createIngestFixture(
  overrides: { channelRef?: string; validFrom?: Date; validTo?: Date | null } = {},
): Promise<IngestFixture> {
  serial += 1;
  const org = await createOrg("POWERHOUSE", { name: `TEST — Ingest ${Date.now()}-${serial}` });
  const property = await createProperty(org.id);
  const building = await createBuilding(property.id);
  const unit = await createUnit(building.id);

  const { hub, token } = await registerHub({
    organizationId: org.id,
    serialNumber: `PH360-IT-${Date.now()}-${serial}`,
  });

  const meter = await prisma.meter.create({
    data: {
      organizationId: org.id,
      manufacturer: "EMH",
      model: "ED300L",
      serialNumber: `1EMH00${Date.now()}${serial}`,
    },
  });
  const meteringPoint = await prisma.meteringPoint.create({
    data: {
      organizationId: org.id,
      buildingId: building.id,
      unitId: unit.id,
      pointType: "UNIT_CONSUMPTION",
    },
  });
  const assignment = await prisma.deviceAssignment.create({
    data: {
      organizationId: org.id,
      meterId: meter.id,
      meteringPointId: meteringPoint.id,
      hubId: hub.id,
      channelRef: overrides.channelRef ?? `devEUI:70B3D5-${serial}:1`,
      validFrom: overrides.validFrom ?? new Date("2026-01-01T00:00:00Z"),
      validTo: overrides.validTo ?? null,
    },
  });

  return { org, building, unit, hub, token, meter, meteringPoint, assignment };
}
```

- [ ] **Step 2: Fehlschlagenden Integrationstest Auth/Rotation/Revocation schreiben**

`packages/ingestion/src/auth.itest.ts`:
```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { createOrg } from "@ph360/testing";
import { authenticateHub } from "./auth.js";
import { IngestAuthError } from "./errors.js";
import { registerHub, revokeHubCredentials, rotateHubCredential } from "./provision.js";

async function freshHub() {
  const org = await createOrg("POWERHOUSE");
  return registerHub({ organizationId: org.id, serialNumber: `PH360-AUTH-${Date.now()}` });
}

describe("Hub-Auth: Registrierung, Rotation, Revocation (ADR-009 §1)", () => {
  it("registerHub liefert Klartext-Token genau einmal; DB enthält nur den Hash", async () => {
    const { hub, token } = await freshHub();
    expect(token).toMatch(/^pht_/);
    const credentials = await prisma.hubCredential.findMany({ where: { hubId: hub.id } });
    expect(credentials).toHaveLength(1);
    expect(credentials[0]?.status).toBe("ACTIVE");
    expect(credentials[0]?.tokenHash).not.toContain(token.slice(4, 20));
  });

  it("authenticateHub akzeptiert gültige Bearer-Header und lehnt alles andere ab", async () => {
    const { hub, token } = await freshHub();
    const authenticated = await authenticateHub(`Bearer ${token}`);
    expect(authenticated.id).toBe(hub.id);

    await expect(authenticateHub(null)).rejects.toBeInstanceOf(IngestAuthError);
    await expect(authenticateHub("Bearer ")).rejects.toBeInstanceOf(IngestAuthError);
    await expect(authenticateHub("Bearer pht_falsch")).rejects.toBeInstanceOf(IngestAuthError);
    await expect(authenticateHub(token)).rejects.toBeInstanceOf(IngestAuthError);
  });

  it("Rotation: neues Token gilt sofort, altes bis expiresAt (zwei gültige Credentials)", async () => {
    const { hub, token: oldToken } = await freshHub();
    const { token: newToken, previousExpiresAt } = await rotateHubCredential(hub.id);

    expect(newToken).not.toBe(oldToken);
    expect(previousExpiresAt.getTime()).toBeGreaterThan(Date.now());

    // Beide Tokens parallel gültig (Übergangsfrist, ADR-009 §1).
    expect((await authenticateHub(`Bearer ${newToken}`)).id).toBe(hub.id);
    expect((await authenticateHub(`Bearer ${oldToken}`)).id).toBe(hub.id);

    // Nach Ablauf der Frist ist das alte Token ungültig (now-Parameter statt Warten).
    const afterGrace = new Date(previousExpiresAt.getTime() + 1);
    await expect(authenticateHub(`Bearer ${oldToken}`, afterGrace)).rejects.toBeInstanceOf(
      IngestAuthError,
    );
    expect((await authenticateHub(`Bearer ${newToken}`, afterGrace)).id).toBe(hub.id);
  });

  it("Revocation wirkt sofort und nur auf diesen Hub", async () => {
    const first = await freshHub();
    const second = await freshHub();

    const revoked = await revokeHubCredentials(first.hub.id);
    expect(revoked).toBe(1);

    await expect(authenticateHub(`Bearer ${first.token}`)).rejects.toBeInstanceOf(IngestAuthError);
    expect((await authenticateHub(`Bearer ${second.token}`)).id).toBe(second.hub.id);
  });
});
```

```bash
pnpm db:test:up && pnpm exec vitest run --project integration packages/ingestion/src/auth.itest.ts
```
Erwartet: FAIL — `Cannot find module './auth.js'` bzw. `'./provision.js'`.

- [ ] **Step 3: `provision.ts`, `auth.ts`, `alerts.ts` implementieren**

`packages/ingestion/src/provision.ts`:
```ts
import { prisma } from "@ph360/database";
import type { Hub } from "@ph360/database";
import { loadIngestConfig } from "./config.js";
import { generateHubToken, hashHubToken } from "./token.js";

export interface RegisterHubInput {
  organizationId: string;
  serialNumber: string;
  /** Nur für deterministische Seeds/Tests — Produktion nutzt generateHubToken(). */
  token?: string;
}

/** Erst-Provisionierung (ADR-009 §1): Hub + erstes Credential; Token einmalig im Ergebnis. */
export async function registerHub(
  input: RegisterHubInput,
): Promise<{ hub: Hub; token: string }> {
  const token = input.token ?? generateHubToken();
  const hub = await prisma.hub.create({
    data: {
      organizationId: input.organizationId,
      serialNumber: input.serialNumber,
      credentials: { create: { tokenHash: hashHubToken(token) } },
    },
  });
  return { hub, token };
}

/**
 * Rotation ohne Vor-Ort-Einsatz (ADR-009 §1): neues ACTIVE-Credential; alle
 * bisherigen unbefristeten ACTIVE-Credentials erhalten expiresAt = now + Grace.
 */
export async function rotateHubCredential(
  hubId: string,
  opts: { graceMs?: number; now?: Date } = {},
): Promise<{ token: string; previousExpiresAt: Date }> {
  const now = opts.now ?? new Date();
  const graceMs = opts.graceMs ?? loadIngestConfig().rotationGraceMs;
  const previousExpiresAt = new Date(now.getTime() + graceMs);
  const token = generateHubToken();

  await prisma.$transaction([
    prisma.hubCredential.updateMany({
      where: { hubId, status: "ACTIVE", expiresAt: null },
      data: { expiresAt: previousExpiresAt, rotatedAt: now },
    }),
    prisma.hubCredential.create({
      data: { hubId, tokenHash: hashHubToken(token) },
    }),
  ]);

  return { token, previousExpiresAt };
}

/** Revocation (sofort, nur dieser Hub). Liefert Anzahl revokierter Credentials. */
export async function revokeHubCredentials(hubId: string): Promise<number> {
  const result = await prisma.hubCredential.updateMany({
    where: { hubId, status: "ACTIVE" },
    data: { status: "REVOKED" },
  });
  return result.count;
}
```

`packages/ingestion/src/auth.ts`:
```ts
import { prisma } from "@ph360/database";
import type { Hub } from "@ph360/database";
import { IngestAuthError } from "./errors.js";
import { hashHubToken } from "./token.js";

/** Bearer-Token → sha256 → HubCredential (ACTIVE, nicht abgelaufen) → Hub. */
export async function authenticateHub(
  authorization: string | null,
  now: Date = new Date(),
): Promise<Hub> {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new IngestAuthError("Authorization-Header fehlt oder ist kein Bearer-Token");
  }
  const token = authorization.slice("Bearer ".length).trim();
  if (token === "") throw new IngestAuthError("leeres Bearer-Token");

  const credential = await prisma.hubCredential.findUnique({
    where: { tokenHash: hashHubToken(token) },
    include: { hub: true },
  });
  if (
    !credential ||
    credential.status !== "ACTIVE" ||
    (credential.expiresAt !== null && credential.expiresAt.getTime() <= now.getTime())
  ) {
    throw new IngestAuthError("unbekanntes, revokiertes oder abgelaufenes Hub-Token");
  }
  return credential.hub;
}
```

`packages/ingestion/src/alerts.ts`:
```ts
import { prisma } from "@ph360/database";
import type { DeviceAlertType } from "@ph360/database";

export interface RaiseAlertInput {
  type: DeviceAlertType;
  hubId?: string;
  meteringPointId?: string;
  organizationId?: string;
  message?: string;
  now?: Date;
}

/**
 * Alert-Dedupe (Spec §3.3 Anti-Spam-Grundlage): je (type, hubId, meteringPointId)
 * existiert höchstens EIN OPEN-Alert; Wiederauftreten aktualisiert nur lastAt.
 */
export async function raiseAlert(input: RaiseAlertInput): Promise<void> {
  const now = input.now ?? new Date();
  const open = await prisma.deviceAlert.findFirst({
    where: {
      type: input.type,
      status: "OPEN",
      hubId: input.hubId ?? null,
      meteringPointId: input.meteringPointId ?? null,
    },
  });
  if (open) {
    await prisma.deviceAlert.update({
      where: { id: open.id },
      data: { lastAt: now, message: input.message ?? open.message },
    });
    return;
  }
  await prisma.deviceAlert.create({
    data: {
      type: input.type,
      status: "OPEN",
      hubId: input.hubId ?? null,
      meteringPointId: input.meteringPointId ?? null,
      organizationId: input.organizationId ?? null,
      message: input.message ?? null,
      firstAt: now,
      lastAt: now,
    },
  });
}
```

An `packages/ingestion/src/index.ts` anhängen:
```ts
export { registerHub, rotateHubCredential, revokeHubCredentials, type RegisterHubInput } from "./provision.js";
export { authenticateHub } from "./auth.js";
export { raiseAlert, type RaiseAlertInput } from "./alerts.js";
```
(`test-fixtures.ts` wird bewusst NICHT über den Paket-Index exportiert — paketinterne Tests importieren es relativ, paketfremde über den Subpath-Export `@ph360/ingestion/test-fixtures`.)

- [ ] **Step 4: Test grün**

```bash
pnpm db:test:up && pnpm exec vitest run --project integration packages/ingestion/src/auth.itest.ts
```
Erwartet: 4 Tests PASS.

- [ ] **Step 5: Register-CLI schreiben (Smoke-Test manuell)**

`packages/ingestion/src/register-hub-cli.ts`:
```ts
import { parseArgs } from "node:util";
import { prisma } from "@ph360/database";
import { registerHub } from "./provision.js";

const { values } = parseArgs({
  options: {
    org: { type: "string" },
    serial: { type: "string" },
  },
});

if (!values.org || !values.serial) {
  console.error(
    "Usage: pnpm --filter @ph360/ingestion register-hub -- --org <organizationId> --serial <serialNumber>",
  );
  process.exit(1);
}

const { hub, token } = await registerHub({
  organizationId: values.org,
  serialNumber: values.serial,
});

console.log(`Hub registriert: ${hub.serialNumber} (id ${hub.id}, org ${hub.organizationId})`);
console.log("");
console.log("Hub-Token (wird NUR EINMAL angezeigt, serverseitig liegt nur der Hash):");
console.log(token);

await prisma.$disconnect();
```

Smoke-Test gegen die Dev-DB (Org-ID aus dem Seed verwenden):
```bash
set -a; . ./.env; set +a
ORG_ID=$(docker compose exec postgres psql -U ph360 -d ph360 -Atc "SELECT id FROM organization LIMIT 1")
pnpm --filter @ph360/ingestion register-hub -- --org "$ORG_ID" --serial PH360-SMOKE-0001
```
Erwartet: Ausgabe `Hub registriert: PH360-SMOKE-0001 …` + einmaliges `pht_…`-Token.

- [ ] **Step 6: Typecheck + Commit**

```bash
pnpm --filter @ph360/ingestion typecheck
git add packages/ingestion
git commit -m "feat(ingest): Hub-Provisionierung (Registrierung/Rotation/Revocation) + Bearer-Auth via Token-Hash + Alert-Dedupe"
```

---

## Task 5: Batch-Verarbeitung — Idempotenz, Per-Item-Pipeline, Schreiben, Outbox

**Files:**
- Create: `packages/ingestion/src/process-batch.ts`
- Test: `packages/ingestion/src/process-batch.itest.ts`
- Modify: `packages/ingestion/src/index.ts`

- [ ] **Step 1: Fehlschlagenden Integrationstest schreiben (alle Reject-Gründe + Idempotenz)**

`packages/ingestion/src/process-batch.itest.ts`:
```ts
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@ph360/database";
import type { IngestEnvelopeLoose } from "@ph360/api-contracts";
import { BatchConflictError, HubSerialMismatchError } from "./errors.js";
import { processBatch } from "./process-batch.js";
import { createIngestFixture, type IngestFixture } from "./test-fixtures.js";

/** Feste Serverzeit für deterministische ts-Grenzen/late/Skew-Prüfungen. */
const NOW = new Date("2026-07-22T14:31:00.000Z");

function envelopeFor(
  f: IngestFixture,
  readings: unknown[],
  overrides: Partial<IngestEnvelopeLoose> = {},
): IngestEnvelopeLoose {
  return {
    batchId: randomUUID(),
    hubSerial: f.hub.serialNumber,
    sentAt: NOW.toISOString(),
    readings,
    ...overrides,
  };
}

function reading(f: IngestFixture, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    channelRef: f.assignment.channelRef,
    ts: "2026-07-22T14:15:00.000Z",
    kind: "register",
    value: "1000.500",
    seq: 1,
    ...over,
  };
}

async function run(f: IngestFixture, envelope: IngestEnvelopeLoose) {
  return processBatch(f.hub, envelope, JSON.stringify(envelope), { now: NOW });
}

describe("processBatch — Annahmepfad", () => {
  it("accepted: schreibt DeviceReading (RAW, append-only) + IngestBatch + DomainEvent + lastSeenAt", async () => {
    const f = await createIngestFixture();
    const envelope = envelopeFor(f, [
      reading(f, { ts: "2026-07-22T14:00:00.000Z", value: "1000.250", seq: 1 }),
      reading(f, { ts: "2026-07-22T14:15:00.000Z", value: "1000.500", seq: 2 }),
    ]);

    const res = await run(f, envelope);

    expect(res.acceptedCount).toBe(2);
    expect(res.results.map((r) => r.status)).toEqual(["accepted", "accepted"]);
    expect(res.clockSkewSuspect).toBe(false);

    const rows = await prisma.deviceReading.findMany({
      where: { meterId: f.meter.id },
      orderBy: { ts: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.quality).toBe("RAW");
    expect(rows[0]?.kind).toBe("REGISTER");
    expect(rows[0]?.value.toString()).toBe("1000.25");
    expect(rows[0]?.late).toBe(false);
    expect(rows[0]?.supersedesId).toBeNull();

    const batch = await prisma.ingestBatch.findUnique({
      where: { hubId_batchId: { hubId: f.hub.id, batchId: envelope.batchId } },
    });
    expect(batch?.acceptedCount).toBe(2);

    const event = await prisma.domainEvent.findFirst({
      where: { eventType: "device.telemetry_received", aggregateId: batch!.id },
    });
    expect(event).not.toBeNull();
    expect((event!.payload as { meterIds: string[] }).meterIds).toEqual([f.meter.id]);

    const hub = await prisma.hub.findUniqueOrThrow({ where: { id: f.hub.id } });
    expect(hub.lastSeenAt?.toISOString()).toBe(NOW.toISOString());
    expect(hub.status).toBe("ACTIVE");
  });

  it("late: receivedAt − ts > 60 min markiert late=true, bleibt accepted", async () => {
    const f = await createIngestFixture();
    const res = await run(
      f,
      envelopeFor(f, [reading(f, { ts: "2026-07-22T12:00:00.000Z" })]),
    );
    expect(res.acceptedCount).toBe(1);
    const row = await prisma.deviceReading.findFirstOrThrow({ where: { meterId: f.meter.id } });
    expect(row.late).toBe(true);
  });

  it("clock skew: |sentAt − now| > 5 min ⇒ Kennzeichnung + CLOCK_SKEW-Alert, KEIN Reject", async () => {
    const f = await createIngestFixture();
    const res = await run(
      f,
      envelopeFor(f, [reading(f)], { sentAt: "2026-07-22T14:41:01.000Z" }),
    );
    expect(res.clockSkewSuspect).toBe(true);
    expect(res.acceptedCount).toBe(1);
    const row = await prisma.deviceReading.findFirstOrThrow({ where: { meterId: f.meter.id } });
    expect(row.clockSkewSuspect).toBe(true);
    const alert = await prisma.deviceAlert.findFirst({
      where: { type: "CLOCK_SKEW", hubId: f.hub.id },
    });
    expect(alert?.status).toBe("OPEN");
  });
});

describe("processBatch — Idempotenz (ADR-009 §3)", () => {
  it("gleiche batchId + gleicher payloadHash ⇒ persistierte Antwort wörtlich, keine neuen Readings", async () => {
    const f = await createIngestFixture();
    const envelope = envelopeFor(f, [reading(f)]);
    const first = await run(f, envelope);
    const second = await run(f, envelope);
    expect(second).toEqual(first);
    expect(await prisma.deviceReading.count({ where: { meterId: f.meter.id } })).toBe(1);
    expect(await prisma.ingestBatch.count({ where: { hubId: f.hub.id } })).toBe(1);
  });

  it("gleiche batchId + abweichender payloadHash ⇒ BatchConflictError + PAYLOAD_HASH_CONFLICT-Alert", async () => {
    const f = await createIngestFixture();
    const envelope = envelopeFor(f, [reading(f)]);
    await run(f, envelope);

    const tampered = { ...envelope, readings: [reading(f, { value: "9999.999" })] };
    await expect(
      processBatch(f.hub, tampered, JSON.stringify(tampered), { now: NOW }),
    ).rejects.toBeInstanceOf(BatchConflictError);
    expect(
      await prisma.deviceAlert.count({ where: { type: "PAYLOAD_HASH_CONFLICT", hubId: f.hub.id } }),
    ).toBe(1);
  });

  it("hubSerial ≠ authentifizierter Hub ⇒ HubSerialMismatchError (ganzer Batch)", async () => {
    const f = await createIngestFixture();
    const envelope = envelopeFor(f, [reading(f)], { hubSerial: "PH360-FREMD-9999" });
    await expect(run(f, envelope)).rejects.toBeInstanceOf(HubSerialMismatchError);
    expect(await prisma.ingestBatch.count({ where: { hubId: f.hub.id } })).toBe(0);
  });
});

describe("processBatch — jeder Reject-Grund (ADR-009 §3/§5)", () => {
  it("schema: kaputtes Item wird einzeln rejected, Rest accepted (Teilerfolg)", async () => {
    const f = await createIngestFixture();
    const res = await run(f, envelopeFor(f, [{ garbage: true }, reading(f)]));
    expect(res.results).toEqual([
      { index: 0, status: "rejected", reason: "schema" },
      { index: 1, status: "accepted" },
    ]);
  });

  it("ts_out_of_bounds: > 5 min Zukunft oder älter als 90 Tage", async () => {
    const f = await createIngestFixture();
    const res = await run(
      f,
      envelopeFor(f, [
        reading(f, { ts: "2026-07-22T14:45:00.000Z", seq: 1 }), // NOW+14min Zukunft
        reading(f, { ts: "2026-04-01T00:00:00.000Z", seq: 2 }), // > 90 Tage alt
      ]),
    );
    expect(res.results.map((r) => r.reason)).toEqual(["ts_out_of_bounds", "ts_out_of_bounds"]);
  });

  it("unknown_channel: unbekannter Kanal ⇒ rejected + DeviceAlert (kein stilles Verwerfen)", async () => {
    const f = await createIngestFixture();
    const res = await run(f, envelopeFor(f, [reading(f, { channelRef: "devEUI:UNBEKANNT:9" })]));
    expect(res.results[0]).toEqual({ index: 0, status: "rejected", reason: "unknown_channel" });
    expect(
      await prisma.deviceAlert.count({ where: { type: "UNKNOWN_CHANNEL", hubId: f.hub.id } }),
    ).toBe(1);
  });

  it("no_valid_assignment: Kanal bekannt, aber zum ts kein gültiges Assignment", async () => {
    const f = await createIngestFixture({
      validFrom: new Date("2026-07-23T00:00:00.000Z"), // erst NACH dem Reading-ts gültig
    });
    const res = await run(f, envelopeFor(f, [reading(f)]));
    expect(res.results[0]?.reason).toBe("no_valid_assignment");
    expect(
      await prisma.deviceAlert.count({ where: { type: "NO_VALID_ASSIGNMENT", hubId: f.hub.id } }),
    ).toBe(1);
  });

  it("serial_mismatch: meterSerial widerspricht dem Assignment ⇒ rejected + Alert", async () => {
    const f = await createIngestFixture();
    const res = await run(f, envelopeFor(f, [reading(f, { meterSerial: "FALSCHE-SERIE" })]));
    expect(res.results[0]?.reason).toBe("serial_mismatch");
    expect(
      await prisma.deviceAlert.count({ where: { type: "SERIAL_MISMATCH", hubId: f.hub.id } }),
    ).toBe(1);
  });

  it("non_monotonic_register: Zählerstand unter dem letzten bekannten Original ⇒ rejected + Alert", async () => {
    const f = await createIngestFixture();
    await run(f, envelopeFor(f, [reading(f, { ts: "2026-07-22T14:00:00.000Z", value: "1000.500" })]));
    const res = await run(
      f,
      envelopeFor(f, [reading(f, { ts: "2026-07-22T14:15:00.000Z", value: "999.000", seq: 2 })]),
    );
    expect(res.results[0]?.reason).toBe("non_monotonic_register");
    expect(
      await prisma.deviceAlert.count({
        where: { type: "NON_MONOTONIC_REGISTER", hubId: f.hub.id },
      }),
    ).toBe(1);
  });

  it("duplicate (wertgleich) vs. conflicting_value (wertverschieden) gegen das DB-Original", async () => {
    const f = await createIngestFixture();
    await run(f, envelopeFor(f, [reading(f)]));

    const dup = await run(f, envelopeFor(f, [reading(f)]));
    expect(dup.results[0]).toEqual({ index: 0, status: "duplicate" });
    expect(dup.duplicateCount).toBe(1);

    const conflict = await run(f, envelopeFor(f, [reading(f, { value: "1001.000" })]));
    expect(conflict.results[0]?.reason).toBe("conflicting_value");
    expect(
      await prisma.deviceAlert.count({ where: { type: "CONFLICTING_VALUE", hubId: f.hub.id } }),
    ).toBe(1);
    // Original bleibt unverändert (append-only):
    expect(await prisma.deviceReading.count({ where: { meterId: f.meter.id } })).toBe(1);
  });

  it("in-Batch-Duplikat: wertgleich ⇒ duplicate, wertverschieden ⇒ conflicting_value", async () => {
    const f = await createIngestFixture();
    const res = await run(
      f,
      envelopeFor(f, [
        reading(f, { seq: 1 }),
        reading(f, { seq: 2 }),
        reading(f, { seq: 3, value: "2000.000" }),
      ]),
    );
    expect(res.results.map((r) => r.status)).toEqual(["accepted", "duplicate", "rejected"]);
    expect(res.results[2]?.reason).toBe("conflicting_value");
    expect(await prisma.deviceReading.count({ where: { meterId: f.meter.id } })).toBe(1);
  });
});
```

```bash
pnpm db:test:up && pnpm exec vitest run --project integration packages/ingestion/src/process-batch.itest.ts
```
Erwartet: FAIL — `Cannot find module './process-batch.js'`.

- [ ] **Step 2: `process-batch.ts` implementieren**

`packages/ingestion/src/process-batch.ts`:
```ts
import { Prisma, prisma } from "@ph360/database";
import type { Hub } from "@ph360/database";
import {
  ingestReadingSchema,
  ingestResponseSchema,
  type IngestEnvelopeLoose,
  type IngestItemResult,
  type IngestResponse,
  type RejectReason,
} from "@ph360/api-contracts";
import { loadIngestConfig, type IngestConfig } from "./config.js";
import { BatchConflictError, HubSerialMismatchError } from "./errors.js";
import { hashPayload } from "./payload-hash.js";
import { raiseAlert } from "./alerts.js";

interface AcceptedItem {
  meterId: string;
  assignmentId: string;
  ts: Date;
  kind: "REGISTER" | "DELTA";
  value: string;
  late: boolean;
}

export interface ProcessBatchOptions {
  now?: Date;
  config?: IngestConfig;
}

/**
 * ADR-009 §3/§5: Idempotenz-Prüfung, hubSerial-Bindung, Clock-Skew-Kennzeichnung,
 * Per-Item-Pipeline in §5-Reihenfolge (schema → ts-Grenzen → Mapping → Serial-
 * Plausibilisierung → Monotonie → Dedupe), transaktionales Schreiben (IngestBatch
 * + DeviceReading append-only + DomainEvent device.telemetry_received).
 */
export async function processBatch(
  hub: Hub,
  envelope: IngestEnvelopeLoose,
  rawBody: string,
  opts: ProcessBatchOptions = {},
): Promise<IngestResponse> {
  const now = opts.now ?? new Date();
  const config = opts.config ?? loadIngestConfig();
  const payloadHash = hashPayload(rawBody);

  // §3 Idempotenz: bekannte batchId ⇒ persistierte Antwort bzw. 409 bei Hash-Abweichung.
  const existing = await prisma.ingestBatch.findUnique({
    where: { hubId_batchId: { hubId: hub.id, batchId: envelope.batchId } },
  });
  if (existing) {
    if (existing.payloadHash !== payloadHash) {
      await raiseAlert({
        type: "PAYLOAD_HASH_CONFLICT",
        hubId: hub.id,
        organizationId: hub.organizationId,
        message: `batchId ${envelope.batchId}: payloadHash weicht vom persistierten Batch ab`,
        now,
      });
      throw new BatchConflictError(envelope.batchId);
    }
    return ingestResponseSchema.parse(existing.responseJson);
  }

  // §2: hubSerial MUSS zum authentifizierten Credential gehören.
  if (envelope.hubSerial !== hub.serialNumber) {
    throw new HubSerialMismatchError(envelope.hubSerial, hub.serialNumber);
  }

  // §5.1a: Clock-Skew des Envelopes — kennzeichnen, nicht rejecten.
  const sentAt = new Date(envelope.sentAt);
  const clockSkewSuspect =
    Math.abs(sentAt.getTime() - now.getTime()) > config.clockSkewToleranceMs;
  if (clockSkewSuspect) {
    await raiseAlert({
      type: "CLOCK_SKEW",
      hubId: hub.id,
      organizationId: hub.organizationId,
      message: `sentAt ${envelope.sentAt} weicht > ${String(config.clockSkewToleranceMs / 60_000)} min von der Serverzeit ab`,
      now,
    });
  }

  const results: IngestItemResult[] = [];
  const accepted: AcceptedItem[] = [];
  // In-Batch-Dedupe: (meterId, ts, kind) → value der ersten Annahme.
  const seenInBatch = new Map<string, Prisma.Decimal>();

  for (let index = 0; index < envelope.readings.length; index++) {
    const reject = (reason: RejectReason): void => {
      results.push({ index, status: "rejected", reason });
    };

    // §5.1 Schema je Item (Teilerfolge sind normal).
    const parsed = ingestReadingSchema.safeParse(envelope.readings[index]);
    if (!parsed.success) {
      reject("schema");
      continue;
    }
    const item = parsed.data;
    const ts = new Date(item.ts);

    // §5.1b harte ts-Grenzen.
    if (
      ts.getTime() > now.getTime() + config.maxFutureMs ||
      ts.getTime() < now.getTime() - config.maxAgeDays * 86_400_000
    ) {
      reject("ts_out_of_bounds");
      continue;
    }

    // §5.2 Mapping: ausschließlich channelRef → zum ts gültiges Assignment.
    const candidates = await prisma.deviceAssignment.findMany({
      where: { hubId: hub.id, channelRef: item.channelRef },
      include: { meter: true },
    });
    if (candidates.length === 0) {
      await raiseAlert({
        type: "UNKNOWN_CHANNEL",
        hubId: hub.id,
        organizationId: hub.organizationId,
        message: `unbekannter Kanal ${item.channelRef}`,
        now,
      });
      reject("unknown_channel");
      continue;
    }
    const assignment = candidates.find(
      (a) => a.validFrom.getTime() <= ts.getTime() &&
        (a.validTo === null || ts.getTime() < a.validTo.getTime()),
    );
    if (!assignment) {
      await raiseAlert({
        type: "NO_VALID_ASSIGNMENT",
        hubId: hub.id,
        organizationId: hub.organizationId,
        meteringPointId: candidates[0]?.meteringPointId,
        message: `${item.channelRef} hat zum ts ${item.ts} kein gültiges Assignment`,
        now,
      });
      reject("no_valid_assignment");
      continue;
    }

    // §5.2 meterSerial: NUR Plausibilisierung.
    if (item.meterSerial !== undefined && item.meterSerial !== assignment.meter.serialNumber) {
      await raiseAlert({
        type: "SERIAL_MISMATCH",
        hubId: hub.id,
        organizationId: hub.organizationId,
        meteringPointId: assignment.meteringPointId,
        message: `${item.meterSerial} ≠ ${assignment.meter.serialNumber} (${item.channelRef})`,
        now,
      });
      reject("serial_mismatch");
      continue;
    }

    const value = new Prisma.Decimal(item.value);
    const kind = item.kind === "register" ? ("REGISTER" as const) : ("DELTA" as const);
    const dupKey = `${assignment.meterId}|${ts.toISOString()}|${kind}`;

    // §3 In-Batch-Dedupe (das DB-Original entsteht erst am Batch-Ende).
    const inBatch = seenInBatch.get(dupKey);
    if (inBatch !== undefined) {
      if (inBatch.equals(value)) {
        results.push({ index, status: "duplicate" });
      } else {
        await raiseAlert({
          type: "CONFLICTING_VALUE",
          hubId: hub.id,
          organizationId: hub.organizationId,
          meteringPointId: assignment.meteringPointId,
          message: `in-Batch-Konflikt ${dupKey}`,
          now,
        });
        reject("conflicting_value");
      }
      continue;
    }

    // §3 Item-Dedupe gegen das DB-Original (supersedesId IS NULL).
    const original = await prisma.deviceReading.findFirst({
      where: { meterId: assignment.meterId, ts, kind, supersedesId: null },
    });
    if (original) {
      if (original.value.equals(value)) {
        results.push({ index, status: "duplicate" });
      } else {
        await raiseAlert({
          type: "CONFLICTING_VALUE",
          hubId: hub.id,
          organizationId: hub.organizationId,
          meteringPointId: assignment.meteringPointId,
          message: `wertverschiedenes Duplikat ${dupKey}`,
          now,
        });
        reject("conflicting_value");
      }
      continue;
    }

    // §5.3 Monotonie von Zählerständen (REGISTER) gegen benachbarte Originale.
    if (kind === "REGISTER") {
      const prev = await prisma.deviceReading.findFirst({
        where: { meterId: assignment.meterId, kind: "REGISTER", supersedesId: null, ts: { lt: ts } },
        orderBy: { ts: "desc" },
      });
      const next = await prisma.deviceReading.findFirst({
        where: { meterId: assignment.meterId, kind: "REGISTER", supersedesId: null, ts: { gt: ts } },
        orderBy: { ts: "asc" },
      });
      if ((prev && value.lessThan(prev.value)) || (next && value.greaterThan(next.value))) {
        await raiseAlert({
          type: "NON_MONOTONIC_REGISTER",
          hubId: hub.id,
          organizationId: hub.organizationId,
          meteringPointId: assignment.meteringPointId,
          message: `nicht-monotoner Zählerstand ${item.value} @ ${item.ts} (${item.channelRef})`,
          now,
        });
        reject("non_monotonic_register");
        continue;
      }
    }

    seenInBatch.set(dupKey, value);
    accepted.push({
      meterId: assignment.meterId,
      assignmentId: assignment.id,
      ts,
      kind,
      value: item.value,
      late: now.getTime() - ts.getTime() > config.lateThresholdMs,
    });
    results.push({ index, status: "accepted" });
  }

  const acceptedCount = accepted.length;
  const duplicateCount = results.filter((r) => r.status === "duplicate").length;
  const rejectedCount = results.filter((r) => r.status === "rejected").length;
  const response: IngestResponse = {
    batchId: envelope.batchId,
    clockSkewSuspect,
    acceptedCount,
    duplicateCount,
    rejectedCount,
    results,
  };

  try {
    await prisma.$transaction(async (tx) => {
      const batch = await tx.ingestBatch.create({
        data: {
          hubId: hub.id,
          batchId: envelope.batchId,
          payloadHash,
          responseJson: response as unknown as Prisma.InputJsonValue,
          acceptedCount,
          duplicateCount,
          rejectedCount,
        },
      });
      if (accepted.length > 0) {
        await tx.deviceReading.createMany({
          data: accepted.map((a) => ({
            meterId: a.meterId,
            assignmentId: a.assignmentId,
            ts: a.ts,
            kind: a.kind,
            value: a.value,
            receivedAt: now,
            late: a.late,
            clockSkewSuspect,
            batchId: batch.id,
          })),
        });
        await tx.domainEvent.create({
          data: {
            eventType: "device.telemetry_received",
            aggregateType: "IngestBatch",
            aggregateId: batch.id,
            organizationId: hub.organizationId,
            payload: {
              hubId: hub.id,
              ingestBatchId: batch.id,
              meterIds: [...new Set(accepted.map((a) => a.meterId))],
              hasLate: accepted.some((a) => a.late),
            },
          },
        });
      }
      await tx.hub.update({
        where: { id: hub.id },
        data: {
          lastSeenAt: now,
          status: hub.status === "REGISTERED" ? "ACTIVE" : hub.status,
        },
      });
    });
  } catch (err) {
    // Concurrency: parallele Sends derselben batchId ⇒ Gewinner-Antwort zurückgeben.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winner = await prisma.ingestBatch.findUnique({
        where: { hubId_batchId: { hubId: hub.id, batchId: envelope.batchId } },
      });
      if (winner) {
        if (winner.payloadHash !== payloadHash) throw new BatchConflictError(envelope.batchId);
        return ingestResponseSchema.parse(winner.responseJson);
      }
    }
    throw err;
  }

  return response;
}
```

An `packages/ingestion/src/index.ts` anhängen:
```ts
export { processBatch, type ProcessBatchOptions } from "./process-batch.js";
```

- [ ] **Step 3: Tests grün + Typecheck + Commit**

```bash
pnpm db:test:up && pnpm exec vitest run --project integration packages/ingestion/src/process-batch.itest.ts
pnpm --filter @ph360/ingestion typecheck
```
Erwartet: 12 Tests PASS; Typecheck ohne Fehler.

```bash
git add packages/ingestion
git commit -m "feat(ingest): processBatch — Idempotenz mit persistierter Antwort, 409 bei payloadHash-Konflikt, Per-Item-Pipeline nach ADR-009 §5, Outbox-Event"
```

---

## Task 6: Platform-Routen `/api/v1/ingest/telemetry` + `/api/v1/ingest/credentials/rotate`

**Files:**
- Create: `apps/platform/src/app/api/v1/ingest/telemetry/route.ts`, `apps/platform/src/app/api/v1/ingest/credentials/rotate/route.ts`
- Test: `apps/platform/src/app/api/v1/ingest/telemetry/route.itest.ts`, `apps/platform/src/app/api/v1/ingest/credentials/rotate/route.itest.ts`
- Modify: `apps/platform/package.json`, `turbo.json`, `.env.example`, `.env`

- [ ] **Step 1: Dependencies + env verdrahten**

In `apps/platform/package.json` unter `dependencies` ergänzen:
```json
"@ph360/api-contracts": "workspace:*",
"@ph360/ingestion": "workspace:*",
```
Falls `@ph360/testing` dort noch nicht als devDependency steht (WP-1.3 Task „Admin-Lesesicht“), ergänzen:
```json
"@ph360/testing": "workspace:*"
```

In `turbo.json` `globalEnv` ergänzen:
```json
"INGEST_CLOCK_SKEW_MIN",
"INGEST_TS_MAX_FUTURE_MIN",
"INGEST_TS_MAX_AGE_DAYS",
"INGEST_LATE_THRESHOLD_MIN",
"INGEST_RATE_LIMIT_PER_MIN",
"INGEST_ROTATION_GRACE_DAYS",
"HUB_SEED_TOKEN",
"GAP_ALERT_MISSING_INTERVALS",
"GAP_PUSH_HOURS",
"GAP_SWEEP_INTERVAL_MS"
```

An `.env.example` UND `.env` anhängen (Defaults gelten auch ohne Eintrag — hier nur Dokumentation):
```bash
# --- Telemetrie-Ingestion (WP-APP-1, ADR-009) — alle optional, Defaults in Klammern
INGEST_CLOCK_SKEW_MIN=5          # Envelope-Skew-Toleranz in Minuten (5)
INGEST_TS_MAX_FUTURE_MIN=5       # Reading-ts max. Zukunft in Minuten (5)
INGEST_TS_MAX_AGE_DAYS=90        # Reading-ts max. Alter in Tagen (90)
INGEST_LATE_THRESHOLD_MIN=60     # late-Markierung ab Minuten Verzug (60)
INGEST_RATE_LIMIT_PER_MIN=120    # Requests je Hub und Minute (120)
INGEST_ROTATION_GRACE_DAYS=7     # Gültigkeit des Alt-Tokens nach Rotation (7)
HUB_SEED_TOKEN=pht_test_simulator_token_nur_dev   # Token des Seed-Hubs (NUR Testmandant)
GAP_ALERT_MISSING_INTERVALS=8    # DeviceAlert ab N fehlenden 15-min-Intervallen (8)
GAP_PUSH_HOURS=12                # notification.requested ab N Stunden ohne Daten (12)
GAP_SWEEP_INTERVAL_MS=900000     # Worker-Gap-Sweep-Intervall in ms (15 min)
```

```bash
pnpm install
```

- [ ] **Step 2: Fehlschlagende Routen-Integrationstests schreiben**

`apps/platform/src/app/api/v1/ingest/telemetry/route.itest.ts`:
```ts
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@ph360/database";
import { revokeHubCredentials } from "@ph360/ingestion";
import { createIngestFixture } from "@ph360/ingestion/test-fixtures";
import { POST } from "./route.js";

function post(body: unknown, token?: string): Request {
  return new Request("http://localhost:3100/api/v1/ingest/telemetry", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function envelope(f: Awaited<ReturnType<typeof createIngestFixture>>, minutesAgo = 16) {
  const ts = new Date(Math.floor((Date.now() - minutesAgo * 60_000) / 900_000) * 900_000);
  return {
    batchId: randomUUID(),
    hubSerial: f.hub.serialNumber,
    sentAt: new Date().toISOString(),
    readings: [
      { channelRef: f.assignment.channelRef, ts: ts.toISOString(), kind: "register", value: "1000.500", seq: 1 },
    ],
  };
}

describe("POST /api/v1/ingest/telemetry", () => {
  it("200: gültiger Batch wird angenommen und beantwortet", async () => {
    const f = await createIngestFixture();
    const res = await POST(post(envelope(f), f.token));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.acceptedCount).toBe(1);
  });

  it("401 UNAUTHENTICATED: ohne Token / mit revokiertem Token + AuditEvent", async () => {
    const f = await createIngestFixture();

    const noToken = await POST(post(envelope(f)));
    expect(noToken.status).toBe(401);
    expect((await noToken.json()).error.code).toBe("UNAUTHENTICATED");

    await revokeHubCredentials(f.hub.id);
    const revoked = await POST(post(envelope(f), f.token));
    expect(revoked.status).toBe(401);

    expect(
      await prisma.auditEvent.count({ where: { action: "ingest.auth_failed" } }),
    ).toBeGreaterThanOrEqual(2);
  });

  it("403 FORBIDDEN: hubSerial gehört nicht zum Credential + AuditEvent", async () => {
    const f = await createIngestFixture();
    const res = await POST(post({ ...envelope(f), hubSerial: "PH360-FREMD-1" }, f.token));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
    expect(
      await prisma.auditEvent.count({ where: { action: "ingest.hub_serial_mismatch" } }),
    ).toBe(1);
  });

  it("409 CONFLICT: bekannte batchId mit abweichendem payloadHash", async () => {
    const f = await createIngestFixture();
    const env = envelope(f);
    expect((await POST(post(env, f.token))).status).toBe(200);
    const tampered = {
      ...env,
      readings: [{ ...env.readings[0], value: "9999.999" }],
    };
    const res = await POST(post(tampered, f.token));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

  it("422 VALIDATION_FAILED: kein JSON bzw. kaputter Envelope", async () => {
    const f = await createIngestFixture();
    expect((await POST(post("kein-json", f.token))).status).toBe(422);
    expect((await POST(post({ nur: "quatsch" }, f.token))).status).toBe(422);
  });
});
```

`apps/platform/src/app/api/v1/ingest/credentials/rotate/route.itest.ts`:
```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { authenticateHub, revokeHubCredentials } from "@ph360/ingestion";
import { rotateResponseSchema } from "@ph360/api-contracts";
import { createIngestFixture } from "@ph360/ingestion/test-fixtures";
import { POST } from "./route.js";

function post(token?: string): Request {
  return new Request("http://localhost:3100/api/v1/ingest/credentials/rotate", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe("POST /api/v1/ingest/credentials/rotate", () => {
  it("200: liefert neues Token; altes bleibt bis expiresAt gültig; AuditEvent geschrieben", async () => {
    const f = await createIngestFixture();
    const res = await POST(post(f.token));
    expect(res.status).toBe(200);
    const body = rotateResponseSchema.parse(await res.json());

    expect((await authenticateHub(`Bearer ${body.token}`)).id).toBe(f.hub.id);
    expect((await authenticateHub(`Bearer ${f.token}`)).id).toBe(f.hub.id);

    const credentials = await prisma.hubCredential.findMany({ where: { hubId: f.hub.id } });
    expect(credentials).toHaveLength(2);
    expect(
      await prisma.auditEvent.count({ where: { action: "hub.credential_rotated" } }),
    ).toBe(1);
  });

  it("401: revokierter Hub kann nicht rotieren", async () => {
    const f = await createIngestFixture();
    await revokeHubCredentials(f.hub.id);
    const res = await POST(post(f.token));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHENTICATED");
  });
});
```

```bash
pnpm db:test:up && pnpm exec vitest run --project integration apps/platform/src/app/api/v1/ingest
```
Erwartet: FAIL — `Cannot find module './route.js'`.

- [ ] **Step 3: Routen implementieren**

`apps/platform/src/app/api/v1/ingest/telemetry/route.ts`:
```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@ph360/database";
import { errorEnvelope, ingestEnvelopeLooseSchema } from "@ph360/api-contracts";
import {
  authenticateHub,
  BatchConflictError,
  checkRateLimit,
  HubSerialMismatchError,
  IngestAuthError,
  processBatch,
} from "@ph360/ingestion";

export const runtime = "nodejs";

/** Zugriffsklasse: hub-credential (ADR-009 §1) — kein Session-/Permission-Pfad. */
export async function POST(req: Request): Promise<NextResponse> {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  try {
    const hub = await authenticateHub(req.headers.get("authorization"));

    if (!checkRateLimit(hub.id)) {
      return NextResponse.json(
        errorEnvelope("RATE_LIMITED", "Zu viele Anfragen für diesen Hub.", requestId),
        { status: 429 },
      );
    }

    const rawBody = await req.text();
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        errorEnvelope("VALIDATION_FAILED", "Request-Body ist kein gültiges JSON.", requestId),
        { status: 422 },
      );
    }
    const parsed = ingestEnvelopeLooseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        errorEnvelope("VALIDATION_FAILED", "Envelope entspricht nicht dem Ingest-Schema.", requestId),
        { status: 422 },
      );
    }

    const response = await processBatch(hub, parsed.data, rawBody);
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof IngestAuthError) {
      await audit("ingest.auth_failed", requestId, err.message);
      return NextResponse.json(
        errorEnvelope("UNAUTHENTICATED", "Hub-Token fehlt, ist unbekannt, revokiert oder abgelaufen.", requestId),
        { status: 401 },
      );
    }
    if (err instanceof HubSerialMismatchError) {
      await audit("ingest.hub_serial_mismatch", requestId, err.message);
      return NextResponse.json(
        errorEnvelope("FORBIDDEN", "hubSerial gehört nicht zum authentifizierten Credential.", requestId),
        { status: 403 },
      );
    }
    if (err instanceof BatchConflictError) {
      return NextResponse.json(
        errorEnvelope("CONFLICT", "batchId bereits mit anderem payloadHash verarbeitet.", requestId),
        { status: 409 },
      );
    }
    console.error("[ingest] telemetry failed", err);
    return NextResponse.json(
      errorEnvelope("INTERNAL", "Interner Fehler bei der Batch-Verarbeitung.", requestId),
      { status: 500 },
    );
  }
}

async function audit(action: string, requestId: string, detail: string): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorType: "SYSTEM",
        action,
        subjectType: "Hub",
        subjectId: detail.slice(0, 200),
        requestId,
      },
    });
  } catch (err) {
    console.error("[ingest] audit write failed", err);
  }
}
```

`apps/platform/src/app/api/v1/ingest/credentials/rotate/route.ts`:
```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@ph360/database";
import { errorEnvelope, type RotateResponse } from "@ph360/api-contracts";
import { authenticateHub, IngestAuthError, rotateHubCredential } from "@ph360/ingestion";

export const runtime = "nodejs";

/** ADR-009 §1: Hub holt ein neues Token ab; das alte bleibt für die Grace-Frist gültig. */
export async function POST(req: Request): Promise<NextResponse> {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  try {
    const hub = await authenticateHub(req.headers.get("authorization"));
    const { token, previousExpiresAt } = await rotateHubCredential(hub.id);

    await prisma.auditEvent.create({
      data: {
        organizationId: hub.organizationId,
        actorType: "SYSTEM",
        action: "hub.credential_rotated",
        subjectType: "Hub",
        subjectId: hub.id,
        requestId,
      },
    });

    const body: RotateResponse = {
      token,
      previousExpiresAt: previousExpiresAt.toISOString(),
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    if (err instanceof IngestAuthError) {
      return NextResponse.json(
        errorEnvelope("UNAUTHENTICATED", "Hub-Token fehlt, ist unbekannt, revokiert oder abgelaufen.", requestId),
        { status: 401 },
      );
    }
    console.error("[ingest] rotate failed", err);
    return NextResponse.json(
      errorEnvelope("INTERNAL", "Interner Fehler bei der Rotation.", requestId),
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Tests grün + Typecheck + Commit**

```bash
pnpm db:test:up && pnpm exec vitest run --project integration apps/platform/src/app/api/v1/ingest
pnpm --filter @ph360/platform typecheck
```
Erwartet: 7 Tests PASS; Typecheck ohne Fehler.

```bash
git add apps/platform turbo.json .env.example pnpm-lock.yaml
git commit -m "feat(ingest): Platform-Routen /api/v1/ingest/telemetry + /credentials/rotate — 200/401/403/409/422/429, AuditEvents"
```

---

## Task 7: Seed — Testmandant-Hub, Simulator-Kanäle, MeterChange-Fixture

**Files:**
- Create: `packages/database/prisma/seed-hub.ts`
- Modify: `packages/database/prisma/seed.ts`

- [ ] **Step 1: `seed-hub.ts` schreiben (idempotent, nur Testmandant)**

`packages/database/prisma/seed-hub.ts`:
```ts
import { createHash } from "node:crypto";
import type { PrismaClient } from "../generated/client/index.js";

/**
 * WP-APP-1: Hub + Credential + Simulator-Kanäle im ADR-006-Testmandanten.
 * Idempotent: Wiederholte Seeds erzeugen keine Duplikate. Läuft NIE gegen
 * Produktivmandanten (harter Namenspräfix-Check).
 *
 * Hashing bewusst inline statt @ph360/ingestion: das database-Paket darf keine
 * Workspace-Abhängigkeit auf ingestion bekommen (ingestion → database, kein Zyklus).
 */
const HUB_SERIAL = "PH360-TEST-0001";
const DEFAULT_SEED_TOKEN = "pht_test_simulator_token_nur_dev";

const CHANNELS = [
  { channelRef: "devEUI:SIM-A:1", meterSerial: "SIM-METER-A", pointType: "UNIT_CONSUMPTION", withUnit: true },
  { channelRef: "devEUI:SIM-PV:1", meterSerial: "SIM-METER-PV", pointType: "PV_GENERATION", withUnit: false },
  { channelRef: "devEUI:SIM-G:1", meterSerial: "SIM-METER-G", pointType: "BUILDING_GENERAL", withUnit: false },
] as const;

function sha256(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function floorTo15Min(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 900_000) * 900_000);
}

export async function seedTestHub(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findFirst({
    where: { name: { startsWith: "TEST — " } },
  });
  if (!org) throw new Error("seedTestHub: ADR-006-Testmandant fehlt (WP-1.3-Seed zuerst ausführen)");

  const building = await prisma.building.findFirst({
    where: { property: { organizationId: org.id } },
    include: { units: { orderBy: { label: "asc" }, take: 2 } },
  });
  if (!building || building.units.length < 2) {
    throw new Error("seedTestHub: Pilotstruktur (Gebäude + Units) fehlt (WP-1.3-Seed zuerst ausführen)");
  }

  const hub = await prisma.hub.upsert({
    where: { serialNumber: HUB_SERIAL },
    update: {},
    create: { organizationId: org.id, serialNumber: HUB_SERIAL },
  });

  const token = process.env.HUB_SEED_TOKEN ?? DEFAULT_SEED_TOKEN;
  await prisma.hubCredential.upsert({
    where: { tokenHash: sha256(token) },
    update: { status: "ACTIVE" },
    create: { hubId: hub.id, tokenHash: sha256(token) },
  });

  // 3 Normal-Kanäle: Meter + MeteringPoint + unbefristetes Assignment.
  for (const channel of CHANNELS) {
    const meter = await prisma.meter.upsert({
      where: {
        manufacturer_model_serialNumber: {
          manufacturer: "SIM",
          model: "HUBSIM-1",
          serialNumber: channel.meterSerial,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        manufacturer: "SIM",
        model: "HUBSIM-1",
        serialNumber: channel.meterSerial,
      },
    });

    const existingAssignment = await prisma.deviceAssignment.findFirst({
      where: { hubId: hub.id, channelRef: channel.channelRef },
    });
    if (!existingAssignment) {
      const meteringPoint = await prisma.meteringPoint.create({
        data: {
          organizationId: org.id,
          buildingId: building.id,
          unitId: channel.withUnit ? building.units[0]!.id : null,
          pointType: channel.pointType,
        },
      });
      await prisma.deviceAssignment.create({
        data: {
          organizationId: org.id,
          meterId: meter.id,
          meteringPointId: meteringPoint.id,
          hubId: hub.id,
          channelRef: channel.channelRef,
          validFrom: new Date("2026-01-01T00:00:00Z"),
        },
      });
    }
  }

  // MeterChange-Fixture: Kanalpaar SIM-MC:1 (endet bei changeAt) / SIM-MC:2 (beginnt dort).
  let changeAt: Date;
  const existingOld = await prisma.deviceAssignment.findFirst({
    where: { hubId: hub.id, channelRef: "devEUI:SIM-MC:1" },
  });
  if (existingOld?.validTo) {
    changeAt = existingOld.validTo;
  } else {
    changeAt = floorTo15Min(new Date(Date.now() - 2 * 86_400_000));
    const meterOld = await prisma.meter.upsert({
      where: {
        manufacturer_model_serialNumber: {
          manufacturer: "SIM", model: "HUBSIM-1", serialNumber: "SIM-METER-MC1",
        },
      },
      update: {},
      create: { organizationId: org.id, manufacturer: "SIM", model: "HUBSIM-1", serialNumber: "SIM-METER-MC1" },
    });
    const meterNew = await prisma.meter.upsert({
      where: {
        manufacturer_model_serialNumber: {
          manufacturer: "SIM", model: "HUBSIM-1", serialNumber: "SIM-METER-MC2",
        },
      },
      update: {},
      create: { organizationId: org.id, manufacturer: "SIM", model: "HUBSIM-1", serialNumber: "SIM-METER-MC2" },
    });
    const meteringPoint = await prisma.meteringPoint.create({
      data: {
        organizationId: org.id,
        buildingId: building.id,
        unitId: building.units[1]!.id,
        pointType: "UNIT_CONSUMPTION",
      },
    });
    await prisma.deviceAssignment.create({
      data: {
        organizationId: org.id, meterId: meterOld.id, meteringPointId: meteringPoint.id,
        hubId: hub.id, channelRef: "devEUI:SIM-MC:1",
        validFrom: new Date("2026-01-01T00:00:00Z"), validTo: changeAt,
      },
    });
    await prisma.deviceAssignment.create({
      data: {
        organizationId: org.id, meterId: meterNew.id, meteringPointId: meteringPoint.id,
        hubId: hub.id, channelRef: "devEUI:SIM-MC:2", validFrom: changeAt,
      },
    });
    await prisma.meterChange.create({
      data: {
        organizationId: org.id, meterOldId: meterOld.id, meterNewId: meterNew.id,
        changedAt: changeAt, endValueOld: "5000.000", startValueNew: "0.000",
      },
    });
  }

  console.log(
    `[seed] Testmandant-Hub ${HUB_SERIAL} (org ${org.id}); Kanäle: ${CHANNELS.map((c) => c.channelRef).join(", ")}, MeterChange @ ${changeAt.toISOString()}`,
  );
  console.log(`[seed] Hub-Token (nur Dev/Testmandant): ${token}`);
}
```

- [ ] **Step 2: `seed.ts` erweitern**

In `packages/database/prisma/seed.ts` den Import ergänzen:
```ts
import { seedTestHub } from "./seed-hub.js";
```
und am Ende von `main()` (nach dem `seedPilotStructure`-Aufruf aus WP-1.3):
```ts
await seedTestHub(prisma);
```

- [ ] **Step 3: Seed zweimal ausführen (Idempotenz) + verifizieren**

```bash
set -a; . ./.env; set +a
pnpm db:seed && pnpm db:seed
docker compose exec postgres psql -U ph360 -d ph360 -Atc \
  "SELECT (SELECT count(*) FROM hub WHERE \"serialNumber\"='PH360-TEST-0001'),
          (SELECT count(*) FROM hub_credential),
          (SELECT count(*) FROM device_assignment),
          (SELECT count(*) FROM meter_change)"
```
Erwartet: beide Läufe erfolgreich, Ausgabe `1|1|5|1` (1 Hub, 1 Credential, 3 Normal- + 2 MC-Assignments, 1 MeterChange).

- [ ] **Step 4: Commit**

```bash
git add packages/database/prisma/seed-hub.ts packages/database/prisma/seed.ts
git commit -m "feat(ingest): idempotenter Testmandant-Seed — Hub PH360-TEST-0001, Simulator-Kanäle, MeterChange-Fixture (ADR-006)"
```

---

## Task 8: Worker — `device.telemetry_received`: DeviceState + Lückenerkennung + `notification.requested`

**Files:**
- Create: `apps/worker/src/telemetry.ts`
- Test: `apps/worker/src/telemetry.test.ts`, `apps/worker/src/telemetry.itest.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Fehlschlagenden Unit-Test Intervallrechnung schreiben**

`apps/worker/src/telemetry.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { missingIntervals } from "./telemetry.js";

describe("missingIntervals (96er-Regel, Spec §3.2)", () => {
  const last = new Date("2026-07-22T12:00:00.000Z");
  const at = (m: number) => new Date(last.getTime() + m * 60_000);

  it("zählt volle fehlende 15-min-Intervalle seit dem letzten Messwert", () => {
    expect(missingIntervals(last, at(0))).toBe(0);
    expect(missingIntervals(last, at(14))).toBe(0);
    expect(missingIntervals(last, at(15))).toBe(1);
    expect(missingIntervals(last, at(119))).toBe(7);
    expect(missingIntervals(last, at(120))).toBe(8); // Alert-Schwelle „2 h“
    expect(missingIntervals(last, at(12 * 60))).toBe(48); // Push-Schwelle „12 h“
  });

  it("ist nie negativ (Uhr-Drift)", () => {
    expect(missingIntervals(last, at(-30))).toBe(0);
  });
});
```

```bash
pnpm exec vitest run --project unit apps/worker/src/telemetry.test.ts
```
Erwartet: FAIL — `Cannot find module './telemetry.js'`.

- [ ] **Step 2: Fehlschlagenden Integrationstest schreiben**

`apps/worker/src/telemetry.itest.ts`:
```ts
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@ph360/database";
import { processBatch } from "@ph360/ingestion";
import { createIngestFixture, type IngestFixture } from "@ph360/ingestion/test-fixtures";
import { handleTelemetryReceived, sweepGaps } from "./telemetry.js";

/** Schreibt einen akzeptierten Register-Messwert mit Intervallende `ts` über die echte Pipeline. */
async function ingestReading(f: IngestFixture, ts: Date, value: string, now: Date) {
  const envelope = {
    batchId: randomUUID(),
    hubSerial: f.hub.serialNumber,
    sentAt: now.toISOString(),
    readings: [
      { channelRef: f.assignment.channelRef, ts: ts.toISOString(), kind: "register", value, seq: 1 },
    ],
  };
  const res = await processBatch(f.hub, envelope, JSON.stringify(envelope), { now });
  expect(res.acceptedCount).toBe(1);
}

async function drainTelemetryEvents(now: Date) {
  const events = await prisma.domainEvent.findMany({
    where: { eventType: "device.telemetry_received", status: "PENDING" },
  });
  for (const ev of events) {
    await handleTelemetryReceived(ev.payload as Record<string, unknown>, now);
    await prisma.domainEvent.update({ where: { id: ev.id }, data: { status: "PROCESSED" } });
  }
}

const T0 = new Date("2026-07-22T12:00:00.000Z");
const min = (m: number) => new Date(T0.getTime() + m * 60_000);

describe("worker telemetry — DeviceState + Lückenerkennung", () => {
  it("materialisiert DeviceState (lastValue/lastTs/online) aus dem neuesten Original", async () => {
    const f = await createIngestFixture();
    await ingestReading(f, T0, "1000.500", min(16));
    await drainTelemetryEvents(min(16));

    const state = await prisma.deviceState.findUniqueOrThrow({ where: { meterId: f.meter.id } });
    expect(state.lastValue?.toString()).toBe("1000.5");
    expect(state.lastTs?.toISOString()).toBe(T0.toISOString());
    expect(state.online).toBe(true);
    expect(state.gapSince).toBeNull();
  });

  it("sweepGaps: ab 8 fehlenden Intervallen offline + DATA_GAP-Alert, ab 12 h genau EIN notification.requested", async () => {
    const f = await createIngestFixture();
    await ingestReading(f, T0, "1000.500", min(16));
    await drainTelemetryEvents(min(16));

    // 2 h ohne Daten ⇒ Alert, aber noch kein Push-Event.
    await sweepGaps(min(120));
    const state = await prisma.deviceState.findUniqueOrThrow({ where: { meterId: f.meter.id } });
    expect(state.online).toBe(false);
    expect(state.gapSince?.toISOString()).toBe(T0.toISOString());
    const alert = await prisma.deviceAlert.findFirstOrThrow({
      where: { type: "DATA_GAP", meteringPointId: f.meteringPoint.id },
    });
    expect(alert.status).toBe("OPEN");
    expect(alert.notifiedAt).toBeNull();
    expect(await prisma.domainEvent.count({ where: { eventType: "notification.requested" } })).toBe(0);

    // 12 h ohne Daten ⇒ genau ein notification.requested, auch bei erneutem Sweep.
    await sweepGaps(min(12 * 60));
    await sweepGaps(min(12 * 60 + 15));
    const events = await prisma.domainEvent.findMany({
      where: { eventType: "notification.requested" },
    });
    expect(events).toHaveLength(1);
    const payload = events[0]!.payload as Record<string, unknown>;
    expect(payload.category).toBe("DATA_QUALITY");
    expect(payload.priority).toBe(2);
    expect(payload.kind).toBe("data_gap");
    expect(payload.meteringPointId).toBe(f.meteringPoint.id);
    expect(payload.meterId).toBe(f.meter.id);
    expect(payload.gapSince).toBe(T0.toISOString());
  });

  it("Entwarnung: neuer Messwert schließt Lücke ⇒ Alert RESOLVED + data_gap_resolved-Event", async () => {
    const f = await createIngestFixture();
    await ingestReading(f, T0, "1000.500", min(16));
    await drainTelemetryEvents(min(16));
    await sweepGaps(min(13 * 60));

    // Nachlieferung: aktueller Messwert trifft ein.
    const t1 = min(13 * 60);
    await ingestReading(f, t1, "1010.000", min(13 * 60 + 1));
    await drainTelemetryEvents(min(13 * 60 + 1));

    const state = await prisma.deviceState.findUniqueOrThrow({ where: { meterId: f.meter.id } });
    expect(state.online).toBe(true);
    expect(state.gapSince).toBeNull();

    const alert = await prisma.deviceAlert.findFirstOrThrow({
      where: { type: "DATA_GAP", meteringPointId: f.meteringPoint.id },
    });
    expect(alert.status).toBe("RESOLVED");

    const resolved = await prisma.domainEvent.findMany({
      where: { eventType: "notification.requested" },
      orderBy: { createdAt: "asc" },
    });
    expect(resolved).toHaveLength(2); // 1× data_gap + 1× data_gap_resolved
    expect((resolved[1]!.payload as Record<string, unknown>).kind).toBe("data_gap_resolved");
  });

  it("kein gültiges Assignment ⇒ keine Lückenerwartung, kein Alert", async () => {
    const f = await createIngestFixture();
    await ingestReading(f, T0, "1000.500", min(16));
    await drainTelemetryEvents(min(16));
    await prisma.deviceAssignment.update({
      where: { id: f.assignment.id },
      data: { validTo: min(30) },
    });
    await sweepGaps(min(300));
    expect(
      await prisma.deviceAlert.count({ where: { type: "DATA_GAP", meteringPointId: f.meteringPoint.id } }),
    ).toBe(0);
  });
});
```

```bash
pnpm db:test:up && pnpm exec vitest run --project integration apps/worker/src/telemetry.itest.ts
```
Erwartet: FAIL — `Cannot find module './telemetry.js'`.

- [ ] **Step 3: `telemetry.ts` implementieren**

`apps/worker/src/telemetry.ts`:
```ts
import { prisma } from "@ph360/database";

const INTERVAL_MS = 15 * 60 * 1000;

interface GapConfig {
  /** DeviceAlert ab N fehlenden 15-min-Intervallen in Folge (Default 8 = 2 h). */
  alertMissingIntervals: number;
  /** notification.requested ab N Stunden ohne Daten (Default 12). */
  pushHours: number;
}

function loadGapConfig(): GapConfig {
  return {
    alertMissingIntervals: Number(process.env.GAP_ALERT_MISSING_INTERVALS ?? 8),
    pushHours: Number(process.env.GAP_PUSH_HOURS ?? 12),
  };
}

/**
 * 96er-Regel (Spec §3.2): je MeteringPoint mit gültigem Assignment werden
 * 96 Intervalle/Tag erwartet. Fehlend = volle 15-min-Intervalle seit lastTs.
 */
export function missingIntervals(lastTs: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - lastTs.getTime()) / INTERVAL_MS));
}

/** Zum Zeitpunkt `now` gültiges Assignment eines Meters (oder null ⇒ keine Erwartung). */
async function currentAssignment(meterId: string, now: Date) {
  return prisma.deviceAssignment.findFirst({
    where: {
      meterId,
      validFrom: { lte: now },
      OR: [{ validTo: null }, { validTo: { gt: now } }],
    },
  });
}

/**
 * Kanonischer Payload-Contract von `notification.requested` (Producer: dieses WP;
 * Consumer: WP-APP-4 Task 8, dort Übersetzung MeteringPoint→Unit→PowerParticipant→userId):
 * `{ kind: "data_gap"|"data_gap_resolved"|"invoice_created", category: "DATA_QUALITY"|"BILLING"|"INCIDENT",
 *    priority: 1|2|3, meteringPointId?, meterId?, gapSince?, invoiceId? }`
 * Optionale Felder werden WEGGELASSEN, nie als null gesendet.
 */
async function emitGapNotification(
  kind: "data_gap" | "data_gap_resolved",
  input: { organizationId: string; meteringPointId: string; meterId: string; gapSince: Date | null },
): Promise<void> {
  await prisma.domainEvent.create({
    data: {
      eventType: "notification.requested",
      aggregateType: "MeteringPoint",
      aggregateId: input.meteringPointId,
      organizationId: input.organizationId,
      payload: {
        kind,
        category: "DATA_QUALITY",
        priority: 2,
        meteringPointId: input.meteringPointId,
        meterId: input.meterId,
        ...(input.gapSince ? { gapSince: input.gapSince.toISOString() } : {}),
      },
    },
  });
}

/** Lückenprüfung für EIN Meter: Alert ab Schwelle, Push-Event ab pushHours (einmalig). */
async function checkGap(meterId: string, lastTs: Date, now: Date): Promise<void> {
  const config = loadGapConfig();
  const assignment = await currentAssignment(meterId, now);
  if (!assignment) return; // keine gültige Zuordnung ⇒ keine 96er-Erwartung

  const missing = missingIntervals(lastTs, now);
  if (missing < config.alertMissingIntervals) return;

  await prisma.deviceState.update({
    where: { meterId },
    data: { online: false, gapSince: lastTs },
  });

  const open = await prisma.deviceAlert.findFirst({
    where: { type: "DATA_GAP", status: "OPEN", meteringPointId: assignment.meteringPointId },
  });
  const alert = open
    ? await prisma.deviceAlert.update({
        where: { id: open.id },
        data: { lastAt: now, message: `${String(missing)} Intervalle ohne Daten` },
      })
    : await prisma.deviceAlert.create({
        data: {
          type: "DATA_GAP",
          status: "OPEN",
          organizationId: assignment.organizationId,
          meteringPointId: assignment.meteringPointId,
          hubId: assignment.hubId,
          message: `${String(missing)} Intervalle ohne Daten`,
          firstAt: now,
          lastAt: now,
        },
      });

  const gapMs = now.getTime() - lastTs.getTime();
  if (gapMs >= config.pushHours * 3_600_000 && alert.notifiedAt === null) {
    await emitGapNotification("data_gap", {
      organizationId: assignment.organizationId,
      meteringPointId: assignment.meteringPointId,
      meterId,
      gapSince: lastTs,
    });
    await prisma.deviceAlert.update({ where: { id: alert.id }, data: { notifiedAt: now } });
  }
}

/** Entwarnung: offener DATA_GAP-Alert wird geschlossen; bei vorheriger Benachrichtigung folgt genau eine Entwarnung. */
async function resolveGap(meterId: string, now: Date): Promise<void> {
  const assignment = await currentAssignment(meterId, now);
  if (!assignment) return;
  const open = await prisma.deviceAlert.findFirst({
    where: { type: "DATA_GAP", status: "OPEN", meteringPointId: assignment.meteringPointId },
  });
  if (!open) return;
  await prisma.deviceAlert.update({
    where: { id: open.id },
    data: { status: "RESOLVED", lastAt: now },
  });
  if (open.notifiedAt !== null) {
    await emitGapNotification("data_gap_resolved", {
      organizationId: assignment.organizationId,
      meteringPointId: assignment.meteringPointId,
      meterId,
      gapSince: null,
    });
  }
}

/**
 * Handler für `device.telemetry_received` (Outbox): DeviceState-Materialisierung
 * aus dem neuesten nicht-supersedeten Original (Leseregel ADR-009 §5.4) +
 * Gap-Neubewertung der betroffenen Meter. Idempotent (Upsert + Dedupe über Alerts).
 * `now` ist nur für deterministische Tests parametrisierbar.
 */
export async function handleTelemetryReceived(
  payload: Record<string, unknown>,
  now: Date = new Date(),
): Promise<void> {
  const meterIds = Array.isArray(payload.meterIds) ? payload.meterIds.map(String) : [];

  for (const meterId of meterIds) {
    const latest = await prisma.deviceReading.findFirst({
      where: { meterId, supersedesId: null },
      orderBy: { ts: "desc" },
    });
    if (!latest) continue;

    const config = loadGapConfig();
    const missing = missingIntervals(latest.ts, now);
    const online = missing < config.alertMissingIntervals;

    await prisma.deviceState.upsert({
      where: { meterId },
      update: {
        lastValue: latest.value,
        lastTs: latest.ts,
        online,
        gapSince: online ? null : latest.ts,
      },
      create: {
        meterId,
        lastValue: latest.value,
        lastTs: latest.ts,
        online,
        gapSince: online ? null : latest.ts,
      },
    });

    if (online) await resolveGap(meterId, now);
    else await checkGap(meterId, latest.ts, now);
  }
}

/**
 * Periodischer Sweep: Lücken wachsen auch OHNE eingehende Events — deshalb
 * unabhängig vom Outbox-Pfad alle DeviceStates gegen die 96er-Regel prüfen.
 */
export async function sweepGaps(now: Date = new Date()): Promise<void> {
  const states = await prisma.deviceState.findMany({ where: { lastTs: { not: null } } });
  for (const state of states) {
    await checkGap(state.meterId, state.lastTs!, now);
  }
}
```

- [ ] **Step 4: Handler + Sweep in `apps/worker/src/index.ts` registrieren**

Import ergänzen (nach `import { sendMail, leadNotifyTo } from "./mailer.js";`):
```ts
import { handleTelemetryReceived, sweepGaps } from "./telemetry.js";
```

In der `handlers`-Registry nach dem `"lead.created"`-Handler ergänzen:
```ts
  "device.telemetry_received": handleTelemetryReceived,
```

Vor `console.log("[worker] outbox dispatcher started");` ergänzen:
```ts
const GAP_SWEEP_INTERVAL_MS = Number(process.env.GAP_SWEEP_INTERVAL_MS ?? 15 * 60 * 1000);
setInterval(() => {
  sweepGaps().catch((err) => console.error("[worker] gap sweep error:", err));
}, GAP_SWEEP_INTERVAL_MS);
```

`apps/worker/package.json` unter `dependencies` ergänzen (für die itest-Imports):
```json
"@ph360/api-contracts": "workspace:*",
"@ph360/ingestion": "workspace:*"
```
Dann `pnpm install`.

- [ ] **Step 5: Tests grün + Typecheck + Commit**

```bash
pnpm exec vitest run --project unit apps/worker/src/telemetry.test.ts
pnpm db:test:up && pnpm exec vitest run --project integration apps/worker/src/telemetry.itest.ts
pnpm --filter @ph360/worker typecheck
```
Erwartet: 2 Unit- + 4 Integrationstests PASS; Typecheck ohne Fehler.

```bash
git add apps/worker pnpm-lock.yaml
git commit -m "feat(worker): device.telemetry_received — DeviceState-Materialisierung, 96er-Lückenregel (Alert ab 8, Push-Event ab 12 h), Gap-Sweep"
```

---

## Task 9: `tools/hub-simulator` — deterministische Szenarien gegen die echte API

**Files:**
- Create: `tools/hub-simulator/package.json`, `tools/hub-simulator/tsconfig.json`, `tools/hub-simulator/src/rng.ts`, `tools/hub-simulator/src/profile.ts`, `tools/hub-simulator/src/scenarios.ts`, `tools/hub-simulator/src/index.ts`, `tools/hub-simulator/src/client.ts`, `tools/hub-simulator/src/cli.ts`
- Test: `tools/hub-simulator/src/scenarios.test.ts`, `tools/hub-simulator/src/profile.test.ts`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Workspace + Paket-Gerüst**

In `pnpm-workspace.yaml` unter `packages:` ergänzen:
```yaml
  - "tools/*"
```

`tools/hub-simulator/package.json`:
```json
{
  "name": "@ph360/hub-simulator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "start": "tsx src/cli.ts"
  },
  "dependencies": {
    "@ph360/api-contracts": "workspace:*",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "tsx": "^4.19.2",
    "typescript": "^5",
    "vitest": "^3.2.0"
  }
}
```

`tools/hub-simulator/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["src"]
}
```

```bash
pnpm install
```

- [ ] **Step 2: Fehlschlagende Determinismus-/Soll-Ergebnis-Tests schreiben**

`tools/hub-simulator/src/scenarios.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ingestEnvelopeSchema } from "@ph360/api-contracts";
import { buildScenario, type ScenarioInput } from "./scenarios.js";

const base: Omit<ScenarioInput, "scenario"> = {
  seed: 42,
  runId: 7,
  hubSerial: "PH360-TEST-0001",
  channelRef: "devEUI:SIM-A:1",
  start: "2026-07-20T00:15:00.000Z",
  intervals: 96,
};

describe("Hub-Simulator-Szenarien (ADR-009 §6, deterministisch)", () => {
  it("gleicher Seed ⇒ byte-identische Batches; anderer Seed ⇒ andere Werte", () => {
    const a = buildScenario({ ...base, scenario: "normal" });
    const b = buildScenario({ ...base, scenario: "normal" });
    const c = buildScenario({ ...base, scenario: "normal", seed: 43 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it("normal: 1 Batch, 96 monoton steigende Register, alle accepted erwartet, Schema-konform", () => {
    const s = buildScenario({ ...base, scenario: "normal" });
    expect(s.batches).toHaveLength(1);
    const env = ingestEnvelopeSchema.parse(s.batches[0]);
    expect(env.readings).toHaveLength(96);
    const values = env.readings.map((r) => Number(r.value));
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    expect(s.expected).toEqual({ accepted: 96, duplicate: 0, rejected: 0, reasons: {} });
  });

  it("gap: 8 aufeinanderfolgende Intervalle fehlen", () => {
    const s = buildScenario({ ...base, scenario: "gap" });
    const env = ingestEnvelopeSchema.parse(s.batches[0]);
    expect(env.readings).toHaveLength(88);
    const times = env.readings.map((r) => new Date(r.ts).getTime());
    const jumps = times.filter((t, i) => i > 0 && t - times[i - 1]! > 900_000);
    expect(jumps).toHaveLength(1);
    expect(s.expected.accepted).toBe(88);
  });

  it("duplicate_same: 2 Batches mit unterschiedlicher batchId, identischen Readings ⇒ 96 duplicate", () => {
    const s = buildScenario({ ...base, scenario: "duplicate_same" });
    expect(s.batches).toHaveLength(2);
    expect(s.batches[0]!.batchId).not.toBe(s.batches[1]!.batchId);
    expect(JSON.stringify(s.batches[0]!.readings)).toBe(JSON.stringify(s.batches[1]!.readings));
    expect(s.expected).toEqual({ accepted: 96, duplicate: 96, rejected: 0, reasons: {} });
  });

  it("duplicate_conflict: zweiter Batch wertverschieden ⇒ 96 conflicting_value", () => {
    const s = buildScenario({ ...base, scenario: "duplicate_conflict" });
    expect(JSON.stringify(s.batches[0]!.readings)).not.toBe(JSON.stringify(s.batches[1]!.readings));
    expect(s.expected).toEqual({
      accepted: 96,
      duplicate: 0,
      rejected: 96,
      reasons: { conflicting_value: 96 },
    });
  });

  it("meter_change: Kanal A endet vor changeAt, B beginnt dort; genau 1 no_valid_assignment-Probe", () => {
    const s = buildScenario({
      ...base,
      scenario: "meter_change",
      channelRef: "devEUI:SIM-MC:1",
      channelRefB: "devEUI:SIM-MC:2",
      changeAt: "2026-07-20T12:00:00.000Z",
    });
    const env = ingestEnvelopeSchema.parse(s.batches[0]);
    const changeMs = Date.parse("2026-07-20T12:00:00.000Z");
    const onA = env.readings.filter((r) => r.channelRef === "devEUI:SIM-MC:1");
    const onB = env.readings.filter((r) => r.channelRef === "devEUI:SIM-MC:2");
    expect(onA.filter((r) => Date.parse(r.ts) >= changeMs)).toHaveLength(1); // die Probe
    expect(onB.every((r) => Date.parse(r.ts) >= changeMs)).toBe(true);
    expect(s.expected.rejected).toBe(1);
    expect(s.expected.reasons).toEqual({ no_valid_assignment: 1 });
    expect(s.expected.accepted).toBe(96);
  });

  it("faulty: 1 accepted + je 1 unknown_channel/schema/serial_mismatch/non_monotonic_register + 2 ts_out_of_bounds", () => {
    const s = buildScenario({ ...base, scenario: "faulty" });
    expect(s.batches).toHaveLength(2);
    expect(s.expected).toEqual({
      accepted: 1,
      duplicate: 0,
      rejected: 6,
      reasons: {
        unknown_channel: 1,
        schema: 1,
        ts_out_of_bounds: 2,
        serial_mismatch: 1,
        non_monotonic_register: 1,
      },
    });
  });
});
```

`tools/hub-simulator/src/profile.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateDayLoadProfile } from "./profile.js";

const DAY = new Date("2026-06-15T00:00:00.000Z");

describe("generateDayLoadProfile (kanonischer Export für WP-APP-2 Task 8)", () => {
  it("liefert 96 15-min-Register ab dayStartUtc: kWh-Strings mit 3 Nachkommastellen, streng monoton", () => {
    const points = generateDayLoadProfile(DAY, { startRegisterKwh: 1000 });
    expect(points).toHaveLength(96);
    expect(points[0]!.ts).toBe("2026-06-15T00:00:00.000Z");
    expect(points[95]!.ts).toBe("2026-06-15T23:45:00.000Z");
    for (const p of points) expect(p.value).toMatch(/^\d+\.\d{3}$/);
    for (let i = 1; i < points.length; i++) {
      expect(Number(points[i]!.value)).toBeGreaterThan(Number(points[i - 1]!.value));
    }
    expect(Number(points[0]!.value)).toBeGreaterThan(1000);
  });

  it("ist deterministisch je dayStartUtc (gleicher Tag ⇒ identische Reihe)", () => {
    const a = generateDayLoadProfile(DAY, { startRegisterKwh: 1000 });
    const b = generateDayLoadProfile(DAY, { startRegisterKwh: 1000 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("gapIntervals lässt genau diese Slots aus; der Zählerstand läuft intern weiter", () => {
    const points = generateDayLoadProfile(DAY, {
      startRegisterKwh: 1000,
      gapIntervals: [30, 31, 32, 33],
    });
    expect(points).toHaveLength(92);
    const times = points.map((p) => Date.parse(p.ts));
    const jumps = times.filter((t, i) => i > 0 && t - times[i - 1]! > 900_000);
    expect(jumps).toHaveLength(1);
    // Endstand identisch zur Reihe ohne Lücke (Verbrauch geht nicht verloren):
    const full = generateDayLoadProfile(DAY, { startRegisterKwh: 1000 });
    expect(points[points.length - 1]!.value).toBe(full[95]!.value);
  });
});
```

```bash
pnpm exec vitest run --project unit tools/hub-simulator/src
```
Erwartet: FAIL — `Cannot find module './scenarios.js'` bzw. `'./profile.js'`.

- [ ] **Step 3: `rng.ts` + `profile.ts` implementieren**

`tools/hub-simulator/src/rng.ts`:
```ts
/** mulberry32 — kleiner, guter, deterministischer PRNG (Seed einstellbar). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gültige, deterministische UUID aus (runId, laufender Nummer) — Idempotenz testbar. */
export function deterministicBatchId(runId: number, n: number): string {
  const a = (runId >>> 0).toString(16).padStart(8, "0").slice(-8);
  const b = (n >>> 0).toString(16).padStart(12, "0").slice(-12);
  return `${a}-0000-4000-8000-${b}`;
}
```

`tools/hub-simulator/src/profile.ts`:
```ts
import { mulberry32 } from "./rng.js";

const INTERVAL_MS = 900_000;

/** 15-min-Slot des Tages (UTC): 0..95. */
export function slotOfDay(ts: Date): number {
  return ts.getUTCHours() * 4 + Math.floor(ts.getUTCMinutes() / 15);
}

/**
 * Haushalts-Lastprofil (kWh je 15 min): Nacht flach, Tag mittel, Abend-Peak.
 * `rand` liefert [0,1) — deterministisch via mulberry32.
 */
export function intervalConsumptionKwh(slot: number, rand: () => number): number {
  const base = slot < 24 ? 0.03 : slot < 68 ? 0.09 : slot < 88 ? 0.18 : 0.06;
  return base * (0.75 + rand() * 0.5);
}

/** kWh als Dezimal-String mit exakt 3 Nachkommastellen (Spec §4.1). */
export function formatKwh(value: number): string {
  return value.toFixed(3);
}

/**
 * Kanonischer Export (verbindliche Festlegung; WP-APP-2 Task 8 importiert ihn
 * aus "@ph360/hub-simulator"): 96 15-min-REGISTER-Werte eines Tages als
 * kWh-Strings (3 Nachkommastellen), via intervalConsumptionKwh kumuliert.
 * Deterministisch je dayStartUtc (Seed = Tagesindex). gapIntervals nennt die
 * ausgelassenen Slot-Indizes (0..95) — der Zählerstand läuft intern weiter,
 * die Lücke erzeugt also einen realistischen Wertsprung.
 */
export function generateDayLoadProfile(
  dayStartUtc: Date,
  opts: { startRegisterKwh: number; gapIntervals?: number[] },
): Array<{ ts: string; value: string }> {
  const rand = mulberry32((Math.floor(dayStartUtc.getTime() / 86_400_000) + 1) >>> 0);
  const gaps = new Set(opts.gapIntervals ?? []);
  let register = opts.startRegisterKwh;
  const points: Array<{ ts: string; value: string }> = [];
  for (let slot = 0; slot < 96; slot++) {
    register += intervalConsumptionKwh(slot, rand);
    if (gaps.has(slot)) continue;
    points.push({
      ts: new Date(dayStartUtc.getTime() + slot * INTERVAL_MS).toISOString(),
      value: formatKwh(register),
    });
  }
  return points;
}
```

- [ ] **Step 4: `scenarios.ts` implementieren**

`tools/hub-simulator/src/scenarios.ts`:
```ts
import type { IngestEnvelopeLoose, IngestReading, RejectReason } from "@ph360/api-contracts";
import { deterministicBatchId, mulberry32 } from "./rng.js";
import { formatKwh, intervalConsumptionKwh, slotOfDay } from "./profile.js";

export const SCENARIOS = [
  "normal",
  "gap",
  "meter_change",
  "duplicate_same",
  "duplicate_conflict",
  "faulty",
] as const;

export type ScenarioName = (typeof SCENARIOS)[number];

export interface ScenarioInput {
  scenario: ScenarioName;
  seed: number;
  /** Fließt in die deterministischen batchIds ein (Wiederholung ⇒ Idempotenz-Replay). */
  runId: number;
  hubSerial: string;
  channelRef: string;
  /** Neuer Kanal nach Zählerwechsel (nur meter_change). */
  channelRefB?: string;
  /** Wechselzeitpunkt ISO (nur meter_change; Seed gibt ihn aus). */
  changeAt?: string;
  /** Intervallende des ERSTEN Readings, ISO, 15-min-Raster. */
  start: string;
  intervals: number;
  /** Zählerstands-Basis in kWh (Default 1000). */
  startValue?: number;
}

export interface ExpectedSummary {
  accepted: number;
  duplicate: number;
  rejected: number;
  reasons: Partial<Record<RejectReason, number>>;
}

export interface Scenario {
  batches: IngestEnvelopeLoose[];
  expected: ExpectedSummary;
}

const INTERVAL_MS = 900_000;
const GAP_LENGTH = 8;

function tsAt(startMs: number, i: number): string {
  return new Date(startMs + i * INTERVAL_MS).toISOString();
}

/** Registerreihe: kumulierte Zählerstände über dem Lastprofil. */
function registerSeries(input: ScenarioInput): IngestReading[] {
  const rand = mulberry32(input.seed);
  const startMs = Date.parse(input.start);
  let register = input.startValue ?? 1000;
  const readings: IngestReading[] = [];
  for (let i = 0; i < input.intervals; i++) {
    const ts = new Date(startMs + i * INTERVAL_MS);
    register += intervalConsumptionKwh(slotOfDay(ts), rand);
    readings.push({
      channelRef: input.channelRef,
      ts: ts.toISOString(),
      kind: "register",
      value: formatKwh(register),
      seq: i + 1,
    });
  }
  return readings;
}

function envelope(
  input: ScenarioInput,
  n: number,
  readings: unknown[],
): IngestEnvelopeLoose {
  const last = readings[readings.length - 1] as IngestReading | undefined;
  const sentAt = new Date(
    (last ? Date.parse(last.ts) : Date.parse(input.start)) + 60_000,
  ).toISOString();
  return {
    batchId: deterministicBatchId(input.runId, n),
    hubSerial: input.hubSerial,
    sentAt,
    readings,
  };
}

const NO_REJECTS: ExpectedSummary["reasons"] = {};

export function buildScenario(input: ScenarioInput): Scenario {
  const startMs = Date.parse(input.start);
  if (Number.isNaN(startMs)) throw new Error(`ungültiger start: ${input.start}`);

  switch (input.scenario) {
    case "normal": {
      const readings = registerSeries(input);
      return {
        batches: [envelope(input, 1, readings)],
        expected: { accepted: readings.length, duplicate: 0, rejected: 0, reasons: NO_REJECTS },
      };
    }

    case "gap": {
      const gapStart = Math.floor(input.intervals / 3);
      if (input.intervals < gapStart + GAP_LENGTH) {
        throw new Error(`gap braucht ≥ ${String(gapStart + GAP_LENGTH)} Intervalle`);
      }
      const readings = registerSeries(input).filter(
        (_, i) => i < gapStart || i >= gapStart + GAP_LENGTH,
      );
      return {
        batches: [envelope(input, 1, readings)],
        expected: { accepted: readings.length, duplicate: 0, rejected: 0, reasons: NO_REJECTS },
      };
    }

    case "duplicate_same": {
      const readings = registerSeries(input);
      return {
        batches: [envelope(input, 1, readings), envelope(input, 2, readings)],
        expected: {
          accepted: readings.length,
          duplicate: readings.length,
          rejected: 0,
          reasons: NO_REJECTS,
        },
      };
    }

    case "duplicate_conflict": {
      const readings = registerSeries(input);
      const conflicting = readings.map((r) => ({
        ...r,
        value: formatKwh(Number(r.value) + 1),
      }));
      return {
        batches: [envelope(input, 1, readings), envelope(input, 2, conflicting)],
        expected: {
          accepted: readings.length,
          duplicate: 0,
          rejected: readings.length,
          reasons: { conflicting_value: readings.length },
        },
      };
    }

    case "meter_change": {
      if (!input.channelRefB || !input.changeAt) {
        throw new Error("meter_change braucht channelRefB + changeAt");
      }
      const changeMs = Date.parse(input.changeAt);
      const rand = mulberry32(input.seed);
      let registerOld = input.startValue ?? 1000;
      let registerNew = 0; // Anfangsstand neu (Seed: startValueNew 0.000)
      const readings: IngestReading[] = [];
      let seq = 0;
      for (let i = 0; i < input.intervals; i++) {
        const ts = new Date(startMs + i * INTERVAL_MS);
        const kwh = intervalConsumptionKwh(slotOfDay(ts), rand);
        seq += 1;
        if (ts.getTime() < changeMs) {
          registerOld += kwh;
          readings.push({
            channelRef: input.channelRef, ts: ts.toISOString(),
            kind: "register", value: formatKwh(registerOld), seq,
          });
        } else {
          registerNew += kwh;
          readings.push({
            channelRef: input.channelRefB, ts: ts.toISOString(),
            kind: "register", value: formatKwh(registerNew), seq,
          });
        }
      }
      // Probe: Alt-Kanal NACH validTo ⇒ no_valid_assignment (Assignment-Versionierung).
      readings.push({
        channelRef: input.channelRef,
        ts: new Date(changeMs).toISOString(),
        kind: "register",
        value: formatKwh(registerOld + 1),
        seq: seq + 1,
      });
      return {
        batches: [envelope(input, 1, readings)],
        expected: {
          accepted: input.intervals,
          duplicate: 0,
          rejected: 1,
          reasons: { no_valid_assignment: 1 },
        },
      };
    }

    case "faulty": {
      const t = (i: number) => tsAt(startMs, i);
      const first: IngestReading = {
        channelRef: input.channelRef, ts: t(0), kind: "register", value: "500.000", seq: 1,
      };
      const yearMs = 365 * 86_400_000;
      const second = [
        { channelRef: "devEUI:SIM-UNBEKANNT:99", ts: t(1), kind: "register", value: "1.000", seq: 1 },
        { channelRef: input.channelRef, ts: t(2), kind: "register", value: "abc", seq: 2 },
        { channelRef: input.channelRef, ts: new Date(startMs + yearMs).toISOString(), kind: "register", value: "600.000", seq: 3 },
        { channelRef: input.channelRef, ts: new Date(startMs - yearMs).toISOString(), kind: "register", value: "400.000", seq: 4 },
        { channelRef: input.channelRef, meterSerial: "SERIE-FALSCH", ts: t(3), kind: "register", value: "501.000", seq: 5 },
        { channelRef: input.channelRef, ts: t(1), kind: "register", value: "499.000", seq: 6 },
      ];
      return {
        batches: [envelope(input, 1, [first]), envelope(input, 2, second)],
        expected: {
          accepted: 1,
          duplicate: 0,
          rejected: 6,
          reasons: {
            unknown_channel: 1,
            schema: 1,
            ts_out_of_bounds: 2,
            serial_mismatch: 1,
            non_monotonic_register: 1,
          },
        },
      };
    }
  }
}
```

`tools/hub-simulator/src/index.ts` (Paket-Export — `generateDayLoadProfile` wird von WP-APP-2 Task 8 aus `@ph360/hub-simulator` importiert):
```ts
export { generateDayLoadProfile, intervalConsumptionKwh, formatKwh, slotOfDay } from "./profile.js";
export { mulberry32, deterministicBatchId } from "./rng.js";
export {
  buildScenario,
  SCENARIOS,
  type ExpectedSummary,
  type Scenario,
  type ScenarioInput,
  type ScenarioName,
} from "./scenarios.js";
```

- [ ] **Step 5: Tests grün**

```bash
pnpm exec vitest run --project unit tools/hub-simulator/src
```
Erwartet: 10 Tests PASS (7 Szenario- + 3 Profil-Tests).

- [ ] **Step 6: `client.ts` + `cli.ts` implementieren**

`tools/hub-simulator/src/client.ts`:
```ts
import {
  ingestResponseSchema,
  type IngestEnvelopeLoose,
  type IngestResponse,
} from "@ph360/api-contracts";

export interface SendResult {
  status: number;
  response?: IngestResponse;
  errorBody?: unknown;
}

/** Sendet einen Batch gegen die echte Ingest-API und validiert die Antwort gegen das Contract-Schema. */
export async function sendBatch(
  baseUrl: string,
  token: string,
  batch: IngestEnvelopeLoose,
): Promise<SendResult> {
  const res = await fetch(`${baseUrl}/api/v1/ingest/telemetry`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(batch),
  });
  const json: unknown = await res.json().catch(() => null);
  if (res.status === 200) {
    return { status: 200, response: ingestResponseSchema.parse(json) };
  }
  return { status: res.status, errorBody: json };
}
```

`tools/hub-simulator/src/cli.ts`:
```ts
import { parseArgs } from "node:util";
import type { RejectReason } from "@ph360/api-contracts";
import { buildScenario, SCENARIOS, type ScenarioName, type ExpectedSummary } from "./scenarios.js";
import { sendBatch } from "./client.js";

const { values } = parseArgs({
  options: {
    scenario: { type: "string" },
    "base-url": { type: "string", default: "http://localhost:3100" },
    token: { type: "string" },
    serial: { type: "string", default: "PH360-TEST-0001" },
    channel: { type: "string" },
    "channel-b": { type: "string", default: "devEUI:SIM-MC:2" },
    "change-at": { type: "string" },
    seed: { type: "string", default: "42" },
    intervals: { type: "string", default: "96" },
    start: { type: "string" },
    "run-id": { type: "string" },
  },
});

const scenario = values.scenario as ScenarioName | undefined;
if (!scenario || !SCENARIOS.includes(scenario)) {
  console.error(`Usage: pnpm --filter @ph360/hub-simulator start -- --scenario <${SCENARIOS.join("|")}>`);
  console.error("  [--base-url http://localhost:3100] [--token <hub-token>|env HUB_SEED_TOKEN]");
  console.error("  [--serial PH360-TEST-0001] [--channel <channelRef>] [--seed 42] [--intervals 96]");
  console.error("  [--start <ISO>] [--run-id <n>] [--channel-b devEUI:SIM-MC:2] [--change-at <ISO, aus Seed-Ausgabe>]");
  console.error("Hinweis: gegen eine frisch geseedete DB bzw. ein unbenutztes --start-Zeitfenster laufen lassen");
  console.error("(überlappende Fenster erzeugen konstruktionsbedingt duplicate/conflicting_value).");
  process.exit(1);
}

const token = values.token ?? process.env.HUB_SEED_TOKEN ?? "pht_test_simulator_token_nur_dev";
const intervals = Number.parseInt(values.intervals!, 10);
const floor15 = (ms: number) => new Date(Math.floor(ms / 900_000) * 900_000);

/** Default-Kanäle/-Fenster je Szenario — disjunkt, damit die Gate-Suite kollisionsfrei durchläuft. */
const DEFAULTS: Record<ScenarioName, { channel: string; startOffsetMs: number }> = {
  normal: { channel: "devEUI:SIM-A:1", startOffsetMs: intervals * 900_000 },
  gap: { channel: "devEUI:SIM-G:1", startOffsetMs: intervals * 900_000 },
  duplicate_same: { channel: "devEUI:SIM-PV:1", startOffsetMs: 24 * 3_600_000 },
  duplicate_conflict: { channel: "devEUI:SIM-PV:1", startOffsetMs: 48 * 3_600_000 },
  faulty: { channel: "devEUI:SIM-A:1", startOffsetMs: 30 * 3_600_000 },
  meter_change: { channel: "devEUI:SIM-MC:1", startOffsetMs: 0 },
};

if (scenario === "meter_change" && !values["change-at"]) {
  console.error("meter_change braucht --change-at (Wechselzeitpunkt aus der Seed-Ausgabe).");
  process.exit(1);
}

const start =
  values.start ??
  (scenario === "meter_change"
    ? floor15(Date.parse(values["change-at"]!) - (intervals / 2) * 900_000).toISOString()
    : floor15(Date.now() - DEFAULTS[scenario].startOffsetMs).toISOString());

const built = buildScenario({
  scenario,
  seed: Number.parseInt(values.seed!, 10),
  runId: values["run-id"] ? Number.parseInt(values["run-id"], 10) : Date.now() % 2_147_483_647,
  hubSerial: values.serial!,
  channelRef: values.channel ?? DEFAULTS[scenario].channel,
  channelRefB: values["channel-b"],
  changeAt: values["change-at"],
  start,
  intervals,
});

const actual: ExpectedSummary = { accepted: 0, duplicate: 0, rejected: 0, reasons: {} };

for (const batch of built.batches) {
  const result = await sendBatch(values["base-url"]!, token, batch);
  if (result.status !== 200 || !result.response) {
    console.error(`Batch ${batch.batchId}: HTTP ${String(result.status)}`, result.errorBody);
    process.exit(1);
  }
  actual.accepted += result.response.acceptedCount;
  actual.duplicate += result.response.duplicateCount;
  actual.rejected += result.response.rejectedCount;
  for (const item of result.response.results) {
    if (item.status === "rejected" && item.reason) {
      const reason = item.reason as RejectReason;
      actual.reasons[reason] = (actual.reasons[reason] ?? 0) + 1;
    }
  }
  console.log(
    `Batch ${batch.batchId}: accepted=${String(result.response.acceptedCount)} duplicate=${String(result.response.duplicateCount)} rejected=${String(result.response.rejectedCount)}`,
  );
}

const ok = JSON.stringify(actual) === JSON.stringify({ ...built.expected, reasons: built.expected.reasons });
console.log(`SOLL: ${JSON.stringify(built.expected)}`);
console.log(`IST : ${JSON.stringify(actual)}`);
console.log(ok ? `SZENARIO ${scenario} OK` : `SZENARIO ${scenario} FEHLGESCHLAGEN`);
process.exit(ok ? 0 : 1);
```

- [ ] **Step 7: Typecheck + Commit**

```bash
pnpm --filter @ph360/hub-simulator typecheck
pnpm exec vitest run --project unit tools/hub-simulator/src
git add tools/hub-simulator pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(simulator): @ph360/hub-simulator — deterministische Szenarien normal|gap|meter_change|duplicate_same|duplicate_conflict|faulty gegen die echte Ingest-API"
```

---

## Task 10: Gate F-08-Kern — End-zu-End-Verifikation + Statuspflege

**Files:**
- Modify: `docs/IMPLEMENTATION_LOG.md`, `docs/POWERHOUSE_360_MASTER_PLAN.md`

- [ ] **Step 1: Gesamte Test-Suite + Build**

```bash
pnpm test:unit
pnpm db:test:up && pnpm test:integration
pnpm typecheck
pnpm build
```
Erwartet: alle Unit- und Integrationstests PASS (inkl. WP-1.2/1.3-Bestand), Typecheck und Build ohne Fehler.

- [ ] **Step 2: Frische Dev-DB + Seed + Plattform/Worker starten**

```bash
set -a; . ./.env; set +a
docker compose exec postgres psql -U ph360 -d ph360 -c \
  "TRUNCATE device_reading, ingest_batch, device_state, device_alert, meter_change, device_assignment, metering_point, meter, hub_credential, hub CASCADE"
pnpm db:seed          # Ausgabe notieren: „MeterChange @ <ISO>“ + Hub-Token
pnpm platform:dev &   # Port 3100
pnpm worker:dev &     # Outbox-Handler + Gap-Sweep
sleep 15
```
Erwartet: Seed gibt `PH360-TEST-0001`, Kanalliste, `MeterChange @ <CHANGE_AT>` und das Dev-Token aus; beide Prozesse laufen.

- [ ] **Step 3: Simulator-Suite (alle 6 Szenarien) gegen die echte API**

```bash
SIM="pnpm --filter @ph360/hub-simulator start --"
$SIM --scenario normal
$SIM --scenario gap
$SIM --scenario duplicate_same
$SIM --scenario duplicate_conflict
$SIM --scenario faulty
$SIM --scenario meter_change --change-at <CHANGE_AT>   # ISO aus der Seed-Ausgabe
```
Erwartet: jede Ausführung endet mit `SZENARIO <name> OK` (Exit-Code 0). Damit sind die deterministischen ADR-009-Soll-Ergebnisse (Idempotenz, wertgleiches vs. wertverschiedenes Duplikat, jeder Reject-Grund, Assignment-Versionierung beim Zählerwechsel) Ende-zu-Ende belegt.

- [ ] **Step 4: Worker-Materialisierung + Alerts in der DB verifizieren**

```bash
sleep 10   # Worker-Poll (3 s) verarbeitet die device.telemetry_received-Events
docker compose exec postgres psql -U ph360 -d ph360 -Atc \
  "SELECT (SELECT count(*) FROM device_state),
          (SELECT count(*) FROM ingest_batch),
          (SELECT count(*) FROM device_alert WHERE type IN ('CONFLICTING_VALUE','UNKNOWN_CHANNEL','SERIAL_MISMATCH','NON_MONOTONIC_REGISTER','NO_VALID_ASSIGNMENT') AND status='OPEN'),
          (SELECT count(*) FROM domain_event WHERE \"eventType\"='device.telemetry_received' AND status='PROCESSED')"
```
Erwartet: `5|9|5|…` — 5 DeviceStates (SIM-A, SIM-PV, SIM-G, SIM-MC1, SIM-MC2), 9 IngestBatches (1+1+2+2+2+1), 5 offene Fach-Alerts (je einer aus faulty/duplicate_conflict/meter_change-Probe), alle Telemetrie-Events PROCESSED. Anschließend Hintergrundprozesse beenden (`kill %1 %2`).

- [ ] **Step 5: IMPLEMENTATION_LOG + Masterplan-Statuspflege**

An `docs/IMPLEMENTATION_LOG.md` anhängen (append-only, Datum anpassen):
```markdown
## <YYYY-MM-DD> — WP-APP-1: Mess-/Gerätekern + Telemetrie-Ingestion + Hub-Simulator

- Schema: Hub, HubCredential, Meter, MeteringPoint, DeviceAssignment, MeterChange, IngestBatch,
  DeviceReading (partieller Unique-Index (meterId,ts,kind) WHERE supersedesId IS NULL), DeviceState,
  DeviceAlert (Migration `messkern_ingestion`).
- `@ph360/api-contracts` (Ingest-Contracts) + `@ph360/ingestion` (Auth/Idempotenz/Per-Item-Pipeline)
  + Routen `/api/v1/ingest/telemetry` und `/api/v1/ingest/credentials/rotate`.
- Worker: `device.telemetry_received` → DeviceState + 96er-Lückenregel (Alert ab 8 Intervallen,
  `notification.requested` ab 12 h, Entwarnung); periodischer Gap-Sweep. Kein Push-Versand (WP-APP-4).
- `tools/hub-simulator`: 6 deterministische Szenarien, Soll=Ist gegen echte API verifiziert.
- **Gate F-08-Kern: 🟢** (Simulator-Suite + Integrationstests: Idempotenz, jeder Reject-Grund,
  Rotation/Revocation 401, Lückenerkennung). RAW→VALIDATED-Statuslauf + Delta-Ableitung/Aggregation
  folgen in WP-APP-2 (dort F-08-Restumfang).
- Nicht getestet: Verhalten unter Parallellast mehrerer Hubs (Pilot: 1 Hub); echte Hub-Hardware (V-03).
```

In `docs/POWERHOUSE_360_MASTER_PLAN.md`: WP-APP-1 auf 🟢 setzen, F-08-Kern als „vorgezogen, erfüllt (Simulator)“ markieren (Verweis auf diesen Log-Eintrag). Kein weiterer inhaltlicher Umbau des Masterplans in diesem WP.

- [ ] **Step 6: Abschluss-Commit**

```bash
git add docs/IMPLEMENTATION_LOG.md docs/POWERHOUSE_360_MASTER_PLAN.md
git commit -m "docs: WP-APP-1 abgeschlossen — Gate F-08-Kern grün (Simulator-Suite + Integrationstests), Masterplan-Status nachgeführt"
```

---

## Abschluss-Checkliste

- [ ] **Gate F-08-Kern verifiziert:** alle 6 Simulator-Szenarien enden mit `SZENARIO <name> OK` gegen die laufende Plattform (Task 10 Step 3); DeviceState/Alert-Zählungen stimmen (Step 4).
- [ ] **Idempotenz belegt:** gleiche `batchId` liefert die persistierte Antwort wörtlich (process-batch.itest); `payloadHash`-Abweichung ⇒ 409 + `PAYLOAD_HASH_CONFLICT`-Alert.
- [ ] **Jeder der 7 Reject-Gründe** hat mindestens einen grünen Integrationstest (`process-batch.itest.ts` + Routen-Tests).
- [ ] **Rotation + Revocation:** altes Token bis `expiresAt` gültig, danach 401; Revocation sofort 401, nur für den betroffenen Hub (auth.itest + rotate-route.itest).
- [ ] **Lückenerkennung:** Alert ab 8 fehlenden Intervallen, genau EIN `notification.requested` ab 12 h, Entwarnung bei Nachlieferung (telemetry.itest). Kein Push-Versand implementiert (bewusst WP-APP-4).
- [ ] **Partieller Unique-Index** in der Migration vorhanden und per `\d device_reading` verifiziert (Task 1 Step 4).
- [ ] Volle Suite grün: `pnpm test:unit`, `pnpm test:integration`, `pnpm typecheck`, `pnpm build`.
- [ ] `docs/IMPLEMENTATION_LOG.md`-Eintrag geschrieben (inkl. „Nicht getestet“-Abschnitt, Masterplan-§12-Statusregel).
- [ ] Masterplan: WP-APP-1 🟢, F-08-Kern als vorgezogen-erfüllt markiert.
- [ ] Alle Commits Conventional-Commits-deutsch; **kein `git push`** (kein Remote, R-02).
- [ ] Offene Folgearbeiten notiert: RAW→VALIDATED-Validierungslauf, serverseitige Delta-Ableitung + `ConsumptionAggregate` (WP-APP-2); Timescale-Umstellung gemäß ADR-002 (D-04); Rate-Limit-Verlagerung bei Ingest-Service-Split (R-A7).
