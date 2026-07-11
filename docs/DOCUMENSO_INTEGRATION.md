# POWERHOUSE 360 — Documenso-Integration

> Status: 🔵 Entwurf v1 (2026-07-11). Umsetzung Phase 3. Verbindlich: **selbst gehosteter Documenso-Server** für ALLE Vertrags- und Signaturprozesse — kein Documenso-Cloud, keine andere E-Signatur-Plattform (ohne ausdrückliche Anordnung).

## 1. Betrieb

| Punkt | Festlegung |
|---|---|
| Hosting | Eigener Documenso-Container via Coolify auf der Hostinger-VPS, `sign.powerhouse360.de`; eigene Postgres-DB/-Schema, eigener SMTP (Hostinger) |
| Umgebungen | dev (lokal/docker-compose), staging (`sign-staging.…`), prod — getrennte Instanzen ODER getrennte Teams/Spaces, getrennte API-Keys & Webhook-Secrets. Konfigurierbare `DOCUMENSO_BASE_URL`, `DOCUMENSO_API_TOKEN`, `DOCUMENSO_WEBHOOK_SECRET` je Umgebung |
| Aufbewahrung | Finale PDFs werden zusätzlich in den Powerhouse-Objektspeicher übernommen (`Document` mit SHA-256-Hash); Documenso bleibt führend für Signaturnachweise/Audit-Trail |
| Backup | Documenso-DB in den täglichen VPS-Backup-Plan aufnehmen |

## 2. Adapter (`packages/documenso-adapter`)

Der Adapter ist die **einzige** Stelle, die Documenso-APIs kennt. Fachlogik (`contracts`-Kontext) arbeitet nur mit internen Objekten.

Funktionen:
- `createDocumentFromTemplate(templateRef, fieldValues, recipients, signingOrder)` → `DocumensoDocumentReference`
- `sendForSignature(documentRef)` / `resend(recipientRef)`
- `getDocumentStatus(documentRef)` (Poll-Fallback zum Webhook)
- `downloadSignedPdf(documentRef)` → Bytes + Prüfung auf Vollständigkeit
- `verifyWebhookSignature(rawBody, signatureHeader)` — Pflicht vor jeder Verarbeitung
- Fehlerklassen: `DocumensoUnavailable` (Retry), `DocumensoRejected` (kein Retry, Ticket), `MappingError` (Konfigurationsfehler, blockiert Versand)

## 3. Vorlagen, Versionierung, Feldmapping

- Jeder `ContractType` hat ≥ 1 `ContractTemplate`; jede Template-Änderung erzeugt eine neue `ContractTemplateVersion` mit eigener `DocumensoTemplateReference` (Documenso-Template-ID + Umgebung).
- `ContractFieldMapping` beschreibt deklarativ: Powerhouse-Datenpfad (z. B. `customer.legalName`, `unit.unitNumber`, `tariffVersion.pricePerKwh`) → Documenso-Feld-ID. Mapping ist **konfigurierbar (DB, Admin-UI)** und **testbar**: eine Validierungsfunktion prüft gegen Testdaten, ob alle Pflichtfelder befüllbar sind, bevor eine Template-Version aktiv geschaltet werden kann.
- **Vertragsvorlagen niemals in Frontend-Komponenten**; das Portal rendert nur Status und Signatur-Links.
- Unterzeichnete Vertragsversionen sind unveränderbar referenziert (Template-Version + Feldwerte-Snapshot + finaler PDF-Hash).
- Startbestand: `Stromliefervertrag_POWERHOUSE360_final.pdf` (liegt im Projektordner) wird als erstes Documenso-Template angelegt (Powermieter, Phase 6); vorher Phase-3-Testvertrag mit Dummy-Template.

## 4. Verbindlicher Vertragsablauf

```
Contract im Powerhouse-System erzeugen (contracts-Kontext)
→ passende ContractTemplateVersion bestimmen (aktive Version je ContractType/Modul)
→ Vertragsdaten validieren (Zod + Mapping-Vollständigkeitsprüfung)
→ Felder mappen, Empfänger + Signaturrollen + Reihenfolge definieren (ContractParticipant)
→ Adapter: Dokument erzeugen & versenden  → contract.sent_to_documenso
→ Documenso führt Signaturprozess (mehrstufige Reihenfolge unterstützt)
→ Webhooks aktualisieren Status            → contract.signature_started / partially_signed
→ finaler Webhook „completed"              → Adapter lädt finales PDF, Hash, Document-Objekt
→ Contract.status = signed                 → contract.signed
→ Onboarding-Trigger schließt zugehörigen Schritt ab
```

Abbruchpfade: `declined`/`voided`/`expired` → `contract.failed` → Onboarding-Schritt bleibt offen, Ticket/Task für Vertrieb, manueller Neustart erzeugt **neuen** `ContractSignatureRequest` (Historie bleibt).

## 5. Webhook-Verarbeitung (idempotent & misstrauisch)

1. `POST /api/webhooks/documenso` → Signaturprüfung → Rohpayload in `WebhookInbox` (Idempotenzschlüssel: Documenso-Event-ID; Duplikat = no-op).
2. Worker verarbeitet Inbox-Einträge: Status wird **nicht** blind übernommen — bei `completed` verifiziert der Adapter per API-Statusabfrage + PDF-Download, bevor `signed` gesetzt wird. Fehlerhafte/unerwartete Webhooks erzeugen keinen falschen Vertragsstatus, sondern einen Prüf-Task.
3. Out-of-Order-Webhooks: Statusmaschine akzeptiert nur legale Übergänge (`pending → partially_signed → signed`; `signed` ist terminal außer `voided` mit manueller Freigabe).
4. Jede Statusänderung → `ContractAuditEvent` (Quelle: webhook/manual/system) + Domain-Event.
5. Poll-Fallback: Worker gleicht offene `ContractSignatureRequest`s ≥ 24 h ohne Webhook aktiv per Statusabfrage ab.

## 6. Sicherheit

- Download unterzeichneter Dokumente nur mit `contract.download_signed` + Parteibezug; kurzlebige signierte URLs; jeder Download auditiert.
- Vertragsdaten (Namen, Adressen, Preise, IBAN) erscheinen **nie** in Logs — Logger-Redaction; Webhook-Rohpayloads werden nach erfolgreicher Verarbeitung feldredigiert aufbewahrt.
- API-Token mit minimalen Rechten; Rotation dokumentiert; getrennte Tokens je Umgebung.

## 7. Vertragsarten (Startkatalog)

Kundenverträge, Modulverträge, Stromlieferverträge, Mieterstromverträge, Ladeinfrastrukturverträge, Wallbox-Nutzungsverträge, Serviceverträge, Wartungsverträge, Auftragsbestätigungen, Vollmachten, SEPA-bezogene Dokumente, Einwilligungen/Zustimmungen, HV-Vereinbarungen, Eigentümerverträge, Bewohner-/Teilnehmerverträge — als `ContractType`-Stammdaten in Phase 3 angelegt; Templates folgen je Modul-Phase.

## 8. Definition of Done (Phase 3)

End-to-End auf Staging nachgewiesen: Vertragsdaten → Template bestimmen → Documenso-Dokument erzeugen → 2 Empfänger in Reihenfolge signieren → Webhooks empfangen & idempotent verarbeitet (inkl. Duplikat-Replay-Test) → finales PDF übernommen + Hash → Status `signed` → Onboarding-Schritt automatisch abgeschlossen → alles im Audit-Log. Zusätzlich: Fehlerpfad (declined) und manueller Retry getestet.
