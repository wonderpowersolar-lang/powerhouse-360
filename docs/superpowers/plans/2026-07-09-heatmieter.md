# Heatmieter Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die `/heatmieter`-Seite bauen — Hybrid aus klassischem Hero, Vorwärts-Scroll-Story „Zwei Winter, zwei Abrechnungen" (Blackbox-Winter → Wechsel → transparenter Winter) und acht klassischen Sachsektionen, nach Spec `docs/superpowers/specs/2026-07-08-heatmieter-design.md`.

**Architecture:** Higgsfield-Assets zuerst (H1–H4, mit User-Wärmepumpen-Referenz), dann additive Next.js-Dateien nach dem Smokemieter-Muster: eigene Content-Datei als Single Source of Truth, eigener schlanker Progress-Store (1 Runway, 3 Phasen), Frame-Scrub-Canvas. **Kern-Trick:** Phase C (Winter 2) scrubbt dieselbe Frame-Sequenz wie Phase A erneut vorwärts — nur mit orangem DOM-Datenlayer darüber. Nichts Bestehendes wird umgebaut.

**Tech Stack:** Next.js 16 (App Router, `next dev --webpack`), React 19, Tailwind 4, Lenis (global vorhanden), Canvas-Frame-Scrub, Higgsfield MCP (nano_banana_pro + seedance_2_0), ffmpeg.

**Verifikation statt TDD:** Das Projekt hat keinen Test-Runner (package.json: kein `test`-Script). Projektkonvention ist `npm run build` (Typecheck) + Preview-Verifikation mit Force-Hook (`__hmForceRaw`) und Screenshots. Jede Task endet mit Build- oder Preview-Verify.

