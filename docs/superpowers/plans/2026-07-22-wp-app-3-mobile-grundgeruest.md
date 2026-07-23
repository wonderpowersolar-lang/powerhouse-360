# WP-APP-3 — Mobile-App-Grundgerüst (Expo, gegen Mocks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/mobile` als demo-fähige Expo-App (iOS-Simulator) mit expo-router-Navigation, Light/Dark-Theme, i18n, Auth-Flow-UI und allen Kern-Screens gegen eine typgeprüfte `MockDataSource` auf Basis der finalen `@ph360/api-contracts`-Schemas.

**Architecture:** Die App ist reine Darstellung (Spec §2.3): ein `DataSource`-Interface (Typen aus `@ph360/api-contracts`) trennt Screens von der Datenquelle; in WP-APP-3 liefert `MockDataSource` deterministische, gegen die Zod-Schemas geparste Fixtures (inkl. Lücken- und Vorläufig-Fällen), in WP-APP-4 ersetzt `ApiDataSource` sie ohne Screen-Änderung. Navigation über expo-router (Auth-Stack + Tab-Stack mit `Stack.Protected`), Server-State über TanStack Query, Theme aus DESIGN-DIRECTION-Farben (Default: Systemeinstellung), alle Texte über i18next (`de` aktiv, `en` leeres Gerüst).

**Tech Stack:** Expo SDK 54 (React Native, TypeScript, expo-router, expo-font, expo-secure-store, expo-linking, expo-constants) · TanStack Query v5 · i18next + react-i18next · Victory Native XL + @shopify/react-native-skia · @expo-google-fonts/sora · jest-expo + @testing-library/react-native · pnpm-Workspace (`@ph360/mobile`) · zod ^3.24.1 (workspace-einheitlich, R-A8).

**Vorbedingungen:**

- **WP-1.2 grün** (better-auth ^1.6.23 auf `apps/platform`, `/api/auth/[...all]` erreichbar unter `http://localhost:3100`) — nur für den V-01-Spike (Task 7) nötig; alle übrigen Tasks laufen ohne Plattform.
- **WP-APP-2 Contract-Freeze:** `packages/api-contracts` (`@ph360/api-contracts`, ESM, Export `src/index.ts`, zod ^3.24.1) existiert und exportiert exakt die in WP-APP-2 Task 3 definierten App-Contracts (bei Abweichung zuerst `packages/api-contracts` als Quelle nehmen und Task 5 daran ausrichten, niemals umgekehrt):
  - `appResolutionSchema = z.enum(["hour","day","week","month","year"])`, Typ `AppResolution`; `consumptionQuerySchema`, Typ `ConsumptionQuery`: `{ resolution, from, to }` (Zeiten ISO-8601 UTC)
  - `meResponseSchema`, Typen `MeResponse`, `AppContext`: `{ user: { id, email, name, locale }, contexts: [{ id (UUID), unitLabel, buildingName, contractNumber: string|null, validFrom, validTo: string|null, expired: boolean }] }` (Zeiten ISO-8601 UTC)
  - `summaryResponseSchema`, Typ `SummaryResponse`: `{ lastReading: { valueKwh: string, ts: string }|null, today: { kwh: string, hasGaps: boolean }, month: { kwh: string, costCents: number|null, projectedMonthEndCents: number|null, previousMonthKwh: string|null, deltaToPreviousMonthPct: number|null }, split: { available: boolean, pvKwh: string|null, gridKwh: string|null, savingsCents: number|null }, dataStatus: { lastReceivedAt: string|null, hasOpenGaps: boolean, isPreliminary: boolean } }` (kWh = Dezimal-String mit exakt 3 Nachkommastellen, Geld = Integer-Cent)
  - `consumptionResponseSchema`, Typen `ConsumptionResponse`, `ConsumptionPoint`: `{ resolution, from, to, points: [{ periodStart, kwhTotal: string, kwhPv: string|null, kwhGrid: string|null, costCents: number|null, hasGaps: boolean, isPreliminary: boolean }], previousPeriodKwh: string|null, deltaToPreviousPeriodPct: number|null, avgPriceCentsPerKwh: number|null, savingsCents: number|null }`
  - `dataStatusResponseSchema`, Typ `DataStatusResponse`: `{ lastReceivedAt: string|null, openGaps: [{ firstAt, lastAt }], disturbance: boolean }`
  - `invoiceListResponseSchema`, Typen `InvoiceListResponse`, `InvoiceSummary`: `{ items: [{ id (UUID), number, periodStart, periodEnd, totalCents, status: "DRAFT"|"ISSUED"|"PAID"|"CANCELLED" }], nextCursor: string(UUID)|null }` (kein `documentId` in der Liste — der kommt erst im Detail `invoiceDetailResponseSchema`)
  - `contractResponseSchema`, Typ `ContractResponse`: `{ contractNumber, status: "DRAFT"|"ACTIVE"|"ENDED"|"CANCELLED", startAt, endAt: string|null, tariff: { name, validFrom, workPricePvCents, workPriceGridCents, basePriceCents } }`
  - `configResponseSchema`, Typ `ConfigResponse`: `{ minAppVersion: string, privacyUrl: string, imprintUrl: string, features: { co2: boolean } }`
- pnpm-Workspace-Glob umfasst `apps/*` (`apps/mobile` existiert bereits mit README, Commit `2f21de0`).
- Xcode + iOS-Simulator lokal installiert (Gate-Verifikation Task 11).

---

## Dateistruktur

**Neu (alle Pfade relativ zu `apps/mobile/`):**

| Datei | Verantwortung |
|---|---|
| `package.json` | Workspace-Paket `@ph360/mobile`, Scripts, jest-expo-Konfiguration |
| `app.json` | Expo-Konfiguration: `supportsTablet:false`, Bundle-ID `de.powerhouse360.app` (Platzhalter bis Apple-Account), Scheme, Plugins |
| `tsconfig.json` | TS-Konfiguration (extends `expo/tsconfig.base`, strict) |
| `babel.config.js` | babel-preset-expo + Reanimated-Plugin |
| `metro.config.js` | Monorepo-Metro: `watchFolders` = Repo-Root, `nodeModulesPaths` (pnpm-Symlinks) |
| `index.ts` | Entry (`expo-router/entry`) |
| `.gitignore` | `.expo/`, `ios/`, `android/` (Prebuild-Artefakte), `.env` |
| `.env.example` | `EXPO_PUBLIC_AUTH_URL`, `EXPO_PUBLIC_AUTH_MODE` |
| `jest.setup.ts` | Test-Setup: expo-router-/Reanimated-/SecureStore-Mocks |
| `app/_layout.tsx` | Root-Layout: AppProviders + Auth-Gate (`Stack.Protected`) |
| `app/index.tsx` | Einstieg: Redirect je Session-Status |
| `app/(auth)/_layout.tsx` | Auth-Stack |
| `app/(auth)/welcome.tsx` | Willkommen-Screen |
| `app/(auth)/login.tsx` | Login-Screen (E-Mail+Passwort) |
| `app/(auth)/forgot-password.tsx` | Passwort-vergessen-Screen |
| `app/(auth)/invite/[token].tsx` | Einladung-annehmen-Screen (Deep Link) |
| `app/(tabs)/_layout.tsx` | Tab-Stack: Übersicht · Verbrauch · Rechnungen · Mehr |
| `app/(tabs)/uebersicht.tsx` | Übersicht: Heute-/Kosten-/Split-Karten, Datenstand-Badge, Kontext-Umschalter |
| `app/(tabs)/verbrauch.tsx` | Verbrauch: Segmente, Chart mit Lücken, Drilldown Tag→Stunden |
| `app/(tabs)/rechnungen.tsx` | Rechnungsliste (Mock) |
| `app/(tabs)/mehr.tsx` | Mehr-Menü ohne tote Einträge + Profil read-only |
| `app/vertrag.tsx` | Vertrags-/Tarifansicht (Modal aus „Mehr") |
| `src/app-providers.tsx` | Provider-Komposition (Theme, i18n, Query, DataSource, Session, ActiveContext, Fonts) |
| `src/theme/tokens.ts` | Farb-/Spacing-/Typo-Tokens Light+Dark (DESIGN-DIRECTION) |
| `src/theme/ThemeProvider.tsx` | Theme-Context, Default = Systemeinstellung |
| `src/theme/fonts.ts` | Sora via expo-font laden |
| `src/i18n/index.ts` | i18next-Init (de aktiv, en Gerüst) |
| `src/i18n/de.json` | Alle UI-Texte deutsch |
| `src/i18n/en.json` | Leeres Gerüst |
| `src/components/states.tsx` | LoadingView, EmptyView, ErrorView, OfflineBanner |
| `src/components/cards.tsx` | StatCard + Heute-/Kosten-/Split-Karten |
| `src/components/context-switcher.tsx` | Kontext-Umschalter (nur bei >1 Kontext) |
| `src/components/data-status-badge.tsx` | Datenstand-Badge (ok/gaps/outage, vorläufig) |
| `src/components/consumption-chart.tsx` | Victory-Native-XL-Chart mit Lücken-Segmenten + A11y-Textliste |
| `src/data/data-source.ts` | `DataSource`-Interface (+ Re-Export `ConsumptionQuery` aus `@ph360/api-contracts`) |
| `src/data/DataSourceProvider.tsx` | React-Context + `useDataSource()` |
| `src/data/mock/fixtures.ts` | Deterministische Fixture-Generierung (Lastprofil, Lücken, vorläufig) |
| `src/data/mock/mock-data-source.ts` | `MockDataSource implements DataSource` (schema-geparst) |
| `src/lib/secure-store.ts` | expo-secure-store-Wrapper |
| `src/lib/format.ts` | de-Formatierung: kWh, Cent→€, Prozent, Zeitstempel |
| `src/state/SessionProvider.tsx` | Session-Status (Mock-Login), Persistenz via SecureStore |
| `src/state/ActiveContextProvider.tsx` | Aktiver PowerParticipant-Kontext, persistiert |
| `src/auth/auth-client.ts` | V-01-Spike: better-auth-Expo-Client + dokumentierter REST-Fallback |
| `src/test/render.tsx` | `renderWithProviders`-Testutility |
| `src/**/__tests__/*.test.ts(x)` | Jest-Tests (je Screen ≥ 1 Render-Test, Umschalter-Zustandstests) |

**Geändert:**

| Datei | Änderung |
|---|---|
| Root `package.json` | Script `mobile:ios`, `mobile:test` |
| `docs/IMPLEMENTATION_LOG.md` | Gate-Eintrag WP-APP-3 (Task 11) |

---

## Task 1: Workspace-Scaffold `apps/mobile` + jest-expo-Harness

**Files:**
- Create: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js`, `apps/mobile/index.ts`, `apps/mobile/.gitignore`, `apps/mobile/.env.example`, `apps/mobile/jest.setup.ts`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- Modify: Root `package.json` (Scripts)
- Test: `apps/mobile/src/__tests__/smoke.test.tsx`

- [ ] **Step 1: Paket-Manifest anlegen**

`apps/mobile/package.json` (Deps kommen in Step 3 via `expo install`, damit SDK-kompatible Versionen aufgelöst werden):

```json
{
  "name": "@ph360/mobile",
  "version": "0.1.0",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~54.0.0"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFiles": [
      "@shopify/react-native-skia/jestSetup.js",
      "react-native-gesture-handler/jestSetup.js"
    ],
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
    "transformIgnorePatterns": [
      "node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-css-interop|victory-native|@shopify/react-native-skia))"
    ]
  }
}
```

`apps/mobile/app.json`:

```json
{
  "expo": {
    "name": "Powerhouse 360",
    "slug": "powerhouse360",
    "scheme": "powerhouse360",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "de.powerhouse360.app"
    },
    "android": {
      "package": "de.powerhouse360.app"
    },
    "plugins": ["expo-router", "expo-font", "expo-secure-store"],
    "experiments": { "typedRoutes": true }
  }
}
```

`apps/mobile/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["jest"]
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "ios", "android"]
}
```

`apps/mobile/babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

`apps/mobile/metro.config.js` (pnpm-Monorepo: Workspace-Root beobachten, beide node_modules auflösen):

```js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
module.exports = config;
```

`apps/mobile/index.ts`:

```ts
import "expo-router/entry";
```

`apps/mobile/.gitignore`:

```
.expo/
ios/
android/
.env
```

`apps/mobile/.env.example`:

```
# Basis-URL der Plattform (better-auth) — nur für den V-01-Spike (Task 7) nötig.
EXPO_PUBLIC_AUTH_URL=http://localhost:3100
# "mock" (Default, WP-APP-3) | "better-auth" (WP-APP-4)
EXPO_PUBLIC_AUTH_MODE=mock
```

- [ ] **Step 2: Minimales Router-Layout + Startscreen**

`apps/mobile/app/_layout.tsx` (wird in Task 8 durch die Provider-/Gate-Fassung ersetzt):

```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`apps/mobile/app/index.tsx` (Platzhalter, wird in Task 8 durch den Session-Redirect ersetzt):

```tsx
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Powerhouse 360</Text>
    </View>
  );
}
```

- [ ] **Step 3: Dependencies installieren (SDK-kompatibel via `expo install`)**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
pnpm install
pnpm --filter @ph360/mobile exec expo install react react-native expo-router expo-font expo-secure-store expo-status-bar expo-splash-screen expo-linking expo-constants react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated react-native-svg @shopify/react-native-skia @expo/vector-icons
pnpm --filter @ph360/mobile add @tanstack/react-query i18next react-i18next victory-native @expo-google-fonts/sora
pnpm --filter @ph360/mobile add -D jest jest-expo @testing-library/react-native @types/jest react-test-renderer typescript
```

Erwartet: Installation ohne Peer-Konflikte; `expo install` pinnt SDK-54-kompatible Versionen.

- [ ] **Step 4: Fehlschlagenden Smoke-Test schreiben**

`apps/mobile/jest.setup.ts`:

```ts
// Globale Mocks für jest-expo: expo-router, Reanimated, SecureStore.
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

jest.mock("expo-router", () => {
  const routerMock = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  const passthrough = ({ children }: { children?: unknown }) => children ?? null;
  return {
    useRouter: () => routerMock,
    useLocalSearchParams: jest.fn(() => ({})),
    Redirect: () => null,
    Link: passthrough,
    Stack: Object.assign(passthrough, {
      Screen: () => null,
      Protected: passthrough,
    }),
    Tabs: Object.assign(passthrough, { Screen: () => null }),
    __routerMock: routerMock,
  };
});

const secureStoreMem = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k: string) => secureStoreMem.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    secureStoreMem.set(k, v);
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    secureStoreMem.delete(k);
  }),
}));

beforeEach(() => {
  secureStoreMem.clear();
});
```

