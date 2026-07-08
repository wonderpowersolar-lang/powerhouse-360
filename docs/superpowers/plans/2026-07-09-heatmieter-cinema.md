# Heatmieter — Vollständiges Scroll-Kino (ChargeMieter-Niveau)

> **Kontext für frische Session:** Die `/heatmieter`-Seite existiert bereits als
> Hybrid (Hero → Zwei-Winter-Story → 8 Sachsektionen → CTA) und funktioniert.
> User-Feedback: „noch nicht auf dem Level der anderen Seiten" — es fehlt das
> **durchgehende Kino** wie bei `/chargemieter`. Dieser Plan baut Heat auf
> genau dieses Niveau um. Vorherige Specs/Pläne:
> `docs/superpowers/specs/2026-07-08-heatmieter-design.md`,
> `docs/superpowers/plans/2026-07-09-heatmieter.md`.

**Kickoff in neuer Session:** `/clear`, dann: „Führe den Plan
`docs/superpowers/plans/2026-07-09-heatmieter-cinema.md` aus."

---

## Warum das aktuelle Heat nicht das Niveau hat

ChargeMieter (`ChargeDesktop.tsx`) = **eine `fixed inset-0` Bühne** füllt dauerhaft
den Viewport; darüber scrollen schwebende Szenen-Panels. Die Medien-Ebene
(`ChargeStage`) crossfadet/scrubbt kontinuierlich zwischen Szenen, gesteuert von
einem **Plateau-Szenen-Float** (`chargeProgress.ts`: 5-Beat-Band approach·hold·
reveal·explain·transition). Ergebnis: beim Scrollen bewegt sich IMMER die Bühne.

Heat dagegen = klassisch gestapelte Sektionen mit statischem Grund + jetzt
Reveals/Parallax. Die Bühne „wandert" nicht durchgehend. Das ist der WOW-Gap.

## Zielarchitektur (Charge-Muster, Heat-Story reusen)

**Kernidee:** EINE fixierte Bühne für die ganze Seite. Globaler Szenen-Float
treibt sie. Die bestehende Zwei-Winter-Story-Logik (`heatProgress.ts`:
Frame-Index, Ticker, Bills, Washes, Datenlayer, Beats) wird NICHT neu
geschrieben, sondern als Medien-Verhalten der Story-Szenen in die Bühne
gefaltet.

**Szenenfolge (ein durchgehender Runway):**
| # | id | Bühne (Medien) | Panel/Overlay |
|---|-----|----------------|---------------|
| 0 | hero | Winter-Still, langsamer Push-in | Marke + Value + CTAs |
| 1 | winter1 | Winter-Frame-Scrub vorwärts, Kalt-Wash, Ticker | winter1-Copy + Bill-blind (Klimax) |
| 2 | wechsel | WP-Still-Crossfade, Farbkippe kalt→heat | wechsel-Copy |
| 3 | winter2 | dieselben Frames erneut + Datenlayer, Ticker | winter2-Copy + Beat-Karten |
| 4 | aufloesung | Tauwetter-Still, warm | Resolve-Copy + Bill-clear |
| 5 | pflicht | Winter-Still gedimmt | Panel: Pflicht & Fristen |
| 6 | erfassung | Anlage-Loop-Clip | Panel: Erfassung & Live-Daten |
| 7 | verwaltung | Winter-Still, andere Kadrierung | Panel: Für Hausverwaltungen |
| 8 | bewohner | Thaw-Still gedimmt | Panel: Für Bewohner |
| 9 | einsparen | Pump-Still | Panel: Einsparpotenziale |
| 10 | abrechnung | dunkler Grund + Beleg-Karte groß | Panel: Abrechnung & CO₂ |
| 11 | ablauf | Winter-Still | Panel: Ablauf (nummeriert) |
| 12 | plattform | Pump/Anlage | Panel: System + Admin-Widgets |
| 13 | cta | Thaw-Still (sticky, Footer schiebt raus) | Final-CTA |

Szenen 1–4 = die bestehende Story (Frame-Scrub-Herzstück), 5–12 = die
Sachthemen als cinematische Szenen (Charge-Panel-Muster), 0/13 wie Charge.

## Dateien

