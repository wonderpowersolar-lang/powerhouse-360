# Smokemieter Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die `/smokemieter`-Seite bauen — Hybrid aus klassischem Hero, Rewind-Scroll-Story (Brand → Zeitumkehr → Rettung) und acht klassischen Sachsektionen, nach Spec `docs/superpowers/specs/2026-07-08-smokemieter-design.md`.

**Architecture:** Higgsfield-Assets zuerst (A1–A5), dann additive Next.js-Dateien nach dem Chargemieter-Muster: eigene Content-Datei als Single Source of Truth, eigener schlanker Progress-Store (1 Runway, 3 Phasen statt 12 Szenen), Frame-Scrub-Canvas wie `ChargeStage`, klassisch gestapelte Panels für den Sachteil. Nichts Bestehendes wird umgebaut.

**Tech Stack:** Next.js 16 (App Router, `next dev --webpack`), React 19, Tailwind 4, Lenis (global vorhanden), Canvas-Frame-Scrub, Higgsfield MCP (nano_banana_pro + seedance_2_0), ffmpeg.

**Verifikation statt TDD:** Das Projekt hat keinen Test-Runner (package.json: kein `test`-Script). Projektkonvention ist `npm run build` (Typecheck) + Preview-Verifikation mit Force-Hooks (`__smForceRaw`) und Screenshots. Dieser Plan folgt dem — jede Task endet mit Build- oder Preview-Verify.