`apps/mobile/src/__tests__/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

test("jest-expo-Harness rendert React-Native-Komponenten", () => {
  render(<Text>Powerhouse 360</Text>);
  expect(screen.getByText("Powerhouse 360")).toBeOnTheScreen();
});
```

- [ ] **Step 5: Test ausführen**

```bash
pnpm --filter @ph360/mobile test
```

Erwartet: 1 Test grün (`smoke.test.tsx`). Falls `transformIgnorePatterns` unter pnpm nicht greift (SyntaxError „Unexpected token export" aus node_modules): Pattern gemäß Fehlermeldung um das betroffene Paket erweitern und erneut ausführen.

- [ ] **Step 6: Typecheck + Root-Scripts**

```bash
pnpm --filter @ph360/mobile typecheck
```

Erwartet: exit 0. In Root-`package.json` unter `scripts` ergänzen (bestehende Scripts unverändert lassen):

```json
"mobile:ios": "pnpm --filter @ph360/mobile ios",
"mobile:test": "pnpm --filter @ph360/mobile test"
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/leonliedtke/Desktop/AKL POWERHOUSE 360"
git add apps/mobile package.json pnpm-lock.yaml
git commit -m "feat(mobile): Expo-Grundgerüst apps/mobile (Monorepo-Metro, expo-router, jest-expo)"
```

---

## Task 2: Theme-System Light/Dark (DESIGN-DIRECTION) + Sora

**Files:**
- Create: `apps/mobile/src/theme/tokens.ts`, `apps/mobile/src/theme/ThemeProvider.tsx`, `apps/mobile/src/theme/fonts.ts`
- Test: `apps/mobile/src/theme/__tests__/theme.test.tsx`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`apps/mobile/src/theme/__tests__/theme.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import { palette } from "../tokens";
import { ThemeProvider, useTheme } from "../ThemeProvider";

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(() => "light"),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("ThemeProvider", () => {
  it("folgt der Systemeinstellung (Default light)", () => {
    (useColorScheme as jest.Mock).mockReturnValue("light");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.scheme).toBe("light");
    expect(result.current.colors.background).toBe(palette.offWhite);
    expect(result.current.colors.textPrimary).toBe(palette.deepNavy);
  });

  it("folgt der Systemeinstellung dark", () => {
    (useColorScheme as jest.Mock).mockReturnValue("dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.scheme).toBe("dark");
    expect(result.current.colors.background).toBe(palette.deepNavy);
    expect(result.current.colors.surface).toBe(palette.charcoal);
    expect(result.current.colors.textPrimary).toBe(palette.offWhite);
  });

  it("liefert Akzentfarben aus der DESIGN-DIRECTION", () => {
    (useColorScheme as jest.Mock).mockReturnValue("light");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.colors.accent).toBe(palette.green);
    expect(result.current.colors.warning).toBe(palette.warmWindow);
    expect(result.current.colors.info).toBe(palette.cyan);
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm --filter @ph360/mobile test -- theme
```

Erwartet: FAIL (Module `../tokens` / `../ThemeProvider` existieren nicht).

- [ ] **Step 3: Tokens implementieren**

`apps/mobile/src/theme/tokens.ts`:

```ts
/** DESIGN-DIRECTION-Farben (docs/DESIGN-DIRECTION.md) — einzige Farbquelle der App. */
export const palette = {
  deepNavy: "#0D1626",
  charcoal: "#16243F",
  offWhite: "#F4F6F8",
  softGray: "#9FB0C4",
  warmWindow: "#F5BE75",
  green: "#3DB36A",
  cyan: "#2BB6B0",
  white: "#FFFFFF",
  danger: "#D64545",
} as const;

export type ColorScheme = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  warning: string;
  info: string;
  danger: string;
  border: string;
  tabInactive: string;
}

export const themeColors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: palette.offWhite,
    surface: palette.white,
    textPrimary: palette.deepNavy,
    textSecondary: "#5A6B82",
    accent: palette.green,
    warning: palette.warmWindow,
    info: palette.cyan,
    danger: palette.danger,
    border: "#DDE4EC",
    tabInactive: palette.softGray,
  },
  dark: {
    background: palette.deepNavy,
    surface: palette.charcoal,
    textPrimary: palette.offWhite,
    textSecondary: palette.softGray,
    accent: palette.green,
    warning: palette.warmWindow,
    info: palette.cyan,
    danger: "#E06C6C",
    border: "#243352",
    tabInactive: "#5A6B82",
  },
};

export const spacing = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
export const radius = { s: 8, m: 12, l: 20 } as const;

export const fontFamily = {
  regular: "Sora_400Regular",
  semiBold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
} as const;
```

- [ ] **Step 4: ThemeProvider + Fonts implementieren**

`apps/mobile/src/theme/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import {
  themeColors,
  type ColorScheme,
  type ThemeColors,
} from "./tokens";

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
}

const ThemeContext = createContext<Theme | null>(null);

/** Default = Systemeinstellung (Spec §7.4: Dark + Light vollständig). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" ? "dark" : "light";
  const value = useMemo<Theme>(
    () => ({ scheme, colors: themeColors[scheme] }),
    [scheme],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme außerhalb von <ThemeProvider>");
  return theme;
}
```

`apps/mobile/src/theme/fonts.ts`:

```ts
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
  useFonts,
} from "@expo-google-fonts/sora";

/** Lädt Sora via expo-font; liefert true sobald renderbar. */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({ Sora_400Regular, Sora_600SemiBold, Sora_700Bold });
  return loaded;
}
```

- [ ] **Step 5: Test grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- theme && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/theme
git commit -m "feat(mobile): Theme-System Light/Dark mit DESIGN-DIRECTION-Farben und Sora"
```

Erwartet: 3 Tests grün, Typecheck exit 0.

---

## Task 3: i18next-Setup (de aktiv, en Gerüst)

**Files:**
- Create: `apps/mobile/src/i18n/index.ts`, `apps/mobile/src/i18n/de.json`, `apps/mobile/src/i18n/en.json`
- Test: `apps/mobile/src/i18n/__tests__/i18n.test.ts`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`apps/mobile/src/i18n/__tests__/i18n.test.ts`:

```ts
import { initI18n } from "../index";

describe("i18n", () => {
  const i18n = initI18n();

  it("ist mit de als aktiver Sprache initialisiert", () => {
    expect(i18n.language).toBe("de");
    expect(i18n.t("tabs.uebersicht")).toBe("Übersicht");
    expect(i18n.t("tabs.verbrauch")).toBe("Verbrauch");
    expect(i18n.t("tabs.rechnungen")).toBe("Rechnungen");
    expect(i18n.t("tabs.mehr")).toBe("Mehr");
  });

  it("fällt für en (leeres Gerüst) auf de zurück", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("tabs.uebersicht")).toBe("Übersicht");
    await i18n.changeLanguage("de");
  });

  it("interpoliert Werte", () => {
    expect(i18n.t("uebersicht.datenstandZeit", { zeit: "14:32" })).toBe(
      "Stand 14:32",
    );
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm --filter @ph360/mobile test -- i18n
```

Erwartet: FAIL (Modul `../index` existiert nicht).

- [ ] **Step 3: Übersetzungen + Init implementieren**

`apps/mobile/src/i18n/de.json` (einzige aktive Sprache — ALLE UI-Texte hier, keine Strings in Screens):

```json
{
  "common": {
    "laden": "Wird geladen …",
    "fehlerTitel": "Etwas ist schiefgelaufen",
    "erneutVersuchen": "Erneut versuchen",
    "keineDaten": "Keine Daten vorhanden",
    "offlineHinweis": "Keine Verbindung — Aktionen erfordern eine Internetverbindung.",
    "abbrechen": "Abbrechen",
    "ok": "OK"
  },
  "tabs": {
    "uebersicht": "Übersicht",
    "verbrauch": "Verbrauch",
    "rechnungen": "Rechnungen",
    "mehr": "Mehr"
  },
  "auth": {
    "willkommenTitel": "Willkommen bei Powerhouse 360",
    "willkommenText": "Dein Stromverbrauch, deine Kosten und deine Unterlagen — alles an einem Ort.",
    "anmelden": "Anmelden",
    "einladungHinweis": "Du hast eine Einladung per E-Mail erhalten? Öffne den Link aus der E-Mail, um dein Konto einzurichten.",
    "email": "E-Mail",
    "passwort": "Passwort",
    "passwortVergessen": "Passwort vergessen?",
    "loginFehler": "Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.",
    "resetTitel": "Passwort zurücksetzen",
    "resetText": "Gib deine E-Mail-Adresse ein. Du erhältst einen Link zum Zurücksetzen.",
    "resetSenden": "Link senden",
    "resetGesendet": "E-Mail versendet. Bitte prüfe dein Postfach.",
    "einladungTitel": "Einladung annehmen",
    "einladungText": "Lege Name und Passwort fest, um dein Konto zu aktivieren.",
    "name": "Name",
    "kontoErstellen": "Konto erstellen",
    "einladungFehler": "Einladung ungültig oder abgelaufen."
  },
  "uebersicht": {
    "heuteTitel": "Heute",
    "heuteVerbrauch": "Verbrauch heute",
    "letzterMesswert": "Letzter Messwert",
    "kostenTitel": "Kosten",
    "kostenMonat": "Laufender Monat",
    "hochrechnung": "Hochrechnung Monatsende",
    "hochrechnungHinweis": "Hochrechnung",
    "vormonat": "Vormonat (gleicher Zeitraum)",
    "splitTitel": "PV & Netz",
    "pvAnteil": "PV / Mieterstrom",
    "netzAnteil": "Netzbezug",
    "ersparnis": "Mieterstrom-Ersparnis",
    "datenstandZeit": "Stand {{zeit}}",
    "datenstandOk": "Daten aktuell",
    "datenstandLuecken": "Datenlücken",
    "datenstandStoerung": "Störung",
    "vorlaeufig": "vorläufig",
    "hinweisLuecken": "Für diesen Zeitraum fehlen Messwerte. Werte sind vorläufig.",
    "hinweisStoerung": "Die Messwertübertragung ist gestört. Wir arbeiten daran.",
    "kontextWechseln": "Verbrauchsstelle wählen"
  },
  "verbrauch": {
    "tag": "Tag",
    "woche": "Woche",
    "monat": "Monat",
    "jahr": "Jahr",
    "luecke": "Lücke",
    "vergleichVorperiode": "Vergleich Vorperiode",
    "durchschnittspreis": "Ø-Preis",
    "ersparnis": "Mieterstrom-Ersparnis",
    "stundenVon": "Stunden am {{tag}}",
    "zurueckZurTagesansicht": "Zurück zur Tagesansicht",
    "chartZusammenfassung": "Verbrauchswerte als Liste",
    "keineWerte": "Für diesen Zeitraum liegen keine Messwerte vor."
  },
  "rechnungen": {
    "titel": "Rechnungen",
    "leer": "Noch keine Rechnungen vorhanden.",
    "statusDraft": "Entwurf",
    "statusIssued": "Offen",
    "statusPaid": "Bezahlt",
    "statusCancelled": "Storniert",
    "zeitraum": "Zeitraum"
  },
  "mehr": {
    "titel": "Mehr",
    "profil": "Profil",
    "vertrag": "Vertrag & Tarif",
    "sprache": "Sprache",
    "spracheAktuell": "Deutsch",
    "rechtliches": "Rechtliches",
    "datenschutz": "Datenschutz",
    "impressum": "Impressum",
    "lizenzen": "Lizenzen",
    "appInfo": "App-Version",
    "abmelden": "Abmelden"
  },
  "vertrag": {
    "titel": "Vertrag & Tarif",
    "vertragsnummer": "Vertragsnummer",
    "status": "Status",
    "laufzeitBeginn": "Vertragsbeginn",
    "tarif": "Tarif",
    "arbeitspreisPv": "Arbeitspreis PV/Mieterstrom",
    "arbeitspreisNetz": "Arbeitspreis Netz",
    "grundpreis": "Grundpreis (monatlich)",
    "preisProKwh": "{{preis}} / kWh"
  }
}
```

`apps/mobile/src/i18n/en.json` (leeres Gerüst — Aktivierung später über `resources`):

```json
{}
```

`apps/mobile/src/i18n/index.ts`:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./de.json";
import en from "./en.json";

/** Idempotente Initialisierung: de aktiv, en vorbereitet (Fallback de). */
export function initI18n(): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      lng: "de",
      fallbackLng: "de",
      resources: { de: { translation: de }, en: { translation: en } },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
  return i18n;
}
```

- [ ] **Step 4: Test grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- i18n && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/i18n
git commit -m "feat(mobile): i18next-Setup — de.json vollständig, en.json Gerüst"
```

Erwartet: 3 Tests grün.

---

## Task 4: Wiederverwendbare Zustandskomponenten (Loading/Empty/Error/Offline)

**Files:**
- Create: `apps/mobile/src/components/states.tsx`
- Test: `apps/mobile/src/components/__tests__/states.test.tsx`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`apps/mobile/src/components/__tests__/states.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { initI18n } from "../../i18n";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { EmptyView, ErrorView, LoadingView, OfflineBanner } from "../states";

initI18n();

function renderThemed(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Zustandskomponenten", () => {
  it("LoadingView zeigt Ladehinweis", () => {
    renderThemed(<LoadingView />);
    expect(screen.getByText("Wird geladen …")).toBeOnTheScreen();
  });

  it("EmptyView zeigt Titel", () => {
    renderThemed(<EmptyView title="Noch keine Rechnungen vorhanden." />);
    expect(
      screen.getByText("Noch keine Rechnungen vorhanden."),
    ).toBeOnTheScreen();
  });

  it("ErrorView zeigt Meldung und ruft onRetry", () => {
    const onRetry = jest.fn();
    renderThemed(<ErrorView onRetry={onRetry} />);
    expect(screen.getByText("Etwas ist schiefgelaufen")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Erneut versuchen"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("OfflineBanner zeigt Offline-Hinweis", () => {
    renderThemed(<OfflineBanner />);
    expect(
      screen.getByText(
        "Keine Verbindung — Aktionen erfordern eine Internetverbindung.",
      ),
    ).toBeOnTheScreen();
  });
});
```

- [ ] **Step 2: Test rot sehen**

```bash
pnpm --filter @ph360/mobile test -- states
```

Erwartet: FAIL (`../states` existiert nicht).

- [ ] **Step 3: Komponenten implementieren**

`apps/mobile/src/components/states.tsx`:

```tsx
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";

export function LoadingView() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.m, backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular }}>
        {t("common.laden")}
      </Text>
    </View>
  );
}

