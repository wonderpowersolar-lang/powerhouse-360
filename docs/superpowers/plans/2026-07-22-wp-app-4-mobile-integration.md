# WP-APP-4 Mobile-Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Expo-App (`apps/mobile`) wird von Mock- auf Echtbetrieb umgestellt: `ApiDataSource` gegen `/api/v1/app/*`, verschlüsselter Offline-Lesecache, Biometrie-App-Lock, PDF-Downloads ohne Cloud-Backup, komplette Push-Kette (App-Registrierung → Worker → Expo Push API inkl. Anti-Spam), Datenschutz-Screen + AVV-Matrix und eine Maestro-E2E-Suite als Gate F-APP-1 (E2E).

**Architecture:** Alle Netzzugriffe der App laufen über einen einzigen fetch-Wrapper (`createHttpClient`), der den Fehler-Envelope `{error:{code,message,requestId}}` auf `ApiError` mappt, `x-app-version` sendet und bei 401 den Login erzwingt; darauf implementiert `createApiDataSource` das bestehende `DataSource`-Interface mit den Zod-Schemas aus `@ph360/api-contracts` (Single Source of Truth, Contracts §4.2 der Spec). TanStack Query persistiert in ein verschlüsseltes MMKV (Schlüssel in `expo-secure-store`); Push wird serverseitig über einen neuen Outbox-Handler `notification.requested` im Worker versendet: Der Handler ÜBERSETZT den kanonischen WP-APP-1-Producer-Payload (MeteringPoint→Unit→aktive PowerParticipant→userId ⇒ je User eine `Notification`-Zeile), prüft danach Preferences + Anti-Spam (neues Prisma-Modell `PushDelivery`) und sendet erst dann an die Expo Push API. Alle RN-nativen Abhängigkeiten sind hinter schmalen Interfaces gekapselt, damit die Fachlogik mit Vitest ohne RN-Runtime testbar ist.

**Tech Stack:** Expo (React Native, TypeScript, expo-router), TanStack Query + `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister`, react-native-mmkv (verschlüsselt), expo-secure-store, expo-crypto, expo-local-authentication, expo-notifications, expo-file-system (legacy-API), expo-sharing, expo-network, lokales Expo-Modul (Swift) für iOS-Backup-Ausschluss, zod ^3.24.1, Vitest 3, Prisma 6, Maestro (iOS-Simulator), Node-Worker (tsx).

**Vorbedingungen:**
- **WP-APP-2 grün (Gate F-APP-1 API):** `/api/v1/app/*`-Routen existieren in `apps/platform` inkl. `apps/platform/src/app/api/v1/app/documents/[id]/download/route.ts` (GET, signierte MinIO-URL). `@ph360/api-contracts` exportiert (WP-APP-2 Task 3; `errorEnvelopeSchema` bereits aus WP-APP-1 `src/errors.ts`): `errorEnvelopeSchema`, `meResponseSchema`/`MeResponse`, `summaryResponseSchema`/`SummaryResponse`, `consumptionQuerySchema`/`ConsumptionQuery`, `consumptionResponseSchema`/`ConsumptionResponse`, `dataStatusResponseSchema`/`DataStatusResponse`, `invoiceListResponseSchema`/`InvoiceListResponse`, `invoiceDetailResponseSchema`/`InvoiceDetailResponse`, `documentDownloadResponseSchema`/`DocumentDownloadResponse` (Feld `url: string`), `contractResponseSchema`/`ContractResponse`, `notificationPreferencesResponseSchema`/`NotificationPreferencesResponse` (Shape `{categories:[{category,enabled,locked}]}`), `notificationPreferencePutSchema` (Shape `{category,enabled}`), `pushDeviceCreateSchema`, `pushDeviceDeleteSchema`, `supportMessageCreateSchema`, `configResponseSchema`/`ConfigResponse`. Für die Schreib-Inputs exportiert WP-APP-2 KEINE Typ-Aliase (`NotificationPreferencesUpdate` o. ä. existiert nicht) — Input-Typen werden lokal via `z.infer<typeof …Schema>` abgeleitet (siehe Task 2). Prisma-Modelle `Notification` (userId, organizationId?, priority, category, title, body, readAt?), `NotificationPreference` (userId, category, enabled), `PushDevice` (userId, expoPushToken unique, platform, appVersion), `Document`, `PowerParticipant` (userId?, unitId, status, validFrom, validTo?), `Invoice`→`Contract` (participantId?), `MeteringPoint` (unitId?), `DeviceAlert` und Enum `NotificationCategory` (BILLING|DATA_QUALITY|INCIDENT|SERVICE|CONTRACT) existieren. Der WP-APP-1-Worker (Lückenerkennung, WP-APP-1 Task 8) emittiert `DomainEvent` `notification.requested` mit dem kanonischen Producer-Payload `{ kind: "data_gap"|"data_gap_resolved"|"invoice_created", category: "DATA_QUALITY"|"BILLING"|"INCIDENT", priority: 1|2|3, meteringPointId?, meterId?, gapSince? (ISO-String|null), invoiceId? }`; `invoice_created` kommt aus der Rechnungslogik. `Notification`-Zeilen erzeugt der Producer NICHT — das ist die Übersetzungsleistung von Task 8 dieses Plans. Seed-Kommando `pnpm db:seed:app` (Root-Script, definiert in WP-APP-2 Task 15) legt im Testmandanten einen better-auth-Resident `resident@test.powerhouse360.de` / `Test1234!powerhouse` (OrganizationMembership RESIDENT, `PowerParticipant.userId` verknüpft) mit Contexts, Aggregaten, Rechnung + PDF-Dokument an.
- **WP-APP-3 grün (Demo-Build gegen Mock):** `apps/mobile` existiert mit expo-router, Theme, i18n (`src/i18n`, `de.json`), better-auth-Expo-Client `src/lib/auth-client.ts` (Export `authClient` mit `getCookie()`), `src/data/data-source.ts` (Interface `DataSource`, 14 Methoden — siehe Task 2), `src/data/mock-data-source.ts` (Export `createMockDataSource(): DataSource`), `src/data/data-source-provider.tsx` (Exports `DataSourceProvider`, `useDataSource`), Login-Route `/login` mit testIDs `login-email`/`login-password`, Tabs Übersicht/Verbrauch/Rechnungen/Mehr, Rechnungsdetail `app/(tabs)/rechnungen/[invoiceId].tsx`, Vitest-Setup (`pnpm --filter @ph360/mobile exec vitest`), Bundle-ID `de.powerhouse360.app`, `app.json` vorhanden.
- **WP-1.2 grün:** `@ph360/auth` (Exports `auth`, `recordAudit`, `AuthnError`/`AuthzError`), `@ph360/testing` (Exports `prisma`, `createOrg`, `createUserWithMembership`; WP-APP-2 ergänzt `createResidentContext()` → `{user, email, password, organization, unit, participant}`), Root-`vitest.config.ts` mit Projekten `unit` (Include `**/*.test.ts` repo-weit) und `integration` (Include `**/*.itest.ts`, globalSetup `ph360_test` :5433).
- Lokale Dev-Infra läuft: Postgres :5433, MinIO, Mailpit (`docker-compose.yml`); Plattform startbar auf :3100.
- Maestro CLI lokal installiert (`curl -fsSL "https://get.maestro.mobile.dev" | bash`), Xcode + iOS-Simulator vorhanden.
- Abweichungsregel: Weichen WP-APP-2/-APP-3-Namen im Detail ab (z. B. Schema-Namen, testIDs), wird an der Verwendungsstelle der tatsächliche Name eingesetzt — die Struktur dieses Plans bleibt unverändert; Abweichungen werden im IMPLEMENTATION_LOG notiert.

---

## Dateistruktur

**Neu (apps/mobile):**
- `src/data/api/http.ts` — fetch-Wrapper: Fehler-Envelope→`ApiError`, `x-app-version`, Cookie, 401-Callback
- `src/data/api/http.test.ts` — Unit-Tests fetch-Wrapper
- `src/data/api-data-source.ts` — `DataSource`-Implementierung gegen `/api/v1/app/*`
- `src/data/api-data-source.test.ts` — Unit-Tests (Pfade/Methoden/Query)
- `src/data/create-data-source.ts` — Auswahl Mock/API via `EXPO_PUBLIC_DATA_SOURCE`
- `src/lib/auth-events.ts` — Session-Expired-Eventbus (401 → Login)
- `src/lib/auth-events.test.ts` — Unit-Test Eventbus
- `src/lib/cache/cache-key.ts` — Erzeugung/Ablage des MMKV-Verschlüsselungsschlüssels (SecureStore, DI)
- `src/lib/cache/cache-key.test.ts` — Unit-Tests Schlüssel-Logik
- `src/lib/cache/persister.ts` — TanStack-Persister über injizierbares String-Storage
- `src/lib/cache/persister.test.ts` — Roundtrip-Test mit Map-Stub
- `src/lib/storage/app-storage.ts` — Singleton: verschlüsselte MMKV-Instanz (Cache + Dokument-Index)
- `src/lib/cache/query-persistence.ts` — verdrahtet SecureStore+Crypto+MMKV → Persister
- `src/lib/cache/data-stand.ts` — `formatDataStandTime` (Datenstand aus Cache-Zeitstempel)
- `src/lib/cache/data-stand.test.ts` — Unit-Tests Formatierung
- `src/components/data-stand-badge.tsx` — „Stand 14:32“-Badge (i18n)
- `src/lib/network/is-offline.ts` — pure Offline-Entscheidung aus NetworkState
- `src/lib/network/is-offline.test.ts` — Unit-Tests
- `src/lib/network/wire-online-manager.ts` — expo-network → TanStack `onlineManager`
- `src/lib/network/offline-banner.tsx` — globales Offline-Banner
- `src/lib/network/use-require-network.ts` — Guard „Aktion braucht Netz“ (Alert-Hinweis)
- `src/lib/app-lock/app-lock.ts` — App-Lock-Zustandsmaschine (DI, testbar)
- `src/lib/app-lock/app-lock.test.ts` — Unit-Tests Zustandsmaschine
- `src/lib/app-lock/deps.ts` — native Deps (expo-local-authentication, SecureStore)
- `src/lib/app-lock/lock-screen.tsx` — Sperr-Screen mit „Entsperren“-Button
- `src/lib/app-lock/app-lock-gate.tsx` — AppState-Listener + Gate-Komponente
- `src/lib/onboarding/use-onboarding-prompts.ts` — nach Login: Biometrie- dann Push-Opt-in
- `app/biometrie.tsx` — Biometrie-Opt-in-Screen
- `app/push-erklaerung.tsx` — Pre-Permission-Erklärscreen Push
- `src/lib/documents/document-store.ts` — DocumentStore (Download, Index, Offline-Zugriff; DI)
- `src/lib/documents/document-store.test.ts` — Unit-Tests DocumentStore
- `src/lib/documents/file-ops.ts` — native FileOps (expo-file-system legacy, no-backup)
- `src/lib/documents/index.ts` — `getDocumentStore()`-Singleton
- `src/components/document-open-button.tsx` — Laden/Öffnen/Teilen eines Dokuments (offline-fähig)
- `modules/no-backup/expo-module.config.json` — lokales Expo-Modul (nur iOS)
- `modules/no-backup/ios/NoBackupModule.swift` — setzt `NSURLIsExcludedFromBackupKey`
- `modules/no-backup/ios/NoBackup.podspec` — Podspec des lokalen Moduls
- `modules/no-backup/index.ts` — TS-Wrapper `setExcludedFromBackup`
- `src/lib/push/push-registration.ts` — Registrierungs-/Deregistrierungslogik (DI, testbar)
- `src/lib/push/push-registration.test.ts` — Unit-Tests
- `src/lib/push/native-deps.ts` — native Deps (expo-notifications, SecureStore, Constants)
- `src/lib/push/channels.ts` — Android-Kanäle je Kategorie (Priorität 1–3) + Foreground-Handler
- `src/lib/push/use-notification-preferences.ts` — Query+Mutation Präferenzen-Sync
- `app/(tabs)/mehr/datenschutz.tsx` — In-App-Datenschutzhinweise (statisch aus i18n)
- `e2e/flows/01-login.yaml` … `e2e/flows/05-offline.yaml` — Maestro-Flows
- `e2e/flows/helpers/skip-onboarding.yaml` — Maestro-Helper: Onboarding-Prompts überspringen
- `e2e/run-e2e.sh` — E2E-Runner (Seed, Plattform-Start/Stopp, Flows)
- `src/i18n/datenschutz-keys.test.ts` — Vollständigkeitstest der Datenschutz-i18n-Keys
- `.env.example` — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_DATA_SOURCE`

**Geändert (apps/mobile):**
- `src/app-providers.tsx` — WP-APP-3-Provider-Baum erweitert: `PersistQueryClientProvider`, `createDataSource()`, `AppLockGate`, `OfflineBanner`, Kanal-Setup (keine zweite Provider-Datei)
- `src/components/states.tsx` — WP-APP-3-`OfflineBanner` durch Re-Export der netzwerkgesteuerten Komponente ersetzt (Test mitgezogen)
- `app/_layout.tsx` — 401-Umleitung (`onSessionExpired`) und `useOnboardingPrompts` verdrahtet (`AppProviders` umschließt den Baum bereits seit WP-APP-3)
- `app.json` — `android.allowBackup:false`, Plugins expo-secure-store/-local-authentication/-notifications
- `src/i18n/locales/de.json` — Keys `offline.*`, `appLock.*`, `push.*`, `documents.*`, `common.dataStand`, `datenschutz.*`
- `app/(tabs)/rechnungen/[invoiceId].tsx` — PDF-Aktion auf `DocumentOpenButton` umgestellt
- Support-/Präferenzen-Screens — Submit über `useRequireNetwork` geführt; Logout deregistriert Push

**Neu/geändert (Server + Repo):**
- `packages/database/prisma/schema.prisma` — neues Modell `PushDelivery` (+ Migration `push_delivery`)
- `apps/worker/src/push.ts` — Expo-Push-Sender (`createExpoPushSender`)
- `apps/worker/src/push.test.ts` — Unit-Test Sender
- `apps/worker/src/notification-push.ts` — Handler `notification.requested`: Übersetzung Producer-Payload → User-Notifications, Preferences-Check, Anti-Spam, Push
- `apps/worker/src/notification-push.itest.ts` — Integrationstests (Test-DB)
- `apps/worker/src/index.ts` — Handler-Registrierung
- `apps/worker/package.json` — Dependency zod
- `apps/platform/src/app/api/v1/app/documents/[id]/download/audit.itest.ts` — Audit-Verifikation Download
- `turbo.json` — globalEnv `EXPO_ACCESS_TOKEN`, `PUSH_DAILY_LIMIT`
- `docs/DSGVO/AVV-MATRIX.md` — Verantwortlicher/Auftragsverarbeiter-Matrix (DSGVO-Paket Teil 1)

---

## Task 1: HTTP-Client — fetch-Wrapper mit Fehler-Envelope, `x-app-version`, 401-Handling

**Files:**
- Create: `apps/mobile/src/data/api/http.ts`
- Create: `apps/mobile/src/lib/auth-events.ts`
- Test: `apps/mobile/src/data/api/http.test.ts`, `apps/mobile/src/lib/auth-events.test.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben** — `apps/mobile/src/data/api/http.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, createHttpClient, type HttpClientDeps } from "./http";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeDeps(fetchFn: HttpClientDeps["fetchFn"], onUnauthenticated = vi.fn()): HttpClientDeps {
  return {
    baseUrl: "https://app.example.test",
    appVersion: "1.2.3",
    getCookie: () => "ph360.session=abc",
    onUnauthenticated,
    fetchFn,
  };
}

describe("createHttpClient", () => {
  it("sendet x-app-version + Cookie und parst die Antwort gegen das Schema", async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://app.example.test/api/v1/app/me");
      const headers = init?.headers as Record<string, string>;
      expect(headers["x-app-version"]).toBe("1.2.3");
      expect(headers.cookie).toBe("ph360.session=abc");
      return jsonResponse(200, { ok: true });
    });
    const client = createHttpClient(makeDeps(fetchFn));
    const out = await client.request("/api/v1/app/me", z.object({ ok: z.boolean() }));
    expect(out).toEqual({ ok: true });
  });

  it("baut Query-Parameter und lässt undefined weg", async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      expect(String(url)).toBe("https://app.example.test/x?resolution=day&from=2026-07-01");
      return jsonResponse(200, {});
    });
    const client = createHttpClient(makeDeps(fetchFn));
    await client.request("/x", z.object({}), {
      query: { resolution: "day", from: "2026-07-01", to: undefined },
    });
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("mappt den Fehler-Envelope auf ApiError", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(403, { error: { code: "FORBIDDEN", message: "Kein Zugriff", requestId: "r-1" } }),
    );
    const client = createHttpClient(makeDeps(fetchFn));
    const err = (await client.request("/x", z.unknown()).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.requestId).toBe("r-1");
  });

  it("ruft onUnauthenticated bei UNAUTHENTICATED/401 auf", async () => {
    const onUnauthenticated = vi.fn();
    const fetchFn = vi.fn(async () =>
      jsonResponse(401, { error: { code: "UNAUTHENTICATED", message: "Nicht angemeldet", requestId: "r-2" } }),
    );
    const client = createHttpClient(makeDeps(fetchFn, onUnauthenticated));
    const err = (await client.request("/x", z.unknown()).catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });

  it("wirft NETWORK bei fetch-Fehler und PARSE bei Schema-Verstoß", async () => {
    const offline = createHttpClient(
      makeDeps(vi.fn(async () => {
        throw new TypeError("Network request failed");
      })),
    );
    await expect(offline.request("/x", z.unknown())).rejects.toMatchObject({ code: "NETWORK" });

    const wrong = createHttpClient(makeDeps(vi.fn(async () => jsonResponse(200, { nope: 1 }))));
    await expect(wrong.request("/x", z.object({ ok: z.boolean() }))).rejects.toMatchObject({ code: "PARSE" });
  });

  it("requestVoid akzeptiert 204 ohne Body", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    const client = createHttpClient(makeDeps(fetchFn));
    await expect(client.requestVoid("/x", { method: "DELETE", body: { a: 1 } })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Test rot sehen** — `pnpm --filter @ph360/mobile exec vitest run src/data/api/http.test.ts` → erwartet: `Cannot find module './http'` (bzw. Resolve-Fehler), Exit ≠ 0.

- [ ] **Step 3: Implementierung** — `apps/mobile/src/data/api/http.ts`:

```ts
import type { z } from "zod";
import { errorEnvelopeSchema } from "@ph360/api-contracts";

