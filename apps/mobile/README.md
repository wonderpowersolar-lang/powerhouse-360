# POWERHOUSE 360 — Mobile App

Ordner für die App-Entwicklung (Mobile App / Kunden-App).

## Status

🟢 Nativer SwiftUI-Slice steht (`PowermieterApp/`). Stack: SwiftUI, iOS 18+,
Xcode 26, keine Fremd-Frameworks.

**Seit ADR-011 ist die App eine reine Bewohner-App.** Vermieter und
Hausverwaltung arbeiten über die Web-Plattform; die Rollen-UI ist ausgebaut.

Umgesetzt: **Onboarding-Flow** (Willkommen → Gebäude verbinden → Datenschutz →
Fertig, als `NavigationStack` mit Zurück-Navigation und Fortschrittspunkten)
und fünf Tabs ohne Platzhalter:

- **Übersicht** — Energiefluss, 6er-KPI-Grid, Solar-Tipp, Tagesverlauf, Monatsreport
- **Analyse** — Zeitraum-Umschalter Heute/Woche/Monat/Jahr/Eigene mit nativ
  gezeichnetem Verlauf-Chart inkl. Tap-Auswahl und Vergleichskarte
- **Nachhaltigkeit** — CO₂-Ring, Alltags-Äquivalente, Anteil lokaler Energie, Hausbilanz
- **Dokumente** — Abschlagskarte + Ordner-Grid mit Drilldown in die gefilterte Liste
- **Einstellungen** — Profil, Hell/Dunkel, Benachrichtigungen, Datenfreigaben

Vollständiges Light/Dark-Theme aus `design-reference/design-tokens.css`.

### Bauen & im Simulator zeigen

```sh
cd apps/mobile/PowermieterApp
xcodebuild -scheme PowermieterApp -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
xcrun simctl boot "iPhone 17"; open -a Simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/PowermieterApp.app
xcrun simctl launch booted de.powerhouse360.powermieter
# direkt ins Dashboard:            SIMCTL_CHILD_PM_START=app vor `simctl launch`
#   Tab direkt öffnen:             zusätzlich SIMCTL_CHILD_PM_TAB=analyse|nachhaltig|
#                                  dokumente|einstellungen
#   Overlay direkt öffnen:         zusätzlich SIMCTL_CHILD_PM_OVERLAY=detailanalyse|
#                                  energiebilanz|sonnenstrompreis|mitteilungen|support|…
#   Bottom-Sheet direkt öffnen:    zusätzlich SIMCTL_CHILD_PM_SHEET=kpi:kosten|node:bat|
#                                  info:naeh|doc:<Titel>|building
#   Toast einblenden:              zusätzlich SIMCTL_CHILD_PM_TOAST="Download gestartet …"
# direkt auf einen Onboarding-Schritt: SIMCTL_CHILD_PM_STEP=connect|privacy|done
```

Oder `PowermieterApp.xcodeproj` in Xcode öffnen und ⌘R.

**Alle `PM_*`-Umschaltungen laufen über `App/DebugEnvironment.swift` und gibt es
nur im Debug-Build.** Im Release liefert jede Abfrage `nil`, der Compiler
entfernt den Zweig, und weder die Schlüsselnamen noch der Lesepfad landen im
ausgelieferten Binary — geprüft per `strings` gegen beide Konfigurationen.
Wichtig vor allem für `PM_API_BASE_URL`: Sonst liesse sich ein ausgelieferter
Build über eine Umgebungsvariable auf einen fremden Server umlenken. Im Release
entscheidet allein der Info.plist-Eintrag `PMAPIBaseURL`.

### Navigation und Sheet (2026-07-27)

**Detailscreens laufen über `NavigationStack`, das Sheet über `.sheet` mit
`presentationDetents`.** Beides war vorher nachgebaut.

Drei Dinge, die dabei herauskamen:

