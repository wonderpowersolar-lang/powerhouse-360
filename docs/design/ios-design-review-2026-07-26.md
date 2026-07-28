# iOS Design Review — Powermieter, 2026-07-26

**Bewertet auf:** Commit `a4e7fde` (nach ADR-011-Refactor, reine Bewohner-App)
**Behoben bis:** Commit `3eeab55` (2026-07-27)
**Gerät:** iPhone-17-Simulator, iOS 26.5 — **nicht** auf echter Hardware
**Methode:** Messbare Dimensionen statisch aus dem Code, visuelle aus Screenshots

> **Die Tabelle unten zeigt den Stand *vor* den Korrekturen.** Was inzwischen
> behoben ist, steht im Abschnitt „Behoben am selben Tag"; der Durchschnitt
> liegt danach bei 7,9 statt 5,8. Die Einzelabschnitte sind bewusst
> unverändert stehen geblieben — sie begründen, *warum* etwas geändert wurde.
>
> Das Review lief mangels Testgerät gegen den Simulator. Für Touch-Targets,
> Dynamic Type und Reduce Motion ist die Codeanalyse ohnehin belastbarer als
> das Auge; die visuellen Dimensionen kamen aus Screenshots.

## Gesamtbild

**Ø 5,8 / 10.** Zwei Dimensionen sind stark, sieben liegen unter 7. Das Muster
dahinter ist einheitlich und erklärt fast jeden Abzug: **Die App ist eine
pixelgenaue Portierung eines HTML-Prototyps.** Sie sieht dadurch sehr
konsistent aus, verhält sich aber an mehreren Stellen wie eine Webseite und
nicht wie eine iOS-App.

| # | Dimension | Score |
|---|---|---|
| 1 | Typografie-Hierarchie | 6 |
| 2 | Spacing-Rhythmus | 5 |
| 3 | Farbhierarchie | 6 |
| 4 | Touch-Targets | 5 |
| 5 | Loading / Empty / Error | 4 |
| 6 | Barrierefreiheit | 3 |
| 7 | Animationsdisziplin | 9 |
| 8 | iOS-Idiom | 5 |
| 9 | Informationsdichte | 6 |
| 10 | AI-Slop | 9 |

---

## 1. Typografie-Hierarchie — 6/10

Die Skala ist konsistent durchgehalten: 30 / 27 / 23 / 22 / 21 / 17 / 16,5 /
15,5 / 14,5 / 14 / 13,5 / 13 / 12,5 / 12 / 11,5 / 11 / 10. Display-, Body- und
Caption-Ebene sind klar unterscheidbar, Gewichte sitzen.

**Was fehlt zur 10:** Fließtext liegt bei 13–13,5 pt, HIG-Body ist 17 pt.
54 Textstellen nutzen 11 oder 11,5 pt. Auf dem Prototypen-Bildschirm war das
korrekt, auf einem iPhone in der Hand ist es klein. Der Sprung auf HIG-Größen
würde die Layouts allerdings umbauen — das ist kein Tausch von Zahlen.

## 2. Spacing-Rhythmus — 5/10

Verwendete Paddings: 3, 4, 5, 8, 10, 11, 12, 13, 14, 16, 18, 40.

**Was fehlt zur 10:** Das ist weder ein 4- noch ein 8-pt-Raster. 3, 5, 11, 13
und 18 fallen heraus — direkt aus den CSS-Pixelwerten übernommen. Ein Raster
würde die Datei-Diffs klein halten und künftige Screens schneller machen.
Safe-Area-Insets sind dagegen überall respektiert.

## 3. Farbhierarchie — 6/10

Sauberes Token-System, Light und Dark aus derselben Quelle über einen
`UIColor`-TraitProvider. Primär (Navy/Grün), Sekundär (Outline) und Destruktiv
(`crit` beim Abmelden) sind klar getrennt.