/** Server-Codes (Spec §4.1) + Client-lokale Codes NETWORK/PARSE. */
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL"
  | "NETWORK"
  | "PARSE";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;
  readonly requestId: string | null;

  constructor(code: ApiErrorCode, message: string, status: number | null = null, requestId: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export interface RequestInitLite {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
}

export interface HttpClient {
  request<T>(path: string, schema: z.ZodType<T>, init?: RequestInitLite): Promise<T>;
  requestVoid(path: string, init?: RequestInitLite): Promise<void>;
}

export interface HttpClientDeps {
  baseUrl: string;
  appVersion: string;
  getCookie: () => string | null;
  onUnauthenticated: () => void;
  fetchFn?: typeof fetch;
}

const KNOWN_CODES: readonly string[] = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "RATE_LIMITED",
  "CONFLICT",
  "INTERNAL",
];

export function createHttpClient(deps: HttpClientDeps): HttpClient {
  const fetchFn = deps.fetchFn ?? fetch;

  async function toApiError(res: Response): Promise<ApiError> {
    let code: ApiErrorCode = "INTERNAL";
    let message = `HTTP ${res.status}`;
    let requestId: string | null = null;
    try {
      const parsed = errorEnvelopeSchema.safeParse(await res.json());
      if (parsed.success) {
        const c = parsed.data.error.code;
        code = KNOWN_CODES.includes(c) ? (c as ApiErrorCode) : "INTERNAL";
        message = parsed.data.error.message;
        requestId = parsed.data.error.requestId;
      }
    } catch {
      // Body leer/kein JSON — Status-Fallback unten.
    }
    if (res.status === 401) code = "UNAUTHENTICATED";
    if (code === "UNAUTHENTICATED") deps.onUnauthenticated();
    return new ApiError(code, message, res.status, requestId);
  }

  async function doFetch(path: string, init: RequestInitLite): Promise<Response> {
    const url = new URL(path, deps.baseUrl);
    for (const [k, v] of Object.entries(init.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
    const headers: Record<string, string> = {
      accept: "application/json",
      "x-app-version": deps.appVersion,
    };
    const cookie = deps.getCookie();
    if (cookie) headers.cookie = cookie;
    if (init.body !== undefined) headers["content-type"] = "application/json";

    let res: Response;
    try {
      res = await fetchFn(url.toString(), {
        method: init.method ?? "GET",
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch {
      throw new ApiError("NETWORK", "Keine Verbindung zum Server");
    }
    if (!res.ok) throw await toApiError(res);
    return res;
  }

  return {
    async request<T>(path: string, schema: z.ZodType<T>, init: RequestInitLite = {}): Promise<T> {
      const res = await doFetch(path, init);
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        throw new ApiError("PARSE", "Antwort ist kein JSON", res.status);
      }
      const parsed = schema.safeParse(json);
      if (!parsed.success) throw new ApiError("PARSE", parsed.error.message, res.status);
      return parsed.data;
    },
    async requestVoid(path: string, init: RequestInitLite = {}): Promise<void> {
      await doFetch(path, init);
    },
  };
}
```

Zusätzlich `apps/mobile/package.json`: `"@ph360/api-contracts": "workspace:*"` als Dependency ergänzen (falls WP-APP-3 sie noch nicht zieht): `pnpm --filter @ph360/mobile add "@ph360/api-contracts@workspace:*"`.

- [ ] **Step 4: Test grün** — `pnpm --filter @ph360/mobile exec vitest run src/data/api/http.test.ts` → erwartet: `Test Files  1 passed`, `Tests  6 passed`.

- [ ] **Step 5: Session-Expired-Eventbus (Test zuerst)** — `apps/mobile/src/lib/auth-events.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { emitSessionExpired, onSessionExpired } from "./auth-events";

describe("auth-events", () => {
  it("benachrichtigt Listener und erlaubt Abmeldung", () => {
    const cb = vi.fn();
    const off = onSessionExpired(cb);
    emitSessionExpired();
    expect(cb).toHaveBeenCalledOnce();
    off();
    emitSessionExpired();
    expect(cb).toHaveBeenCalledOnce();
  });
});
```

`apps/mobile/src/lib/auth-events.ts`:

```ts
type Listener = () => void;

const listeners = new Set<Listener>();

/** Wird vom HTTP-Client bei 401/UNAUTHENTICATED ausgelöst; Root-Layout leitet auf /login um. */
export function onSessionExpired(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitSessionExpired(): void {
  for (const cb of listeners) cb();
}
```

Rot sehen, dann grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/auth-events.test.ts` → `Tests  1 passed`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add apps/mobile/src/data/api/http.ts apps/mobile/src/data/api/http.test.ts apps/mobile/src/lib/auth-events.ts apps/mobile/src/lib/auth-events.test.ts apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): HTTP-Client mit Fehler-Envelope-Mapping, x-app-version und 401-Handling"
```

---

## Task 2: `ApiDataSource` gegen `/api/v1/app/*` + Mock/API-Umschaltung

**Files:**
- Create: `apps/mobile/src/data/api-data-source.ts`
- Create: `apps/mobile/src/data/create-data-source.ts`
- Create: `apps/mobile/.env.example`
- Test: `apps/mobile/src/data/api-data-source.test.ts`

Erwartetes `DataSource`-Interface (WP-APP-3, `src/data/data-source.ts`) — bei Namensabweichung dort nachsehen und hier exakt spiegeln:

```ts
getMe(): Promise<MeResponse>
getSummary(contextId: string): Promise<SummaryResponse>
getConsumption(contextId: string, q: ConsumptionQuery): Promise<ConsumptionResponse>
getDataStatus(contextId: string): Promise<DataStatusResponse>
getInvoices(contextId: string, cursor?: string): Promise<InvoiceListResponse>
getInvoice(contextId: string, invoiceId: string): Promise<InvoiceDetailResponse>
getDocumentDownloadUrl(documentId: string): Promise<DocumentDownloadResponse>
getContract(contextId: string): Promise<ContractResponse>
getNotificationPreferences(): Promise<NotificationPreferencesResponse>
updateNotificationPreferences(input: NotificationPreferenceUpdate): Promise<NotificationPreferencesResponse>
registerPushDevice(input: PushDeviceCreate): Promise<void>
unregisterPushDevice(expoPushToken: string): Promise<void>
createSupportMessage(input: SupportMessageCreate): Promise<void>
getConfig(): Promise<ConfigResponse>
```

Die Response-Typen (`MeResponse`, …, `ConfigResponse`) sind WP-APP-2-Task-3-Exporte. Die drei Input-Typen exportiert WP-APP-2 NICHT als Typen — sie werden aus den kanonischen Schemas (`src/app/settings.ts`) abgeleitet: `NotificationPreferenceUpdate = z.infer<typeof notificationPreferencePutSchema>` (Shape `{category, enabled}` — PUT nimmt GENAU EINE Kategorie, kein `preferences`-Array), `PushDeviceCreate = z.infer<typeof pushDeviceCreateSchema>`, `SupportMessageCreate = z.infer<typeof supportMessageCreateSchema>`.

- [ ] **Step 1: Fehlschlagenden Test schreiben** — `apps/mobile/src/data/api-data-source.test.ts` (fake `HttpClient`, prüft Pfade/Methoden/Query — Schema-Inhalte prüft der Contract selbst):

```ts
import { describe, expect, it, vi } from "vitest";
import type { HttpClient, RequestInitLite } from "./api/http";
import { createApiDataSource } from "./api-data-source";

interface Call {
  path: string;
  init: RequestInitLite;
  kind: "request" | "requestVoid";
}

function makeHttp(): { http: HttpClient; calls: Call[] } {
  const calls: Call[] = [];
  const http: HttpClient = {
    request: vi.fn(async (path: string, _schema: unknown, init: RequestInitLite = {}) => {
      calls.push({ path, init, kind: "request" });
      return {} as never;
    }) as HttpClient["request"],
    requestVoid: vi.fn(async (path: string, init: RequestInitLite = {}) => {
      calls.push({ path, init, kind: "requestVoid" });
    }),
  };
  return { http, calls };
}

describe("createApiDataSource", () => {
  it("ruft die App-Endpunkte mit korrekten Pfaden auf", async () => {
    const { http, calls } = makeHttp();
    const ds = createApiDataSource(http);

    await ds.getMe();
    await ds.getSummary("p-1");
    await ds.getConsumption("p-1", { resolution: "day", from: "2026-07-01", to: "2026-07-22" });
    await ds.getInvoice("p-1", "inv-1");
    await ds.getDocumentDownloadUrl("doc-1");
    await ds.getConfig();

    expect(calls.map((c) => c.path)).toEqual([
      "/api/v1/app/me",
      "/api/v1/app/contexts/p-1/summary",
      "/api/v1/app/contexts/p-1/consumption",
      "/api/v1/app/contexts/p-1/invoices/inv-1",
      "/api/v1/app/documents/doc-1/download",
      "/api/v1/app/config",
    ]);
    expect(calls[2]?.init.query).toEqual({ resolution: "day", from: "2026-07-01", to: "2026-07-22" });
  });

  it("nutzt PUT/POST/DELETE für schreibende Endpunkte", async () => {
    const { http, calls } = makeHttp();
    const ds = createApiDataSource(http);

    await ds.updateNotificationPreferences({ category: "BILLING", enabled: false } as never);
    await ds.registerPushDevice({ expoPushToken: "t", platform: "ios", appVersion: "1.0.0" } as never);
    await ds.unregisterPushDevice("t");
    await ds.createSupportMessage({ subject: "s", body: "b" } as never);

    expect(calls[0]).toMatchObject({ path: "/api/v1/app/notification-preferences", init: { method: "PUT" } });
    expect(calls[1]).toMatchObject({ path: "/api/v1/app/push-devices", init: { method: "POST" }, kind: "requestVoid" });
    expect(calls[2]).toMatchObject({
      path: "/api/v1/app/push-devices",
      init: { method: "DELETE", body: { expoPushToken: "t" } },
      kind: "requestVoid",
    });
    expect(calls[3]).toMatchObject({ path: "/api/v1/app/support/messages", init: { method: "POST" }, kind: "requestVoid" });
  });
});
```

- [ ] **Step 2: Test rot sehen** — `pnpm --filter @ph360/mobile exec vitest run src/data/api-data-source.test.ts` → Resolve-Fehler `api-data-source`.

- [ ] **Step 3: Implementierung** — `apps/mobile/src/data/api-data-source.ts`:

```ts
import {
  configResponseSchema,
  consumptionResponseSchema,
  contractResponseSchema,
  dataStatusResponseSchema,
  documentDownloadResponseSchema,
  invoiceDetailResponseSchema,
  invoiceListResponseSchema,
  meResponseSchema,
  notificationPreferencePutSchema,
  notificationPreferencesResponseSchema,
  pushDeviceCreateSchema,
  summaryResponseSchema,
  supportMessageCreateSchema,
} from "@ph360/api-contracts";
import type { ConsumptionQuery } from "@ph360/api-contracts";
import type { z } from "zod";
import type { HttpClient } from "./api/http";
import type { DataSource } from "./data-source";

/** Input-Typen lokal aus den kanonischen Schemas abgeleitet — WP-APP-2 Task 3 exportiert hierfür keine Typ-Aliase. */
type NotificationPreferenceUpdate = z.infer<typeof notificationPreferencePutSchema>;
type PushDeviceCreate = z.infer<typeof pushDeviceCreateSchema>;
type SupportMessageCreate = z.infer<typeof supportMessageCreateSchema>;

/** Echte API-Anbindung — gleiche Typen wie MockDataSource (Spec §2.3 Nr. 4). */
export function createApiDataSource(http: HttpClient): DataSource {
  return {
    getMe: () => http.request("/api/v1/app/me", meResponseSchema),
    getSummary: (contextId: string) =>
      http.request(`/api/v1/app/contexts/${contextId}/summary`, summaryResponseSchema),
    getConsumption: (contextId: string, q: ConsumptionQuery) =>
      http.request(`/api/v1/app/contexts/${contextId}/consumption`, consumptionResponseSchema, {
        query: { resolution: q.resolution, from: q.from, to: q.to },
      }),
    getDataStatus: (contextId: string) =>
      http.request(`/api/v1/app/contexts/${contextId}/data-status`, dataStatusResponseSchema),
    getInvoices: (contextId: string, cursor?: string) =>
      http.request(`/api/v1/app/contexts/${contextId}/invoices`, invoiceListResponseSchema, {
        query: { cursor },
      }),
    getInvoice: (contextId: string, invoiceId: string) =>
      http.request(`/api/v1/app/contexts/${contextId}/invoices/${invoiceId}`, invoiceDetailResponseSchema),
    getDocumentDownloadUrl: (documentId: string) =>
      http.request(`/api/v1/app/documents/${documentId}/download`, documentDownloadResponseSchema),
    getContract: (contextId: string) =>
      http.request(`/api/v1/app/contexts/${contextId}/contract`, contractResponseSchema),
    getNotificationPreferences: () =>
      http.request("/api/v1/app/notification-preferences", notificationPreferencesResponseSchema),
    updateNotificationPreferences: (input: NotificationPreferenceUpdate) =>
      http.request("/api/v1/app/notification-preferences", notificationPreferencesResponseSchema, {
        method: "PUT",
        body: input,
      }),
    registerPushDevice: (input: PushDeviceCreate) =>
      http.requestVoid("/api/v1/app/push-devices", { method: "POST", body: input }),
    unregisterPushDevice: (expoPushToken: string) =>
      http.requestVoid("/api/v1/app/push-devices", { method: "DELETE", body: { expoPushToken } }),
    createSupportMessage: (input: SupportMessageCreate) =>
      http.requestVoid("/api/v1/app/support/messages", { method: "POST", body: input }),
    getConfig: () => http.request("/api/v1/app/config", configResponseSchema),
  };
}
```

- [ ] **Step 4: Test grün** — `pnpm --filter @ph360/mobile exec vitest run src/data/api-data-source.test.ts` → `Tests  2 passed`.

- [ ] **Step 5: Umschaltung Mock/API** — `apps/mobile/src/data/create-data-source.ts` (kein Unit-Test: reine Verdrahtung nativer Module; wird durch Maestro-E2E abgedeckt):

```ts
import Constants from "expo-constants";
import { authClient } from "../lib/auth-client";
import { emitSessionExpired } from "../lib/auth-events";
import { createApiDataSource } from "./api-data-source";
import { createHttpClient } from "./api/http";
import type { DataSource } from "./data-source";
import { createMockDataSource } from "./mock-data-source";

/** EXPO_PUBLIC_DATA_SOURCE=mock erhält die WP-APP-3-Demo-Fähigkeit; Default ist die echte API. */
export function createDataSource(): DataSource {
  if (process.env.EXPO_PUBLIC_DATA_SOURCE === "mock") return createMockDataSource();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3100";
  const http = createHttpClient({
    baseUrl,
    appVersion: Constants.expoConfig?.version ?? "0.0.0",
    getCookie: () => authClient.getCookie(),
    onUnauthenticated: () => emitSessionExpired(),
  });
  return createApiDataSource(http);
}
```

`apps/mobile/.env.example`:

```bash
# Basis-URL der Plattform-API (Simulator: localhost; Gerät: LAN-IP des Dev-Rechners; Staging: https://app.powerhouse360.de)
EXPO_PUBLIC_API_URL=http://localhost:3100
# "api" (Default) oder "mock" (WP-APP-3-Demo ohne Server)
EXPO_PUBLIC_DATA_SOURCE=api
```

- [ ] **Step 6: Typecheck + Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/data/api-data-source.ts apps/mobile/src/data/api-data-source.test.ts apps/mobile/src/data/create-data-source.ts apps/mobile/.env.example
git commit -m "feat(mobile): ApiDataSource gegen /api/v1/app/* mit Mock/API-Umschaltung"
```

---

## Task 3: Verschlüsselte Query-Persistenz + Datenstand-UI + Provider-Baum

**Files:**
- Create: `apps/mobile/src/lib/cache/cache-key.ts`, `apps/mobile/src/lib/cache/persister.ts`, `apps/mobile/src/lib/storage/app-storage.ts`, `apps/mobile/src/lib/cache/query-persistence.ts`, `apps/mobile/src/lib/cache/data-stand.ts`, `apps/mobile/src/components/data-stand-badge.tsx`
- Modify: `apps/mobile/src/app-providers.tsx` (bestehende WP-APP-3-Datei), `apps/mobile/app/_layout.tsx`, `apps/mobile/src/i18n/locales/de.json`
- Test: `apps/mobile/src/lib/cache/cache-key.test.ts`, `apps/mobile/src/lib/cache/persister.test.ts`, `apps/mobile/src/lib/cache/data-stand.test.ts`

- [ ] **Step 1: Pakete installieren**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/mobile exec npx expo install react-native-mmkv expo-crypto expo-secure-store expo-network expo-local-authentication expo-notifications expo-file-system expo-sharing
pnpm --filter @ph360/mobile add @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister
```

Erwartet: Pakete in `apps/mobile/package.json`, Lockfile aktualisiert. (expo-secure-store kann durch WP-APP-3 bereits vorhanden sein — `expo install` ist idempotent.)

- [ ] **Step 2: Fehlschlagende Tests Schlüssel-Logik** — `apps/mobile/src/lib/cache/cache-key.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bytesToHex, getOrCreateCacheEncryptionKey, type SecureKV } from "./cache-key";

function memoryStore(initial: Record<string, string> = {}): SecureKV & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItemAsync: async (k) => data[k] ?? null,
    setItemAsync: async (k, v) => {
      data[k] = v;
    },
  };
}

const fakeRandom = (n: number) => new Uint8Array(Array.from({ length: n }, (_, i) => i));

describe("getOrCreateCacheEncryptionKey", () => {
  it("erzeugt einen 64-stelligen Hex-Schlüssel und legt ihn im SecureStore ab", async () => {
    const store = memoryStore();
    const key = await getOrCreateCacheEncryptionKey(store, fakeRandom);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.values(store.data)).toContain(key);
  });

  it("verwendet einen vorhandenen Schlüssel wieder", async () => {
    const store = memoryStore();
    const first = await getOrCreateCacheEncryptionKey(store, fakeRandom);
    const second = await getOrCreateCacheEncryptionKey(store, () => {
      throw new Error("darf nicht neu erzeugen");
    });
    expect(second).toBe(first);
  });

  it("bytesToHex kodiert korrekt", () => {
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
  });
});
```

Rot sehen: `pnpm --filter @ph360/mobile exec vitest run src/lib/cache/cache-key.test.ts` → Resolve-Fehler.

- [ ] **Step 3: Implementierung Schlüssel-Logik** — `apps/mobile/src/lib/cache/cache-key.ts`:

```ts
export interface SecureKV {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

export const CACHE_KEY_NAME = "ph360.cache-encryption-key";

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * MMKV-Verschlüsselungsschlüssel: 32 Zufallsbytes, hex-kodiert, abgelegt im
 * iOS Keychain / Android Keystore (expo-secure-store). Spec §7.1: Offline-Cache
 * verschlüsselt, Schlüssel im Keychain/Keystore.
 */
export async function getOrCreateCacheEncryptionKey(
  store: SecureKV,
  randomBytes: (n: number) => Uint8Array,
): Promise<string> {
  const existing = await store.getItemAsync(CACHE_KEY_NAME);
  if (existing) return existing;
  const key = bytesToHex(randomBytes(32));
  await store.setItemAsync(CACHE_KEY_NAME, key);
  return key;
}
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/cache/cache-key.test.ts` → `Tests  3 passed`.

- [ ] **Step 4: Fehlschlagender Persister-Roundtrip-Test** — `apps/mobile/src/lib/cache/persister.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CACHE_STORAGE_KEY, createMmkvPersister, type StringStorage } from "./persister";

