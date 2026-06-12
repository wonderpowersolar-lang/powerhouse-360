# POWERHOUSE 360 — Creative Direction & Design-System
**Scroll-basierte 3D-Flow-Website · „Das Betriebssystem deiner Immobilie."**

Kanonisches Konzeptdokument. Moodframes (Zielniveau) in `docs/design/mood/`.
Live-Referenzanalyse: rideradian.com · business.nrg.com/campaigns/build-your-data-center · razorpay.com/sprint/26.

---

## 1 · Creative Direction (überarbeitet)

**Ein Satz:** Ein Mehrfamilienhaus wird wie ein Hero-Produkt inszeniert — und beim Scrollen
erlebt der Nutzer, wie es Station für Station zum Betriebssystem seiner Immobilie wird.

**Drei Leitprinzipien:**

1. **Das Haus ist das Produkt.** Nicht Icons, nicht Illustrationen: ein hochwertiges,
   realistisches deutsches MFH bei Blue Hour ist die einzige Bühne. Alles andere
   (Module, Panels, KPIs) dockt an dieses eine Asset an. (Radian-Prinzip)
2. **Verstehen durch Phasen.** Der Scroll ist ein Build-Prozess: Strom → Wärme → Hirn →
   Laden → Sicherheit → Bewohner → Verwaltung. Jede Phase ist eine eigene, ruhig
   gehaltene Station mit klarem Vorher/Nachher. (NRG-Prinzip)
3. **Plattform, nicht Tool.** Nummerierte Produktwelten (01–07) unter einem
   Launch-Narrativ. Jedes Modul bekommt eine eigene Bühne + Premium-Panel,
   am Ende laufen alle in der Plattform zusammen. (Razorpay-Sprint-Prinzip)

**Tonalität:** souverän, ruhig, technisch glaubwürdig. Keine Effekthascherei.
Die Seite verkauft ein Infrastruktur-Upgrade, kein Gadget.

**Anti-Liste (hart):** keine Low-Poly-Optik · keine Neon-Hologramme · keine
cartoonhaften Geräte · keine generischen Stock-Icons · keine Handwerker-Ästhetik ·
kein Gaming-Look · keine überladenen Animationen.

---

## 2 · Referenzableitung

### Radian (rideradian.com) → Produktinszenierung
Live-Befund: 7 Feature-Stationen (Swap, Power, Storage, Silence, Maintenance, App, Design),
kurze 6–12-Wort-Copy („Less noise. More focus."), zweistufige Navigation (reduzierte Top-Nav +
expandierbares Kapitel-Menü), Produktnähe wächst von Detail zu Gesamtbild vor dem CTA.

**Übertragung:**
- MFH = das Motorrad. Die Produktwelten = die Feature-Stationen.
- Copy-Regel: Headline ≤ 8 Wörter, Subline ≤ 20 Wörter, 3–5 Bullets, fertig.
- Navigation: schlanke Top-Nav (Logo · Module · 1 CTA) + Kapitel-Indikator (00–09)
  als `ModuleNavigation` seitlich/unten.
- Dramaturgie der Nähe: Hero = Distanz → Stationen = Detailnähe → Finale = Distanz
  mit allen verbundenen Systemen → CTA.

