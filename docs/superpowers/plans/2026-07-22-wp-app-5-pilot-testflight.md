# WP-APP-5 — Pilot-Anbindung + TestFlight + DSGVO-Abschluss Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Platzhalter-Konvention:** Die einzigen zulässigen Laufzeit-Platzhalter in diesem Plan sind `[PO: …]`-Markierungen (offene PO-Angaben) und `<…>`-CLI-Argumente. `// …`-Ellipsen oder andere Auslassungen sind unzulässig.

**Goal:** Die echten Pilot-Hubs (Christinenstraße/Lottumstraße, 21 Messstellen) sind an die Ingest-Pipeline angebunden, die App läuft als TestFlight-Build gegen Prod, das DSGVO-Paket 2 ist veröffentlicht und Gate **F-APP-2** (Pilot-Hub → Ingest → App zeigt echten Messwert) ist dokumentiert bestanden.

**Architecture:** WP-APP-5 baut keinen neuen Fachcode-Kern, sondern verbindet Bestehendes: Pilot-Stammdaten werden über ein idempotentes Import-Werkzeug in `packages/ingestion` (Unterordner `src/pilot/`) gegen die WP-APP-1-Modelle (Hub/Meter/MeteringPoint/DeviceAssignment) registriert; ein Abweichungsreport vergleicht Simulator- und Realdaten strukturell (Vollständigkeit, Latenz, Reject-Quoten). Verifikationen (V-02, TestFlight-Testlauf, F-APP-2) sind committete Markdown-Artefakte unter `docs/superpowers/verifications/`; DSGVO-Paket 2 besteht aus einer neuen Website-Route `/datenschutz-app` plus Doku-Artefakten unter `docs/DSGVO/` (zwei neue Dateien, dazu Fortschreibung der in WP-APP-4 Task 10 angelegten `AVV-MATRIX.md`).

**Tech Stack:** pnpm 11.11.0 + Turborepo · TypeScript strict (ES2022, `moduleResolution: bundler`, `verbatimModuleSyntax`) · Vitest 3 (Projekte `unit`/`integration`, Real-Postgres `ph360_test` :5433 via `packages/testing`) · Prisma 6 (`@ph360/database`) · zod ^3.24.1 (`@ph360/api-contracts`-Konvention) · tsx (CLI-Skripte) · Next.js 16 (apps/website, `/datenschutz-app`) · Expo / EAS CLI (Build-Profile, TestFlight) · docker compose (Prod-ENV)

**Vorbedingungen:**

- **Grüne Gates:** WP-1.2 (F-02/F-19/F-20), WP-1.3-Kern, WP-APP-1 (F-08-Kern), WP-APP-2 (F-APP-1 API), WP-APP-3 (Demo-Build), WP-APP-4 (F-APP-1 E2E gegen Staging).
- **PO-Punkte (blockieren einzelne Tasks, mit PO-GATE markiert):** Apple-Developer-Account-Entscheid (Gesellschaft + Team-ID + finale Bundle-ID) · VPS-Rollout + DNS (`app.powerhouse360.de` → platform live) · **Pilotdatenliste** (je Messstelle: Gebäude, Unit-Label, channelRef, Zähler-Hersteller/Modell/Seriennummer, pointType, Hub-Seriennummer, gültig-ab) · Pilottarife in WP-APP-2-Admin/Seed eingepflegt.
- **Exakte Annahmen über dann existierende Dateien/Exporte (aus früheren WPs):**
  - `packages/database/prisma/schema.prisma` enthält die WP-1.3-Modelle `Property{id,organizationId,name}`, `Building{id,propertyId,name,address}`, `Unit{id,buildingId,entranceId?,label,floor?}` und die WP-APP-1-Modelle `Hub{id,organizationId,serialNumber unique,status,lastSeenAt}`, `HubCredential`, `Meter{id,manufacturer,model,serialNumber,meterType,unit}` (`@@unique([manufacturer,model,serialNumber])`), `MeteringPoint{id,unitId?,buildingId,pointType,externalId?}`, `DeviceAssignment{id,meterId,meteringPointId,hubId,channelRef,validFrom,validTo?}`, `DeviceReading`, `DeviceState`, `IngestBatch{hubId,batchId,payloadHash,responseJson,acceptedCount,duplicateCount,rejectedCount}`; Prisma-Client-Properties `prisma.property`, `prisma.building`, `prisma.unit`, `prisma.hub`, `prisma.meter`, `prisma.meteringPoint`, `prisma.deviceAssignment`, `prisma.deviceReading`, `prisma.deviceState`, `prisma.ingestBatch`; Enums `MeterType` (enthält `ELECTRICITY`), `MeteringPointType` (`UNIT_CONSUMPTION|PV_GENERATION|GRID_FEED|BUILDING_GENERAL|STORAGE`).
  - `@ph360/ingestion` (WP-APP-1) exportiert `registerHub(input: { organizationId: string; serialNumber: string }): Promise<{ hub: Hub; token: string }>` (nutzt den `prisma`-Singleton aus `@ph360/database`; `hubId` = `hub.id`; stellt Hub + ACTIVE-`HubCredential` aus; `token` = Klartext, wird genau einmal zurückgegeben). Weicht der reale WP-APP-1-Export ab (Name/Signatur), wird **nur die Importzeile/Aufrufstelle in Task 3** angepasst — die Semantik (Hub anlegen + Token ausstellen) ist durch ADR-009 fixiert.
  - `packages/testing` (WP-1.2 Task 3) exportiert `makeTestPrisma()`, `truncateAll(prisma)`, `createOrg(type?, overrides?)`; Root-`vitest.config.ts` hat Projekte `unit` (`**/*.test.ts`) und `integration` (`**/*.itest.ts`, globalSetup mit `migrate deploy` gegen `ph360_test` :5433).
  - `tools/hub-simulator` (`@ph360/hub-simulator`, WP-APP-1) hat ein Start-Skript `pnpm --filter @ph360/hub-simulator start -- --scenario <name> --base-url <url> --token <token>` und läuft ausschließlich gegen den Testmandanten (ADR-006).
  - `apps/mobile` (WP-APP-3/4) ist eine Expo-App mit `app.config.ts` (ExpoConfig, `supportsTablet: false`, Plugins `expo-router`, `expo-secure-store`, `expo-notifications`, `expo-local-authentication`) und `assets/`-Verzeichnis.
  - `apps/platform` (WP-APP-2) hat `GET /api/v1/app/config` mit einer Konstanten für rechtliche URLs (u. a. `privacyPolicyUrl`).
  - WP-APP-4 nutzt die ENV-Namen `EXPO_ACCESS_TOKEN` (Expo-Push-Zugang), `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_DOCUMENTS` (Dokumente/PDF) und `INGEST_LATE_THRESHOLD_MIN` (Default 60, ADR-009) in platform/worker.
  - `apps/website` hat die Komponente `src/components/LegalShell.tsx` (Props `title`, `stand`, `children`) — von `/datenschutz` bereits genutzt.
- **Lokale Infra:** `docker compose up -d postgres` (Dev-DB :5433, enthält auch `ph360_test`), Node ≥ 20, EAS CLI (`pnpm dlx eas-cli`) für Task 6/7.

