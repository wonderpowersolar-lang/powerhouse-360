# POWERHOUSE 360 — Ausführungs-Roadmap (Step-by-Step)

> Operatives Arbeitsdokument zum [Masterplan](POWERHOUSE_360_MASTER_PLAN.md) (§10). Der Masterplan sagt **was & warum**, diese Roadmap sagt **tu dies, dann dies** — zum Abhaken.
> Status je Schritt: `- [ ]` offen · `- [x]` erledigt · `- [~]` in Arbeit · `- [!]` blockiert (Grund dahinter).
> Reihenfolge ist der kritische Pfad zum P1-Ziel (Powermieter-Pilot Christinenstraße). **P2/P3 erst nach P1-Aktivierung** (Masterplan §1).

## Wie du das abarbeitest

1. **Immer oben anfangen.** Ein Schritt wird erst begonnen, wenn seine „Voraussetzung" erfüllt ist.
2. **Ein Arbeitspaket (WP) = eine Opus-Session.** Session-Einstieg: *„Lies docs/POWERHOUSE_360_MASTER_PLAN.md §10/§14 und docs/EXECUTION_ROADMAP.md, arbeite WP-X.Y ab."* Bei WPs mit eigenem Detailplan (z. B. WP-1.2) zusätzlich diesen nennen.
3. **Definition of Done (Masterplan §11) gilt für jeden Schritt:** echte Migration, serverseitige Validierung + Berechtigung, Audit, Tests, keine Mock-Daten im Produktivpfad (Testmandant ADR-006), Masterplan + Implementation-Log aktualisiert.
4. **Ein WP ist fertig, wenn sein „Gate" (E2E-Fluss F-xx aus Masterplan §12) 🟢 ist** — nicht wenn nur die UI steht.
5. **Nach jedem WP:** Masterplan §10/§12/§13/§14 + Implementation-Log pflegen, Roadmap-Kästchen abhaken.
6. **[PO]-Schritte** erledigst du (bzw. externe Berater) — sie sind teils Blocker für Umsetzungsschritte und im Parallel-Track unten gebündelt.

---

## Parallel-Track [PO] — Blocker früh auflösen

Diese Punkte blockieren spätere Phasen; je früher, desto besser. Reihenfolge nach Dringlichkeit:

- [ ] **VPS-Rollout** gemäß [DEPLOYMENT.md](DEPLOYMENT.md) (Secrets in Server-`.env`, `git archive|scp`, `docker compose … up -d`, Domains umhängen). → schließt **R-01 in Prod** (Lead-Verlust) · *blockiert: produktiver Lead-Eingang*
- [ ] **Git-Remote** anlegen + pushen (privat). → schließt **R-02**, ermöglicht CI · *blockiert: CI-Gate der Teststrategie*
- [ ] **ADR-007 (Stack & Hosting) freigeben** — bestätigt den Ist-Stack + Datenbank-Hosting-Option (VPS-Postgres + getesteter Restore vs. Managed-EU-DB). [ADR-007](DECISIONS/ADR-007-stack-und-hosting.md) · *blockiert nichts hart, aber Grundsatz*
- [ ] **PDF-Pipeline übergeben** (Repo/Code/Zugang der externen WeasyPrint-Pipeline). [ADR-003](DECISIONS/ADR-003-dokumentenerzeugung-vs-signatur.md), R-17 · *blockiert: Phase 3*
- [ ] **ADR-008 (Bewohner-Belegweg) entscheiden** (Lexoffice vs. interner Belegpfad; Kriterien in [ADR-008](DECISIONS/ADR-008-bewohner-belegweg.md)). · *blockiert: Phase 6 Billing-Detail*
- [ ] **Pilotdaten bereitstellen:** Christinenstraße 36 / Lottumstraße 22 — Gebäude, Einheiten, 21 Messstellen, Teilnehmer (Excel/CSV). · *blockiert: WP-1.3-Import + Phase 6*
- [ ] **Datenexporte:** Zoho-Altbestand (CRM), Reonic (PV/Installation) — Zugang + Format klären. · *blockiert: WP-1.3-Migration*
- [ ] **MaKo-Klärung mit Comgy:** Zuständigkeitsmatrix ausfüllen (Masterplan §6). · *blockiert: Phase 6 Billing Readiness*
- [ ] **Documenso-Betriebsentscheidung:** gefundenes `documenso-powermieter`-Setup sichten — weiterverwenden oder frisch aufsetzen? · *blockiert: Phase 3*