export function EmptyView({ title, hint }: { title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.s, padding: spacing.l }}>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.semiBold, fontSize: 16, textAlign: "center" }}>
        {title}
      </Text>
      {hint ? (
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, textAlign: "center" }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.m, padding: spacing.l }}>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.semiBold, fontSize: 16, textAlign: "center" }}>
        {t("common.fehlerTitel")}
      </Text>
      {message ? (
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={{ backgroundColor: colors.accent, borderRadius: radius.m, paddingHorizontal: spacing.l, paddingVertical: spacing.s }}
      >
        <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.semiBold }}>
          {t("common.erneutVersuchen")}
        </Text>
      </Pressable>
    </View>
  );
}

export function OfflineBanner() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: colors.warning, paddingHorizontal: spacing.m, paddingVertical: spacing.s }}>
      <Text style={{ color: "#0D1626", fontFamily: fontFamily.regular, fontSize: 13 }}>
        {t("common.offlineHinweis")}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: Test grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- states && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/components
git commit -m "feat(mobile): wiederverwendbare Loading/Empty/Error/Offline-Zustände"
```

Erwartet: 4 Tests grün.

---

## Task 5: `DataSource`-Interface + `MockDataSource` mit deterministischen, schema-geparsten Fixtures

**Files:**
- Create: `apps/mobile/src/data/data-source.ts`, `apps/mobile/src/data/mock/fixtures.ts`, `apps/mobile/src/data/mock/mock-data-source.ts`, `apps/mobile/src/data/DataSourceProvider.tsx`
- Modify: `apps/mobile/package.json` (Dep `@ph360/api-contracts`)
- Test: `apps/mobile/src/data/mock/__tests__/fixtures.test.ts`, `apps/mobile/src/data/mock/__tests__/mock-data-source.test.ts`

- [ ] **Step 1: Contracts-Dependency verdrahten**

```bash
pnpm --filter @ph360/mobile add "@ph360/api-contracts@workspace:*" "zod@^3.24.1"
```

Erwartet: Workspace-Link auf `packages/api-contracts` (WP-APP-2). Falls das Paket noch keine App-Schemas exportiert: STOPP — Vorbedingung nicht erfüllt (Contract-Freeze abwarten).

- [ ] **Step 2: Fehlschlagende Fixture-Tests schreiben (Schema-Parse = Kern der Teststrategie, Spec §9 „Contract")**

`apps/mobile/src/data/mock/__tests__/fixtures.test.ts`:

```ts
import {
  configResponseSchema,
  contractResponseSchema,
  dataStatusResponseSchema,
  invoiceListResponseSchema,
  meResponseSchema,
  summaryResponseSchema,
} from "@ph360/api-contracts";
import {
  GAP_DAY_ISO,
  MOCK_NOW_ISO,
  buildConsumption,
  buildMockData,
} from "../fixtures";

describe("Mock-Fixtures", () => {
  const data = buildMockData();

  it("alle statischen Fixtures parsen gegen die Zod-Schemas", () => {
    expect(meResponseSchema.safeParse(data.me).success).toBe(true);
    for (const ctx of data.me.contexts) {
      expect(
        summaryResponseSchema.safeParse(data.summaries[ctx.id])
          .success,
      ).toBe(true);
      expect(
        dataStatusResponseSchema.safeParse(data.dataStatus[ctx.id])
          .success,
      ).toBe(true);
    }
    expect(invoiceListResponseSchema.safeParse(data.invoices).success).toBe(true);
    expect(contractResponseSchema.safeParse(data.contract).success).toBe(true);
    expect(configResponseSchema.safeParse(data.config).success).toBe(true);
  });

  it("ist deterministisch (zweifacher Build identisch)", () => {
    expect(JSON.stringify(buildMockData())).toBe(JSON.stringify(buildMockData()));
  });

  it("enthält zwei Kontexte, davon einer beendet (expired)", () => {
    expect(data.me.contexts).toHaveLength(2);
    expect(data.me.contexts.filter((c) => c.expired)).toHaveLength(1);
  });

  it("buildMockData({ contextCount: 1 }) liefert genau einen Kontext", () => {
    expect(buildMockData({ contextCount: 1 }).me.contexts).toHaveLength(1);
  });

  it("Tagesauflösung Juli enthält den Lückentag (hasGaps, kwhTotal \"0.000\", Split null)", () => {
    const ctxId = data.me.contexts[0]!.id;
    const res = buildConsumption(ctxId, {
      resolution: "day",
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-22T00:00:00.000Z",
    });
    const gapPoint = res.points.find((p) => p.periodStart.startsWith(GAP_DAY_ISO));
    expect(gapPoint).toBeDefined();
    expect(gapPoint!.hasGaps).toBe(true);
    expect(gapPoint!.kwhTotal).toBe("0.000");
    expect(gapPoint!.kwhPv).toBeNull();
    expect(res.points.some((p) => !p.hasGaps && p.kwhTotal !== "0.000")).toBe(true);
  });

  it("Punkte am Mock-Heute sind vorläufig (isPreliminary)", () => {
    const ctxId = data.me.contexts[0]!.id;
    const res = buildConsumption(ctxId, {
      resolution: "day",
      from: "2026-07-20T00:00:00.000Z",
      to: "2026-07-22T00:00:00.000Z",
    });
    const today = res.points.find((p) => p.periodStart.startsWith(MOCK_NOW_ISO.slice(0, 10)));
    expect(today).toBeDefined();
    expect(today!.isPreliminary).toBe(true);
  });

  it("Stundenauflösung: kWh als Dezimal-String mit 3 Nachkommastellen", () => {
    const ctxId = data.me.contexts[0]!.id;
    const res = buildConsumption(ctxId, {
      resolution: "hour",
      from: "2026-07-21T00:00:00.000Z",
      to: "2026-07-21T23:00:00.000Z",
    });
    expect(res.points).toHaveLength(24);
    for (const p of res.points.filter((x) => !x.hasGaps)) {
      expect(p.kwhTotal).toMatch(/^\d+\.\d{3}$/);
    }
  });
});
```

`apps/mobile/src/data/mock/__tests__/mock-data-source.test.ts`:

```ts
import { MockDataSource } from "../mock-data-source";
import { buildMockData } from "../fixtures";

describe("MockDataSource", () => {
  const ds = new MockDataSource(buildMockData(), 0);

  it("liefert /me schema-konform", async () => {
    const me = await ds.getMe();
    expect(me.contexts.length).toBeGreaterThan(0);
    expect(me.user.email).toContain("@");
  });

  it("liefert Summary je Kontext und wirft für unbekannte Kontexte", async () => {
    const me = await ds.getMe();
    const summary = await ds.getSummary(me.contexts[0]!.id);
    expect(summary.today.kwh).toMatch(/^\d+\.\d{3}$/);
    await expect(ds.getSummary("gibt-es-nicht")).rejects.toThrow("NOT_FOUND");
  });

  it("liefert Verbrauch, Rechnungen, Vertrag, Config", async () => {
    const me = await ds.getMe();
    const id = me.contexts[0]!.id;
    const cons = await ds.getConsumption(id, {
      resolution: "day",
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-22T00:00:00.000Z",
    });
    expect(cons.resolution).toBe("day");
    expect((await ds.getInvoices(id)).items).toHaveLength(3);
    expect((await ds.getContract(id)).contractNumber).toBeTruthy();
    expect((await ds.getConfig()).minAppVersion).toBe("0.1.0");
  });
});
```

- [ ] **Step 3: Tests rot sehen**

```bash
pnpm --filter @ph360/mobile test -- data/mock
```

Erwartet: FAIL (Module existieren nicht).

- [ ] **Step 4: `DataSource`-Interface implementieren**

`apps/mobile/src/data/data-source.ts`:

```ts
import type {
  ConfigResponse,
  ConsumptionQuery,
  ConsumptionResponse,
  ContractResponse,
  DataStatusResponse,
  InvoiceListResponse,
  MeResponse,
  SummaryResponse,
} from "@ph360/api-contracts";

/** Kanonischer Query-Typ aus den Contracts (WP-APP-2 `consumptionQuerySchema`) — re-exportiert für App-interne Importe. */
export type { ConsumptionQuery } from "@ph360/api-contracts";

/**
 * Einziger Datenzugang der Screens (Spec §2.3 Nr. 4 „Keine Demo-Architektur").
 * WP-APP-3: MockDataSource. WP-APP-4: ApiDataSource (gleiche Typen aus
 * @ph360/api-contracts — Mock und echter Client sind garantiert typgleich).
 */
export interface DataSource {
  getMe(): Promise<MeResponse>;
  getSummary(contextId: string): Promise<SummaryResponse>;
  getConsumption(contextId: string, query: ConsumptionQuery): Promise<ConsumptionResponse>;
  getDataStatus(contextId: string): Promise<DataStatusResponse>;
  getInvoices(contextId: string): Promise<InvoiceListResponse>;
  getContract(contextId: string): Promise<ContractResponse>;
  getConfig(): Promise<ConfigResponse>;
}
```

- [ ] **Step 5: Deterministische Fixtures implementieren**

`apps/mobile/src/data/mock/fixtures.ts`:

```ts
import {
  configResponseSchema,
  consumptionResponseSchema,
  contractResponseSchema,
  dataStatusResponseSchema,
  invoiceListResponseSchema,
  meResponseSchema,
  summaryResponseSchema,
  type ConfigResponse,
  type ConsumptionQuery,
  type ConsumptionResponse,
  type ContractResponse,
  type DataStatusResponse,
  type InvoiceListResponse,
  type MeResponse,
  type SummaryResponse,
} from "@ph360/api-contracts";

/** Fixierter „Jetzt"-Zeitpunkt — macht alle Fixtures deterministisch. */
export const MOCK_NOW_ISO = "2026-07-22T14:30:00.000Z";
/** Ganztägige Datenlücke in der Tagesansicht (Spec-Scope: Lücken-Fall). */
export const GAP_DAY_ISO = "2026-07-15";
/** Stunden-Lücke 08–15 Uhr UTC am 18.07. (Drilldown-Lücken-Fall). */
export const GAP_HOURS = { day: "2026-07-18", fromHour: 8, toHour: 15 } as const;

/** PowerParticipant-IDs (UUIDs — `appContextSchema.id` ist `z.string().uuid()`). */
export const CTX_ACTIVE = "018c2f7e-0000-4000-8000-0000000000a1";
export const CTX_EXPIRED = "018c2f7e-0000-4000-8000-0000000000b2";

const WORK_PRICE_PV_CENTS = 27;
const WORK_PRICE_GRID_CENTS = 38;
const PV_SHARE_DAY = 0.55;