**Wording-Leitplanken (aus Spec §5, gelten für jede Copy-Zeile):** keine erfundenen Statistiken, keine €-Beträge, keine Prozent-Ersparnisse; „falsche Abrechnung" nur als erlebte Situation DIESES Hauses (Schätzwerte, nicht erfolgte Ablesung, Widerspruch) — keine Branchen-Pauschalaussage; Einsparpotenziale „sichtbar machen/erkennen", keine Spargarantie; Recht ohne Rechtsberatung („die Details regelt die Heizkostenverordnung"); Abrechnung „transparent, nachvollziehbar, vorbereitet", CO₂-Kostenaufteilung „datenseitig abgebildet / Grundlage schaffen"; kein Bewohner-Blaming im Ausreißer-Beat; Schreibweise auf der Seite **HeatMieter**.

---

### Task 1: Higgsfield-Assets H1–H4 generieren

**Files:**
- Create: `public/media/heatmieter/` (raw-Downloads: `winter-raw.png`, `winter-clip-raw.mp4`, `pump-raw.png`, `thaw-raw.png`)

Alle Bild-Jobs: `mcp__e46687a2-…__generate_image` mit `model: "nano_banana_pro"`, `aspect_ratio: "16:9"`. Video: `generate_video` mit `model: "seedance_2_0"`. Referenz-Medien als `medias: [{value: "<job-id-oder-media-id>", role: "image"}]` (bzw. `role: "start_image"` beim Video). Beim ersten Call `get_cost: true` als Preflight, dann ohne. Falls der Server ein Preset aufdrängt: `declined_preset_id: "24bae836-2c4a-48e0-89b6-49fcc0b21612"`.

**Bildsprache-Regel:** keine Menschen, keine Fahrzeuge in Bewegung, kein Text/Logos. Winter 1 ist kalt-blau und ruhig — die „Blackbox"-Dramatik entsteht über Copy + Ticker, nicht über bedrohliche Bilder. Die Wärmepumpe ist die MFH-Klasse aus der User-Referenz (großer anthrazit Monobloc, quadratisches Schutzgitter) — nie ein kleines EFH-Gerät.

- [ ] **Step 1: Kontostand + Referenz-Job prüfen**

`balance` aufrufen (genug für ~120–200 Credits?). `show_generations` (type `image`): Gebäude/Hero-Referenz `1eb8708e-4880-4919-862e-895973f4e93d` bestätigen.

- [ ] **Step 2: Wärmepumpen-Referenz hochladen**

`media_upload_widget` aufrufen → User lädt sein WP-Referenzbild (anthrazit Monobloc, quadratisches Gitter) hoch → Media-ID als `<WP>` notieren. Fallback, falls kein Upload möglich: WP nur über Prompt-Beschreibung (steht wörtlich in den Prompts unten) — dann Ergebnis besonders kritisch sichten.

- [ ] **Step 3: H1 — Winter-Fassade (Still, Basis + OG)**

Prompt (wörtlich):
> Deep winter night, blue hour. The same modern residential building from the reference, seen from the street: snow on the ground and on the window sills, many windows glowing warm, cold clear air. In the side courtyard, a large anthracite monoblock heat pump unit with a big square protective fan grille (commercial multi-family scale, like the second reference) on a concrete foundation, a faint plume of vapor rising from it. No people, no moving vehicles, no text. Wet-cold asphalt reflections, deep navy shadows, restrained, realistic, photographic.

`medias: [{value: "1eb8708e-4880-4919-862e-895973f4e93d", role: "image"}, {value: <WP>, role: "image"}]`. Job-ID als `<H1>` notieren.

- [ ] **Step 4: H2 — Winter-Clip (Video, das Scrub-Asset)**

`generate_video`, `model: "seedance_2_0"`, `duration: 8`, `medias: [{value: <H1>, role: "start_image"}]`, 1080p falls angeboten (Kern-Asset). Prompt (wörtlich):
> Static camera, locked tripod shot of the snowy residential building at blue hour. Light snow falls continuously, the thin vapor plume from the heat pump in the courtyard rises steadily, the warm windows glow. No people, no vehicles, no cuts, no camera movement. Subtle, realistic, continuous progression.

Statische Kamera ist Pflicht — die Sequenz läuft in Phase A UND Phase C; jede Kamerafahrt zerstört die „derselbe Winter"-Illusion.

- [ ] **Step 5: H3 — Wärmepumpen-Nahaufnahme (Still, Wechsel + Sektion)**

Prompt (wörtlich):
> Close-up in deep winter, blue hour: a large anthracite monoblock heat pump with a big square protective fan grille (commercial multi-family scale, like the reference), light snow dusting its top, standing on a concrete pad beside the residential building, soft vapor rising, one warm facade downlight touching the metal. No people, no text. Premium, quiet, realistic, photographic.

`medias: [{value: <WP>, role: "image"}, {value: "1eb8708e-4880-4919-862e-895973f4e93d", role: "image"}]`

- [ ] **Step 6: H4 — Tauwetter-Morgen (Still, Payoff/CTA)**

Prompt (wörtlich):
> Early spring morning, first warm amber light, thaw: the same residential building, calm and intact, warm morning light on the facade, last patches of melting snow on the ground, thin mist, windows quiet. No people, no text. Hopeful, quiet, cinematic, photographic.

`medias: [{value: "1eb8708e-4880-4919-862e-895973f4e93d", role: "image"}]`

- [ ] **Step 7: Ergebnisse herunterladen**

```bash
mkdir -p "public/media/heatmieter"
curl -L -o "public/media/heatmieter/winter-raw.png"      "<H1-url>"
curl -L -o "public/media/heatmieter/winter-clip-raw.mp4" "<H2-url>"
curl -L -o "public/media/heatmieter/pump-raw.png"        "<H3-url>"
curl -L -o "public/media/heatmieter/thaw-raw.png"        "<H4-url>"
```
Erwartung: 4 Dateien > 1 MB (Stills) bzw. > 2 MB (Clip). Qualität sichten (Read auf die PNGs): Gebäude konsistent zur Serie? WP = großer Monobloc mit quadratischem Gitter (nicht EFH-klein)? Schnee/Blue-Hour-Stimmung? Falls ein Motiv misslingt → Prompt nachschärfen, 1 Retry pro Asset, Job-IDs aktualisieren.

- [ ] **Step 8: Kein Commit**

`*-raw.*` bleiben unversioniert (wie bei Smokemieter) — Task 2 committet die optimierten Derivate.

---

### Task 2: Postprocessing — Stills, Scrub-Clip, Frame-Sequenz

**Files:**
- Create: `public/media/heatmieter/{winter,pump,thaw}.jpg`, `public/media/heatmieter/winter.mp4`, `public/media/heatmieter/story-frames/frame_001.jpg … frame_096.jpg`

- [ ] **Step 1: Stills zu Web-JPEGs**

```bash
cd "public/media/heatmieter"
for n in winter pump thaw; do
  ffmpeg -y -i "${n}-raw.png" -vf "scale=2400:-2" -q:v 5 "${n}.jpg"
done
ls -la *.jpg
```
Erwartung: 3 JPEGs, je ~100–250 KB. Deutlich größer → `-q:v 6`.

- [ ] **Step 2: Clip scrub-optimieren**

```bash
ffmpeg -y -i winter-clip-raw.mp4 -an -c:v libx264 -crf 23 -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart winter.mp4
```
Erwartung: `winter.mp4` ~2–5 MB, ohne Audio.

- [ ] **Step 3: Frame-Sequenz extrahieren**

```bash
mkdir -p story-frames
ffmpeg -y -i winter.mp4 -vf "fps=12,scale=1600:-2" -q:v 4 "story-frames/frame_%03d.jpg"
ls story-frames | wc -l && du -sh story-frames
ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 story-frames/frame_001.jpg
```
Erwartung: **96 Frames** (8 s × 12 fps), gesamt ~6–8 MB, Höhe typisch 900. Ist-Werte notieren → werden `HM_STORY_FRAMES.count`/`.height` in Task 3.

- [ ] **Step 4: Commit**

```bash
git add public/media/heatmieter/*.jpg public/media/heatmieter/winter.mp4 public/media/heatmieter/story-frames
git status --short   # raw-Dateien dürfen NICHT gestaged sein
git commit -m "Heatmieter: Story-Assets (Winter-Scrub-Sequenz, Wärmepumpe, Tauwetter)"
```

---

### Task 3: Content-Datei `src/content/heatmieter.ts`

**Files:**
- Create: `src/content/heatmieter.ts`

- [ ] **Step 1: Datei anlegen — kompletter Inhalt:**

```ts
/**
 * HeatMieter — single source of truth für die /heatmieter-Seite.
 *
 * HYBRID-AUFBAU: klassischer Hero → Scroll-Story (ein Runway, 3 Phasen:
 * winter1 → wechsel → winter2) → 8 klassische Sachsektionen → Final-CTA.
 *
 * Wording constraints (bewusst, aus dem Spec):
 *  - Keine erfundenen Statistiken, keine €-Beträge, keine %-Ersparnisse.
 *    Die Story erzählt EIN Haus und ZWEI konkrete Winter.
 *  - »Falsche Abrechnung« nur als erlebte Situation dieses Hauses
 *    (Schätzwerte, Ablesung nicht erfolgt, Widerspruch) — keine
 *    Pauschalaussage über Messdienste.
 *  - Einsparpotenziale »sichtbar machen / erkennen« — keine Spargarantie.
 *  - Recht: »die Details regelt die Heizkostenverordnung« — keine
 *    Rechtsberatung. Zulässige Fakten: verbrauchsabhängige Abrechnung ist
 *    Pflicht; monatliche Verbrauchsinfo bei fernablesbaren Geräten;
 *    Nachrüstfrist Fernablesbarkeit Ende 2026.
 *  - Abrechnung »transparent, nachvollziehbar, vorbereitet«; CO₂-
 *    Kostenaufteilung »datenseitig abgebildet« / »Grundlage schaffen«.
 *  - Kein Bewohner-Blaming im Ausreißer-Beat (Muster, nicht Personen).
 */

/* ────────────────────────────────────────────── CTAs */

export const HM_CTA = {
  heizkostencheck: {
    label: "Kostenfreien Heizkosten-Check starten",
    href: "/projekt-besprechen?modul=heatmieter&thema=heizkostencheck",
  },
  planung: {
    label: "Wärme-Konzept planen",
    href: "/projekt-besprechen?modul=heatmieter&thema=planung",
  },
  demo: { label: "System ansehen", href: "/demo" },
} as const;

/* ────────────────────────────────────────────── Hero (Akt 1) */

export const HM_HERO = {
  kicker: "Powerhouse 360 · Modul 02",
  headline: "HeatMieter",
  headlineAccent:
    "Heizkosten im Mehrfamilienhaus — erfasst, transparent und nachvollziehbar abgerechnet.",
  subline:
    "HeatMieter macht Wärme betreibbar: fernablesbare Erfassung, Monatswerte je Wohnung, erkannte Einsparpotenziale und eine Heizkostenabrechnung, die sich selbst erklärt — für Eigentümer, WEGs und Hausverwaltungen.",
  scrollHint: "Zwei Winter, zwei Abrechnungen — scrollen Sie.",
  cta: [
    { ...HM_CTA.heizkostencheck, variant: "primary" as const },
    { ...HM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Story (Akt 2) */

/** Monats-Ticker der Heizperiode (läuft in Winter 1 und Winter 2). */
export const HM_MONTHS = ["OKT", "NOV", "DEZ", "JAN", "FEB", "MÄR"] as const;

/** Phasen-Grenzen im Story-Progress [0..1]. */
export const HM_PHASES = {
  winter1End: 0.35,
  wechselEnd: 0.5,
} as const;

export const HM_STORY = {
  winter1: {
    kicker: "Winter 1 · Ein Mehrfamilienhaus",
    headline: "Es heizt. Und niemand sieht es.",
    lines: [
      "Die Heizperiode beginnt. Das Haus verbraucht — unsichtbar.",
      "Der tiefste Winter: hohe Kosten, die niemand sieht.",
      "Monate später kommt der Brief.",
    ],
  },
  wechsel: {
    kicker: "Der Wechsel",
    headline: "Dann übernimmt HeatMieter.",
    subline:
      "Funk-Zähler statt Ableseliste: Monatswerte je Wohnung, Live-Status für Anlage und Verbrauch — die Wärme bekommt Daten.",
  },
  winter2: {
    kicker: "Winter 2 · Dasselbe Haus",
    headline: "Derselbe Winter. Diesmal sichtbar.",
    resolveHeadline: "Die Abrechnung erklärt sich selbst.",
    resolveSubline:
      "Zwischen diesen zwei Wintern liegt keine neue Heizung — sondern Sichtbarkeit. Genau dafür gibt es HeatMieter.",
  },
} as const;

/** Winter-2-Beats — Zeitfenster in Phase-C-Fortschritt [0..1]. */
export interface HmBeat {
  month: string;
  text: string;
  /** Fensterstart im Phase-C-Progress (Karte erscheint ab hier). */
  at: number;
}

export const HM_BEATS: HmBeat[] = [
  {
    month: "OKT",
    text: "Die Heizperiode beginnt — diesmal sichtbar. Monatswerte je Wohnung.",
    at: 0.08,
  },
  {
    month: "DEZ",
    text: "Ein Muster fällt auf, das vorher niemand sehen konnte. Einsparpotenzial erkannt.",
    at: 0.28,
  },
  {
    month: "JAN",
    text: "Bewohner sehen ihren Verbrauch — und heizen bewusster.",
    at: 0.44,
  },
  {
    month: "MÄR",
    text: "Die Heizperiode endet. Die Abrechnung ist vorbereitet.",
    at: 0.6,
  },
];

/** Ab diesem Phase-C-Progress blendet die Abrechnungs-Auflösung ein. */
export const HM_RESOLVE_AT = 0.78;

/** Abrechnungs-Karte 1 — die blinde Abrechnung (Klimax Winter 1). */
export const HM_BILL_BLIND = {
  title: "Heizkostenabrechnung",
  subtitle: "Winter 1",
  rows: [
    { label: "Verbrauch Wohnung 3.2", value: "geschätzt" },
    { label: "Ablesung", value: "nicht erfolgt" },
    { label: "Positionen", value: "nicht nachvollziehbar" },
    { label: "Rückfragen", value: "offen" },
  ],
  stamp: "Widerspruch",
} as const;

/** Abrechnungs-Karte 2 — die transparente Abrechnung (Payoff Winter 2). */
export const HM_BILL_CLEAR = {
  title: "Heizkostenabrechnung",
  subtitle: "Winter 2 · mit HeatMieter",
  rows: [
    { label: "Verbrauch Wohnung 3.2", value: "gemessen, je Monat" },
    { label: "Ablesung", value: "fernablesbar, ohne Termin" },
    { label: "CO₂-Kostenaufteilung", value: "abgebildet" },
    { label: "Rückfragen", value: "keine" },
  ],
  badge: "Vollständig",
} as const;

/** Datenlayer Winter 2 — Einheiten-Chips (glaubwürdige Zustände, neutral). */
export const HM_DATA_UNITS: {
  label: string;
  state: "ok" | "info";
}[] = [
  { label: "WE 1.1", state: "ok" },
  { label: "WE 1.2", state: "ok" },
  { label: "WE 2.1", state: "ok" },
  { label: "WE 2.2", state: "info" },
  { label: "WE 3.1", state: "ok" },
  { label: "WE 3.2", state: "ok" },
];

/* ────────────────────────────────────────────── Sachsektionen (Akt 3) */

export interface HmSection {
  id: string;
  kicker: string;
  headline: string;
  subline: string;
  points?: string[];
  /** optionales Medium (Key aus HM_IMAGE) */
  media?: keyof typeof HM_IMAGE;
  /** optionaler Loop-Clip (Key aus HM_VIDEO) */
  video?: keyof typeof HM_VIDEO;
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
}

export const HM_SECTIONS: HmSection[] = [
  {
    id: "pflicht",
    kicker: "Pflicht & Fristen",
    headline: "Pflicht ist der Rahmen. Transparenz ist der Standard.",
    subline:
      "Die verbrauchsabhängige Heizkostenabrechnung ist Pflicht — die Details regelt die Heizkostenverordnung: fernablesbare Erfassung, monatliche Verbrauchsinformation und die Nachrüstung von Bestandsgeräten bis Ende 2026. HeatMieter macht daraus einen dokumentierten Zustand.",
    points: [
      "Erfassung je Wohnung und Einheit",
      "Monatswerte statt Jahresrätsel",
      "Nachweise für die Akte",
    ],
  },
  {
    id: "erfassung",
    kicker: "Erfassung & Live-Daten",
    headline: "Gemessen, ohne zu klingeln.",
    subline:
      "Fernablesbare Funk-Zähler und Heizkostenverteiler liefern Monatswerte je Wohnung — ohne Ablesetermin, ohne Wohnungszutritt. Auch die Anlage wird sichtbar: Wärmepumpe, Vor- und Rücklauf, Warmwasser.",
    points: [
      "Monatswerte je Wohnung",
      "Anlagen-Status live",
      "Keine Ablesetermine",
    ],
    media: "anlage",
    video: "anlage",
  },
  {
    id: "verwaltung",
    kicker: "Für Hausverwaltungen",
    headline: "Weniger Rückfragen. Klare Antworten. Eine Abrechnung.",
    subline:
      "HeatMieter strukturiert Wärme digital: Einheiten, Verbräuche, Anlagendaten und Abrechnungsstatus in einer Ansicht — Widersprüche werden mit Daten beantwortet statt mit Aktenordnern.",
    points: [
      "Rückfragen mit Daten beantworten",
      "Digitaler Bestand statt Ableselisten",
      "Abrechnung vorbereitet statt improvisiert",
    ],
  },
  {
    id: "bewohner",
    kicker: "Für Bewohner",
    headline: "Wärme, die man versteht.",
    subline:
      "Monatliche Verbrauchsinformation statt Jahresüberraschung: Bewohner sehen ihren Verbrauch, verstehen ihre Abrechnung — und können bewusster heizen.",
    points: [
      "Monatliche Verbrauchsinfo",
      "Keine Ablesetermine",
      "Nachvollziehbare Abrechnung",
    ],
  },
  {
    id: "einsparen",
    kicker: "Einsparpotenziale",
    headline: "Was sichtbar ist, lässt sich optimieren.",
    subline:
      "Ausreißer und Muster werden erkennbar — im Verbrauch wie an der Anlage. HeatMieter macht Einsparpotenziale sichtbar und hilft, Optimierung anzustoßen.",
    points: [
      "Verbrauchsmuster je Einheit",
      "Anlagen-Kennwerte im Blick",
      "Potenziale dokumentiert",
    ],
    media: "pump",
  },
  {
    id: "abrechnung",
    kicker: "Abrechnung & CO₂",
    headline: "Jede Position hat eine Geschichte.",
    subline:
      "Die Heizkostenabrechnung wird transparent und nachvollziehbar vorbereitet — inklusive der CO₂-Kostenaufteilung zwischen Vermietern und Mietern, datenseitig sauber abgebildet.",
    points: [
      "Positionen nachvollziehbar",
      "CO₂-Kostenaufteilung abgebildet",
      "Grundlage für die Betriebskostenabrechnung",
    ],
  },
  {
    id: "ablauf",
    kicker: "Der Weg",
    headline: "Vom Bestand zur Abrechnung, die sich selbst erklärt.",
    subline:
      "HeatMieter führt Ihr Objekt Schritt für Schritt in den transparenten Betrieb.",
    points: [
      "Bestand aufnehmen",
      "Zähler-Konzept festlegen",
      "Montage & Anbindung",
      "Live-Betrieb aktivieren",
      "Verbrauchsinfo bereitstellen",
      "Abrechnung vorbereiten",
    ],
  },
  {
    id: "plattform",
    kicker: "Das System",
    headline: "Ein Dashboard für Wärme, Einheiten und Abrechnung.",
    subline:
      "HeatMieter ist Teil von Powerhouse 360: Verbräuche, Anlage, Ereignisse und Abrechnungsstatus laufen in einer Ansicht zusammen.",
    cta: [{ ...HM_CTA.demo, variant: "secondary" }],
  },
];

/** Verwaltungs-Widgets (glaubwürdige Zustände — 14 Wohnungen). */
export const HM_ADMIN_WIDGETS: {
  label: string;
  value: string;
  state?: "ok" | "info" | "warn";
}[] = [
  { label: "Einheiten erfasst", value: "14", state: "ok" },
  { label: "Fernablesung", value: "Aktiv", state: "ok" },
  { label: "Monatswerte", value: "Vollständig", state: "ok" },
  { label: "Offene Rückfragen", value: "0", state: "ok" },
  { label: "Abrechnung", value: "Vorbereitet", state: "info" },
];

/* ────────────────────────────────────────────── Final-CTA (Akt 4) */

export const HM_FINAL = {
  kicker: "HeatMieter",
  headline: "Ihr zweiter Winter beginnt mit einem Gespräch.",
  subline:
    "Mit HeatMieter wird Wärme zum transparenten Zustand: gemessen, verständlich, abrechnungsfähig strukturiert — und Einsparpotenziale werden sichtbar.",
  support: "Für Eigentümer, WEGs, Hausverwaltungen und Wohnungsunternehmen.",
  cta: [
    { ...HM_CTA.heizkostencheck, variant: "primary" as const },
    { ...HM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Media-Manifest */

export const HM_IMAGE = {
  winter: "/media/heatmieter/winter.jpg",
  pump: "/media/heatmieter/pump.jpg",
  thaw: "/media/heatmieter/thaw.jpg",
  /** Bestands-Assets der Startseite */
  anlage: "/media/stills/heatmieter.jpg",
} as const;

export const HM_VIDEO = {
  anlage: "/media/clips/heatmieter.mp4",
} as const;

/** Winter-Scrub-Sequenz — count/height nach Task 2 mit Ist-Werten füllen. */
export const HM_STORY_FRAMES = {
  pattern: "/media/heatmieter/story-frames/frame_%03d.jpg",
  count: 96,
  width: 1600,
  height: 900,
};

export function hmStoryFramePath(i: number): string {
  return HM_STORY_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(HM_STORY_FRAMES.count, i))).padStart(3, "0")
  );
}
```

- [ ] **Step 2: Ist-Werte eintragen**

`HM_STORY_FRAMES.count` und `.height` mit den in Task 2 Step 3 notierten Werten überschreiben (falls ≠ 96/900).

- [ ] **Step 3: Build-Check + Commit**

```bash
npm run build
git add src/content/heatmieter.ts && git commit -m "Heatmieter: Content — Story, Abrechnungs-Karten, Sektionen, Media-Manifest"
```
Erwartung: Build grün (Datei wird noch nirgends importiert — reiner Syntax/Typ-Check).

---

### Task 4: Story-Store `src/lib/heatProgress.ts`

**Files:**
- Create: `src/lib/heatProgress.ts`

Muster: `smokeProgress.ts`, angepasst auf die Zwei-Winter-Dramaturgie. Alle Abbildungen (Frame-Index, Ticker, Phasen-Gewichte, Beat-/Bill-Fenster, Farb-Washes, Datenlayer) sind reine Funktionen des Progress.

- [ ] **Step 1: Datei anlegen — kompletter Inhalt:**

```ts
/**
 * HeatMieter — Story-Progress-Store für /heatmieter.
 *
 * Ein einziger Scroll-Runway (Akt 2) mit drei Phasen:
 *   winter1 [0 .. HM_PHASES.winter1End)   — Winter-Frames vorwärts, kalt-blau,
 *                                           Klimax: blinde Abrechnung
 *   wechsel [winter1End .. wechselEnd)    — HeatMieter übernimmt, Farbkippe,
 *                                           WP-Still, Datenlayer fährt hoch
 *   winter2 [wechselEnd .. 1]             — DIESELBEN Frames erneut vorwärts,
 *                                           orange Datenlayer, Beats,
 *                                           transparente Abrechnung
 *
 * Eigenständig neben lib/scrollProgress.ts (Homepage), lib/chargeProgress.ts
 * (/chargemieter) und lib/smokeProgress.ts (/smokemieter) — bewusste
 * Parallel-Struktur.
 */

import {
  HM_PHASES,
  HM_MONTHS,
  HM_BEATS,
  HM_RESOLVE_AT,
} from "@/content/heatmieter";

const store = {
  /** raw Story-Progress [0,1]; -1 bis die Bridge misst. */
  raw: -1,
  reduced: false,
};

export function hmSetRaw(v: number) {
  store.raw = Math.min(1, Math.max(0, v));
}
export function hmSetReduced(v: boolean) {
  store.reduced = v;
}
export function hmGetReduced() {
  return store.reduced;
}
export function hmRawFloat(): number {
  return store.raw >= 0 ? store.raw : 0;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export type HmPhase = "winter1" | "wechsel" | "winter2";

/** Fortschritt [0,1] innerhalb der jeweiligen Phase. */
export function hmPhaseT(p: number): { phase: HmPhase; t: number } {
  const { winter1End, wechselEnd } = HM_PHASES;
  if (p < winter1End) return { phase: "winter1", t: p / winter1End };
  if (p < wechselEnd)
    return { phase: "wechsel", t: (p - winter1End) / (wechselEnd - winter1End) };
  return { phase: "winter2", t: (p - wechselEnd) / (1 - wechselEnd) };
}

/**
 * Frame-Index [0..count-1] für den Winter-Scrub.
 * winter1: vorwärts · wechsel: hält den letzten Frame ·
 * winter2: DIESELBE Sequenz erneut vorwärts (der Kern-Trick).
 */
export function hmFrameIndex(p: number, count: number): number {
  const { phase, t } = hmPhaseT(p);
  const last = count - 1;
  if (phase === "winter1") return Math.round(smoothstep(t) * last);
  if (phase === "wechsel") return last;
  return Math.round(smoothstep(t) * last);
}

/**
 * Monats-Ticker. winter1/winter2 laufen OKT→MÄR; wechsel zeigt keinen Monat.
 */
export function hmTicker(p: number): {
  winter: 1 | 2 | null;
  month: string;
} {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return { winter: null, month: "" };
  const idx = Math.min(
    HM_MONTHS.length - 1,
    Math.floor(smoothstep(t) * HM_MONTHS.length)
  );
  return { winter: phase === "winter1" ? 1 : 2, month: HM_MONTHS[idx] };
}

/** Sichtbarkeit [0,1] eines Phasen-Copy-Blocks (weich rein/raus). */
export function hmCopyWeight(phase: HmPhase, p: number): number {
  const cur = hmPhaseT(p);
  if (cur.phase !== phase) return 0;
  const inn = smoothstep(cur.t / 0.14);
  const out =
    phase === "winter2" ? 1 : 1 - smoothstep((cur.t - 0.82) / 0.16);
  return Math.min(inn, out);
}

/** Sichtbarkeit [0,1] der Beat-Karte i (nur winter2; bleibt stehen). */
export function hmBeatWeight(i: number, p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase !== "winter2") return 0;
  const beat = HM_BEATS[i];
  if (!beat) return 0;
  const fadeOut = 1 - smoothstep((t - (HM_RESOLVE_AT + 0.04)) / 0.08);
  return Math.min(smoothstep((t - beat.at) / 0.06), fadeOut);
}

/** Blinde Abrechnung (Karte 1): Klimax am Ende von winter1, weicht im Wechsel. */
export function hmBillBlindWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "winter1") return smoothstep((t - 0.66) / 0.12);
  if (phase === "wechsel") return 1 - smoothstep(t / 0.3);
  return 0;
}

/** Transparente Abrechnung (Karte 2) + Schlusszeilen: Auflösung winter2. */
export function hmResolveWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase !== "winter2") return 0;
  return smoothstep((t - HM_RESOLVE_AT) / 0.1);
}

/** WP-Still (Wechsel): steigt im Wechsel, weicht früh in winter2. */
export function hmPumpWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return smoothstep(t / 0.35);
  if (phase === "winter2") return 1 - smoothstep(t / 0.12);
  return 0;
}

/** Tauwetter-Still: trägt die Auflösung ab HM_RESOLVE_AT. */
export function hmThawWeight(p: number): number {
  return hmResolveWeight(p);
}

/** Kalt-Wash (blau): voll in winter1, weicht im Wechsel, weg in winter2. */
export function hmColdWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "winter1") return 1;
  if (phase === "wechsel") return 1 - smoothstep(t);
  return 0;
}

/** Warm-Wash (Heat-Akzent): wächst im Wechsel, bleibt in winter2. */
export function hmWarmWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return smoothstep(t);
  if (phase === "winter2") return 1;
  return 0;
}

/** Datenlayer (Chips/Kurve): fährt im Wechsel hoch, trägt winter2. */
export function hmDataWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return 0.4 * smoothstep((t - 0.5) / 0.5);
  if (phase === "winter2")
    return Math.min(
      0.4 + 0.6 * smoothstep(t / 0.1),
      1 - 0.6 * hmResolveWeight(p)
    );
  return 0;
}

/** rAF-Loop (Dev: läuft bei verstecktem Tab als Timer weiter). */
export function hmFrameLoop(cb: (now: number) => void): () => void {
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
git add src/lib/heatProgress.ts && git commit -m "Heatmieter: Story-Store (Phasen, Frame-Mapping, Ticker, Bills, Washes)"
```

---

### Task 5: Scroll-Bridge `HeatStoryBridge.tsx`

**Files:**
- Create: `src/components/heatmieter/HeatStoryBridge.tsx`

Muster: `SmokeStoryBridge.tsx`, umbenannt auf `[data-hm-story]` / `__hmForceRaw`.

- [ ] **Step 1: Datei anlegen — kompletter Inhalt:**

```tsx
"use client";

import { useEffect } from "react";
import { hmSetRaw, hmSetReduced, hmFrameLoop } from "@/lib/heatProgress";

/**
 * Misst den [data-hm-story]-Runway und speist den rohen Story-Progress
 * [0,1] in den HeatMieter-Store. Offsets werden gecacht; pro Frame wird
 * nur window.scrollY gelesen (Lenis-kompatibel, kein Layout-Thrash).
 * Progress 1 ist erreicht, wenn das Runway-Ende den Viewport-Boden trifft.
 */
export default function HeatStoryBridge() {
  useEffect(() => {
    let top = 0;
    let end = 1;

    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-hm-story]");
      if (!el) return;
      const y = window.scrollY;
      top = y + el.getBoundingClientRect().top;
      end = top + Math.max(1, el.offsetHeight - window.innerHeight);
    };

    const tick = () => {
      if (process.env.NODE_ENV !== "production") {
        const forced = (window as Window & { __hmForceRaw?: number })
          .__hmForceRaw;
        if (typeof forced === "number") {
          hmSetRaw(forced);
          return;
        }
      }
      const y = window.scrollY;
      hmSetRaw((y - top) / Math.max(1, end - top));
    };

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncRM = () => hmSetReduced(mq?.matches ?? false);
    syncRM();
    mq?.addEventListener?.("change", syncRM);

    measure();
    const stop = hmFrameLoop(tick);
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
git add src/components/heatmieter/HeatStoryBridge.tsx && git commit -m "Heatmieter: Scroll-Bridge für den Story-Runway"
```

---

### Task 6: Story-Stage `HeatStory.tsx` (Herzstück)

**Files:**
- Create: `src/components/heatmieter/HeatStory.tsx`

Frame-Streaming, Canvas-Draw und Layer-Lifecycle folgen `SmokeStory.tsx` (Frame-Pump mit CONCURRENCY 6 + Rückwärts-Backfill, Canvas-Sizing mit DPR-Deckel 1.75, cover-Draw) — **vorher lesen und die Muster 1:1 übernehmen.** Abweichungen: der Canvas trägt Phase A UND Phase C (gleiche Frames, zwei Durchläufe), dazwischen hält er den letzten Frame unter dem WP-Still; es gibt zwei Abrechnungs-Karten und einen SVG/DOM-Datenlayer.

- [ ] **Step 1: Datei anlegen.** Struktur (vollständig umzusetzen):

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  HM_IMAGE,
  HM_STORY,
  HM_BEATS,
  HM_BILL_BLIND,
  HM_BILL_CLEAR,
  HM_DATA_UNITS,
  HM_STORY_FRAMES,
  hmStoryFramePath,
} from "@/content/heatmieter";
import {
  hmRawFloat,
  hmGetReduced,
  hmFrameLoop,
  hmFrameIndex,
  hmTicker,
  hmCopyWeight,
  hmBeatWeight,
  hmBillBlindWeight,
  hmResolveWeight,
  hmPumpWeight,
  hmThawWeight,
  hmColdWeight,
  hmWarmWeight,
  hmDataWeight,
} from "@/lib/heatProgress";