---

## PHASE 1 — Core & Datenmigration  🟡 (aktiv)

**Ziel:** tragfähiges Fundament — Auth, Mandanten, Rollen, Immobilienstruktur, CRM-Qualifizierung, Events/Worker, Projekt-/Modulgerüst, Testmandant.
**Gates:** F-02, F-03, F-19, F-20 🟢 (F-01, F-21 bereits erreicht).

### WP-1.2 — Auth, Rollen & Mandanten  🟡
> **Detailplan vorhanden:** `docs/superpowers/plans/2026-07-11-wp-1.2-auth-rollen-mandanten.md` (13 Tasks) — dieser ist maßgeblich; hier nur die Grobschritte + V2-Deltas.
- [x] Task 1 — `packages/permissions` (Katalog, Rollen-Map, Resolver, Unit-Tests) — *committet `3588b7f`*
- [ ] Task 2 — Prisma-Schema + Migration `auth_and_rbac` (better-auth-Tabellen `user/session/account/verification` + RBAC-Modelle `OrganizationMembership`, `Invitation`, Enums `SystemRole/MembershipStatus/InvitationStatus` + Org-Rück-Relationen)
- [ ] **V2-Delta A:** im selben Schritt `IssuingEntity`-Stammtabelle anlegen (Wonderpower GmbH, AKL Powerhouse 360 GmbH) — Masterplan §4
- [ ] Task 3 — `packages/testing` (Real-Postgres-Vitest-Harness gegen `ph360_test` auf :5433, Factories, Root-Test-Scripts)
- [ ] **V2-Delta B:** Seed um **Testmandant** (ADR-006, gekennzeichnete Org + realistische Struktur) + IssuingEntity-Grunddaten erweitern
- [ ] Task 4 — `packages/auth` (better-auth-Instanz, `getAuthContext`, Guards `requirePermission`/`assertOrgScope`, Audit-Events, Auth-Mails)
- [ ] Task 5 — Worker-Handler für Auth-Mails (`auth.email_verification`, `auth.password_reset`, `auth.member_invited`)
- [ ] Task 6 — apps/platform: better-auth-Route, Client, **Middleware von Basic-Auth auf Session-Check umstellen**
- [ ] Task 7–10 — Login-Seite, Admin-Shell + Members-UI + Invitation-Flow, Audit-UI
- [ ] Task 11 — Admin-Bootstrap-Script (`scripts/create-admin.ts`, ersetzt `ADMIN_BASIC_*`)
- [ ] Task 12 — volle Gate-Abdeckung: **F-02** (Mandant/Rollen + Cross-Tenant-Negativtest), **F-19** (Audit), **F-20** (Berechtigungs-Negativmatrix je Rolle) als grüne Vitest-Suite
- [ ] Task 13 — Browser-E2E + Doku-Pflege (Masterplan §10/§12/§14, Log, ggf. ADR-Notiz)
- **Gate:** F-02 🟢 · F-19 🟢 · F-20 🟢 · Interim-Basic-Auth entfernt

