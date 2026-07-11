# POWERHOUSE 360 — Sicherheit, Rollen & Berechtigungen

> Status: 🔵 Analysiert / Entwurf v1 (2026-07-11). Umsetzung ab Phase 1; jede Phase liefert ihre Berechtigungen mit.

## 1. Grundsätze

1. **Serverseitig erzwungen.** Jede Berechtigungsprüfung passiert im Backend (API-Layer + Query-Guards). UI-Ausblendung ist reine Ergonomie, nie Sicherheitsmaßnahme.
2. **Mandantentrennung zuerst.** Vor jeder fachlichen Prüfung steht der Organization-Scope. Kein Query ohne Org-Kontext (zentraler Prisma-Client-Wrapper erzwingt das; Tabellen ohne `organizationId` sind explizit als global registriert).
3. **Deny by default.** Keine Route, kein Handler ohne explizite Permission-Deklaration.
4. **Least Privilege für Maschinen.** Hubs, Worker und Adapter haben eigene, eng geschnittene Credentials — nie Admin-Tokens.

## 2. Authentifizierung

| Festlegung | Begründung |
|---|---|
| **better-auth** (self-hosted, DB-Sessions in PostgreSQL) | Selbst gehostet (DSGVO/Hostinger-Vorgabe), Organizations-/Invitation-Support, kein Vendor-Lock (ADR-002) |
| E-Mail + Passwort mit Verifikation; Magic-Link für Bewohner-Onboarding | Bewohner haben geringe Passwort-Toleranz; Einladung → Magic-Link → optional Passwort |
| 2FA (TOTP) verpflichtend für Powerhouse-interne Rollen (admin, sales, service) | Zugriff auf alle Mandantendaten |
| Session: httpOnly-Cookie, `SameSite=Lax`, Rotation bei Privilegienwechsel | Standard-Härtung |
| Monteur-PWA: gleiche Auth + langlebige Refresh-Session mit Geräte-Bindung; Offline-Queue signiert Aktionen mit Session-Kontext | Baustellenbetrieb ohne ständiges Login |
| Hub-Authentifizierung: pro Hub ein individuelles Credential (mTLS oder signiertes Token), Enrollment über PWA-Provisionierung, Rotation möglich | Kompromittierter Hub darf nur sich selbst betreffen |

## 3. Rollenmodell

Rollen bündeln Permissions; Memberships verknüpfen User↔Organization mit Rolle(n); `AccessScope` schränkt optional auf Teilbäume ein (Property/Building/Project/Modul).

| Rolle | Organisation | Typischer Scope | Kernrechte (Auszug) |
|---|---|---|---|
| `platform_admin` | Powerhouse | global | alles, inkl. Konfiguration, Templates, Retry-Konsolen |
| `sales` | Powerhouse | global | CRM, Angebote, Verträge lesen/anstoßen |
| `operations` | Powerhouse | global/Projekt | Projekte, WorkOrders, Geräte, Onboarding steuern |
| `service` | Powerhouse | global | Tickets, Alarme, Austauschaufträge |
| `finance` | Powerhouse | global | Abrechnung, Lexoffice-Sync, Zahlungsstatus |
| `property_manager` | HV/WEG/Eigentümer-Org | eigene Properties | Portal: Objekte, Projekte, Dokumente, Bewohner einladen, Angebote annehmen |
| `owner_board` | WEG/Beirat | eigene Properties | lesen + Freigaben/Zustimmungen |
| `billing_contact` | Kunden-Org | eigene Properties | Rechnungen, SEPA-Dokumente |
| `installer_partner_admin` | Partner-Org | zugewiesene Projekte | Aufträge des Partners, Monteure verwalten |
| `installer` | Powerhouse/Partner | zugewiesene WorkOrders | PWA: Aufträge, Provisionierung, Protokolle |
| `resident` | — (Person) | eigene Unit | Bewohnerportal: eigene Verträge, Verbräuche, Meldungen, Ladevorgänge |
| `parking_user` | — (Person) | eigener Stellplatz/Ladepunkt | Chargemieter-Nutzung |

