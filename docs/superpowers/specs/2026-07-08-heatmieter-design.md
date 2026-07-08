# Heatmieter — Design-Spec: Scroll-Story „Zwei Winter, zwei Abrechnungen"

**Datum:** 2026-07-08 · **Branch:** feat/cinematic-funnels-legal · **Status:** Entwurf zur Review

## 1. Ziel & Kontext

Eine eigene Website für **Heatmieter** (Modul 02 von Powerhouse 360: digitale
Wärme-Ebene — Verbrauchserfassung, Transparenz, Heizkostenabrechnung,
CO₂-Kostenlogik, Einsparpotenziale) als Route `/heatmieter` im bestehenden
Next.js-Projekt, analog zur Smokemieter-Seite (Hybrid-Muster), mit eigener
Dramaturgie:

> Ein Haus erlebt zwei Winter. Im ersten läuft die Heizung als Blackbox —
> hohe Kosten, eine Abrechnung voller Schätzwerte, Widerspruch. Dann übernimmt
> Heatmieter. Im zweiten Winter ist derselbe Winter sichtbar: Monatswerte je
> Wohnung, erkannte Einsparpotenziale, bewusstere Nutzung — und am Ende eine
> Abrechnung, die sich selbst erklärt.

Entscheidungen aus dem Brainstorming (vom User bestätigt):
- **Positionierung:** Digitale Wärme-Ebene (Monitoring, Transparenz,
  Heizkostenabrechnung, CO₂-Kostenlogik auf bestehender Technik) — kein
  Wärmepumpen-Contracting als Kernversprechen. Die Wärmepumpe ist Bühnen-
  und Sachteil-Element, nicht das Produkt.
- **Dramaturgie:** „Zwei Winter, zwei Abrechnungen" — Zeit läuft **vorwärts**
  durch zwei echte Winter (bewusste Abgrenzung zum Smokemieter-Rewind).
- **Aufbau:** Hybrid wie Smokemieter — klassischer Hero → Scroll-Kino nur für
  die Story → 8 klassische Sachsektionen → Final-CTA.
- **Wärmepumpen-Look (verbindlich):** User-Referenzbild — großer anthrazit
  Monobloc mit quadratischem Schutzgitter, MFH-Klasse (kein EFH-Gerät).
  Ersetzt die Lamellen-Optik aus `docs/design/mood/03-heatpump-station.png`.
- **Reihenfolge:** Erst Higgsfield-Assets generieren, dann die Seite bauen.

## 2. Seitenarchitektur — vier Akte

| Akt | Art | Inhalt |
|-----|-----|--------|
| 1 · Landing | klassisch | Hero: Marke, Value Prop, 2 CTAs — sofort lesbar, kein Scroll-Zwang |
| 2 · Story | Scroll-Kino | 3 Phasen: Winter 1 (Blackbox) → Wechsel → Winter 2 (transparent), ein Scrub-Runway ~800 vh |
| 3 · Modul | klassisch | 8 gestapelte Sachsektionen (Pflicht, Erfassung, Verwaltung, Bewohner, Einsparen, Abrechnung & CO₂, Ablauf, Plattform) |
| 4 · Abschluss | klassisch | Final-CTA + Support-Zeile |

Kino-Mechanik nur dort, wo sie trägt. Sachthemen bleiben schnell scrollbar.

## 3. Die Story (Akt 2) im Detail

Ein durchgehender Scroll-Runway mit drei Phasen. Verbindendes Overlay-Element
ist ein **Monats-Ticker** (Monospace: OKT → NOV → DEZ → JAN → FEB → MÄR), der
zweimal durchläuft — das Heat-Pendant zur Smokemieter-Uhr.
Phasen-Grenzen: `HM_PHASES = { winter1End: 0.35, wechselEnd: 0.5 }`.

**Phase A — „Winter 1: Die Blackbox" (Progress 0 → ~0.35)**
- Frame-Sequenz des Winter-Clips wird vorwärts gescrubbt: verschneite
  Blue-Hour-Fassade des bekannten Powerhouse-Gebäudes, warme Fenster,
  die Wärmepumpe arbeitet im Hof. Farbwelt kalt-blau, entsättigt.
- Ticker läuft OKT → MÄR. Copy-Anker: „Es heizt. Und niemand sieht es."
  Beats: Heizperiode beginnt (Verbrauch läuft — unsichtbar) → tiefster
  Winter (hohe Kosten, die niemand sieht) → „Monate später kommt der Brief."