/** FNV-1a-basiertes deterministisches Rauschen in [0, 1). */
function hashNoise(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Lastprofil Tag/Nacht (lokale Zeit ≈ UTC+2, Sommer). */
function dayShape(hourUtc: number): number {
  const local = (hourUtc + 2) % 24;
  if (local < 6) return 0.35;
  if (local < 9) return 1.1;
  if (local < 17) return 0.7;
  if (local < 22) return 1.5;
  return 0.6;
}

function kwh3(n: number): string {
  return n.toFixed(3);
}

function isGapHour(d: Date): boolean {
  const dayIso = d.toISOString().slice(0, 10);
  if (dayIso === GAP_DAY_ISO) return true;
  return (
    dayIso === GAP_HOURS.day &&
    d.getUTCHours() >= GAP_HOURS.fromHour &&
    d.getUTCHours() <= GAP_HOURS.toHour
  );
}

/** Deterministische kWh einer Stunde je Kontext (ohne Lückenprüfung). */
export function hourlyKwh(contextId: string, ts: Date): number {
  const base = contextId === CTX_EXPIRED ? 0.42 : 0.31;
  const noise = hashNoise(contextId + ts.toISOString()) * 0.12;
  return base * dayShape(ts.getUTCHours()) + noise;
}

interface PeriodValue {
  kwh: number;
  /** Anteil der Stunden der Periode, die in einer Lücke liegen. */
  gapRatio: number;
  hours: number;
}

function sumHours(contextId: string, start: Date, hours: number): PeriodValue {
  let kwh = 0;
  let gapHours = 0;
  for (let i = 0; i < hours; i++) {
    const t = new Date(start.getTime() + i * 3_600_000);
    if (isGapHour(t)) {
      gapHours += 1;
    } else {
      kwh += hourlyKwh(contextId, t);
    }
  }
  return { kwh, gapRatio: hours === 0 ? 0 : gapHours / hours, hours };
}

function addPeriod(d: Date, resolution: ConsumptionQuery["resolution"]): Date {
  const n = new Date(d);
  if (resolution === "hour") n.setUTCHours(n.getUTCHours() + 1);
  else if (resolution === "day") n.setUTCDate(n.getUTCDate() + 1);
  else if (resolution === "week") n.setUTCDate(n.getUTCDate() + 7);
  else if (resolution === "month") n.setUTCMonth(n.getUTCMonth() + 1);
  else n.setUTCFullYear(n.getUTCFullYear() + 1);
  return n;
}

/** Verbrauchszeitreihe — deterministisch, mit Lücken- und Vorläufig-Fällen. */
export function buildConsumption(
  contextId: string,
  query: ConsumptionQuery,
): ConsumptionResponse {
  const now = new Date(MOCK_NOW_ISO);
  const points: ConsumptionResponse["points"] = [];
  let cursor = new Date(query.from);
  const end = new Date(query.to);
  let totalKwh = 0;
  let totalCost = 0;

  while (cursor.getTime() <= end.getTime() && points.length < 400) {
    const next = addPeriod(cursor, query.resolution);
    const hours = Math.round((next.getTime() - cursor.getTime()) / 3_600_000);
    const v =
      query.resolution === "hour"
        ? ((): PeriodValue => {
            const gap = isGapHour(cursor);
            return {
              kwh: gap ? 0 : hourlyKwh(contextId, cursor),
              gapRatio: gap ? 1 : 0,
              hours: 1,
            };
          })()
        : sumHours(contextId, cursor, hours);

    const isFullGap = v.gapRatio >= 1;
    const isPreliminary = next.getTime() > now.getTime() || v.gapRatio > 0;
    const pv = v.kwh * PV_SHARE_DAY;
    const grid = v.kwh - pv;
    const costCents = Math.round(pv * WORK_PRICE_PV_CENTS + grid * WORK_PRICE_GRID_CENTS);

    points.push({
      periodStart: cursor.toISOString(),
      // kwhTotal ist im Contract NICHT nullable — Voll-Lücken liefern "0.000" + hasGaps.
      kwhTotal: isFullGap ? "0.000" : kwh3(v.kwh),
      kwhPv: isFullGap ? null : kwh3(pv),
      kwhGrid: isFullGap ? null : kwh3(grid),
      costCents: isFullGap ? null : costCents,
      hasGaps: v.gapRatio > 0,
      isPreliminary,
    });
    if (!isFullGap) {
      totalKwh += v.kwh;
      totalCost += costCents;
    }
    cursor = next;
  }

  return consumptionResponseSchema.parse({
    resolution: query.resolution,
    from: query.from,
    to: query.to,
    points,
    previousPeriodKwh: totalKwh > 0 ? kwh3(totalKwh * 1.044) : null,
    deltaToPreviousPeriodPct: -4.2,
    avgPriceCentsPerKwh: totalKwh > 0 ? Math.round((totalCost / totalKwh) * 10) / 10 : null,
    savingsCents: totalKwh > 0 ? Math.round(totalKwh * PV_SHARE_DAY * (WORK_PRICE_GRID_CENTS - WORK_PRICE_PV_CENTS)) : null,
  });
}

export interface MockData {
  me: MeResponse;
  summaries: Record<string, SummaryResponse>;
  dataStatus: Record<string, DataStatusResponse>;
  invoices: InvoiceListResponse;
  contract: ContractResponse;
  config: ConfigResponse;
}

export function buildMockData(opts: { contextCount?: 1 | 2 } = {}): MockData {
  const contextCount = opts.contextCount ?? 2;
  const now = new Date(MOCK_NOW_ISO);

  const contexts = [
    {
      id: CTX_ACTIVE,
      unitLabel: "WE 07, 2. OG links",
      buildingName: "Christinenstraße 12",
      contractNumber: "PM-2026-0007",
      validFrom: "2026-03-01T00:00:00.000Z",
      validTo: null,
      expired: false,
    },
    {
      id: CTX_EXPIRED,
      unitLabel: "WE 03, EG rechts",
      buildingName: "Christinenstraße 12",
      contractNumber: "PM-2025-0003",
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: "2026-02-28T23:59:59.000Z",
      expired: true,
    },
  ].slice(0, contextCount);

  const me = meResponseSchema.parse({
    user: {
      id: "user-mock-01",
      email: "bewohner@example.test",
      name: "Alex Bewohner",
      locale: "de",
    },
    contexts,
  });

  const summaries: Record<string, SummaryResponse> = {};
  const dataStatus: Record<string, DataStatusResponse> = {};
  for (const ctx of contexts) {
    const today = sumHours(
      ctx.id,
      new Date("2026-07-22T00:00:00.000Z"),
      now.getUTCHours(),
    );
    const pv = today.kwh * PV_SHARE_DAY;
    const grid = today.kwh - pv;
    const monthToDate = sumHours(
      ctx.id,
      new Date("2026-07-01T00:00:00.000Z"),
      21 * 24 + now.getUTCHours(),
    );
    const mtdCost = Math.round(
      monthToDate.kwh * PV_SHARE_DAY * WORK_PRICE_PV_CENTS +
        monthToDate.kwh * (1 - PV_SHARE_DAY) * WORK_PRICE_GRID_CENTS,
    );
    summaries[ctx.id] = summaryResponseSchema.parse({
      lastReading: { valueKwh: "004321.375", ts: "2026-07-22T14:15:00.000Z" },
      today: { kwh: kwh3(today.kwh), hasGaps: false },
      month: {
        kwh: kwh3(monthToDate.kwh),
        costCents: mtdCost,
        projectedMonthEndCents: Math.round((mtdCost / 21.6) * 31),
        previousMonthKwh: kwh3(monthToDate.kwh * 1.07),
        deltaToPreviousMonthPct: -6.5,
      },
      split: {
        available: true,
        pvKwh: kwh3(pv),
        gridKwh: kwh3(grid),
        savingsCents: Math.round(pv * (WORK_PRICE_GRID_CENTS - WORK_PRICE_PV_CENTS)),
      },
      dataStatus: {
        lastReceivedAt: "2026-07-22T14:17:03.000Z",
        hasOpenGaps: true,
        isPreliminary: true,
      },
    });
    dataStatus[ctx.id] = dataStatusResponseSchema.parse({
      lastReceivedAt: "2026-07-22T14:17:03.000Z",
      openGaps: [
        { firstAt: `${GAP_DAY_ISO}T00:00:00.000Z`, lastAt: `${GAP_DAY_ISO}T23:59:59.000Z` },
        {
          firstAt: `${GAP_HOURS.day}T08:00:00.000Z`,
          lastAt: `${GAP_HOURS.day}T15:59:59.000Z`,
        },
      ],
      disturbance: false,
    });
  }

  const invoices = invoiceListResponseSchema.parse({
    // IDs sind UUIDs (`invoiceSummarySchema.id`); documentId gibt es nur im Detail-Contract.
    items: [
      { id: "018c2f7e-0000-4000-8000-000000000601", number: "R-2026-0142", periodStart: "2026-06-01T00:00:00.000Z", periodEnd: "2026-06-30T23:59:59.000Z", totalCents: 5834, status: "ISSUED" },
      { id: "018c2f7e-0000-4000-8000-000000000501", number: "R-2026-0117", periodStart: "2026-05-01T00:00:00.000Z", periodEnd: "2026-05-31T23:59:59.000Z", totalCents: 6120, status: "PAID" },
      { id: "018c2f7e-0000-4000-8000-000000000401", number: "R-2026-0089", periodStart: "2026-04-01T00:00:00.000Z", periodEnd: "2026-04-30T23:59:59.000Z", totalCents: 6512, status: "PAID" },
    ],
    nextCursor: null,
  });

  const contract = contractResponseSchema.parse({
    contractNumber: "PM-2026-0007",
    status: "ACTIVE",
    startAt: "2026-03-01T00:00:00.000Z",
    endAt: null,
    tariff: {
      name: "Powermieter Basis 2026",
      workPricePvCents: WORK_PRICE_PV_CENTS,
      workPriceGridCents: WORK_PRICE_GRID_CENTS,
      basePriceCents: 990,
      validFrom: "2026-01-01T00:00:00.000Z",
    },
  });

  const config = configResponseSchema.parse({
    minAppVersion: "0.1.0",
    privacyUrl: "https://powerhouse360.de/datenschutz",
    imprintUrl: "https://powerhouse360.de/impressum",
    features: { co2: false },
  });

  return { me, summaries, dataStatus, invoices, contract, config };
}
```

- [ ] **Step 6: `MockDataSource` + Provider implementieren**

`apps/mobile/src/data/mock/mock-data-source.ts`:

```ts
import type {
  ConfigResponse,
  ConsumptionQuery,
  ConsumptionResponse,
  ContractResponse,
  DataStatusResponse,
  InvoiceListResponse,
  MeResponse,
  SummaryResponse,
} from "@ph360/api-contracts";
import type { DataSource } from "../data-source";
import { buildConsumption, buildMockData, type MockData } from "./fixtures";

/** Simulierte Netzlatenz; Tests übergeben 0. */
const DEFAULT_DELAY_MS = 150;

export class MockDataSource implements DataSource {
  constructor(
    private readonly data: MockData = buildMockData(),
    private readonly delayMs: number = DEFAULT_DELAY_MS,
  ) {}

  private async respond<T>(value: T): Promise<T> {
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
    return value;
  }

  private requireContext<T>(map: Record<string, T>, contextId: string): T {
    const value = map[contextId];
    if (!value) throw new Error(`NOT_FOUND: unbekannter Kontext ${contextId}`);
    return value;
  }

  getMe(): Promise<MeResponse> {
    return this.respond(this.data.me);
  }

  getSummary(contextId: string): Promise<SummaryResponse> {
    return this.respond(this.requireContext(this.data.summaries, contextId));
  }

  getConsumption(contextId: string, query: ConsumptionQuery): Promise<ConsumptionResponse> {
    this.requireContext(this.data.summaries, contextId);
    return this.respond(buildConsumption(contextId, query));
  }

  getDataStatus(contextId: string): Promise<DataStatusResponse> {
    return this.respond(this.requireContext(this.data.dataStatus, contextId));
  }

  getInvoices(contextId: string): Promise<InvoiceListResponse> {
    this.requireContext(this.data.summaries, contextId);
    return this.respond(this.data.invoices);
  }

  getContract(contextId: string): Promise<ContractResponse> {
    this.requireContext(this.data.summaries, contextId);
    return this.respond(this.data.contract);
  }

  getConfig(): Promise<ConfigResponse> {
    return this.respond(this.data.config);
  }
}
```

`apps/mobile/src/data/DataSourceProvider.tsx`:

```tsx
import { createContext, useContext, type ReactNode } from "react";
import type { DataSource } from "./data-source";

const DataSourceContext = createContext<DataSource | null>(null);

export function DataSourceProvider({
  dataSource,
  children,
}: {
  dataSource: DataSource;
  children: ReactNode;
}) {
  return (
    <DataSourceContext.Provider value={dataSource}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource(): DataSource {
  const ds = useContext(DataSourceContext);
  if (!ds) throw new Error("useDataSource außerhalb von <DataSourceProvider>");
  return ds;
}
```

- [ ] **Step 7: Tests grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- data/mock && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/data apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): DataSource-Interface + MockDataSource mit deterministischen, schema-geparsten Fixtures"
```

Erwartet: 10 Tests grün (7 Fixture- + 3 MockDataSource-Tests). Damit ist „Mock ≠ API ⇒ build-brechend" erfüllt (Spec §9 Contract-Ebene).

---

## Task 6: SecureStore-Wrapper + Session-/Kontext-Provider + Provider-Komposition

**Files:**
- Create: `apps/mobile/src/lib/secure-store.ts`, `apps/mobile/src/state/SessionProvider.tsx`, `apps/mobile/src/state/ActiveContextProvider.tsx`, `apps/mobile/src/app-providers.tsx`, `apps/mobile/src/test/render.tsx`
- Test: `apps/mobile/src/lib/__tests__/secure-store.test.ts`, `apps/mobile/src/state/__tests__/session.test.tsx`

- [ ] **Step 1: Fehlschlagende Tests schreiben**

`apps/mobile/src/lib/__tests__/secure-store.test.ts`:

```ts
import { deleteItem, getItem, setItem } from "../secure-store";

describe("secure-store-Wrapper", () => {
  it("Roundtrip set/get/delete mit ph360.-Präfix", async () => {
    await setItem("session", "abc");
    expect(await getItem("session")).toBe("abc");
    const SecureStore = jest.requireMock("expo-secure-store");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("ph360.session", "abc");
    await deleteItem("session");
    expect(await getItem("session")).toBeNull();
  });

  it("getItem liefert null bei Store-Fehler (defensiv)", async () => {
    const SecureStore = jest.requireMock("expo-secure-store");
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("keychain"));
    expect(await getItem("session")).toBeNull();
  });
});
```

`apps/mobile/src/state/__tests__/session.test.tsx`:

```tsx
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "../SessionProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

describe("SessionProvider (Mock-Modus)", () => {
  it("startet restoring → signedOut ohne persistierte Session", async () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedOut"));
  });

  it("signIn persistiert und setzt signedIn; signOut löscht", async () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedOut"));
    await act(() => result.current.signIn("bewohner@example.test", "pw-123456"));
    expect(result.current.status).toBe("signedIn");
    expect(result.current.email).toBe("bewohner@example.test");
    await act(() => result.current.signOut());
    expect(result.current.status).toBe("signedOut");
  });

  it("signIn lehnt leere Eingaben ab", async () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedOut"));
    await expect(act(() => result.current.signIn("", ""))).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Tests rot sehen**

```bash
pnpm --filter @ph360/mobile test -- "secure-store|session"
```

Erwartet: FAIL (Module existieren nicht).

- [ ] **Step 3: Wrapper + Provider implementieren**

`apps/mobile/src/lib/secure-store.ts`:

```ts
import * as SecureStore from "expo-secure-store";

const PREFIX = "ph360.";

/** Keychain/Keystore-Wrapper (Spec §5.1). Fehler werden defensiv geschluckt. */
export async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PREFIX + key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PREFIX + key, value);
  } catch {
    // Persistenzfehler dürfen die UI nie crashen.
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PREFIX + key);
  } catch {
    // s. o.
  }
}
```

`apps/mobile/src/state/SessionProvider.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { deleteItem, getItem, setItem } from "../lib/secure-store";

const SESSION_KEY = "session.email";

export type SessionStatus = "restoring" | "signedOut" | "signedIn";