### WP-1.3 — Immobilienstruktur & CRM-Qualifizierung  🟡
> **Voraussetzung:** WP-1.2 (Mandanten/Guards stehen). [PO]: Pilotdaten + Zoho-Export.
> **Kern erledigt 2026-07 (WP-1.3-Kern):** Property/Building/Entrance/Unit/Address + AccessScope-Tabelle (Stub, ohne Guard-Integration) + idempotenter Pilotstruktur-Seed (Testmandant ADR-006: 1 Property, 2 Gebäude, 21 Units) — **WP-APP-1 damit entblockt** (Spec §8). Offen: `Floor`/`Room`/`TechnicalRoom`/`GridConnection`, `Property.managedByOrganizationId`, Guard-Integration.
- [ ] Prisma: Immobilien-Domäne (`Property`, `Building`, `Floor`, `Unit`, `Room`, `TechnicalRoom`, `GridConnection`, `Address`) + Migration; `Property.managedByOrganizationId` (HV) + Eigentümer-Org — *Kern erledigt: Property/Building/Entrance/Unit/Address + AccessScope-Tabelle; Rest offen*
- [ ] Prisma: CRM-Ausbau (`Customer`, `CustomerContact`, `Opportunity`, `Note`, `Task`) + Migration
- [ ] `AccessScope`-Modell + Auflösung (Property-/Building-/Projekt-Scope) in Guards integrieren — Cross-Tenant der HV auditierbar
- [ ] IssuingEntity-**Pflichtfeld** auf Außenwirkungs-Entitäten vorbereiten (Offer/Contract/InvoiceRequest/Document — soweit vorhanden)
- [ ] Domain-Service: Lead **qualifizieren** → `Customer` + `Property` erzeugen (Daten wandern mit, kein Doppel; `Lead.convertedToCustomerId`)
- [ ] CSV-Import-Werkzeug Property→Building→Unit (idempotent, Probelauf, Fehlerbericht, Audit) — **Pilotdaten Christinenstraße als erster Realimport**
- [ ] Admin-UI: Kunden-/Objektliste + Lead-Qualifizierungs-Aktion; AccessScope-Verwaltung (Basis) — *Objektliste (Lesesicht `/admin/objects` hinter `object.read`) ✅*
- [ ] Zoho-Import-Adapter (Kontakte/Leads) — sofern Export vorliegt; sonst als [!] parken
- [ ] Tests: F-03 (Lead→Kunde/Objekt ohne Doppelerfassung + Audit) + Scope-Negativtests
- **Gate:** F-03 🟢 · Pilotobjekt-Struktur importiert

### WP-1.4 — Events, Worker-Dauerdienst & Testabsicherung  🟡
> **Voraussetzung:** WP-1.2 (Audit/Events-Kontext). Läuft teils parallel zu 1.3.
- [ ] Outbox-Dispatcher auf **pg-boss** umstellen (ADR-001) + `EventHandlerExecution`-Unique (Idempotenz) — als Dauerdienst-Container
- [ ] `packages/events` — Event-Envelope + Zod-Schemata je `eventType` (Masterplan §3-Katalog), Publisher, Handler-Registry
- [ ] `packages/notifications` — E-Mail/Portal-Templates, Zustellstatus
- [ ] `packages/observability` — Logger mit **Redaction** (IBAN, E-Mail, Tokens, Namen), Request-Kontext
- [ ] eslint-boundaries-Regeln aktivieren (Fachmodule importieren nie einander; Adapter-Grenzen)
- [ ] Idempotenz-Tests: doppeltes Event / doppelter Job → genau eine Wirkung
- [ ] CI-Pipeline-Datei (lint→typecheck→unit→integration→build→e2e) — **aktiv, sobald Git-Remote existiert** ([PO]/R-02), sonst als Vorlage ablegen
- **Gate:** Idempotenz- + Berechtigungs-Suite grün; F-19/F-20 dauerhaft abgesichert

### WP-1.5 — Projekt-, Dokument- & Modulgerüst + P3-Stubs  ⚪
> **Voraussetzung:** WP-1.3.
- [ ] Prisma: `Project`, `ProjectPhase`, `ProjectMilestone`, `WorkOrder` (Grundgerüst) + Migration
- [ ] `Document`-Objekt + Storage-Abstraktion gegen **MinIO** (Upload, Hash, Berechtigungskontext)
- [ ] `ModuleSubscription` / `ModuleActivation` / `ModuleConfiguration` / `ModuleStatus` (Gerüst, ohne Fachlogik)
- [ ] **P3-Datenmodell-Stubs**: Heat- & Chargemieter-Entitäten (Masterplan §5) als Migration — **null Fachlogik/UI/Adapter**
- [ ] Tests: Projekt-Anlage + Dokument-Upload mit Berechtigung
- **Gate:** Projekt/Document/Module-Gerüst nutzbar; P3-Schema migriert