### NRG (build-your-data-center) → Prozess-Flow
Live-Befund: „Scroll to Phase 1"-Prompt, 5 sequenzielle Phasen von Fläche bis Betrieb,
Outcome-Sprache („speed, reliability, predictable costs"), Phasen-Navigation.

**Übertragung:**
- Expliziter Scroll-Prompt im Hero: „Scrollen, um das System zu entdecken".
- Jede Station ist eine *Phase der Transformation* — das Gebäude wird sichtbar
  „mehr System" (Layer aktivieren sich additiv und bleiben im Finale alle an).
- `ScrollProgress`-Komponente: dezente vertikale Phasenleiste 00–09 mit aktiver Station.

### Razorpay Sprint 26 → modulares Produktuniversum
Live-Befund: 6 nummerierte Module (01–06) als eigenständige Produktwelten unter einem
Blueprint-Claim („100+ Launches, One Blueprint"), Karten-Pattern Titel→Descriptor→Action,
massive Kapitelziffern vs. kleine Kartentitel, dunkler Grund + Akzent, viel Weißraum.

**Übertragung:**
- Große Kapitelziffer („01 /") als typografisches Leitmotiv jeder Station + im Panel.
- Panel-Pattern fix: Nummer · Produktname · Headline · Subline · 3–5 Bullets · KPI-Reihe.
- Plattform-Station (08) = „Launch-Blueprint": Modulkarten erscheinen nacheinander
  als nummeriertes Set über dem digitalen Zwilling.
- Narrativ-Klammer: „Fünf Module. Ein System. Dein Gebäude."

---

## 3 · Finaler Scroll-Flow (Stationen 00–09)

| # | Station | Szene (Bühne) | Panel | Hold |
|---|---------|----------------|-------|------|
| 00 | Intro-Loader | Logo + Energie-Linie + Claim, ≤ 2,5 s | — | — |
| 01 | Hero — Master Building | MFH Blue Hour, langsamer Push-in | — (nur Copy+CTA) | lang |
| 02 | Powermieter | Dach/PV + Energiefluss → Technikraum/Zählerwand | 01 | lang |
| 03 | Heatmieter | Hof: reale LW-Wärmepumpe, Wärmelinien ins Haus | 02 | **am längsten** |
| 04 | POWERHOUSE Hub | Technikraum, Hub v1 frontal, Status-LEDs | 03 | lang |
| 05 | Chargemieter | Stellplätze/TG: Wallboxen, dezentes E-Auto | 04 | mittel-lang |
| 06 | Smokemieter | Treppenhaus/Flur: diskrete Rauchmelder | 05 | mittel |
| 07 | Bewohnerportal | Wohnung, Wanddisplay, Paula als UI-Karte | 06 | mittel-lang |
| 08 | Plattform-Dashboard | Zoom-out, Blueprint-Overlay mit allen Modulen | 07 | lang |
| 09 | Final | Gesamtgebäude, alle Layer verbunden, CTA | — | lang |

Mobile: identische Reihenfolge als gestapelte Story — Moodframe/Render pro Station +
dasselbe Panel als statische Karte.

---

## 4 · Produktpanel-Texte (final, verbatim einsetzen)

### Panel 01 — Powermieter
- **Headline:** Strom im Mehrfamilienhaus wirtschaftlich betreiben.
- **Subline:** Mieterstrom, Gebäudestrom, Energiefluss und Abrechnung in einem klaren System.
- **Bullets:** PV-Strom lokal nutzen · Mieter fair abrechnen · Energieflüsse transparent machen · Netzbezug und Eigenverbrauch sichtbar machen · Abrechnung und Betrieb digitalisieren
- **KPIs:** PV-Anteil · Eigenverbrauch · Netzbezug · Ersparnis

### Panel 02 — Heatmieter
- **Headline:** Wärme und Heizkosten digital verstehen.
- **Subline:** Heatmieter verbindet Wärmepumpe, Verbrauchsdaten, Heizkostenabrechnung und Optimierung.
- **Bullets:** Wärmepumpenbetrieb sichtbar machen · Wärmeverbrauch je Gebäude/Einheit analysieren · Heizkostenabrechnung vorbereiten · CO₂- und Verbrauchsdaten verständlich darstellen · Optimierungspotenziale erkennen
- **KPIs:** Vorlauf · Rücklauf · Wärmeverbrauch · CO₂-Kosten · Heizkostenstatus

### Panel 03 — POWERHOUSE Hub
- **Headline:** Die lokale Schaltzentrale im Gebäude.
- **Subline:** Der Hub verbindet Geräte, Sensoren, Zähler und Gebäudedaten zu einem steuerbaren System.
- **Bullets:** verbindet Strom, Wärme, Laden und Sicherheit · lokale Gebäudedatenplattform · Schnittstelle zu Zählern, Wärmepumpe, Sensorik und Cloud · Grundlage für Monitoring, Abrechnung und Betrieb · macht aus Technik ein digitales Gebäudesystem
- **KPIs:** Geräte online · Datenpunkte · Gateway-Status · Verbindungsqualität

### Panel 04 — Chargemieter
- **Headline:** Ladeinfrastruktur für Mehrfamilienhäuser abrechenbar machen.
- **Subline:** Wallboxen, Ladepunkte, Lastmanagement und Abrechnung in einem System.
- **Bullets:** Ladepunkte im MFH verwalten · Verbrauch je Nutzer erfassen · Lastspitzen vermeiden · Ladevorgänge abrechnen · Ladeinfrastruktur skalierbar betreiben
- **KPIs:** aktive Ladepunkte · aktuelle Ladeleistung · Lastreserve · Ladevorgänge · Abrechnungsstatus

### Panel 05 — Smokemieter
- **Headline:** Rauchmelder digital verwalten.
- **Subline:** Sicherheitsstatus, Wartung und Geräteverwaltung für den Bestand.
- **Bullets:** Rauchmelderstatus im Blick · Wartung digital organisieren · Geräte und Räume zuordnen · Servicefälle dokumentieren · Sicherheit transparent machen
- **KPIs:** Geräte online · Status OK · Wartung fällig · letzter Test · Alarmhistorie

### Panel 06 — Bewohnerportal
- **Headline:** Energie wird für Bewohner verständlich.
- **Subline:** Verbrauch, Kosten, Abrechnung und Services in einer einfachen Nutzererfahrung.
- **Bullets:** Strom- und Wärmeverbrauch sehen · Kosten nachvollziehen · Verträge und Abrechnung verstehen · Services digital nutzen · Paula als Energie-Assistentin
- **KPIs:** Solarstromanteil · Verbrauch heute · Kostenprognose · Status Wohnung

### Panel 07 — POWERHOUSE 360 Plattform
- **Headline:** Ein System für Betrieb, Abrechnung und Gebäudedaten.
- **Subline:** Alle Produktwelten laufen in einer zentralen Verwaltungsansicht zusammen.
- **Bullets:** Objektübersicht für Hausverwaltung und Eigentümer · Strom, Wärme, Laden und Sicherheit in einem System · Monitoring und Abrechnung verbunden · transparente Daten für Entscheidungen · Grundlage für den digitalen Gebäudebetrieb
- **KPIs:** Systemstatus · CO₂-Ersparnis · Geräte online · Abrechnung bereit · Objektperformance

---

## 5 · Motion-Prinzip — „Approach · Hold · Reveal · Explain · Transition"

Pro Station fünf Beats, gemappt auf das vorhandene Plateau-Scroll-System
(`scrollProgress.ts`): jede Station erhält ein Scroll-Band; innerhalb des Bandes:

| Beat | Anteil des Bandes | Verhalten |
|------|-------------------|-----------|
| 1 Approach | 0 – 25 % | Kamera fährt zur Szene (gedämpft, kein Cut) |
| 2 Hold | 25 – 40 % | Kamera ruht **vollständig** (Keyframe-Plateau, gefühlt 0,8–1,5 s) |
| 3 Reveal | 40 – 50 % | Panel slidet/faded ein (450–600 ms, ease-out-quint) |
| 4 Explain | 50 – 85 % | Szene + Panel stehen — die Lese-Phase, nichts bewegt sich außer Mikro-Loops |
| 5 Transition | 85 – 100 % | Panel minimiert (250 ms), Kamera löst zur nächsten Station |

**Konsequenzen gegenüber der bisherigen Version:**
- Plateau-Anteil pro Station von ~66 % auf **~75 %** erhöhen, Travel auf ~25 %.
- Sektionhöhen von 165 vh auf **190–220 vh** (Heatmieter + Hero + Plattform = 220 vh).
- Panel-Reveal strikt an `holdWeight ≥ 0.6` koppeln (nie während Kamerafahrt).
- Lenis: lerp 0.05–0.06, kein Snapping; Kamera-Damping unverändert kritisch gedämpft.
- Mikro-Loops erlaubt (LED-Puls, Lüfter, Fenster-Atmen) — nie Kamerabewegung im Hold.
- Keine abrupten Sprünge: max. Kamerawinkel-Delta pro Transition begrenzen; bei
  Innen→Außen-Wechseln kurzer Dunkel-Übergang über Vignette statt Teleport.

**Motion-Tokens** (`src/styles/motionTokens.ts`):
`ease.calm = cubic-bezier(0.22,1,0.36,1)` · `dur.reveal = 550ms` · `dur.exit = 250ms` ·
`hold.default = 0.75` · `hold.heat = 0.8` · `cam.damping = bestehend`.

---

## 6 · Wärmepumpe — verbindliche Zieldefinition

**Zielbild:** `docs/design/mood/03-heatpump-station.png` (Higgsfield, fotoreal).

Merkmale, die das 3D-Modell (`HeatPump.tsx`) erfüllen muss — Stand heute weitgehend
umgesetzt, Feinschliff nach Moodframe:
- breiter anthrazit Monobloc, leicht gerundete Kanten, **horizontales Lamellengitter**
  über ~⅔ der Front (Lüfter nur als dunkle Tiefe dahinter), glattes Servicepanel mit
  dezenter Status-Lichtleiste
- zwei Betonfüße auf sauberem Betonfundament mit **Kiesrand**
- isolierte Anschlussleitungen in die Fassade, realistisch gebündelt
- Einbettung: Lattenzaun-Segment, Ziergräser, Poller-Leuchte, warmer Downlight-Kegel
  an der Fassade — die Station wirkt wie eine gebaute Außenanlage, nicht wie ein Prop
- Im Hold: Lüfter dreht langsam sichtbar hinter den Lamellen, Status-LED atmet,
  zwei feine Wärmelinien (warmes Amber, kein Neon) laufen ins Gebäude

---

## 7 · Gebäude — verbindliche Zieldefinition

**Zielbilder:** `01-hero-master-building.jpg` (+ die beiden Hero-Renders in `public/brand/`).

- Architektur: 7 Geschosse + zurückgesetztes Penthouse mit begrünter Dachterrasse,
  vertikale Beton-Lisenen, raumhohe Fensterbänder, schlanke Balkone mit Glasgeländer
- Material: realer Beton (PBR-Maps, vorhanden), matte Metallprofile, warm
  emittierende Fenster mit Ton-Varianz (~25–30 % dunkel/Vorhang)
- Dach: PV-Feld modul-blau auf flachem Sockel — sichtbar, aber nicht dominant
- Außenanlage: Plaza mit Pflanzbeeten, Baum, Hecken, warmen Uplights; Gehwegband;
  Asphaltstraße mit Markierung und nasser Reflexion
- Licht: Blue-Hour-Grading — kühle Schatten, warme Fenster, dezente Grün/Cyan-Akzente
  nur an System-Layern; Bloom nur auf hellsten Lichtquellen; Tilt-Shift nur außen
- Tabu: sichtbare Low-Poly-Silhouetten in Kameranähe, ausgewaschene Texturen,
  Über-Glow

---

## 8 · Higgsfield-MCP — Einsatzplan

Verbunden und erprobt (nano-banana 2K ≈ 2 Credits/Bild; Guthaben geprüft).

| Zweck | Tool | Status / Vorgehen |
|-------|------|-------------------|
| Architektur-Moodframes (Zielniveau je Station) | `generate_image` | ✅ 6 erzeugt: Hero wide+mobile, Wärmepumpe, Hub-Technikraum, Wallbox, Wohnung |
| 2D-Fallbacks (Mobile-Hero, Loader-Backdrop) | `generate_image` | ✅ eingebaut (`public/brand/hero-tower-*.jpg`) |
| Fehlende Stationen (Treppenhaus/Rauchmelder, Zählerwand-Mood) | `generate_image` | bei Bedarf, gleiche Prompt-Systematik |
| Hub-Display-UI & Panel-Mockups | `generate_image` (nano-banana, stark bei Text) | als Textur fürs 3D-Display / Referenz fürs DOM-Panel |
| Photoreal→3D-Unterstützung | `generate_3d` (image-to-3D, GLB) | Option: Wärmepumpe/Wallbox aus Moodframe als GLB liften, dezimieren, ins R3F laden — Pilot mit der Wärmepumpe |
| Upscaling für OG/Print | `upscale_image` (4K) | bei Bedarf |
| Motion-Referenz (Kamerafahrt-Stil) | `generate_video` | optional, nur als interne Referenz |

**Prompt-Systematik (fixiert):** photorealistic · German MFH context · blue hour ·
warm windows · calm/premium/realistic · no people · no text/logos (außer Hub) ·
Materialdetails explizit (Lamellen, Kies, Beton) → konsistente Serie.

---

## 9 · Fable-5-kompatible Struktur

`src/content/sections.ts` — Single Source of Truth, erweitert:
```ts
interface SectionDef {
  id; index; kicker; headline; subline; align;
  cta?; emphasis;
  camPos: Vector3Tuple; camTarget: Vector3Tuple;
  hold?: number;          // NEU: Plateau-Anteil 0..1 (default 0.75)
  panel?: ProductPanelDef; // Nummer, Titel, Headline, Subline, Bullets, KPIs, Theme, Accent
}
```

Komponenten (Ist → Ziel; Umbenennungen sind reine Moves):
```
src/components/three/    BuildingScene · CameraRig · RoofPV · HeatPump · Hub ·
                         MeterWall (in TechRoom) · Wallbox→WallboxStation ·
                         SmokeDetector→SmokeDetectorStation · Apartment · EnergyFlow · Effects
src/components/panels/   ProductPanel (vorh.) · MetricCard (aus KPI-Chips extrahieren) ·
                         ModuleNavigation (NEU: 00–09-Indikator) ·
                         ScrollProgress (NEU: Phasenleiste) · CTAOverlay (aus SectionPanel-CTA)
src/components/mobile/   MobileExperience · MobileProductSection (aus Karten-Markup extrahieren)
src/styles/              palette (vorh. three/palette + globals @theme) ·
                         typography (Token-Schicht) · motionTokens (NEU, §5)
```
Loader (00): `SceneLoader` erhält Claim-Zeile + Energie-Linie; max. 2,5 s, dann Fade.

---

## 10 · Finale Copy

**Hero (01):**
> **Powerhouse 360**
> **Das Betriebssystem deiner Immobilie.**
> Strom, Wärme, Laden, Sicherheit und Abrechnung – verbunden in einem intelligenten System für Mehrfamilienhäuser.
> [System entdecken] [Pilotobjekt anfragen] · „Scrollen, um das System zu entdecken"

**Stations-Kicker:** `01 / Powermieter` … `07 / Plattform` (Razorpay-Ziffer groß).

**Plattform-Klammer (08):** „Fünf Module. Ein System. Ein Gebäude."

**Final (09):**
> **Powerhouse 360 — Das Betriebssystem deiner Immobilie.**
> Vom Mehrfamilienhaus zum intelligenten Energie-Asset – wirtschaftlich, transparent und zukunftsfähig.
> [Demo buchen] [Pilotobjekt starten]

---

## Design-System Kurzreferenz

**Farben:** Deep Navy `#0D1626` · Charcoal `#16243F` · Off-White `#F4F6F8` ·
Soft Gray `#9FB0C4` · Warm Window `#F5BE75` · Powerhouse Green `#3DB36A` ·
Cyan Accent `#2BB6B0`.

**Typografie:** moderne Sans (bestehend); Hero 56–72 px bold tight; Subline 18–20 px
regular; Panel-Titel 28 px; Kapitelziffer 96–140 px mit 8 % Opazität als Hintergrundzahl;
max. ~40 Wörter sichtbarer Text pro Screen.

**Panels:** Floating Card, 380–440 px breit, Radius 24, Glas-Layer (dunkel auf hellen
Szenen, hell auf dunklen Innenszenen), feine 1-px-Linie, weiche Schatten, Nummer →
Name → Headline → Bullets (Check-Stil, keine Stock-Icons) → KPI-Reihe (MetricCard).

**Akzeptanzkriterien:** identisch mit Briefing — 10-Sekunden-Verständnis „Betriebssystem
deiner Immobilie", echte Wärmepumpe, erkennbarer Hub v1, vier Produktwelten sichtbar,
längere Holds, Premium-Panels, Mobile-Story.
