# Smokemieter — Design-Spec: Scroll-Story „Die Nacht, die rückwärts läuft"

**Datum:** 2026-07-08 · **Branch:** feat/cinematic-funnels-legal · **Status:** Entwurf zur Review

## 1. Ziel & Kontext

Eine eigene Website für **Smokemieter** (Modul 04 von Powerhouse 360: digitale
Rauchwarnmelder-Verwaltung — Ferninspektion, Live-Status, Ereigniskommunikation)
als Route `/smokemieter` im bestehenden Next.js-Projekt, analog zur
Chargemieter-Seite, aber mit eigener Dramaturgie:

> Ein Hybrid aus klassischer Landingpage und Scroll-Kino. Herzstück ist eine
> Story, in der ein Mehrfamilienhaus brennt, der Scroll die Zeit zurückdreht
> und dieselbe Nacht mit Rauchwarnmelder gut ausgeht.

Entscheidungen aus dem Brainstorming (vom User bestätigt):
- **Machart:** analog Chargemieter im selben Projekt (eigene Content-Datei,
  eigene Komponenten, eigener Scroll-Store).
- **Dramaturgie:** Variante „Rewind" (Zeitumkehr per Rückwärts-Scrub).
- **Aufbau:** Hybrid — klassischer Hero → Scroll-Kino nur für die Story →
  klassische Sachsektionen → CTA.
- **Reihenfolge:** Erst Higgsfield-Assets generieren, dann die Seite bauen.

## 2. Seitenarchitektur — vier Akte

| Akt | Art | Inhalt |
|-----|-----|--------|
| 1 · Landing | klassisch | Hero: Marke, Value Prop, 2 CTAs — sofort lesbar, kein Scroll-Zwang |
| 2 · Story | Scroll-Kino | 3 Phasen: Brand → Rewind → Rettung (ein durchgehender Scrub-Runway) |
| 3 · Modul | klassisch | 8 gestapelte Sachsektionen (Pflicht, Ferninspektion, Verwaltung, Mieter, Wartung, Abrechnung, Ablauf, Plattform) |
| 4 · Abschluss | klassisch | Final-CTA + Support-Zeile |

Kino-Mechanik nur dort, wo sie trägt. Sachthemen bleiben schnell scrollbar.

## 3. Die Story (Akt 2) im Detail

Ein durchgehender Scroll-Runway (~700–900 vh) mit drei Phasen. Eine
**Uhr-Anzeige** (Monospace-Ziffern) ist das verbindende Overlay-Element.

**Phase A — „03:12. Es brennt." (Progress 0 → ~0.30)**
- Frame-Sequenz des Brand-Clips wird vorwärts gescrubbt: Feuerschein in einem
  Fenster, Rauch legt sich über die Fassade des bekannten Powerhouse-Gebäudes.
- Uhr tickt scroll-gebunden 03:12 → 03:19. Rotes Gefahren-Licht übernimmt
  schrittweise die Akzentfarbe der Seite.
- Copy-Anker: Schwelbrand in Wohnung 3.2 (Kontinuität: Chargemieter-Overlays
  nutzen dieselbe Wohnung). Kernsatz: **„Im Schlaf riecht der Mensch nichts."**
  (etablierte Brandschutz-Aufklärung, keine erfundene Statistik.)

**Phase B — „Rewind" (~0.30 → ~0.55)**
- Der magische Moment: derselbe Frame-Scrub läuft **rückwärts** (Progress wird
  invertiert — technisch trivial mit der bestehenden Scrub-Technik). Flammen
  ziehen sich zurück, Rauch kriecht ins Fenster, die Uhr läuft 03:19 → 03:12.
- Dezente Rückspul-Signale: typografisch (z. B. ◀◀-Charakter der Uhr),
  entsättigte Farbigkeit. Copy: „Drehen wir diese Nacht zurück — bis zu dem
  Moment, in dem noch nichts passiert ist."

**Phase C — „03:12. Der Melder schlägt an." (~0.55 → 1)**
- Gleiche Minute, anderer Verlauf: Jetzt hängt ein Rauchwarnmelder an der
  Decke. Getragen von 2 Stills (Alarm-Szene innen, Morgen-Fassade) mit
  Crossfades plus **Beat-Karten** als Overlays:
  - 03:12 — erster Rauch erreicht den Melder. Alarm: **85 dB** (Normwert
    DIN EN 14604).
  - 03:13 — die Bewohner sind wach.
  - 03:15 — alle im Treppenhaus.
  - 03:19 — die Feuerwehr ist da. Der Brand bleibt eine Randnotiz.
- Auflösung im Morgengrauen: Das Haus steht. Die Farbwelt kippt vom Brand-Rot
  ins **Modul-Amber `#e8973c`** — die Smokemieter-Farbe ist das Morgenlicht
  der geretteten Nacht.
- Schlusssatz: **„Der Unterschied zwischen diesen zwei Nächten hängt an der
  Decke."**
