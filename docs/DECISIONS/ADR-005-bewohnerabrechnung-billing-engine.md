# ADR-005 — Bewohnerabrechnung: interne Billing-Engine; Lexoffice als B2B-Belegweg

Status: **angenommen** (Vorgabe Masterprompt V2, 2026-07-12) · Umsetzung: Phase 8 (Engine) / Phase 4 (Lexoffice) — Neuschnitt 2026-08-05 ([ADR-012](ADR-012-bauabfolge-commercial-first.md)); vormals Phase 6/7

## Entscheidung
- Die **Tarif- und Verbrauchsberechnung** (inkl. dynamischer Sonnenstrompreis, Energiezuordnung, Abrechnungsvorbereitung) ist eine **interne Billing-Engine** von Powerhouse 360 (`billing`-Kontext + Powermieter-Fachlogik). Tarife sind versionierte Daten (`Tariff`/`TariffVersion`), niemals Code.
- **Lexoffice ist Belegweg für B2B-Rechnungen** (Hausverwaltungen, WEGs, Eigentümer, Gewerbe, Installationsleistungen) — pro ausstellender Gesellschaft ein eigenes Konto (Zwei-Konten-Routing über `IssuingEntity`, siehe Masterplan Kap. 4).
- Ob **Bewohner-Einzelrechnungen** über Lexoffice oder einen internen Belegpfad laufen, entscheidet **ADR-008** (Entwurf, vor Phase 8 — Neuschnitt 2026-08-05).

## Konsequenzen
+ Abrechnungslogik bleibt im führenden System (Eichrecht-/§40-EnWG-Pflichtangaben kontrollierbar); Lexoffice bleibt reiner Belegkanal.
− Eigene Engine = eigener Prüf-/Testaufwand (Billing-Readiness als hartes Gate, siehe Masterplan Kap. 6).
