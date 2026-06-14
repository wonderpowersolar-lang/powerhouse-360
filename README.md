# POWERHOUSE 360 — Scroll-Website

**Powerhouse 360 – Das Betriebssystem deiner Immobilie.**

Eine premium, scroll-getriggerte Website für das Building-OS für Mehrfamilienhäuser.
Hinter langgehaltenen Scroll-Stationen liegt eine **photoreale Szenen-Bühne** (Stills +
scroll-gescrubbte Videos), darüber erscheinen **echte DOM-Produktkarten**. Komplett in
**Dark- und Light-Mode**, mit Mobile-Fallback.

Produktwelten: **Powermieter** (Strom) · **Heatmieter** (Wärme) · **POWERHOUSE Hub** ·
**Chargemieter** (Laden) · **Smokemieter** (Sicherheit) · **Bewohnerportal** · **Plattform**.

---

## Stack

- **Next.js 16** (App Router, TypeScript) · **React 19** · **Tailwind v4** (Design-Tokens)
- **GSAP** + **Lenis** (Smooth-Scroll, speist einen geteilten Scroll-Store)
- **three / @react-three/fiber** — die ursprüngliche Echtzeit-3D-Bühne ist **erhalten** und
  per Flag wieder aktivierbar (siehe `STAGE`)
- Font: **Sora** (`next/font`)

```bash
npm install
npm run dev      # http://localhost:3000  (launch.json nutzt :3005 für die Preview)
npm run build
npm run start
npm run lint
```

---

## Wie es funktioniert

Eine **fixe, vollflächige Bühne** liegt hinter den scrollenden Copy-Panels. Lenis speist
`lib/scrollProgress.ts` (ein Modul-Store, keine React-Re-Renders pro Frame). Eine einzige
`requestAnimationFrame`-Schleife in `components/ImageStage.tsx` liest den Scroll-Stand und
schreibt pro Station-Layer nur GPU-Eigenschaften (Opacity/Transform) → Crossfade + Ken-Burns;
hat eine Station ein Video, wird zusätzlich `video.currentTime` aus dem Scroll gesetzt
(scroll-Scrubbing).

**5-Beat-System pro Station** (`Approach · Hold · Reveal · Explain · Transition`): die
Section-Höhe ist Scroll-Runway, der `hold`-Wert reserviert ein Plateau, auf dem die Szene
ruht und die Produktkarte erscheint.

### Dark / Light

- `lib/themeStore.ts` — Modul-Store (`getTheme`/`setTheme`/`toggleTheme`/`subscribeTheme`)
- `components/theme/useTheme.ts` — React-Hook · `components/theme/ThemeToggle.tsx` — der Schalter im Nav
- **No-Flash:** `public/theme-init.js` (via `next/script` `beforeInteractive`) setzt
  `data-theme` vor dem ersten Paint (Default **dark**, gespeichert in `localStorage`/Cookie).
- **Re-Theming:** `app/globals.css` überschreibt unter `html[data-theme="light"]` die
  Token-Variablen (navy-Skala → helle Neutral-Skala, ink → dunkel, Accents kontraststärker).
  Jede `bg-navy-*` / `text-ink*` Utility kippt dadurch automatisch mit.
- **Szenen-Assets** wechseln pro Theme über `sceneImage(id, theme)` / `sceneVideo(id, theme)`.

---

## ✏️ Wo ändere ich was?

| Du willst ändern…                         | Datei |
|-------------------------------------------|-------|
| **Copy / Headlines / Sublines / CTAs**    | `src/content/sections.ts` |
| **Produktkarten** (Titel, Bullets, KPIs)  | `src/content/sections.ts` → `panel` je Section |
| **Karten-Design / Glass / Farben**        | `src/components/ProductPanel.tsx`, `src/components/ui/MetricCard.tsx` |
| **Szenen-Bilder (dark/light)**            | Datei ablegen unter `public/assets/powerhouse/scenes/{dark,light}/<id>.jpg`; Pfad in `src/config/scenes.ts` |
| **Szenen-Videos (dark/light)**            | mp4/webm ablegen unter `public/assets/powerhouse/video/{dark,light}/`; in `src/config/scenes.ts` das `video`-Feld der Station setzen |
| **Bild-/Video-Fokuspunkt (Ken-Burns)**    | `focal` je Eintrag in `src/config/scenes.ts` |
| **Scroll-Timings (Hold-Dauer)**           | `hold` je Section in `src/content/sections.ts` + `src/styles/motionTokens.ts` (`hold`, `sectionHeightVh`) |
| **Band-Mapping / Scrub-Kurve**            | `src/lib/scrollProgress.ts` (`getSectionFloat`, `getStationScrub`), `scrubEase()` in `ImageStage.tsx` |
| **Brand-Farben / Tokens**                 | `src/app/globals.css` (`@theme` = dark, `html[data-theme="light"]` = light) |
| **Nav-Links / Theme-Toggle**              | `src/components/Nav.tsx`, `NAV_LINKS` in `sections.ts` |
| **Mobile-Fallback**                       | `src/components/MobileExperience.tsx` |
| **Bühne: Bild vs. Echtzeit-3D**           | `STAGE` in `src/config/stage.ts` (`"image"` ⟷ `"r3f"`) |