**➡️ Phase-1-Abschluss:** F-02, F-03, F-19, F-20 🟢 · Fundament trägt alle Folgephasen.

---

## PHASE 2 — Onboarding-Engine  ⚪
**Ziel:** versionierte Workflow-Engine (keine fest codierten Formulare). **Gate:** F-04.
> **Voraussetzung:** Phase 1 abgeschlossen.
- [ ] Prisma: Onboarding-Domäne (`OnboardingTemplate(+Version)`, `StepDefinition`, `Workflow`, `StepInstance`, `Participant`, `Invitation`, `Task`, `Requirement`, `Document`, `Consent`, `Approval`, `Form/Submission`, `Dependency`, `Trigger`, `Deadline/Reminder`, `Exception`, `AuditEvent`)
- [ ] Engine-Kern: Schritt-Typen `form / document_upload / contract / consent / approval / internal_task / requirement / invitation` mit je definierter Abschlussbedingung
- [ ] Statusmaschine Workflow (Draft → … → Ready for Activation → Active, +Blocked/Cancelled) — aus Schritten abgeleitet
- [ ] **Reihenfolge-Erzwingung:** Projekt-Onboarding vor Bewohner-Onboarding (Abhängigkeit zwischen Workflow-Ebenen)
- [ ] Trigger-Verarbeitung über Event-Handler (idempotent); Fristen/Erinnerungen über Scheduler → Notification
- [ ] Exceptions (dokumentiertes Überspringen, Permission `onboarding.approve_exception`, Audit)
- [ ] Erstes Template: **generisches Projekt-Onboarding** (Organisation → Vertragspartner → Gebäude → Modul konfigurieren → Vertragsvorlagen → techn. Voraussetzungen → Kommunikationsmaterial → Freigabe Teilnehmer-Onboarding)
- [ ] Admin-UI: Workflow-Fortschritt (Ampel/%), Aufgabenliste
- [ ] Tests: F-04 (Template→Instanz→Schritte→Blocked/Exception→Ready for Activation)
- **Gate:** F-04 🟢

---

## PHASE 3 — Documenso-Integration (Signatur-Layer)  ⚪
**Ziel:** Verträge erzeugen (eigene PDF-Pipeline) → über self-hosted Documenso signieren. **Gates:** F-05, F-06.
> **Voraussetzung:** Phase 2 · [PO]: PDF-Pipeline übergeben (R-17), Documenso-Betriebsentscheidung.
- [ ] **Betriebskonzept-Gate zuerst:** Documenso-Server (Staging `sign-staging…`) + Backup/Restore-Verfahren + Monitoring + Update-Prozess dokumentiert (Masterplan §8 — ohne das kein Prod-Gang)
- [ ] `packages/pdf-pipeline-adapter` — Anbindung der externen WeasyPrint-Pipeline (fertiges PDF aus versioniertem `ContractTemplate` + Feldwerte-Snapshot)
- [ ] Prisma: Verträge-Domäne (`Contract`, `ContractType` mit **`signatureLevel`**, `ContractVersion`, `ContractTemplate(+Version)`, `ContractParticipant`, `ContractFieldMapping` (nur Signatur/Datum/Identität), `ContractSignatureRequest`, `ContractAuditEvent`, `DocumensoDocument/RecipientReference`) + `WebhookInbox`
- [ ] `packages/documenso-adapter` — `createDocumentFromTemplate`, `sendForSignature`, `getDocumentStatus`, `downloadSignedPdf`, `verifyWebhookSignature`; Fehlerklassen (Unavailable/Rejected/MappingError)
- [ ] ContractType-Stammdaten + `signatureLevel`-Zuordnung (E-03: QES/Schriftform nie digital anbieten)
- [ ] Webhook-Route `/api/webhooks/documenso` → Signaturprüfung → `WebhookInbox` (idempotent) → Worker; `signed` **nur nach Verifikations-Read + PDF-Übernahme (Hash)**
- [ ] Statusmaschine mit legalen Übergängen; Out-of-Order-/Duplikat-Webhooks unschädlich; Poll-Fallback ≥ 24 h
- [ ] Onboarding-Kopplung: `contract`-Schritt schließt erst bei bestätigtem DB-Status
- [ ] Tests: **F-05** (Vertrag → 2 Unterzeichner in Reihenfolge → Webhook inkl. **Duplikat-Replay** → signed → Dokument → Onboarding-Schritt zu) · **F-06** (declined/expired → Task → Neustart)
- **Gate:** F-05 🟢 · F-06 🟢 · Documenso-Betriebskonzept steht

