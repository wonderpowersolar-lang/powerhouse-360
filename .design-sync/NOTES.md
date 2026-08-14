# design-sync NOTES — POWERHOUSE 360 (@ph360/website)

Repo-Eigenheiten für Re-Syncs. Zuerst lesen, dann `bash .design-sync/prep.sh` (= cfg.buildCmd), dann den Driver fahren:

```sh
node .ds-sync/resync.mjs --config .design-sync/config.json \
  --node-modules .design-sync/.cache/nm/node_modules --out ./ds-bundle \
  --remote .design-sync/.cache/remote-sync.json
```

## Gotchas (gelernt beim Erst-Sync 2026-08-12)

- **Kein Komponenten-Package, kein dist**: `@ph360/website` ist eine Next-App; der Converter läuft im Synth-Entry-Modus über `srcDir: src/components/ui` (nur die 3 UI-Dateien).
- **Shim statt Selbst-Symlink**: Der Converter erwartet `<node-modules>/@ph360/website`. NIEMALS `apps/website/node_modules/@ph360/website → ../..` verlinken — Symlink-Zyklus, ts-morph stirbt mit ENAMETOOLONG. `prep.sh` baut ein Minimal-Shim (package.json-Kopie + `src`/`tsconfig`/`fonts`-Symlinks) unter `.design-sync/.cache/nm/node_modules/`; `react`/`react-dom`/`next`/`@types/react` werden daneben verlinkt. Nach `pnpm install` prep.sh erneut laufen lassen (Symlink-Ziele können rotieren).
- **process-Shim nötig** (`cfg.extraEntries[0]`, von prep.sh erzeugt): `next/link` (via ButtonLink in Button.tsx) liest `process.env.__NEXT_*` auf Modulebene → ohne Shim stirbt die IIFE beim Laden ([BUNDLE_EXPORT] 4/4 fehlen). extraEntries werden vor dem Haupt-Entry evaluiert.
- **ButtonLink bewusst ausgeschlossen** (`componentSrcMap: null`): Next-Router-gebunden, rendert in der Design-Runtime nie. Conventions sagen dem Agenten: `Button` nutzen.
- **`.d.ts` sind Stubs im Synth-Modus** → Props-Contracts stehen in `cfg.dtsPropsFor` (handgepflegt!). Bei API-Änderung an Button/LogoLockup/LogoMark/MetricCard die Config nachziehen.
- **Tailwind v4 kompiliert nur benutzte Klassen**: Utility-Vokabular des Design-Agenten = App-Bestand + `.design-sync/tailwind-safelist.css` (`@source inline`). Neue Tokens/Utilities dort ergänzen, nie in globals.css der App. Kompiliert wird via `npx --yes @tailwindcss/cli@4` (Netz beim ersten Lauf einer Maschine).
- **Sora lokal gebündelt** (`.design-sync/fonts/`, v17 von Google Fonts, SIL OFL, wght 300–800 wie next/font in layout.tsx). `--font-sora` hängt prep.sh statisch ans Kompilat an.
- **Logo als Data-URI**: `src/components/ui/logo-icon-data.ts` ist GENERIERT aus `apps/website/public/brand/logo-icon.svg`. Regenerieren nach Logo-Änderung:
  `cd apps/website && node -e 'const fs=require("fs");const s=fs.readFileSync("public/brand/logo-icon.svg");fs.writeFileSync("src/components/ui/logo-icon-data.ts", "/** GENERIERT aus public/brand/logo-icon.svg — nicht von Hand editieren. */\nexport const LOGO_ICON_DATA_URI =\n  \"data:image/svg+xml;base64," + s.toString("base64") + "\";\n")'`
- **MetricCard exportiert named + default** (named für `export *`-Bundles nötig) — nicht auf default-only zurückbauen.
- **Playwright**: `.ds-sync` pinnt `playwright@1.61.1` (= Repo-Version; Chromium-Build 1228 liegt im Maschinen-Cache). Bei `Executable doesn't exist` Cache-Build vs. browsers.json abgleichen.
- **Preview-Wrapper**: Karten rendern auf Weiß — authored Previews wrappen in `bg-navy-900`-Ground (Komponenten sind für Off-Black designt).
- Button-Hover-Verlauf (GradientHover) ist reiner Hover-Zustand → nicht statisch renderbar, bewusst keine Story.

## Light-Mode & Verlauf (Erweiterung 2026-08-12)