---

## ➕ Neue Szene/Station ergänzen

1. **Asset** ablegen: `public/assets/powerhouse/scenes/{dark,light}/<neueId>.jpg`
   (optional Video unter `video/{dark,light}/<neueId>.mp4`).
2. **`src/config/scenes.ts`**: Eintrag in `SCENES` mit `image`, optional `video`, `focal`.
3. **`src/content/sections.ts`**: `SectionDef` mit `id: "<neueId>"`, fortlaufendem `index`,
   Copy, `hold`, optional `panel`. (Falls die R3F-Bühne genutzt wird: `camPos`/`camTarget`.)
4. **`src/lib/scrollProgress.ts`**: `NUM_SECTIONS` erhöhen.
5. Optional Nav-Link in `NAV_LINKS` + Label in `STATION_LABELS`.

Reihenfolge der Stationen = Reihenfolge in `SECTIONS` (alles datengetrieben).

---

## 🎬 Asset-Pipeline (Higgsfield)

Die Szenen sind mit **Higgsfield** erzeugt, identitätskonsistent vom Referenz-Render:

- **Light-Renders** — Modell `flux_kontext` (Tag↔Nacht-Relight aus dem dunklen Still als
  Referenz, ~1,5 Credits). Hält Gebäude/Geometrie konstant, ändert nur Licht/Himmel.
- **Scroll-Videos** — Modell `seedance_2_0`, `start_image` = der Still, langsamer Push-in,
  6 s, 720p (~27 Credits).

**Video für Web optimieren** (für sauberes Scrubbing — dichte Keyframes, kein Audio):

```bash
ffmpeg -i raw.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 22 -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart out.mp4
```

### Aktueller Asset-Stand

- **Stills:** dark **und** light für alle Stationen ✓
- **Videos (dark):** `hero`, `heatmieter`, `hub`, `cta` (Final). Übrige Stationen nutzen den
  premium Bild-Crossfade (Ken-Burns) als Fallback — die Architektur mountet ein `SceneVideo`
  automatisch, sobald für eine Station/Theme ein `video` im Manifest steht.
- **Light-Videos:** noch keine → Light-Mode nutzt die Light-Stills (sauberer Fallback).

---

## Performance & A11y

- Videos: `muted` · `playsInline` · `preload="none"` → lazy-load erst beim ersten Seek; kein
  Autoplay (reines Scrubbing); bei Fehler Fallback auf das Still.
- `next/image` für Stills; cinematic Grade ist theme-abhängig (Light bleibt hell).
- `prefers-reduced-motion`: autonome Bewegung (Breathing/Grain/Auto-Push-in) gedämpft, die
  scroll-gekoppelte Journey bleibt (user-getrieben).
- Mobile / coarse-pointer → leichter gestapelter Fallback statt Scroll-Pinning.

### Bekannte Dev-Hinweise (nur Entwicklung, nicht Produktion)

- **Asset gleichen Namens überschrieben?** Next' Image-Optimizer cached pro URL — im Dev kann
  ein altes Bild bleiben. Hard-Reload oder Dev-Server neu starten. In Produktion (gehashte
  Builds) tritt das nicht auf.
- Eine React-**Dev-Warnung** „Encountered a script tag…" stammt vom Theme-Init-Script und wird
  im Production-Build entfernt (No-Flash funktioniert korrekt).

---

## Dateistruktur (Auszug)

```
src/
  app/            layout.tsx (Theme-Init, Lenis) · page.tsx · globals.css (Tokens dark/light)
  config/
    scenes.ts     SZENEN-MANIFEST: image/video/focal je Station, dark+light  ← Assets hier
    stage.ts      STAGE-Flag (image|r3f) · Explorer-Hotspots · back-compat Maps
  content/
    sections.ts   Stationen: Copy + Produktkarten + KPIs + Kamera-Keyframes   ← Copy hier
  lib/
    scrollProgress.ts  Scroll-Store + 5-Beat-Mapping + getStationScrub
    themeStore.ts      Theme-Store (dark/light)
  styles/motionTokens.ts  hold-Werte, Section-Höhen, Easing
  components/
    ImageStage.tsx      die Scroll-Video-Bühne (Crossfade + Ken-Burns + Video-Scrub)
    SceneVideo.tsx      scroll-gescrubbtes Video-Element (seek, poster, lazy)
    theme/              themeStore-Hook + ThemeToggle
    ProductPanel.tsx    Produktkarte (beat-gekoppeltes Reveal) · ui/MetricCard.tsx KPI-Chip
    MobileExperience.tsx  gestapelter Mobile-Fallback
    Nav.tsx · Footer.tsx · SectionPanel.tsx · ModuleNavigation.tsx · …
public/assets/powerhouse/
  scenes/{dark,light}/<id>.jpg
  video/{dark,light}/<id>.mp4
```