Permissions folgen dem Muster `<domain>.<action>` (`contract.read`, `contract.download_signed`, `device.provision`, `invoice.retry_sync`, `onboarding.approve_step`, …). Der Katalog lebt in `packages/permissions` und ist der einzige Ort, an dem Permissions definiert werden.

## 4. Besondere Schutzobjekte

| Objekt | Regel |
|---|---|
| Unterzeichnete Verträge (PDF) | Download nur mit `contract.download_signed` **und** Parteibezug bzw. internem Recht; jeder Download → `AuditEvent`; Auslieferung über signierte, kurzlebige URLs |
| SEPA-/Bankdaten | Nur in dafür vorgesehenen Feldern, verschlüsselt at rest (Spaltenverschlüsselung), maskierte Anzeige, nie in Logs/Events |
| Documenso-/Lexoffice-API-Keys, Hub-Secrets | Nur in Env/Secret-Store des Deployments (Coolify), nie in DB-Klartext, nie im Client-Bundle; getrennte Keys je Umgebung |
| Messwerte/Verbrauchsdaten | Bewohner sehen nur eigene Unit; HV sieht Aggregat + eigene Objekte; DSGVO-Zweckbindung dokumentiert |
| Webhook-Endpunkte | Signaturprüfung (Documenso-Secret), Idempotenz über `WebhookInbox`, Rate-Limit, keine Verarbeitung unsignierter Payloads |
| Personenbezogene Daten in Logs | Zentrale Redaction im Logger (E-Mail, IBAN, Namen in strukturierten Feldern); Log-Level-Policy pro Umgebung |

## 5. Audit-Logging

- `AuditEvent` (append-only): Akteur, Aktion, Subjekt, Vorher/Nachher (redigiert), `requestId`, `correlationId`, Zeitpunkt.
- Pflicht-auditiert: Auth-Ereignisse (Login, Einladung, Rollenwechsel), Vertragsstatusänderungen, Dokument-Downloads, Berechtigungsänderungen, manuelle Retries (Documenso/Lexoffice), Modulaktivierung/-suspendierung, Datenexporte, Löschvorgänge.
- Aufbewahrung: mind. Vertragslaufzeit + gesetzliche Fristen; Auswertung über Admin-UI (Phase 1: einfache Liste mit Filter).

## 6. Anwendungssicherheit (Definition-of-Done-relevant)

- Serverseitige Validierung aller Eingaben mit Zod (`packages/validation`); Client-Validierung nur UX.
- CSRF-Schutz über Framework-Mechanismen; keine state-ändernden GETs.
- Security-Header (CSP, HSTS, X-Content-Type-Options) in `next.config`/Middleware.
- Uploads: Typ-/Größenprüfung, Virus-Scan-Hook (Phase ≥ 4), Auslieferung nie aus dem App-Origin ohne Content-Disposition.
- Rate-Limiting auf Auth-, Funnel- und Webhook-Routen.
- Abhängigkeits-Scanning (`npm audit` im CI) + Renovate/Dependabot sobald CI existiert.
- Jede neue API-Route deklariert: benötigte Permission, Org-Scope-Quelle, Validierungsschema — sonst schlägt der Lint-Check fehl (Konvention wird in Phase 1 als ESLint-Regel/Codegen etabliert).

## 7. DSGVO-Eckpunkte

- Hosting & E-Mail vollständig auf eigener Hostinger-Infrastruktur in Deutschland (Bestand: powerhouse360.de auf VPS/Coolify).
- Verzeichnis von Verarbeitungstätigkeiten je Modul (HV-Daten, Bewohnerdaten, Messwerte, Ladevorgänge) — Pflichtdokument vor Go-Live von Phase 6.
- Betroffenenrechte: Export- und Löschprozesse pro Person (Bewohnerwechsel = Nutzerwechsel-Prozess in Heatmieter/Powermieter, nicht Datenlöschung der Abrechnungshistorie).
- AV-Verträge: Lexoffice (extern) — prüfen; Documenso self-hosted = kein externer Prozessor.