- **Light-Mode = Token-Flip-Scope** (`.theme-light` / `[data-theme="light"]` in globals.css): flippt nur navy-600–900 + ink-Stufen; Palette aus dem Powermieter-Prototyp (apps/mobile/design-reference/design-tokens.css). Marketing-Site nutzt den Scope nirgends — er gehört der App-Welt/dem Design-Agenten.
- **Glass-Rezepte im Scope über `ink`-Alpha schreiben** (bg-ink/5, border-ink/20), nie über white-Literale — white flippt nicht. Button secondary wurde deshalb von white- auf ink-Token umgestellt (Site-Optik quasi identisch, minimal wärmer; Smoke-Test ok).
- **Button `tone="light"`** nutzt bewusst FESTE Hexwerte (#16243a-Alpha): scope-unabhängiger Override für helle Artboards ohne Wrapper. Im theme-light-Scope braucht secondary KEIN tone (flippt automatisch) — deshalb keine eigene tone-light-Story.
- Neue Utilities in globals.css: `brand-gradient-bg`, `brand-gradient-animate` (+keyframes brand-gradient-shift), `hairline-gradient`, `brand-glow`; Light-Overrides für `card-surface`/`text-legible`. Button `variant="gradient"` = permanenter Logo-Verlauf.

- **Duo-Preview-Muster** (Impeccable-Pass 2026-08-12): jede Komponente zeigt Dark+Light in EINEM Dokument (ModiDuo-Story, Noir-Panel | theme-light-Panel mit Mode-Kickern). Duo-Dokumente sind breiter als Grid-Zellen → `cfg.overrides.{Button,LogoLockup,MetricCard}: cardMode "column"` (LogoMark passt ohne).
- **MetricCard tone="light" nutzt festen Hexwert** (`text-[#16243a]`) für den Wert — `text-navy-900` flippt im theme-light-Scope auf hell (gleiches Muster wie Button tone light). Bei neuen tone-light-Pfaden immer feste Hexwerte statt navy-900-Utilities.

## Known render warns

- (keine — 4/4 clean, 0 thin, 0 variantsIdentical)

## Re-sync risks

- `npx @tailwindcss/cli@4` zieht die jeweils neueste v4-CLI → CSS-Output kann mit CLI-Version driften (App pinnt tailwindcss ^4 separat). Bei Diff-Rauschen CLI-Version fixieren.
- `cfg.dtsPropsFor` und `.design-sync/conventions.md` rotten still, wenn sich die 4 Komponenten-APIs oder das `@theme` in globals.css ändern → bei jedem Re-Sync Namen gegen frischen Build validieren (Conventions-Schritt tut das).
- Safelist und `@theme`-Tokens müssen synchron bleiben (neuer Token ⇒ Safelist-Zeile, sonst fehlt er dem Agenten).
- Sora-Dateien sind statisch committed (kein Drift); bei Font-Wechsel in layout.tsx auch `fonts/sora.css` + prep.sh-Anhang anpassen.
- Nur Erst-Sync-Scope verifiziert (4 Komponenten). Weitere Website-Komponenten (Nav, Footer, SectionPanel …) sind bewusst NICHT im Sync — bei Aufnahme: srcDir-Zuschnitt prüfen (viele hängen an gsap/three → vermutlich eigene Shims nötig).
- Node 25 + pnpm 11 verwendet; `engines` verlangt nur >=20.

## PowerExperience-Sync (2026-08-14)

- Die /powermieter-Seite ist als Komponente `PowerExperience` (Gruppe »powermieter«, cardMode column) im Sync: via `extraEntries[1]` gebündelt + `componentSrcMap`-Pin. Die [EXPORT_COLLISION]-Warnung ist ein Pin-Artefakt — nur der extraEntry trägt das Binding, funktional korrekt.
- `next/link` rendert OHNE Router in der Design-Runtime (Next 16, empirisch render-clean) — ButtonLink-CTAs in der Karte funktionieren als Links.
- Hero-Medien (Still/Clip unter /media/…) existieren nur auf der Website; Karte und Design-Runtime zeigen den Noir-Void — dokumentiert im prompt.md/dtsPropsFor.
- PowerExperience exportiert named + default (export * braucht named). Imports relativ statt @/-Alias (Bundle-Auflösung).
- Achtung `.next`-Duplikate: macOS-» 2«-Kopien in apps/website/.next brechen tsc (TS6200/TS2300) — bei Bedarf `find .next -name "* 2.*" -delete`.
