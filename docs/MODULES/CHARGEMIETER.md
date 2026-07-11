# Modul: Chargemieter (Ladeinfrastruktur)

> Status: ⚪ Software nicht vorhanden. Marketing: `/chargemieter`-Scroll-Kino (12 Szenen) + Domain chargemieter.de produktiv. Umsetzung: Phase 9.

## 1. Fachlicher Kern

Ladeinfrastruktur in Mehrfamilienhäusern/Tiefgaragen: Planung, Lastmanagement, Stellplatz-/Nutzerzuordnung, Ladeberechtigungen, Ladevorgangs-Erfassung, Tarife, Förderberatung, Abrechnung.

## 2. Modell-Ergänzungen

| Entität | Inhalt |
|---|---|
| `ChargingProject` | Modulinstanz je Property; Bezug `ParkingArea`, `GridConnection` |
| `LoadManagementPlan` | Anschlussleistung, statisch/dynamisch, Prioritäten — versioniert |
| `ChargePoint` | Ladepunkt ↔ `Device`(Wallbox, OCPP-ID) ↔ `ParkingSpace` |
| `ChargingAuthorization` | Berechtigung (RFID/App) je Nutzer ↔ ChargePoint/Gruppe |
| `ChargeTariff` (+Version) | Ladetarife (Arbeitspreis, ggf. Grundpreis) — nie hart codiert |
| `ChargingSession` | Ladevorgang: Start/Ende, kWh, Zählerstände, Autorisierung, Status |
| `FundingCase` | Förderberatung/-antrag (Programm, Status, Fristen, Dokumente) |

## 3. Projekt-Onboarding (Template)

Organisation onboarden → Tiefgarage + Stellplätze erfassen → technische Leistung prüfen → Lastmanagement planen → Förderfähigkeit prüfen → Angebot annehmen → Vertrag (Documenso) → Installationsauftrag → Ladepunkte provisionieren (PWA) → **[Gate]** → Nutzer einladen → Stellplatz zuordnen → Nutzungsvertrag (Documenso) → Zahlungsmethode/SEPA → **Test-Ladevorgang** (requirement-Schritt: erfolgreiche `ChargingSession`) → Modul aktivieren.

## 4. Technik-Anbindung

- **OCPP über Adapter** — Fachlogik kennt nur `ChargePoint`/`ChargingSession`. Offene Architekturentscheidung (ADR in Phase 9): OCPP-Endpunkt hub-lokal vs. zentrales CSMS vs. Hersteller-Cloud-API (R-13).
- Lastmanagement Phase 9: statische Konfiguration (Dokumentation + Wallbox-Konfig); dynamische Regelung später.
- Abrechnungszähler als `Device` mit Readings (Differenzmessung zur Plausibilisierung der Sessions).

## 5. Verträge (Documenso)

Ladeinfrastrukturvertrag (Projektebene, HV/Eigentümer), Wallbox-Nutzungsvertrag (je Nutzer/Stellplatz), SEPA.

## 6. Abrechnung

`ChargingSession` → periodische Aggregation → `Charge` je Nutzer → Lexoffice (Phase 10). Bis dahin: exportierbarer Abrechnungsdatensatz (F-16 endet bewusst dort).

## 7. Offene fachliche Entscheidungen

- O-C1: OCPP-Topologie (siehe oben, ADR Phase 9)
- O-C2: Eichrechtskonforme Abrechnung (ME-konforme Wallboxen, Transparenzsoftware) — Anforderungen je Zielkunde klären
- O-C3: Förderprogramme-Katalog: gepflegte Stammdaten vs. Beratungs-Freitext

## 8. Definition of Done (E2E F-16)

Lead → Förderberatung → Angebot → Vertrag → Planung → Installation → Nutzer-Einladung → Nutzungsvertrag → Test-Ladevorgang → Abrechnungsdatensatz — auf Staging mit mindestens einer real angebundenen oder simulierten OCPP-Wallbox (Simulator zulässig, dokumentiert).