- Klimax: **Abrechnungs-Karte 1** baut sich als DOM-Dokument auf — Positionen
  ohne Geschichte, Schätzwert-Markierungen („Ablesung: nicht erfolgt",
  „Verbrauch: geschätzt"), dann der Stempel: **Widerspruch**.

**Phase B — „Der Wechsel" (~0.35 → ~0.5)**
- Heatmieter übernimmt: Funk-Zähler werden montiert, Live-Daten gehen an
  (Still: Wärmepumpe/Zähler im Schnee, leichter Dampf).
- Der magische Scroll-Moment: die Farbwelt kippt von Kalt-Blau zum
  Heat-Akzent `#e46a3f` (`--color-mod-heat`).
- Copy: „Dann übernimmt HeatMieter." — Funk-Erfassung, Live-Status,
  Monatswerte je Wohnung.

**Phase C — „Winter 2: Transparent" (~0.5 → 1)**
- **Dieselbe Frame-Sequenz wie Phase A läuft erneut vorwärts** — jetzt liegt
  der orange **Datenlayer** (DOM/SVG: Monatswert-Chips je Wohnung, feine
  Kurven, Status-Punkte) über dem Bild. Botschaft: derselbe Winter, andere
  Sichtbarkeit. Kein zweites Video nötig.
- Ticker läuft erneut OKT → MÄR. Beat-Karten (Fenster im Phase-C-Progress,
  Muster `SM_BEATS`):
  - OKT — „Die Heizperiode beginnt — diesmal sichtbar. Monatswerte je Wohnung."
  - DEZ — „Ein Muster fällt auf, das vorher niemand sehen konnte.
    Einsparpotenzial erkannt."
  - JAN — „Bewohner sehen ihren Verbrauch — und heizen bewusster."
  - MÄR — „Die Heizperiode endet. Die Abrechnung ist vorbereitet."
- Auflösung (~0.78): **Abrechnungs-Karte 2** — vollständig, jede Position
  nachvollziehbar, Status „Keine Rückfragen". Headline:
  **„Die Abrechnung erklärt sich selbst."**
- Schlusssatz (Brücke in Akt 3): **„Zwischen diesen zwei Wintern liegt keine
  neue Heizung — sondern Sichtbarkeit."** Dann: „Genau dafür gibt es
  HeatMieter."

Kontinuität: Beispiel-Einheit bleibt **Wohnung 3.2** (wie bei Chargemieter
und Smokemieter). Der „Ausreißer"-Beat bleibt **ohne Schuldzuweisung** an
eine konkrete Wohnung/Person (kein Bewohner-Blaming — Muster/Anlage statt
„Wohnung X verschwendet").

## 4. Sachsektionen (Akt 3)

Acht ruhige, klassisch gestapelte Panels (Muster: SmokeSections, Heat-Akzent):

1. **Pflicht & Fristen** — Verbrauchsabhängige Heizkostenabrechnung ist
   Pflicht; fernablesbare Erfassung und monatliche Verbrauchsinformation sind
   geregelt — die Details regelt die Heizkostenverordnung. Bestandsgeräte
   sind bis Ende 2026 auf Fernablesbarkeit nachzurüsten (realer Aufhänger:
   die Frist läuft dieses Jahr). Heatmieter macht daraus einen dokumentierten
   Zustand. Points: Erfassung je Wohnung · Monatswerte statt Jahresrätsel ·
   Nachweise für die Akte.
2. **Erfassung & Live-Daten** — Fernablesbare Funk-Zähler und
   Heizkostenverteiler, Monatswerte je Wohnung ohne Ablesetermin; auch die
   Anlage (Wärmepumpe, Vorlauf/Rücklauf) wird sichtbar. Media: Bestand
   `stills/heatmieter.jpg` + `clips/heatmieter.mp4`, plus H3-Still (WP).
3. **Für Hausverwaltungen** — Weniger Rückfragen, Widersprüche mit Daten
   beantworten, Abrechnung vorbereitet statt Ableselisten und
   Zettelwirtschaft.
4. **Für Bewohner** — Monatliche Verbrauchsinfo, keine Ablesetermine,
   nachvollziehbare Abrechnung → bewusster heizen.
5. **Einsparpotenziale** — Ausreißer und Muster erkennen, Optimierung
   anstoßen (Verhalten + Anlage). „Potenziale sichtbar machen" — keine
   Spargarantien.
6. **Abrechnung & CO₂** — Transparente, nachvollziehbare
   Heizkostenabrechnung; CO₂-Kostenaufteilung zwischen Vermieter und Mieter
   datenseitig abgebildet — „Grundlage schaffen"-Wording.
7. **Ablauf** — Bestand aufnehmen → Zähler-Konzept → Montage & Anbindung →
   Live-Betrieb → Verbrauchsinfo → Abrechnung.
8. **Plattform** — Teil von Powerhouse 360: ein Dashboard für Einheiten,
   Verbräuche, Ereignisse und Abrechnungsstatus. CTA `/demo`.

**Verwaltungs-Widgets** (glaubwürdige Zustände, Muster `SM_ADMIN_WIDGETS`,
14 Wohnungen): „Einheiten erfasst 14" · „Fernablesung Aktiv" · „Monatswerte
Vollständig" · „Offene Rückfragen 0" · „Abrechnung Vorbereitet".

**Akt 4 — Final-CTA:** „Ihr zweiter Winter beginnt mit einem Gespräch."
Primär: kostenfreier Heizkosten-Check. Sekundär: Wärme-Konzept planen.
Support-Zeile: „Für Eigentümer, WEGs, Hausverwaltungen und
Wohnungsunternehmen."

## 5. Copy- & Wording-Leitplanken (hart)

- **Keine erfundenen Statistiken, keine €-Beträge, keine Prozent-Ersparnisse.**
  Die Story erzählt EIN Haus und ZWEI konkrete Winter — kein
  Durchschnittsclaim. Kostendramatik nur qualitativ („hohe Kosten, die
  niemand sieht"), nie beziffert.
- **„Falsche Abrechnung" nur als erlebte Situation dieses einen Hauses:**
  Schätzwerte, nicht erfolgte Ablesung, Rückfragen, Widerspruch — keine
  Pauschalaussage über Messdienste oder die Branche.
- **Einsparpotenziale:** „sichtbar machen", „erkennen", „Optimierung
  anstoßen" — keine Spargarantie, kein „alle sparen X %". Der Story-Payoff
  („bewusster heizen") ist Erzählung, im Sachteil nur Potenzial-Wording.
- **Recht:** Pflichten ja, aber „die Details regelt die
  Heizkostenverordnung" — keine Rechtsberatung, keine
  Paragraphen-Zitate im UI. Zulässige, etablierte Fakten: verbrauchsabhängige
  Abrechnung ist Pflicht; monatliche Verbrauchsinformation bei
  fernablesbaren Geräten; Nachrüstfrist Fernablesbarkeit Ende 2026.
  (Formulierungen im Copy-Schritt gegenprüfen.)
- **Abrechnung:** „transparent und nachvollziehbar", „vorbereitet",
  „jede Position erklärbar" — keine Zusage zu Eichrecht/Rechtssicherheit.
  CO₂-Kostenaufteilung: „datenseitig abgebildet", „Grundlage schaffen".
- **Kein Bewohner-Blaming** im Ausreißer-Beat (siehe §3).
- Ton wie Chargemieter/Smokemieter: deutsch, ruhig, präzise, premium.
- Schreibweise auf der Seite: **HeatMieter** (analog SmokeMieter,
  ChargeMieter); SEO/Fließtext: „Heatmieter".

## 6. Technisches Design

**Dateien (alle additiv, nichts Bestehendes wird umgebaut):**

```
src/app/heatmieter/page.tsx           — Route, Metadata, Composition
src/content/heatmieter.ts             — Single Source of Truth: Ticker,
                                        Phasen, Beats, Abrechnungs-Karten,
                                        Sektionen, Widgets, CTAs, Media
src/lib/heatProgress.ts               — Story-Progress-Store
                                        (1 Runway, 3 Phasen; Muster:
                                        smokeProgress.ts)
src/components/heatmieter/
  HeatNav.tsx                         — Top-Nav (Muster: SmokeNav)
  HeatExperience.tsx                  — Split Desktop/Mobile + reduced-motion
  HeatHero.tsx                        — Akt 1, klassisch
  HeatStory.tsx                       — Akt 2: Scrub-Stage, Monats-Ticker,
                                        Beat-Karten, Abrechnungs-Karten,
                                        Datenlayer (beide Modi: Frame-Scrub
                                        und Still-Crossfade)
  HeatStoryBridge.tsx                 — Scroll→Store-Bridge (rAF, Muster:
                                        SmokeStoryBridge)
  HeatSections.tsx                    — Akt 3: 8 gestapelte Panels
  HeatCta.tsx                         — Akt 4
public/media/heatmieter/              — Stills, Clip, story-frames/
```

**Story-Engine:** Ticker, Phase, Frame-Index und Datenlayer-Opazität sind
reine Funktionen des Scroll-Progress. **Phase C nutzt denselben
Frame-Bestand wie Phase A** (Index läuft erneut 1→N), nur mit orangem
DOM/SVG-Datenlayer darüber — kein zweites Video. Frame-Sequenz nach dem
bewährten Muster (`~96 JPEGs, fps=12, 1600 px, q:v 4, ~6–7 MB`).

**Abrechnungs-Karten:** reine DOM-Karten (Muster: `CM_BILLING_FIELDS`).
Karte 1 (blind): Positionen mit Schätzwert-Markern + Widerspruch-Stempel.
Karte 2 (transparent): vollständige Positionen + „Keine Rückfragen".

**Mobile & `prefers-reduced-motion`:** Stills + Crossfades statt Frame-Scrub;
Ticker und Beat-/Abrechnungs-Karten bleiben (sie tragen die Story allein),
Ticker in größeren Schritten.

**Farbe:** Modul-Akzent `var(--color-mod-heat)` = `#e46a3f` (Rot-Orange).
Phase A/1. Winter kalt-blau entsättigt (Bestands-Navy-Palette); ab Phase B
kippt alles in den Heat-Akzent; Sachsektionen komplett im Heat-Akzent.

**CTAs:**
- Primär: `/projekt-besprechen?modul=heatmieter&thema=heizkostencheck`
  („Kostenfreien Heizkosten-Check starten")
- Sekundär: `/projekt-besprechen?modul=heatmieter&thema=planung`
  („Wärme-Konzept planen")
- Plattform-Sektion: `/demo` („System ansehen")

**SEO/Metadata:** Title **„Heatmieter — Heizkostenabrechnung im
Mehrfamilienhaus | Powerhouse 360"**; Description mit fernablesbarer
Erfassung, Transparenz, Einsparpotenzialen, CO₂-Kostenaufteilung;
OG-Image = H1 (Winter-Fassade).

## 7. Medien & Asset-Plan (Higgsfield, vor dem Bau)

Rezept wie beim Launch-Set (nano_banana_pro 2k 16:9 für Stills; seedance_2_0
für Clips mit `start_image` = Still-Job-ID, `generate_audio:false`,
`declined_preset_id: 24bae836-2c4a-48e0-89b6-49fcc0b21612`).
Gebäude-Konsistenz über Referenz-Job `1eb8708e-4880-4919-862e-895973f4e93d`.
**Wärmepumpen-Referenz: das User-Bild** (anthrazit Monobloc, quadratisches
Schutzgitter, MFH-Klasse) per `media_upload` als Bild-Referenz hochladen und
in H1/H3 mitgeben.

| # | Asset | Typ | Zweck |
|---|-------|-----|-------|
| H1 | Winter-Fassade, Blue Hour, Schnee, warme Fenster, WP im Hof | Still | Basis Phase A + C, OG-Image |
| H2 | Winter-Clip aus H1 (6–8 s, Schneefall, Atmosphäre, dichte Keyframes) | Clip → ~96 Frames | der Scrub (Phase A vorwärts, Phase C erneut mit Datenlayer) |
| H3 | WP-Nahaufnahme im Schnee (nach User-Referenz, arbeitend, leichter Dampf) | Still | Phase B (Wechsel) + Sektion 2 |
| H4 | Fassade bei Tauwetter/Morgenlicht, warm | Still | Payoff + Final-CTA |
| — | Bestand: `stills/heatmieter.jpg`, `clips/heatmieter.mp4` | vorhanden | Sachsektionen |

Budget-Schätzung: ~120–200 Credits; Kontostand vor Generierung prüfen.
Lokale Pipeline wie gehabt: Clips scrub-optimiert (`ffmpeg -an -crf 23 -g 4
-keyint_min 4 -sc_threshold 0 -movflags +faststart`), Frames `fps=12,
scale=1600:-2, -q:v 4` nach
`public/media/heatmieter/story-frames/frame_%03d.jpg`.

## 8. Nicht-Ziele (YAGNI)

- Homepage-Link „Mehr zu Heatmieter" bleibt vorerst auf
  `https://heatmieter.de`; Domain-Routing (wie chargemieter.de in
  `src/middleware.ts`) ist ein separater Schritt nach dem Launch der Route.
- Kein Preisrechner, kein FAQ-Akkordeon, keine Mehrsprachigkeit.
- Keine Thermografie-/Wärmebild-Features versprechen (das „Sichtbar
  machen" ist Datentransparenz, keine Kamera).
- Keine Refactorings an Homepage/Chargemieter/Smokemieter; bewusste
  Parallel-Struktur (eigener Store) statt vorzeitiger Abstraktion.

## 9. Umsetzungsreihenfolge

1. Higgsfield: WP-Referenzbild hochladen → Asset-Set H1–H4 generieren
2. Postprocessing (ffmpeg: Clip, Frame-Sequenz)
3. `content/heatmieter.ts` — komplette Copy + Manifest
4. Story-Engine (`heatProgress` + `HeatStory` + Bridge)
5. Hero, Sektionen, CTA, Nav
6. Mobile + reduced-motion
7. Verify im Preview (Desktop/Mobile/Dark), SEO-Check
8. Commit + Deploy (VPS-Methode)