function mapStorage(): StringStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
    delete: (k) => {
      map.delete(k);
    },
  };
}

const persistedClient = {
  buster: "1.0.0",
  timestamp: 1_753_180_000_000,
  clientState: { mutations: [], queries: [] },
};

describe("createMmkvPersister", () => {
  it("persistiert und restauriert den Query-Client-Zustand", async () => {
    const storage = mapStorage();
    const persister = createMmkvPersister(storage, 0);
    await persister.persistClient(persistedClient);
    expect(storage.map.has(CACHE_STORAGE_KEY)).toBe(true);
    const restored = await persister.restoreClient();
    expect(restored).toEqual(persistedClient);
  });

  it("removeClient löscht den Eintrag", async () => {
    const storage = mapStorage();
    const persister = createMmkvPersister(storage, 0);
    await persister.persistClient(persistedClient);
    await persister.removeClient();
    expect(storage.map.has(CACHE_STORAGE_KEY)).toBe(false);
  });
});
```

Rot sehen: `pnpm --filter @ph360/mobile exec vitest run src/lib/cache/persister.test.ts`.

- [ ] **Step 5: Implementierung Persister** — `apps/mobile/src/lib/cache/persister.ts`:

```ts
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";

/** Schnittmenge der react-native-mmkv-API, die wir brauchen (testbar via Map-Stub). */
export interface StringStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export const CACHE_STORAGE_KEY = "ph360.query-cache";

export function createMmkvPersister(storage: StringStorage, throttleTime = 1000): Persister {
  return createSyncStoragePersister({
    key: CACHE_STORAGE_KEY,
    throttleTime,
    storage: {
      getItem: (k) => storage.getString(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    },
  });
}
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/cache/persister.test.ts` → `Tests  2 passed`.

- [ ] **Step 6: Native Verdrahtung (App-Storage-Singleton + Persister)** — `apps/mobile/src/lib/storage/app-storage.ts`:

```ts
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";
import { getOrCreateCacheEncryptionKey } from "../cache/cache-key";

let instance: MMKV | null = null;

/** Eine verschlüsselte MMKV-Instanz für Query-Cache und Dokument-Index. */
export async function getAppStorage(): Promise<MMKV> {
  if (!instance) {
    const key = await getOrCreateCacheEncryptionKey(SecureStore, (n) => Crypto.getRandomBytes(n));
    instance = new MMKV({ id: "ph360-app", encryptionKey: key });
  }
  return instance;
}
```

`apps/mobile/src/lib/cache/query-persistence.ts`:

```ts
import type { Persister } from "@tanstack/react-query-persist-client";
import { getAppStorage } from "../storage/app-storage";
import { createMmkvPersister } from "./persister";

export async function createEncryptedPersister(): Promise<Persister> {
  const storage = await getAppStorage();
  return createMmkvPersister(storage);
}
```

- [ ] **Step 7: Fehlschlagender Datenstand-Test** — `apps/mobile/src/lib/cache/data-stand.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatDataStandTime } from "./data-stand";

describe("formatDataStandTime", () => {
  const now = new Date(2026, 6, 22, 15, 0); // 22.07.2026 15:00 lokal

  it("zeigt am selben Tag nur die Uhrzeit", () => {
    const at = new Date(2026, 6, 22, 14, 32).getTime();
    expect(formatDataStandTime(at, now)).toBe("14:32");
  });

  it("zeigt an anderen Tagen Datum + Uhrzeit", () => {
    const at = new Date(2026, 6, 21, 9, 5).getTime();
    expect(formatDataStandTime(at, now)).toBe("21.07. 09:05");
  });

  it("liefert null ohne Zeitstempel", () => {
    expect(formatDataStandTime(0, now)).toBeNull();
  });
});
```

Rot sehen: `pnpm --filter @ph360/mobile exec vitest run src/lib/cache/data-stand.test.ts`.

- [ ] **Step 8: Implementierung Datenstand** — `apps/mobile/src/lib/cache/data-stand.ts`:

```ts
/**
 * Formatiert `dataUpdatedAt` einer Query (auch aus dem restaurierten Cache) für
 * die Datenstand-Anzeige („Stand 14:32“, Spec §7.3 Nr. 3). 0 = nie geladen.
 */
export function formatDataStandTime(dataUpdatedAt: number, now: Date = new Date()): string | null {
  if (!dataUpdatedAt) return null;
  const d = new Date(dataUpdatedAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return `${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mo}. ${hh}:${mm}`;
}
```

`apps/mobile/src/components/data-stand-badge.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import { formatDataStandTime } from "../lib/cache/data-stand";

/** Badge „Stand 14:32“ — speist sich aus query.dataUpdatedAt (funktioniert offline aus dem Cache). */
export function DataStandBadge({ dataUpdatedAt }: { dataUpdatedAt: number }) {
  const { t } = useTranslation();
  const time = formatDataStandTime(dataUpdatedAt);
  if (!time) return null;
  const label = t("common.dataStand", { time });
  return (
    <Text style={styles.badge} accessibilityLabel={label}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: { fontSize: 12, opacity: 0.7 },
});
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/cache/data-stand.test.ts` → `Tests  3 passed`.

- [ ] **Step 9: Provider-Baum umbauen (Modify, keine zweite Provider-Datei)** — WP-APP-3 baut die komplette Provider-Komposition bereits in `apps/mobile/src/app-providers.tsx` (Theme, i18n, Query, DataSource, Session, ActiveContext). Diese Datei wird ERWEITERT — es entsteht KEINE neue Datei `src/providers/app-providers.tsx`. Den Inhalt von `apps/mobile/src/app-providers.tsx` vollständig durch folgende Fassung ersetzen (WP-APP-3-Struktur und der Test-Vertrag „injizierbare `dataSource`“ bleiben erhalten; Import-Pfade von `DataSourceProvider`/`MockDataSource`/`ThemeProvider` etc. bei Abweichung an den WP-APP-3-Ist-Stand anpassen — Abweichungsregel):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import Constants from "expo-constants";
import { useEffect, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { createDataSource } from "./data/create-data-source";
import type { DataSource } from "./data/data-source";
import { DataSourceProvider } from "./data/data-source-provider";
import { initI18n } from "./i18n";
import { AppLockGate } from "./lib/app-lock/app-lock-gate";
import { createEncryptedPersister } from "./lib/cache/query-persistence";
import { OfflineBanner } from "./lib/network/offline-banner";
import { useWireOnlineManager } from "./lib/network/wire-online-manager";
import { ActiveContextProvider } from "./state/ActiveContextProvider";
import { SessionProvider } from "./state/SessionProvider";
import { ThemeProvider } from "./theme/ThemeProvider";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Eine Komposition für App UND Tests (WP-APP-3-Vertrag). Tests injizieren
 * `dataSource` — dann wird OHNE native Schichten gerendert (kein MMKV-Persist,
 * kein AppLockGate/OfflineBanner), damit Vitest ohne RN-Runtime läuft.
 */
export function AppProviders({ children, dataSource }: { children: ReactNode; dataSource?: DataSource }) {
  const isTest = dataSource !== undefined;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // gcTime >= maxAge, sonst wird der restaurierte Cache sofort verworfen.
        defaultOptions: { queries: { staleTime: 60_000, gcTime: WEEK_MS, retry: isTest ? false : 1 } },
      }),
  );
  const [ds] = useState<DataSource>(() => dataSource ?? createDataSource());
  const [persister, setPersister] = useState<Persister | null>(null);
  useEffect(() => {
    if (!isTest) void createEncryptedPersister().then(setPersister);
  }, [isTest]);

  const inner = (
    <DataSourceProvider dataSource={ds}>
      <SessionProvider>
        <ActiveContextProvider>
          {isTest ? (
            children
          ) : (
            <>
              <OfflineBanner />
              <AppLockGate>{children}</AppLockGate>
            </>
          )}
        </ActiveContextProvider>
      </SessionProvider>
    </DataSourceProvider>
  );

  if (isTest) {
    return (
      <I18nextProvider i18n={initI18n()}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>{inner}</QueryClientProvider>
        </ThemeProvider>
      </I18nextProvider>
    );
  }

  if (!persister) return null; // Hydration-Gate: erst rendern, wenn der Cache restaurierbar ist
  return (
    <I18nextProvider i18n={initI18n()}>
      <ThemeProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: WEEK_MS, buster: Constants.expoConfig?.version ?? "0" }}
        >
          <NetworkWiring>{inner}</NetworkWiring>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

/** Eigene Komponente, damit useWireOnlineManager unterhalb des Query-Providers läuft. */
function NetworkWiring({ children }: { children: ReactNode }) {
  useWireOnlineManager();
  return <>{children}</>;
}
```

Hinweis: `AppLockGate` und `OfflineBanner`/`useWireOnlineManager` entstehen in Task 4/5 — bis dahin kompiliert dieser Schritt nicht standalone; Tasks 3–5 werden vor dem ersten App-Start gemeinsam abgeschlossen. Wer strikt sequenziell arbeitet, lässt die drei Imports + Verwendungen (`OfflineBanner`, `AppLockGate`, `NetworkWiring`/`useWireOnlineManager`) hier zunächst weg und ergänzt sie in Task 4/5 (jeweils dort als Modify-Schritt aufgeführt).

**Modify `apps/mobile/app/_layout.tsx`:** KEIN Provider-Tausch nötig — das Root-Layout umschließt den Navigations-Baum bereits seit WP-APP-3 mit `<AppProviders>`. NUR die 401-Umleitung ergänzen (Rest unverändert):

```tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { onSessionExpired } from "../src/lib/auth-events";

// innerhalb der Root-Layout-Komponente:
const router = useRouter();
useEffect(() => onSessionExpired(() => router.replace("/login")), [router]);
```

- [ ] **Step 10: Datenstand-Badge in Übersicht/Verbrauch anbinden** — In den WP-APP-3-Screens Übersicht und Verbrauch das bisherige (Mock-)Datenstand-Element durch `<DataStandBadge dataUpdatedAt={summaryQuery.dataUpdatedAt} />` bzw. `<DataStandBadge dataUpdatedAt={consumptionQuery.dataUpdatedAt} />` ersetzen (`dataUpdatedAt` liefert `useQuery` — nach Persist-Restore der Zeitstempel des Cache-Stands).

`apps/mobile/src/i18n/locales/de.json` ergänzen (im bestehenden Wurzelobjekt):

```json
{
  "common": {
    "dataStand": "Stand {{time}}"
  }
}
```

- [ ] **Step 11: Alle Mobile-Unit-Tests + Typecheck grün**

```bash
pnpm --filter @ph360/mobile exec vitest run
pnpm --filter @ph360/mobile typecheck
```

Erwartet: alle bisherigen + neuen Tests grün (mind. `cache-key` 3, `persister` 2, `data-stand` 3, Task-1/2-Tests). Typecheck schlägt erst nach Abschluss von Task 4/5 vollständig durch (siehe Hinweis Step 9) — dann erneut ausführen.

- [ ] **Step 12: Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add apps/mobile/src/lib/cache apps/mobile/src/lib/storage apps/mobile/src/components/data-stand-badge.tsx apps/mobile/src/app-providers.tsx apps/mobile/app/_layout.tsx apps/mobile/src/i18n/locales/de.json apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): verschlüsselte TanStack-Query-Persistenz (MMKV+SecureStore) und Datenstand-UI"
```

---

## Task 4: Offline-Status — onlineManager, Banner, „Aktion braucht Netz“

**Files:**
- Create: `apps/mobile/src/lib/network/is-offline.ts`, `apps/mobile/src/lib/network/wire-online-manager.ts`, `apps/mobile/src/lib/network/offline-banner.tsx`, `apps/mobile/src/lib/network/use-require-network.ts`
- Modify: `apps/mobile/src/i18n/locales/de.json`, `apps/mobile/src/components/states.tsx` (+ zugehöriger Test), Support-Screen + Präferenzen-Screen (WP-APP-3-Pfade, z. B. `app/(tabs)/mehr/support.tsx`, `app/(tabs)/mehr/benachrichtigungen.tsx`)
- Test: `apps/mobile/src/lib/network/is-offline.test.ts`

- [ ] **Step 1: Fehlschlagender Test** — `apps/mobile/src/lib/network/is-offline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isOffline } from "./is-offline";

describe("isOffline", () => {
  it("ist offline, wenn keine Verbindung besteht", () => {
    expect(isOffline({ isConnected: false, isInternetReachable: null })).toBe(true);
  });
  it("ist offline, wenn Internet nicht erreichbar ist", () => {
    expect(isOffline({ isConnected: true, isInternetReachable: false })).toBe(true);
  });
  it("ist online bei Verbindung mit erreichbarem Internet", () => {
    expect(isOffline({ isConnected: true, isInternetReachable: true })).toBe(false);
  });
  it("behandelt unbekannten Zustand (null/undefined) als online", () => {
    expect(isOffline({ isConnected: null, isInternetReachable: null })).toBe(false);
    expect(isOffline(undefined)).toBe(false);
    expect(isOffline(null)).toBe(false);
  });
});
```

Rot: `pnpm --filter @ph360/mobile exec vitest run src/lib/network/is-offline.test.ts`.

- [ ] **Step 2: Implementierung** — `apps/mobile/src/lib/network/is-offline.ts`:

```ts
export interface NetState {
  isConnected: boolean | null | undefined;
  isInternetReachable: boolean | null | undefined;
}