- **Die Overlays verloren ihre Historie.** Die Hülle hielt genau *ein*
  `overlay`, also ersetzten sich die Ketten gegenseitig: „Zurück" aus dem
  Support landete im Tab, nicht in der Rechnung, aus der man kam. Ein Pfad
  statt eines Slots behebt das.
- **`.toolbar(.hidden, for: .navigationBar)` deaktiviert den Kantenwisch
  zurück.** Der erste Anlauf behielt den eigenen Kopfbereich und blendete die
  Systemleiste aus — der Stack schob korrekt, aber keine der beiden
  Wischvarianten ging zurück. Deshalb tragen die elf Detailscreens jetzt die
  Systemleiste (`pmOverlayChrome`): Titel und Untertitel in einem
  `principal`-Element, Zurück per System-Chevron. Nur die Tab-Wurzel bleibt
  ohne Leiste, sie hat ihren eigenen Kopfbereich.
- **Ziele eines `navigationDestination` erben Environment-Werte nicht, die
  außerhalb des `NavigationStack` gesetzt wurden.** `ShellActions` hängt
  `openOverlay`/`openSheet`/`showToast` deshalb an jede Präsentationsgrenze
  einzeln. Per A/B im Simulator belegt — ohne den Modifier feuert der Knopf
  (der Ungelesen-Punkt verschwindet), aber es wird nichts geschoben.