---

## PHASE 4 — Hub- & Device-Registry  ⚪
**Ziel:** zentrale Geräteverwaltung + sicherer Ingest. **Gates:** F-07, F-08.
> **Voraussetzung:** Phase 1 (kann parallel zu 2/3 laufen, sobald Core steht).
- [ ] Postgres-Image auf **TimescaleDB** umstellen (ADR-002) + Extension/Hypertables-Migration
- [ ] Prisma: Hub-/Device-Domäne (`Hub`, `HubModel/Credential/Configuration/Deployment`, `Device`, `DeviceModel/Type`, `DeviceAssignment/Installation`, `DeviceReading` append-only, `DeviceTelemetry` append-only, `DeviceState`, `DeviceAlert`, Firmware) — **DB-Constraint `(manufacturer, model, serialNumber)` unique**
- [ ] Ingest-API `/api/v1/hubs/{id}/heartbeat|readings|alerts` + `GET /config` — **Hub-Credential-Auth**, idempotente Batches (Batch-ID)
- [ ] **Gerätesicherheit:** individuelle Hub-Credentials (Token/Zertifikat), **Revocation-Prozess** (sofort serverseitig, ohne andere Hubs), Rotation ohne Vor-Ort-Einsatz
- [ ] Worker: Offline-Erkennung (Schwellwert → `hub.offline`), Validierungsschicht (raw → validated, Ersatzwerte als neue Datensätze), Alarm-Regelwerk → **kritischer Alarm erzeugt `ServiceTicket`**
- [ ] Materialisierter `DeviceState` (Dashboards lesen nie Rohtabellen)
- [ ] Tests: **F-07** (Enrollment → Dubletten-Negativtest → Heartbeat → offline → Alarm → Ticket) · **F-08** (Messwert-Batch doppelt → genau einmal; raw→validated)
- **Gate:** F-07 🟢 · F-08 🟢

---

## PHASE 5 — Monteur-PWA (Offline-First)  ⚪
**Ziel:** installierbare PWA für Provisionierung. **Gates:** F-09, F-10.
> **Voraussetzung:** Phase 4 (Registry stabil).
- [ ] PWA-Grundgerüst (installierbar, Service-Worker, Auth via Session) in apps/platform Route-Group `(installer)`
- [ ] WorkOrder-/Assignment-Ausbau + Monteur-Auftragsansichten (Tag/Woche), Gebäudestruktur, Checklisten (versioniert)
- [ ] Provisionierung: QR-/Barcode-Scan → Dublettenprüfung → Modellvalidierung → Einbauort → Kommunikationstest (**oder offline vormerken**) → Messwert → Foto → Checkliste → Bestätigung
- [ ] **Offline-First (R-11):** kompletter Ablauf offline; signierte Queue; **Konfliktauflösung — kein Last-Write-Wins** für Protokolle/Checklisten (Konflikte sichtbar); Foto-Upload-Queue mit Wiederaufnahme
- [ ] Regel: Gerät gilt **ohne bestandenen Funktionstest oder dokumentierte Ausnahme** nicht als installiert; „ausstehend wegen Konnektivität" → Nachhol-Pflicht
- [ ] Protokoll-/Unterschrift → `InstallationProtocol` (PDF via Pipeline), Fotos → `Attachment`
- [ ] Tests: **F-09** (inkl. Negativtest ohne Funktionstest) · **F-10** (offline → Sync → Konflikt sichtbar)
- **Gate:** F-09 🟢 · F-10 🟢