const RUNWAY_VH = 820; // Scroll-Länge der Story

export default function HeatStory() {
  /* Refs: canvasRef, Layer-Refs (pump, thaw, cold, warm, data, ticker,
     copyRefs winter1/wechsel/winter2, beatRefs, billBlindRef, billClearRef,
     resolveRef), framesRef, drawnFrameRef */

  /* Effekt 1 — Frame-Streaming: identisch zum SmokeStory-Pump
     (CONCURRENCY 6, decoding async, Rückwärts-Backfill beim Draw),
     Quelle hmStoryFramePath(1..count). Bei reduced-motion/saveData: skip. */

  /* Effekt 2 — Canvas-Sizing mit DPR-Deckel 1.75, wie SmokeStory. */

  /* Effekt 3 — hmFrameLoop(tick). tick():
     p = hmRawFloat(); rm = hmGetReduced();
     — Canvas: idx = hmFrameIndex(p, HM_STORY_FRAMES.count);
       nächstliegenden geladenen Frame ≤ idx zeichnen (cover-fit);
       Canvas-Opacity: 1 - hmThawWeight(p) (Tauwetter übernimmt am Ende).
       Bei rm: Canvas aus, stattdessen winter-Still (unterster Image-Layer).
     — pump-Layer.opacity = hmPumpWeight(p)
     — thaw-Layer.opacity = hmThawWeight(p)
     — cold-Wash.opacity  = 0.30 * hmColdWeight(p)   (rgba(30,60,110))
     — warm-Wash.opacity  = 0.20 * hmWarmWeight(p)   (#e46a3f)
     — data-Layer.opacity = hmDataWeight(p)
     — Ticker: {winter, month} = hmTicker(p);
       textContent = winter ? `WINTER ${winter} · ${month}` : "· · ·";
       Ticker-Farbe: kalt-blau/neutral in winter1, Heat-Akzent in winter2.
     — Copy-Blöcke winter1/wechsel/winter2: opacity = hmCopyWeight(phase, p),
       translateY = (1-weight)*14px; winter1-lines staffeln:
       line k sichtbar ab t > 0.15 + k*0.2 (weich, smoothstep-Stil).
     — Beat-Karten: opacity/translate aus hmBeatWeight(i, p).
     — Bill-Karten: billBlindRef.opacity = hmBillBlindWeight(p);
       billClearRef.opacity = hmResolveWeight(p); je translateY (1-w)*16px.
     — Resolve-Block (resolveHeadline/resolveSubline): hmResolveWeight(p). */

  return (
    <section
      id="story"
      data-hm-story
      style={{ height: `${RUNWAY_VH}vh` }}
      className="relative"
      aria-label="Zwei Winter, zwei Abrechnungen — ein Haus mit und ohne HeatMieter"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-navy-900">
        {/* Layer-Stapel (unten→oben):
            1. winter-Still (Image, fill, unoptimized) — Poster/reduced-Fallback
            2. <canvas> — Winter-Scrub (opacity 0 bis erster Draw)
            3. pump-Still (Image, opacity 0) — Wechsel-Phase
            4. thaw-Still (Image, opacity 0) — Auflösung
            5. cold-Wash (div, bg rgba(30,60,110))
            6. warm-Wash (div, bg #e46a3f)
            7. data-Layer (div, opacity 0): HM_DATA_UNITS als Chip-Reihe
               (rounded-full border, mono-Label + Status-Punkt; state "info"
               → Akzent-Punkt) + dezente SVG-Polyline als Verbrauchskurve —
               alles in Heat-Akzent-Tönen, pointer-events-none
            8. Grade: Vignette + Tiefen-Gradient (wie SmokeStory)
            9. Ticker — oben zentriert, font-mono tabular-nums, tracking-widest,
               aria-hidden (dekorativ; Copy trägt den Inhalt)
           10. Copy-Blöcke (winter1 links, wechsel zentriert, winter2 links)
               — max-w-xl, kicker/headline/lines-Typo wie SmokeStory
           11. Beat-Karten: rechte Spalte (md+) / unten gestapelt (mobile),
               Karte: rounded-xl border border-white/12 bg-black/45
               backdrop-blur, innen: mono-Monat + Satz
           12. Bill-Karte 1 (HM_BILL_BLIND): zentriert-rechts, Dokument-Look
               (rounded-xl border bg-black/55, title + subtitle, rows als
               label/value-Zeilen — values gedimmt/kursiv), quer darüber der
               stamp „Widerspruch" (border-2, uppercase, leicht rotiert,
               rot-entsättigt)
           13. Bill-Karte 2 (HM_BILL_CLEAR): gleicher Dokument-Look, values
               klar, badge „Vollständig" als Akzent-Pill statt Stempel
           14. Resolve-Block zentriert (resolveHeadline groß, resolveSubline,
               Heat-Akzent)
        */}
      </div>
    </section>
  );
}
```

Alle Bild-Layer: `next/image` mit `fill`, `sizes="100vw"`, `unoptimized`, `className="object-cover"`, `draggable={false}`; nur der unterste Layer bekommt `alt` („Mehrfamilienhaus im Winter bei Blue Hour, Wärmepumpe im Hof"), Rest `alt=""` + `aria-hidden`.

**A11y:** Der komplette Story-Text (winter1-lines, wechsel, Beats, beide Bill-Karten, resolve) muss als echter DOM-Text gerendert sein (opacity-Steuerung, kein bedingtes Mount) — Screenreader lesen die Erzählung linear.

- [ ] **Step 2: Build-Check + Commit**

```bash
npm run build
git add src/components/heatmieter/HeatStory.tsx && git commit -m "Heatmieter: Story-Stage — Zwei-Winter-Scrub, Ticker, Bills, Datenlayer"
```

---

### Task 7: Hero, Sachsektionen, Final-CTA, Nav

**Files:**
- Create: `src/components/heatmieter/HeatHero.tsx`
- Create: `src/components/heatmieter/HeatSections.tsx`
- Create: `src/components/heatmieter/HeatCta.tsx`
- Create: `src/components/heatmieter/HeatNav.tsx`

Muster: die vier Smoke-Pendants (`SmokeHero/SmokeSections/SmokeCta/SmokeNav`) — **vorher lesen, Klassen 1:1 übernehmen**, Akzentfarbe überall auf `var(--color-mod-heat)` umstellen, Inhalte aus `HM_*`.

- [ ] **Step 1: `HeatHero.tsx`** — wie SmokeHero: full-height Section, Hintergrund `HM_IMAGE.winter` (Image fill + dunkler Gradient), Inhalt aus `HM_HERO` (kicker, headline, headlineAccent im Heat-Akzent, subline, 2 CTA-Buttons als `<a>`), unten mittig `HM_HERO.scrollHint` mit dezentem ↓. `id="start"`.

- [ ] **Step 2: `HeatSections.tsx`** — mappt `HM_SECTIONS` wie SmokeSections: je Section `<section id={s.id}>` mit `py-24 md:py-32`, max-w-6xl, Grid: Text (kicker Heat-Akzent, headline, subline, points mit Akzent-Punkt) + optionales Medium (`s.media`/`s.video`). `plattform`-Section rendert zusätzlich `HM_ADMIN_WIDGETS` als Widget-Grid + Demo-CTA. Alternierende Ausrichtung; `ablauf`-points als nummerierte Schritte-Reihe.

- [ ] **Step 3: `HeatCta.tsx`** — Section `id="kontakt"`, Hintergrund `HM_IMAGE.thaw` gedimmt, zentriert: `HM_FINAL` kicker/headline/subline, beide CTAs, Support-Zeile klein darunter.

- [ ] **Step 4: `HeatNav.tsx`** — SmokeNav kopieren, exakt ändern: Wortmarke „HeatMieter", Akzent `--color-mod-heat`, Links → `#story` „Zwei Winter", `#pflicht` „Pflicht", `#erfassung` „Erfassung", `#plattform` „System", CTA-Button `HM_CTA.heizkostencheck` (Kurzlabel „Heizkosten-Check"). Zurück-Link zur Startseite behalten.