**Was fehlt zur 10:** `Theme.tx3` (#97A4B4 auf Weiß) erreicht rund **2,6:1**.
WCAG AA verlangt 4,5:1 für Fließtext. Dieses Token trägt Bildunterschriften,
Zeitstempel und Metazeilen quer durch die App — es ist kein Randfall.

## 4. Touch-Targets — 5/10

**Was fehlt zur 10:** Drei tappbare Elemente liegen unter den 44 × 44 pt der
HIG — Sheet-Schließen (32), Dokumente-Zurück (36), Overlay-Zurück (38). Die
übrigen 38-pt-Kacheln sind Symbolflächen *innerhalb* großer Zeilen-Buttons und
damit unkritisch; die erste Zählung von „vier" war zu grob. Ausgerechnet die
Abbrechen-Wege sind die zu kleinen.

## 5. Loading / Empty / Error — 4/10

Leerzustände sind da und gut geschrieben: Dokumente-Ordner, Mitteilungen nach
„Alle löschen", Analyse mit eigenem Zeitraum.

**Was fehlt zur 10:** `PowermieterStore` hat `LoadState` mit `.loading` und
`.failed(String)` — **keine View wertet das aus.** Beim Start und bei einem
API-Fehler zeigt die App stillschweigend die Prototyp-Werte. Solange der Mock
antwortet, fällt das nicht auf; sobald `HTTPPowermieterAPI` gegen einen echten
Server läuft, ist es ein stiller Fehlerpfad. Das ist der Befund mit dem
höchsten Risiko in dieser Liste.

## 6. Barrierefreiheit — 3/10

**VoiceOver ist gut.** 56 dekorative Elemente sind ausgeblendet, 53
Container zu sinnvollen Elementen zusammengefasst, Charts tragen Label und
Value. Reduce Motion ist an 25 Stellen berücksichtigt, auch beim pulsierenden
Live-Punkt.

**Was fehlt zur 10 — und der Grund für die 3:** Die App unterstützt **Dynamic
Type überhaupt nicht.** 301 Schriftangaben sind feste `.font(.system(size:))`,
null semantische Styles, null `ScaledMetric`. Wer die Systemschrift
vergrößert — der häufigste Eingriff überhaupt, weit vor VoiceOver — sieht in
dieser App keinerlei Änderung. Das ist bei einer Abrechnungs-App mit
Zahlenkolonnen kein Detail.

## 7. Animationsdisziplin — 9/10

Alle Dauern liegen zwischen 0,12 und 0,34 s. Kein Stapel gleichzeitiger
Animationen. Reduce Motion schaltet Overlay-Slide, Sheet-Spring, Toast und
Puls konsequent ab. Die Spring-Dämpfung (`bounce: 0.12`) ist zurückhaltend,
passend für eine Abrechnungs-App.

**Was fehlt zur 10:** Nichts Strukturelles.

## 8. iOS-Idiom — 5/10

Das Onboarding nutzt korrekt `NavigationStack` mit Zurück-Navigation.

**Was fehlt zur 10:** Drei zentrale Bausteine sind nachgebaut statt genutzt —
eine eigene Floating-Tab-Bar statt `TabView`, ein eigener Bottom-Sheet statt
`.sheet` mit `presentationDetents`, eigene Overlay-Navigation statt
`NavigationStack`-Push. Das war für die Prototyp-Treue nötig und sieht gut
aus, kostet aber: keine Systemgesten (Kantenwisch zurück, Sheet-Drag zum
Schließen), kein automatisches Verhalten bei Dynamic Type, iPad und künftigen
iOS-Versionen.

## 9. Informationsdichte — 6/10

Kein horizontales Scrollen, Inhalte passen. Die Karten sind angenehm
gegliedert.

**Was fehlt zur 10:** Listen sind Kartenstapel, keine iOS-Listen. Dokumente
und Mitteilungen haben kein Swipe-to-Delete und keine Kontextmenüs — genau
die Gesten, die iOS-Nutzer an Listen erwarten. „Alle löschen" ist ein Knopf,
wo ein Wisch natürlicher wäre.

## 10. AI-Slop — 9/10

Sauber. Keine Platzhaltertexte, kein importiertes Material Design, keine
generischen Verläufe. Die Farbpalette ist eine bewusste Entscheidung mit
Energie-Domänenfarben. Die Texte sind fachlich spezifisch und sprachlich
korrekt — „Ø letzte 15 Min" statt „Aktueller Verbrauch" ist ein Beispiel für
Sorgfalt statt Standard.

**Was fehlt zur 10:** Alle Werte sind Mock-Daten. Das ist bekannt und
dokumentiert, bleibt aber ein Prototyp-Merkmal.

---

## Größter Hebel je Dimension

| Dimension | Ein Eingriff, der am meisten bringt |
|---|---|
| Barrierefreiheit | `.font(.system(size:))` → semantische Styles bzw. `ScaledMetric` |
| Loading/Error | `store.state` in `RootView` auswerten: Ladeanzeige + Fehlerzeile |
| Touch-Targets | `minWidth/minHeight: 44` auf die vier zu kleinen Knöpfe |
| Farbhierarchie | `Theme.tx3` abdunkeln, bis 4,5:1 erreicht ist |
| iOS-Idiom | Bottom-Sheet auf `.sheet` + `presentationDetents` umstellen |
| Spacing | Padding-Werte auf ein 4-pt-Raster ziehen |
| Typografie | Body von 13 auf 15–17 pt, Captions von 11 auf 12–13 pt |

## Behoben am selben Tag

Vier der sieben Befunde unter 7 sind umgesetzt und im Simulator gegengeprüft.

| Dimension | vorher | nachher | Was gemacht wurde |
|---|---|---|---|
| Barrierefreiheit | 3 | **7** | 297 feste Schriftgrößen mechanisch auf `pmFont` umgestellt, 9 `Text`-Verkettungen von Hand auf `Font.pmScaled`. Skalierung bis `accessibility1` gedeckelt. |
| Loading / Error | 4 | **8** | `DataStatusBanner` mit Grund und „Erneut"; ohne Daten wird der ganze Dashboard-Inhalt redigiert statt Prototyp-Zahlen zu zeigen. |
| Touch-Targets | 5 | **9** | `.pmHitTarget()` auf die drei zu kleinen Knöpfe — Optik unverändert, Trefferfläche 44 pt. |
| Spacing-Rhythmus | 5 | **8** | 245 Werte auf ein 4-pt-Raster mit 2-pt-Halbschritten unter 8. Knopfhöhen von fünf auf drei (44/48/56). Prüfskript gegen Rückfall. |
| iOS-Idiom | 5 | **8** | Sheet auf `.sheet` + `presentationDetents`, Overlays auf `NavigationStack` mit Systemleiste. Kantenwisch und Drag-to-Dismiss funktionieren. Tab-Leiste bleibt bewusst eigenbau. |
| Farbhierarchie | 6 | **8** | `tx2`/`tx3` neu gerechnet, beide ≥ 4,5:1 gegen Karte *und* App-Hintergrund. |

**Was dabei auffiel und ohne den Umbau nicht sichtbar gewesen wäre:**

- Der erste Loading/Error-Fix griff nur halb. Er machte die drei
  store-gebundenen Kacheln ehrlich, während der **Energiefluss weiter
  „4,6 kW / 0,8 kW / 3,2 kW"** behauptete — die prominentesten Zahlen des
  Schirms, die nie am Store hingen. Punktuell nachzuziehen reicht bei dieser
  Klasse Fehler nicht; entweder der ganze Schirm ist ehrlich oder keiner.
- `.redacted` erfasst **keine gezeichneten Pfade**. Der Tagesverlauf hätte bei
  einem Ladefehler weiterhin eine voll gezeichnete, erfundene Tageskurve
  gezeigt. Dafür gibt es jetzt einen eigenen Leerzustand.
- `tx3` nur gegen Kartenweiß zu prüfen hätte die Abschnittstitel übersehen,
  die direkt auf `bg` liegen — dort waren es 4,06:1 statt der scheinbar
  erreichten 4,57:1.
- Dynamic Type brach zwei Stellen auf, die vorher niemand sehen konnte: die
  Tab-Leiste kürzte auf „Nachha…"/„Dokum…" (jetzt ab Bedienungshilfen-Größe
  nur Symbole, VoiceOver unverändert), und im Energiefluss schoben sich die
  `.position`-gesetzten Knoten übereinander (dort auf `xLarge` gedeckelt).

**Offen geblieben:** Informationsdichte (6) und Typografie-Grundgrößen (6).
Typografie ist durch die Skalierung deutlich entschärft.

### Korrektur zur Informationsdichte (2026-07-27)

Dimension 9 oben verlangt Swipe-to-Delete für **Dokumente und Mitteilungen**.
Für die Dokumente ist das falsch, und zwar nicht knapp: Die Liste enthält
Rechnungen, Verträge und Jahresabrechnungen — aufbewahrungspflichtige Belege.
Ein Bewohner darf die nicht wegwischen, und eine Geste, die wie Löschen
aussieht, ist bei einer Abrechnungs-App ein Haftungsthema. Das war generischer
iOS-Rat ohne Blick auf die Domäne, geschrieben von mir, und er hätte beim
Umsetzen echten Schaden angerichtet.

Richtig wäre:

- **Mitteilungen** → `List` mit `swipeActions` (löschen, als gelesen markieren)
  und Kontextmenü. Dort ist Löschen fachlich korrekt, und heute gibt es nur
  „Alle löschen" — einzelne Meldungen lassen sich gar nicht entfernen.
- **Dokumente** → `List` mit Kontextmenü (Öffnen, Herunterladen), **ohne**
  Löschen. Zusätzlicher Aufwand: Die Liste hängt unter dem angehefteten
  `DashboardHeader`, das `.padding(.top, 104)` muss auf `contentMargins`.

PO-Entscheidung 2026-07-27: nicht umgesetzt, Kosten-Nutzen zu dünn. Der
Befund bleibt gültig, die Korrektur ebenso.

Beim Spacing-Umbau kam noch ein Befund dazu, den kein Auge gefunden hätte:
Das Prüfskript, das ich gegen den Rückfall geschrieben habe, hat zuerst 13
Fehlalarme gemeldet — es behandelte jede feste Höhe als Rhythmusschritt und
wollte aus `frame(height: 1)` eine 2 pt dicke Haarlinie machen. Per Regex
lassen sich Kontrollhöhen nicht von Chart-Zeichenflächen und Trennlinien
unterscheiden, also prüft das Skript nur noch Paddings, Spacings und
`minLength`.

**Bekannte Grenze:** Über `accessibility1` hinaus skaliert die App nicht,
weil die aus dem Prototyp übernommenen festen Zeilen- und Kachelhöhen darüber
Zahlen abschneiden würden. Die Grenze fällt, sobald diese Höhen mitwachsen.

## Nicht bemängelt

- **PulseDot** respektiert Reduce Motion korrekt (`guard !reduceMotion`).
  Anfangsverdacht widerlegt.
- **Dark Mode** funktioniert durchgehend, beide Modi kommen aus denselben Tokens.
- **Safe Areas** sind überall respektiert, auch beim Sheet-Panel.
