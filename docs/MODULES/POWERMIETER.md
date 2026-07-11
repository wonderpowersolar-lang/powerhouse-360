# Modul: Powermieter (Mieterstrom)

> Status: ⚪ Software nicht vorhanden. Marketing: nur Station auf der Startseite, **keine eigene `/powermieter`-Route** (Backlog Website). Umsetzung: Phase 6 (erstes vollständiges Fachmodul).

## 1. Fachlicher Kern

Mieterstromprojekte auf Mehrfamilienhäusern: PV-Erzeugung (+ optional Speicher) wird Bewohnern als Stromprodukt angeboten; Reststrom/Überschuss über Netz. Das Modul verwaltet Projekt, Messkonzept, Teilnehmer, Tarife, Verträge und bereitet die Abrechnung vor.

## 2. Modell-Ergänzungen (nur dieses Modul, referenziert Kernmodell)

| Entität | Inhalt |
|---|---|
| `PowerProject` | Mieterstromprojekt je Property; Bezug auf `GridConnection`(s) |
| `PvSystem` / `StorageSystem` | Anlagenstammdaten (kWp, kWh, Inbetriebnahme, MaStR-Nr.) |
| `MeteringConcept` (+Version) | Messkonzept: Zählpunkte, Summenzähler/Untermessung, Rollen der Zähler (Erzeugung, Einheit, Netz) — versioniert |
| `MeteringPoint` | Zählpunkt ↔ `Device`(Zähler) ↔ Unit/Anlage; MeLo/MaLo |
| `PowerTariff` (+Version) | Tarifversionen inkl. dynamischer Sonnenstrompreis-Parameter; niemals hart codiert |
| `PowerParticipant` | Teilnehmer (Bewohner/Unit) mit Status: interessiert → eingeladen → Daten erfasst → SEPA → Vertrag signiert → Zählerwechsel → aktiv → gekündigt |
| `MeterChange` | Zählerwechsel-Vorgang (alt/neu, Stände, Datum) |
| `BillingReadiness` | Prüfprotokoll: alle Pflichtbedingungen für Abrechnungsstart |
| `EnergyAllocation` | Zuordnungslauf Erzeugung/Verbrauch je Periode (Grundlage Abrechnungsvorbereitung) |

## 3. Projekt-Onboarding (Template, via Onboarding-Engine)

Organisation onboarden → Gebäude + Hausanschlüsse erfassen → PV-/Speicheranlagen erfassen → Messkonzept hinterlegen → Einheiten importieren → Tarifversion festlegen → Vertragsvorlage wählen → Documenso-Feldmapping validieren → Kommunikationsmaterial freigeben → **[Gate: Projekt-Onboarding abgeschlossen]** → Teilnehmer einladen → Teilnehmerdaten erfassen → SEPA abschließen → Stromvertrag über Documenso unterzeichnen → technischen Wechsel verfolgen → Billing Readiness prüfen → Modul aktivieren.

Teilnehmer-Onboarding ist ein eigenes Template je Bewohner (Instanz pro `PowerParticipant`).

## 4. Verträge (Documenso)

- Stromliefervertrag/Mieterstromvertrag je Teilnehmer (Startvorlage: `Stromliefervertrag_POWERHOUSE360_final.pdf`)
- SEPA-Mandat (eigenes Dokument oder Vertragsbestandteil — Entscheidung bei Template-Bau)
- HV-/Eigentümer-Vereinbarung auf Projektebene
- Ein Teilnehmer wird erst `aktiv`, wenn Vertrag `signed` + SEPA vorhanden + Zähler/Messkonzept-Zuordnung bestätigt.

## 5. Betrieb & Abrechnungsvorbereitung

- Verbrauchs-/Erzeugungsdaten über Device-Plattform (`DeviceReading`), Qualitätskette raw→validated.
- `EnergyAllocation` je `BillingPeriod`: PV-Direktverbrauch vs. Netzbezug je Teilnehmer gemäß Messkonzept.
- Ergebnis sind `Charge`-Objekte → [LEXOFFICE_INTEGRATION.md](../LEXOFFICE_INTEGRATION.md) (Phase 10) bzw. exportierbare Abrechnungsvorbereitung vorher.
- Betriebsdashboard: Teilnehmerquote, Zählerstatus, offene Onboardings, Erzeugung/Verbrauch.

## 6. Offene fachliche Entscheidungen (vor Phase 6 klären — R-04)

- O-P1: Rollenmodell Messstellenbetrieb (wer ist MSB? SMGW-Pflicht? TRuDi-Relevanz — Handbuch liegt vor)
- O-P2: dynamischer Sonnenstrompreis — genaue Preisformel & Nachweispflichten
- O-P3: Lieferantenpflichten (EnWG-Meldungen, Stromkennzeichnung) — was bildet die Plattform ab vs. externer Dienstleister
- O-P4: SEPA-Mandat als Documenso-Dokument vs. Portal-Checkbox mit Bankverbindung (rechtliche Prüfung)

## 7. Definition of Done (E2E F-11/F-12)

Lead → Angebot → Annahme → Vertrag (Documenso) → Projekt → HV-Onboarding → Bewohner-Einladung → SEPA → Stromvertrag (Documenso) → technische Freigabe → Modul aktiv — vollständig auf Staging durchlaufen, mit echten Documenso-Signaturen und ohne manuelle DB-Eingriffe.