- [ ] **Step 5: Build-Check + Commit**

```bash
npm run build
git add src/components/heatmieter && git commit -m "Heatmieter: Hero, Sachsektionen, Final-CTA, Nav"
```

---

### Task 8: Route `src/app/heatmieter/page.tsx` + Experience-Wrapper

**Files:**
- Create: `src/app/heatmieter/page.tsx`
- Create: `src/components/heatmieter/HeatExperience.tsx`

- [ ] **Step 1: `HeatExperience.tsx`** — Client-Wrapper wie SmokeExperience, komponiert: `<HeatStoryBridge />` + `<HeatHero />` + `<HeatStory />` + `<HeatSections />` + `<HeatCta />`. (Kein Loader — der Hero ist ein klassisches Bild.)

- [ ] **Step 2: `page.tsx`** — Muster `src/app/smokemieter/page.tsx`, Inhalt:

```tsx
import type { Metadata } from "next";
import HeatNav from "@/components/heatmieter/HeatNav";
import HeatExperience from "@/components/heatmieter/HeatExperience";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Heatmieter — Heizkostenabrechnung im Mehrfamilienhaus | Powerhouse 360",
  description:
    "HeatMieter macht Heizkosten transparent: fernablesbare Erfassung, Monatswerte je Wohnung, Einsparpotenziale, CO₂-Kostenaufteilung und eine nachvollziehbare Heizkostenabrechnung — für Eigentümer, WEGs und Hausverwaltungen.",
  openGraph: {
    title: "Heatmieter — Heizkostenabrechnung im Mehrfamilienhaus",
    description:
      "Erfasst, transparent, nachvollziehbar abgerechnet: die digitale Wärme-Ebene für Mehrfamilienhäuser.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/media/heatmieter/winter.jpg",
        width: 2400,
        height: 1350,
        alt: "Mehrfamilienhaus im Winter bei Blue Hour — HeatMieter",
      },
    ],
  },
};

export default function HeatMieterPage() {
  return (
    <>
      <HeatNav />
      <main>
        <HeatExperience />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Build-Check + Commit**

```bash
npm run build
git add src/app/heatmieter src/components/heatmieter/HeatExperience.tsx
git commit -m "Heatmieter: /heatmieter Route mit Hybrid-Aufbau"
```

---

### Task 9: Preview-Verifikation (Desktop, Mobile, reduced-motion)

- [ ] **Step 1:** Dev-Server via `preview_start` (launch.json vorhanden). `/heatmieter` öffnen.

- [ ] **Step 2: Story-Phasen erzwingen und screenshots:**
`preview_eval`: `window.__hmForceRaw = X` für X ∈ {0.0, 0.18, 0.33, 0.42, 0.55, 0.62, 0.75, 0.9} → je `preview_screenshot`. Prüfen: Frames laufen vorwärts + Kalt-Wash + Ticker „WINTER 1 · …" (0.18), blinde Bill-Karte mit Widerspruch-Stempel (0.33), WP-Still + Farbkippe (0.42), Winter-2-Start: dieselben Frames + Datenlayer + Ticker „WINTER 2 · …" (0.55), Beat-Karten gestaffelt (0.62/0.75), Tauwetter + klare Bill-Karte + Resolve (0.9). Danach `window.__hmForceRaw = undefined`.

- [ ] **Step 3:** `preview_console_logs` (level error) + `preview_network` (failed): keine 404 auf Frames/Stills, keine React-Fehler.

- [ ] **Step 4:** `preview_resize` mobile (375×812): Hero lesbar, Ticker/Copy nicht überlappend, Beats + Bills gestapelt lesbar; Sections einspaltig. Screenshot.

- [ ] **Step 5:** Reduced-motion-Pfad per Code-Review verifizieren (Canvas skip, winter-Still sichtbar, Ticker/Bills/Beats tragen die Story) + `npm run build` grün.

- [ ] **Step 6:** Anker-Navigation klicken (`preview_click` auf Nav-Links) → Sections erreichbar; CTAs führen auf `/projekt-besprechen?modul=heatmieter&…` (Query im `preview_snapshot` prüfen).

- [ ] **Step 7:** Gefundene Bugs fixen (Quelle lesen → Edit → ab Step 2 erneut), dann Commit:

```bash
git add -A src/ && git commit -m "Heatmieter: Feinschliff nach Preview-Verifikation"
```

---

### Task 10: Abschluss-Commit & Deploy-Freigabe

- [ ] **Step 1:** `git status` sauber? `npm run build` final grün.
- [ ] **Step 2:** Dem User Ergebnis mit Screenshots melden. **Deploy (powerhouse360.de, VPS/Coolify per tar+ssh+docker — Methode im Memory `powerhouse360-vps-deploy.md`) erst nach ausdrücklicher Freigabe des Users ausführen** — die Site ist öffentlich. Domain-Routing heatmieter.de ist NICHT Teil dieses Plans (Spec §8).

---

## Self-Review (durchgeführt)

- **Spec-Coverage:** Akt 1 Hero → T3/T7/T8 ✓ · Story 3 Phasen + Ticker + Beats + zwei Bill-Karten + Datenlayer + Farbdramaturgie → T3/T4/T6 ✓ · Frame-Wiederverwendung Phase A=C → T4 (`hmFrameIndex`) ✓ · 8 Sektionen inkl. Pflicht-2026-Aufhänger, WP-Auftritt (Sektion einsparen: media "pump"; erfassung: Bestands-Loop) → T3/T7 ✓ · Final-CTA → T3/T7 ✓ · Wording-Leitplanken → Header + Content-Kommentar ✓ · Assets H1–H4 + WP-Referenz + Pipeline → T1/T2 ✓ · Mobile/reduced → T6/T9 ✓ · SEO/OG (User-Titel) → T8 ✓ · CTAs/Funnel-Links → T3 ✓ · Nicht-Ziele (kein Domain-Routing, keine Refactorings) → kein Task ändert Bestandsdateien ✓
- **Platzhalter:** `HM_STORY_FRAMES.count = 96` ist als „Ist-Wert nach Task 2 eintragen" markiert (T3 S2) — bewusst. Job-IDs/URLs/Media-ID `<WP>` in T1 sind Laufzeitwerte.
- **Typ-Konsistenz:** Store importiert `HM_PHASES`, `HM_MONTHS`, `HM_BEATS`, `HM_RESOLVE_AT` — alle in T3 definiert ✓. `hmStoryFramePath`, `HM_STORY_FRAMES`, `HM_BILL_*`, `HM_DATA_UNITS` von T6 genutzt ✓. Bridge nutzt nur `hmSetRaw/hmSetReduced/hmFrameLoop` ✓. `HmSection.media`-Keys („anlage", „pump") existieren in `HM_IMAGE` ✓.