---

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `docs/superpowers/verifications/2026-XX-pilot-telemetrie.md` (Create) | V-02-Playbook + ausgefülltes Ergebnisprotokoll der Pilotdaten-Verifikation |
| `docs/pilot/pilotdaten.example.json` (Create) | Beispiel-Pilotdatenliste (Schema-Referenz, Testmandant-taugliche Fantasiewerte) |
| `docs/pilot/pilotdaten-christinenstrasse.json` (Create, bei Ausführung) | Echte Pilotdatenliste aus der PO-Lieferung (21 Messstellen) |
| `packages/ingestion/src/pilot/parse.ts` (Create) | Zod-Schema + Parser der Pilotdatenliste (`PilotDataListSchema`, `parsePilotDataList`) |
| `packages/ingestion/src/pilot/parse.test.ts` (Test) | Unit-Tests Parser (gültig/ungültig/Duplikat-channelRef) |
| `packages/ingestion/src/pilot/import.ts` (Create) | Idempotenter Import: Objektbaum + Meter + MeteringPoints + Hub-Registrierung + DeviceAssignments |
| `packages/ingestion/src/pilot/import.itest.ts` (Test) | Integrationstest Import (Real-Postgres, doppelte Ausführung idempotent) |
| `packages/ingestion/src/pilot/cli.ts` (Create) | CLI `pilot:import` (`--check` = nur validieren) |
| `packages/ingestion/src/pilot/compare.ts` (Create) | Abweichungsreport Simulator↔Real (`collectSeriesStats`, `renderComparisonMarkdown`) |
| `packages/ingestion/src/pilot/compare.test.ts` (Test) | Unit-Tests Markdown-Report (Fixtures) |
| `packages/ingestion/src/pilot/report-cli.ts` (Create) | CLI `pilot:report` → schreibt `docs/pilot/abgleich-<datum>.md` |
| `packages/ingestion/package.json` (Modify) | Scripts `pilot:import`/`pilot:report`, devDependency `tsx` |
| `docker-compose.prod.yml` (Modify) | Nur ENV-Ergänzungen: Expo-Push, MinIO-Bucket, LATE_THRESHOLD (platform + worker) |
| `.env.prod.example` (Modify) | Neue ENV-Schlüssel nachziehen |
| `turbo.json` (Modify) | Neue ENV-Namen in `globalEnv` |
| `docs/DEPLOYMENT.md` (Modify) | Neuer Abschnitt „App & Push (WP-APP)" |
| `apps/mobile/eas.json` (Create) | EAS-Profile development/preview/production |
| `apps/mobile/app.config.ts` (Modify) | Icon/Splash/Bundle-ID (PO-GATE), Version |
| `apps/mobile/assets/icon.png`, `apps/mobile/assets/splash.png` (Create) | App-Icon + Splash aus Brand-Assets (Deep Navy `#0D1626`) |
| `docs/superpowers/verifications/2026-XX-testflight-testlauf.md` (Create) | Interne Testlauf-Checkliste TestFlight + Ergebnis |
| `apps/website/src/app/datenschutz-app/page.tsx` (Create) | App-spezifische Datenschutzerklärung (Privacy-Policy-URL für den Store) |
| `apps/platform/src/app/api/v1/app/config/route.ts` (Modify) | `privacyPolicyUrl` der WP-APP-2-Config-Route auf `https://powerhouse360.de/datenschutz-app` setzen |
| `docs/DSGVO/app-store-privacy-angaben.md` (Create) | Store-Privacy-Angaben (Apple „App Privacy") als Ausfüll-Doku |
| `docs/DSGVO/vvt-kunden-app.md` (Create) | VVT-Beitrag „Verarbeitungstätigkeit Kunden-App (Bewohner)" |
| `docs/DSGVO/AVV-MATRIX.md` (Modify) | AVV-Matrix Hostinger/Apple/Google/Expo (erstellt in WP-APP-4 Task 10; hier Abschluss von §3.3 c) |
| `docs/superpowers/verifications/2026-XX-f-app-2-e2e.md` (Create) | F-APP-2-E2E-Protokoll (Pilot-Hub→Ingest→App) |
| `docs/POWERHOUSE_360_MASTER_PLAN.md` (Modify) | §12 F-APP-2 🟢, §14 Fortschritt, §15 Änderungsverlauf |
| `docs/EXECUTION_ROADMAP.md` (Modify) | WP-APP-5-Abschnitt auf 🟢, Gate-Übersicht |
| `docs/IMPLEMENTATION_LOG.md` (Modify) | Append-only-Eintrag WP-APP-5 |

---

## Task 1: Verifikations-Playbook Pilotdaten (V-02)

**Files:**
- Create: `docs/superpowers/verifications/2026-XX-pilot-telemetrie.md`

Reines Doku-Artefakt (kein TDD). Das Playbook wird **vor** dem Pilot-Termin committet; das Ergebnis wird bei Durchführung in derselben Datei eingetragen und erneut committet.

- [ ] **Step 1: Verzeichnis anlegen und Playbook schreiben**

`docs/superpowers/verifications/2026-XX-pilot-telemetrie.md`:

```markdown
# V-02 — Pilotdaten-Verifikation Christinenstraße/Lottumstraße

**Status:** ⚪ offen (wird bei Durchführung ausgefüllt und committet)
**Bezug:** Spec §10 V-02, ADR-009, WP-APP-5 Task 1
**Regel:** Nichts wird vorausgesetzt (PO-Vorgabe). Jede Frage wird vor Ort bzw.
per Fernzugriff beantwortet und mit Beleg (Kommando-Output/Screenshot) dokumentiert.

## A. Erreichbarkeit des Hubs

| # | Prüfung | Kommando/Methode | Soll | Ist | ✔ |
|---|---|---|---|---|---|
| A1 | Hub physisch vorhanden + bestromt (je Gebäude) | Sichtprüfung | RPi5 läuft (LED) | | ☐ |
| A2 | Hub hat Internet-Uplink | vor Ort: `ping -c 3 app.powerhouse360.de` | 0 % Paketverlust | | ☐ |
| A3 | Hub erreicht Ingest-Endpunkt (TLS) | `curl -s -o /dev/null -w "%{http_code}" https://app.powerhouse360.de/api/v1/ingest/telemetry -X POST -H "Authorization: Bearer WRONG"` | `401` (Endpunkt lebt, Auth greift) | | ☐ |
| A4 | Hub-Seriennummer(n) notiert | Typenschild/Config | 1 Seriennummer je Hub | | ☐ |

## B. Datenformat

| # | Prüfung | Methode | Soll | Ist | ✔ |
|---|---|---|---|---|---|
| B1 | Hub sendet ADR-009-Envelope (batchId, hubSerial, sentAt, readings[]) | Beispiel-Payload vom Hub-Team anfordern und gegen `packages/api-contracts`-Schema prüfen (`pnpm --filter @ph360/ingestion pilot:import -- --check <payload>` bzw. Zod-Parse im Node-REPL) | Parse ohne Fehler | | ☐ |
| B2 | `channelRef`-Systematik dokumentiert (DevEUI/Modbus je Messstelle) | Liste vom Hub-Team | 21 channelRefs, eindeutig | | ☐ |
| B3 | `kind` je Kanal geklärt (register vs. delta) | Hub-Team | je Kanal fest | | ☐ |
| B4 | Werte-Einheit kWh, Dezimal-String, 15-min-Raster (`ts` = Intervallende UTC) | Beispiel-Payload | konform | | ☐ |
| B5 | Zähler-Seriennummern der 21 Messstellen liegen vor | Pilotdatenliste (PO) | vollständig | | ☐ |

## C. Frequenz & Pufferung

| # | Prüfung | Methode | Soll | Ist | ✔ |
|---|---|---|---|---|---|
| C1 | Sendeintervall | Hub-Config | ≤ 15 min | | ☐ |
| C2 | Lokale Pufferung bei Internetausfall + Nachlieferung in Originalreihenfolge | Hub-Team / Test: Uplink 30 min trennen | Nachlieferung kommt, Werte `late` markiert | | ☐ |
| C3 | Hub-Uhr synchron (NTP) | `date -u` auf Hub vs. Serverzeit | Abweichung < 5 min | | ☐ |
| C4 | Idempotenz: gleicher Batch doppelt gesendet | Testsendung wiederholen | identische Antwort, keine Doppelwerte | | ☐ |

## D. Ergebnis

- **Datum der Durchführung:** _(eintragen)_
- **Durchgeführt von:** _(eintragen)_
- **Gesamtergebnis:** ☐ bestanden · ☐ bestanden mit Auflagen · ☐ nicht bestanden
- **Abweichungen/Auflagen:** _(eintragen)_
- **Konsequenz bei Nichtbestehen:** WP-APP-5 bleibt simulatorgetrieben (V-03),
  F-APP-2 wird nicht als 🟢 markiert; Abweichungen gehen als Auflagen an das Hub-Team.
```

- [ ] **Step 2: Committen**

```bash
git add "docs/superpowers/verifications/2026-XX-pilot-telemetrie.md"
git commit -m "docs: V-02-Playbook Pilotdaten-Verifikation (WP-APP-5)"
```

- [ ] **Step 3 (bei Pilot-Termin, PO-GATE Pilotzugang): Playbook durchführen, Ist-Spalten + Abschnitt D ausfüllen, erneut committen**

```bash
git add "docs/superpowers/verifications/2026-XX-pilot-telemetrie.md"
git commit -m "docs: V-02-Ergebnis Pilotdaten-Verifikation eingetragen"
```

---

## Task 2: Pilotdatenliste — Zod-Schema + Parser (TDD)

**Files:**
- Create: `packages/ingestion/src/pilot/parse.ts`
- Create: `docs/pilot/pilotdaten.example.json`
- Test: `packages/ingestion/src/pilot/parse.test.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`packages/ingestion/src/pilot/parse.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parsePilotDataList } from "./parse.js";

const valid = {
  organizationName: "Pilot Christinenstraße (Test)",
  property: { name: "Pilot Berlin Mitte" },
  buildings: [
    {
      key: "christinenstr",
      name: "Christinenstraße",
      address: { street: "Christinenstraße", houseNumber: "1", postalCode: "10119", city: "Berlin" },
      units: [{ label: "WE01", floor: "EG" }, { label: "WE02", floor: "1.OG" }],
    },
  ],
  hubs: [{ serialNumber: "PH360-2026-0001", buildingKey: "christinenstr" }],
  meters: [
    { manufacturer: "EMH", model: "ED300L", serialNumber: "1EMH0067512345", meterType: "ELECTRICITY", unit: "kWh" },
    { manufacturer: "EMH", model: "ED300L", serialNumber: "1EMH0067512346", meterType: "ELECTRICITY", unit: "kWh" },
  ],
  meteringPoints: [
    { key: "we01", buildingKey: "christinenstr", unitLabel: "WE01", pointType: "UNIT_CONSUMPTION" },
    { key: "pv", buildingKey: "christinenstr", pointType: "PV_GENERATION" },
  ],
  assignments: [
    { channelRef: "devEUI:70B3D5A1:1", hubSerial: "PH360-2026-0001", meterSerial: "1EMH0067512345", meteringPointKey: "we01", validFrom: "2026-08-01T00:00:00Z" },
    { channelRef: "devEUI:70B3D5A1:2", hubSerial: "PH360-2026-0001", meterSerial: "1EMH0067512346", meteringPointKey: "pv", validFrom: "2026-08-01T00:00:00Z" },
  ],
};

describe("parsePilotDataList", () => {
  it("parst eine gültige Pilotdatenliste", () => {
    const list = parsePilotDataList(valid);
    expect(list.assignments).toHaveLength(2);
    expect(list.buildings[0]?.units).toHaveLength(2);
  });

  it("lehnt doppelte channelRefs ab", () => {
    const dup = structuredClone(valid);
    dup.assignments[1]!.channelRef = dup.assignments[0]!.channelRef;
    expect(() => parsePilotDataList(dup)).toThrow(/channelRef/);
  });

  it("lehnt Assignment auf unbekannten meteringPointKey ab", () => {
    const bad = structuredClone(valid);
    bad.assignments[0]!.meteringPointKey = "gibts-nicht";
    expect(() => parsePilotDataList(bad)).toThrow(/meteringPointKey/);
  });

  it("lehnt Assignment auf unbekannte Zähler-Seriennummer ab", () => {
    const bad = structuredClone(valid);
    bad.assignments[0]!.meterSerial = "0000000";
    expect(() => parsePilotDataList(bad)).toThrow(/meterSerial/);
  });

  it("lehnt fehlende Pflichtfelder ab (schema)", () => {
    expect(() => parsePilotDataList({ organizationName: "x" })).toThrow();
  });
});
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
pnpm vitest run --project unit packages/ingestion/src/pilot/parse.test.ts
```

Erwartet: FAIL (`Cannot find module './parse.js'`).

- [ ] **Step 3: Minimale Implementierung**

`packages/ingestion/src/pilot/parse.ts`:

```ts
import { z } from "zod";

/** Pilotdatenliste (PO-Lieferung) — Quelle für Hub-Registrierung + DeviceAssignments (WP-APP-5). */
const AddressSchema = z.object({
  street: z.string().min(1),
  houseNumber: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
});

const UnitSchema = z.object({ label: z.string().min(1), floor: z.string().optional() });

const BuildingSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  address: AddressSchema,
  units: z.array(UnitSchema),
});

const HubEntrySchema = z.object({ serialNumber: z.string().min(1), buildingKey: z.string().min(1) });

const MeterEntrySchema = z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  meterType: z.literal("ELECTRICITY"),
  unit: z.literal("kWh"),
});

const MeteringPointEntrySchema = z.object({
  key: z.string().min(1),
  buildingKey: z.string().min(1),
  unitLabel: z.string().optional(),
  pointType: z.enum(["UNIT_CONSUMPTION", "PV_GENERATION", "GRID_FEED", "BUILDING_GENERAL", "STORAGE"]),
  externalId: z.string().optional(),
});

const AssignmentEntrySchema = z.object({
  channelRef: z.string().min(1),
  hubSerial: z.string().min(1),
  meterSerial: z.string().min(1),
  meteringPointKey: z.string().min(1),
  validFrom: z.string().datetime(),
});

export const PilotDataListSchema = z.object({
  organizationName: z.string().min(1),
  property: z.object({ name: z.string().min(1) }),
  buildings: z.array(BuildingSchema).min(1),
  hubs: z.array(HubEntrySchema).min(1),
  meters: z.array(MeterEntrySchema).min(1),
  meteringPoints: z.array(MeteringPointEntrySchema).min(1),
  assignments: z.array(AssignmentEntrySchema).min(1),
});

export type PilotDataList = z.infer<typeof PilotDataListSchema>;

/** Parst + prüft Querbezüge (Keys, Seriennummern, Eindeutigkeit der channelRefs). */
export function parsePilotDataList(input: unknown): PilotDataList {
  const list = PilotDataListSchema.parse(input);

  const buildingKeys = new Set(list.buildings.map((b) => b.key));
  const unitLabels = new Set(
    list.buildings.flatMap((b) => b.units.map((u) => `${b.key}/${u.label}`)),
  );
  const hubSerials = new Set(list.hubs.map((h) => h.serialNumber));
  const meterSerials = new Set(list.meters.map((m) => m.serialNumber));
  const pointKeys = new Set(list.meteringPoints.map((p) => p.key));

  for (const h of list.hubs) {
    if (!buildingKeys.has(h.buildingKey)) throw new Error(`Hub ${h.serialNumber}: unbekannter buildingKey ${h.buildingKey}`);
  }
  for (const p of list.meteringPoints) {
    if (!buildingKeys.has(p.buildingKey)) throw new Error(`MeteringPoint ${p.key}: unbekannter buildingKey ${p.buildingKey}`);
    if (p.unitLabel !== undefined && !unitLabels.has(`${p.buildingKey}/${p.unitLabel}`)) {
      throw new Error(`MeteringPoint ${p.key}: unbekanntes unitLabel ${p.unitLabel}`);
    }
  }
  const seenChannelRefs = new Set<string>();
  for (const a of list.assignments) {
    if (seenChannelRefs.has(a.channelRef)) throw new Error(`doppelte channelRef ${a.channelRef}`);
    seenChannelRefs.add(a.channelRef);
    if (!hubSerials.has(a.hubSerial)) throw new Error(`Assignment ${a.channelRef}: unbekannter hubSerial ${a.hubSerial}`);
    if (!meterSerials.has(a.meterSerial)) throw new Error(`Assignment ${a.channelRef}: unbekannte meterSerial ${a.meterSerial}`);
    if (!pointKeys.has(a.meteringPointKey)) throw new Error(`Assignment ${a.channelRef}: unbekannter meteringPointKey ${a.meteringPointKey}`);
  }
  return list;
}
```

- [ ] **Step 4: Test grün**

```bash
pnpm vitest run --project unit packages/ingestion/src/pilot/parse.test.ts
```

Erwartet: 5 Tests PASS.

- [ ] **Step 5: Beispiel-Pilotdatenliste committen**

`docs/pilot/pilotdaten.example.json` — exakt das `valid`-Objekt aus Step 1 als JSON-Datei (gleiches Format, Fantasiewerte, Schema-Referenz für die PO-Lieferung):

```json
{
  "organizationName": "Pilot Christinenstraße (Test)",
  "property": { "name": "Pilot Berlin Mitte" },
  "buildings": [
    {
      "key": "christinenstr",
      "name": "Christinenstraße",
      "address": { "street": "Christinenstraße", "houseNumber": "1", "postalCode": "10119", "city": "Berlin" },
      "units": [{ "label": "WE01", "floor": "EG" }, { "label": "WE02", "floor": "1.OG" }]
    }
  ],
  "hubs": [{ "serialNumber": "PH360-2026-0001", "buildingKey": "christinenstr" }],
  "meters": [
    { "manufacturer": "EMH", "model": "ED300L", "serialNumber": "1EMH0067512345", "meterType": "ELECTRICITY", "unit": "kWh" },
    { "manufacturer": "EMH", "model": "ED300L", "serialNumber": "1EMH0067512346", "meterType": "ELECTRICITY", "unit": "kWh" }
  ],
  "meteringPoints": [
    { "key": "we01", "buildingKey": "christinenstr", "unitLabel": "WE01", "pointType": "UNIT_CONSUMPTION" },
    { "key": "pv", "buildingKey": "christinenstr", "pointType": "PV_GENERATION" }
  ],
  "assignments": [
    { "channelRef": "devEUI:70B3D5A1:1", "hubSerial": "PH360-2026-0001", "meterSerial": "1EMH0067512345", "meteringPointKey": "we01", "validFrom": "2026-08-01T00:00:00Z" },
    { "channelRef": "devEUI:70B3D5A1:2", "hubSerial": "PH360-2026-0001", "meterSerial": "1EMH0067512346", "meteringPointKey": "pv", "validFrom": "2026-08-01T00:00:00Z" }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/ingestion/src/pilot/parse.ts packages/ingestion/src/pilot/parse.test.ts docs/pilot/pilotdaten.example.json
git commit -m "feat(ingestion): Pilotdatenlisten-Schema + Parser mit Querbezugspruefung (WP-APP-5)"
```

---

## Task 3: Idempotenter Pilot-Import (Hub-Registrierung + DeviceAssignments) (TDD)

**Files:**
- Create: `packages/ingestion/src/pilot/import.ts`
- Create: `packages/ingestion/src/pilot/cli.ts`
- Modify: `packages/ingestion/package.json`
- Test: `packages/ingestion/src/pilot/import.itest.ts`

Nutzt die **WP-APP-1-Admin-Registrierung** (`registerHub` aus `@ph360/ingestion`, siehe Vorbedingungen) — kein zweiter Registrierungspfad. Der Import ist **idempotent** (zweiter Lauf ändert nichts), damit er nach PO-Korrekturen an der Pilotdatenliste gefahrlos wiederholbar ist.

- [ ] **Step 1: Fehlschlagenden Integrationstest schreiben**

`packages/ingestion/src/pilot/import.itest.ts`:

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { makeTestPrisma, truncateAll, createOrg } from "@ph360/testing";
import { parsePilotDataList } from "./parse.js";
import { importPilotData } from "./import.js";
import example from "../../../../docs/pilot/pilotdaten.example.json" with { type: "json" };

const prisma = makeTestPrisma();

describe("importPilotData (Real-Postgres)", () => {
  beforeEach(async () => {
    await truncateAll(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("legt Objektbaum, Meter, MeteringPoints, Hub + Assignments an und liefert Hub-Tokens", async () => {
    const org = await createOrg("POWERHOUSE");
    const list = parsePilotDataList(example);

    const result = await importPilotData(prisma, list, { organizationId: org.id });

    expect(result.created).toEqual({
      properties: 1, buildings: 1, units: 2, meters: 2, meteringPoints: 2, hubs: 1, assignments: 2,
    });
    expect(result.hubTokens).toHaveLength(1);
    expect(result.hubTokens[0]?.serialNumber).toBe("PH360-2026-0001");
    expect(result.hubTokens[0]?.token.length).toBeGreaterThan(20);

    const assignment = await prisma.deviceAssignment.findFirst({
      where: { channelRef: "devEUI:70B3D5A1:1" },
      include: { meter: true, meteringPoint: true },
    });
    expect(assignment?.meter.serialNumber).toBe("1EMH0067512345");
    expect(assignment?.meteringPoint.pointType).toBe("UNIT_CONSUMPTION");
  });

  it("ist idempotent: zweiter Lauf erzeugt nichts Neues und stellt kein neues Hub-Token aus", async () => {
    const org = await createOrg("POWERHOUSE");
    const list = parsePilotDataList(example);

    await importPilotData(prisma, list, { organizationId: org.id });
    const second = await importPilotData(prisma, list, { organizationId: org.id });

    expect(second.created).toEqual({
      properties: 0, buildings: 0, units: 0, meters: 0, meteringPoints: 0, hubs: 0, assignments: 0,
    });
    expect(second.hubTokens).toHaveLength(0);
    expect(await prisma.deviceAssignment.count()).toBe(2);
    expect(await prisma.hub.count()).toBe(1);
  });
});
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
docker compose up -d postgres
pnpm vitest run --project integration packages/ingestion/src/pilot/import.itest.ts
```

Erwartet: FAIL (`Cannot find module './import.js'`).

- [ ] **Step 3: Minimale Implementierung**

`packages/ingestion/src/pilot/import.ts`:

```ts
import type { PrismaClient } from "@ph360/database";
import { registerHub } from "../index.js"; // WP-APP-1-Export (Vorbedingungen); bei abweichendem Namen NUR diese Zeile anpassen
import type { PilotDataList } from "./parse.js";

export interface PilotImportResult {
  created: {
    properties: number; buildings: number; units: number; meters: number;
    meteringPoints: number; hubs: number; assignments: number;
  };
  hubTokens: { serialNumber: string; token: string }[];
}

/**
 * Idempotenter Import der Pilotdatenliste in einen Mandanten.
 * Lookup-Strategie: natürliche Schlüssel (Property/Building/Unit-Name im Org-Scope,
 * Meter-Seriennummer, Hub-Seriennummer, Assignment-channelRef+validFrom).
 * Bereits vorhandene Datensätze werden nie verändert (keine stillen Updates).
 */
export async function importPilotData(
  prisma: PrismaClient,
  list: PilotDataList,
  opts: { organizationId: string },
): Promise<PilotImportResult> {
  const created = { properties: 0, buildings: 0, units: 0, meters: 0, meteringPoints: 0, hubs: 0, assignments: 0 };
  const hubTokens: { serialNumber: string; token: string }[] = [];

  // 1. Property
  let property = await prisma.property.findFirst({
    where: { organizationId: opts.organizationId, name: list.property.name },
  });
  if (!property) {
    property = await prisma.property.create({
      data: { organizationId: opts.organizationId, name: list.property.name },
    });
    created.properties += 1;
  }

  // 2. Buildings + Units (Key → IDs für spätere Bezüge)
  const buildingIdByKey = new Map<string, string>();
  const unitIdByRef = new Map<string, string>(); // "buildingKey/unitLabel"
  for (const b of list.buildings) {
    let building = await prisma.building.findFirst({ where: { propertyId: property.id, name: b.name } });
    if (!building) {
      building = await prisma.building.create({
        data: {
          propertyId: property.id,
          name: b.name,
          address: {
            create: {
              street: b.address.street, houseNumber: b.address.houseNumber,
              postalCode: b.address.postalCode, city: b.address.city,
            },
          },
        },
      });
      created.buildings += 1;
    }
    buildingIdByKey.set(b.key, building.id);
    for (const u of b.units) {
      let unit = await prisma.unit.findFirst({ where: { buildingId: building.id, label: u.label } });
      if (!unit) {
        unit = await prisma.unit.create({
          data: { buildingId: building.id, label: u.label, floor: u.floor ?? null },
        });
        created.units += 1;
      }
      unitIdByRef.set(`${b.key}/${u.label}`, unit.id);
    }
  }

  // 3. Meters
  const meterIdBySerial = new Map<string, string>();
  for (const m of list.meters) {
    let meter = await prisma.meter.findFirst({
      where: { manufacturer: m.manufacturer, model: m.model, serialNumber: m.serialNumber },
    });
    if (!meter) {
      meter = await prisma.meter.create({
        data: {
          manufacturer: m.manufacturer, model: m.model, serialNumber: m.serialNumber,
          meterType: m.meterType, unit: m.unit,
        },
      });
      created.meters += 1;
    }
    meterIdBySerial.set(m.serialNumber, meter.id);
  }

  // 4. MeteringPoints
  const pointIdByKey = new Map<string, string>();
  for (const p of list.meteringPoints) {
    const buildingId = buildingIdByKey.get(p.buildingKey);
    if (!buildingId) throw new Error(`Import: buildingKey ${p.buildingKey} nicht aufgelöst`);
    const unitId = p.unitLabel !== undefined ? unitIdByRef.get(`${p.buildingKey}/${p.unitLabel}`) ?? null : null;
    let point = await prisma.meteringPoint.findFirst({
      where: { buildingId, pointType: p.pointType, unitId },
    });
    if (!point) {
      point = await prisma.meteringPoint.create({
        data: { buildingId, unitId, pointType: p.pointType, externalId: p.externalId ?? null },
      });
      created.meteringPoints += 1;
    }
    pointIdByKey.set(p.key, point.id);
  }

  // 5. Hubs — Registrierung ausschließlich über den WP-APP-1-Pfad (stellt HubCredential aus)
  const hubIdBySerial = new Map<string, string>();
  for (const h of list.hubs) {
    const existing = await prisma.hub.findUnique({ where: { serialNumber: h.serialNumber } });
    if (existing) {
      hubIdBySerial.set(h.serialNumber, existing.id);
    } else {
      const { hub, token } = await registerHub({
        organizationId: opts.organizationId,
        serialNumber: h.serialNumber,
      });
      hubIdBySerial.set(h.serialNumber, hub.id);
      hubTokens.push({ serialNumber: h.serialNumber, token });
      created.hubs += 1;
    }
  }

  // 6. DeviceAssignments
  for (const a of list.assignments) {
    const meterId = meterIdBySerial.get(a.meterSerial);
    const meteringPointId = pointIdByKey.get(a.meteringPointKey);
    const hubId = hubIdBySerial.get(a.hubSerial);
    if (!meterId || !meteringPointId || !hubId) {
      throw new Error(`Import: Bezüge für Assignment ${a.channelRef} nicht aufgelöst`);
    }
    const validFrom = new Date(a.validFrom);
    const existing = await prisma.deviceAssignment.findFirst({
      where: { hubId, channelRef: a.channelRef, validFrom },
    });
    if (!existing) {
      await prisma.deviceAssignment.create({
        data: { meterId, meteringPointId, hubId, channelRef: a.channelRef, validFrom },
      });
      created.assignments += 1;
    }
  }

  return { created, hubTokens };
}
```

- [ ] **Step 4: Test grün**

```bash
pnpm vitest run --project integration packages/ingestion/src/pilot/import.itest.ts
```

Erwartet: 2 Tests PASS. (Schlägt der `registerHub`-Import fehl, Exportnamen in `packages/ingestion/src/index.ts` nachschlagen und NUR die Importzeile anpassen — Vorbedingungen.)

- [ ] **Step 5: CLI schreiben**

`packages/ingestion/src/pilot/cli.ts`:

```ts
import { readFileSync } from "node:fs";
import { prisma } from "@ph360/database";
import { parsePilotDataList } from "./parse.js";
import { importPilotData } from "./import.js";

/**
 * Pilot-Import-CLI (WP-APP-5).
 *   pnpm --filter @ph360/ingestion pilot:import -- --check <datei.json>
 *   pnpm --filter @ph360/ingestion pilot:import -- --org <organizationId> <datei.json>
 * Hub-Tokens werden GENAU EINMAL auf stdout ausgegeben — sicher an das Hub-Team
 * übergeben (nie committen, nie in Logs ablegen).
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const orgIdx = args.indexOf("--org");
  const organizationId = orgIdx >= 0 ? args[orgIdx + 1] : undefined;
  const file = args.filter((a, i) => !a.startsWith("--") && i !== orgIdx + 1).at(-1);
  if (!file) {
    console.error("Usage: pilot:import -- [--check] [--org <organizationId>] <datei.json>");
    process.exit(2);
  }

  const list = parsePilotDataList(JSON.parse(readFileSync(file, "utf8")));
  console.log(
    `[pilot] Liste OK: ${list.buildings.length} Gebäude, ` +
      `${list.buildings.reduce((n, b) => n + b.units.length, 0)} Units, ${list.meters.length} Zähler, ` +
      `${list.meteringPoints.length} Messstellen, ${list.hubs.length} Hubs, ${list.assignments.length} Assignments`,
  );
  if (checkOnly) return;

  if (!organizationId) {
    console.error("[pilot] --org <organizationId> fehlt (Ziel-Mandant, ADR-004).");
    process.exit(2);
  }
  const result = await importPilotData(prisma, list, { organizationId });
  console.log(`[pilot] angelegt: ${JSON.stringify(result.created)}`);
  for (const t of result.hubTokens) {
    console.log(`[pilot] HUB-TOKEN ${t.serialNumber}: ${t.token}  <- einmalig, sicher übergeben!`);
  }
  await prisma.$disconnect();
}

void main();
```

`packages/ingestion/package.json` — im `"scripts"`-Block ergänzen und `tsx` als devDependency aufnehmen:

```jsonc
// scripts:
"pilot:import": "tsx src/pilot/cli.ts",
"pilot:report": "tsx src/pilot/report-cli.ts"
// devDependencies:
"tsx": "^4.19.2"
```

```bash
pnpm install
pnpm --filter @ph360/ingestion pilot:import -- --check docs/pilot/pilotdaten.example.json
```

Erwartet: `[pilot] Liste OK: 1 Gebäude, 2 Units, 2 Zähler, 2 Messstellen, 1 Hubs, 2 Assignments`.

- [ ] **Step 6: Commit**

```bash
git add packages/ingestion/src/pilot/import.ts packages/ingestion/src/pilot/import.itest.ts packages/ingestion/src/pilot/cli.ts packages/ingestion/package.json pnpm-lock.yaml
git commit -m "feat(ingestion): idempotenter Pilot-Import (Hub-Registrierung + DeviceAssignments) + CLI (WP-APP-5)"
```

- [ ] **Step 7 (bei Ausführung, PO-GATE Pilotdatenliste): Echte Liste erfassen + gegen Prod importieren**

1. PO-Lieferung als `docs/pilot/pilotdaten-christinenstrasse.json` erfassen (Format = `pilotdaten.example.json`; beide Gebäude Christinenstraße + Lottumstraße als `buildings`-Einträge, alle 21 Messstellen als `meteringPoints`+`assignments`).
2. Validieren: `pnpm --filter @ph360/ingestion pilot:import -- --check docs/pilot/pilotdaten-christinenstrasse.json` → `[pilot] Liste OK: … 21 Messstellen …`.
3. Auf dem VPS (Code liegt per Archiv-Deploy vor, `docs/DEPLOYMENT.md`): `docker compose -f docker-compose.prod.yml run --rm worker pnpm --filter @ph360/ingestion pilot:import -- --org <PILOT_ORG_ID> /repo/docs/pilot/pilotdaten-christinenstrasse.json` — `<PILOT_ORG_ID>` = ID der Pilot-Organisation (NICHT der Testmandant, ADR-006).
4. Ausgegebene `HUB-TOKEN`-Zeilen sicher an das Hub-Team übergeben (nie committen).
5. Kontrolle im WP-APP-1-Admin (`/admin`-Hub-Ansicht): Hubs sichtbar, Status registered.

```bash
git add docs/pilot/pilotdaten-christinenstrasse.json
git commit -m "docs(pilot): echte Pilotdatenliste Christinenstrasse/Lottumstrasse (21 Messstellen)"
```

---

## Task 4: Abweichungsreport Hub-Simulator ↔ Real (TDD)

**Files:**
- Create: `packages/ingestion/src/pilot/compare.ts`
- Create: `packages/ingestion/src/pilot/report-cli.ts`
- Test: `packages/ingestion/src/pilot/compare.test.ts`

Der Report vergleicht **strukturelle Datenqualität** (Vollständigkeit gegen das 96-Intervalle/Tag-Soll, Late-Anteil, Batch-Reject-Quoten) zwischen Simulator-Mandant (Test, ADR-006) und Pilot-Mandant (Real) — nicht Messwerte selbst (Simulator sendet synthetische Profile).

- [ ] **Step 1: Fehlschlagenden Unit-Test schreiben**

`packages/ingestion/src/pilot/compare.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderComparisonMarkdown, type SeriesStats } from "./compare.js";

const sim: SeriesStats = {
  label: "Simulator (Testmandant)",
  from: "2026-08-01T00:00:00Z",
  to: "2026-08-02T00:00:00Z",
  points: [
    { meteringPointId: "mp-1", pointType: "UNIT_CONSUMPTION", expected: 96, received: 96, late: 0 },
    { meteringPointId: "mp-2", pointType: "PV_GENERATION", expected: 96, received: 90, late: 2 },
  ],
  batches: { accepted: 186, duplicate: 4, rejected: 2 },
};

const real: SeriesStats = {
  label: "Pilot (Real)",
  from: "2026-08-01T00:00:00Z",
  to: "2026-08-02T00:00:00Z",
  points: [
    { meteringPointId: "mp-9", pointType: "UNIT_CONSUMPTION", expected: 96, received: 80, late: 10 },
  ],
  batches: { accepted: 80, duplicate: 0, rejected: 16 },
};

describe("renderComparisonMarkdown", () => {
  it("rendert beide Seiten mit Vollständigkeits-Prozent und Reject-Quote", () => {
    const md = renderComparisonMarkdown(sim, real);
    expect(md).toContain("# Abgleich Hub-Simulator ↔ Real");
    expect(md).toContain("Simulator (Testmandant)");
    expect(md).toContain("Pilot (Real)");
    expect(md).toContain("96/96 (100.0 %)");   // mp-1 vollständig
    expect(md).toContain("80/96 (83.3 %)");    // Real-Messstelle lückenhaft
    expect(md).toContain("Reject-Quote: 16.7 %"); // real: 16/(80+0+16)
  });

  it("markiert Messstellen unter 95 % Vollständigkeit als Abweichung", () => {
    const md = renderComparisonMarkdown(sim, real);
    expect(md).toContain("⚠️ mp-2");
    expect(md).toContain("⚠️ mp-9");
    expect(md).not.toContain("⚠️ mp-1");
  });
});
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
pnpm vitest run --project unit packages/ingestion/src/pilot/compare.test.ts
```

Erwartet: FAIL (`Cannot find module './compare.js'`).

- [ ] **Step 3: Minimale Implementierung**

`packages/ingestion/src/pilot/compare.ts`:

```ts
import type { PrismaClient } from "@ph360/database";

export interface PointStats {
  meteringPointId: string;
  pointType: string;
  expected: number; // Soll-Intervalle im Zeitfenster (96/Tag je gültigem Assignment, Spec §3.2)
  received: number; // vorhandene Original-Readings (supersedesId IS NULL)
  late: number;
}

export interface SeriesStats {
  label: string;
  from: string; // ISO UTC
  to: string;   // ISO UTC
  points: PointStats[];
  batches: { accepted: number; duplicate: number; rejected: number };
}

const COMPLETENESS_THRESHOLD = 0.95;

function pct(n: number, d: number): string {
  return d === 0 ? "0.0" : ((n / d) * 100).toFixed(1);
}

function section(s: SeriesStats): string {
  const lines = [
    `## ${s.label}`,
    ``,
    `Zeitfenster: ${s.from} – ${s.to} (UTC)`,
    ``,
    `| Messstelle | Typ | Intervalle (Ist/Soll) | late |`,
    `|---|---|---|---|`,
  ];
  const warnings: string[] = [];
  for (const p of s.points) {
    lines.push(`| ${p.meteringPointId} | ${p.pointType} | ${p.received}/${p.expected} (${pct(p.received, p.expected)} %) | ${p.late} |`);
    if (p.expected > 0 && p.received / p.expected < COMPLETENESS_THRESHOLD) {
      warnings.push(`- ⚠️ ${p.meteringPointId}: nur ${pct(p.received, p.expected)} % Vollständigkeit`);
    }
  }
  const total = s.batches.accepted + s.batches.duplicate + s.batches.rejected;
  lines.push(
    ``,
    `Batch-Items: accepted ${s.batches.accepted} · duplicate ${s.batches.duplicate} · rejected ${s.batches.rejected} — Reject-Quote: ${pct(s.batches.rejected, total)} %`,
    ``,
    warnings.length > 0 ? `**Abweichungen:**\n${warnings.join("\n")}` : `**Abweichungen:** keine`,
    ``,
  );
  return lines.join("\n");
}

/** Markdown-Abweichungsreport Simulator↔Real (Task-4-Artefakt, wird committet). */
export function renderComparisonMarkdown(sim: SeriesStats, real: SeriesStats): string {
  return [
    `# Abgleich Hub-Simulator ↔ Real`,
    ``,
    `Regelbasis: ADR-009 (Idempotenz, Reject-Gründe) + Spec §3.2 (96 Intervalle/Tag je Messstelle`,
    `mit gültigem Assignment). Schwelle für Abweichungs-Markierung: < ${COMPLETENESS_THRESHOLD * 100} % Vollständigkeit.`,
    ``,
    section(sim),
    section(real),
  ].join("\n");
}

/** Sammelt PointStats/Batch-Summen für einen Mandanten aus DeviceReading/DeviceAssignment/IngestBatch. */
export async function collectSeriesStats(
  prisma: PrismaClient,
  opts: { label: string; organizationId: string; from: Date; to: Date },
): Promise<SeriesStats> {
  const points = await prisma.meteringPoint.findMany({
    where: { building: { property: { organizationId: opts.organizationId } } },
    select: { id: true, pointType: true },
  });
  const intervalMs = 15 * 60 * 1000;
  const result: PointStats[] = [];
  for (const p of points) {
    const assignments = await prisma.deviceAssignment.findMany({
      where: {
        meteringPointId: p.id,
        validFrom: { lt: opts.to },
        OR: [{ validTo: null }, { validTo: { gt: opts.from } }],
      },
      select: { meterId: true, validFrom: true, validTo: true },
    });
    let expected = 0;
    let received = 0;
    let late = 0;
    for (const a of assignments) {
      const winFrom = a.validFrom > opts.from ? a.validFrom : opts.from;
      const winTo = a.validTo !== null && a.validTo < opts.to ? a.validTo : opts.to;
      expected += Math.max(0, Math.floor((winTo.getTime() - winFrom.getTime()) / intervalMs));
      received += await prisma.deviceReading.count({
        where: { meterId: a.meterId, supersedesId: null, ts: { gte: winFrom, lt: winTo } },
      });
      late += await prisma.deviceReading.count({
        where: { meterId: a.meterId, supersedesId: null, late: true, ts: { gte: winFrom, lt: winTo } },
      });
    }
    result.push({ meteringPointId: p.id, pointType: p.pointType, expected, received, late });
  }
  const hubs = await prisma.hub.findMany({ where: { organizationId: opts.organizationId }, select: { id: true } });
  const agg = await prisma.ingestBatch.aggregate({
    where: { hubId: { in: hubs.map((h) => h.id) }, createdAt: { gte: opts.from, lt: opts.to } },
    _sum: { acceptedCount: true, duplicateCount: true, rejectedCount: true },
  });
  return {
    label: opts.label,
    from: opts.from.toISOString(),
    to: opts.to.toISOString(),
    points: result,
    batches: {
      accepted: agg._sum.acceptedCount ?? 0,
      duplicate: agg._sum.duplicateCount ?? 0,
      rejected: agg._sum.rejectedCount ?? 0,
    },
  };
}
```

- [ ] **Step 4: Test grün**

```bash
pnpm vitest run --project unit packages/ingestion/src/pilot/compare.test.ts
```

Erwartet: 2 Tests PASS.

- [ ] **Step 5: Report-CLI schreiben**

`packages/ingestion/src/pilot/report-cli.ts`:

```ts
import { writeFileSync } from "node:fs";
import { prisma } from "@ph360/database";
import { collectSeriesStats, renderComparisonMarkdown } from "./compare.js";

/**
 * Abweichungsreport-CLI (WP-APP-5 Task 4).
 *   pnpm --filter @ph360/ingestion pilot:report -- --sim-org <id> --real-org <id> --from <ISO> --to <ISO> [--out <pfad>]
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const simOrg = arg("--sim-org");
  const realOrg = arg("--real-org");
  const from = arg("--from");
  const to = arg("--to");
  if (!simOrg || !realOrg || !from || !to) {
    console.error("Usage: pilot:report -- --sim-org <id> --real-org <id> --from <ISO> --to <ISO> [--out <pfad>]");
    process.exit(2);
  }
  const window = { from: new Date(from), to: new Date(to) };
  const sim = await collectSeriesStats(prisma, { label: "Simulator (Testmandant)", organizationId: simOrg, ...window });
  const real = await collectSeriesStats(prisma, { label: "Pilot (Real)", organizationId: realOrg, ...window });
  const md = renderComparisonMarkdown(sim, real);
  const out = arg("--out") ?? `docs/pilot/abgleich-${window.from.toISOString().slice(0, 10)}.md`;
  writeFileSync(out, md, "utf8");
  console.log(`[pilot] Report geschrieben: ${out}`);
  await prisma.$disconnect();
}

void main();
```

Typecheck als Verifikation:

```bash
pnpm --filter @ph360/ingestion typecheck
```

Erwartet: Exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/ingestion/src/pilot/compare.ts packages/ingestion/src/pilot/compare.test.ts packages/ingestion/src/pilot/report-cli.ts
git commit -m "feat(ingestion): Abweichungsreport Hub-Simulator vs. Real (Vollstaendigkeit/Late/Rejects) (WP-APP-5)"
```

- [ ] **Step 7 (bei Ausführung, nach ≥ 24 h Pilotbetrieb): Report erzeugen + committen**

1. Simulator gegen Testmandant laufen lassen (WP-APP-1-Werkzeug): `pnpm --filter @ph360/hub-simulator start -- --scenario normal --base-url https://app.powerhouse360.de --token <TEST_HUB_TOKEN>` (Token des Testmandant-Hubs, ADR-006).
2. Auf dem VPS: `docker compose -f docker-compose.prod.yml run --rm worker pnpm --filter @ph360/ingestion pilot:report -- --sim-org <TEST_ORG_ID> --real-org <PILOT_ORG_ID> --from <ISO-Start> --to <ISO-Ende> --out /repo/docs/pilot/abgleich-<datum>.md`; Datei zurückkopieren (`scp`).
3. Abweichungen (⚠️-Zeilen) bewerten: Real-seitige Lücken → V-02-Auflagen (Task 1 D); Simulator-seitige Lücken → Bug in WP-APP-1/Simulator (Issue im Log notieren).

```bash
git add docs/pilot/abgleich-*.md
git commit -m "docs(pilot): Abweichungsreport Simulator vs. Real (WP-APP-5 Task 4)"
```

---

## Task 5: Prod-/Staging-Konfiguration (ENV: Expo-Push, MinIO, LATE_THRESHOLD)

**Files:**
- Modify: `docker-compose.prod.yml`
- Modify: `.env.prod.example`
- Modify: `turbo.json`
- Modify: `docs/DEPLOYMENT.md`

Vorgabe Spec/WP-Zuschnitt: `docker-compose.prod.yml` wird **um nichts Neues erweitert außer ENV** (kein neuer Service; MinIO läuft laut WP-APP-4-Setup bereits bzw. extern — hier nur die Zugangs-ENV). Kein TDD (Konfiguration); Verifikation über `docker compose config`.

- [ ] **Step 1: `docker-compose.prod.yml` — ENV am Service `platform` ergänzen**

Im `environment:`-Block von `platform` (nach `ADMIN_BASIC_PASSWORD: ${ADMIN_BASIC_PASSWORD}`) ergänzen:

```yaml
      EXPO_ACCESS_TOKEN: ${EXPO_ACCESS_TOKEN}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_PORT: ${MINIO_PORT}
      MINIO_USE_SSL: ${MINIO_USE_SSL}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET_DOCUMENTS: ${MINIO_BUCKET_DOCUMENTS}
      INGEST_LATE_THRESHOLD_MIN: ${INGEST_LATE_THRESHOLD_MIN}
```

- [ ] **Step 2: `docker-compose.prod.yml` — ENV am Service `worker` ergänzen**

Im `environment:`-Block von `worker` (nach `LEAD_NOTIFY_TO: ${LEAD_NOTIFY_TO}`) ergänzen (Worker versendet Push und berechnet Aggregate/Late):

```yaml
      EXPO_ACCESS_TOKEN: ${EXPO_ACCESS_TOKEN}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_PORT: ${MINIO_PORT}
      MINIO_USE_SSL: ${MINIO_USE_SSL}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET_DOCUMENTS: ${MINIO_BUCKET_DOCUMENTS}
      INGEST_LATE_THRESHOLD_MIN: ${INGEST_LATE_THRESHOLD_MIN}
```

- [ ] **Step 3: `.env.prod.example` nachziehen**

Am Dateiende folgenden Block anfügen (Werte sind Platzhalter — echte Secrets setzt der PO ausschließlich auf dem Server, `docs/DEPLOYMENT.md`):

```bash
# --- WP-APP: Kunden-App / Push / Dokumente / Ingest (WP-APP-4/5) ---
# Expo-Access-Token für Push-Versand (expo.dev → Access Tokens)
EXPO_ACCESS_TOKEN=
# MinIO-Zugang für Dokumente/Rechnungs-PDFs (WP-APP-4)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_DOCUMENTS=ph360-documents
# Late-Schwelle in Minuten (ADR-009 §4, Default 60)
INGEST_LATE_THRESHOLD_MIN=60
```

- [ ] **Step 4: `turbo.json` — `globalEnv` erweitern**

In `"globalEnv"` (nach `"NEXT_TELEMETRY_DISABLED"`) ergänzen:

```json
    "EXPO_ACCESS_TOKEN",
    "MINIO_ENDPOINT",
    "MINIO_PORT",
    "MINIO_USE_SSL",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "MINIO_BUCKET_DOCUMENTS"
```

(`INGEST_LATE_THRESHOLD_MIN` steht bereits seit WP-APP-1 in `globalEnv` — NICHT doppelt eintragen.)

- [ ] **Step 5: Verifikation Compose-Syntax**

```bash
docker compose -f docker-compose.prod.yml config --quiet && echo COMPOSE_OK
```

Erwartet: `COMPOSE_OK` (Warnungen über nicht gesetzte Variablen sind lokal zulässig).

- [ ] **Step 6: `docs/DEPLOYMENT.md` — Abschnitt „App & Push" ergänzen**

Nach dem Abschnitt „### Domains / Reverse-Proxy (Coolify)" einfügen:

```markdown
### App & Push (WP-APP, Stand WP-APP-5)

- **Neue Server-ENV** (in `/opt/ph360/app/.env`, Vorlage `.env.prod.example`):
  `EXPO_ACCESS_TOKEN` (expo.dev → Access Tokens; Push-Versand im Worker),
  `MINIO_ENDPOINT`/`MINIO_PORT`/`MINIO_USE_SSL`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`/`MINIO_BUCKET_DOCUMENTS`
  (Dokumente/Rechnungs-PDFs, WP-APP-4), `INGEST_LATE_THRESHOLD_MIN` (Default 60, ADR-009).
- **Ingest:** `POST https://app.powerhouse360.de/api/v1/ingest/telemetry` (Hub-Bearer-Token,
  ADR-009). Hub-Registrierung + Token-Ausgabe: `pnpm --filter @ph360/ingestion pilot:import`
  (WP-APP-5 Task 3) bzw. Admin-UI. Tokens nie im Repo/Chat ablegen.
- **App:** Die Mobile-App spricht ausschließlich `https://app.powerhouse360.de` (Spec §2.1).
  Mindest-App-Version wird über `GET /api/v1/app/config` erzwungen.
- **Push-Payload-Minimierung (V-04):** Pushes enthalten nie Verbrauchswerte, nur Referenzen.
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.prod.yml .env.prod.example turbo.json docs/DEPLOYMENT.md
git commit -m "chore(deploy): Prod-ENV fuer Expo-Push, MinIO-Dokumente und LATE_THRESHOLD + DEPLOYMENT-Doku (WP-APP-5)"
```

---

## Task 6: EAS-Konfiguration + App-Icons/Splash — mit PO-GATE Bundle-ID

**Files:**
- Create: `apps/mobile/eas.json`
- Create: `apps/mobile/assets/icon.png`, `apps/mobile/assets/splash.png`
- Modify: `apps/mobile/app.config.ts`

> **PO-GATE (explizit, Spec §8):** Die finale Bundle-ID hängt am Apple-Account-Entscheid
> (voraussichtlich AKL Powerhouse 360 GmbH — bis Bestätigung keine Festlegung). Bis dahin gilt der
> Platzhalter `de.powerhouse360.app`. **`eas submit` darf erst nach PO-Bestätigung von
> Bundle-ID + Apple-Team laufen.** Lokale/Simulator-Builds sind davon unabhängig (R-A3).

- [ ] **Step 1: `eas.json` anlegen**

`apps/mobile/eas.json`:

```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "env": { "EXPO_PUBLIC_API_URL": "http://localhost:3100" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": { "EXPO_PUBLIC_API_URL": "https://app.powerhouse360.de" }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": { "EXPO_PUBLIC_API_URL": "https://app.powerhouse360.de" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleTeamId": "PO-GATE-TEAM-ID"
      }
    }
  }
}
```

(`PO-GATE-TEAM-ID` wird in Step 5 durch die echte Team-ID ersetzt — bewusst ein nicht-valider Platzhalter, damit ein versehentliches `eas submit` hart fehlschlägt.)

- [ ] **Step 2: App-Icon + Splash aus Brand-Assets erzeugen**

Quelle: `POWERHOUSE 360 (Logo).png` (Repo-Root, Brand-Asset). Auf macOS mit `sips` (Logo proportional verkleinern, auf Deep Navy `#0D1626` auffüllen):

```bash
mkdir -p apps/mobile/assets
cp "POWERHOUSE 360 (Logo).png" /tmp/ph360-logo.png
sips --resampleHeightWidthMax 820 /tmp/ph360-logo.png --out /tmp/ph360-logo-820.png
sips -p 1024 1024 --padColor 0D1626 /tmp/ph360-logo-820.png --out apps/mobile/assets/icon.png
sips --resampleHeightWidthMax 900 /tmp/ph360-logo.png --out /tmp/ph360-logo-900.png
sips -p 2778 1284 --padColor 0D1626 /tmp/ph360-logo-900.png --out apps/mobile/assets/splash.png
sips -g pixelWidth -g pixelHeight apps/mobile/assets/icon.png apps/mobile/assets/splash.png
```

Erwartet: `icon.png` 1024×1024, `splash.png` 1284×2778. Sichtprüfung: Logo mittig, Navy-Hintergrund, keine Verzerrung.

- [ ] **Step 3: `app.config.ts` auf finalen Stand bringen**

`apps/mobile/app.config.ts` vollständig ersetzen (WP-APP-3/4-Felder bleiben inhaltlich erhalten — `scheme`, Plugins, `supportsTablet: false`; abweichende Zusatzfelder aus WP-APP-3/4, z. B. `extra`-Einträge, werden unverändert in dieses Gerüst übernommen):

```ts
import type { ExpoConfig } from "expo/config";

/**
 * Powerhouse 360 Kunden-App (Bewohner-V1).
 * PO-GATE: bundleIdentifier ist Platzhalter bis Apple-Account-Entscheid (WP-APP-5 Task 6).
 */
const config: ExpoConfig = {
  name: "Powerhouse 360",
  slug: "powerhouse-360",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "powerhouse360",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0D1626",
  },
  ios: {
    bundleIdentifier: "de.powerhouse360.app", // PO-GATE: final nach Apple-Account-Entscheid
    supportsTablet: false,
    infoPlist: {
      NSFaceIDUsageDescription:
        "Face ID entsperrt die App und schützt Ihre Verbrauchs- und Vertragsdaten.",
    },
  },
  android: {
    package: "de.powerhouse360.app", // Android-Beta folgt nach V1 (Spec §8)
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-notifications",
    "expo-local-authentication",
  ],
  experiments: { typedRoutes: true },
};

export default config;
```

- [ ] **Step 4: Verifikation**

```bash
pnpm --filter @ph360/mobile exec expo config --type public > /dev/null && echo EXPO_CONFIG_OK
pnpm --filter @ph360/mobile typecheck
```

Erwartet: `EXPO_CONFIG_OK`, Typecheck Exit 0.

```bash
git add apps/mobile/eas.json apps/mobile/app.config.ts apps/mobile/assets/icon.png apps/mobile/assets/splash.png
git commit -m "feat(mobile): EAS-Profile, App-Icon/Splash aus Brand-Assets, Bundle-ID-Platzhalter mit PO-Gate (WP-APP-5)"
```

- [ ] **Step 5 (PO-GATE Apple-Account): Finale Bundle-ID + Team-ID eintragen**

Nach PO-Bestätigung: in `apps/mobile/app.config.ts` `bundleIdentifier`/`package` auf den bestätigten Wert setzen (bleibt er `de.powerhouse360.app`, nur den `// PO-GATE`-Kommentar in `// PO-bestätigt <Datum>` ändern); in `apps/mobile/eas.json` `"appleTeamId": "PO-GATE-TEAM-ID"` durch die echte Team-ID ersetzen.

```bash
git add apps/mobile/app.config.ts apps/mobile/eas.json
git commit -m "feat(mobile): finale Bundle-ID + Apple-Team-ID nach PO-Entscheid (WP-APP-5)"
```

---

## Task 7: TestFlight-Build + interne Testlauf-Checkliste

**Files:**
- Create: `docs/superpowers/verifications/2026-XX-testflight-testlauf.md`

Checkliste wird zuerst committet (jederzeit möglich); Build/Submit-Schritte sind **PO-GATE** (Apple-Account + Task 6 Step 5).

- [ ] **Step 1: Testlauf-Checkliste schreiben**

`docs/superpowers/verifications/2026-XX-testflight-testlauf.md`:

```markdown
# TestFlight — interner Testlauf (WP-APP-5)

**Status:** ⚪ offen · **Build:** _(Build-Nr. eintragen)_ · **Datum:** _(eintragen)_ · **Tester:** _(eintragen)_
**Vorbedingung:** TestFlight-Build eingereicht (WP-APP-5 Task 7), Pilot-User eingeladen (WP-1.2-Invitation),
Pilotdaten fließen (Task 3/V-02) ODER Testmandant-Simulator aktiv (dann Ergebnis als „Staging-Testlauf" kennzeichnen.)

Regel: 🟢 nur nach tatsächlich durchlaufenem Nutzerfluss (Masterplan §12). Jede Zeile mit Gerät + iOS-Version belegen.

| # | Fluss (Spec §7.3) | Schritte | Soll | Ist/Beleg | ✔ |
|---|---|---|---|---|---|
| T1 | Installation | TestFlight-Einladung → Install → App-Start | Splash (Navy) → Willkommen | | ☐ |
| T2 | Einladung → Konto | Invitation-Mail → Passwort setzen → Login | Übersicht sichtbar | | ☐ |
| T3 | Biometrie-Opt-in | Nach Login Face-ID-Prompt → aktivieren → App killen → öffnen | Face-ID-Entsperren | | ☐ |
| T4 | Push-Opt-in | Pre-Prompt → System-Prompt → erlauben | Token registriert (Admin/DB: PushDevice) | | ☐ |
| T5 | Übersicht | Heute-Karte, letzter Messwert + Zeitstempel, Datenstand-Badge | Werte plausibel, Stand < 30 min | | ☐ |
| T6 | Verbrauch | Tag→Woche→Monat→Jahr, Drilldown Stunden, Lücken-Darstellung | Chart + Vergleich Vorperiode | | ☐ |
| T7 | Rechnung | Liste → Detail → PDF laden → Flugmodus → PDF erneut öffnen | offline lesbar | | ☐ |
| T8 | Kontextwechsel | (nur Nutzer mit >1 Teilnahme) Umschalter → anderer Kontext | Daten wechseln, Auswahl persistiert | | ☐ |
| T9 | Offline-Verhalten | Flugmodus → Übersicht/Verbrauch → Support-Anfrage versuchen | Cache lesbar; Aktion zeigt „Netz erforderlich" | | ☐ |
| T10 | Benachrichtigungen | Kategorie deaktivieren → Test-Push Kategorie 1 | kein Push; Priorität 3 nicht abwählbar | | ☐ |
| T11 | Dark/Light | Systemeinstellung wechseln | beide Themes vollständig | | ☐ |
| T12 | Negativmatrix (Stichprobe) | API-Call mit fremder participantId (Proxy/curl) | 403 FORBIDDEN | | ☐ |
| T13 | Abmelden | Mehr → Abmelden → App-Start | Willkommen; Session serverseitig invalidiert | | ☐ |

## Ergebnis

- **Gesamtergebnis:** ☐ bestanden · ☐ mit Findings · ☐ nicht bestanden
- **Findings:** _(nummeriert eintragen; Blocker ⇒ Fix + neuer Build vor F-APP-2)_
```

```bash
git add "docs/superpowers/verifications/2026-XX-testflight-testlauf.md"
git commit -m "docs: TestFlight-Testlauf-Checkliste (WP-APP-5)"
```

- [ ] **Step 2 (PO-GATE Apple-Account): Production-Build bauen**

```bash
pnpm dlx eas-cli login          # Apple-/Expo-Konto des PO (interaktiv, PO führt Login selbst aus)
cd apps/mobile
pnpm dlx eas-cli build --platform ios --profile production
```

Erwartet: Build-Status `finished` auf expo.dev. (Erstlauf: EAS legt Credentials/Provisioning über den Apple-Account an — Prompts bestätigen.)

- [ ] **Step 3 (PO-GATE): Zu TestFlight einreichen + Tester einladen**

```bash
pnpm dlx eas-cli submit --platform ios --latest
```

Danach in App Store Connect: interne Testergruppe „Powerhouse Pilot" anlegen, Tester (PO + Pilot-Team) einladen. Erwartet: Build in TestFlight „Testbereit".

- [ ] **Step 4: Testlauf durchführen, Checkliste ausfüllen, committen**

```bash
git add "docs/superpowers/verifications/2026-XX-testflight-testlauf.md"
git commit -m "docs: TestFlight-Testlauf-Ergebnis eingetragen (WP-APP-5)"
```

---

## Task 8: DSGVO-Paket 2a — Website-Route `/datenschutz-app` + Privacy-URL in der App-Config

**Files:**
- Create: `apps/website/src/app/datenschutz-app/page.tsx`
- Modify: `apps/platform/src/app/api/v1/app/config/route.ts`

Die Seite nutzt die bestehende Komponente `apps/website/src/components/LegalShell.tsx` (wie `/datenschutz`). Inhalt = **app-spezifisches Text-Gerüst** (Scope-Vorgabe): vollständige Struktur, konkrete Texte für alle bekannten Sachverhalte, klar markierte `[PO: …]`-Stellen nur dort, wo Angaben ausschließlich vom PO kommen können. Kein TDD (statische Seite); Verifikation über Build + Sichtprüfung.

- [ ] **Step 1: Seite anlegen**

`apps/website/src/app/datenschutz-app/page.tsx`:

```tsx
import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung Kunden-App — Powerhouse 360",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten in der Powerhouse-360-Kunden-App (Bewohner) nach DSGVO.",
};

export default function DatenschutzAppPage() {
  return (
    <LegalShell title="Datenschutzerklärung — Powerhouse 360 Kunden-App" stand="[PO: Monat Jahr der Veröffentlichung]">
      <p>
        Diese Datenschutzerklärung gilt für die mobile Anwendung
        „Powerhouse 360&quot; (Kunden-App für Bewohner/Powermieter, iOS und
        künftig Android; nachfolgend „App&quot;). Für die Website
        powerhouse360.de gilt die{" "}
        <a href="/datenschutz">allgemeine Datenschutzerklärung</a>.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        AKL Powerhouse 360 GmbH
        <br />
        Charlottenburger Straße 2
        <br />
        13086 Berlin, Deutschland
        <br />
        E-Mail:{" "}
        <a href="mailto:info@powerhouse360.de">info@powerhouse360.de</a>
      </p>
      <p>
        Für Datenschutzanfragen:{" "}
        <a href="mailto:datenschutz@powerhouse360.de">
          datenschutz@powerhouse360.de
        </a>
        . Soweit die App im Rahmen eines Mieterstrom-/Betreiberverhältnisses
        bereitgestellt wird, kann datenschutzrechtlich Verantwortlicher der
        jeweilige Betreiber sein; wir verarbeiten dann als
        Auftragsverarbeiter nach Art. 28 DSGVO. [PO: Konstellation je
        Pilotgebäude bestätigen — Betreiber = AKL oder Dritter.]
      </p>

      <h2>2. Welche Daten die App verarbeitet</h2>
      <p>
        <strong>Konto- und Anmeldedaten:</strong> E-Mail-Adresse, Name,
        Passwort (nur als kryptografischer Hash), Sitzungs-Token. Die
        Registrierung erfolgt ausschließlich auf Einladung
        (invitation-only). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
      </p>
      <p>
        <strong>Verbrauchs- und Messdaten:</strong> 15-Minuten-Messwerte der
        Ihrer Wohneinheit zugeordneten Zählpunkte (Strom), daraus berechnete
        Auswertungen (Tages-/Wochen-/Monats-/Jahresverbrauch, PV-/Netzanteil,
        Kosten). Verbrauchsdaten je Wohneinheit sind personenbezogene Daten.
        Sie sehen ausschließlich Daten aus dem Zeitraum Ihrer eigenen
        Teilnahme; Vor- und Nachmieter sehen Ihre Daten nicht.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
        (Stromliefer-/Teilnahmevertrag).
      </p>
      <p>
        <strong>Vertrags-, Rechnungs- und Dokumentdaten:</strong>
        Vertragsnummer, Tarif, Rechnungen (PDF), vertragsbezogene Dokumente.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. b und lit. c DSGVO
        (Aufbewahrungspflichten).
      </p>
      <p>
        <strong>Push-Benachrichtigungen:</strong> Bei aktivierten
        Benachrichtigungen wird ein Push-Token Ihres Geräts gespeichert und
        an den Push-Dienst des Geräteherstellers übermittelt (Apple APNs;
        bei Android künftig Google FCM) — technisch vermittelt über den
        Dienst Expo Push (Expo, Inc.). Push-Nachrichten enthalten{" "}
        <strong>keine Verbrauchswerte</strong>, sondern nur allgemeine
        Hinweise und Referenzen; Inhalte werden erst beim Öffnen der App
        geladen. Kategorien sind in der App abwählbar; sicherheitsrelevante
        Störungsmeldungen (Priorität „kritisch&quot;) sind nicht abwählbar.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Opt-in im System-Dialog).
      </p>
      <p>
        <strong>Support-Anfragen:</strong> Inhalt Ihrer Nachricht,
        Kontaktbezug, Zeitpunkt — zur Bearbeitung Ihres Anliegens
        (Art. 6 Abs. 1 lit. b DSGVO). Über den Support können Sie auch
        Datenauskunft und Datenexport anfordern (Ziffer 7).
      </p>
      <p>
        <strong>Sicherheits- und Protokolldaten:</strong> Anmeldungen,
        Dokument- und Rechnungsabrufe sowie administrative Zugriffe auf
        wohnungsbezogene Daten werden protokolliert (Audit-Log), um Missbrauch
        erkennen und nachweisen zu können (Art. 6 Abs. 1 lit. f DSGVO;
        berechtigtes Interesse: Sicherheit und Nachvollziehbarkeit).
      </p>
      <p>
        <strong>Lokal auf Ihrem Gerät:</strong> Sitzungs-Token im
        iOS-Schlüsselbund/Android-Keystore, ein verschlüsselter Lesecache der
        zuletzt geladenen Daten sowie heruntergeladene PDF-Dokumente im
        App-Sandbox-Verzeichnis (ohne Cloud-Backup-Kennzeichnung). Die
        optionale Face-ID-/Touch-ID-Entsperrung wird vollständig durch das
        Betriebssystem ausgeführt; biometrische Daten verlassen Ihr Gerät
        nicht und werden von uns nicht verarbeitet.
      </p>

      <h2>3. Keine Werbung, kein Tracking</h2>
      <p>
        Die App enthält keine Werbenetzwerke und keine Tracking- oder
        Analyse-SDKs von Drittanbietern. Es findet kein Tracking über Apps
        und Websites anderer Unternehmen statt.
      </p>

      <h2>4. Empfänger und Auftragsverarbeiter</h2>
      <p>
        Die Plattform wird auf Servern der Hostinger International Ltd.
        betrieben (Serverstandort: [PO: Rechenzentrum-Standort gemäß
        V-04-Verifikation eintragen, Ziel: EU/Deutschland]). Für die
        App-Verteilung und Push-Zustellung werden Apple Inc. (App
        Store/TestFlight, APNs), Expo, Inc. (Build-Dienst EAS, Push-Vermittlung)
        und künftig Google Ireland Ltd. (FCM, erst mit Android-Version)
        eingesetzt. Mit allen Auftragsverarbeitern bestehen Verträge nach
        Art. 28 DSGVO; Übermittlungen in Drittländer (USA: Apple, Expo)
        erfolgen auf Grundlage des EU-U.S. Data Privacy Framework bzw. von
        EU-Standardvertragsklauseln. Details: Ziffer 8.
      </p>

      <h2>5. Speicherdauer</h2>
      <p>
        Abrechnungsrelevante Messwerte und Rechnungen werden für die Dauer
        gesetzlicher Aufbewahrungspflichten gespeichert (i. d. R. 8 bzw.
        10 Jahre, § 147 AO / § 257 HGB). Kontodaten werden für die Dauer der
        Teilnahme und danach bis zum Abschluss des Löschkonzepts
        gespeichert. Technische Protokolle ohne Abrechnungsbezug werden
        rollierend gelöscht. [PO: Fristen des Löschkonzepts nach Freigabe
        eintragen.]
      </p>

      <h2>6. Pflicht zur Bereitstellung</h2>
      <p>
        Die Nutzung der App ist freiwillig. Ohne App stehen Ihnen alle
        vertraglichen Informationen (z. B. Rechnungen) auf anderem Weg zur
        Verfügung.
      </p>

      <h2>7. Ihre Rechte</h2>
      <p>
        Sie haben die Rechte auf Auskunft (Art. 15 DSGVO), Berichtigung
        (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18),
        Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO)
        sowie das Recht, erteilte Einwilligungen (z. B. Push) jederzeit mit
        Wirkung für die Zukunft zu widerrufen — in der App unter „Mehr →
        Benachrichtigungen&quot; bzw. in den Systemeinstellungen. Anfragen zu
        Auskunft und Datenexport stellen Sie in der App unter „Mehr →
        Support&quot; oder per E-Mail an{" "}
        <a href="mailto:datenschutz@powerhouse360.de">
          datenschutz@powerhouse360.de
        </a>
        . Sie haben zudem das Recht auf Beschwerde bei einer
        Datenschutzaufsichtsbehörde, z. B. der Berliner Beauftragten für
        Datenschutz und Informationsfreiheit.
      </p>

      <h2>8. Auftragsverarbeiter im Überblick</h2>
      <p>
        Hostinger (Hosting/Betrieb) · Apple (App-Verteilung, Push iOS) ·
        Expo (Build/Push-Vermittlung) · Google (Push Android, erst mit
        Android-Version). Die vollständige, aktuelle Übersicht inkl.
        Rechtsgrundlagen der Drittlandübermittlung führen wir intern in der
        AVV-Matrix und stellen sie auf Anfrage zur Verfügung.
      </p>

      <h2>9. Änderungen</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, wenn sich die App oder die
        Rechtslage ändert. Es gilt die jeweils in der App unter „Mehr →
        Rechtliches&quot; verlinkte Fassung.
      </p>
    </LegalShell>
  );
}
```

- [ ] **Step 2: Build-Verifikation**

```bash
pnpm --filter @ph360/website build
```

Erwartet: Build erfolgreich; Route `/datenschutz-app` erscheint in der Next-Build-Routenliste. Sichtprüfung lokal: `pnpm --filter @ph360/website dev` → `http://localhost:3000/datenschutz-app` rendert im LegalShell-Layout.

- [ ] **Step 3: Privacy-URL in der App-Config-Route setzen**

In `apps/platform/src/app/api/v1/app/config/route.ts` (WP-APP-2) den Wert der rechtlichen URL `privacyPolicyUrl` auf `"https://powerhouse360.de/datenschutz-app"` setzen (nur die Konstante ändern; Struktur der Route bleibt unangetastet). Verifikation:

```bash
pnpm --filter @ph360/platform typecheck
```

Erwartet: Exit 0. Zusätzlich lokal: `curl -s http://localhost:3100/api/v1/app/config | grep datenschutz-app` liefert einen Treffer (Plattform-Dev-Server gestartet).

- [ ] **Step 4: Commit**

```bash
git add apps/website/src/app/datenschutz-app/page.tsx apps/platform/src/app/api/v1/app/config/route.ts
git commit -m "feat(website): App-Datenschutzerklaerung /datenschutz-app + Privacy-URL in App-Config (WP-APP-5, DSGVO-Paket 2)"
```

---

## Task 9: DSGVO-Paket 2b — Store-Privacy-Angaben, VVT-Beitrag, AVV-Matrix (Doku)

**Files:**
- Create: `docs/DSGVO/app-store-privacy-angaben.md`
- Create: `docs/DSGVO/vvt-kunden-app.md`
- Modify: `docs/DSGVO/AVV-MATRIX.md` (erstellt in WP-APP-4 Task 10)

Zwei neue Doku-Artefakte plus Fortschreibung der bestehenden AVV-Matrix (kein TDD). Inhalte sind aus Spec §3.3 (DSGVO-Vorgaben a–g), §7.1 (lokale Speicherung) und V-04 abgeleitet — nichts wird erfunden; PO-abhängige Angaben sind als `[PO: …]` markiert.

- [ ] **Step 1: Store-Privacy-Angaben schreiben**

`docs/DSGVO/app-store-privacy-angaben.md`:

```markdown
# App Store „App Privacy"-Angaben — Powerhouse 360 Kunden-App (V1, iOS)

**Zweck:** Ausfüllvorlage für App Store Connect → App Privacy (Apple-Fragebogen).
**Bezug:** Spec §3.3 (DSGVO f: keine Tracking-/Werbe-SDKs), §7.1, V-04. Wird bei jeder
Änderung der Datenverarbeitung VOR dem nächsten Release aktualisiert.

## Grundsatzantworten

| Apple-Frage | Antwort | Begründung |
|---|---|---|
| Do you or your third-party partners collect data from this app? | **Ja** | Konto-, Verbrauchs-, Vertragsdaten (Kernfunktion) |
| Is data used to track users? (App Tracking Transparency) | **Nein** | keine Werbenetzwerke, keine Tracking-SDKs (Spec §3.3 f) |

## Erhobene Datentypen (Apple-Taxonomie)

| Apple-Kategorie | Datentyp | Verwendung (Purpose) | Mit Identität verknüpft? | Tracking? |
|---|---|---|---|---|
| Contact Info | E-Mail-Adresse | App-Funktionalität (Konto/Login) | Ja | Nein |
| Contact Info | Name | App-Funktionalität (Konto, Vertragsbezug) | Ja | Nein |
| Identifiers | User-ID | App-Funktionalität (Session, Berechtigungen) | Ja | Nein |
| Identifiers | Device-ID (Expo-Push-Token) | App-Funktionalität (Push-Zustellung) | Ja | Nein |
| Financial Info | Rechnungs-/Zahlungshistorie (Rechnungsbeträge) | App-Funktionalität (Rechnungsanzeige) | Ja | Nein |
| Other Data | Energieverbrauchsdaten (15-min-Messwerte, Aggregate) | App-Funktionalität (Verbrauchsanzeige) | Ja | Nein |
| User Content | Support-Nachrichten | App-Funktionalität (Support) | Ja | Nein |

## Ausdrücklich NICHT erhoben

Standort · Browserverlauf · Suchverlauf · Kontakte · Fotos/Medien (V1 ohne Foto-Upload;
bei V1.1-Servicefall-Foto diese Datei VOR Release aktualisieren) · Gesundheits-/Fitnessdaten ·
Nutzungsdaten für Analytics (keine Analyse-SDKs) · Diagnosedaten über Dritt-SDKs
(kein Crash-Reporting-SDK in V1; bei Einführung aktualisieren) · Werbedaten.

## Sonstige Store-Pflichtangaben

- **Privacy Policy URL:** `https://powerhouse360.de/datenschutz-app` (Task 8; muss vor
  `eas submit` öffentlich erreichbar sein).
- **Alterseinstufung:** 4+ (keine bedenklichen Inhalte).
- **Anmeldepflicht:** App ist nur mit Konto nutzbar (invitation-only) — für das
  App-Review ein Testmandant-Demo-Konto hinterlegen (App Store Connect → App Review
  Information; Konto aus ADR-006-Testmandant, NIE ein Pilotbewohner-Konto).
```

- [ ] **Step 2: VVT-Beitrag schreiben**

`docs/DSGVO/vvt-kunden-app.md`:

```markdown
# VVT-Beitrag: Verarbeitungstätigkeit „Kunden-App (Bewohner)" — Art. 30 DSGVO

**Aufnahme in das Verzeichnis von Verarbeitungstätigkeiten der AKL Powerhouse 360 GmbH.**
**Stand:** WP-APP-5 · wird bei App-Änderungen fortgeschrieben.

| Feld | Inhalt |
|---|---|
| Bezeichnung | Bereitstellung und Betrieb der Powerhouse-360-Kunden-App (Bewohner/Powermieter) |
| Verantwortlicher | AKL Powerhouse 360 GmbH, Charlottenburger Straße 2, 13086 Berlin · datenschutz@powerhouse360.de · [PO: je Pilotgebäude prüfen, ob AKL Verantwortlicher oder Auftragsverarbeiter des Betreibers ist] |
| Zwecke | Anzeige von Verbrauchs-, Vertrags- und Rechnungsdaten; Benachrichtigungen (Rechnung, Datenqualität, kritische Störung); Support inkl. DSGVO-Auskunfts-/Exportanfragen; Missbrauchserkennung (Audit) |
| Kategorien betroffener Personen | Bewohner/Powermieter mit aktivem oder beendetem Teilnahmeverhältnis (PowerParticipant) |
| Kategorien personenbezogener Daten | Konto (E-Mail, Name, Passwort-Hash, Session), Teilnahme-/Vertragsdaten, 15-min-Verbrauchsmesswerte + Aggregate je Wohneinheit, Rechnungen/Dokumente, Push-Token + Benachrichtigungspräferenzen, Support-Nachrichten, Audit-Protokolle (Login, Downloads, Admin-Zugriffe) |
| Besondere Kategorien (Art. 9) | keine |
| Empfänger | intern: Service-/Betriebsteam (rollenbasiert, teilnahme-gescoped). Auftragsverarbeiter: Hostinger (Hosting), Apple (APNs/TestFlight), Expo (EAS/Push-Vermittlung), Google (FCM, erst Android) — Details `docs/DSGVO/AVV-MATRIX.md` |
| Drittlandübermittlung | USA (Apple, Expo): EU-U.S. Data Privacy Framework bzw. SCC; Push-Payloads minimiert (keine Verbrauchswerte, nur Referenzen — V-04) |
| Löschfristen | abrechnungsrelevante Messwerte/Rechnungen: gesetzliche Aufbewahrung (8/10 Jahre); Konto: bis Ende Teilnahme + Löschkonzept-Frist [PO: Frist]; Push-Token: bei Abmeldung/Deregistrierung sofort; technische Protokolle ohne Abrechnungsbezug: rollierend [PO: Frist]; Details Löschkonzept (Spec §3.3 e) |
| Technisch-organisatorische Maßnahmen | TLS-Transportverschlüsselung; DB-Sessions mit serverseitiger Invalidierung; Passwort-Hashing; RBAC + Teilnahme-Scope (Server erzwingt, §5); Audit-Events für sicherheitsrelevante Zugriffe; Session-Token im Keychain/Keystore; verschlüsselter Offline-Cache; PDF ohne Cloud-Backup-Flag; invitation-only-Registrierung; Hub-Token-Hashing + Revocation (ADR-009); Mandantenisolation (ADR-004) |
| Bemerkungen | Verbrauchsdaten je Einheit gelten als personenbezogen (Spec §3.3). HV/Eigentümer erhalten keine Einzelverbrauchsprofile ohne dokumentierte Rechtsgrundlage. Keine Tracking-/Werbe-SDKs. |
```

- [ ] **Step 3: AVV-Matrix fortschreiben (Modify — kein Neuanlegen)**

`docs/DSGVO/AVV-MATRIX.md` existiert bereits (erstellt in WP-APP-4 Task 10). Die bestehende Datei mit dem folgenden Zielzustand abgleichen und NUR fehlende Abschnitte/Tabellenzeilen ergänzen bzw. abweichende Zellen der vier Dienstleister-Zeilen aktualisieren; bereits korrekte Inhalte und die vom PO gefüllten Spalten „AVV-Status"/„Nachweis" unverändert lassen (keine Umformatierung, kein Löschen bestehender Zeilen):

```markdown
# AVV-Matrix — Kunden-App / Plattform (Abschluss Spec §3.3 c, V-04)

**Zweck:** Übersicht Verantwortlicher ↔ Auftragsverarbeiter mit Vertrags- und
Transfergrundlage. Spalten „AVV-Status"/„Nachweis" füllt der PO beim Abschluss der
Verträge; ohne abgeschlossenen Hostinger- und Apple-Vertrag kein Produktivbetrieb
mit echten Bewohnerdaten.

Verantwortlicher: AKL Powerhouse 360 GmbH [PO: je Gebäude prüfen, ob stattdessen der
Betreiber Verantwortlicher und AKL Auftragsverarbeiter ist — dann zusätzlich AVV
AKL↔Betreiber].

| Auftragsverarbeiter | Leistung | Verarbeitete Daten | Verarbeitungsort | Transfergrundlage | AVV-Status | Nachweis/Datum |
|---|---|---|---|---|---|---|
| Hostinger International Ltd. | VPS-Hosting Plattform + DB + MinIO | alle Plattformdaten | [PO: RZ-Standort dokumentieren, V-04 — Ziel EU/DE] | EU (kein Drittland, sofern RZ-Standort EU bestätigt) | ☐ offen | |
| Apple Inc. | App-Verteilung (App Store/TestFlight), Push (APNs) | Push-Token, minimierte Push-Payloads, TestFlight-Tester-E-Mails | USA/global | EU-U.S. Data Privacy Framework (zertifiziert) + Apple Developer Program License Agreement | ☐ offen | |
| Expo, Inc. | EAS Build/Submit, Expo-Push-Vermittlung | Push-Token, minimierte Push-Payloads, Build-Artefakte | USA | SCC (Expo Data Processing Addendum) | ☐ offen | |
| Google Ireland Ltd. | FCM (Push Android) — **erst mit Android-Beta aktiv** | Push-Token, minimierte Push-Payloads | EU/USA | Google Ads Data Processing Terms / SCC | ☐ vorgemerkt (nicht vor Android-Beta) | |

**Regeln (bindend, V-04):**
1. Push-Payloads enthalten NIE Verbrauchswerte oder Vertragsinhalte — nur Titel,
   generischer Text, Referenz-IDs (Durchsetzung im Worker-Push-Handler, WP-APP-4).
2. Neue Dienstleister (z. B. Crash-Reporting) erst nach Aufnahme in diese Matrix
   + PO-Freigabe (Spec §3.3 f).
3. Diese Matrix wird bei jedem neuen Dienst und jährlich zum [PO: Datum] geprüft.
```

- [ ] **Step 4: Commit**

```bash
git add docs/DSGVO/app-store-privacy-angaben.md docs/DSGVO/vvt-kunden-app.md docs/DSGVO/AVV-MATRIX.md
git commit -m "docs(dsgvo): Store-Privacy-Angaben, VVT-Beitrag Kunden-App, AVV-Matrix (WP-APP-5, DSGVO-Paket 2)"
```

---

## Task 10: F-APP-2 — E2E-Protokoll Pilot-Hub → Ingest → App (Gate)

**Files:**
- Create: `docs/superpowers/verifications/2026-XX-f-app-2-e2e.md`

Das Gate-Protokoll wird zuerst als Leerformular committet; die Durchführung (PO-GATE: V-02 bestanden + Task 3 Step 7 + Task 7 Build) füllt es aus. **Erst danach** dürfen die 🟢-Markierungen aus Task 11 gesetzt werden.

- [ ] **Step 1: Protokoll-Formular schreiben**

`docs/superpowers/verifications/2026-XX-f-app-2-e2e.md`:

```markdown
# F-APP-2 — E2E-Gate: Pilot-Hub → Ingest → App zeigt echten Messwert

**Status:** ⚪ offen · **Datum:** _(eintragen)_ · **Durchgeführt von:** _(eintragen)_
**Vorbedingungen (alle belegt):** V-02 bestanden (`2026-XX-pilot-telemetrie.md`) ·
Pilot-Import gelaufen (Task 3 Step 7, 21 Assignments) · TestFlight-Build installiert
(Task 7) · Pilotbewohner-Testkonto mit aktiver PowerParticipant-Teilnahme auf einer
Pilot-Unit (WP-1.2-Invitation; eigenes Konto des Testers, KEIN fremdes Bewohnerkonto).

Regel: 🟢 nur nach tatsächlich durchlaufenem Nutzerfluss (Masterplan §12).
Referenzzähler: eine Pilot-Messstelle, deren Wohnung für den Test zugänglich ist.

| # | Schritt | Methode | Soll | Ist/Beleg | ✔ |
|---|---|---|---|---|---|
| E1 | Referenzwert am physischen Zähler ablesen | vor Ort, Foto mit Uhrzeit | Zählerstand X kWh um HH:MM | | ☐ |
| E2 | Hub-Batch mit dem Intervall des Referenzzeitpunkts kommt an | Server: `IngestBatch`-Eintrag des Pilot-Hubs mit `acceptedCount > 0` im Zeitfenster (Admin-Hub-Ansicht bzw. DB-Read-only) | Batch accepted, kein reject für den Referenzkanal | | ☐ |
| E3 | Reading persistiert | `DeviceReading` für den Referenz-Meter, `ts` = Intervallende, `kind = REGISTER`, `quality` RAW oder VALIDATED | Wert ≈ E1 (± Intervallverbrauch) | | ☐ |
| E4 | Worker hat verarbeitet | `DeviceState.lastValue/lastTs` des Referenz-Meters aktualisiert; `ConsumptionAggregate` (HOUR/DAY) für den Tag vorhanden | lastTs = E3-ts | | ☐ |
| E5 | App zeigt den echten Messwert | TestFlight-App, Konto E-Vorbedingung → Übersicht | „Letzter Messwert" = E3-Wert, Zeitstempel = E3-ts, Datenstand < 30 min | | ☐ |
| E6 | App-Zeitreihe stimmt | Verbrauch → Tag → Stunden-Drilldown | Intervalle des Testtags sichtbar, Lücken (falls vorhanden) explizit dargestellt | | ☐ |
| E7 | Latenzziel | Differenz E5-Datenstand ↔ Serverzeit | ≤ 30 min (Spec §2.3 Nr. 6) | | ☐ |
| E8 | Negativprobe | zweites Testkonto ohne Teilnahme an der Referenz-Unit ruft `GET /api/v1/app/contexts/<referenz-participantId>/summary` | 403 FORBIDDEN | | ☐ |

## Ergebnis

- **Gesamtergebnis:** ☐ F-APP-2 bestanden (→ Task 11 ausführen) · ☐ nicht bestanden
- **Belege:** _(Foto E1, Batch-ID E2, Screenshot E5 — Ablage: docs/superpowers/verifications/anlagen/ ohne personenbezogene Fremddaten)_
- **Findings/Abweichungen:** _(eintragen)_
```

```bash
git add "docs/superpowers/verifications/2026-XX-f-app-2-e2e.md"
git commit -m "docs: F-APP-2-E2E-Protokollformular (WP-APP-5)"
```

- [ ] **Step 2 (PO-GATE, bei Durchführung): Protokoll ausfüllen und committen**

Durchführung gemäß Tabelle E1–E8; Belege ablegen; Status im Kopf auf „🟢 bestanden \<Datum\>" setzen, wenn alle 8 Zeilen ✔.

```bash
git add "docs/superpowers/verifications/2026-XX-f-app-2-e2e.md" docs/superpowers/verifications/anlagen
git commit -m "docs: F-APP-2 bestanden — Pilot-Hub -> Ingest -> App E2E-Protokoll ausgefuellt"
```

---

## Task 11: Masterplan-/Roadmap-/Log-Nachführung (Spec §12)

**Files:**
- Modify: `docs/POWERHOUSE_360_MASTER_PLAN.md`
- Modify: `docs/EXECUTION_ROADMAP.md`
- Modify: `docs/IMPLEMENTATION_LOG.md`

Nur ausführen, **nachdem** F-APP-2 in Task 10 dokumentiert bestanden ist (Statusregel: 🟢 nur nach durchlaufenem Nutzerfluss). `<Datum>` = Datum des F-APP-2-Protokolls.

- [ ] **Step 1: Masterplan §12 — E2E-Matrix: F-APP-2 auf 🟢**

In `docs/POWERHOUSE_360_MASTER_PLAN.md`, Abschnitt „## 12. Teststrategie…", Tabelle „E2E-Matrix": die Zeile `F-APP-2` finden und die Status-Spalte auf `🟢 <Datum> (pilot)` setzen. Falls die F-APP-Zeilen noch fehlen (Programmplan-Nachführung aus Spec §12 Nr. 3 nicht erfolgt), direkt nach der Zeile `| F-08 | … |` diese zwei Zeilen einfügen (F-APP-1-Status aus dem WP-APP-4-Abschluss übernehmen):

```markdown
| F-APP-1 | Bewohner-Login → Verbrauch → Rechnung inkl. Negativmatrix (App) | App-V1 | 🟢 (WP-APP-4) |
| F-APP-2 | Pilot-Hub → Ingest → App zeigt echten Messwert | App-V1 | 🟢 <Datum> (pilot) |
```

- [ ] **Step 2: Masterplan §14 — Fortschritt + nächste Schritte**

In der §14-Statustabelle die Zeile zur Kunden-App aktualisieren (bzw. einfügen, falls fehlend, nach der Zeile „Marketing-Site + Funnels"):

```markdown
| Kunden-App (Bewohner-V1, WP-APP-1…5) | 🟢 F-APP-1 + F-APP-2 (<Datum>); TestFlight intern; Android-Beta + V1.1-Backlog offen |
```

In der Liste „Nächste verbindliche Schritte" den erledigten WP-APP-Schritt entfernen und als neuen Schritt aufnehmen:

```markdown
- Kunden-App: Android-Beta (gleiche Codebase) + V1.1-Backlog priorisieren (Spec §8 „danach"); DSGVO-Offenposten schließen ([PO]-Stellen in docs/DSGVO/* + /datenschutz-app).
```

- [ ] **Step 3: Masterplan §15 — Änderungsverlauf ergänzen**

Am Tabellenende von „## 15. Änderungsverlauf" anfügen:

```markdown
| <Datum> | 2.x | WP-APP-5 abgeschlossen: Pilot-Hubs Christinenstraße/Lottumstraße (21 Messstellen) an Ingest angebunden (V-02 dokumentiert), Abgleichsreport Simulator↔Real, TestFlight-Build + interner Testlauf, DSGVO-Paket 2 (/datenschutz-app, Store-Angaben, VVT, AVV-Matrix), F-APP-2 🟢 | Kunden-App-Programm (Spec 2026-07-22) |
```

- [ ] **Step 4: EXECUTION_ROADMAP nachführen**

In `docs/EXECUTION_ROADMAP.md`: im WP-APP-5-Abschnitt alle erledigten Checkboxen auf `- [x]` setzen und die Gate-Zeile auf `**Gate:** F-APP-2 🟢 <Datum>` ändern. In der Tabelle „## Gate-Übersicht" die App-Zeile aktualisieren; falls die WP-APP-Abschnitte/Zeile noch fehlen (Programmplan-Nachführung offen), am Tabellenende ergänzen:

```markdown
| App (WP-APP-1…5) | F-08 (Kern), F-APP-1, F-APP-2 | F-08-Kern 🟢 · F-APP-1 🟢 · F-APP-2 🟢 <Datum> |
```

- [ ] **Step 5: IMPLEMENTATION_LOG — append-only-Eintrag**

Am Dateiende von `docs/IMPLEMENTATION_LOG.md` anfügen (Ist-Angaben aus den Verifikationsartefakten übernehmen):

```markdown
## <Datum> — WP-APP-5: Pilot-Anbindung + TestFlight + DSGVO-Abschluss

**Getan:**
- V-02 Pilotdaten-Verifikation durchgeführt und dokumentiert (`docs/superpowers/verifications/2026-XX-pilot-telemetrie.md`).
- Pilot-Import (idempotent) über WP-APP-1-Registrierung: 2 Gebäude, 21 Messstellen, DeviceAssignments aus `docs/pilot/pilotdaten-christinenstrasse.json`; Hub-Tokens einmalig an Hub-Team übergeben.
- Abweichungsreport Simulator↔Real (`docs/pilot/abgleich-<datum>.md`): Vollständigkeit/late/Reject-Quoten; Abweichungen als V-02-Auflagen erfasst.
- Prod-ENV (Expo-Push, MinIO, LATE_THRESHOLD) in compose/.env.prod.example/turbo.json + DEPLOYMENT.md-Abschnitt „App & Push".
- EAS-Profile + Icon/Splash; Bundle-ID/Team-ID nach PO-Entscheid: <Wert eintragen>.
- TestFlight-Build <Build-Nr.> + interner Testlauf (T1–T13, Ergebnis im Verifikationsartefakt).
- DSGVO-Paket 2: `/datenschutz-app`, Store-Privacy-Angaben, VVT-Beitrag, AVV-Matrix.
- **F-APP-2 🟢** (`docs/superpowers/verifications/2026-XX-f-app-2-e2e.md`, E1–E8).

**Getestet:** Unit (parse/compare) + Integration (Pilot-Import idempotent, Real-Postgres) grün; F-APP-2 E1–E8 am Pilot; TestFlight-Testlauf T1–T13.
**Nicht getestet:** Android (Beta folgt); AVV-Abschlüsse sind organisatorisch offen ([PO]-Spalten in `docs/DSGVO/AVV-MATRIX.md`).
**Restrisiko:** R-A6-Rest (AVV-Unterschriften, Löschkonzept-Fristen beim PO); R-A1/R-02 unverändert (kein Git-Remote/CI).
**Nächster Schritt:** Android-Beta + V1.1-Backlog (Spec §8 „danach"); DSGVO-[PO]-Stellen schließen.
```

- [ ] **Step 6: Commit**

```bash
git add docs/POWERHOUSE_360_MASTER_PLAN.md docs/EXECUTION_ROADMAP.md docs/IMPLEMENTATION_LOG.md
git commit -m "docs: Masterplan/Roadmap/Log nachgefuehrt — WP-APP-5 abgeschlossen, F-APP-2 gruen"
```

---

## Abschluss-Checkliste

- [ ] **Testsuiten grün:** `pnpm vitest run --project unit` und `docker compose up -d postgres && pnpm vitest run --project integration` — Exit 0, inkl. der neuen Suites `parse.test.ts`, `compare.test.ts`, `import.itest.ts`.
- [ ] **Typechecks grün:** `pnpm --filter @ph360/ingestion typecheck && pnpm --filter @ph360/platform typecheck && pnpm --filter @ph360/mobile typecheck` — Exit 0; `docker compose -f docker-compose.prod.yml config --quiet` ohne Fehler.
- [ ] **Gate-Verifikation F-APP-2:** `docs/superpowers/verifications/2026-XX-f-app-2-e2e.md` mit allen 8 Zeilen ✔, Belegen und Status „🟢 bestanden" committet; V-02-Artefakt (`2026-XX-pilot-telemetrie.md`) mit Ergebnis D committet; TestFlight-Testlauf (`2026-XX-testflight-testlauf.md`) mit Ergebnis committet; Abgleichsreport `docs/pilot/abgleich-*.md` committet.
- [ ] **DSGVO-Paket 2 vollständig:** `/datenschutz-app` im Website-Build enthalten und (nach Deploy) öffentlich erreichbar; `privacyPolicyUrl` der App-Config zeigt darauf; `docs/DSGVO/`-Artefakte committet; verbleibende `[PO: …]`-Stellen als Offenposten an den PO übergeben.
- [ ] **PO-GATEs dokumentiert:** Bundle-ID/Team-ID-Entscheid in Task 6 Step 5 eingetragen ODER als offen markiert (dann kein `eas submit`); Hub-Tokens nur einmalig ausgegeben, nirgends committet (`git log -p | grep -i "HUB-TOKEN"` liefert nichts außer dem CLI-Quelltext).
- [ ] **IMPLEMENTATION_LOG-Eintrag** WP-APP-5 (Task 11 Step 5) append-only angefügt.
- [ ] **Masterplan-Statuspflege:** §12 F-APP-2 🟢, §14-Zeile Kunden-App, §15-Änderungsverlauf, EXECUTION_ROADMAP-Gate-Übersicht — alle konsistent mit demselben `<Datum>` (Task 11 Steps 1–4).
- [ ] **Kein `git push`** (kein Remote, R-02); alle Commits lokal auf `feat/platform-foundation` mit Conventional-Commits-Messages (deutsch).


