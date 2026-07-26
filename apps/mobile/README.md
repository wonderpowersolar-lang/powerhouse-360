# POWERHOUSE 360 — Mobile App

Ordner für die App-Entwicklung (Mobile App / Kunden-App).

## Status

🟢 Nativer SwiftUI-Slice steht (`PowermieterApp/`). Stack: SwiftUI, iOS 18+,
Xcode 26, keine Fremd-Frameworks. Umgesetzt: **vollständiger Onboarding-Flow**
(Willkommen → Rolle → Gebäude verbinden → Datenschutz → Fertig, als
`NavigationStack` mit Zurück-Navigation und Fortschrittspunkten) → **rollenbasiertes
Dashboard für alle drei Rollen**: Mieter-Übersicht (Energiefluss + KPI-Grid),
Vermieter-Übersicht (Statuskarte, 6-Knoten-Gebäude-Energiefluss, 8er-KPI-Grid,
4-Serien-Lastverlauf, Aktions-Kacheln, Report-Zeile) und Verwaltungs-Übersicht
(6er-Statistik-Grid, Offene Vorgänge, Anmeldestatus, Kommunikation, Messsystem-Zeile).
Die im Onboarding gewählte Rolle steuert, welches Dashboard erscheint, und ebenso
das **rollenspezifische Tab-Set** (Mieter: Übersicht · Analyse · Nachhaltig ·
Dokumente · Einstellungen — Vermieter: statt Nachhaltig das **Gebäude** —
Verwaltung: **Gebäude + Vorgänge** statt Analyse/Nachhaltig).

**Alle Tabs sind ausgebaut, es gibt keine Platzhalter mehr:** Gebäude
(Hero, Statuskacheln, offene Aufgaben, Reports), Vorgänge (Ticketliste),
Analyse (Zeitraum-Umschalter Heute/Woche/Monat/Jahr/Eigene mit nativ
gezeichnetem Verlauf-Chart inkl. Tap-Auswahl, Vergleichskarte, rollenspezifischer
Block), Nachhaltigkeit (CO₂-Ring, Alltags-Äquivalente, Anteil lokaler Energie,
Hausbilanz), Dokumente (Abschlagskarte + Ordner-Grid mit Drilldown in die
gefilterte Liste, Bestände je Rolle) und Einstellungen (Profil, Hell/Dunkel,
**Rollenwechsel zur Laufzeit**, Benachrichtigungen, Datenfreigaben).
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
#   Rolle direkt wählen:           zusätzlich SIMCTL_CHILD_PM_ROLE=vermieter|verwaltung
#   Tab direkt öffnen:             zusätzlich SIMCTL_CHILD_PM_TAB=analyse|nachhaltig|
#                                  gebaeude|vorgaenge|dokumente|einstellungen
#   Overlay direkt öffnen:         zusätzlich SIMCTL_CHILD_PM_OVERLAY=detailanalyse|
#                                  energiebilanz|sonnenstrompreis|mitteilungen|support|…
#   Bottom-Sheet direkt öffnen:    zusätzlich SIMCTL_CHILD_PM_SHEET=kpi:kosten|node:bat|
#                                  info:naeh|doc:<Titel>|building
#   Toast einblenden:              zusätzlich SIMCTL_CHILD_PM_TOAST="Download gestartet …"
# direkt auf einen Onboarding-Schritt: SIMCTL_CHILD_PM_STEP=role|connect|privacy|done
```

Oder `PowermieterApp.xcodeproj` in Xcode öffnen und ⌘R.

**Alle `PM_*`-Umschaltungen laufen über `App/DebugEnvironment.swift` und gibt es
nur im Debug-Build.** Im Release liefert jede Abfrage `nil`, der Compiler
entfernt den Zweig, und weder die Schlüsselnamen noch der Lesepfad landen im
ausgelieferten Binary — geprüft per `strings` gegen beide Konfigurationen.
Wichtig vor allem für `PM_API_BASE_URL`: Sonst liesse sich ein ausgelieferter
Build über eine Umgebungsvariable auf einen fremden Server umlenken. Im Release
entscheidet allein der Info.plist-Eintrag `PMAPIBaseURL`.

### Overlays

Alle 13 Detailscreens des Prototyps sind gebaut und aus den Tabs heraus
verlinkt: Detailanalyse, Verbrauchsaufteilung, Wohneinheiten, Monatsreport,
Sonnenstrompreis, Assistent, Energiebilanz, Mitteilungen, Rechnungsübersicht,
Rechnungsdetail, Messsystemstatus, Störungsfall und Support. Sie schieben sich
von rechts über die Tab-Bar (bei aktiviertem „Bewegung reduzieren" nur
eingeblendet). Geöffnet werden sie über `@Environment(\.openOverlay)`, damit
kein Binding durch jede Zwischenebene gereicht werden muss.

### Bottom-Sheet & Toast

Der Bottom-Sheet erklärt Zahlen statt sie nur anzuzeigen und hat fünf
Varianten: `kpi` (alle 14 Kennzahlkacheln), `node` (die Knoten im
Energiefluss), `info` (Näherungswerte, Persönliche Daten, Wohnung, Zahlungsart,
Datenschutz), `document` (mit Öffnen/Herunterladen) und `building`. Inhalte
liegen gesammelt in `SheetContent`, geöffnet wird über
`@Environment(\.openSheet)`. Der Toast quittiert Demo-Aktionen über
`@Environment(\.showToast)` und blendet sich nach 2,6 s selbst aus; bei offenem
Sheet erscheint er oben statt unten, damit er nicht auf dessen Zeilen liegt.

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

**Weiterhin offen:** Die App-API ist ausschließlich bewohnerbezogen
(`PowerParticipant`). Die Vermieter- und Verwaltungsansichten haben **keinen**
Contract — Gebäudeaggregate, Wohneinheiten-Vergleich und Anlagenstatus sind
nicht abgedeckt und brauchen eine eigene Entscheidung.

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
