# POWERHOUSE360 — Landing Page

Production landing page for **POWERHOUSE360**, the Building-OS for German
multi-family buildings (Mehrfamilienhäuser). A scroll-driven, code-controlled
React Three Fiber (R3F) scene sits pinned behind eight German-language story
chapters: Building → PV → Heat → Hub → Metering → Residents → Management →
Platform.

Core message: **„Aus einem Mehrfamilienhaus wird ein intelligentes Energie-Asset."**

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind v4** (design tokens)
- **React Three Fiber 9** + **three** + **@react-three/drei** (native R3F, not Spline)
- **GSAP** (available) + **Lenis** smooth scroll driving a shared scroll-progress store
- Font: **Sora** via `next/font`

## Run it

```bash
npm install        # if node_modules is missing
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint
```

## How it works

- A single **persistent `<Canvas>`** is pinned full-viewport behind the text.
- Lenis feeds `lib/scrollProgress.ts` (a module-level store) on every scroll tick.
- `three/CameraRig.tsx` reads that progress each frame and smoothstep-interpolates
  the camera between the 8 chapter keyframes. No React re-renders per frame.
- Each scene element (PV, heat pump, Hub, meters, apartment, energy flows) brightens
  via `three/emphasis.ts`, which computes a per-frame glow weight from the active
  chapter — so the building "unfolds" its story as you scroll.

### Where to edit things

| You want to change…              | Edit                                              |
|----------------------------------|---------------------------------------------------|
| **Copy / headlines / CTAs**      | `src/content/sections.ts` (single source of truth)|
| **Camera storyline / keyframes** | `camPos` / `camTarget` in `src/content/sections.ts` |
| **Brand colors / tokens**        | `src/app/globals.css` (`@theme`) + `src/components/three/palette.ts` |
| **The 3D scene assembly**        | `src/components/three/BuildingScene.tsx`          |
| **The POWERHOUSE Hub v1 model**  | `src/components/three/Hub.tsx`                     |
| **Building geometry / windows**  | `src/components/three/Building.tsx`               |
| **Dashboard KPIs / modules**     | `src/content/sections.ts` (`DASHBOARD_*`)         |
| **Nav links**                    | `src/content/sections.ts` (`NAV_LINKS`)           |
| **Mobile fallback**              | `src/components/MobileExperience.tsx` + `BuildingArt.tsx` |

## File structure

```
src/
  app/
    layout.tsx              Root layout, Sora font, metadata, Lenis wrapper
    page.tsx                Nav + Experience + Footer
    globals.css             Design tokens (@theme), brand colors, utilities
  content/
    sections.ts             8 chapters: copy + camera keyframes + emphasis (EDIT COPY HERE)
  lib/
    scrollProgress.ts       Shared scroll store (DOM <-> R3F bridge, no re-renders)
  components/
    SmoothScroll.tsx        Lenis root, feeds the scroll store
    Experience.tsx          Picks desktop (3D) vs mobile (static) at runtime
    DesktopExperience.tsx   Pinned canvas + scrolling panels + loader + WebGL fallback
    MobileExperience.tsx    Static SVG hero + stacked content cards
    SectionPanel.tsx        One full-height scroll panel with directional scrim
    DashboardOverlay.tsx    Section 7 KPI cards + module chips
    SceneLoader.tsx         Branded loading state (navy + logo + building silhouette)
    BuildingArt.tsx         Lightweight SVG building (mobile hero + WebGL fallback)
    Nav.tsx / Footer.tsx    Sticky nav + footer
    ui/
      Button.tsx            Token-driven primary/secondary CTA
      Logo.tsx              Official logo lockup + mark
    three/
      BuildingScene.tsx     <Canvas>, lighting, fog, scene assembly
      CameraRig.tsx         Scroll-driven camera interpolation (keyframes -> camera)
      Building.tsx          MFH massing + instanced warm windows
      RoofPV.tsx            Rooftop PV array (Powermaker)
      HeatPump.tsx          Air-source heat pump (Heatmaker)
      TechRoom.tsx          Technical room shell hosting the Hub
      Hub.tsx               POWERHOUSE Hub v1 (white enclosure, display, HUB v1, latches…)
      MeterCabinet.tsx      Meter cabinet (Powermieter)
      Apartment.tsx         Apartment interior + energy dashboard + Paula card
      EnergyFlow.tsx        Subtle animated roof->hub, heatpump->building, meters->building flows
      emphasis.ts           Per-frame glow weight per chapter
      palette.ts            Scene color constants (mirror brand tokens)
public/
  brand/                    logo-lockup.png, logo-mark.png, logo.svg
```

## Performance & accessibility

- 3D is lazy-loaded (`dynamic`, `ssr:false`) behind a branded loading state.
- `dpr` capped at `[1, 1.8]`, `AdaptiveDpr`, fog culling, instanced windows.
- **Mobile / coarse-pointer / reduced-motion → no heavy 3D.** A lightweight static
  SVG hero plus the 8 chapters as stacked cards (full German copy) is served instead.
- **WebGL fallback:** if a WebGL context can't be created, the static building art is
  shown behind the text and the loader never traps the user (6s safety timeout).
- Semantic headings, keyboard-focusable nav/CTAs, `prefers-reduced-motion` honored.

## Known limitations / follow-ups

- **Hub v1 is a *stylized* model.** It is recognizable (white enclosure, "POWERHOUSE 360"
  wordmark, black recessed display, large "HUB v1", two round latches, router + cables,
  status LEDs) but built from primitives. Refine against a real product photo if desired.
- The 3D requires a GPU-backed browser; headless/software-render environments fall back
  to the static art (by design).
- No real photographic imagery: `MUAPI_API_KEY` was not configured, so per the
  website-building skill we fell back to crafted SVG/3D rather than failing. Add the key
  and run the `muapi-*` skills to generate hero/OG imagery if photoreal assets are wanted.
