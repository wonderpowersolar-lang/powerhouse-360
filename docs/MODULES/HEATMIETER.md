# Modul: Heatmieter (Wärme / Heizkosten)

> Status: ⚪ Software nicht vorhanden. Marketing: `/heatmieter`-Scroll-Kino produktionsreif. Umsetzung: Phase 8.

## 1. Fachlicher Kern

Digitale Erfassungs- und Abrechnungs-Ebene für Wärme/Wasser: funkablesbare Wärmemengenzähler, Heizkostenverteiler und Wasserzähler; Fernablesung, Messwertvalidierung, Nutzerwechsel, unterjährige Verbrauchsinformation (EED/HeizkostenV), Abrechnungsvorbereitung.

## 2. Modell-Ergänzungen

| Entität | Inhalt |
|---|---|
| `HeatProject` | Modulinstanz je Property |
| Gerätezuordnungen | über Kern-Registry (`Device` mit Typen WMZ/HKV/Wasserzähler, `DeviceInstallation`, Wechselprozesse `device.replaced`) |
| `ReadingSchedule` | Ableseplan (Stichtag, unterjährig, Zwischenablesung) |
| `ConsumptionInfo` | monatliche Verbrauchsinformation je Unit (EED-Pflicht) — generiert, versioniert, zustellbar (Portal) |
| `OccupancyChange` | Nutzerwechsel: Zwischenablesung, Zeitraumsplit, alte/neue Partei |
| `HeatBillingPeriod` | Abrechnungsperiode je Property |
| `CostPosition` | Kostenpositionen (Brennstoff, Betriebsstrom, Wartung, Miete Geräte…) |
| `AllocationKey` | Verteilerschlüssel (Grundkosten-/Verbrauchskostenanteil, m², Einheiten) |
| `HeatStatement` | finalisierter Abrechnungsstand je Unit (Snapshot der verwendeten Readings + Schlüssel) |

**Verbindliche Werttrennung** (Kernmodell `DeviceReading.quality`): Rohmesswerte → validierte Werte → Ersatzwerte → Schätzwerte → korrigierte Werte → fachliche Abrechnungswerte → finalisierte Stände. Finalisierte Stände sind unveränderlich; Korrekturen erzeugen Korrektur-Statements.

## 3. Prozesse

- **Geräteeinbau/-ausbau/-wechsel:** über WorkOrder + PWA (Phase 5-Fundament); Wechsel übernimmt Endstand alt/Anfangsstand neu.
- **Fernablesung:** Hub-Ingest (wMBus/LoRa) → Readings; Ablese-Lückenerkennung erzeugt Aufgaben.
- **Validierung:** Plausibilitätsregeln (Monotonie, Sprünge, Rückläufe); Ersatzwertbildung nach dokumentiertem Verfahren (VDI 2077-orientiert — fachliche Festlegung O-H1).
- **Nutzerwechsel:** `OccupancyChange` mit Zwischenablesung oder Gradtagszahlen-Split (O-H2).
- **Verbrauchsinformation:** monatlich automatisch, im Bewohnerportal einsehbar.
- **Abrechnungsvorbereitung:** Periode schließen → Kosten + Schlüssel + validierte Werte → `HeatStatement` je Unit → `Charge`/Export.

## 4. Verträge (Documenso)

Betreiber-/Servicevertrag mit HV/Eigentümer (Projektebene); ggf. Zustimmungen der Bewohner (Funkablesung/Datenverarbeitung) als Consent-Schritte im Onboarding.

## 5. Offene fachliche Entscheidungen

- O-H1: Ersatzwertverfahren + Eichrecht-Anforderungen an Gerätekatalog (Eichfristen im `DeviceModel`)
- O-H2: Nutzerwechsel-Splitverfahren ohne Zwischenablesung
- O-H3: Erstellt Powerhouse die Heizkostenabrechnung selbst oder liefert es die Vorbereitung an HV/Abrechnungsdienst? (bestimmt Tiefe von `HeatStatement`)

## 6. Definition of Done (E2E F-14/F-15)

Projekt → Vertrag (Documenso) → Geräteimport → Installation → Messwert → Validierung → Nutzerwechsel → Abrechnungsdatensatz — auf Staging durchlaufen inkl. Ersatzwert-Fall und unveränderlichem Finalisierungs-Snapshot.