export interface SessionState {
  status: SessionStatus;
  email: string | null;
  /** WP-APP-3: Mock-Login (Eingabe-Validierung + Persistenz). WP-APP-4 ersetzt
   *  die Implementierung durch den better-auth-Client (Task 7, V-01-Spike). */
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("restoring");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getItem(SESSION_KEY).then((stored) => {
      if (cancelled) return;
      setEmail(stored);
      setStatus(stored ? "signedIn" : "signedOut");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (mail: string, password: string) => {
    if (!mail.trim() || password.length < 8) {
      throw new Error("VALIDATION_FAILED");
    }
    await setItem(SESSION_KEY, mail.trim());
    setEmail(mail.trim());
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    await deleteItem(SESSION_KEY);
    setEmail(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo<SessionState>(
    () => ({ status, email, signIn, signOut }),
    [status, email, signIn, signOut],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const s = useContext(SessionContext);
  if (!s) throw new Error("useSession außerhalb von <SessionProvider>");
  return s;
}
```

`apps/mobile/src/state/ActiveContextProvider.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppContext } from "@ph360/api-contracts";
import { useDataSource } from "../data/DataSourceProvider";
import { getItem, setItem } from "../lib/secure-store";

const ACTIVE_KEY = "context.activeId";

export interface ActiveContextState {
  contexts: AppContext[];
  activeId: string | null;
  active: AppContext | null;
  setActiveId(id: string): void;
  isLoading: boolean;
  isError: boolean;
  refetch(): void;
}

const ActiveContext = createContext<ActiveContextState | null>(null);

/** Hält den aktiven PowerParticipant-Kontext; Auswahl persistiert (Spec §7.3 Nr. 6). */
export function ActiveContextProvider({ children }: { children: ReactNode }) {
  const ds = useDataSource();
  const me = useQuery({ queryKey: ["me"], queryFn: () => ds.getMe() });
  const [activeId, setActiveIdState] = useState<string | null>(null);

  const contexts = useMemo(() => me.data?.contexts ?? [], [me.data]);

  useEffect(() => {
    if (contexts.length === 0 || activeId) return;
    let cancelled = false;
    void getItem(ACTIVE_KEY).then((stored) => {
      if (cancelled) return;
      const valid = contexts.find((c) => c.id === stored);
      setActiveIdState(valid?.id ?? contexts[0]!.id);
    });
    return () => {
      cancelled = true;
    };
  }, [contexts, activeId]);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    void setItem(ACTIVE_KEY, id);
  }, []);

  const value = useMemo<ActiveContextState>(
    () => ({
      contexts,
      activeId,
      active: contexts.find((c) => c.id === activeId) ?? null,
      setActiveId,
      isLoading: me.isLoading,
      isError: me.isError,
      refetch: () => void me.refetch(),
    }),
    [contexts, activeId, setActiveId, me.isLoading, me.isError, me.refetch],
  );
  return <ActiveContext.Provider value={value}>{children}</ActiveContext.Provider>;
}

export function useActiveContext(): ActiveContextState {
  const s = useContext(ActiveContext);
  if (!s) throw new Error("useActiveContext außerhalb von <ActiveContextProvider>");
  return s;
}
```

- [ ] **Step 4: Provider-Komposition + Test-Utility**

`apps/mobile/src/app-providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import type { DataSource } from "./data/data-source";
import { DataSourceProvider } from "./data/DataSourceProvider";
import { MockDataSource } from "./data/mock/mock-data-source";
import { initI18n } from "./i18n";
import { ActiveContextProvider } from "./state/ActiveContextProvider";
import { SessionProvider } from "./state/SessionProvider";
import { ThemeProvider } from "./theme/ThemeProvider";

/** Eine Komposition für App UND Tests — identisches Verhalten (DRY). */
export function AppProviders({
  children,
  dataSource,
}: {
  children: ReactNode;
  dataSource?: DataSource;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
      }),
  );
  const [ds] = useState<DataSource>(() => dataSource ?? new MockDataSource());
  return (
    <I18nextProvider i18n={initI18n()}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <DataSourceProvider dataSource={ds}>
            <SessionProvider>
              <ActiveContextProvider>{children}</ActiveContextProvider>
            </SessionProvider>
          </DataSourceProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
```

`apps/mobile/src/test/render.tsx`:

```tsx
import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { AppProviders } from "../app-providers";
import type { DataSource } from "../data/data-source";
import { buildMockData } from "../data/mock/fixtures";
import { MockDataSource } from "../data/mock/mock-data-source";

/** Screens in Tests immer mit echten Providern rendern (delayMs 0). */
export function renderWithProviders(
  ui: ReactElement,
  opts: { dataSource?: DataSource; contextCount?: 1 | 2 } = {},
) {
  const ds =
    opts.dataSource ??
    new MockDataSource(buildMockData({ contextCount: opts.contextCount ?? 2 }), 0);
  return {
    dataSource: ds,
    ...render(<AppProviders dataSource={ds}>{ui}</AppProviders>),
  };
}
```

- [ ] **Step 5: Tests grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- "secure-store|session" && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/src/lib apps/mobile/src/state apps/mobile/src/app-providers.tsx apps/mobile/src/test
git commit -m "feat(mobile): SecureStore-Wrapper, Session-/Kontext-Provider und Provider-Komposition"
```

Erwartet: 5 Tests grün.

---

## Task 7: Auth-Flow-UI + V-01-Spike better-auth-Expo-Client

**Files:**
- Create: `apps/mobile/app/(auth)/_layout.tsx`, `apps/mobile/app/(auth)/welcome.tsx`, `apps/mobile/app/(auth)/login.tsx`, `apps/mobile/app/(auth)/forgot-password.tsx`, `apps/mobile/app/(auth)/invite/[token].tsx`, `apps/mobile/src/auth/auth-client.ts`, `apps/mobile/src/components/form.tsx`
- Test: `apps/mobile/src/__tests__/auth-screens.test.tsx`, `apps/mobile/src/auth/__tests__/auth-client.test.ts`

- [ ] **Step 1: Fehlschlagende Screen-Tests schreiben**

`apps/mobile/src/__tests__/auth-screens.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import ForgotPasswordScreen from "../../app/(auth)/forgot-password";
import InviteScreen from "../../app/(auth)/invite/[token]";
import LoginScreen from "../../app/(auth)/login";
import WelcomeScreen from "../../app/(auth)/welcome";
import { renderWithProviders } from "../test/render";

describe("Auth-Screens", () => {
  it("Welcome rendert Titel und Login-Aktion", async () => {
    renderWithProviders(<WelcomeScreen />);
    expect(
      await screen.findByText("Willkommen bei Powerhouse 360"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Anmelden")).toBeOnTheScreen();
  });

  it("Login zeigt Validierungsfehler bei leerer Eingabe", async () => {
    renderWithProviders(<LoginScreen />);
    fireEvent.press(await screen.findByTestId("login-submit"));
    await waitFor(() =>
      expect(
        screen.getByText("Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort."),
      ).toBeOnTheScreen(),
    );
  });

  it("Passwort-vergessen zeigt Erfolgsmeldung nach Senden", async () => {
    renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(
      await screen.findByTestId("reset-email"),
      "bewohner@example.test",
    );
    fireEvent.press(screen.getByTestId("reset-submit"));
    expect(
      await screen.findByText("E-Mail versendet. Bitte prüfe dein Postfach."),
    ).toBeOnTheScreen();
  });

  it("Invite-Screen rendert mit Token aus der Route", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ token: "tok-123" });
    renderWithProviders(<InviteScreen />);
    expect(await screen.findByText("Einladung annehmen")).toBeOnTheScreen();
    expect(screen.getByTestId("invite-token").props.children).toContain("tok-123");
  });
});
```

`apps/mobile/src/auth/__tests__/auth-client.test.ts` (V-01-Spike-Absicherung):

```ts
import { authClient } from "../auth-client";

describe("V-01-Spike: better-auth-Expo-Client", () => {
  it("Client initialisiert und bietet E-Mail-Sign-in an", () => {
    expect(typeof authClient.signIn.email).toBe("function");
    expect(typeof authClient.signOut).toBe("function");
  });
});
```

- [ ] **Step 2: Tests rot sehen**

```bash
pnpm --filter @ph360/mobile test -- "auth-screens|auth-client"
```

Erwartet: FAIL (Screens/Client existieren nicht).

- [ ] **Step 3: Spike-Deps installieren + Client implementieren**

```bash
pnpm --filter @ph360/mobile add better-auth @better-auth/expo
```

`apps/mobile/src/auth/auth-client.ts`:

```ts
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

/**
 * V-01-SPIKE (Spec §10): better-auth-Expo-Client ^1.6.x gegen die Plattform.
 * Ergebnis des Spikes wird im Commit + IMPLEMENTATION_LOG dokumentiert.
 *
 * FALLBACK (falls der Expo-Client mit invitation-only nicht kompatibel ist):
 * eigener fetch-Client gegen die better-auth-REST-Endpunkte der Plattform —
 *   POST ${EXPO_PUBLIC_AUTH_URL}/api/auth/sign-in/email   { email, password }
 *   POST ${EXPO_PUBLIC_AUTH_URL}/api/auth/sign-out
 *   POST ${EXPO_PUBLIC_AUTH_URL}/api/auth/request-password-reset { email, redirectTo }
 *   GET  ${EXPO_PUBLIC_AUTH_URL}/api/auth/get-session      (Cookie/Bearer)
 * Session-Token wird dann manuell in expo-secure-store gehalten und als
 * Authorization-Header mitgesendet. Screens bleiben unverändert, weil sie nur
 * gegen SessionProvider.signIn/signOut programmiert sind.
 *
 * WP-APP-3 nutzt den Mock-Login (SessionProvider); die echte Verdrahtung
 * (AUTH_MODE "better-auth") erfolgt in WP-APP-4 mit der ApiDataSource.
 */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_AUTH_URL ?? "http://localhost:3100",
  plugins: [
    expoClient({
      scheme: "powerhouse360",
      storagePrefix: "ph360",
      storage: SecureStore,
    }),
  ],
});
```

- [ ] **Step 4: Formular-Bausteine + Screens implementieren**

`apps/mobile/src/components/form.tsx`:

```tsx
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";

export function FormField({
  label,
  testID,
  ...inputProps
}: TextInputProps & { label: string; testID: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 }}>
        {label}
      </Text>
      <TextInput
        testID={testID}
        placeholderTextColor={colors.textSecondary}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.m,
          color: colors.textPrimary,
          fontFamily: fontFamily.regular,
          paddingHorizontal: spacing.m,
          paddingVertical: spacing.s,
        }}
        {...inputProps}
      />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  testID,
  disabled,
}: {
  title: string;
  onPress: () => void;
  testID: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={{
        alignItems: "center",
        backgroundColor: disabled ? colors.border : colors.accent,
        borderRadius: radius.m,
        paddingVertical: spacing.m,
      }}
    >
      <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.semiBold, fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function AuthScreenShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, gap: spacing.l, justifyContent: "center", padding: spacing.l }}>
      {children}
    </View>
  );
}
```

`apps/mobile/app/(auth)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`apps/mobile/app/(auth)/welcome.tsx`:

```tsx
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AuthScreenShell, PrimaryButton } from "../../src/components/form";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily, spacing } from "../../src/theme/tokens";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <AuthScreenShell>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 28 }}>
        {t("auth.willkommenTitel")}
      </Text>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 16 }}>
        {t("auth.willkommenText")}
      </Text>
      <PrimaryButton
        testID="welcome-login"
        title={t("auth.anmelden")}
        onPress={() => router.push("/(auth)/login")}
      />
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13, marginTop: spacing.m }}>
        {t("auth.einladungHinweis")}
      </Text>
    </AuthScreenShell>
  );
}
```

`apps/mobile/app/(auth)/login.tsx`:

```tsx
import { Link } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AuthScreenShell, FormField, PrimaryButton } from "../../src/components/form";
import { useSession } from "../../src/state/SessionProvider";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily } from "../../src/theme/tokens";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(false);
    try {
      await session.signIn(email, password);
      // Navigation übernimmt das Auth-Gate im Root-Layout (Task 8).
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenShell>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {t("auth.anmelden")}
      </Text>
      <FormField
        testID="login-email"
        label={t("auth.email")}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        testID="login-password"
        label={t("auth.passwort")}
        autoComplete="current-password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text style={{ color: colors.danger, fontFamily: fontFamily.regular }}>
          {t("auth.loginFehler")}
        </Text>
      ) : null}
      <PrimaryButton
        testID="login-submit"
        title={t("auth.anmelden")}
        onPress={() => void onSubmit()}
        disabled={busy}
      />
      <Link href="/(auth)/forgot-password" testID="login-forgot">
        <Text style={{ color: colors.info, fontFamily: fontFamily.regular }}>
          {t("auth.passwortVergessen")}
        </Text>
      </Link>
    </AuthScreenShell>
  );
}
```

`apps/mobile/app/(auth)/forgot-password.tsx`:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AuthScreenShell, FormField, PrimaryButton } from "../../src/components/form";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily } from "../../src/theme/tokens";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthScreenShell>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {t("auth.resetTitel")}
      </Text>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular }}>
        {t("auth.resetText")}
      </Text>
      <FormField
        testID="reset-email"
        label={t("auth.email")}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {sent ? (
        <Text style={{ color: colors.accent, fontFamily: fontFamily.regular }}>
          {t("auth.resetGesendet")}
        </Text>
      ) : null}
      <PrimaryButton
        testID="reset-submit"
        title={t("auth.resetSenden")}
        onPress={() => {
          if (email.trim()) setSent(true);
        }}
      />
    </AuthScreenShell>
  );
}
```

`apps/mobile/app/(auth)/invite/[token].tsx`:

```tsx
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { AuthScreenShell, FormField, PrimaryButton } from "../../../src/components/form";
import { useSession } from "../../../src/state/SessionProvider";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { fontFamily } from "../../../src/theme/tokens";

export default function InviteScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const session = useSession();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function onSubmit() {
    setError(false);
    try {
      // WP-APP-3 Mock: Einladung wird lokal „akzeptiert" (Login mit Token-Mail).
      await session.signIn(`invite-${token ?? "unbekannt"}@example.test`, password);
    } catch {
      setError(true);
    }
  }

  return (
    <AuthScreenShell>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {t("auth.einladungTitel")}
      </Text>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular }}>
        {t("auth.einladungText")}
      </Text>
      <Text
        testID="invite-token"
        style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12 }}
      >
        Token: {token ?? "—"}
      </Text>
      <FormField testID="invite-name" label={t("auth.name")} value={name} onChangeText={setName} />
      <FormField
        testID="invite-password"
        label={t("auth.passwort")}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text style={{ color: colors.danger, fontFamily: fontFamily.regular }}>
          {t("auth.einladungFehler")}
        </Text>
      ) : null}
      <PrimaryButton
        testID="invite-submit"
        title={t("auth.kontoErstellen")}
        onPress={() => void onSubmit()}
      />
    </AuthScreenShell>
  );
}
```

- [ ] **Step 5: Tests grün**

```bash
pnpm --filter @ph360/mobile test -- "auth-screens|auth-client" && pnpm --filter @ph360/mobile typecheck
```

Erwartet: 5 Tests grün. Falls der `@better-auth/expo`-Import unter jest bricht (ESM/Peer-Problem): Modul in `jest.setup.ts` mocken (`jest.mock("@better-auth/expo/client", () => ({ expoClient: () => ({ id: "expo" }) }))`) und den Befund als Teil des V-01-Spike-Ergebnisses werten.

- [ ] **Step 6: V-01-Spike-Laufzeitprüfung (nur wenn Plattform lokal läuft)**