**Wording-Leitplanken (aus Spec §5, gelten für jede Copy-Zeile):** keine erfundenen Statistiken; Pflicht ohne Rechtsberatung („regeln die Landesbauordnungen"); Ferninspektion „je nach Gerätetyp", „orientiert an DIN 14676"; Abrechnung nur „Grundlage schaffen"; Ereignisse „gemeldet und kommuniziert", keine Feuerwehr-Aufschaltung; zulässige Fakten: 85 dB (DIN EN 14604), „Im Schlaf riecht der Mensch nichts", 10-Jahres-Tausch.

---

### Task 1: Higgsfield-Assets A1–A5 generieren

**Files:**
- Create: `public/media/smokemieter/` (raw-Downloads: `burn-raw.png`, `burn-clip-raw.mp4`, `alarm-raw.png`, `dawn-raw.png`, `night-raw.png`)

Alle Bild-Jobs: `mcp__e46687a2-…__generate_image` mit `model: "nano_banana_pro"`, `aspect_ratio: "16:9"`. Video: `generate_video` mit `model: "seedance_2_0"`. Referenz-Medien als `medias: [{value: "<job-id>", role: "image"}]` (bzw. `role: "start_image"` beim Video). Bei jedem ersten Call `get_cost: true` als Preflight, dann ohne. Falls der Server ein Preset aufdrängt: `declined_preset_id: "24bae836-2c4a-48e0-89b6-49fcc0b21612"`.

**Bildsprache-Regel:** keine Menschen (erst recht keine Menschen in Gefahr), kein Gore, keine Außenflammen — die Gefahr bleibt architektonisch (Glühen hinterm Fenster, Rauch). Emotion entsteht über Text + Uhr.

- [ ] **Step 1: Referenz-Job-IDs verifizieren**

`show_generations` (type `image`) aufrufen und aus der History bestätigen/notieren:
- Gebäude/Hero-Referenz: `1eb8708e-4880-4919-862e-895973f4e93d`
- Decken-Melder-Referenz: beginnt mit `87ca48e0-` (volle ID notieren)

- [ ] **Step 2: A1 — Nacht-Fassade mit Feuerschein (Still)**

Prompt (wörtlich):
> Night, cinematic noir. The same modern residential building from the reference, seen from the street. In one third-floor window: warm flickering fire glow behind the glass, thin dark smoke curling out of the slightly opened window into the cold night air. All other windows dark. No people. Wet asphalt reflections, deep navy shadows, restrained, realistic, photographic. No visible flames outside the facade — the danger is quiet and contained.

`medias: [{value: <hero-job-id>, role: "image"}]`. Job-ID als `<A1>` notieren.

- [ ] **Step 3: A2 — Brand-Clip (Video, das Scrub-Asset)**

`generate_video`, `model: "seedance_2_0"`, `duration: 8`, `medias: [{value: <A1-job-id>, role: "start_image"}]`. 1080p wählen, falls der Parameter angeboten wird (Kern-Asset, ~72 Credits). Prompt (wörtlich):
> Static camera, locked tripod shot of the building facade at night. The fire glow in the third-floor window slowly and continuously intensifies, the smoke thickens and rises steadily into the night sky. No people, no vehicles, no cuts, no camera movement. Subtle, realistic, continuous progression.

Statische Kamera ist Pflicht — der Clip wird rückwärts gescrubbt; Kamerafahrten zerstören die Zeitumkehr-Illusion.

- [ ] **Step 4: A3 — Alarm-Szene innen (Still)**

Prompt (wörtlich):
> Interior ceiling close-up, cinematic noir: a round white smoke detector mounted on a concrete ceiling, a thin wisp of smoke just reaching it, its red LED ring glowing alert. Dark hallway, single cool ambient light, subtle amber-red rim light from the LED. No people. Realistic, premium, quiet.

`medias: [{value: <melder-job-id 87ca48e0-…>, role: "image"}]`

- [ ] **Step 5: A4 — Morgen-Fassade (Still)**

Prompt (wörtlich):
> Dawn, first amber morning light. The same residential building, intact and calm, warm golden light on the facade, windows dark and peaceful, thin morning mist. No smoke, no fire, no people. Hopeful, quiet, cinematic.

`medias: [{value: <hero-job-id>, role: "image"}]`

- [ ] **Step 6: A5 — ruhige Nacht-Fassade (Still, Final-CTA)**

Prompt (wörtlich):
> Deep night, calm and safe. The same residential building, all windows dark except one soft warm light on the third floor. Peaceful, quiet, cinematic noir, no people.

`medias: [{value: <hero-job-id>, role: "image"}]`

- [ ] **Step 7: Ergebnisse herunterladen**

Aus jeder Tool-Antwort die Result-URL nehmen und speichern:
```bash
mkdir -p "public/media/smokemieter"
curl -L -o "public/media/smokemieter/burn-raw.png"      "<A1-url>"
curl -L -o "public/media/smokemieter/burn-clip-raw.mp4" "<A2-url>"
curl -L -o "public/media/smokemieter/alarm-raw.png"     "<A3-url>"
curl -L -o "public/media/smokemieter/dawn-raw.png"      "<A4-url>"
curl -L -o "public/media/smokemieter/night-raw.png"     "<A5-url>"
```
Erwartung: 5 Dateien > 1 MB (Stills) bzw. > 2 MB (Clip). Qualität sichten (Read auf die PNGs): Gebäude konsistent? Feuerschein dezent? Falls ein Motiv misslingt → Prompt nachschärfen, 1 Retry pro Asset, Job-IDs aktualisieren.

- [ ] **Step 8: Commit (raw-Assets kommen NICHT ins Repo)**

Kein Commit — `*-raw.*` bleiben unversioniert (wie bei Chargemieter: raw-Dateien liegen im Ordner, aber erst die optimierten Derivate zählen; Task 2 committet).

---

### Task 2: Postprocessing — Stills, Scrub-Clip, Frame-Sequenz

**Files:**
- Create: `public/media/smokemieter/{burn,alarm,dawn,night}.jpg`, `public/media/smokemieter/burn.mp4`, `public/media/smokemieter/story-frames/frame_001.jpg … frame_096.jpg`

- [ ] **Step 1: Stills zu Web-JPEGs**

```bash
cd "public/media/smokemieter"
for n in burn alarm dawn night; do
  ffmpeg -y -i "${n}-raw.png" -vf "scale=2400:-2" -q:v 5 "${n}.jpg"
done
ls -la *.jpg
```
Erwartung: 4 JPEGs, je ~100–250 KB (Referenz: Chargemieter-Stills 95–150 KB). Deutlich größer → `-q:v 6`.

- [ ] **Step 2: Clip scrub-optimieren**

```bash
ffmpeg -y -i burn-clip-raw.mp4 -an -c:v libx264 -crf 23 -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart burn.mp4
```
Erwartung: `burn.mp4` ~2–5 MB, ohne Audio.

- [ ] **Step 3: Frame-Sequenz extrahieren**

```bash
mkdir -p story-frames
ffmpeg -y -i burn.mp4 -vf "fps=12,scale=1600:-2" -q:v 4 "story-frames/frame_%03d.jpg"
ls story-frames | wc -l && du -sh story-frames
```
Erwartung: **96 Frames** (8 s × 12 fps), gesamt ~6–8 MB. Tatsächliche Anzahl notieren → wird `SM_STORY_FRAMES.count` in Task 3. Frame-Höhe prüfen (`ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 story-frames/frame_001.jpg`) → wird `SM_STORY_FRAMES.height` (typisch 900).

- [ ] **Step 4: Commit**

```bash
git add public/media/smokemieter/*.jpg public/media/smokemieter/burn.mp4 public/media/smokemieter/story-frames
git status --short   # raw-Dateien dürfen NICHT gestaged sein
git commit -m "Smokemieter: Story-Assets (Brand-Scrub-Sequenz, Alarm, Morgen, Nacht)"
```

---

### Task 3: Content-Datei `src/content/smokemieter.ts`

**Files:**
- Create: `src/content/smokemieter.ts`

- [ ] **Step 1: Datei anlegen — kompletter Inhalt:**

```ts
/**
 * SmokeMieter — single source of truth für die /smokemieter-Seite.
 *
 * HYBRID-AUFBAU: klassischer Hero → Scroll-Story (ein Runway, 3 Phasen:
 * burn → rewind → rescue) → 8 klassische Sachsektionen → Final-CTA.
 *
 * Wording constraints (bewusst, aus dem Spec):
 *  - Recht: Pflicht ja, Details »regeln die Landesbauordnungen« — keine
 *    landesspezifischen Fristen, keine Rechtsberatung.
 *  - Ferninspektion: »je nach Gerätetyp«, »orientiert an DIN 14676« —
 *    keine Zertifizierungszusagen.
 *  - Abrechnung: »Grundlage schaffen«, keine Umlage-Garantie.
 *  - Ereignisse: »gemeldet und kommuniziert«, keine Notruf-Aufschaltung.
 *  - Story erzählt EINE konkrete Nacht — keine Statistik-Claims. Fakten:
 *    85 dB (DIN EN 14604), »Im Schlaf riecht der Mensch nichts«,
 *    Gerätetausch spätestens nach 10 Jahren.
 */

/* ────────────────────────────────────────────── CTAs */

export const SM_CTA = {
  bestandscheck: {
    label: "Kostenfreien Bestandscheck starten",
    href: "/projekt-besprechen?modul=smokemieter&thema=bestandscheck",
  },
  planung: {
    label: "Melder-Konzept planen",
    href: "/projekt-besprechen?modul=smokemieter&thema=planung",
  },
  demo: { label: "System ansehen", href: "/demo" },
} as const;

/* ────────────────────────────────────────────── Hero (Akt 1) */

export const SM_HERO = {
  kicker: "Powerhouse 360 · Modul 04",
  headline: "SmokeMieter",
  headlineAccent:
    "Rauchwarnmelder im Mehrfamilienhaus — montiert, ferngeprüft und lückenlos dokumentiert.",
  subline:
    "SmokeMieter macht die Rauchwarnmelder-Pflicht einfach betreibbar: Geräte, Montage, Ferninspektion, Ereigniskommunikation und eine Dokumentation, die jeder Prüfung standhält — für Eigentümer, WEGs und Hausverwaltungen.",
  scrollHint: "Eine Nacht, zwei Ausgänge — scrollen Sie.",
  cta: [
    { ...SM_CTA.bestandscheck, variant: "primary" as const },
    { ...SM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Story (Akt 2) */

/** Uhr-Eckwerte der Story-Nacht. */
export const SM_CLOCK = { startMin: 12, peakMin: 19, hour: 3 };

/** Phasen-Grenzen im Story-Progress [0..1]. */
export const SM_PHASES = {
  burnEnd: 0.3,
  rewindEnd: 0.55,
} as const;

export const SM_STORY = {
  burn: {
    kicker: "03:12 · Wohnung 3.2",
    headline: "Es beginnt lautlos.",
    lines: [
      "Ein Schwelbrand. Kein Feuerschein, noch nicht — nur Rauch.",
      "Im Schlaf riecht der Mensch nichts.",
      "Niemand wacht auf.",
    ],
  },
  rewind: {
    kicker: "Zurück",
    headline: "Drehen wir diese Nacht zurück.",
    subline:
      "Zurück zu dem Moment, in dem noch nichts passiert ist. Und geben dem Haus, was gefehlt hat: einen Melder, der wacht.",
  },
  rescue: {
    kicker: "03:12 · Dieselbe Minute",
    headline: "Diesmal wacht jemand.",
    resolveHeadline:
      "Der Unterschied zwischen diesen zwei Nächten hängt an der Decke.",
    resolveSubline:
      "Ein Melder rettet nur, wenn er hängt, funktioniert und geprüft ist. Genau dafür gibt es SmokeMieter.",
  },
} as const;

/** Rettungs-Beats (Phase C) — Zeitfenster in Phase-C-Fortschritt [0..1]. */
export interface SmBeat {
  clock: string;
  text: string;
  /** Fensterstart im Phase-C-Progress (Karte erscheint ab hier). */
  at: number;
}

export const SM_BEATS: SmBeat[] = [
  { clock: "03:12", text: "Der erste Rauch erreicht den Melder. Alarm: 85 dB.", at: 0.08 },
  { clock: "03:13", text: "Alle sind wach.", at: 0.28 },
  { clock: "03:15", text: "Alle im Treppenhaus.", at: 0.44 },
  { clock: "03:19", text: "Die Feuerwehr ist da. Der Brand bleibt eine Randnotiz.", at: 0.6 },
];

/** Ab diesem Phase-C-Progress blendet die Morgen-Auflösung ein. */
export const SM_RESOLVE_AT = 0.78;

/* ────────────────────────────────────────────── Sachsektionen (Akt 3) */

export interface SmSection {
  id: string;
  kicker: string;
  headline: string;
  subline: string;
  points?: string[];
  /** optionales Medium rechts/links (Key aus SM_IMAGE/SM_VIDEO) */
  media?: keyof typeof SM_IMAGE;
  video?: keyof typeof SM_VIDEO;
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
}

export const SM_SECTIONS: SmSection[] = [
  {
    id: "pflicht",
    kicker: "Die Pflicht",
    headline: "Pflicht ist das Minimum. Nachweis ist der Standard.",
    subline:
      "Rauchwarnmelder sind in Deutschland Pflicht — die Details regeln die Landesbauordnungen. SmokeMieter macht daraus einen dokumentierten Zustand: Bestand, Prüfstatus und Nachweise, jederzeit abrufbar.",
    points: [
      "Bestand je Wohnung und Raum",
      "Prüfstatus auf einen Blick",
      "Nachweise für die Akte",
    ],
  },
  {
    id: "ferninspektion",
    kicker: "Ferninspektion & Live-Status",
    headline: "Geprüft, ohne zu klingeln.",
    subline:
      "Funk-Rauchwarnmelder werden je nach Gerätetyp aus der Ferne inspiziert — orientiert an DIN 14676, ohne Termin und ohne Wohnungszutritt. Der Status ist live sichtbar; Ereignisse wie Alarm, Demontage oder Störung werden erkannt und klar kommuniziert.",
    points: [
      "Inspektion ohne Wohnungszutritt",
      "Live-Status je Melder",
      "Alarm, Demontage und Störung gemeldet",
    ],
    media: "detector",
    video: "detector",
  },
  {
    id: "verwaltung",
    kicker: "Für Hausverwaltungen",
    headline: "Weniger Termine. Weniger Rückfragen. Ein Protokoll.",
    subline:
      "SmokeMieter strukturiert den Melderbestand digital: Wohnungen, Räume, Geräte, Ereignisse und Prüfnachweise — statt Terminketten und Zettelwirtschaft.",
    points: [
      "Digitaler Bestand statt Excel-Liste",
      "Ereignisprotokoll je Objekt",
      "Dokumentation, die Prüfungen standhält",
    ],
  },
  {
    id: "mieter",
    kicker: "Für Mieter",
    headline: "Sicherheit, die keine Termine braucht.",
    subline:
      "Kein Jahres-Termin, niemand Fremdes in der Wohnung: Bei Ferninspektion bleibt der Alltag ungestört. Und wenn etwas passiert, gibt es eine klare Information statt Rätselraten.",
    points: [
      "Kein Termin für die Sichtprüfung nötig",
      "Ungestörter Alltag",
      "Klare Information im Ereignisfall",
    ],
  },
  {
    id: "wartung",
    kicker: "Wartung & Austausch",
    headline: "Melder altern. Das System vergisst es nicht.",
    subline:
      "Montage, laufende Wartung und der altersbedingte Gerätetausch — spätestens nach zehn Jahren — sind Teil des Modells. Jede Maßnahme landet in der Historie.",
    points: [
      "Montage durch Fachpartner",
      "Tausch rechtzeitig geplant",
      "Lückenlose Gerätehistorie",
    ],
  },
  {
    id: "abrechnung",
    kicker: "Abrechnung",
    headline: "Miete statt Investition — sauber abgebildet.",
    subline:
      "Das Mietmodell schafft die Grundlage für eine betriebskostenfähige Abrechnung: klare Leistungen, klare Zeiträume, klare Belege.",
    points: [
      "Planbare monatliche Kosten",
      "Leistungen sauber dokumentiert",
      "Abrechnungsfähig strukturiert",
    ],
  },
  {
    id: "ablauf",
    kicker: "Der Weg",
    headline: "Von der Bestandsaufnahme bis zum wachenden Betrieb.",
    subline:
      "SmokeMieter führt Ihr Objekt Schritt für Schritt in den verwalteten Zustand.",
    points: [
      "Bestand aufnehmen",
      "Konzept festlegen",
      "Melder montieren",
      "Ferninspektion aktivieren",
      "Ereignisse kommunizieren",
      "Nachweise dokumentieren",
      "Abrechnung vorbereiten",
    ],
  },
  {
    id: "plattform",
    kicker: "Das System",
    headline: "Ein Dashboard für jeden Melder im Haus.",
    subline:
      "SmokeMieter ist Teil von Powerhouse 360: Melder, Räume, Status, Ereignisse und Nachweise laufen in einer Ansicht zusammen.",
    cta: [{ ...SM_CTA.demo, variant: "secondary" }],
  },
];

/** Verwaltungs-Widgets (glaubwürdige Zustände — 14 Wohnungen × 3 Melder). */
export const SM_ADMIN_WIDGETS: {
  label: string;
  value: string;
  state?: "ok" | "info" | "warn";
}[] = [
  { label: "Melder im Bestand", value: "42", state: "ok" },
  { label: "Ferninspektion", value: "Aktiv", state: "ok" },
  { label: "Letzte Prüfung", value: "Vollständig", state: "ok" },
  { label: "Offene Ereignisse", value: "0", state: "ok" },
  { label: "Nachweise", value: "Abrufbar", state: "info" },
];

/* ────────────────────────────────────────────── Final-CTA (Akt 4) */

export const SM_FINAL = {
  kicker: "SmokeMieter",
  headline: "Die zweite Version der Nacht beginnt mit einem Gespräch.",
  subline:
    "Mit SmokeMieter wird die Rauchwarnmelder-Pflicht zum verwalteten Zustand: montiert, ferngeprüft, dokumentiert und abrechnungsfähig strukturiert.",
  support: "Für Eigentümer, WEGs, Hausverwaltungen und Wohnungsunternehmen.",
  cta: [
    { ...SM_CTA.bestandscheck, variant: "primary" as const },
    { ...SM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Media-Manifest */

export const SM_IMAGE = {
  burn: "/media/smokemieter/burn.jpg",
  alarm: "/media/smokemieter/alarm.jpg",
  dawn: "/media/smokemieter/dawn.jpg",
  night: "/media/smokemieter/night.jpg",
  /** Bestands-Assets der Startseite */
  detector: "/media/stills/smokemieter.jpg",
} as const;

export const SM_VIDEO = {
  detector: "/media/clips/smokemieter.mp4",
} as const;

/** Brand-Scrub-Sequenz — count/height nach Task 2 mit Ist-Werten füllen. */
export const SM_STORY_FRAMES = {
  pattern: "/media/smokemieter/story-frames/frame_%03d.jpg",
  count: 96,
  width: 1600,
  height: 900,
};

export function smStoryFramePath(i: number): string {
  return SM_STORY_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(SM_STORY_FRAMES.count, i))).padStart(3, "0")
  );
}
```

- [ ] **Step 2: Ist-Werte eintragen**

`SM_STORY_FRAMES.count` und `.height` mit den in Task 2 Step 3 notierten Werten überschreiben (falls ≠ 96/900).

- [ ] **Step 3: Build-Check + Commit**

```bash
npm run build
git add src/content/smokemieter.ts && git commit -m "Smokemieter: Content — Story-Beats, Sektionen, Media-Manifest"
```
Erwartung: Build grün (Datei wird noch nirgends importiert — reiner Syntax/Typ-Check).

---

### Task 4: Story-Store `src/lib/smokeProgress.ts`

**Files:**
- Create: `src/lib/smokeProgress.ts`

Schlanker als `chargeProgress.ts`: EIN Runway (raw ∈ [0,1]), keine Szenen-Plateaus. Alle Abbildungen (Frame-Index, Uhr, Phasen-Gewichte, Beat-Fenster) sind reine Funktionen des Progress.

- [ ] **Step 1: Datei anlegen — kompletter Inhalt:**

```ts
/**
 * SmokeMieter — Story-Progress-Store für /smokemieter.
 *
 * Ein einziger Scroll-Runway (Akt 2) mit drei Phasen:
 *   burn   [0 .. SM_PHASES.burnEnd)    — Brand-Frames vorwärts, Uhr vor
 *   rewind [burnEnd .. rewindEnd)      — dieselben Frames rückwärts, Uhr zurück
 *   rescue [rewindEnd .. 1]            — Alarm/Beats/Morgen-Auflösung
 *
 * Eigenständig neben lib/scrollProgress.ts (Homepage, N=9) und
 * lib/chargeProgress.ts (/chargemieter, N=12) — bewusste Parallel-Struktur.
 */

import { SM_PHASES, SM_CLOCK, SM_BEATS, SM_RESOLVE_AT } from "@/content/smokemieter";

const store = {
  /** raw Story-Progress [0,1]; -1 bis die Bridge misst. */
  raw: -1,
  reduced: false,
};

export function smSetRaw(v: number) {
  store.raw = Math.min(1, Math.max(0, v));
}
export function smSetReduced(v: boolean) {
  store.reduced = v;
}
export function smGetReduced() {
  return store.reduced;
}
export function smRawFloat(): number {
  return store.raw >= 0 ? store.raw : 0;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export type SmPhase = "burn" | "rewind" | "rescue";

/** Fortschritt [0,1] innerhalb der jeweiligen Phase. */
export function smPhaseT(p: number): { phase: SmPhase; t: number } {
  const { burnEnd, rewindEnd } = SM_PHASES;
  if (p < burnEnd) return { phase: "burn", t: p / burnEnd };
  if (p < rewindEnd)
    return { phase: "rewind", t: (p - burnEnd) / (rewindEnd - burnEnd) };
  return { phase: "rescue", t: (p - rewindEnd) / (1 - rewindEnd) };
}

/**
 * Frame-Index [0..count-1] für den Brand-Scrub.
 * burn: vorwärts · rewind: rückwärts · rescue: Frame 0 (ausgeblendet).
 */
export function smFrameIndex(p: number, count: number): number {
  const { phase, t } = smPhaseT(p);
  const last = count - 1;
  if (phase === "burn") return Math.round(smoothstep(t) * last);
  if (phase === "rewind") return Math.round((1 - smoothstep(t)) * last);
  return 0;
}

/**
 * Uhranzeige "03:MM" (+ Rewind-Flag für das ◀◀-Präfix).
 * rescue folgt den Beat-Uhrzeiten aus SM_BEATS.
 */
export function smClock(p: number): { text: string; rewinding: boolean } {
  const { phase, t } = smPhaseT(p);
  const span = SM_CLOCK.peakMin - SM_CLOCK.startMin;
  let min = SM_CLOCK.startMin;
  let rewinding = false;
  if (phase === "burn") {
    min = SM_CLOCK.startMin + Math.round(smoothstep(t) * span);
  } else if (phase === "rewind") {
    min = SM_CLOCK.startMin + Math.round((1 - smoothstep(t)) * span);
    rewinding = true;
  } else {
    let clock = SM_BEATS[0].clock;
    for (const b of SM_BEATS) if (t >= b.at) clock = b.clock;
    return { text: clock, rewinding: false };
  }
  const h = String(SM_CLOCK.hour).padStart(2, "0");
  return { text: `${h}:${String(min).padStart(2, "0")}`, rewinding };
}

/** Sichtbarkeit [0,1] eines Phasen-Copy-Blocks (weich rein/raus). */
export function smCopyWeight(phase: SmPhase, p: number): number {
  const cur = smPhaseT(p);
  if (cur.phase !== phase) return 0;
  const inn = smoothstep(cur.t / 0.14);
  const out =
    phase === "rescue" ? 1 : 1 - smoothstep((cur.t - 0.82) / 0.16);
  return Math.min(inn, out);
}

/** Sichtbarkeit [0,1] der Beat-Karte i (nur in rescue; bleibt stehen). */
export function smBeatWeight(i: number, p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "rescue") return 0;
  const beat = SM_BEATS[i];
  if (!beat) return 0;
  const fadeOut = 1 - smoothstep((t - (SM_RESOLVE_AT + 0.04)) / 0.08);
  return Math.min(smoothstep((t - beat.at) / 0.06), fadeOut);
}

/** Sichtbarkeit [0,1] der Morgen-Auflösung (Bild + Schlusszeilen). */
export function smResolveWeight(p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "rescue") return 0;
  return smoothstep((t - SM_RESOLVE_AT) / 0.1);
}

/** Alarm-Still-Deckkraft: trägt rescue bis zur Auflösung. */
export function smAlarmWeight(p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "rescue") return 0;
  return Math.min(smoothstep(t / 0.08), 1 - smResolveWeight(p));
}

/** Roter Gefahren-Wash: wächst in burn, weicht in rewind, weg in rescue. */
export function smDangerWeight(p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase === "burn") return 0.25 + 0.75 * smoothstep(t);
  if (phase === "rewind") return 1 - smoothstep(t);
  return 0;
}

/** rAF-Loop (Dev: läuft bei verstecktem Tab als Timer weiter). */
export function smFrameLoop(cb: (now: number) => void): () => void {
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const pump = () => {
    if (stopped) return;
    if (
      process.env.NODE_ENV !== "production" &&
      typeof document !== "undefined" &&
      document.hidden
    ) {
      timer = setTimeout(() => {
        cb(performance.now());
        pump();
      }, 120);
    } else {
      raf = requestAnimationFrame((t) => {
        cb(t);
        pump();
      });
    }
  };
  pump();
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
  };
}

export default store;
```

- [ ] **Step 2: Build-Check + Commit**

```bash
npm run build
git add src/lib/smokeProgress.ts && git commit -m "Smokemieter: Story-Store (Phasen, Frame-Mapping, Uhr, Beats)"
```

---

### Task 5: Scroll-Bridge `SmokeStoryBridge.tsx`

**Files:**
- Create: `src/components/smokemieter/SmokeStoryBridge.tsx`

Muster: `ChargeScrollBridge` ([src/components/chargemieter/ChargeScrollBridge.tsx](../../src/components/chargemieter/ChargeScrollBridge.tsx)), vereinfacht auf EIN Band.

- [ ] **Step 1: Datei anlegen — kompletter Inhalt:**

```tsx
"use client";

import { useEffect } from "react";
import { smSetRaw, smSetReduced, smFrameLoop } from "@/lib/smokeProgress";

/**
 * Misst den [data-sm-story]-Runway und speist den rohen Story-Progress
 * [0,1] in den SmokeMieter-Store. Offsets werden gecacht; pro Frame wird
 * nur window.scrollY gelesen (Lenis-kompatibel, kein Layout-Thrash).
 * Progress 1 ist erreicht, wenn das Runway-Ende den Viewport-Boden trifft.
 */
export default function SmokeStoryBridge() {
  useEffect(() => {
    let top = 0;
    let end = 1;

    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-sm-story]");
      if (!el) return;
      const y = window.scrollY;
      top = y + el.getBoundingClientRect().top;
      end = top + Math.max(1, el.offsetHeight - window.innerHeight);
    };

    const tick = () => {
      if (process.env.NODE_ENV !== "production") {
        const forced = (window as Window & { __smForceRaw?: number })
          .__smForceRaw;
        if (typeof forced === "number") {
          smSetRaw(forced);
          return;
        }
      }
      const y = window.scrollY;
      smSetRaw((y - top) / Math.max(1, end - top));
    };

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncRM = () => smSetReduced(mq?.matches ?? false);
    syncRM();
    mq?.addEventListener?.("change", syncRM);

    measure();
    const stop = smFrameLoop(tick);
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      stop();
      window.removeEventListener("resize", measure);
      mq?.removeEventListener?.("change", syncRM);
      ro.disconnect();
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Build-Check + Commit**

```bash
npm run build
git add src/components/smokemieter/SmokeStoryBridge.tsx && git commit -m "Smokemieter: Scroll-Bridge für den Story-Runway"
```

---

### Task 6: Story-Stage `SmokeStory.tsx` (Herzstück)

**Files:**
- Create: `src/components/smokemieter/SmokeStory.tsx`

Frame-Streaming, Canvas-Draw und Video/Layer-Lifecycle folgen `ChargeStage` ([ChargeStage.tsx](../../src/components/chargemieter/ChargeStage.tsx) — Frame-Pump Z. 96–134, Canvas-Sizing Z. 136–149, cover-Draw Z. 161–180). Abweichung: hier trägt der Canvas die GANZE Phase A+B (nicht nur den Hero), und statt Media-Ebenen pro Szene gibt es genau vier Layer: Canvas (burn-Frames), `alarm`-Still, `dawn`-Still, Grade/Wash.

- [ ] **Step 1: Datei anlegen.** Struktur (vollständig umzusetzen):

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  SM_IMAGE,
  SM_STORY,
  SM_BEATS,
  SM_STORY_FRAMES,
  smStoryFramePath,
} from "@/content/smokemieter";
import {
  smRawFloat,
  smGetReduced,
  smFrameLoop,
  smFrameIndex,
  smClock,
  smCopyWeight,
  smBeatWeight,
  smResolveWeight,
  smAlarmWeight,
  smDangerWeight,
} from "@/lib/smokeProgress";

const RUNWAY_VH = 800; // Scroll-Länge der Story

export default function SmokeStory() {
  /* Refs: canvasRef, Layer-Refs (alarm, dawn, danger, clock, copyRefs,
     beatRefs, resolveRef), framesRef, drawnFrameRef, canvasOnRef */

  /* Effekt 1 — Frame-Streaming: identisch zum ChargeStage-Pump
     (CONCURRENCY 6, decoding async, Rückwärts-Backfill beim Draw),
     Quelle smStoryFramePath(1..count). Bei reduced-motion/saveData: skip. */

  /* Effekt 2 — Canvas-Sizing mit DPR-Deckel 1.75, wie ChargeStage. */

  /* Effekt 3 — smFrameLoop(tick). tick():
     p = smRawFloat(); rm = smGetReduced();
     — Canvas: idx = smFrameIndex(p, SM_STORY_FRAMES.count);
       nächstliegenden geladenen Frame ≤ idx zeichnen (cover-fit);
       Canvas-Opacity: 1 in burn/rewind, (1 - smAlarmWeight - smResolveWeight)
       in rescue. Bei rm: Canvas aus, stattdessen burn-Still (Image-Layer).
     — alarm-Layer.opacity = smAlarmWeight(p)
     — dawn-Layer.opacity  = smResolveWeight(p)
     — danger-Wash.opacity = 0.36 * smDangerWeight(p)   (rgba(190,40,20))
     — amber-Wash.opacity  = 0.22 * smResolveWeight(p)  (#e8973c)
     — Uhr: {text, rewinding} = smClock(p); textContent = (rewinding ? "◀◀ " : "") + text;
       Uhr-Farbe: danger-rot in burn, neutral in rewind, amber in rescue.
     — Copy-Blöcke burn/rewind/rescue: opacity = smCopyWeight(phase, p),
       translateY = (1-weight)*14px; burn-lines staffeln:
       line k sichtbar ab t > 0.15 + k*0.22 (weich via smoothstep im Store-Stil).
     — Beat-Karten: opacity/translate aus smBeatWeight(i, p).
     — Resolve-Block (resolveHeadline/resolveSubline): smResolveWeight(p). */

  return (
    <section
      id="story"
      data-sm-story
      style={{ height: `${RUNWAY_VH}vh` }}
      className="relative"
      aria-label="Die Geschichte einer Nacht — mit und ohne Rauchwarnmelder"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-navy-900">
        {/* Layer-Stapel (unten→oben):
            1. burn-Still (Image, fill, unoptimized) — Poster/reduced-Fallback
            2. <canvas> — Frame-Scrub (opacity 0 bis erster Draw)
            3. alarm-Still (Image, opacity 0)
            4. dawn-Still (Image, opacity 0)
            5. danger-Wash (div, bg rgba(190,40,20), mix-blend multiply o. plain)
            6. amber-Wash (div, bg #e8973c)
            7. Grade: Vignette + Tiefen-Gradient (wie ChargeStage Z. 333–347)
            8. Uhr — oben zentriert, font-mono tabular-nums, text-3xl/5xl,
               tracking-widest, mit aria-hidden (dekorativ; Copy trägt Inhalt)
            9. Copy-Blöcke (burn links, rewind zentriert, rescue links)
               — max-w-xl, kicker/headline/lines wie ChargePanel-Typo
           10. Beat-Karten: rechte Spalte (md+) / unten gestapelt (mobile),
               Karte: rounded-xl border border-white/12 bg-black/45 backdrop-blur,
               innen: mono-Uhrzeit + Satz
           11. Resolve-Block zentriert (resolveHeadline groß, subline, amber-Akzent)
        */}
      </div>
    </section>
  );
}
```

Alle Bild-Layer: `next/image` mit `fill`, `sizes="100vw"`, `unoptimized`, `className="object-cover"`, `draggable={false}`; nur der unterste Layer bekommt `alt` („Mehrfamilienhaus bei Nacht, Rauch hinter einem Fenster"), Rest `alt=""` + `aria-hidden`.

**A11y:** Der komplette Story-Text (burn-lines, rewind, Beats, resolve) muss als echter DOM-Text gerendert sein (opacity-Steuerung, kein bedingtes Mount) — Screenreader lesen die Erzählung linear.

- [ ] **Step 2: Build-Check + Commit**

```bash
npm run build
git add src/components/smokemieter/SmokeStory.tsx && git commit -m "Smokemieter: Story-Stage — Brand-Scrub, Rewind, Beats, Auflösung"
```

---

### Task 7: Hero, Sachsektionen, Final-CTA, Nav

**Files:**
- Create: `src/components/smokemieter/SmokeHero.tsx`
- Create: `src/components/smokemieter/SmokeSections.tsx`
- Create: `src/components/smokemieter/SmokeCta.tsx`
- Create: `src/components/smokemieter/SmokeNav.tsx`

Typografie/Buttons: exakt die Klassenmuster aus `ChargePanel.tsx` übernehmen (kicker: uppercase tracking, headline-Größen, primary/secondary-Button-Styles) — vorher lesen und 1:1 die Klassen verwenden, Akzentfarbe auf `var(--color-mod-smoke)` umgestellt.

- [ ] **Step 1: `SmokeHero.tsx`** — Server-Component-fähig (kein Store-Zugriff): full-height Section, Hintergrund `SM_IMAGE.night` (Image fill + dunkler Gradient), Inhalt aus `SM_HERO` (kicker, headline, headlineAccent in amber, subline, 2 CTA-Buttons als `<a>`), unten mittig `SM_HERO.scrollHint` mit dezentem ↓. `id="start"`.

- [ ] **Step 2: `SmokeSections.tsx`** — mappt `SM_SECTIONS`: je Section `<section id={s.id}>` mit `py-24 md:py-32`, max-w-6xl, Grid: Text (kicker amber, headline, subline, points als Liste mit amber-Punkt) + optionales Medium (`s.media`/`s.video`: Image bzw. `<video muted loop playsInline autoPlay preload="metadata">` mit Poster). `plattform`-Section rendert zusätzlich `SM_ADMIN_WIDGETS` als Widget-Grid (Muster: CM_DASHBOARD-Widgets in ChargeOverlays — Karten mit label/value/state-Dot) und den Demo-CTA. Alternierende Ausrichtung (gerade links, ungerade rechts). `ablauf`-points als nummerierte Schritte-Reihe.

- [ ] **Step 3: `SmokeCta.tsx`** — Section `id="kontakt"`, Hintergrund `SM_IMAGE.night` gedimmt, zentriert: `SM_FINAL` kicker/headline/subline, beide CTAs, Support-Zeile klein darunter.

- [ ] **Step 4: `SmokeNav.tsx`** — `ChargeNav.tsx` kopieren, dann exakt ändern: Logo-Wortmarke „SmokeMieter", Akzent `--color-mod-smoke`, Links → `#story` „Die Nacht", `#pflicht` „Pflicht", `#ferninspektion` „Ferninspektion", `#plattform` „System", CTA-Button `SM_CTA.bestandscheck` (Kurzlabel „Bestandscheck"). Zurück-Link zur Startseite behalten, falls ChargeNav einen hat.

- [ ] **Step 5: Build-Check + Commit**

```bash
npm run build
git add src/components/smokemieter && git commit -m "Smokemieter: Hero, Sachsektionen, Final-CTA, Nav"
```

---

### Task 8: Route `src/app/smokemieter/page.tsx` + Experience-Wrapper

**Files:**
- Create: `src/app/smokemieter/page.tsx`
- Create: `src/components/smokemieter/SmokeExperience.tsx`

- [ ] **Step 1: `SmokeExperience.tsx`** — Client-Wrapper, komponiert: `<SmokeStoryBridge />` + `<SmokeHero />` + `<SmokeStory />` + `<SmokeSections />` + `<SmokeCta />`. (Kein Loader nötig — der Hero ist ein klassisches Bild, kein Asset-Gate wie bei Chargemieter.)

- [ ] **Step 2: `page.tsx`** — Muster [src/app/chargemieter/page.tsx](../../src/app/chargemieter/page.tsx), Inhalt:

```tsx
import type { Metadata } from "next";
import SmokeNav from "@/components/smokemieter/SmokeNav";
import SmokeExperience from "@/components/smokemieter/SmokeExperience";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SmokeMieter — Rauchwarnmelder im Mehrfamilienhaus | Powerhouse 360",
  description:
    "SmokeMieter macht die Rauchwarnmelder-Pflicht betreibbar: Montage, Ferninspektion ohne Wohnungszutritt, Live-Status, Ereigniskommunikation und lückenlose Dokumentation — für Eigentümer, WEGs und Hausverwaltungen.",
  openGraph: {
    title: "SmokeMieter — Rauchwarnmelder im Mehrfamilienhaus",
    description:
      "Montiert, ferngeprüft, dokumentiert: die Komplettlösung für Rauchwarnmelder im Mehrfamilienhaus.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/media/smokemieter/dawn.jpg",
        width: 2400,
        height: 1350,
        alt: "Mehrfamilienhaus im ersten Morgenlicht — SmokeMieter",
      },
    ],
  },
};

export default function SmokeMieterPage() {
  return (
    <>
      <SmokeNav />
      <main>
        <SmokeExperience />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Build-Check + Commit**

```bash
npm run build
git add src/app/smokemieter src/components/smokemieter/SmokeExperience.tsx
git commit -m "Smokemieter: /smokemieter Route mit Hybrid-Aufbau"
```

---

### Task 9: Preview-Verifikation (Desktop, Mobile, reduced-motion)

- [ ] **Step 1:** Dev-Server via `preview_start` (launch.json vorhanden vom Chargemieter-Bau; sonst anlegen: `npm run dev`, Port 3000). `/smokemieter` öffnen.

- [ ] **Step 2: Story-Phasen erzwingen und screenshots:**
`preview_eval`: `window.__smForceRaw = X; window.scrollTo(0, <story-mitte>)` für X ∈ {0.0, 0.15, 0.40, 0.60, 0.70, 0.90} → je `preview_screenshot`. Prüfen: Frames laufen vorwärts (0.15), rückwärts-Stand (0.40), Uhr korrekt (03:1x, ◀◀ nur in rewind), Beat-Karten erscheinen gestaffelt (0.60/0.70), Morgen-Auflösung amber (0.90). Danach `window.__smForceRaw = undefined`.

- [ ] **Step 3:** `preview_console_logs` (level error) + `preview_network` (failed): keine 404 auf Frames/Stills, keine React-Fehler.

- [ ] **Step 4:** `preview_resize` mobile (375×812): Hero lesbar, Story-Copy nicht überlappend, Beats gestapelt; Sections einspaltig. Screenshot.

- [ ] **Step 5:** Reduced-motion: `preview_resize` mit colorScheme egal + `preview_eval` matchMedia-Emulation ist nicht möglich — stattdessen kurz `smSetReduced`-Pfad prüfen via `preview_eval`-Aufruf des Stores? Nicht exportiert ans window → stattdessen: DevTools-Emulation entfällt; Verifikation über Code-Review des rm-Pfads in SmokeStory (Canvas skip, burn-Still sichtbar) + `npm run build` grün. Notieren, falls offen.

- [ ] **Step 6:** Anker-Navigation klicken (`preview_click` auf Nav-Links) → Sections erreichbar; CTAs führen auf `/projekt-besprechen?modul=smokemieter&…` (Query im `preview_snapshot` prüfen).

- [ ] **Step 7:** Gefundene Bugs fixen (Quelle lesen → Edit → ab Step 2 erneut), dann Commit:

```bash
git add -A src/ && git commit -m "Smokemieter: Feinschliff nach Preview-Verifikation"
```

---

### Task 10: Abschluss-Commit & Deploy-Freigabe

- [ ] **Step 1:** `git status` sauber? `npm run build` final grün.
- [ ] **Step 2:** Dem User Ergebnis mit Screenshots melden. **Deploy (powerhouse360.de, VPS/Coolify per tar+ssh+docker — Methode im Memory `powerhouse360-vps-deploy.md`) erst nach ausdrücklicher Freigabe des Users ausführen** — die Site ist öffentlich.

---

## Self-Review (durchgeführt)

- **Spec-Coverage:** Akt 1 Hero → T7/T8 ✓ · Story 3 Phasen + Uhr + Beats + Farbdramaturgie → T3/T4/T6 ✓ · 8 Sektionen → T3/T7 ✓ · Final-CTA → T3/T7 ✓ · Wording-Leitplanken → Header + Content-Kommentar ✓ · Assets A1–A5 + Pipeline → T1/T2 ✓ · Mobile/reduced → T6/T9 ✓ · SEO/OG → T8 ✓ · CTAs/Funnel-Links → T3 ✓ · Nicht-Ziele (Homepage-Link unangetastet, keine Refactorings) → kein Task ändert Bestandsdateien ✓
- **Platzhalter:** `SM_STORY_FRAMES.count = 96` ist als „Ist-Wert nach Task 2 eintragen" markiert (T3 S2) — bewusst, kein vergessener Platzhalter. Job-IDs/URLs in T1 sind Laufzeitwerte.
- **Typ-Konsistenz:** Store importiert `SM_PHASES`, `SM_CLOCK`, `SM_BEATS`, `SM_RESOLVE_AT` — alle in T3 definiert ✓. `smStoryFramePath`, `SM_STORY_FRAMES` von T6 genutzt ✓. `SmokeStoryBridge` nutzt nur `smSetRaw/smSetReduced/smFrameLoop` ✓.
