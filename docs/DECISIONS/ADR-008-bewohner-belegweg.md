# ADR-008 — Bewohner-Belegweg: Lexoffice vs. interner Belegpfad

Status: **ENTWURF — Entscheidung vor Phase 6 (Billing-Engine-Bau)** (2026-07-12)

## Frage
Werden **Bewohner-Einzelrechnungen** (Powermieter-Stromrechnungen, später Lade-/Serviceabrechnungen) über Lexoffice ausgestellt oder über einen internen Belegpfad (eigene Rechnungsnummernkreise je `IssuingEntity`, PDF über die eigene Pipeline aus ADR-003, revisionssichere Ablage)?

## Fakten (Stand 2026-07-12)
- Beide Gesellschaften (Wonderpower GmbH, AKL Powerhouse 360 GmbH) haben **eigene Lexoffice-Konten** (PO-Bestätigung).
- Pilotvolumen: 21 Messstellen ≈ ≤ 21 Bewohnerrechnungen/Periode; Zielbild: n Objekte × Einheiten × 12/Jahr.
- B2B-Belegweg über Lexoffice ist gesetzt (ADR-005).

## Entscheidungskriterien (in Phase 0/1 zu erheben, Verantwortlich: PO + Umsetzung)
1. **Lexoffice-API-Limits** (Requests/Tag, Kontaktanzahl) vs. erwartetes Bewohnervolumen.
2. **Kosten pro Kontakt/Beleg** im Lexoffice-Tarif bei n×100 Bewohnern.
3. **E-Rechnungsfähigkeit** (XRechnung/ZUGFeRD) für B2C-Strombelege + §40-EnWG-Pflichtangaben-Layout (Lexoffice-Vorlagen ausreichend?).
4. Steuer-/GoBD-Anforderungen an internen Nummernkreis + Archivierung (falls interner Pfad).
5. Mahnwesen/Zahlungsabgleich (SEPA-Einzug) — wo läuft er natürlicher?

## Tendenz (unverbindlich, im Entwurf)
Pilot: Bewohnerbelege **über Lexoffice (AKL-Konto)** — geringstes Umsetzungsrisiko, GoBD erledigt; parallele Bewertung der Kriterien 1–3. Interner Belegpfad wird erst gebaut, wenn Volumen/Kosten es erzwingen (dann eigenes Arbeitspaket in Phase 7+).

## Konsequenz der Offenheit
Die Billing-Engine (Phase 6) erzeugt in jedem Fall `InvoiceRequest`-Objekte mit `IssuingEntity`; der Belegweg ist dahinter austauschbar (Adapter-Grenze) — die Entscheidung blockiert den Engine-Bau nicht.