```bash
docker compose up -d --wait postgres
pnpm --filter @ph360/platform dev &
sleep 15 && curl -s http://localhost:3100/api/auth/ok
kill %1
```

Erwartet: better-auth antwortet (JSON, kein 404) ⇒ Client-Basis-URL korrekt. Ergebnis (kompatibel ja/nein, ggf. Fallback nötig) im Commit-Body festhalten. Läuft die Plattform nicht (WP-1.2 noch offen), diesen Step als „nicht verifiziert" im IMPLEMENTATION_LOG (Task 11) vermerken — der Mock-Login bleibt davon unberührt.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/app apps/mobile/src/auth apps/mobile/src/components/form.tsx apps/mobile/src/__tests__ apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): Auth-Flow-UI (welcome/login/invite/forgot-password) + V-01-Spike better-auth-Expo-Client"
```

---

## Task 8: Tab-Navigation, Root-Gate, Formatierung + Übersicht-Screen mit Kontext-Umschalter

**Files:**
- Create: `apps/mobile/src/lib/format.ts`, `apps/mobile/src/components/cards.tsx`, `apps/mobile/src/components/context-switcher.tsx`, `apps/mobile/src/components/data-status-badge.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/uebersicht.tsx`
- Modify: `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- Test: `apps/mobile/src/lib/__tests__/format.test.ts`, `apps/mobile/src/__tests__/uebersicht.test.tsx`

- [ ] **Step 1: Fehlschlagende Format-Tests schreiben**

`apps/mobile/src/lib/__tests__/format.test.ts`:

```ts
import { formatCents, formatKwh, formatPercent, formatTime } from "../format";

describe("de-Formatierung", () => {
  it("kWh mit Komma und Einheit", () => {
    expect(formatKwh("12.345")).toBe("12,345 kWh");
    expect(formatKwh(null)).toBe("—");
  });
  it("Cent als Euro", () => {
    expect(formatCents(5834)).toBe("58,34 €");
    expect(formatCents(null)).toBe("—");
  });
  it("Prozent mit Vorzeichen", () => {
    expect(formatPercent(-4.2)).toBe("−4,2 %");
    expect(formatPercent(3)).toBe("+3,0 %");
    expect(formatPercent(null)).toBe("—");
  });
  it("Uhrzeit HH:MM aus ISO", () => {
    expect(formatTime("2026-07-22T14:17:03.000Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});
```

Rot sehen: `pnpm --filter @ph360/mobile test -- format` → FAIL (Modul fehlt).

- [ ] **Step 2: Formatierung implementieren**

`apps/mobile/src/lib/format.ts`:

```ts
/** Deutsche Anzeige-Formate. Energie kommt als Dezimal-String(3) aus der API. */
export function formatKwh(value: string | null): string {
  if (value === null) return "—";
  return `${value.replace(".", ",")} kWh`;
}

export function formatCents(cents: number | null): string {
  if (cents === null) return "—";
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} €`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  const sign = value < 0 ? "−" : "+";
  return `${sign}${Math.abs(value).toFixed(1).replace(".", ",")} %`;
}

/** Lokale Uhrzeit HH:MM (Geräte-Zeitzone). */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Lokales Datum TT.MM.JJJJ. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
```

Grün: `pnpm --filter @ph360/mobile test -- format`.

- [ ] **Step 3: Fehlschlagende Übersicht-Tests schreiben (Render + Umschalter-Zustand)**

`apps/mobile/src/__tests__/uebersicht.test.tsx`:

```tsx
import { fireEvent, screen } from "@testing-library/react-native";
import UebersichtScreen from "../../app/(tabs)/uebersicht";
import { CTX_ACTIVE, CTX_EXPIRED } from "../data/mock/fixtures";
import { renderWithProviders } from "../test/render";

describe("Übersicht", () => {
  it("rendert Heute-, Kosten- und Split-Karte + Datenstand-Badge", async () => {
    renderWithProviders(<UebersichtScreen />);
    expect(await screen.findByText("Heute")).toBeOnTheScreen();
    expect(screen.getByText("Kosten")).toBeOnTheScreen();
    expect(screen.getByText("PV & Netz")).toBeOnTheScreen();
    expect(screen.getByTestId("data-status-badge")).toBeOnTheScreen();
    expect(screen.getByText("Datenlücken")).toBeOnTheScreen();
    expect(screen.getByText("Mieterstrom-Ersparnis")).toBeOnTheScreen();
  });

  it("zeigt den Umschalter bei 2 Kontexten und wechselt den aktiven Kontext", async () => {
    renderWithProviders(<UebersichtScreen />);
    expect(await screen.findByTestId("context-switcher")).toBeOnTheScreen();
    expect(screen.getByTestId(`context-chip-${CTX_ACTIVE}`)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId(`context-chip-${CTX_EXPIRED}`));
    // Beendeter Kontext: Chip trägt das expired-Label aus /me.
    expect(await screen.findByText("WE 03, EG rechts")).toBeOnTheScreen();
  });

  it("zeigt KEINEN Umschalter bei genau 1 Kontext", async () => {
    renderWithProviders(<UebersichtScreen />, { contextCount: 1 });
    await screen.findByText("Heute");
    expect(screen.queryByTestId("context-switcher")).toBeNull();
  });
});
```

Rot sehen: `pnpm --filter @ph360/mobile test -- uebersicht` → FAIL.

- [ ] **Step 4: Karten, Badge, Umschalter implementieren**

`apps/mobile/src/components/cards.tsx`:

```tsx
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.l,
        borderWidth: 1,
        gap: spacing.s,
        padding: spacing.m,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.semiBold, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function BigValue({ value, label }: { value: string; label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 32 }}>
        {value}
      </Text>
      {label ? (
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function KeyValueRow({ k, v }: { k: string; v: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14 }}>{k}</Text>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.semiBold, fontSize: 14 }}>{v}</Text>
    </View>
  );
}
```

`apps/mobile/src/components/data-status-badge.tsx`:

```tsx
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { SummaryResponse } from "@ph360/api-contracts";
import { formatTime } from "../lib/format";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";

/** Ampel aus `summary.dataStatus` (Contract: lastReceivedAt/hasOpenGaps/isPreliminary).
 *  Der Störungs-Zustand (`datenstandStoerung`, colors.danger) kommt in WP-APP-4 aus
 *  `dataStatusResponseSchema.disturbance` dazu. */
export function DataStatusBadge({ status }: { status: SummaryResponse["dataStatus"] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const color = status.hasOpenGaps ? colors.warning : colors.accent;
  const label = status.hasOpenGaps
    ? t("uebersicht.datenstandLuecken")
    : t("uebersicht.datenstandOk");
  return (
    <View
      testID="data-status-badge"
      style={{ alignItems: "center", flexDirection: "row", gap: spacing.s }}
    >
      <View style={{ backgroundColor: color, borderRadius: radius.s, height: 10, width: 10 }} />
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 }}>
        {label}
        {status.lastReceivedAt
          ? ` · ${t("uebersicht.datenstandZeit", { zeit: formatTime(status.lastReceivedAt) })}`
          : ""}
        {status.isPreliminary ? ` · ${t("uebersicht.vorlaeufig")}` : ""}
      </Text>
    </View>
  );
}
```

`apps/mobile/src/components/context-switcher.tsx`:

```tsx
import { Pressable, ScrollView, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useActiveContext } from "../state/ActiveContextProvider";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../theme/tokens";