/** Nur explizit negative Signale gelten als offline — unbekannt (null) blockiert die App nicht. */
export function isOffline(state: NetState | null | undefined): boolean {
  if (!state) return false;
  return state.isConnected === false || state.isInternetReachable === false;
}
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/network/is-offline.test.ts` → `Tests  4 passed`.

- [ ] **Step 3: onlineManager-Verdrahtung + Banner** — `apps/mobile/src/lib/network/wire-online-manager.ts`:

```ts
import { onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { useEffect } from "react";
import { isOffline } from "./is-offline";

/** TanStack pausiert Requests, solange offline; Refetch bei Rückkehr des Netzes. */
export function useWireOnlineManager(): void {
  useEffect(() => {
    const sub = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(!isOffline(state));
    });
    return () => sub.remove();
  }, []);
}
```

`apps/mobile/src/lib/network/offline-banner.tsx`:

```tsx
import { useNetworkState } from "expo-network";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { isOffline } from "./is-offline";

export function OfflineBanner() {
  const state = useNetworkState();
  const { t } = useTranslation();
  if (!isOffline(state)) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" testID="offline-banner">
      <Text style={styles.text}>{t("offline.banner")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: "#F5BE75", paddingVertical: 6, paddingHorizontal: 16 },
  text: { color: "#0D1626", fontSize: 13, textAlign: "center" },
});
```

`apps/mobile/src/lib/network/use-require-network.ts`:

```tsx
import { useNetworkState } from "expo-network";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { isOffline } from "./is-offline";

/**
 * Spec §7.3 Nr. 7: Aktionen (Support, Präferenzen, Aktualisieren) werden offline
 * nicht gequeued, sondern mit klarem Hinweis abgelehnt.
 */
export function useRequireNetwork(): (action: () => void) => void {
  const state = useNetworkState();
  const { t } = useTranslation();
  return (action) => {
    if (isOffline(state)) {
      Alert.alert(t("offline.actionTitle"), t("offline.actionNeedsNetwork"));
      return;
    }
    action();
  };
}
```

- [ ] **Step 4: i18n + Screen-Anbindung** — `de.json` ergänzen:

```json
{
  "offline": {
    "banner": "Offline – Sie sehen zuletzt geladene Daten",
    "actionTitle": "Keine Verbindung",
    "actionNeedsNetwork": "Diese Aktion benötigt eine Internetverbindung. Bitte versuchen Sie es später erneut."
  }
}
```

In den WP-APP-3-Screens Support und Benachrichtigungs-Präferenzen den Submit-Handler wrappen:

```tsx
const requireNetwork = useRequireNetwork();
// statt: onPress={submit}
onPress={() => requireNetwork(submit)}
```

Falls Task 3/Step 9 die Imports zurückgestellt hatte: jetzt `OfflineBanner` + `NetworkWiring`/`useWireOnlineManager` in `src/app-providers.tsx` aktivieren.

**OfflineBanner deduplizieren (verbindlich — nach diesem Task existiert genau EINE Komponente):** In `apps/mobile/src/components/states.tsx` die WP-APP-3-Implementierung von `OfflineBanner` vollständig entfernen und durch einen Re-Export der neuen netzwerkgesteuerten Komponente ersetzen; `LoadingView`/`EmptyView`/`ErrorView` bleiben unverändert:

```tsx
export { OfflineBanner } from "../lib/network/offline-banner";
```

Den bestehenden WP-APP-3-Test zu `states.tsx` mitziehen: Der `OfflineBanner`-Testfall mockt `expo-network` (`vi.mock("expo-network", () => ({ useNetworkState: () => ({ isConnected: false, isInternetReachable: false }) }))`) und erwartet den Text aus `offline.banner`; ergänzend ein Fall mit Online-State (`isConnected: true, isInternetReachable: true`), der erwartet, dass nichts gerendert wird (`queryByTestId("offline-banner")` ist `null`).

- [ ] **Step 5: Tests + Typecheck, Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/mobile exec vitest run src/lib/network src/components
git add apps/mobile/src/lib/network apps/mobile/src/components apps/mobile/src/i18n/locales/de.json apps/mobile/app apps/mobile/src/app-providers.tsx
git commit -m "feat(mobile): Offline-Banner (dedupliziert), onlineManager-Kopplung und Netz-Pflicht-Hinweis für Aktionen"
```

---

## Task 5: Biometrie-App-Lock (Opt-in nach Login, Gate beim App-Resume)

**Files:**
- Create: `apps/mobile/src/lib/app-lock/app-lock.ts`, `apps/mobile/src/lib/app-lock/deps.ts`, `apps/mobile/src/lib/app-lock/lock-screen.tsx`, `apps/mobile/src/lib/app-lock/app-lock-gate.tsx`, `apps/mobile/src/lib/onboarding/use-onboarding-prompts.ts`, `apps/mobile/app/biometrie.tsx`
- Modify: `apps/mobile/app/_layout.tsx` (Onboarding-Hook), `apps/mobile/src/i18n/locales/de.json`, `apps/mobile/app.json` (Plugin + FaceID-Text), Einstellungs-Screen „Mehr“ (Toggle)
- Test: `apps/mobile/src/lib/app-lock/app-lock.test.ts`

- [ ] **Step 1: Fehlschlagender Test Zustandsmaschine** — `apps/mobile/src/lib/app-lock/app-lock.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AppLock, type AppLockDeps } from "./app-lock";

function makeDeps(overrides: Partial<AppLockDeps> = {}): AppLockDeps & { flag: { value: boolean } } {
  const flag = { value: false };
  return {
    flag,
    isFlagSet: async () => flag.value,
    setFlag: async (enabled) => {
      flag.value = enabled;
    },
    canUseBiometrics: async () => true,
    authenticate: async () => true,
    ...overrides,
  };
}

describe("AppLock", () => {
  it("startet disabled ohne Opt-in und locked mit Opt-in", async () => {
    const off = new AppLock(makeDeps());
    expect(await off.init()).toBe("disabled");

    const deps = makeDeps();
    deps.flag.value = true;
    const on = new AppLock(deps);
    expect(await on.init()).toBe("locked");
  });

  it("enable authentifiziert, setzt das Flag und entsperrt", async () => {
    const deps = makeDeps();
    const lock = new AppLock(deps);
    await lock.init();
    expect(await lock.enable()).toBe(true);
    expect(deps.flag.value).toBe(true);
    expect(lock.getPhase()).toBe("unlocked");
  });

  it("enable scheitert ohne Biometrie-Hardware/Enrollment", async () => {
    const lock = new AppLock(makeDeps({ canUseBiometrics: async () => false }));
    await lock.init();
    expect(await lock.enable()).toBe(false);
    expect(lock.getPhase()).toBe("disabled");
  });

  it("Background sperrt nur bei aktiviertem Lock; unlock entsperrt bei Erfolg", async () => {
    const deps = makeDeps();
    deps.flag.value = true;
    const lock = new AppLock(deps);
    await lock.init();
    expect(await lock.unlock()).toBe(true);
    expect(lock.getPhase()).toBe("unlocked");
    lock.onBackground();
    expect(lock.getPhase()).toBe("locked");
  });

  it("unlock bleibt bei Fehlschlag gesperrt", async () => {
    const deps = makeDeps({ authenticate: async () => false });
    deps.flag.value = true;
    const lock = new AppLock(deps);
    await lock.init();
    expect(await lock.unlock()).toBe(false);
    expect(lock.getPhase()).toBe("locked");
  });

  it("disable löscht Flag und deaktiviert das Gate", async () => {
    const deps = makeDeps();
    deps.flag.value = true;
    const lock = new AppLock(deps);
    await lock.init();
    await lock.unlock();
    await lock.disable();
    expect(deps.flag.value).toBe(false);
    lock.onBackground();
    expect(lock.getPhase()).toBe("disabled");
  });
});
```

Rot: `pnpm --filter @ph360/mobile exec vitest run src/lib/app-lock/app-lock.test.ts`.

- [ ] **Step 2: Implementierung Zustandsmaschine** — `apps/mobile/src/lib/app-lock/app-lock.ts`:

```ts
export type AppLockPhase = "disabled" | "unlocked" | "locked";

export interface AppLockDeps {
  isFlagSet(): Promise<boolean>;
  setFlag(enabled: boolean): Promise<void>;
  canUseBiometrics(): Promise<boolean>;
  authenticate(): Promise<boolean>;
}

/**
 * Biometrie entsperrt nur die lokal gespeicherte Session (App-Lock), ersetzt nie
 * die Server-Session (Spec §5.1). Opt-in-Flag liegt im SecureStore.
 */
export class AppLock {
  private phase: AppLockPhase = "disabled";

  constructor(private readonly deps: AppLockDeps) {}

  getPhase(): AppLockPhase {
    return this.phase;
  }

  async init(): Promise<AppLockPhase> {
    this.phase = (await this.deps.isFlagSet()) ? "locked" : "disabled";
    return this.phase;
  }

  async enable(): Promise<boolean> {
    if (!(await this.deps.canUseBiometrics())) return false;
    if (!(await this.deps.authenticate())) return false;
    await this.deps.setFlag(true);
    this.phase = "unlocked";
    return true;
  }

  async disable(): Promise<void> {
    await this.deps.setFlag(false);
    this.phase = "disabled";
  }

  onBackground(): void {
    if (this.phase !== "disabled") this.phase = "locked";
  }

  async unlock(): Promise<boolean> {
    if (this.phase !== "locked") return true;
    if (await this.deps.authenticate()) {
      this.phase = "unlocked";
      return true;
    }
    return false;
  }
}
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/app-lock/app-lock.test.ts` → `Tests  6 passed`.

- [ ] **Step 3: Native Deps + LockScreen** — `apps/mobile/src/lib/app-lock/deps.ts`:

```ts
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { t } from "i18next";
import type { AppLockDeps } from "./app-lock";

const FLAG_KEY = "ph360.app-lock-enabled";

export const nativeAppLockDeps: AppLockDeps = {
  isFlagSet: async () => (await SecureStore.getItemAsync(FLAG_KEY)) === "1",
  setFlag: async (enabled) => {
    if (enabled) await SecureStore.setItemAsync(FLAG_KEY, "1");
    else await SecureStore.deleteItemAsync(FLAG_KEY);
  },
  canUseBiometrics: async () =>
    (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync()),
  authenticate: async () =>
    (await LocalAuthentication.authenticateAsync({ promptMessage: t("appLock.prompt") })).success,
};
```

`apps/mobile/src/lib/app-lock/lock-screen.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function LockScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container} testID="lock-screen">
      <Text style={styles.title}>Powerhouse 360</Text>
      <Text style={styles.hint}>{t("appLock.lockedHint")}</Text>
      <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>{t("appLock.unlock")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D1626", gap: 16 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "600" },
  hint: { color: "#FFFFFF", opacity: 0.7, fontSize: 14 },
  button: { backgroundColor: "#3DB36A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
```

- [ ] **Step 4: Gate-Komponente** — `apps/mobile/src/lib/app-lock/app-lock-gate.tsx`:

```tsx
import { useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { AppLock } from "./app-lock";
import { nativeAppLockDeps } from "./deps";
import { LockScreen } from "./lock-screen";

/** Prozessweite Instanz — auch von Einstellungen/Opt-in-Screen genutzt. */
export const appLock = new AppLock(nativeAppLockDeps);

export function AppLockGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState(appLock.getPhase());

  async function tryUnlock() {
    await appLock.unlock();
    setPhase(appLock.getPhase());
  }

  useEffect(() => {
    void appLock.init().then((p) => {
      setPhase(p);
      if (p === "locked") void tryUnlock();
    });
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        appLock.onBackground();
        setPhase(appLock.getPhase());
      }
      if (next === "active" && appLock.getPhase() === "locked") void tryUnlock();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "locked") return <LockScreen onRetry={() => void tryUnlock()} />;
  return <>{children}</>;
}
```

- [ ] **Step 5: Opt-in-Screen + Onboarding-Sequenz** — `apps/mobile/src/lib/onboarding/use-onboarding-prompts.ts`:

```ts
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";

const BIO_PROMPTED = "ph360.biometrics-prompted";
const PUSH_PROMPTED = "ph360.push-prompted";

/** Spec §7.3 Nr. 1: Login → Biometrie-Opt-in → Push-Opt-in (je genau einmal). */
export function useOnboardingPrompts(isAuthenticated: boolean): void {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      if ((await SecureStore.getItemAsync(BIO_PROMPTED)) !== "1") {
        router.push("/biometrie");
        return;
      }
      if ((await SecureStore.getItemAsync(PUSH_PROMPTED)) !== "1") {
        router.push("/push-erklaerung");
      }
    })();
  }, [isAuthenticated, router]);
}

export async function markPrompted(which: "bio" | "push"): Promise<void> {
  await SecureStore.setItemAsync(which === "bio" ? BIO_PROMPTED : PUSH_PROMPTED, "1");
}
```

`apps/mobile/app/biometrie.tsx`:

```tsx
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appLock } from "../src/lib/app-lock/app-lock-gate";
import { markPrompted } from "../src/lib/onboarding/use-onboarding-prompts";

export default function BiometrieOptIn() {
  const router = useRouter();
  const { t } = useTranslation();

  async function finish() {
    await markPrompted("bio");
    router.replace("/push-erklaerung");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("appLock.optInTitle")}</Text>
      <Text style={styles.body}>{t("appLock.optInBody")}</Text>
      <Pressable
        style={styles.primary}
        onPress={() => {
          void appLock.enable().then(() => finish());
        }}
      >
        <Text style={styles.primaryText}>{t("appLock.optInEnable")}</Text>
      </Pressable>
      <Pressable onPress={() => void finish()}>
        <Text style={styles.later}>{t("common.later")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22 },
  primary: { backgroundColor: "#3DB36A", padding: 14, borderRadius: 8, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "600" },
  later: { textAlign: "center", opacity: 0.7, padding: 8 },
});
```

Im Root-Layout (`app/_layout.tsx`) den Hook mit dem Session-Zustand des better-auth-Clients verdrahten: `useOnboardingPrompts(!!authClient.useSession().data)`. Im „Mehr“-Screen einen Toggle „App-Sperre (Face ID/Touch ID)“ ergänzen, der `appLock.enable()` / `appLock.disable()` aufruft.

- [ ] **Step 6: i18n + app.json** — `de.json` ergänzen:

```json
{
  "common": { "later": "Später" },
  "appLock": {
    "prompt": "Powerhouse 360 entsperren",
    "lockedHint": "App gesperrt – mit Face ID/Touch ID entsperren",
    "unlock": "Entsperren",
    "optInTitle": "App-Sperre aktivieren?",
    "optInBody": "Schützen Sie Ihre Verbrauchs- und Vertragsdaten zusätzlich mit Face ID bzw. Touch ID. Die Sperre greift, sobald die App in den Hintergrund wechselt.",
    "optInEnable": "Mit Biometrie sichern"
  }
}
```

`apps/mobile/app.json` unter `expo.plugins` ergänzen:

```json
["expo-local-authentication", { "faceIDPermission": "Powerhouse 360 nutzt Face ID, um die App zu entsperren." }]
```

- [ ] **Step 7: Tests + Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/mobile exec vitest run src/lib/app-lock
pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/lib/app-lock apps/mobile/src/lib/onboarding apps/mobile/app/biometrie.tsx apps/mobile/app/_layout.tsx apps/mobile/app.json apps/mobile/src/i18n/locales/de.json
git commit -m "feat(mobile): Biometrie-App-Lock mit Opt-in nach Login und Resume-Gate"
```

---

## Task 6: Dokument-Downloads — Dokumentverzeichnis ohne Backup, offline öffnen

**Files:**
- Create: `apps/mobile/modules/no-backup/expo-module.config.json`, `apps/mobile/modules/no-backup/ios/NoBackupModule.swift`, `apps/mobile/modules/no-backup/ios/NoBackup.podspec`, `apps/mobile/modules/no-backup/index.ts`
- Create: `apps/mobile/src/lib/documents/document-store.ts`, `apps/mobile/src/lib/documents/file-ops.ts`, `apps/mobile/src/lib/documents/index.ts`, `apps/mobile/src/components/document-open-button.tsx`
- Modify: `apps/mobile/app.json` (`android.allowBackup: false`), `apps/mobile/app/(tabs)/rechnungen/[invoiceId].tsx`, `apps/mobile/src/i18n/locales/de.json`
- Test: `apps/mobile/src/lib/documents/document-store.test.ts`

- [ ] **Step 1: Fehlschlagender Test DocumentStore** — `apps/mobile/src/lib/documents/document-store.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createDocumentIndex, DocumentStore, type FileOps } from "./document-store";
import type { StringStorage } from "../cache/persister";

function mapStorage(): StringStorage {
  const map = new Map<string, string>();
  return {
    getString: (k) => map.get(k),
    set: (k, v) => {
      map.set(k, v);
    },
    delete: (k) => {
      map.delete(k);
    },
  };
}

