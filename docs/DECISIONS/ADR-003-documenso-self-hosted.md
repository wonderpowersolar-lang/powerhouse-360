# ADR-003 — Documenso self-hosted als einzige Vertragsplattform

Status: angenommen per Vorgabe (2026-07-11) · Kontext: Masterprompt §10

## Entscheidung
Alle Vertrags- und Signaturprozesse laufen über einen **selbst gehosteten Documenso-Server** (Container auf der Hostinger-VPS via Coolify, `sign.powerhouse360.de`, getrennte Staging-/Prod-Konfiguration). Kein Documenso-Cloud, keine andere E-Signatur-Plattform ohne ausdrückliche Anordnung.

## Umsetzungsrahmen
- Zugriff ausschließlich über `packages/documenso-adapter` (einzige Stelle mit API-Wissen).
- Webhooks → `WebhookInbox` (Signaturprüfung, Idempotenz) → Worker; `signed` nur nach Verifikations-Read + PDF-Übernahme.
- Templates versioniert (`ContractTemplateVersion` ↔ `DocumensoTemplateReference` je Umgebung); Feldmapping konfigurierbar und vorab validierbar.
- Details: [DOCUMENSO_INTEGRATION.md](../DOCUMENSO_INTEGRATION.md)

## Konsequenzen
+ Datenhoheit/DSGVO (keine Vertragsdaten bei Dritt-SaaS), API-Kontrolle, Kostenkontrolle.
− Eigener Betriebsaufwand (Updates, SMTP-Zustellbarkeit, Backup der Documenso-DB) → R-05. QES-Anforderungen (qualifizierte Signatur) sind mit Documenso-Standard nicht abgedeckt — falls ein Vertragstyp QES erfordert, braucht es eine dokumentierte Ausnahme-Entscheidung (offen O-03 im Masterplan).