Der Toast wird bei offenem Sheet vom Sheet selbst gezeigt: `.sheet` ist eine
eigene Präsentation und läge sonst darüber, obwohl der Toast genau von dort
ausgelöst wird („Download gestartet …").

Die Tab-Leiste bleibt bewusst eigenbau (PO-Entscheidung 2026-07-27): Die
System-`TabView` brächte iPad-Anpassung und Tastaturnavigation, aber der
dunkle Pill-Look mit grünem Chip ist das Erkennungsmerkmal der App.

### Overlays

Elf Detailscreens sind gebaut und aus den Tabs heraus verlinkt: Detailanalyse,
Monatsreport, Sonnenstrompreis, Assistent, Energiebilanz, Mitteilungen,
Rechnungsübersicht, Rechnungsdetail, Messsystemstatus, Störungsfall und
Support. Die gebäudebezogenen Overlays (Wohneinheiten, Verbrauchsaufteilung)
sind mit ADR-011 entfallen. Sie werden auf den `NavigationStack` geschoben; geöffnet
werden sie über `@Environment(\.openOverlay)`, damit kein Binding durch jede
Zwischenebene gereicht werden muss.

### Bottom-Sheet & Toast

Der Bottom-Sheet erklärt Zahlen statt sie nur anzuzeigen und hat vier
Varianten: `kpi` (die sechs Kennzahlkacheln), `node` (die Knoten im
Energiefluss), `info` (Näherungswerte, Persönliche Daten, Wohnung, Zahlungsart,
Datenschutz) und `document` (mit Öffnen/Herunterladen). Inhalte
liegen gesammelt in `SheetContent`, geöffnet wird über
`@Environment(\.openSheet)`. Der Toast quittiert Demo-Aktionen über
`@Environment(\.showToast)` und blendet sich nach 2,6 s selbst aus; bei offenem
Sheet zeigt ihn das Sheet selbst (siehe oben).

### App-API-Client

`PowermieterApp/API/` enthält die Client-Schicht zu `/api/v1/app/*`. Die DTOs
spiegeln 1:1 die Zod-Contracts aus dem WP-APP-2-Plan (`me`, `consumption`,
`billing`, `settings`, `config`); Energiemengen laufen über `Kwh`, das wie
serverseitig in ganzzahligen Milli-kWh rechnet statt in `Double`.

**Die API existiert noch nicht** — WP-APP-1 (Messkern, Ingestion) und WP-APP-2
(Aggregation, Routen) sind ungebaut. Deshalb liefert `MockPowermieterAPI` die
Werte, die vorher fest in den Views standen. `HTTPPowermieterAPI` ist
implementiert, aber nie gegen einen laufenden Server gelaufen.

Umschalten auf echt: Basis-URL setzen, sonst nichts.

```sh
SIMCTL_CHILD_PM_API_BASE_URL=https://app.powerhouse360.de xcrun simctl launch …
```

`APIConfiguration.makeClient()` ist die einzige Stelle, die zwischen Mock und
HTTP entscheidet. Views lesen über `@Environment(\.powermieterStore)`.

**Contract erweitert (2026-07-26).** Der `summary`-Endpunkt liefert jetzt
zusätzlich `recentPower`, `today.costCents` und `today.pvKwh`/`today.gridKwh`;
`split` ist als monatsbezogen dokumentiert. Geändert in Spec §4.2
(`docs/superpowers/specs/2026-07-22-kunden-app-architekturplan.md`) und im
WP-APP-2-Plan — beides muss beim Bau der API so umgesetzt werden.

`recentPower` heißt bewusst nicht `livePower`: Das Standard-Messkonzept liefert
15-Minuten-Werte, eine momentane Wirkleistung existiert dort nicht. Der
Endpunkt gibt den Mittelwert über das letzte abgeschlossene Intervall zurück,
plus dessen Länge. Die Kachel heißt entsprechend „Ø letzte 15 Min" statt
„Aktueller Verbrauch" — ein 15-Minuten-Mittel als Live-Wert auszugeben wäre
eine Falschaussage gegenüber dem Bewohner.

Verdrahtet: Live-Zeile, Tagesverlauf-Kurven und -summe, Leistung, Solaranteil
und Tageskosten.

**Tagesverlauf ablesen:** Antippen wählt eine Stunde und zeigt Verbrauch, Solar
und Netz; erneutes Antippen blendet aus. Bewusst kein Ziehen — jede
DragGesture auf einem Kind der ScrollView beansprucht die Berührung und macht
das Dashboard über dem Chart unscrollbar. Das gilt auch mit vorgeschaltetem
LongPress und auch für `simultaneousGesture`; beides wurde im Simulator
geprüft und verworfen. Auf iPad-Trackpad und Mac zeigt `onContinuousHover`
zusätzlich echtes Zeiger-Hover.

**Entschieden (ADR-011, 2026-07-26): Die App ist eine Bewohner-App.**
Vermieter und Hausverwaltung arbeiten über die Web-Plattform; ein zweiter,
objekt-scoped Endpunktsatz wird nicht gebaut. Die App-API bleibt bei
`PowerParticipant` als einzigem Scope-Anker.

Die Rollen-UI ist am selben Tag ausgebaut worden: 12 Dateien gelöscht, der
Rollenbegriff aus 20 weiteren entfernt. 10.165 → 8.006 Zeilen.

### Barrierefreiheit und Ladezustände (2026-07-26)

Aus dem iOS-Design-Review sind vier Befunde umgesetzt:

- **Dynamic Type.** Die App hatte 306 feste Schriftgrößen und ignorierte
  „Textgröße" in den iOS-Einstellungen vollständig. Alle Aufrufstellen laufen
  jetzt über `Theme/ScaledFont.swift`: `.pmFont(13, weight: .bold)` koppelt die
  Punktgröße an die nächstpassende Textstufe und lässt sie von `ScaledMetric`
  mitskalieren. Die Punktgrößen bleiben erhalten — sie sind über die ganze App
  aufeinander abgestimmt. `Text + Text`-Verkettungen brauchen einen `Font`
  statt eines Modifiers und nutzen `Font.pmScaled(_:for:)`.
  Gedeckelt auf `accessibility1`: darüber schneiden die aus dem Prototyp
  übernommenen festen Höhen Zahlen ab. Die Tab-Leiste zeigt ab
  Bedienungshilfen-Größen nur Symbole (fünf Beschriftungen passen nicht mehr
  nebeneinander, VoiceOver liest weiter den vollen Namen); der Energiefluss
  ist auf `xLarge` gedeckelt, weil er seine Knoten mit `.position` setzt.
- **Ladezustände.** `PowermieterStore.presentation` unterscheidet
  *lädt* / *da* / *nicht verfügbar*. Bei einem Fehler erscheint
  `DataStatusBanner` mit Grund und „Erneut", und der Dashboard-Inhalt wird
  redigiert statt Prototyp-Zahlen zu zeigen. Vorher war ein Ladefehler von
  einem erfolgreichen Laden nicht zu unterscheiden — nur mit falschen Zahlen.
  Der Tagesverlauf hat einen eigenen Leerzustand, weil `.redacted` gezeichnete
  Pfade nicht erfasst.
- **Trefferflächen.** `.pmHitTarget()` bringt Sheet-Schließen, Overlay-Zurück
  und Dokumente-Zurück auf die 44 pt der HIG, ohne die Optik zu ändern.
- **Kontrast.** `Theme.tx2`/`tx3` weichen bewusst von `design-tokens.css` ab:
  Die CSS-Werte erreichten 2,5:1 (`tx3`) und verfehlten WCAG AA deutlich.
  Gerechnet ist jetzt gegen Karte *und* App-Hintergrund, beide ≥ 4,5:1.

Ausprobieren: `xcrun simctl ui booted content_size accessibility-medium`,
Fehlerpfad mit `SIMCTL_CHILD_PM_API_BASE_URL=http://127.0.0.1:9`.

### Abstandsraster

**4 pt, mit 2-pt-Halbschritten unter 8 pt** — also 0, 2, 4, 6 und dann
Vielfache von 4. Vorher lagen 28 verschiedene Padding- und 16 Spacing-Werte im
Code (3, 5, 11, 13, 14, 18 …), direkt aus den Pixelwerten des HTML-Prototyps
übernommen. 245 Werte sind auf den nächsten Rasterwert gezogen, bei exakter
Mitte aufgerundet.

Ein reines 4-pt-Raster wäre am unteren Ende zu grob: Zwischen Titel und
Untertitel braucht es 2 pt, nicht 0 oder 4. Deshalb die Halbschritte darunter.

Sichtbarste Folge: Der Seitenrand ist von 18 auf 20 pt gewachsen, die
Kartenpolsterung liegt einheitlich bei 16.

Knopfhöhen sind bei der Gelegenheit von fünf Werten (42/46/48/50/54) auf drei
vereinheitlicht: **44 / 48 / 56**. Die drei 42-pt-Knöpfe lagen zusätzlich unter
der HIG-Trefferfläche.

```sh
python3 apps/mobile/PowermieterApp/Scripts/check-spacing.py
```

Das Skript prüft Paddings, Spacings und `minLength`. Feste `.frame`-Größen
prüft es bewusst nicht — darunter fallen Symbolkacheln, Chart-Zeichenflächen
und Haarlinien, und eine Haarlinie *muss* 1 pt hoch sein. Nicht in CI
eingehängt.

### Noch offen (nicht im Slice)

Die restlichen Views lesen weiterhin Festwerte; echte Instrument-Sans-Schrift
ist nicht gebündelt (aktuell System-Font SF).

## Einordnung ins Monorepo

Dieser Ordner liegt unter `apps/*` und wird damit automatisch Teil des
pnpm-Workspace, sobald hier eine `package.json` existiert.

Bestehende Apps im Monorepo:

- `apps/website` — öffentliche Website (powerhouse360.de)
- `apps/platform` — Admin/CRM + Kundenportal + Bewohnerportal + Monteur-PWA (app.powerhouse360.de)
- `apps/worker` — Hintergrund-Jobs (Outbox-Dispatcher → E-Mail)

## Nächste Schritte

1. Overlay-/Detailscreens ergänzen und aus den Tabs heraus verlinken
2. App-API (WP-APP-2) anbinden — Mock-Werte durch echte Messdaten ersetzen
3. Instrument Sans bündeln; TestFlight-Verteilung klären (Apple Developer Account)