function fakeFiles(existing = new Set<string>()): FileOps & { excluded: string[]; downloads: string[] } {
  const excluded: string[] = [];
  const downloads: string[] = [];
  return {
    excluded,
    downloads,
    ensureDir: vi.fn(async () => undefined),
    downloadFile: vi.fn(async (_url: string, dest: string) => {
      downloads.push(dest);
      existing.add(dest);
    }),
    exists: async (uri) => existing.has(uri),
    excludeFromBackup: (uri) => {
      excluded.push(uri);
    },
  };
}

describe("DocumentStore", () => {
  const baseDir = "file:///docs/documents/";

  it("lädt herunter, schließt vom Backup aus und indiziert", async () => {
    const files = fakeFiles();
    const store = new DocumentStore({ files, index: createDocumentIndex(mapStorage()), baseDir });
    const doc = await store.download({
      documentId: "doc-1",
      url: "https://minio.local/signed",
      fileName: "Rechnung 2026-06.pdf",
      mimeType: "application/pdf",
    });
    expect(doc.fileUri).toBe("file:///docs/documents/doc-1-Rechnung_2026-06.pdf");
    expect(files.downloads).toEqual([doc.fileUri]);
    expect(files.excluded).toEqual([doc.fileUri]);
    expect(await store.getLocal("doc-1")).toMatchObject({ documentId: "doc-1", mimeType: "application/pdf" });
  });

  it("getLocal liefert null für unbekannte Dokumente", async () => {
    const store = new DocumentStore({ files: fakeFiles(), index: createDocumentIndex(mapStorage()), baseDir });
    expect(await store.getLocal("nope")).toBeNull();
  });

  it("getLocal räumt Index-Einträge auf, deren Datei fehlt (z. B. gelöscht)", async () => {
    const existing = new Set<string>();
    const files = fakeFiles(existing);
    const index = createDocumentIndex(mapStorage());
    const store = new DocumentStore({ files, index, baseDir });
    const doc = await store.download({
      documentId: "doc-2",
      url: "https://minio.local/signed",
      fileName: "a.pdf",
      mimeType: "application/pdf",
    });
    existing.delete(doc.fileUri); // Datei extern entfernt
    expect(await store.getLocal("doc-2")).toBeNull();
    expect(index.get("doc-2")).toBeNull();
  });
});
```

Rot: `pnpm --filter @ph360/mobile exec vitest run src/lib/documents/document-store.test.ts`.

- [ ] **Step 2: Implementierung DocumentStore** — `apps/mobile/src/lib/documents/document-store.ts`:

```ts
import type { StringStorage } from "../cache/persister";

export interface StoredDoc {
  documentId: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
  downloadedAt: string;
}

export interface FileOps {
  ensureDir(dirUri: string): Promise<void>;
  downloadFile(url: string, destUri: string): Promise<void>;
  exists(uri: string): Promise<boolean>;
  excludeFromBackup(uri: string): void;
}

export interface DocIndex {
  get(documentId: string): StoredDoc | null;
  set(documentId: string, doc: StoredDoc): void;
  delete(documentId: string): void;
}

const INDEX_KEY = "ph360.document-index";

/** Index im verschlüsselten MMKV — Dateinamen/Metadaten liegen nie im Klartext-Storage. */
export function createDocumentIndex(storage: StringStorage): DocIndex {
  function read(): Record<string, StoredDoc> {
    const raw = storage.getString(INDEX_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredDoc>) : {};
  }
  function write(map: Record<string, StoredDoc>): void {
    storage.set(INDEX_KEY, JSON.stringify(map));
  }
  return {
    get: (id) => read()[id] ?? null,
    set: (id, doc) => {
      const map = read();
      map[id] = doc;
      write(map);
    },
    delete: (id) => {
      const map = read();
      delete map[id];
      write(map);
    },
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_");
}

/**
 * PDFs liegen im App-Sandbox-Dokumentverzeichnis, iOS: pro Datei vom
 * iCloud-/iTunes-Backup ausgeschlossen (lokales Expo-Modul), Android:
 * allowBackup=false app-weit (Spec §7.1).
 */
export class DocumentStore {
  constructor(private readonly deps: { files: FileOps; index: DocIndex; baseDir: string }) {}

  async getLocal(documentId: string): Promise<StoredDoc | null> {
    const doc = this.deps.index.get(documentId);
    if (!doc) return null;
    if (!(await this.deps.files.exists(doc.fileUri))) {
      this.deps.index.delete(documentId);
      return null;
    }
    return doc;
  }

  async download(meta: { documentId: string; url: string; fileName: string; mimeType: string }): Promise<StoredDoc> {
    await this.deps.files.ensureDir(this.deps.baseDir);
    const fileUri = `${this.deps.baseDir}${meta.documentId}-${sanitizeFileName(meta.fileName)}`;
    await this.deps.files.downloadFile(meta.url, fileUri);
    this.deps.files.excludeFromBackup(fileUri);
    const doc: StoredDoc = {
      documentId: meta.documentId,
      fileUri,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      downloadedAt: new Date().toISOString(),
    };
    this.deps.index.set(meta.documentId, doc);
    return doc;
  }
}
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/lib/documents/document-store.test.ts` → `Tests  3 passed`.

- [ ] **Step 3: Lokales Expo-Modul no-backup (iOS)** — `apps/mobile/modules/no-backup/expo-module.config.json`:

```json
{
  "platforms": ["apple"],
  "apple": {
    "modules": ["NoBackupModule"]
  }
}
```

`apps/mobile/modules/no-backup/ios/NoBackupModule.swift`:

```swift
import ExpoModulesCore
import Foundation

public class NoBackupModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NoBackup")

    Function("setExcludedFromBackup") { (fileUri: String) -> Bool in
      guard var url = URL(string: fileUri), url.isFileURL else { return false }
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      do {
        try url.setResourceValues(values)
        return true
      } catch {
        return false
      }
    }
  }
}
```

`apps/mobile/modules/no-backup/ios/NoBackup.podspec`:

```ruby
Pod::Spec.new do |s|
  s.name             = 'NoBackup'
  s.version          = '1.0.0'
  s.summary          = 'Setzt NSURLIsExcludedFromBackupKey auf heruntergeladene Dateien'
  s.author           = 'AKL Powerhouse 360'
  s.homepage         = 'https://powerhouse360.de'
  s.license          = { :type => 'UNLICENSED' }
  s.platforms        = { :ios => '15.1' }
  s.source           = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files     = '**/*.swift'
end
```

`apps/mobile/modules/no-backup/index.ts`:

```ts
import { requireOptionalNativeModule } from "expo-modules-core";

interface NoBackupNative {
  setExcludedFromBackup(fileUri: string): boolean;
}

const NoBackup = requireOptionalNativeModule<NoBackupNative>("NoBackup");

/** iOS: Datei vom iCloud-/iTunes-Backup ausschließen. Android: No-op (allowBackup=false app-weit). */
export function setExcludedFromBackup(fileUri: string): boolean {
  return NoBackup?.setExcludedFromBackup(fileUri) ?? true;
}
```

Verify-at-impl: Lokale Expo-Module unter `modules/` werden von Expo-Autolinking beim `expo prebuild`/`expo run:ios` automatisch erkannt; nach diesem Schritt einmal `pnpm --filter @ph360/mobile exec npx expo prebuild --platform ios --clean` ausführen und im Build-Log prüfen, dass `NoBackup` verlinkt wird.

`apps/mobile/app.json` unter `expo.android` ergänzen: `"allowBackup": false`.

- [ ] **Step 4: Native FileOps + Singleton** — `apps/mobile/src/lib/documents/file-ops.ts`:

```ts
import * as FileSystem from "expo-file-system/legacy";
import { setExcludedFromBackup } from "../../../modules/no-backup";
import type { FileOps } from "./document-store";

export const documentsBaseDir = `${FileSystem.documentDirectory}documents/`;

export const nativeFileOps: FileOps = {
  ensureDir: async (dir) => {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  },
  downloadFile: async (url, dest) => {
    const res = await FileSystem.downloadAsync(url, dest);
    if (res.status !== 200) throw new Error(`Download fehlgeschlagen (HTTP ${res.status})`);
  },
  exists: async (uri) => (await FileSystem.getInfoAsync(uri)).exists,
  excludeFromBackup: (uri) => {
    setExcludedFromBackup(uri);
  },
};
```

(Verify-at-impl: Bei Expo SDK < 54 lautet der Import `expo-file-system` statt `expo-file-system/legacy` — API identisch.)

`apps/mobile/src/lib/documents/index.ts`:

```ts
import { getAppStorage } from "../storage/app-storage";
import { createDocumentIndex, DocumentStore } from "./document-store";
import { documentsBaseDir, nativeFileOps } from "./file-ops";

let store: DocumentStore | null = null;

export async function getDocumentStore(): Promise<DocumentStore> {
  if (!store) {
    const storage = await getAppStorage();
    store = new DocumentStore({ files: nativeFileOps, index: createDocumentIndex(storage), baseDir: documentsBaseDir });
  }
  return store;
}
```

- [ ] **Step 5: DocumentOpenButton** — `apps/mobile/src/components/document-open-button.tsx`:

```tsx
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from "react-native";
import { useDataSource } from "../data/data-source-provider";
import { ApiError } from "../data/api/http";
import { getDocumentStore } from "../lib/documents";

interface Props {
  documentId: string;
  fileName: string;
  mimeType: string;
}

/** Lädt das Dokument über die signierte URL, öffnet via System-Viewer/Share-Sheet; offline aus dem lokalen Bestand. */
export function DocumentOpenButton({ documentId, fileName, mimeType }: Props) {
  const dataSource = useDataSource();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    void getDocumentStore()
      .then((s) => s.getLocal(documentId))
      .then((d) => setIsLocal(d !== null));
  }, [documentId]);

  async function open() {
    setBusy(true);
    try {
      const store = await getDocumentStore();
      let doc = await store.getLocal(documentId);
      if (!doc) {
        const { url } = await dataSource.getDocumentDownloadUrl(documentId);
        doc = await store.download({ documentId, url, fileName, mimeType });
      }
      setIsLocal(true);
      await Sharing.shareAsync(doc.fileUri, { mimeType, dialogTitle: fileName, UTI: "com.adobe.pdf" });
    } catch (e) {
      const offline = e instanceof ApiError && e.code === "NETWORK";
      Alert.alert(
        t(offline ? "offline.actionTitle" : "documents.openErrorTitle"),
        t(offline ? "offline.actionNeedsNetwork" : "documents.openError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable style={styles.button} onPress={() => void open()} disabled={busy} testID="document-open-button">
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{t(isLocal ? "documents.openOffline" : "documents.open")}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#3DB36A", padding: 14, borderRadius: 8, alignItems: "center" },
  text: { color: "#FFFFFF", fontWeight: "600" },
});
```

`de.json` ergänzen:

```json
{
  "documents": {
    "open": "PDF ansehen",
    "openOffline": "Offline verfügbar – PDF ansehen",
    "openErrorTitle": "Dokument nicht verfügbar",
    "openError": "Das Dokument konnte nicht geladen werden. Bitte später erneut versuchen."
  }
}
```

**Modify `apps/mobile/app/(tabs)/rechnungen/[invoiceId].tsx`:** Die bisherige Mock-PDF-Aktion durch `<DocumentOpenButton documentId={invoice.documentId} fileName={`Rechnung_${invoice.number}.pdf`} mimeType="application/pdf" />` ersetzen (Feldnamen aus `InvoiceDetailResponse` übernehmen).

- [ ] **Step 6: Tests + Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/mobile exec vitest run src/lib/documents
pnpm --filter @ph360/mobile typecheck
git add apps/mobile/modules apps/mobile/src/lib/documents apps/mobile/src/components/document-open-button.tsx apps/mobile/app.json "apps/mobile/app/(tabs)/rechnungen" apps/mobile/src/i18n/locales/de.json
git commit -m "feat(mobile): Rechnungs-/Dokument-Downloads ohne Cloud-Backup mit Offline-Wiederöffnen"
```

---

## Task 7: Serverseitige Audit-Verifikation Dokument-Download (Test)

**Files:**
- Test: `apps/platform/src/app/api/v1/app/documents/[id]/download/audit.itest.ts`
- Modify (nur falls Test rot): `apps/platform/src/app/api/v1/app/documents/[id]/download/route.ts`

- [ ] **Step 1: Integrationstest schreiben** — `audit.itest.ts` neben der Route:

```ts
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { auth } from "@ph360/auth";
import { createResidentContext, prisma } from "@ph360/testing";
import { GET } from "./route.js";

async function sessionCookieFor(email: string, password: string): Promise<string> {
  const res = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Kein Session-Cookie erhalten");
  return setCookie.split(";")[0] ?? "";
}

describe("GET /api/v1/app/documents/:id/download — Audit (Spec §5.4)", () => {
  it("erzeugt beim Download ein AuditEvent document.downloaded mit Actor", async () => {
    const ctx = await createResidentContext();
    const document = await prisma.document.create({
      data: {
        organizationId: ctx.organization.id,
        participantId: ctx.participant.id,
        objectKey: `test/${randomUUID()}.pdf`,
        fileName: "Rechnung_2026-06.pdf",
        mimeType: "application/pdf",
      },
    });

    const cookie = await sessionCookieFor(ctx.email, ctx.password);
    const req = new Request(`http://localhost/api/v1/app/documents/${document.id}/download`, {
      headers: { cookie },
    });
    const res = await GET(req, { params: Promise.resolve({ id: document.id }) });
    expect(res.status).toBe(200);

    const audit = await prisma.auditEvent.findFirst({
      where: { action: "document.downloaded", subjectType: "Document", subjectId: document.id },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actorId).toBe(ctx.user.id);
    expect(audit?.organizationId).toBe(ctx.organization.id);
  });

  it("auditiert KEINEN Download bei fremdem Teilnehmer (403/404)", async () => {
    const owner = await createResidentContext();
    const stranger = await createResidentContext();
    const document = await prisma.document.create({
      data: {
        organizationId: owner.organization.id,
        participantId: owner.participant.id,
        objectKey: `test/${randomUUID()}.pdf`,
        fileName: "geheim.pdf",
        mimeType: "application/pdf",
      },
    });

    const cookie = await sessionCookieFor(stranger.email, stranger.password);
    const req = new Request(`http://localhost/api/v1/app/documents/${document.id}/download`, {
      headers: { cookie },
    });
    const res = await GET(req, { params: Promise.resolve({ id: document.id }) });
    expect([403, 404]).toContain(res.status);

    const audit = await prisma.auditEvent.findFirst({
      where: { action: "document.downloaded", subjectId: document.id },
    });
    expect(audit).toBeNull();
  });
});
```

- [ ] **Step 2: Test ausführen** — `pnpm vitest run --project integration "apps/platform/src/app/api/v1/app/documents/[id]/download/audit.itest.ts"`.
  - **Grün:** WP-APP-2 auditiert bereits → weiter zu Step 4.
  - **Rot (kein AuditEvent):** Step 3 ausführen.

- [ ] **Step 3 (nur falls rot): Audit in der Route ergänzen** — in `route.ts` nach erfolgreicher Scope-Prüfung, vor der Antwort:

```ts
import { recordAudit } from "@ph360/auth";
import { prisma } from "@ph360/database";

await recordAudit(prisma, {
  action: "document.downloaded",
  subjectType: "Document",
  subjectId: document.id,
  actorType: "USER",
  actorId: ctx.userId,
  organizationId: document.organizationId,
});
```

(Variablennamen `document`/`ctx` an die tatsächliche Routen-Implementierung aus WP-APP-2 anpassen.) Danach Step 2 wiederholen → grün.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add "apps/platform/src/app/api/v1/app/documents"
git commit -m "test(platform): Audit-Event document.downloaded für App-Downloads verifiziert"
```

---

## Task 8: Worker-Push-Kette — `PushDelivery`-Modell, Expo-Push-Sender, Übersetzungs-Handler `notification.requested` (Producer-Payload → User-Notifications → Push) mit Anti-Spam

**Files:**
- Modify: `packages/database/prisma/schema.prisma` (+ Migration `push_delivery`), `apps/worker/src/index.ts`, `apps/worker/package.json`, `turbo.json`
- Create: `apps/worker/src/push.ts`, `apps/worker/src/notification-push.ts`
- Test: `apps/worker/src/push.test.ts`, `apps/worker/src/notification-push.itest.ts`

- [ ] **Step 1: Prisma-Modell + Migration** — in `packages/database/prisma/schema.prisma` ergänzen (Abschnitt platform):

```prisma
/// Versandprotokoll für Push (Anti-Spam, Spec §3.3): Dedupe je Störung/Rechnung
/// (unique userId+dedupeKey) und Tageslimit je Nutzer+Kategorie.
model PushDelivery {
  id             String               @id @default(uuid()) @db.Uuid
  /// User.id ist String (better-auth) — bewusst KEIN @db.Uuid.
  userId         String
  category       NotificationCategory
  notificationId String               @db.Uuid
  /// "data_gap:<meteringPointId>:<gapSinceIso>" | "invoice_created:<invoiceId>"; null = kein Dedupe (nur Tageslimit).
  dedupeKey      String?
  sentAt         DateTime             @default(now())

  @@unique([userId, dedupeKey])
  @@index([userId, category, sentAt])
  @@map("push_delivery")
}
```

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/database exec prisma migrate dev --name push_delivery
pnpm db:generate
```

Erwartet: neue Migration `…_push_delivery` angelegt, Client generiert. Danach `pnpm --filter @ph360/worker add zod` und in `turbo.json` `globalEnv` um `"EXPO_ACCESS_TOKEN"` und `"PUSH_DAILY_LIMIT"` ergänzen.

- [ ] **Step 2: Fehlschlagender Unit-Test Sender** — `apps/worker/src/push.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createExpoPushSender } from "./push.js";

