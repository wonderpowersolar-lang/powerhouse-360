# ADR-003 — Dokumentenerzeugung vs. Signatur: eigene PDF-Pipeline, Documenso als reiner Signatur-Layer

Status: **angenommen** (Vorgabe Masterprompt V2, 2026-07-12) · ersetzt alt-ADR-003 (2026-07-11) · Umsetzung: Phase 3

## Entscheidung
1. **Vertragsdokumente werden vollständig im Powerhouse-System erzeugt** — über die **extern bereits existierende HTML/CSS/WeasyPrint-Pipeline** (PO-Bestätigung 2026-07-12). Sie wird in Phase 3 als Dienst/Package integriert; Vertragsinhalte, Tarife und Positionsdaten leben in versionierten `ContractTemplate`s im eigenen System — **niemals in Documenso-Templates**.
2. **Documenso ist ausschließlich Signatur-Layer**: Es erhält fertige PDFs plus Signaturfeld-Definitionen (nur Signatur-, Datums- und Identitätsfelder) und Empfänger mit Signaturreihenfolge.
3. Aus alt-ADR-003 bleibt verbindlich: **selbst gehosteter Documenso-Server** (`sign.powerhouse360.de`, Coolify/Hostinger, getrennte Dev-/Staging-/Prod-Konfiguration), Zugriff nur über `packages/documenso-adapter`, idempotente Webhook-Verarbeitung über `WebhookInbox`, `signed` erst nach Verifikations-Read + PDF-Übernahme (Hash). Kein Documenso-Cloud, keine andere E-Signatur-Plattform ohne ausdrückliche Anordnung.
4. Jeder `ContractType` trägt ein **Signaturniveau** (TEXTFORM / SES / QES / WET_SIGNATURE); QES-/Schriftform-Verträge werden **nicht** als digital signierbar angeboten.

## Offener Punkt
Übergabe der externen WeasyPrint-Pipeline (Repo/Code/Zugang) durch den PO — Risiko R-17, blockiert Phase 3-Start nicht (Adapter-Schnittstelle wird dagegen entworfen).

## Konsequenzen
+ Vertragslogik/Tarife bleiben im führenden System; Documenso-Upgrades können keine Vertragsinhalte brechen; Datenhoheit + DSGVO sauber.
− Eigener Betrieb von Pipeline + Documenso (Backup, Monitoring, Updates — Betriebskonzept ist Phase-3-Aktivierungsvoraussetzung, siehe NFR-Kapitel).