- Brücke in Akt 3: „Ein Melder rettet nur, wenn er hängt, funktioniert und
  geprüft ist. Genau dafür gibt es Smokemieter."

## 4. Sachsektionen (Akt 3)

Acht ruhige, klassisch gestapelte Panels (Muster: QuietSections/SectionPanel
der Homepage, angepasst auf Smoke-Akzent). Reihenfolge und Kernaussagen:

1. **Pflicht & Nachweis** — Rauchwarnmelder sind Pflicht; die Details regeln
   die Landesbauordnungen der Bundesländer. Smokemieter macht aus der Pflicht
   einen dokumentierten Zustand: Bestand, Prüfstatus, Nachweise.
2. **Ferninspektion & Live-Status** — Funk-Rauchwarnmelder werden je nach
   Gerätetyp ohne Wohnungszutritt inspiziert (orientiert an DIN 14676).
   Live-Status statt Terminketten. Ereignisse — Alarm, Demontage, Störung —
   werden erkannt und klar kommuniziert.
3. **Für Verwaltungen** — Bestandsliste je Wohnung/Raum, Prüfstatus,
   Ereignisprotokoll, Dokumentation für die Akte, weniger Terminkoordination.
4. **Für Mieter** — keine Jahres-Termine, niemand Fremdes muss in die Wohnung
   (bei Ferninspektion), im Ereignisfall klare Information.
5. **Wartung & Austausch** — Montage, laufende Wartung, altersbedingter
   Gerätetausch (Melder altern — Austausch nach spätestens 10 Jahren ist
   Standard), lückenlose Historie.
6. **Abrechnung** — Miet-/Servicemodell schafft die **Grundlage** für eine
   betriebskostenfähige Abrechnung (Formulierung „Grundlage schaffen" —
   gleiche Vorsicht wie bei Chargemieter, keine mietrechtliche Zusage).
7. **Ablauf** — Bestandsaufnahme → Konzept → Montage → Betrieb &
   Ferninspektion → Dokumentation → Abrechnung.
8. **Plattform** — Teil von Powerhouse 360: ein Dashboard für Melder, Räume,
   Status, Ereignisse, Nachweise.

**Akt 4 — Final-CTA:** „Die zweite Version der Nacht beginnt mit einem
Gespräch." Primär: kostenfreier Bestandscheck. Sekundär: Konzept planen.
Support-Zeile: „Für Eigentümer, WEGs, Hausverwaltungen und
Wohnungsunternehmen."

## 5. Copy- & Wording-Leitplanken (hart)