describe("createExpoPushSender", () => {
  it("postet Messages an die Expo Push API und liefert Tickets", async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://exp.host/--/api/v2/push/send");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body)) as unknown[];
      expect(body).toHaveLength(1);
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const send = createExpoPushSender(fetchFn as typeof fetch);
    const tickets = await send([{ to: "ExponentPushToken[x]", title: "T", body: "B" }]);
    expect(tickets).toEqual([{ status: "ok" }]);
  });

  it("liefert [] ohne Messages und wirft bei HTTP-Fehler", async () => {
    const send = createExpoPushSender(vi.fn() as unknown as typeof fetch);
    expect(await send([])).toEqual([]);
    const failing = createExpoPushSender(
      vi.fn(async () => new Response("busy", { status: 429 })) as typeof fetch,
    );
    await expect(failing([{ to: "t", title: "a", body: "b" }])).rejects.toThrow("HTTP 429");
  });
});
```

Rot: `pnpm vitest run --project unit apps/worker/src/push.test.ts` → Resolve-Fehler `./push.js`.

- [ ] **Step 3: Implementierung Sender** — `apps/worker/src/push.ts`:

```ts
export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  priority?: "default" | "high";
}

export interface PushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

export type PushSender = (messages: PushMessage[]) => Promise<PushTicket[]>;

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Expo Push API (APNs/FCM dahinter, D-06). Optional EXPO_ACCESS_TOKEN für Enhanced Security. */
export function createExpoPushSender(fetchFn: typeof fetch = fetch): PushSender {
  return async (messages) => {
    if (messages.length === 0) return [];
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
    };
    const token = process.env.EXPO_ACCESS_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetchFn(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(messages) });
    if (!res.ok) throw new Error(`Expo-Push-API: HTTP ${res.status}`);
    const json = (await res.json()) as { data?: PushTicket[] };
    return json.data ?? [];
  };
}
```

Grün: `pnpm vitest run --project unit apps/worker/src/push.test.ts` → `Tests  2 passed`.

- [ ] **Step 4: Fehlschlagende Integrationstests Handler** — `apps/worker/src/notification-push.itest.ts` (Payload = kanonischer Producer-Contract aus WP-APP-1; der Handler übersetzt MeteringPoint→Unit→aktive PowerParticipant→userId):

```ts
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createBuildingTree, createOrg, createUserWithMembership, prisma } from "@ph360/testing";
import { createNotificationPushHandler, type NotificationRequestedPayload } from "./notification-push.js";
import type { PushMessage, PushTicket } from "./push.js";

function fakeSender(tickets?: PushTicket[]) {
  const sent: PushMessage[][] = [];
  const send = vi.fn(async (msgs: PushMessage[]) => {
    sent.push(msgs);
    return tickets ?? msgs.map(() => ({ status: "ok" as const }));
  });
  return { send, sent };
}

/** Bewohner-Setup: Unit + aktive Teilnahme (userId verknüpft) + MeteringPoint + PushDevice. */
async function seedResident() {
  const org = await createOrg();
  const { user } = await createUserWithMembership(org.id, "RESIDENT");
  const { building, unit } = await createBuildingTree({ organizationId: org.id });
  const participant = await prisma.powerParticipant.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      unitId: unit.id,
      status: "ACTIVE",
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const meteringPoint = await prisma.meteringPoint.create({
    data: { organizationId: org.id, buildingId: building.id, unitId: unit.id, pointType: "UNIT_CONSUMPTION" },
  });
  const device = await prisma.pushDevice.create({
    data: { userId: user.id, expoPushToken: `ExponentPushToken[${randomUUID()}]`, platform: "ios", appVersion: "1.0.0" },
  });
  return { org, user, unit, participant, meteringPoint, device };
}