**Neu (Muster → Vorlage):**
```
src/lib/heatCine.ts              ← chargeProgress.ts (Plateau-Szenen-Float,
                                   5-Beat-Band, cmSceneFloat→hmSceneFloat,
                                   holdWeight/copyWeight, FrameLoop)
src/components/heatmieter/
  HeatStage.tsx                  ← ChargeStage.tsx: fixierte Medien-Bühne.
                                   Rendert Still-Crossfade je Szene PLUS den
                                   Winter-Frame-Scrub für Szenen 1/3. Nutzt
                                   die vorhandenen heatProgress-Funktionen
                                   (hmFrameIndex, hmTicker, hmCold/WarmWeight,
                                   hmDataWeight, hmBillBlindWeight, …),
                                   remapped auf den Szenen-Float.
  HeatCineScrollBridge.tsx       ← ChargeScrollBridge.tsx: misst
                                   [data-hm-scene]-Bänder → hmCineSetRaw.
  HeatPanel.tsx                  ← ChargePanel.tsx: schwebendes Panel je Szene
                                   (kicker/headline/subline/points/cta/overlay),
                                   opacity/translate aus hmCopyWeight.
  HeatCineOverlays.tsx           ← ChargeOverlays.tsx: pro-Szene-Overlays
                                   (Ticker, Bill-Karten, Beat-Karten,
                                   Datenlayer-Chips, Admin-Widgets, Beleg).
  HeatRail.tsx                   ← ChargeRail.tsx: Kapitel-Indikator seitlich.
  HeatLoader.tsx                 ← ChargeLoader.tsx: Intro ≤2,5 s.
  HeatDesktop.tsx                ← ChargeDesktop.tsx: fixe Bühne + Szenen-Panels.
```

**Umbauen:**
```
src/content/heatmieter.ts        + HM_SCENES: CmScene-analoge Struktur
                                   (id, index, heightVh, hold, kicker, headline,
                                   headlineAccent?, subline, align, overlay,
                                   media-key, mediaDim, cta?). Bestehende
                                   HM_STORY/HM_BEATS/HM_BILL_*/HM_SECTIONS
                                   bleiben als Datenquelle, HM_SCENES
                                   referenziert sie.
src/components/heatmieter/HeatExperience.tsx
                                   → Desktop/Mobile-Split wie ChargeExperience
                                   (wide+fine+!reduced → HeatDesktop, sonst
                                   HeatMobile).
```

**Als Mobile-Fallback behalten (umbenannt/gebündelt):**
```
HeatMobile.tsx                    ← bündelt die HEUTIGEN Hero+Story+Sections+Cta
                                   (die funktionieren als gestapelte Story gut).
                                   Die heutigen HeatHero/HeatStory/HeatSections/
                                   HeatCta bleiben dafür erhalten.
```

## Kritische Mechanik (aus chargeProgress.ts, verifiziert)

- Plateau-Float: `APPROACH_SPLIT=0.75`; `approachOf/releaseOf` aus `hold` je
  Szene; `sceneFloat()` interpoliert mit `smoothstep` NUR in Reise-Zonen,
  ruht im Plateau. **1:1 übernehmen, nur CM→HM umbenennen.**
- Bridge misst `[data-hm-scene]`-Element-Offsets (throttled, nur scrollY pro
  Frame), speist `raw ∈ [0, LAST]`.
- Stage-Opazitäten = reine Funktionen von `sceneFloat()`; Panels = `copyWeight`.
- Frame-Scrub-Reuse: In Szene 1 `hmFrameIndex(localT,...)` vorwärts, Szene 3
  erneut vorwärts + Datenlayer — die vorhandene heatProgress-Logik liefert das,
  nur `p` = lokaler Szenen-Fortschritt statt Story-Runway-Progress.
- `hold`-Werte: Story-Szenen lang (0.8), Sachthemen 0.74–0.78, hero/cta 0.82+.

## Reihenfolge

1. `heatCine.ts` (Port von chargeProgress) + Build.
2. `HM_SCENES` in content + Build.
3. `HeatCineScrollBridge` + `HeatStage` (Still-Crossfade zuerst, dann
   Frame-Scrub + Story-Overlays einfalten) + Build.
4. `HeatPanel` + `HeatCineOverlays` + `HeatRail` + `HeatLoader` + Build.
5. `HeatDesktop` komponieren; `HeatMobile` aus heutigen Teilen bündeln;
   `HeatExperience` Split.
6. Preview-Verifikation je Szene über `window.__hmCineForceRaw` (Force-Hook
   in der Bridge wie `__cmForceRaw`). Hinweis: Preview-Screenshots im
   gescrollten Zustand sind wegen Lenis schwarz → Bühne temporär `fixed`
   pinnen oder Force-Hook nutzen (bewährt).
7. Commit je Schritt; am Ende Gesamt-Screenshot-Runde. Deploy nur nach
   User-Freigabe.

## Nicht-Ziele
- Keine neuen Higgsfield-Assets nötig (Bestand H1–H4 + anlage-Loop reichen).
- Homepage/Charge/Smoke unangetastet.
- Domain-Routing heatmieter.de separat.