---

## PHASE 6 — Powermieter + PILOT  ⚪  ⭐ P1-Abschlussziel
**Ziel:** Powermieter End-to-End, **verifiziert am Pilot Christinenstraße / Lottumstraße**. **Gates:** F-11, F-12.
> **Voraussetzung:** Phasen 2–5 · [PO]: MaKo-Klärung Comgy (E-07), ADR-008, Pilotdaten, Regulatorik O-P1…P4.
- [ ] Prisma: Powermieter-Domäne (`PowerProject`, `PvSystem/StorageSystem`, `MeteringConcept(+Version)`, `MeteringPoint`, `Tariff/TariffVersion`, `PowerParticipant`, `MeterChange`, `BillingReadiness`, `EnergyAllocation`)
- [ ] **Minimaler Angebots-/Annahmefluss** (aus Phase 7 vorgezogen): `Offer/OfferVersion/OfferAcceptance` + Kundenportal-Annahme → `offer.accepted` → Projekt automatisch
- [ ] Projekt-Onboarding-Template Powermieter (Masterplan §7): Gebäude/Hausanschlüsse → PV/Speicher → Messkonzept → Einheiten-Import → Tarifversion → Vertragsvorlage + Feldmapping → Kommunikationsmaterial
- [ ] Teilnehmer-Onboarding je `PowerParticipant`: Einladung → Daten → **SEPA** (O-P4) → **Stromvertrag via Documenso** → Zählerwechsel/MaKo verfolgen
- [ ] MaKo-Anbindung Comgy (Messwertbezug über Adapter; Zuständigkeiten gemäß §6-Matrix)
- [ ] **Interne Billing-Engine** (ADR-005): Tarifberechnung (dyn. Sonnenstrompreis, O-P2), `EnergyAllocation` je Periode → `Charge`
- [ ] **Billing Readiness** als harte Aktivierungsbedingung (Messkonzept vollständig · Messstellen eichrechtskonform · Tarifversion aktiv · Vertrag signiert · SEPA gültig · MaKo geklärt) → `module.activated`
- [ ] Betriebsdashboard (Teilnehmerquote, Zählerstatus, offene Onboardings, Erzeugung/Verbrauch)
- [ ] **PILOT-Durchlauf** am realen Objekt (21 Messstellen): kompletter Fluss ohne manuelle DB-Eingriffe; erste Abrechnungsperiode fehlerfrei vorbereitet
- [ ] Tests: **F-11** (Lead→…→Modul aktiv, am Pilot) · **F-12** (Billing Readiness → Aktivierung)
- **Gate:** F-11 🟢 · F-12 🟢 · **Pilot produktiv** → P1-Ziel erreicht ⭐

---

## PHASE 7 — Commercial-Vollausbau & Lexoffice  ⚪
**Ziel:** Angebotskonfigurator + Kundenportal + B2B-Rechnungsweg. **Gates:** F-17, F-18.
> **Voraussetzung:** Phase 6 (Powermieter-Produkte existieren).
- [ ] Angebotskonfigurator (Powermieter-Umfang: Modul, Hub-Infrastruktur, Installation, Planung, Wartung/Service) + Preisbücher/Regeln; jedes Angebot trägt **`IssuingEntity`**
- [ ] Kundenportal-Vervollständigung (Varianten vergleichen, annehmen, Signaturstatus, Projektstatus, Dokumente, Rechnungen, Servicefälle); Angebotsportal → Projekt-/Betriebsportal
- [ ] `packages/lexoffice-adapter` — `upsertContact`, `createInvoice`, `getInvoiceStatus`, `createCreditNote`; **Zwei-Konten-Routing je `IssuingEntity`** (Wonderpower/AKL), getrennte ID-Mappings; Anforderung ohne Gesellschaft → Ablehnung
- [ ] Billing → `InvoiceRequest` (unique `idempotencyKey`) → Worker → Lexoffice → `InvoiceReference`; zyklischer Status-Sync → `PaymentStatus` (`invoice.paid/overdue`)
- [ ] E-Rechnung (XRechnung/ZUGFeRD) — Lexoffice-Fähigkeit verifizieren (ADR-008-Kriterium)
- [ ] Bewohner-Belegweg gemäß **ADR-008**-Entscheidung umsetzen
- [ ] Tests: **F-17** (Konfigurator→Annahme→Projekt automatisch) · **F-18** (Leistung→Rechnung→Nummer/Status; **Zwei-Konten-Routing** + Doppelauslösungs-Negativtest + Fehlerpfad/manueller Retry)
- **Gate:** F-17 🟢 · F-18 🟢