- **Keine erfundenen Statistiken.** Die Story ist eine konkrete, als solche
  erkennbare Erzählung („eine Nacht"), kein Durchschnittsclaim. Zulässige
  Fakten: 85 dB (DIN EN 14604), „Im Schlaf riecht der Mensch nichts"
  (Brandschutz-Aufklärung), 10-Jahres-Tausch (Stand der Technik).
- **Recht:** Pflicht ja, aber Details „regeln die Landesbauordnungen" — keine
  landesspezifischen Fristen/Zuständigkeiten behaupten, keine Rechtsberatung.
- **Ferninspektion:** immer „je nach Gerätetyp", „orientiert an DIN 14676" —
  keine Zertifizierungs- oder Normerfüllungszusagen.
- **Abrechnung:** „Grundlage für betriebskostenfähige Abrechnung schaffen" —
  keine Umlage-Garantie.
- **Ereignisse:** „werden gemeldet und kommuniziert" — keine Notruf-/
  Feuerwehr-Aufschaltung versprechen.
- **Produktclaims:** Story darf emotional erzählen; im Sachteil „kann Leben
  retten", nie Absolutgarantien.
- Ton wie Chargemieter: deutsch, ruhig, präzise, premium.

## 6. Technisches Design

**Dateien (alle additiv, nichts Bestehendes wird umgebaut):**

```
src/app/smokemieter/page.tsx          — Route, Metadata, Composition
src/content/smokemieter.ts            — Single Source of Truth: Story-Beats,
                                        Uhrzeiten, Sektionen, Widgets,
                                        CTAs, Media-Manifest
src/lib/smokeProgress.ts              — schlanker Story-Progress-Store
                                        (1 Runway, 3 Phasen — nicht CMs
                                        12-Szenen-System)
src/components/smokemieter/
  SmokeNav.tsx                        — Top-Nav (Muster: ChargeNav)
  SmokeExperience.tsx                 — Split Desktop/Mobile + reduced-motion
  SmokeHero.tsx                       — Akt 1, klassisch
  SmokeStory.tsx                      — Akt 2: Scrub-Stage, Uhr, Beat-Karten
                                        (rendert beide Modi: Frame-Scrub und
                                        Still-Crossfade für Mobile/reduced)
  SmokeStoryBridge.tsx                — Scroll→Store-Bridge (rAF, Muster:
                                        ChargeScrollBridge)
  SmokeSections.tsx                   — Akt 3: 8 gestapelte Panels
  SmokeCta.tsx                        — Akt 4
public/media/smokemieter/             — Stills, Clips, story-frames/
```

**Story-Engine:** Die Uhr, die Phasen und der Frame-Index sind reine
Funktionen des Scroll-Progress. Phase B ist derselbe Frame-Bestand wie
Phase A mit invertiertem Index — kein zweites Video nötig. Frame-Sequenz
nach dem bewährten CM_HERO_FRAMES-Muster (96 JPEGs, fps=12, 1600 px breit,
q:v 4, ~6–7 MB gesamt).

**Mobile & `prefers-reduced-motion`:** Stills + Crossfades statt Frame-Scrub,
Beat-Karten bleiben (sie tragen die Story auch ohne Kino). Uhr bleibt, läuft
aber in größeren Schritten.

**Farbe:** Modul-Akzent `var(--color-mod-smoke)` = `#e8973c` (Amber).
Brand-Rot nur innerhalb der Story-Phasen A/B als temporäre Gefahrenfarbe;
Phase C und alle Sachsektionen kehren zum Amber zurück.

**CTAs:**
- Primär: `/projekt-besprechen?modul=smokemieter&thema=bestandscheck`
  („Kostenfreien Bestandscheck starten")
- Sekundär: `/projekt-besprechen?modul=smokemieter&thema=planung`
  („Melder-Konzept planen")
- Plattform-Sektion: `/demo` („System ansehen")

**SEO/Metadata:** analog Chargemieter — Title „Smokemieter — Rauchwarnmelder
im Mehrfamilienhaus | Powerhouse 360", Description mit Ferninspektion,
Dokumentation, Abrechnung; OG-Image = Story-Hero-Still.

## 7. Medien & Asset-Plan (Higgsfield, vor dem Bau)

Voraussetzung: Higgsfield-MCP verbunden. Rezept aus dem Launch-Set
(nano_banana_pro 2k 16:9 für Stills; seedance_2_0 für Clips mit
`start_image` = Still-Job-ID, `generate_audio:false`,
`declined_preset_id: 24bae836-2c4a-48e0-89b6-49fcc0b21612`).
Gebäude-Konsistenz über Referenz-Job-IDs: Hero/Gebäude
`1eb8708e-4880-4919-862e-895973f4e93d`, Decken-Melder `87ca48e0-…`
(gekürzt notiert — volle ID beim Generieren aus der Higgsfield-Job-History
ziehen).

| # | Asset | Typ | Zweck |
|---|-------|-----|-------|
| A1 | Nacht-Fassade mit Feuerschein + Rauch aus Fenster (3. OG) | Still | Story Phase A/B, OG-Image |
| A2 | Brand entwickelt sich (aus A1, 6–8 s, dichte Keyframes) | Clip → 96 Frames | der Scrub (vorwärts + rückwärts) |
| A3 | Innenraum: Melder an Decke, roter Alarmring, erster Rauchfaden | Still | Phase C Alarm-Beat |
| A4 | Fassade im Morgengrauen, intakt, warmes Amber-Licht | Still | Phase C Auflösung |
| A5 | Ruhige Nacht-Fassade, dunkle Fenster | Still | Final-CTA |
| — | Bestand: `stills/smokemieter.jpg`, `clips/smokemieter.mp4` | vorhanden | Sachsektionen (Ferninspektion/Plattform) |

Budget-Schätzung: ~150–250 Credits (594 verfügbar). Lokale Pipeline wie
gehabt: Clips scrub-optimiert (`ffmpeg -an -crf 23 -g 4 -keyint_min 4
-sc_threshold 0 -movflags +faststart`), Frames `fps=12, scale=1600:-2,
-q:v 4` nach `public/media/smokemieter/story-frames/frame_%03d.jpg`.

## 8. Nicht-Ziele (YAGNI)

- Homepage-Link „Mehr zu Smokemieter" bleibt vorerst auf `https://smokemieter.de`
  (wie bei Chargemieter; Domain-/DNS-Umstellung ist ein separater Schritt).
- Kein Preisrechner, kein FAQ-Akkordeon, keine Mehrsprachigkeit.
- Keine Refactorings an Homepage/Chargemieter; bewusste Parallel-Struktur
  (eigener Store) statt vorzeitiger Abstraktion — gleiche Philosophie wie
  beim Chargemieter-Store.

## 9. Umsetzungsreihenfolge

1. Higgsfield-MCP verbinden (User) → Asset-Set A1–A5 generieren
2. Postprocessing (ffmpeg: Clips, Frame-Sequenz)
3. `content/smokemieter.ts` — komplette Copy + Manifest
4. Story-Engine (`smokeProgress` + `SmokeStory` + Bridge)
5. Hero, Sektionen, CTA, Nav
6. Mobile + reduced-motion
7. Verify im Preview (Desktop/Mobile/Dark), SEO-Check
8. Commit + Deploy (VPS-Methode)