/** Kanonischer Producer-Payload (WP-APP-1 Task 8): data_gap für einen MeteringPoint. */
function gapPayload(
  meteringPointId: string,
  overrides: Partial<NotificationRequestedPayload> = {},
): Record<string, unknown> {
  return {
    kind: "data_gap",
    category: "DATA_QUALITY",
    priority: 2,
    meteringPointId,
    meterId: randomUUID(),
    gapSince: "2026-07-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("notification.requested → Übersetzung + Push (Anti-Spam, Spec §3.3)", () => {
  it("übersetzt data_gap: MeteringPoint→Unit→aktive PowerParticipant→userId ⇒ Notification-Zeile + Push + PushDelivery", async () => {
    const { user, meteringPoint, device } = await seedResident();
    const { send, sent } = fakeSender();
    await createNotificationPushHandler({ prisma, send })(gapPayload(meteringPoint.id));

    const notification = await prisma.notification.findFirst({ where: { userId: user.id } });
    expect(notification).toMatchObject({ category: "DATA_QUALITY", priority: 2 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject([
      { to: device.expoPushToken, title: "Gestörte Messwerte", channelId: "data_quality" },
    ]);
    const delivery = await prisma.pushDelivery.findFirst({ where: { notificationId: notification?.id ?? "" } });
    expect(delivery).toMatchObject({ userId: user.id, category: "DATA_QUALITY" });
  });

  it("ignoriert abgelaufene Teilnahmen (validTo in der Vergangenheit): keine Notification, kein Push", async () => {
    const { user, participant, meteringPoint } = await seedResident();
    await prisma.powerParticipant.update({
      where: { id: participant.id },
      data: { validTo: new Date("2026-02-01T00:00:00.000Z") },
    });
    const { send } = fakeSender();
    await createNotificationPushHandler({ prisma, send })(gapPayload(meteringPoint.id));
    expect(send).not.toHaveBeenCalled();
    expect(await prisma.notification.count({ where: { userId: user.id } })).toBe(0);
  });

  it("unterdrückt den Push bei deaktivierter Kategorie-Präferenz — die In-App-Notification-Zeile bleibt", async () => {
    const { user, meteringPoint } = await seedResident();
    await prisma.notificationPreference.create({
      data: { userId: user.id, category: "DATA_QUALITY", enabled: false },
    });
    const { send } = fakeSender();
    await createNotificationPushHandler({ prisma, send })(gapPayload(meteringPoint.id));
    expect(send).not.toHaveBeenCalled();
    expect(await prisma.notification.count({ where: { userId: user.id } })).toBe(1);
  });

  it("INCIDENT (Priorität 3) ignoriert deaktivierte Präferenz — nicht abwählbar, Push high", async () => {
    const { user, meteringPoint } = await seedResident();
    await prisma.notificationPreference.create({
      data: { userId: user.id, category: "INCIDENT", enabled: false },
    });
    const { send, sent } = fakeSender();
    await createNotificationPushHandler({ prisma, send })(
      gapPayload(meteringPoint.id, { category: "INCIDENT", priority: 3 }),
    );
    expect(sent).toHaveLength(1);
    expect(sent[0]?.[0]?.priority).toBe("high");
  });

  it("dedupliziert je Störung (meteringPointId+gapSince): max. 1 Push, Entwarnung separat", async () => {
    const { meteringPoint } = await seedResident();
    const { send } = fakeSender();
    const handle = createNotificationPushHandler({ prisma, send });

    await handle(gapPayload(meteringPoint.id));
    await handle(gapPayload(meteringPoint.id)); // Wiederholung derselben Störung (gleicher gapSince)
    expect(send).toHaveBeenCalledTimes(1);

    await handle(gapPayload(meteringPoint.id, { kind: "data_gap_resolved", gapSince: null })); // Entwarnung
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("erzwingt das Tageslimit je Kategorie (konfigurierbar)", async () => {
    const { meteringPoint } = await seedResident();
    const { send } = fakeSender();
    const handle = createNotificationPushHandler({ prisma, send, dailyLimit: 2 });

    for (let i = 0; i < 3; i++) {
      // je Durchlauf ein anderer gapSince ⇒ Dedupe greift nicht, nur das Tageslimit
      await handle(gapPayload(meteringPoint.id, { gapSince: `2026-07-2${i}T00:00:00.000Z` }));
    }
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("entfernt PushDevice bei Ticket DeviceNotRegistered", async () => {
    const { meteringPoint, device } = await seedResident();
    const { send } = fakeSender([{ status: "error", details: { error: "DeviceNotRegistered" } }]);
    await createNotificationPushHandler({ prisma, send })(gapPayload(meteringPoint.id));
    const remaining = await prisma.pushDevice.findFirst({ where: { expoPushToken: device.expoPushToken } });
    expect(remaining).toBeNull();
  });

  it("invoice_created: Auflösung Invoice→Contract→PowerParticipant.userId ⇒ BILLING-Push an den Vertragsinhaber", async () => {
    const { org, user, unit, participant, device } = await seedResident();
    const tariff = await prisma.tariff.create({ data: { organizationId: org.id, name: "Testtarif" } });
    const tariffVersion = await prisma.tariffVersion.create({
      data: {
        tariffId: tariff.id,
        validFrom: new Date("2026-01-01T00:00:00.000Z"),
        workPricePvCents: 20,
        workPriceGridCents: 32,
        basePriceCents: 500,
      },
    });
    const contract = await prisma.contract.create({
      data: {
        organizationId: org.id,
        contractNumber: `PM-T-${randomUUID()}`,
        participantId: participant.id,
        unitId: unit.id,
        tariffVersionId: tariffVersion.id,
        status: "ACTIVE",
        startAt: new Date("2026-01-01T00:00:00.000Z"),
        issuingEntityId: randomUUID(),
      },
    });
    const document = await prisma.document.create({
      data: {
        organizationId: org.id,
        participantId: participant.id,
        objectKey: `test/${randomUUID()}.pdf`,
        fileName: "Rechnung.pdf",
        mimeType: "application/pdf",
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: org.id,
        contractId: contract.id,
        number: `R-${randomUUID()}`,
        periodStart: new Date("2026-06-01T00:00:00.000Z"),
        periodEnd: new Date("2026-07-01T00:00:00.000Z"),
        totalCents: 3120,
        issuingEntityId: contract.issuingEntityId,
        documentId: document.id,
      },
    });

    const { send, sent } = fakeSender();
    await createNotificationPushHandler({ prisma, send })({
      kind: "invoice_created",
      category: "BILLING",
      priority: 1,
      invoiceId: invoice.id,
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject([{ to: device.expoPushToken, channelId: "billing" }]);
    expect(await prisma.notification.count({ where: { userId: user.id, category: "BILLING" } })).toBe(1);
  });

  it("ist idempotent bei unbekanntem MeteringPoint (kein Wurf, kein Send)", async () => {
    const { send } = fakeSender();
    await createNotificationPushHandler({ prisma, send })(gapPayload(randomUUID()));
    expect(send).not.toHaveBeenCalled();
  });
});
```

Rot: `pnpm vitest run --project integration apps/worker/src/notification-push.itest.ts` → Resolve-Fehler `./notification-push.js`.

- [ ] **Step 5: Implementierung Handler** — `apps/worker/src/notification-push.ts`:

```ts
import { z } from "zod";
import { prisma as defaultPrisma } from "@ph360/database";
import type { PushSender } from "./push.js";

/**
 * Kanonischer Payload-Contract des DomainEvents notification.requested
 * (Producer: WP-APP-1 Task 8 Lückenerkennung; invoice_created aus der
 * Rechnungslogik). Dieser Handler ÜBERSETZT: MeteringPoint→Unit→aktive
 * PowerParticipant→userId ⇒ je User eine Notification-Zeile, dann
 * Preferences-Check + Anti-Spam, dann Expo-Push (Spec §3.3).
 */
export const notificationRequestedPayloadSchema = z.object({
  kind: z.enum(["data_gap", "data_gap_resolved", "invoice_created"]),
  category: z.enum(["DATA_QUALITY", "BILLING", "INCIDENT"]),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  meteringPointId: z.string().uuid().optional(),
  meterId: z.string().uuid().optional(),
  /** ISO-String; WP-APP-1 sendet bei Entwarnung explizit null. */
  gapSince: z.string().nullish(),
  invoiceId: z.string().uuid().optional(),
});

export type NotificationRequestedPayload = z.infer<typeof notificationRequestedPayloadSchema>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Deutsche Standard-Texte je kind (finale Texte: PO — reine Datenpflege, kein Codeumbau). */
const TEXTS: Record<NotificationRequestedPayload["kind"], { title: string; body: string }> = {
  data_gap: {
    title: "Gestörte Messwerte",
    body: "Seit längerer Zeit keine Daten von Ihrem Zähler. Wir kümmern uns darum.",
  },
  data_gap_resolved: {
    title: "Messwerte wieder verfügbar",
    body: "Ihr Zähler liefert wieder Daten. Fehlende Werte werden nachgetragen.",
  },
  invoice_created: {
    title: "Neue Rechnung",
    body: "Ihre neue Rechnung ist in der App verfügbar.",
  },
};

export interface NotificationPushDeps {
  prisma: typeof defaultPrisma;
  send: PushSender;
  /** Default: env PUSH_DAILY_LIMIT, sonst 5. Gilt je Nutzer+Kategorie; INCIDENT ist ausgenommen. */
  dailyLimit?: number;
  now?: () => Date;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
}

/** Anti-Spam-Dedupe (Spec §3.3: eine Störung = max. 1 Push; Entwarnung/Rechnung separat). */
function dedupeKeyOf(payload: NotificationRequestedPayload): string | null {
  if (payload.kind === "data_gap" && payload.meteringPointId && payload.gapSince) {
    return `data_gap:${payload.meteringPointId}:${payload.gapSince}`;
  }
  if (payload.kind === "invoice_created" && payload.invoiceId) {
    return `invoice_created:${payload.invoiceId}`;
  }
  // data_gap_resolved: Producer emittiert je Störung höchstens eine Entwarnung (notifiedAt-Guard in WP-APP-1)
  return null;
}

interface ResolvedRecipient {
  userId: string;
  organizationId: string | null;
}

/** Übersetzung Producer-Payload → Empfänger (Festlegung: MeteringPoint→Unit→aktive PowerParticipant→userId). */
async function resolveRecipients(
  prisma: NotificationPushDeps["prisma"],
  payload: NotificationRequestedPayload,
  now: Date,
): Promise<ResolvedRecipient[]> {
  if (payload.kind === "invoice_created") {
    if (!payload.invoiceId) return [];
    const invoice = await prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      include: { contract: { include: { participant: true } } },
    });
    const userId = invoice?.contract.participant?.userId ?? null;
    return userId ? [{ userId, organizationId: invoice?.organizationId ?? null }] : [];
  }
  if (!payload.meteringPointId) return [];
  const meteringPoint = await prisma.meteringPoint.findUnique({ where: { id: payload.meteringPointId } });
  if (!meteringPoint?.unitId) return []; // unbekannt oder Gebäude-/PV-Zähler ohne Unit ⇒ keine Bewohner-Benachrichtigung
  const participants = await prisma.powerParticipant.findMany({
    where: {
      unitId: meteringPoint.unitId,
      userId: { not: null },
      validFrom: { lte: now },
      OR: [{ validTo: null }, { validTo: { gt: now } }],
    },
  });
  const unique = new Map<string, ResolvedRecipient>();
  for (const p of participants) {
    if (p.userId) unique.set(p.userId, { userId: p.userId, organizationId: meteringPoint.organizationId });
  }
  return [...unique.values()];
}

export function createNotificationPushHandler(deps: NotificationPushDeps) {
  const dailyLimit = deps.dailyLimit ?? Number(process.env.PUSH_DAILY_LIMIT ?? 5);
  const now = deps.now ?? (() => new Date());
  const { prisma, send } = deps;

  return async (raw: Record<string, unknown>): Promise<void> => {
    const payload = notificationRequestedPayloadSchema.parse(raw);

    const recipients = await resolveRecipients(prisma, payload, now());
    if (recipients.length === 0) return; // kein aktiver Bewohner auflösbar — idempotent überspringen

    const text = TEXTS[payload.kind];
    const critical = payload.category === "INCIDENT"; // Priorität 3: nicht abwählbar
    const dedupeKey = dedupeKeyOf(payload);

    for (const { userId, organizationId } of recipients) {
      // 1) In-App-Notification-Zeile — entsteht IMMER (Preferences/Anti-Spam gaten nur den Push)
      const notification = await prisma.notification.create({
        data: {
          userId,
          organizationId,
          priority: payload.priority,
          category: payload.category,
          title: text.title,
          body: text.body,
        },
      });

      // 2) Preferences-Check
      if (!critical) {
        const pref = await prisma.notificationPreference.findFirst({
          where: { userId, category: payload.category },
        });
        if (pref && !pref.enabled) continue; // Kategorie abgewählt — kein Push (In-App bleibt)
      }

      // 3) Anti-Spam: Dedupe je Störung/Rechnung
      if (dedupeKey) {
        const dup = await prisma.pushDelivery.findFirst({ where: { userId, dedupeKey } });
        if (dup) continue;
      }

      // 4) Anti-Spam: Tageslimit je Nutzer+Kategorie (INCIDENT ausgenommen)
      if (!critical) {
        const since = new Date(now().getTime() - DAY_MS);
        const count = await prisma.pushDelivery.count({
          where: { userId, category: payload.category, sentAt: { gte: since } },
        });
        if (count >= dailyLimit) continue;
      }

      const devices = await prisma.pushDevice.findMany({ where: { userId } });
      if (devices.length === 0) continue;

      try {
        await prisma.pushDelivery.create({
          data: { userId, category: payload.category, notificationId: notification.id, dedupeKey },
        });
      } catch (err) {
        if (isUniqueViolation(err)) continue; // Race: paralleler Worker hat diesen Push bereits protokolliert
        throw err;
      }

      // 5) Expo-Push an alle Geräte des Nutzers
      const tickets = await send(
        devices.map((d) => ({
          to: d.expoPushToken,
          title: text.title,
          body: text.body,
          data: { notificationId: notification.id },
          channelId: payload.category.toLowerCase(),
          priority: critical ? ("high" as const) : ("default" as const),
        })),
      );

      for (const [i, ticket] of tickets.entries()) {
        const device = devices[i];
        if (device && ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          await prisma.pushDevice.deleteMany({ where: { expoPushToken: device.expoPushToken } });
        }
      }
    }
  };
}
```

Grün: `pnpm vitest run --project integration apps/worker/src/notification-push.itest.ts` → `Tests  9 passed`.

- [ ] **Step 6: Handler registrieren** — `apps/worker/src/index.ts`: Imports ergänzen und die `handlers`-Registry erweitern:

```ts
import { createNotificationPushHandler } from "./notification-push.js";
import { createExpoPushSender } from "./push.js";
```

Im bestehenden `handlers`-Objekt NUR die folgende Zeile ergänzen — alle bestehenden Einträge (z. B. `lead.created`, `device.telemetry_received`) bleiben unverändert:

```ts
  "notification.requested": createNotificationPushHandler({ prisma, send: createExpoPushSender() }),
```

Danach: `pnpm --filter @ph360/worker typecheck` → Exit 0.

- [ ] **Step 7: Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add packages/database/prisma apps/worker/src apps/worker/package.json turbo.json pnpm-lock.yaml
git commit -m "feat(worker): Push-Versand für notification.requested mit Dedupe je DeviceAlert und Tageslimit je Kategorie"
```

---

## Task 9: App-seitige Push-Registrierung — Pre-Permission-Screen, Token-Upload, Kanäle, Präferenzen-Sync

**Files:**
- Create: `apps/mobile/src/lib/push/push-registration.ts`, `apps/mobile/src/lib/push/native-deps.ts`, `apps/mobile/src/lib/push/channels.ts`, `apps/mobile/src/lib/push/use-notification-preferences.ts`, `apps/mobile/app/push-erklaerung.tsx`
- Modify: `apps/mobile/app.json` (Plugin `expo-notifications`), `apps/mobile/src/app-providers.tsx` (Kanal-Setup), `apps/mobile/src/i18n/locales/de.json` (`push.*`), Mehr-Screen (Logout deregistriert Push), Benachrichtigungs-Präferenzen-Screen (Sync via Hook, INCIDENT nicht abwählbar)
- Test: `apps/mobile/src/lib/push/push-registration.test.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben** — `apps/mobile/src/lib/push/push-registration.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { disablePush, enablePush, type PushRegistrationDeps } from "./push-registration";

function makeDeps(overrides: Partial<PushRegistrationDeps> = {}): PushRegistrationDeps {
  return {
    getPermissions: vi.fn(async () => ({ status: "undetermined" as const })),
    requestPermissions: vi.fn(async () => ({ status: "granted" as const })),
    getExpoPushToken: vi.fn(async () => "ExponentPushToken[abc]"),
    platform: "ios",
    appVersion: "1.0.0",
    registerDevice: vi.fn(async () => {}),
    unregisterDevice: vi.fn(async () => {}),
    getStoredToken: vi.fn(async () => null),
    setStoredToken: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("enablePush (Spec §7.3 Nr. 1: Push-Opt-in mit Pre-Prompt)", () => {
  it("fragt Berechtigung an, lädt Token hoch und merkt ihn für die Deregistrierung", async () => {
    const deps = makeDeps();
    const result = await enablePush(deps);
    expect(result).toBe("registered");
    expect(deps.requestPermissions).toHaveBeenCalledOnce();
    expect(deps.registerDevice).toHaveBeenCalledWith({
      expoPushToken: "ExponentPushToken[abc]",
      platform: "ios",
      appVersion: "1.0.0",
    });
    expect(deps.setStoredToken).toHaveBeenCalledWith("ExponentPushToken[abc]");
  });

  it("registriert nichts, wenn die Berechtigung verweigert wird", async () => {
    const deps = makeDeps({
      requestPermissions: vi.fn(async () => ({ status: "denied" as const })),
    });
    expect(await enablePush(deps)).toBe("denied");
    expect(deps.registerDevice).not.toHaveBeenCalled();
  });

  it("überspringt die Systemabfrage bei bereits erteilter Berechtigung", async () => {
    const deps = makeDeps({ getPermissions: vi.fn(async () => ({ status: "granted" as const })) });
    expect(await enablePush(deps)).toBe("registered");
    expect(deps.requestPermissions).not.toHaveBeenCalled();
  });
});

describe("disablePush (Logout / Gerät entfernen)", () => {
  it("deregistriert den gespeicherten Token serverseitig und löscht ihn lokal", async () => {
    const deps = makeDeps({ getStoredToken: vi.fn(async () => "ExponentPushToken[abc]") });
    await disablePush(deps);
    expect(deps.unregisterDevice).toHaveBeenCalledWith("ExponentPushToken[abc]");
    expect(deps.setStoredToken).toHaveBeenCalledWith(null);
  });

  it("ist ohne gespeicherten Token ein No-op", async () => {
    const deps = makeDeps();
    await disablePush(deps);
    expect(deps.unregisterDevice).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Test rot sehen** — `pnpm --filter @ph360/mobile exec vitest run src/lib/push/push-registration.test.ts` → Resolve-Fehler `./push-registration`.

- [ ] **Step 3: Implementierung** — `apps/mobile/src/lib/push/push-registration.ts`:

```ts
export interface PushPermission {
  status: "granted" | "denied" | "undetermined";
}

/** Native/API-Abhängigkeiten als Interface — Fachlogik bleibt ohne RN-Runtime testbar. */
export interface PushRegistrationDeps {
  getPermissions(): Promise<PushPermission>;
  requestPermissions(): Promise<PushPermission>;
  getExpoPushToken(): Promise<string>;
  platform: "ios" | "android";
  appVersion: string;
  registerDevice(input: { expoPushToken: string; platform: "ios" | "android"; appVersion: string }): Promise<void>;
  unregisterDevice(expoPushToken: string): Promise<void>;
  getStoredToken(): Promise<string | null>;
  setStoredToken(token: string | null): Promise<void>;
}

export type EnablePushResult = "registered" | "denied";

/** Opt-in: Systemabfrage nur nach Pre-Permission-Screen; Token-Upload an POST /api/v1/app/push-devices. */
export async function enablePush(deps: PushRegistrationDeps): Promise<EnablePushResult> {
  let { status } = await deps.getPermissions();
  if (status === "undetermined") ({ status } = await deps.requestPermissions());
  if (status !== "granted") return "denied";
  const expoPushToken = await deps.getExpoPushToken();
  await deps.registerDevice({ expoPushToken, platform: deps.platform, appVersion: deps.appVersion });
  await deps.setStoredToken(expoPushToken);
  return "registered";
}

/** Beim Logout aufrufen (Spec §5.4: Push-Token-Änderungen serverseitig nachvollziehbar). */
export async function disablePush(deps: PushRegistrationDeps): Promise<void> {
  const token = await deps.getStoredToken();
  if (!token) return;
  await deps.unregisterDevice(token);
  await deps.setStoredToken(null);
}
```

- [ ] **Step 4: Test grün** — `pnpm --filter @ph360/mobile exec vitest run src/lib/push/push-registration.test.ts` → `Tests  5 passed`.

- [ ] **Step 5: Native Deps + Kanäle + Verdrahtung** — zuerst `cd apps/mobile && npx expo install expo-notifications`. `apps/mobile/src/lib/push/native-deps.ts`:

```ts
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { DataSource } from "../../data/data-source";
import type { PushPermission, PushRegistrationDeps } from "./push-registration";

const TOKEN_KEY = "ph360.push-token";

function toPermission(p: { granted: boolean; canAskAgain: boolean }): PushPermission {
  if (p.granted) return { status: "granted" };
  return { status: p.canAskAgain ? "undetermined" : "denied" };
}

export function createNativePushDeps(dataSource: DataSource): PushRegistrationDeps {
  return {
    getPermissions: async () => toPermission(await Notifications.getPermissionsAsync()),
    requestPermissions: async () => toPermission(await Notifications.requestPermissionsAsync()),
    getExpoPushToken: async () => {
      const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      return token.data;
    },
    platform: Platform.OS === "android" ? "android" : "ios",
    appVersion: Constants.expoConfig?.version ?? "0.0.0",
    registerDevice: (input) => dataSource.registerPushDevice(input),
    unregisterDevice: (expoPushToken) => dataSource.unregisterPushDevice(expoPushToken),
    getStoredToken: () => SecureStore.getItemAsync(TOKEN_KEY),
    setStoredToken: async (token) => {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    },
  };
}
```

`apps/mobile/src/lib/push/channels.ts` — Kanal-IDs müssen dem Worker-Mapping entsprechen (Task 8, `channelId = category.toLowerCase()`):

```ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/** Kategorien-Mapping Priorität 1–3 (Spec §3.3): billing=1, data_quality=2, incident=3 (MAX). */
export const PUSH_CHANNELS = [
  { id: "billing", name: "Rechnungen", importance: Notifications.AndroidImportance.DEFAULT },
  { id: "data_quality", name: "Messwert-Qualität", importance: Notifications.AndroidImportance.HIGH },
  { id: "incident", name: "Kritische Störungen", importance: Notifications.AndroidImportance.MAX },
] as const;

export async function setupNotificationChannels(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS !== "android") return;
  for (const channel of PUSH_CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
    });
  }
}
```

In `apps/mobile/src/app-providers.tsx` NUR zwei Ergänzungen vornehmen (Rest der Datei unverändert): (1) die Import-Zeile `import { setupNotificationChannels } from "./lib/push/channels";` ergänzen, (2) innerhalb der Komponente `AppProviders` (vor dem `return`) diesen Effekt ergänzen:

```tsx
useEffect(() => {
  void setupNotificationChannels();
}, []);
```

In `apps/mobile/app.json` unter `expo.plugins` ergänzen: `"expo-notifications"`.

- [ ] **Step 6: Pre-Permission-Screen + Präferenzen-Sync + Logout** — `apps/mobile/app/push-erklaerung.tsx`:

```tsx
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDataSource } from "../src/data/data-source-provider";
import { markPrompted } from "../src/lib/onboarding/use-onboarding-prompts";
import { createNativePushDeps } from "../src/lib/push/native-deps";
import { enablePush } from "../src/lib/push/push-registration";

/** Pre-Permission-Erklärscreen (Spec §7.3 Nr. 1): erst erklären, dann Systemdialog. */
export default function PushErklaerung() {
  const router = useRouter();
  const { t } = useTranslation();
  const dataSource = useDataSource();

  async function finish() {
    await markPrompted("push");
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container} testID="push-explain-screen">
      <Text style={styles.title}>{t("push.explainTitle")}</Text>
      <Text style={styles.body}>{t("push.explainBody")}</Text>
      <Pressable
        style={styles.primary}
        onPress={() => {
          void enablePush(createNativePushDeps(dataSource)).then(() => finish());
        }}
      >
        <Text style={styles.primaryText}>{t("push.enable")}</Text>
      </Pressable>
      <Pressable onPress={() => void finish()}>
        <Text style={styles.later}>{t("common.later")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22 },
  primary: { backgroundColor: "#3DB36A", padding: 14, borderRadius: 8, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "600" },
  later: { textAlign: "center", opacity: 0.7, padding: 8 },
});
```

`apps/mobile/src/lib/push/use-notification-preferences.ts`:

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationPreferencePutSchema } from "@ph360/api-contracts";
import type { z } from "zod";
import { useDataSource } from "../../data/data-source-provider";

/** PUT nimmt GENAU EINE Kategorie ({category, enabled}) — kanonisches Schema aus WP-APP-2 Task 3 (settings.ts). */
type NotificationPreferenceUpdate = z.infer<typeof notificationPreferencePutSchema>;

const KEY = ["notification-preferences"];

/** Präferenzen-Sync GET/PUT /api/v1/app/notification-preferences; Server bleibt Wahrheit. */
export function useNotificationPreferences() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: () => dataSource.getNotificationPreferences() });
  const mutation = useMutation({
    mutationFn: (input: NotificationPreferenceUpdate) => dataSource.updateNotificationPreferences(input),
    onSuccess: (data) => queryClient.setQueryData(KEY, data),
  });
  return { query, mutation };
}
```

**Modify Benachrichtigungs-Präferenzen-Screen** (WP-APP-3, z. B. `app/(tabs)/mehr/benachrichtigungen.tsx`): Datenbezug auf `useNotificationPreferences()` umstellen; je Kategorie ein `Switch`, INCIDENT nicht abwählbar (Spec §3.3):

```tsx
const { query, mutation } = useNotificationPreferences();
const requireNetwork = useRequireNetwork();
// je Eintrag pref aus query.data.categories (Response-Shape {categories:[{category,enabled,locked}]}):
<Switch
  value={pref.enabled}
  disabled={pref.locked} // Server liefert locked=true für INCIDENT (nicht abwählbar)
  onValueChange={(enabled) =>
    requireNetwork(() => mutation.mutate({ category: pref.category, enabled }))
  }
/>
```

**Modify Mehr-Screen (Logout):** vor dem Abmelden Push deregistrieren:

```tsx
import { createNativePushDeps } from "../../src/lib/push/native-deps";
import { disablePush } from "../../src/lib/push/push-registration";
// im Logout-Handler:
try {
  await disablePush(createNativePushDeps(dataSource));
} catch {
  // Abmelden darf nie an der Push-Deregistrierung scheitern (Server räumt via DeviceNotRegistered auf)
}
await authClient.signOut();
router.replace("/login");
```

`de.json` ergänzen:

```json
{
  "push": {
    "explainTitle": "Benachrichtigungen aktivieren?",
    "explainBody": "Wir informieren Sie über neue Rechnungen und gestörte Messwerte – ohne Werbung und ohne Verbrauchswerte im Sperrbildschirm. Kritische Störungsmeldungen sind nicht abwählbar. Kategorien können Sie jederzeit unter „Mehr → Benachrichtigungen“ anpassen.",
    "enable": "Push aktivieren"
  }
}
```

- [ ] **Step 7: Tests + Typecheck + Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm --filter @ph360/mobile exec vitest run src/lib/push
pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/lib/push apps/mobile/app/push-erklaerung.tsx apps/mobile/src/app-providers.tsx apps/mobile/app.json apps/mobile/src/i18n/locales/de.json "apps/mobile/app/(tabs)/mehr" apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): Push-Registrierung mit Pre-Permission-Screen, Kategorien-Kanälen und Präferenzen-Sync"
```

---

## Task 10: In-App-Datenschutzhinweise + AVV-Matrix (DSGVO-Paket Teil 1)

**Files:**
- Create: `apps/mobile/app/(tabs)/mehr/datenschutz.tsx`, `docs/DSGVO/AVV-MATRIX.md`
- Modify: `apps/mobile/src/i18n/locales/de.json` (`datenschutz.*`), Mehr-Screen (Eintrag „Datenschutz“)
- Test: `apps/mobile/src/i18n/datenschutz-keys.test.ts`

Inhaltsquelle (Spec §3.3 DSGVO, PO-Vorgabe): Der finale Text kommt vom PO; Ausgangspunkt/Platzhalter ist der bestehende Website-Datenschutztext (`apps/website`). Dieser Task erzeugt die Screen-Struktur mit vollständigem Platzhaltertext — Austausch ist reine i18n-Pflege ohne Codeänderung.

- [ ] **Step 1: Fehlschlagenden Test schreiben** — `apps/mobile/src/i18n/datenschutz-keys.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import de from "./locales/de.json";

const REQUIRED = [
  "title",
  "stand",
  "controllerTitle",
  "controllerBody",
  "dataTitle",
  "dataBody",
  "processorsTitle",
  "processorsBody",
  "rightsTitle",
  "rightsBody",
  "contactTitle",
  "contactBody",
] as const;

describe("Datenschutz-i18n (Spec §7.2: Mehr → Rechtliches)", () => {
  it("enthält alle Abschnitte mit nicht-leerem Text", () => {
    const section = (de as Record<string, unknown>).datenschutz as Record<string, string> | undefined;
    expect(section).toBeDefined();
    for (const key of REQUIRED) {
      expect(section?.[key], key).toBeTypeOf("string");
      expect(section?.[key]?.length ?? 0, key).toBeGreaterThan(10);
    }
  });
});
```

Rot: `pnpm --filter @ph360/mobile exec vitest run src/i18n/datenschutz-keys.test.ts` → `section` ist `undefined`.

- [ ] **Step 2: i18n-Inhalte** — `de.json` ergänzen:

```json
{
  "datenschutz": {
    "title": "Datenschutzhinweise",
    "stand": "Stand: Juli 2026 – vorläufige Fassung; finale Fassung vor TestFlight-Freigabe (WP-APP-5)",
    "controllerTitle": "Verantwortlicher",
    "controllerBody": "Verantwortlich für die Datenverarbeitung in dieser App ist die Betreibergesellschaft der Powerhouse-360-Plattform (AKL Powerhouse 360 GmbH; Kontaktangaben wie im Impressum auf powerhouse360.de).",
    "dataTitle": "Verarbeitete Daten",
    "dataBody": "Kontodaten (Name, E-Mail), Wohnungs- und Vertragsdaten, Verbrauchs- und Messwerte Ihrer Wohnung (15-Minuten-Werte), Rechnungen und Dokumente, der Push-Token Ihres Geräts sowie Ihre Support-Anfragen. Verbrauchsdaten je Wohnung sind personenbezogen und werden ausschließlich für Anzeige, Abrechnung und Störungserkennung verarbeitet.",
    "processorsTitle": "Empfänger und Auftragsverarbeiter",
    "processorsBody": "Das Hosting erfolgt auf Servern in Deutschland. Für Push-Benachrichtigungen werden Apple (APNs), Google (FCM) und Expo eingesetzt; Push-Inhalte enthalten keine Verbrauchswerte. Es werden keine Werbenetzwerke und keine Tracking-SDKs eingesetzt.",
    "rightsTitle": "Ihre Rechte",
    "rightsBody": "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit. Auskunfts- und Exportanfragen stellen Sie direkt in der App unter Mehr → Support/Kontakt.",
    "contactTitle": "Kontakt",
    "contactBody": "Fragen zum Datenschutz richten Sie über Mehr → Support/Kontakt oder per E-Mail an die im Impressum genannte Adresse."
  }
}
```

Grün: `pnpm --filter @ph360/mobile exec vitest run src/i18n/datenschutz-keys.test.ts` → `Tests  1 passed`.

- [ ] **Step 3: Screen + Navigation** — `apps/mobile/app/(tabs)/mehr/datenschutz.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text } from "react-native";

const SECTIONS = ["controller", "data", "processors", "rights", "contact"] as const;

/** Statischer Inhalt vollständig aus i18n (Spec §7.1: keine Texte im UI verstreut). */
export default function Datenschutz() {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.content} testID="datenschutz-screen">
      <Text style={styles.title}>{t("datenschutz.title")}</Text>
      <Text style={styles.stand}>{t("datenschutz.stand")}</Text>
      {SECTIONS.map((key) => (
        <Text key={key} style={styles.section}>
          <Text style={styles.heading}>
            {t(`datenschutz.${key}Title`)}
            {"\n"}
          </Text>
          {t(`datenschutz.${key}Body`)}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  stand: { fontSize: 12, opacity: 0.6 },
  section: { fontSize: 15, lineHeight: 22 },
  heading: { fontWeight: "600" },
});
```

**Modify Mehr-Screen:** NUR zwei Ergänzungen (Rest des Screens unverändert): (1) den Import `import { Link } from "expo-router";` ergänzen, falls noch nicht vorhanden, (2) unter „Rechtliches“ diesen Eintrag ergänzen:

```tsx
<Link href="/mehr/datenschutz" asChild>
  <Pressable testID="mehr-datenschutz">
    <Text>{t("datenschutz.title")}</Text>
  </Pressable>
</Link>
```

Danach: `pnpm --filter @ph360/mobile typecheck` → Exit 0.

- [ ] **Step 4: AVV-Matrix** — `docs/DSGVO/AVV-MATRIX.md` (neu, Verzeichnis anlegen):

```markdown
# AVV-/Verantwortlichkeits-Matrix — Kunden-App V1 (DSGVO-Paket Teil 1, WP-APP-4)

**Status:** Arbeitsstand WP-APP-4 · Vervollständigung: PO + WP-APP-5 (Privacy-URL, Store-Angaben, VVT-Beitrag)
**Grundsätze (bindend, Spec §3.3/V-04):** Push-Payloads enthalten keine Verbrauchswerte (nur Titel/Text/Referenz-IDs) · keine Werbenetzwerke, keine Tracking-SDKs · Dokument-Downloads nur über kurzlebige signierte URLs · Logins und Downloads werden auditiert.

## Verantwortlicher

| Rolle | Stelle | Anmerkung |
|---|---|---|
| Verantwortlicher (Art. 4 Nr. 7 DSGVO) | AKL Powerhouse 360 GmbH (Gesellschafts-Bestätigung liegt beim PO, Spec §8) | Betreiber von Plattform + App |

## Auftragsverarbeiter / Empfänger

| # | Dienst | Funktion | Datenkategorien | Standort/Region | AVV-/Garantie-Grundlage | Nächster Schritt (Owner) |
|---|---|---|---|---|---|---|
| 1 | Hostinger (VPS, Coolify) | Hosting Plattform, Postgres, MinIO | Stammdaten, Verbrauchswerte, Rechnungen/Dokumente, Sessions, Audit | Rechenzentrums-Standort dokumentieren (V-04) | AVV nach Art. 28 DSGVO | PO: Standortnachweis + AVV ablegen (vor Pilot) |
| 2 | Apple (APNs) | Push-Zustellung iOS | Push-Token, Meldungstitel/-text (ohne Verbrauchswerte) | Apple-Infrastruktur EU/US | Apple Developer Program License Agreement + SCC | PO: mit Apple-Account-Anlage dokumentieren |
| 3 | Google (FCM) | Push-Zustellung Android | wie APNs | Google-Infrastruktur EU/US | Google Data Processing Terms | erst mit Android-Beta aktivieren |
| 4 | Expo (EAS Build/Submit, Expo Push Service) | Build-Dienst + Push-Relay | Push-Token, Build-Artefakte (keine Kundendaten) | US | Expo DPA + SCC | PO: DPA akzeptieren + ablegen (vor TestFlight) |
| 5 | E-Mail-Versand (bestehender Mailer, WP-1.2) | Einladung, Passwort-Reset, Benachrichtigungs-Mail | E-Mail, Name | gemäß Bestandskonfiguration | in bestehende AVV-Lage aufnehmen | PO: prüfen |

## Nicht eingesetzte Kategorien

Werbenetzwerke, Tracking-/Analytics-SDKs, Social-Logins: **nicht eingesetzt** (PO-Vorgabe, Spec §3.3 f).

## Datenflüsse außerhalb DE/EU

Nur Push-Kette (APNs/FCM/Expo): Token + Meldungstext ohne Verbrauchswerte. Bewertung (ggf. Transfer Impact Assessment) wird mit den Store-/Privacy-Unterlagen in WP-APP-5 finalisiert.
```

- [ ] **Step 5: Commits**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add "apps/mobile/app/(tabs)/mehr" apps/mobile/src/i18n
git commit -m "feat(mobile): In-App-Datenschutzhinweise-Screen mit i18n-Inhalten"
git add docs/DSGVO/AVV-MATRIX.md
git commit -m "docs: AVV-/Verantwortlichkeits-Matrix (DSGVO-Paket Teil 1, WP-APP-4)"
```

---

## Task 11: Maestro-E2E-Suite — Gate F-APP-1 (E2E) gegen lokale Plattform mit Seed-Daten

**Files:**
- Create: `apps/mobile/e2e/flows/helpers/skip-onboarding.yaml`, `apps/mobile/e2e/flows/01-login.yaml`, `apps/mobile/e2e/flows/02-uebersicht.yaml`, `apps/mobile/e2e/flows/03-verbrauch.yaml`, `apps/mobile/e2e/flows/04-rechnung-pdf.yaml`, `apps/mobile/e2e/flows/05-offline.yaml`, `apps/mobile/e2e/run-e2e.sh`
- Modify: `apps/mobile/src/components/data-stand-badge.tsx` (testID), Rechnungsliste (testID `invoice-list-item`)

Vorbereitung (einmalig, dokumentieren im IMPLEMENTATION_LOG): Release-Build der App im iOS-Simulator installieren — `cd apps/mobile && cp .env.example .env && npx expo run:ios --configuration Release` (bettet `EXPO_PUBLIC_API_URL=http://localhost:3100`, `EXPO_PUBLIC_DATA_SOURCE=api` zur Buildzeit ein; kein Metro nötig). Simulator-Sprache Deutsch (Flows matchen deutsche Labels).

- [ ] **Step 1: testIDs für E2E sicherstellen** — In `apps/mobile/src/components/data-stand-badge.tsx` das `<Text>`-Element um `testID="data-stand-badge"` ergänzen. In der Rechnungsliste (WP-APP-3, `app/(tabs)/rechnungen/index.tsx`) jedem Listeneintrag `testID="invoice-list-item"` geben. Danach `pnpm --filter @ph360/mobile typecheck` → Exit 0.

- [ ] **Step 2: Helper + Flows 01–03** — `apps/mobile/e2e/flows/helpers/skip-onboarding.yaml`:

```yaml
appId: de.powerhouse360.app
---
- runFlow:
    when:
      visible: "App-Sperre aktivieren?"
    commands:
      - tapOn: "Später"
- runFlow:
    when:
      visible: "Benachrichtigungen aktivieren?"
    commands:
      - tapOn: "Später"
```

`apps/mobile/e2e/flows/01-login.yaml` (Login-Daten = WP-APP-2-Seed `pnpm db:seed:app`):

```yaml
appId: de.powerhouse360.app
---
- launchApp:
    clearState: true
- tapOn:
    id: "login-email"
- inputText: "resident@test.powerhouse360.de"
- tapOn:
    id: "login-password"
- inputText: "Test1234!powerhouse"
- tapOn: "Anmelden"
- runFlow: helpers/skip-onboarding.yaml
- assertVisible: "Übersicht"
```

`apps/mobile/e2e/flows/02-uebersicht.yaml`:

```yaml
appId: de.powerhouse360.app
---
- launchApp
- runFlow: helpers/skip-onboarding.yaml
- assertVisible: "Übersicht"
- assertVisible:
    id: "data-stand-badge"
- assertVisible: "Stand .*"
```

`apps/mobile/e2e/flows/03-verbrauch.yaml`:

```yaml
appId: de.powerhouse360.app
---
- launchApp
- runFlow: helpers/skip-onboarding.yaml
- tapOn: "Verbrauch"
- tapOn: "Monat"
- assertVisible: ".*kWh.*"
- tapOn: "Tag"
- assertVisible:
    id: "data-stand-badge"
```

Ausführen (Plattform läuft, Seed eingespielt — Kommandos siehe Step 4-Skript): `cd apps/mobile && maestro test e2e/flows/01-login.yaml e2e/flows/02-uebersicht.yaml e2e/flows/03-verbrauch.yaml` → 3 Flows `PASSED`. Weichen WP-APP-3-Labels/testIDs ab, gilt die Abweichungsregel aus den Vorbedingungen.

- [ ] **Step 3: Flow 04 Rechnung-PDF** — `apps/mobile/e2e/flows/04-rechnung-pdf.yaml` (Beweis „offline erneut öffenbar“ = Button-Label wechselt auf den Offline-Bestand aus Task 6):

```yaml
appId: de.powerhouse360.app
---
- launchApp
- runFlow: helpers/skip-onboarding.yaml
- tapOn: "Rechnungen"
- tapOn:
    id: "invoice-list-item"
    index: 0
- assertVisible: "PDF ansehen"
- tapOn:
    id: "document-open-button"
- runFlow:
    when:
      visible: "Schließen"
    commands:
      - tapOn: "Schließen"
- runFlow:
    when:
      visible: "Abbrechen"
    commands:
      - tapOn: "Abbrechen"
- extendedWaitUntil:
    visible: "Offline verfügbar – PDF ansehen"
    timeout: 15000
```

Ausführen: `maestro test e2e/flows/04-rechnung-pdf.yaml` → `PASSED`.

- [ ] **Step 4: Offline-Flow + Runner** — `apps/mobile/e2e/flows/05-offline.yaml` (läuft nach Stopp der Plattform: App liest ausschließlich aus verschlüsseltem Cache + lokalem Dokumentbestand):

```yaml
appId: de.powerhouse360.app
---
- launchApp
- runFlow: helpers/skip-onboarding.yaml
- assertVisible: "Übersicht"
- assertVisible:
    id: "data-stand-badge"
- tapOn: "Rechnungen"
- tapOn:
    id: "invoice-list-item"
    index: 0
- assertVisible: "Offline verfügbar – PDF ansehen"
- tapOn:
    id: "document-open-button"
- runFlow:
    when:
      visible: "Schließen"
    commands:
      - tapOn: "Schließen"
```

Hinweis (bewusste Abgrenzung): Der echte Offline-Banner + „Aktion braucht Netz“-Hinweis hängen am Netzwerkstatus des Geräts (expo-network), der sich im iOS-Simulator nicht skriptbar abschalten lässt. Flow 05 verifiziert deshalb den Cache-/Dokumente-Pfad „Server nicht erreichbar“; Banner + Hinweis sind unit-getestet (Task 4) und werden in der Abschluss-Checkliste einmal manuell verifiziert (Mac-WLAN aus).

`apps/mobile/e2e/run-e2e.sh`:

```bash
#!/usr/bin/env bash
# F-APP-1 (E2E): Seed → Plattform starten → Flows 01–04 → Plattform stoppen → Offline-Flow 05
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

echo "→ Seed Testmandant (Resident + Aggregate + Rechnung/PDF)"
pnpm db:seed:app

echo "→ Plattform starten (:3100)"
pnpm --filter @ph360/platform dev >/tmp/ph360-platform-e2e.log 2>&1 &
PLATFORM_PID=$!
trap 'kill "$PLATFORM_PID" 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do
  curl -fsS http://localhost:3100/api/v1/app/config >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://localhost:3100/api/v1/app/config >/dev/null

cd apps/mobile
maestro test \
  e2e/flows/01-login.yaml \
  e2e/flows/02-uebersicht.yaml \
  e2e/flows/03-verbrauch.yaml \
  e2e/flows/04-rechnung-pdf.yaml

echo "→ Offline-Szenario: Plattform stoppen"
kill "$PLATFORM_PID"
wait "$PLATFORM_PID" 2>/dev/null || true
maestro test e2e/flows/05-offline.yaml

echo "✓ F-APP-1 (E2E): alle 5 Flows grün"
```

Danach: `chmod +x apps/mobile/e2e/run-e2e.sh` und Gesamtlauf `./apps/mobile/e2e/run-e2e.sh` → endet mit `✓ F-APP-1 (E2E): alle 5 Flows grün`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add apps/mobile/e2e apps/mobile/src/components/data-stand-badge.tsx "apps/mobile/app/(tabs)/rechnungen"
git commit -m "test(mobile): Maestro-E2E-Suite Login→Übersicht→Verbrauch→Rechnung-PDF→Offline (Gate F-APP-1 E2E)"
```

---

## Abschluss-Checkliste

- [ ] **Gate-Verifikation F-APP-1 (E2E):**
  - `pnpm vitest run --project unit` grün (inkl. Worker-Push-Sender, Mobile ausgenommen — eigene Suite)
  - `pnpm vitest run --project integration` grün (inkl. Task 7 Download-Audit, Task 8 Push-Anti-Spam)
  - `pnpm --filter @ph360/mobile exec vitest run` und `pnpm --filter @ph360/mobile typecheck` grün
  - `./apps/mobile/e2e/run-e2e.sh` komplett grün (5 Flows)
  - Manuell (einmalig, da Simulator-Netz nicht skriptbar): Mac-WLAN aus → App zeigt Offline-Banner (`offline.banner`), Support-Submit zeigt „Keine Verbindung“-Alert; WLAN wieder an → Refetch läuft. Ergebnis im IMPLEMENTATION_LOG festhalten.
  - Dark+Light-Durchsicht der Kern-Screens (Spec §9: Screenshots ablegen/referenzieren)
- [ ] **IMPLEMENTATION_LOG-Eintrag WP-APP-4** (append-only): Ergebnis, F-APP-1-(E2E)-Nachweis, Abweichungen laut Abweichungsregel (tatsächliche WP-APP-2/3-Namen), bewusst Nichtgetestetes (Statusregel Spec §9)
- [ ] **Masterplan-Statuspflege:** WP-APP-4 auf 🟢 erst nach tatsächlich durchlaufenem Nutzerfluss; F-APP-1 (E2E) in der E2E-Matrix als bestanden markieren; EXECUTION_ROADMAP nachführen; Spec §13 Änderungsverlauf ergänzen
- [ ] **DSGVO-Paket Teil 1 übergeben:** `docs/DSGVO/AVV-MATRIX.md` committet; V-04-Stand (Hostinger-Standort) dokumentiert; offene Punkte (Privacy-URL, Store-Angaben, VVT, finaler Datenschutztext) explizit an WP-APP-5/PO übergeben
- [ ] Kein `git push` (kein Remote, Repo-Regel) — alle Commits lokal auf `feat/platform-foundation`