---

## PHASE 8 — Smokemieter (P2)  ⚪
**Ziel:** RWM-Betrieb + garantierter Serviceprozess. **Gate:** F-13.
> **Voraussetzung:** P1-Ziel erreicht (Phase 6) + Freigabe · Phasen 4/5 (Registry+PWA).
- [ ] **NFR-Gate zuerst:** überwachte Alarmierungskette (Gerät→Hub→Plattform→Serviceprozess→Mensch) mit Verfügbarkeitszielen — Aktivierungsvoraussetzung
- [ ] Prisma: Smokemieter-Domäne (`SmokeProject`, `InspectionRun/Record` append-only, `ReplacementPlan`, `ResidentNotice`) + Betreibervertrag via Documenso
- [ ] Geräteplanung/-installation (PWA, Funktionstest) · Ferninspektion periodisch · Prüfhistorie (DIN 14676, revisionssicher)
- [ ] Kritischer Alarm (Demontage/Störung/Batterie) → **automatisch `ServiceTicket`** → WorkOrder → Prüfnachweis (kein Alarm ohne Ticket — Wächter-Query)
- [ ] Jahres-/Objektbericht (PDF) für HV/Eigentümer
- [ ] Tests: **F-13** (Projekt→…→Aktivierung mit verifizierter Alarmkette→Störung→Ticket→Austausch→Abschluss)
- **Gate:** F-13 🟢

---

## PHASE 9 — Heatmieter (P3)  ⚪  · PHASE 10 — Chargemieter (P3)  ⚪
> **Nur bei ausdrücklicher Prioritätsanhebung** (Masterplan §1). Bis dahin: **nur Datenmodell** (WP-1.5-Stubs), keine Fachlogik/UI/Adapter.
- [ ] [bei Anhebung] Heatmieter: Geräteverwaltung, Messwert-Validierung mit Wertetrennung, Nutzerwechsel, EED-Verbrauchsinfo, Abrechnungsvorbereitung → **F-14, F-15**; fachliche Klärung O-H1…O-H3
- [ ] [bei Anhebung] Chargemieter: Planung, Ladepunkte, **eichrechtskonforme Abrechnung**, Nutzer-Onboarding, Documenso-Verträge, Ladevorgänge, Förderung → **F-16**; OCPP-ADR (O-C1) zuerst
- **Gate (je Modul, bei Anhebung):** E2E-Kriterien werden dann definiert; aktuell gilt: Datenmodell migriert + Modulgrenzen dokumentiert.

---

## Gate-Übersicht (Phase → E2E-Flüsse, Masterplan §12)

| Phase | Gates | Aktueller Status |
|---|---|---|
| 1 | F-01, F-02, F-03, F-19, F-20, F-21 | F-01 🟢 · F-21 🟣 · Rest ⚪ |
| 2 | F-04 | ⚪ |
| 3 | F-05, F-06 | ⚪ |
| 4 | F-07, F-08 | ⚪ |
| 5 | F-09, F-10 | ⚪ |
| 6 ⭐ | F-11, F-12 | ⚪ |
| 7 | F-17, F-18 | ⚪ |
| 8 | F-13 | ⚪ |
| 9/10 (P3) | F-14, F-15, F-16 | ⚪ (gated) |