/** Sichtbar NUR bei >1 Kontext (Spec §4.2 /me → Umschalter). */
export function ContextSwitcher() {
  const { contexts, activeId, setActiveId } = useActiveContext();
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (contexts.length <= 1) return null;
  return (
    <ScrollView
      horizontal
      testID="context-switcher"
      accessibilityLabel={t("uebersicht.kontextWechseln")}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.s }}
    >
      {contexts.map((c) => {
        const active = c.id === activeId;
        return (
          <Pressable
            key={c.id}
            testID={`context-chip-${c.id}`}
            accessibilityRole="button"
            onPress={() => setActiveId(c.id)}
            style={{
              backgroundColor: active ? colors.accent : colors.surface,
              borderColor: colors.border,
              borderRadius: radius.l,
              borderWidth: 1,
              paddingHorizontal: spacing.m,
              paddingVertical: spacing.xs,
            }}
          >
            <Text
              style={{
                color: active ? "#FFFFFF" : colors.textPrimary,
                fontFamily: fontFamily.semiBold,
                fontSize: 13,
              }}
            >
              {c.unitLabel}
              {c.expired ? " (beendet)" : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
```

- [ ] **Step 5: Root-Gate + Tabs + Übersicht implementieren**

`apps/mobile/app/_layout.tsx` (ersetzt die Task-1-Fassung):

```tsx
import { Stack } from "expo-router";
import { AppProviders } from "../src/app-providers";
import { LoadingView } from "../src/components/states";
import { useSession } from "../src/state/SessionProvider";
import { useAppFonts } from "../src/theme/fonts";

function RootNavigator() {
  const { status } = useSession();
  const fontsLoaded = useAppFonts();
  if (status === "restoring" || !fontsLoaded) return <LoadingView />;
  const signedIn = status === "signedIn";
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="vertrag"
          options={{ headerShown: true, presentation: "modal", title: "Vertrag & Tarif" }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
```

`apps/mobile/app/index.tsx` (ersetzt die Task-1-Fassung):

```tsx
import { Redirect } from "expo-router";
import { useSession } from "../src/state/SessionProvider";

export default function Index() {
  const { status } = useSession();
  return (
    <Redirect
      href={status === "signedIn" ? "/(tabs)/uebersicht" : "/(auth)/welcome"}
    />
  );
}
```

`apps/mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="uebersicht"
        options={{
          title: t("tabs.uebersicht"),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="verbrauch"
        options={{
          title: t("tabs.verbrauch"),
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rechnungen"
        options={{
          title: t("tabs.rechnungen"),
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mehr"
        options={{
          title: t("tabs.mehr"),
          tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

`apps/mobile/app/(tabs)/uebersicht.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BigValue, Card, KeyValueRow } from "../../src/components/cards";
import { ContextSwitcher } from "../../src/components/context-switcher";
import { DataStatusBadge } from "../../src/components/data-status-badge";
import { ErrorView, LoadingView } from "../../src/components/states";
import { useDataSource } from "../../src/data/DataSourceProvider";
import { formatCents, formatKwh, formatTime } from "../../src/lib/format";
import { useActiveContext } from "../../src/state/ActiveContextProvider";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily, spacing } from "../../src/theme/tokens";

export default function UebersichtScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ds = useDataSource();
  const { active, activeId, isLoading: ctxLoading, isError: ctxError, refetch } = useActiveContext();

  const summary = useQuery({
    queryKey: ["summary", activeId],
    queryFn: () => ds.getSummary(activeId!),
    enabled: activeId !== null,
  });

  if (ctxLoading || (activeId !== null && summary.isLoading)) return <LoadingView />;
  if (ctxError || summary.isError || !active || !summary.data) {
    return <ErrorView onRetry={() => (ctxError ? refetch() : void summary.refetch())} />;
  }
  const s = summary.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ gap: spacing.m, padding: spacing.m, paddingTop: spacing.xl }}
    >
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {active.unitLabel}
      </Text>
      <ContextSwitcher />
      <DataStatusBadge status={s.dataStatus} />

      {s.dataStatus.hasOpenGaps ? (
        <View style={{ backgroundColor: colors.warning, borderRadius: 12, padding: spacing.m }}>
          <Text style={{ color: "#0D1626", fontFamily: fontFamily.regular, fontSize: 13 }}>
            {t("uebersicht.hinweisLuecken")}
          </Text>
        </View>
      ) : null}

      <Card title={t("uebersicht.heuteTitel")}>
        <BigValue value={formatKwh(s.today.kwh)} label={t("uebersicht.heuteVerbrauch")} />
        {s.lastReading ? (
          <KeyValueRow
            k={t("uebersicht.letzterMesswert")}
            v={`${formatKwh(s.lastReading.valueKwh)} · ${t("uebersicht.datenstandZeit", { zeit: formatTime(s.lastReading.ts) })}`}
          />
        ) : null}
      </Card>

      <Card title={t("uebersicht.kostenTitel")}>
        <BigValue value={formatCents(s.month.costCents)} label={t("uebersicht.kostenMonat")} />
        <KeyValueRow
          k={`${t("uebersicht.hochrechnung")} (${t("uebersicht.hochrechnungHinweis")})`}
          v={formatCents(s.month.projectedMonthEndCents)}
        />
        <KeyValueRow k={t("uebersicht.vormonat")} v={formatKwh(s.month.previousMonthKwh)} />
      </Card>

      {s.split.available ? (
        <Card title={t("uebersicht.splitTitel")}>
          <KeyValueRow k={t("uebersicht.pvAnteil")} v={formatKwh(s.split.pvKwh)} />
          <KeyValueRow k={t("uebersicht.netzAnteil")} v={formatKwh(s.split.gridKwh)} />
          <KeyValueRow k={t("uebersicht.ersparnis")} v={formatCents(s.split.savingsCents)} />
        </Card>
      ) : null}
    </ScrollView>
  );
}
```

> R-A4-Regel umgesetzt: Split-Karte wird nur gerendert, wenn `split.available` — kein leerer Platzhalter.

- [ ] **Step 6: Tests grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- "format|uebersicht" && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/app apps/mobile/src
git commit -m "feat(mobile): Tab-Navigation, Auth-Gate und Übersicht mit Kontext-Umschalter, Karten und Datenstand-Badge"
```

Erwartet: 7 Tests grün (4 Format + 3 Übersicht).

---

## Task 9: Verbrauch-Screen — Segmente, Victory-Chart mit Lücken, Drilldown Tag→Stunden

**Files:**
- Create: `apps/mobile/src/components/consumption-chart.tsx`, `apps/mobile/app/(tabs)/verbrauch.tsx`
- Test: `apps/mobile/src/components/__tests__/consumption-chart.test.tsx`, `apps/mobile/src/__tests__/verbrauch.test.tsx`

- [ ] **Step 1: Fehlschlagende Tests schreiben**

`apps/mobile/src/components/__tests__/consumption-chart.test.tsx` (prüft die immer gerenderte A11y-Textliste — Chart-Werte zusätzlich als Text, Spec §7.4):

```tsx
import { screen } from "@testing-library/react-native";
import { CTX_ACTIVE, buildConsumption } from "../../data/mock/fixtures";
import { renderWithProviders } from "../../test/render";
import { ConsumptionChart } from "../consumption-chart";

describe("ConsumptionChart", () => {
  const res = buildConsumption(CTX_ACTIVE, {
    resolution: "day",
    from: "2026-07-13T00:00:00.000Z",
    to: "2026-07-19T00:00:00.000Z",
  });

  it("rendert A11y-Zusammenfassung mit Werten und Lücken-Kennzeichnung", () => {
    renderWithProviders(<ConsumptionChart points={res.points} />);
    expect(screen.getByTestId("chart-a11y-summary")).toBeOnTheScreen();
    // 15.07. ist der Lückentag → als „Lücke" ausgewiesen.
    expect(screen.getByText(/15\.07\.2026: Lücke/)).toBeOnTheScreen();
    // Mindestens ein normaler Wert als Text.
    expect(screen.getAllByText(/kWh/).length).toBeGreaterThan(0);
  });
});
```

`apps/mobile/src/__tests__/verbrauch.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import VerbrauchScreen from "../../app/(tabs)/verbrauch";
import type { ConsumptionQuery } from "../data/data-source";
import { buildMockData } from "../data/mock/fixtures";
import { MockDataSource } from "../data/mock/mock-data-source";
import { renderWithProviders } from "../test/render";

class SpyDataSource extends MockDataSource {
  queries: ConsumptionQuery[] = [];
  override getConsumption(contextId: string, query: ConsumptionQuery) {
    this.queries.push(query);
    return super.getConsumption(contextId, query);
  }
}

describe("Verbrauch", () => {
  it("rendert Segmente und lädt initial die Tagesansicht", async () => {
    const ds = new SpyDataSource(buildMockData(), 0);
    renderWithProviders(<VerbrauchScreen />, { dataSource: ds });
    expect(await screen.findByTestId("segment-day")).toBeOnTheScreen();
    expect(screen.getByTestId("segment-week")).toBeOnTheScreen();
    expect(screen.getByTestId("segment-month")).toBeOnTheScreen();
    expect(screen.getByTestId("segment-year")).toBeOnTheScreen();
    await waitFor(() => expect(ds.queries.length).toBeGreaterThan(0));
    expect(ds.queries[0]!.resolution).toBe("day");
  });

  it("Segmentwechsel lädt die gewählte Auflösung", async () => {
    const ds = new SpyDataSource(buildMockData(), 0);
    renderWithProviders(<VerbrauchScreen />, { dataSource: ds });
    fireEvent.press(await screen.findByTestId("segment-month"));
    await waitFor(() =>
      expect(ds.queries.some((q) => q.resolution === "month")).toBe(true),
    );
  });

  it("Drilldown Tag→Stunden über die Tagesliste und zurück", async () => {
    const ds = new SpyDataSource(buildMockData(), 0);
    renderWithProviders(<VerbrauchScreen />, { dataSource: ds });
    const dayRow = await screen.findByTestId("day-row-0");
    fireEvent.press(dayRow);
    await waitFor(() =>
      expect(ds.queries.some((q) => q.resolution === "hour")).toBe(true),
    );
    expect(screen.getByTestId("drilldown-back")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("drilldown-back"));
    expect(await screen.findByTestId("day-row-0")).toBeOnTheScreen();
  });
});
```

- [ ] **Step 2: Tests rot sehen**

```bash
pnpm --filter @ph360/mobile test -- "consumption-chart|verbrauch"
```

Erwartet: FAIL (Module existieren nicht).

- [ ] **Step 3: Chart-Komponente implementieren**

`apps/mobile/src/components/consumption-chart.tsx`:

```tsx
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Bar, CartesianChart } from "victory-native";
import type { ConsumptionPoint } from "@ph360/api-contracts";
import { formatDate, formatKwh } from "../lib/format";
import { useTheme } from "../theme/ThemeProvider";
import { fontFamily, spacing } from "../theme/tokens";

/**
 * Victory-Native-XL-Balkenchart. Lücken werden als eigene Segmente gezeigt:
 * warme Marker-Balken fester Höhe + Kennzeichnung in der A11y-Textliste.
 * Die Textliste wird IMMER gerendert (VoiceOver/TalkBack, Spec §7.4).
 */
export function ConsumptionChart({ points }: { points: ConsumptionPoint[] }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const maxKwh = Math.max(0.1, ...points.map((p) => Number(p.kwhTotal)));
  const chartData = points.map((p, i) => ({
    x: i,
    kwh: Number(p.kwhTotal),
    gapMarker: p.hasGaps ? maxKwh * 0.06 : 0,
  }));

  return (
    <View style={{ gap: spacing.m }}>
      <View style={{ height: 220 }} testID="chart-canvas">
        <CartesianChart data={chartData} xKey="x" yKeys={["kwh", "gapMarker"]}>
          {({ points: p, chartBounds }) => (
            <>
              <Bar points={p.kwh} chartBounds={chartBounds} color={colors.accent} roundedCorners={{ topLeft: 3, topRight: 3 }} />
              <Bar points={p.gapMarker} chartBounds={chartBounds} color={colors.warning} />
            </>
          )}
        </CartesianChart>
      </View>
      <View
        testID="chart-a11y-summary"
        accessibilityLabel={t("verbrauch.chartZusammenfassung")}
        style={{ gap: 2 }}
      >
        {points.map((p) => (
          <Text
            key={p.periodStart}
            style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 12 }}
          >
            {formatDate(p.periodStart)}: {p.hasGaps && p.kwhTotal === "0.000" ? t("verbrauch.luecke") : formatKwh(p.kwhTotal)}
            {p.isPreliminary && !p.hasGaps ? ` (${t("uebersicht.vorlaeufig")})` : ""}
          </Text>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Verbrauch-Screen implementieren**

`apps/mobile/app/(tabs)/verbrauch.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { AppResolution } from "@ph360/api-contracts";
import { KeyValueRow } from "../../src/components/cards";
import { ConsumptionChart } from "../../src/components/consumption-chart";
import { EmptyView, ErrorView, LoadingView } from "../../src/components/states";
import { useDataSource } from "../../src/data/DataSourceProvider";
import { formatCents, formatDate, formatKwh, formatPercent } from "../../src/lib/format";
import { useActiveContext } from "../../src/state/ActiveContextProvider";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../../src/theme/tokens";

type Segment = "day" | "week" | "month" | "year";
const SEGMENTS: Segment[] = ["day", "week", "month", "year"];
const SEGMENT_LABEL_KEY: Record<Segment, string> = {
  day: "verbrauch.tag",
  week: "verbrauch.woche",
  month: "verbrauch.monat",
  year: "verbrauch.jahr",
};

/** Zeitraum je Segment relativ zu „jetzt" (Gerätezeit). */
function rangeFor(segment: Segment, now: Date): { resolution: AppResolution; from: string; to: string } {
  const to = new Date(now);
  const from = new Date(now);
  if (segment === "day") from.setUTCDate(from.getUTCDate() - 13);
  else if (segment === "week") from.setUTCDate(from.getUTCDate() - 7 * 11);
  else if (segment === "month") from.setUTCMonth(from.getUTCMonth() - 11);
  else from.setUTCFullYear(from.getUTCFullYear() - 4);
  return {
    resolution: segment === "day" ? "day" : segment,
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export default function VerbrauchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ds = useDataSource();
  const { activeId } = useActiveContext();
  const [segment, setSegment] = useState<Segment>("day");
  /** Drilldown: gewählter Tag (ISO) ⇒ Stundenansicht. */
  const [drilldownDay, setDrilldownDay] = useState<string | null>(null);

  const query = drilldownDay
    ? {
        resolution: "hour" as const,
        from: `${drilldownDay.slice(0, 10)}T00:00:00.000Z`,
        to: `${drilldownDay.slice(0, 10)}T23:00:00.000Z`,
      }
    : rangeFor(segment, new Date());

  const consumption = useQuery({
    queryKey: ["consumption", activeId, query.resolution, query.from, query.to],
    queryFn: () => ds.getConsumption(activeId!, query),
    enabled: activeId !== null,
  });

  if (activeId === null || consumption.isLoading) return <LoadingView />;
  if (consumption.isError || !consumption.data) {
    return <ErrorView onRetry={() => void consumption.refetch()} />;
  }
  const data = consumption.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ gap: spacing.m, padding: spacing.m, paddingTop: spacing.xl }}
    >
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {t("tabs.verbrauch")}
      </Text>

      {drilldownDay ? (
        <Pressable
          testID="drilldown-back"
          accessibilityRole="button"
          onPress={() => setDrilldownDay(null)}
        >
          <Text style={{ color: colors.info, fontFamily: fontFamily.semiBold }}>
            ← {t("verbrauch.zurueckZurTagesansicht")}
          </Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: "row", gap: spacing.s }}>
          {SEGMENTS.map((s) => (
            <Pressable
              key={s}
              testID={`segment-${s}`}
              accessibilityRole="button"
              onPress={() => setSegment(s)}
              style={{
                backgroundColor: s === segment ? colors.accent : colors.surface,
                borderColor: colors.border,
                borderRadius: radius.m,
                borderWidth: 1,
                paddingHorizontal: spacing.m,
                paddingVertical: spacing.xs,
              }}
            >
              <Text
                style={{
                  color: s === segment ? "#FFFFFF" : colors.textPrimary,
                  fontFamily: fontFamily.semiBold,
                  fontSize: 13,
                }}
              >
                {t(SEGMENT_LABEL_KEY[s])}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {drilldownDay ? (
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular }}>
          {t("verbrauch.stundenVon", { tag: formatDate(drilldownDay) })}
        </Text>
      ) : null}

      {data.points.length === 0 ? (
        <EmptyView title={t("verbrauch.keineWerte")} />
      ) : (
        <>
          <ConsumptionChart points={data.points} />
          <KeyValueRow k={t("verbrauch.vergleichVorperiode")} v={formatPercent(data.deltaToPreviousPeriodPct)} />
          <KeyValueRow
            k={t("verbrauch.durchschnittspreis")}
            v={data.avgPriceCentsPerKwh === null ? "—" : `${String(data.avgPriceCentsPerKwh).replace(".", ",")} ct/kWh`}
          />
          <KeyValueRow k={t("verbrauch.ersparnis")} v={formatCents(data.savingsCents)} />
        </>
      )}

      {!drilldownDay && segment === "day" ? (
        <View style={{ gap: spacing.xs }}>
          {data.points.map((p, i) => (
            <Pressable
              key={p.periodStart}
              testID={`day-row-${i}`}
              accessibilityRole="button"
              onPress={() => setDrilldownDay(p.periodStart)}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.m,
                borderWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                padding: spacing.s,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.regular, fontSize: 13 }}>
                {formatDate(p.periodStart)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.semiBold, fontSize: 13 }}>
                {p.hasGaps && p.kwhTotal === "0.000" ? t("verbrauch.luecke") : formatKwh(p.kwhTotal)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
```

- [ ] **Step 5: Tests grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- "consumption-chart|verbrauch" && pnpm --filter @ph360/mobile typecheck
```

Erwartet: 4 Tests grün. Falls `victory-native` in der jest-Umgebung trotz Skia-jestSetup bricht: in `jest.setup.ts` ergänzen `jest.mock("victory-native", () => ({ CartesianChart: ({ children }: never) => null, Bar: () => null }));` — die Chart-Tests prüfen bewusst nur die A11y-Textliste, der Canvas wird im Simulator (Task 11) visuell verifiziert.

```bash
git add apps/mobile/app apps/mobile/src
git commit -m "feat(mobile): Verbrauch-Screen mit Victory-Chart, Lücken-Segmenten und Drilldown Tag→Stunden"
```

---

## Task 10: Rechnungsliste, Mehr-Menü (ohne tote Einträge) + Vertragsansicht

**Files:**
- Create: `apps/mobile/app/(tabs)/rechnungen.tsx`, `apps/mobile/app/(tabs)/mehr.tsx`, `apps/mobile/app/vertrag.tsx`
- Test: `apps/mobile/src/__tests__/rechnungen.test.tsx`, `apps/mobile/src/__tests__/mehr.test.tsx`

- [ ] **Step 1: Fehlschlagende Tests schreiben**

`apps/mobile/src/__tests__/rechnungen.test.tsx`:

```tsx
import { screen } from "@testing-library/react-native";
import RechnungenScreen from "../../app/(tabs)/rechnungen";
import { renderWithProviders } from "../test/render";

describe("Rechnungen", () => {
  it("rendert die Mock-Rechnungsliste mit Nummer, Betrag und Status", async () => {
    renderWithProviders(<RechnungenScreen />);
    expect(await screen.findByText("R-2026-0142")).toBeOnTheScreen();
    expect(screen.getByText("58,34 €")).toBeOnTheScreen();
    expect(screen.getByText("Offen")).toBeOnTheScreen();
    expect(screen.getAllByText("Bezahlt")).toHaveLength(2);
  });
});
```

`apps/mobile/src/__tests__/mehr.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import MehrScreen from "../../app/(tabs)/mehr";
import VertragScreen from "../../app/vertrag";
import { renderWithProviders } from "../test/render";

describe("Mehr", () => {
  it("rendert nur funktionale Menüeinträge + Profil read-only", async () => {
    renderWithProviders(<MehrScreen />);
    expect(await screen.findByText("Vertrag & Tarif")).toBeOnTheScreen();
    expect(screen.getByText("Sprache")).toBeOnTheScreen();
    expect(screen.getByText("Rechtliches")).toBeOnTheScreen();
    expect(screen.getByText("App-Version")).toBeOnTheScreen();
    expect(screen.getByText("Abmelden")).toBeOnTheScreen();
    // Profil read-only: Name + E-Mail aus /me.
    expect(await screen.findByText("Alex Bewohner")).toBeOnTheScreen();
    expect(screen.getByText("bewohner@example.test")).toBeOnTheScreen();
    // Keine toten Einträge (Spec §7.2: nicht verfügbare Module erscheinen nicht).
    expect(screen.queryByText("Support")).toBeNull();
    expect(screen.queryByText("Benachrichtigungen")).toBeNull();
  });

  it("Abmelden meldet die Session ab", async () => {
    renderWithProviders(<MehrScreen />);
    fireEvent.press(await screen.findByTestId("mehr-abmelden"));
    // SessionProvider setzt signedOut → SecureStore-Delete wurde aufgerufen.
    const SecureStore = jest.requireMock("expo-secure-store");
    await waitFor(() =>
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("ph360.session.email"),
    );
  });

  it("Vertragsansicht rendert Tarifdaten aus dem Mock", async () => {
    renderWithProviders(<VertragScreen />);
    expect(await screen.findByText("PM-2026-0007")).toBeOnTheScreen();
    expect(screen.getByText("Powermieter Basis 2026")).toBeOnTheScreen();
  });
});
```

- [ ] **Step 2: Tests rot sehen**

```bash
pnpm --filter @ph360/mobile test -- "rechnungen|mehr"
```

Erwartet: FAIL (Screens existieren nicht).

- [ ] **Step 3: Rechnungen implementieren**

`apps/mobile/app/(tabs)/rechnungen.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { FlatList, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { InvoiceSummary } from "@ph360/api-contracts";
import { EmptyView, ErrorView, LoadingView } from "../../src/components/states";
import { useDataSource } from "../../src/data/DataSourceProvider";
import { formatCents, formatDate } from "../../src/lib/format";
import { useActiveContext } from "../../src/state/ActiveContextProvider";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../../src/theme/tokens";

const STATUS_KEY: Record<InvoiceSummary["status"], string> = {
  DRAFT: "rechnungen.statusDraft",
  ISSUED: "rechnungen.statusIssued",
  PAID: "rechnungen.statusPaid",
  CANCELLED: "rechnungen.statusCancelled",
};

export default function RechnungenScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ds = useDataSource();
  const { activeId } = useActiveContext();

  const invoices = useQuery({
    queryKey: ["invoices", activeId],
    queryFn: () => ds.getInvoices(activeId!),
    enabled: activeId !== null,
  });

  if (activeId === null || invoices.isLoading) return <LoadingView />;
  if (invoices.isError || !invoices.data) {
    return <ErrorView onRetry={() => void invoices.refetch()} />;
  }
  const items = invoices.data.items;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, padding: spacing.m, paddingTop: spacing.xl }}>
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24, marginBottom: spacing.m }}>
        {t("rechnungen.titel")}
      </Text>
      {items.length === 0 ? (
        <EmptyView title={t("rechnungen.leer")} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: spacing.s }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.m,
                borderWidth: 1,
                gap: spacing.xs,
                padding: spacing.m,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.semiBold }}>
                  {item.number}
                </Text>
                <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold }}>
                  {formatCents(item.totalCents)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 }}>
                  {t("rechnungen.zeitraum")}: {formatDate(item.periodStart)} – {formatDate(item.periodEnd)}
                </Text>
                <Text
                  style={{
                    color: item.status === "ISSUED" ? colors.warning : colors.accent,
                    fontFamily: fontFamily.semiBold,
                    fontSize: 13,
                  }}
                >
                  {t(STATUS_KEY[item.status])}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 4: Mehr + Vertrag implementieren**

`apps/mobile/app/(tabs)/mehr.tsx`:

```tsx
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useDataSource } from "../../src/data/DataSourceProvider";
import { useSession } from "../../src/state/SessionProvider";
import { useTheme } from "../../src/theme/ThemeProvider";
import { fontFamily, radius, spacing } from "../../src/theme/tokens";

function MenuRow({
  label,
  value,
  onPress,
  testID,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  testID: string;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? "button" : "text"}
      onPress={onPress}
      disabled={!onPress}
      style={{
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.m,
        borderWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        padding: spacing.m,
      }}
    >
      <Text style={{ color: danger ? colors.danger : colors.textPrimary, fontFamily: fontFamily.semiBold, fontSize: 15 }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14 }}>
          {value}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function MehrScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const session = useSession();
  const ds = useDataSource();
  const me = useQuery({ queryKey: ["me"], queryFn: () => ds.getMe() });
  const config = useQuery({ queryKey: ["config"], queryFn: () => ds.getConfig() });

  const appVersion = Constants.expoConfig?.version ?? "0.1.0";

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ gap: spacing.s, padding: spacing.m, paddingTop: spacing.xl }}
    >
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {t("mehr.titel")}
      </Text>

      {me.data ? (
        <View style={{ gap: 2, marginBottom: spacing.s }}>
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.semiBold, fontSize: 16 }}>
            {me.data.user.name}
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13 }}>
            {me.data.user.email}
          </Text>
        </View>
      ) : null}

      <MenuRow
        testID="mehr-vertrag"
        label={t("mehr.vertrag")}
        onPress={() => router.push("/vertrag")}
      />
      <MenuRow testID="mehr-sprache" label={t("mehr.sprache")} value={t("mehr.spracheAktuell")} />
      {config.data ? (
        <>
          <MenuRow
            testID="mehr-datenschutz"
            label={t("mehr.datenschutz")}
            onPress={() => void Linking.openURL(config.data.privacyUrl)}
          />
          <MenuRow
            testID="mehr-impressum"
            label={t("mehr.impressum")}
            onPress={() => void Linking.openURL(config.data.imprintUrl)}
          />
        </>
      ) : null}
      <MenuRow testID="mehr-version" label={t("mehr.appInfo")} value={appVersion} />
      <MenuRow
        testID="mehr-abmelden"
        label={t("mehr.abmelden")}
        onPress={() => void session.signOut()}
        danger
      />
    </ScrollView>
  );
}
```

> Bewusst NICHT enthalten (tote Einträge vermeiden, Spec §7.2): Support/Kontakt, Benachrichtigungs-Präferenzen, Dokumente — diese Einträge kommen in WP-APP-4 zusammen mit ihren funktionierenden Backends. „Rechtliches" ist als zwei direkte Link-Zeilen (Datenschutz/Impressum) umgesetzt — mehr als `privacyUrl`/`imprintUrl` liefert `configResponseSchema` nicht (kein Lizenzen-Link im Contract); die Sammel-Texte `mehr.rechtliches`/`mehr.lizenzen` bleiben für die spätere Gruppierung in de.json.

`apps/mobile/app/vertrag.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, KeyValueRow } from "../src/components/cards";
import { ErrorView, LoadingView } from "../src/components/states";
import { useDataSource } from "../src/data/DataSourceProvider";
import { formatCents, formatDate } from "../src/lib/format";
import { useActiveContext } from "../src/state/ActiveContextProvider";
import { useTheme } from "../src/theme/ThemeProvider";
import { fontFamily, spacing } from "../src/theme/tokens";

export default function VertragScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ds = useDataSource();
  const { activeId } = useActiveContext();

  const contract = useQuery({
    queryKey: ["contract", activeId],
    queryFn: () => ds.getContract(activeId!),
    enabled: activeId !== null,
  });

  if (activeId === null || contract.isLoading) return <LoadingView />;
  if (contract.isError || !contract.data) {
    return <ErrorView onRetry={() => void contract.refetch()} />;
  }
  const c = contract.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ gap: spacing.m, padding: spacing.m }}
    >
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bold, fontSize: 24 }}>
        {t("vertrag.titel")}
      </Text>
      <Card title={t("vertrag.vertragsnummer")}>
        <KeyValueRow k={t("vertrag.vertragsnummer")} v={c.contractNumber} />
        <KeyValueRow k={t("vertrag.status")} v={c.status} />
        <KeyValueRow k={t("vertrag.laufzeitBeginn")} v={formatDate(c.startAt)} />
      </Card>
      <Card title={t("vertrag.tarif")}>
        <KeyValueRow k={t("vertrag.tarif")} v={c.tariff.name} />
        <KeyValueRow
          k={t("vertrag.arbeitspreisPv")}
          v={t("vertrag.preisProKwh", { preis: formatCents(c.tariff.workPricePvCents) })}
        />
        <KeyValueRow
          k={t("vertrag.arbeitspreisNetz")}
          v={t("vertrag.preisProKwh", { preis: formatCents(c.tariff.workPriceGridCents) })}
        />
        <KeyValueRow k={t("vertrag.grundpreis")} v={formatCents(c.tariff.basePriceCents)} />
      </Card>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Tests grün + Commit**

```bash
pnpm --filter @ph360/mobile test -- "rechnungen|mehr" && pnpm --filter @ph360/mobile typecheck
git add apps/mobile/app apps/mobile/src
git commit -m "feat(mobile): Rechnungsliste, Mehr-Menü ohne tote Einträge und Vertragsansicht"
```

Erwartet: 4 Tests grün.

---

## Task 11: Gate-Verifikation — Demo-Build im iOS-Simulator gegen MockDataSource

**Files:**
- Modify: `docs/IMPLEMENTATION_LOG.md` (Gate-Eintrag), `docs/POWERHOUSE_360_MASTER_PLAN.md` (Statuspflege WP-APP-3)

- [ ] **Step 1: Gesamte Suite + Typecheck**

```bash
pnpm --filter @ph360/mobile test && pnpm --filter @ph360/mobile typecheck
```

Erwartet: alle Tests grün (≥ 30 über Tasks 1–10), Typecheck exit 0.

- [ ] **Step 2: Demo-Build starten**

```bash
pnpm mobile:ios
```

Erwartet: Xcode-Build läuft durch, iOS-Simulator öffnet die App mit dem Willkommen-Screen. (Erststart dauert mehrere Minuten wegen Prebuild + Pods.)

- [ ] **Step 3: Manuellen Demo-Durchlauf abhaken (Gate-Kriterium, Spec §8 WP-APP-3)**

Im Simulator prüfen und je Punkt abhaken:

- [ ] Willkommen → Anmelden → Login mit beliebiger E-Mail + Passwort ≥ 8 Zeichen ⇒ Tab-Stack erscheint
- [ ] Übersicht: Heute-, Kosten-, Split-Karte sichtbar; Datenstand-Badge „Datenlücken · Stand 16:17 · vorläufig" (lokale Zeit); Hinweis-Banner sichtbar
- [ ] Kontext-Umschalter: zwei Chips („WE 07, 2. OG links", „WE 03, EG rechts (beendet)"); Wechsel ändert Titel + Kartenwerte
- [ ] Verbrauch: Segmente Tag/Woche/Monat/Jahr wechseln die Daten; Lückentag 15.07. im Chart als warmes Marker-Segment + in der Liste als „Lücke"
- [ ] Drilldown: Tageszeile antippen ⇒ Stundenansicht (am 18.07. mit Stunden-Lücke), Zurück-Link funktioniert
- [ ] Rechnungen: 3 Einträge mit Status Offen/Bezahlt
- [ ] Mehr: Profil (Name/E-Mail), Vertrag & Tarif öffnet Modal mit Tarifpreisen, App-Version sichtbar, KEINE toten Einträge
- [ ] Abmelden ⇒ zurück zum Willkommen-Screen; App-Neustart: Session bleibt nach Login erhalten (SecureStore)
- [ ] Dark Mode: Simulator → Appearance „Dark" ⇒ App wechselt vollständig (Deep-Navy-Hintergrund, lesbare Kontraste); zurück zu Light
- [ ] App-Neustart im Flugmodus des Simulators nicht erforderlich (Offline-Verhalten ist WP-APP-4-Scope; OfflineBanner-Komponente existiert und ist getestet)

- [ ] **Step 4: IMPLEMENTATION_LOG + Masterplan-Status**

An `docs/IMPLEMENTATION_LOG.md` anhängen (append-only, Datum anpassen):

```markdown
## WP-APP-3 — Mobile-App-Grundgerüst (Expo, gegen Mocks)

- Datum: <JJJJ-MM-TT>
- Gate: Demo-Build iOS-Simulator gegen MockDataSource — DURCHLAUFEN (Checkliste Task 11 Step 3 vollständig)
- Tests: <n> jest-Tests grün (`pnpm --filter @ph360/mobile test`), Typecheck grün
- V-01-Spike better-auth-Expo-Client: <Ergebnis: kompatibel | Fallback fetch-Client nötig | nicht verifiziert (Plattform lief nicht) — Begründung>
- Nicht getestet: echte API (WP-APP-4), Push, Offline-Cache, Maestro-E2E (WP-APP-4/5), Android
- Bundle-ID de.powerhouse360.app = Platzhalter bis Apple-Account (R-A3)
```

In `docs/POWERHOUSE_360_MASTER_PLAN.md` den WP-APP-3-Status auf 🟢 setzen (nur wenn Step 3 vollständig durchlaufen — Masterplan-§12-Statusregel).

- [ ] **Step 5: Abschluss-Commit**

```bash
git add docs/IMPLEMENTATION_LOG.md docs/POWERHOUSE_360_MASTER_PLAN.md
git commit -m "docs: WP-APP-3 Gate-Verifikation (Demo-Build iOS-Simulator gegen Mocks) + Statuspflege"
```

---

## Abschluss-Checkliste

- [ ] **Gate verifiziert:** Demo-Durchlauf Task 11 Step 3 vollständig abgehakt (iOS-Simulator, MockDataSource, Light + Dark).
- [ ] Alle jest-Tests grün: `pnpm --filter @ph360/mobile test` (je Kern-Screen ≥ 1 Render-Test; Umschalter-Zustandstests vorhanden: >1 Kontext zeigt Umschalter, Wechsel lädt Kontextdaten, 1 Kontext zeigt keinen Umschalter).
- [ ] `pnpm --filter @ph360/mobile typecheck` grün; bestehende Suites unberührt (`pnpm --filter @ph360/permissions test` weiterhin grün).
- [ ] Fixture-Contract-Kopplung aktiv: `fixtures.test.ts` parst alle Mocks gegen die `@ph360/api-contracts`-Schemas (Mock ≠ API ⇒ Test bricht).
- [ ] V-01-Spike-Ergebnis (better-auth-Expo-Client, inkl. dokumentiertem Fallback in `src/auth/auth-client.ts`) im IMPLEMENTATION_LOG festgehalten.
- [ ] **IMPLEMENTATION_LOG-Eintrag** WP-APP-3 angehängt (append-only), inkl. „Nicht getestet"-Liste.
- [ ] **Masterplan-Statuspflege:** WP-APP-3 in `docs/POWERHOUSE_360_MASTER_PLAN.md` + EXECUTION_ROADMAP nachgeführt (🟢 nur nach tatsächlich durchlaufenem Nutzerfluss).
- [ ] Kein `git push` (kein Remote, R-02); alle Commits Conventional Commits deutsch.
- [ ] Abweichungen der angenommenen Contract-Shapes (Vorbedingungen) gegenüber dem realen `packages/api-contracts` dokumentiert und in Task 5 nachgezogen (Contracts sind die Quelle, nie die Mocks).
