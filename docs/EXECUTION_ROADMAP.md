# POWERHOUSE 360 — Ausführungs-Roadmap (Step-by-Step)

> Operatives Arbeitsdokument zum [Masterplan](POWERHOUSE_360_MASTER_PLAN.md) (§10). Der Masterplan sagt **was & warum**, diese Roadmap sagt **tu dies, dann dies** — zum Abhaken.
> Status je Schritt: `- [ ]` offen · `- [x]` erledigt · `- [~]` in Arbeit · `- [!]` blockiert (Grund dahinter).
> Reihenfolge ist der kritische Pfad zum **Commercial-Durchstich** ([ADR-012](DECISIONS/ADR-012-bauabfolge-commercial-first.md): Lead → Angebot → Vertrag → Projekt → Provisionierung → Operations aktiv). Der Powermieter-Pilot Christinenstraße folgt als Phase 8 (P1-Modulziel). **P2/P3 erst nach Powermieter-Aktivierung** (Masterplan §1).

> 🔀 **Neuschnitt 2026-08-05** (ADR-012 / Founding Spec §29–§30): Phasen 2–12 neu geschnitten — Mapping alt→neu im [Masterplan §10](POWERHOUSE_360_MASTER_PLAN.md). Die Schrittinhalte der alten Phasen sind vollständig übernommen, nur neu angeordnet.

## Wie du das abarbeitest

1. **Immer oben anfangen.** Ein Schritt wird erst begonnen, wenn seine „Voraussetzung" erfüllt ist.
2. **Ein Arbeitspaket (WP) = eine Opus-Session.** Session-Einstieg: *„Lies docs/POWERHOUSE_360_MASTER_PLAN.md §10/§14 und docs/EXECUTION_ROADMAP.md, arbeite WP-X.Y ab."* Bei WPs mit eigenem Detailplan (z. B. WP-1.2) zusätzlich diesen nennen.
3. **Definition of Done (Masterplan §11) gilt für jeden Schritt:** echte Migration, serverseitige Validierung + Berechtigung, Audit, Tests, keine Mock-Daten im Produktivpfad (Testmandant ADR-006), Masterplan + Implementation-Log aktualisiert.
4. **Ein WP ist fertig, wenn sein „Gate" (E2E-Fluss F-xx aus Masterplan §12) 🟢 ist** — nicht wenn nur die UI steht.
5. **Nach jedem WP:** Masterplan §10/§12/§13/§14 + Implementation-Log pflegen, Roadmap-Kästchen abhaken.
6. **[PO]-Schritte** erledigst du (bzw. externe Berater) — sie sind teils Blocker für Umsetzungsschritte und im Parallel-Track unten gebündelt.

---

## Parallel-Track [PO] — Blocker früh auflösen

Diese Punkte blockieren spätere Phasen; je früher, desto besser. Reihenfolge nach Dringlichkeit (Neuschnitt hat PDF-Pipeline/Documenso/Zoho nach vorn gezogen):

- [ ] **VPS-Rollout** gemäß [DEPLOYMENT.md](DEPLOYMENT.md) (Secrets in Server-`.env`, `git archive|scp`, `docker compose … up -d`, Domains umhängen). → schließt **R-01 in Prod** (Lead-Verlust) · *blockiert: produktiver Lead-Eingang*
- [ ] **Git-Remote** anlegen + pushen (privat). → schließt **R-02**, ermöglicht CI · *blockiert: CI-Gate der Teststrategie*
- [ ] **Datenexporte:** Zoho-Altbestand (CRM), Reonic (PV/Installation) — Zugang + Format klären (E-06). · *blockiert: WP-1.3-Migration + Phase-2-Import*
- [ ] **PDF-Pipeline übergeben** (Repo/Code/Zugang der externen WeasyPrint-Pipeline). [ADR-003](DECISIONS/ADR-003-dokumentenerzeugung-vs-signatur.md), R-17 (**Dringlichkeit ↑** — Phase 3 liegt jetzt früh) · *blockiert: Phase 3*
- [ ] **Documenso-Betriebsentscheidung:** gefundenes `documenso-powermieter`-Setup sichten — weiterverwenden oder frisch aufsetzen? · *blockiert: Phase 3*
- [ ] **Abgleich-Entscheidungen (E-09):** K-02 Documenso-Lesart bestätigen (*vor Phase 3*), K-03 native App in Spec v2.1, K-06 PowerWRX, K-07 Agentensystem (*vor Phase 12*) — [FOUNDING-SPEC-ABGLEICH](FOUNDING-SPEC-ABGLEICH.md); dabei **ADR-012-Begründung nachtragen**
- [ ] **Pilot-Zwischenstand klären (E-08):** Terminlage/vertragliche Bindung Christinenstraße nach der Verschiebung durch ADR-012. · *bestimmt: R-18-Bewertung + ggf. ADR-012-Revision*
- [ ] **ADR-007 (Stack & Hosting) freigeben** — bestätigt den Ist-Stack + Datenbank-Hosting-Option (VPS-Postgres + getesteter Restore vs. Managed-EU-DB). [ADR-007](DECISIONS/ADR-007-stack-und-hosting.md) · *blockiert nichts hart, aber Grundsatz*
- [ ] **ADR-008 (Bewohner-Belegweg) entscheiden** (Lexoffice vs. interner Belegpfad; Kriterien in [ADR-008](DECISIONS/ADR-008-bewohner-belegweg.md)). · *blockiert: Phase 8 Billing-Detail*
- [ ] **Pilotdaten bereitstellen:** Christinenstraße 36 / Lottumstraße 22 — Gebäude, Einheiten, 21 Messstellen, Teilnehmer (Excel/CSV). · *blockiert: WP-1.3-Import + Phase 8*
- [ ] **MaKo-Klärung mit Comgy:** Zuständigkeitsmatrix ausfüllen (Masterplan §6, E-07). · *blockiert: Phase 8 Billing Readiness*

---

## PHASE 1 — Core & Datenmigration  🟡 (aktiv)

**Ziel:** tragfähiges Fundament — Auth, Mandanten, Rollen, Immobilienstruktur, CRM-Qualifizierung, Events/Worker, Projekt-/Modulgerüst, Testmandant.
**Gates:** F-02 🟢 · F-03 🟢 · F-19 🟢 · F-20 🟢 (F-01 bereits erreicht; F-21-Rest offen).

### WP-1.2 — Auth, Rollen & Mandanten  🟢 (2026-07 abgeschlossen)
> Detailplan `docs/superpowers/plans/2026-07-11-wp-1.2-auth-rollen-mandanten.md`; Details im [IMPLEMENTATION_LOG](IMPLEMENTATION_LOG.md).
- [x] Tasks 1–13 committet (`3588b7f`…`d237b87`): better-auth + eigene RBAC ([ADR-010](DECISIONS/ADR-010-better-auth-und-eigene-rbac.md)), Guards `requirePermission`/`assertOrgScope`, Login/Invite/Accept/Members/Audit-UI, Bootstrap-Admin, Interim-Basic-Auth entfernt; Testmandant-Seed via WP-1.3-Kern (ADR-006)
- [ ] **Rest-Delta:** `IssuingEntity`-Stammtabelle (Wonderpower GmbH, AKL Powerhouse 360 GmbH — Masterplan §4) ist **noch nicht migriert** → wandert in WP-1.3 („IssuingEntity-Pflicht")
- **Gate erreicht:** F-02 🟢 · F-19 🟢 · F-20 🟢

### WP-1.3 — Immobilienstruktur & CRM-Qualifizierung  🟢 (Rest 2026-08-06; zwei [!]-Posten beim PO)
> **Kern 2026-07 (`b5d5a80`…`20bbf11`):** Objektbaum + AccessScope-Stub + Pilotstruktur-Seed. **Rest 2026-08-06 (`bd12531`…):** Migrationen `wp13_rest_crm_issuing_immobilien` + `lead_activity_actor_text`.
- [x] Prisma: Immobilien-Domäne vervollständigt — `Room`/`TechnicalRoom`/`GridConnection` + `Property.managedByOrganizationId` (HV); **bewusst keine `Floor`-Tabelle** (`Unit.floor` bleibt einzige Etagen-Wahrheit, im Schema dokumentiert)
- [x] Prisma: CRM-Ausbau (`Customer` [Kunde = Organization, Masterplan §4 Nr. 2], `CustomerContact`, `Opportunity`, `Note`, `Task`) + `Lead.convertedToCustomerId`
- [x] `AccessScope`-Auflösung in der Sichtbarkeit (`resolvePropertyVisibility`: PROPERTY-/BUILDING-Teilbaum; Projekt-Scope folgt mit Project-Modell in WP-1.5) + Grant/Revoke-Service auditiert (`accessscope.granted/revoked`)
- [x] `IssuingEntity`-Stammtabelle + idempotenter Seed (WONDERPOWER, AKL_POWERHOUSE); Pflichtfeld folgt mit den Außenwirkungs-Entitäten (Phase 3+)
- [x] Domain-Service `qualifyLead`: Lead → Kunden-Org + Customer + Kontakt + optional Property, transaktional; E-Mail-Dublette nutzt Bestandskunden; idempotent; Audit + Outbox `lead.qualified`
- [x] CSV-Import-Werkzeug (`pnpm ph360:import-objects`): idempotent, `--dry-run`-Probelauf mit Rollback, Fehlerbericht je Zeile, Audit je Lauf — [!] **Pilotdaten-Realimport wartet auf Liste (E-06, PO)**
- [x] Admin-UI: `/admin/customers` (Kundenliste), Lead-Qualifizierungs-Aktion auf `/admin/leads`, `/admin/access-scopes` (Basis: Gewähren/Entziehen)
- [!] Zoho-Import-Adapter — **geparkt: kein Export (E-06, PO)**; CSV-Werkzeug existiert als Grundlage
- [x] Tests: F-03-Kette + Scope-Negativtests + Guard-Matrix (Suite: 14 Unit + 51 Integration grün)
- **Gate:** F-03 🟢 (2026-08-06 dev: Browser-E2E Login → Qualifizieren → Kunde/Objekt/Audit/Outbox + itest) · Pilotstruktur per Seed importiert; Realdaten-Import [!] E-06

### WP-1.4 — Events, Worker-Dauerdienst & Testabsicherung  🟡
> **Voraussetzung:** WP-1.2 ✅. Läuft teils parallel zu 1.3.
- [ ] Outbox-Dispatcher auf **pg-boss** umstellen (ADR-001) + `EventHandlerExecution`-Unique (Idempotenz) — als Dauerdienst-Container
- [ ] `packages/events` — Event-Envelope + Zod-Schemata je `eventType` (Masterplan §3-Katalog inkl. neuer `opportunity.*`/`handoff.*`/`activation.*`), Publisher, Handler-Registry
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

## PHASE 2 — Commercial Core (CRM)  ⚪  🆕
**Ziel:** steuerndes CRM-Kernstück — Opportunities, Pipeline, Aktivitäten, Forecast, Alt-Lead-Import (Spec §9, §29 Phase 1). **Gate:** F-22.
> **Voraussetzung:** Phase 1 (insb. WP-1.3: Qualifizierung + AccessScope-Guards) · [PO]: Zoho-Export (E-06), sonst Import als [!] parken.
- [ ] Prisma: CRM-Vollausbau (`SalesStage` konfigurierbar, `Communication`, `CampaignReference`, `ForecastItem` versioniert) + Migration — Opportunity/Note/Task aus WP-1.3
- [ ] Lead-Intake-Ausbau: zentrale Inbox über alle Marken/Funnels, Source Attribution vervollständigen; Dubletten über Organisation/Adresse/Domain/Telefon/Objektbezug (Spec §9)
- [ ] Opportunity-Management: Anlage aus qualifiziertem Lead (Kunde/Objekt referenziert, kein Doppel); **jede Stufe mit Eintritts-/Austrittskriterien, erzwungen**; Statushistorie mit Gründen
- [ ] Aktivitäten-/Kommunikations-Timeline am Kontext (E-Mail/Call/Meeting/Notiz/Formular/Systemereignis); Kanal = Transport, nicht Quelle der Wahrheit (Spec §22)
- [ ] **Next Best Action regelbasiert** (Begründung + Frist + Verantwortlicher + erwartete Wirkung); ausdrücklich **kein Agent** — Agenten erst Phase 12 nach E-09/K-07
- [ ] Forecast: gewichtet/Commit/Best Case/Risiko, Änderungen historisiert mit Grund (`ForecastItem`)
- [ ] Zoho-Altbestand-Import: idempotent (natürliche Schlüssel/E-Mail), Probelauf-Modus, Dublettenprüfung, Fehlerbericht, Audit (Masterplan §9-Regeln)
- [ ] Admin-UI: Pipeline-Board, Opportunity-Detail mit Timeline, Forecast-Sicht
- [ ] Tests: **F-22** (Lead → Qualifizierung → Opportunity → Stufenwechsel mit erzwungenen Kriterien → Forecast sichtbar → Timeline vollständig) + Berechtigungs-Negativtests
- **Gate:** F-22 🟢

---

## PHASE 3 — Angebotskonfigurator & Vertrag  ⚪  (alt-3 + Konfigurator aus alt-7)
**Ziel:** regelbasierter Konfigurator (Powermieter-Umfang) → versionierte Quote → eigene PDF-Erzeugung → Documenso-Signatur → Portal-Annahme. **Gates:** F-17, F-05, F-06.
> **Voraussetzung:** Phase 2 · [PO]: PDF-Pipeline übergeben (R-17/E-05), Documenso-Betriebsentscheidung, K-02-Freigabe (E-09).
> **Begriffsbrücke (Spec §10):** Offer = Quote · OfferVersion = eingefrorene Solution Configuration.

**Konfigurator & Quote:**
- [ ] Prisma: Commercial-Domäne (`Product/ProductModule/ProductVersion`, `PriceBook/PriceRule`, `CostModel`, `Offer/OfferVersion/OfferItem/OfferOption`, `Assumption/Exclusion`, `ApprovalRequest`, `OfferAcceptance`, `CommercialCondition`, `DeliverableTemplate`) + Migration
- [ ] Produktkatalog + Preisbücher + Kostenmodelle: versioniert, zeitlich gültig; Powermieter-Umfang (Modul, Hub-Infrastruktur, Installation, Planung, Wartung/Service); jedes Angebot trägt **`IssuingEntity`**
- [ ] Regel-Engine: deklarative, versionierte, testbare Regeln (Kompatibilität, Voraussetzung, Ausschluss, Mindestmenge); **jede automatische Ergänzung/Ablehnung erklärt die auslösende Regel** (Spec §10)
- [ ] Mengenableitung aus Objektstruktur (Einheiten/Gebäude/Zählpunkte) · Varianten (Good/Better/Best, Kauf/Miete) · Annahmen/Ausschlüsse explizit (`Assumption`/`Exclusion`, nicht validierte Annahmen → Risikopuffer/Freigabepflicht)
- [ ] Freigabematrix (Spec §10): Rabatt-/Margen-/Risiko-Trigger → `ApprovalRequest` mit Verantwortlichem; Rabatt braucht Grund
- [ ] Quote-Versionierung: finale Angebotsversion **friert Regeln, Preisbuch, Steuern, Texte, Kalkulation als Snapshot ein** (append-only)
- [ ] Kundenportal (Basis): Angebot ansehen/vergleichen/**annehmen**, Signaturstatus; Annahme → `offer.accepted` (Portal wird ab Phase 4 Projekt-/Betriebsportal)
- [ ] Delivery-Übersetzung: `DeliverableTemplate` je Position + **Activation-Manifest-Entwurf** (Datenstruktur; Provisionierung erst Phase 5 — Spec §29 Phase 2)

**Vertrag & Signatur (alt-Phase 3, unverändert):**
- [ ] **Betriebskonzept-Gate zuerst:** Documenso-Server (Staging `sign-staging…`) + Backup/Restore-Verfahren + Monitoring + Update-Prozess dokumentiert (Masterplan §8 — ohne das kein Prod-Gang)
- [ ] `packages/pdf-pipeline-adapter` — Anbindung der externen WeasyPrint-Pipeline (fertiges PDF aus versioniertem `ContractTemplate` + Feldwerte-Snapshot)
- [ ] Prisma: Verträge-Domäne (`Contract`, `ContractType` mit **`signatureLevel`**, `ContractVersion`, `ContractTemplate(+Version)`, `ContractParticipant`, `ContractFieldMapping` (nur Signatur/Datum/Identität), `ContractSignatureRequest`, `ContractAuditEvent`, `DocumensoDocument/RecipientReference`) + `WebhookInbox`
- [ ] `packages/documenso-adapter` — `createDocumentFromTemplate`, `sendForSignature`, `getDocumentStatus`, `downloadSignedPdf`, `verifyWebhookSignature`; Fehlerklassen (Unavailable/Rejected/MappingError)
- [ ] ContractType-Stammdaten + `signatureLevel`-Zuordnung (E-03: QES/Schriftform nie digital anbieten)
- [ ] Webhook-Route `/api/webhooks/documenso` → Signaturprüfung → `WebhookInbox` (idempotent) → Worker; `signed` **nur nach Verifikations-Read + PDF-Übernahme (Hash)**
- [ ] Statusmaschine mit legalen Übergängen; Out-of-Order-/Duplikat-Webhooks unschädlich; Poll-Fallback ≥ 24 h
- [ ] Vertragserzeugung aus angenommener Quote (Feldwerte aus OfferVersion-Snapshot; kein manuelles Neuerfassen)
- [ ] Tests: **F-17** (Konfigurator → Regel-Erklärung → Freigabe → Quote-Version → Portal-Annahme → Vertrag erzeugt) · **F-05** (Vertrag → 2 Unterzeichner in Reihenfolge → Webhook inkl. **Duplikat-Replay** → signed → finales Dokument) · **F-06** (declined/expired → Task → Neustart)
- **Gate:** F-17 🟢 · F-05 🟢 · F-06 🟢 · Documenso-Betriebskonzept steht

---

## PHASE 4 — Contract-to-Delivery  ⚪  (alt-2 Onboarding + Handoff/Projekterzeugung/Lexoffice aus alt-7)
**Ziel:** angenommene Angebote kontrolliert in Onboarding/Projekte überführen; Zahlungs- und B2B-Belegweg. **Gates:** F-04, F-23, F-18.
> **Voraussetzung:** Phase 3 · [PO]: GoCardless-Zugang; ADR-008 blockiert nur Bewohner-Belegdetails (Phase 8), nicht den B2B-Weg.

**Onboarding-Engine (alt-Phase 2, unverändert):**
- [ ] Prisma: Onboarding-Domäne (`OnboardingTemplate(+Version)`, `StepDefinition`, `Workflow`, `StepInstance`, `Participant`, `Invitation`, `Task`, `Requirement`, `Document`, `Consent`, `Approval`, `Form/Submission`, `Dependency`, `Trigger`, `Deadline/Reminder`, `Exception`, `AuditEvent`)
- [ ] Engine-Kern: Schritt-Typen `form / document_upload / contract / consent / approval / internal_task / requirement / invitation` mit je definierter Abschlussbedingung
- [ ] Statusmaschine Workflow (Draft → … → Ready for Activation → Active, +Blocked/Cancelled) — aus Schritten abgeleitet
- [ ] **Reihenfolge-Erzwingung:** Projekt-Onboarding vor Bewohner-Onboarding (Abhängigkeit zwischen Workflow-Ebenen)
- [ ] Onboarding-Kopplung Vertrag: `contract`-Schritt schließt erst bei bestätigtem DB-Status (aus Phase 3)
- [ ] Trigger-Verarbeitung über Event-Handler (idempotent); Fristen/Erinnerungen über Scheduler → Notification
- [ ] Exceptions (dokumentiertes Überspringen, Permission `onboarding.approve_exception`, Audit)
- [ ] Erstes Template: **generisches Projekt-Onboarding** (Organisation → Vertragspartner → Gebäude → Modul konfigurieren → Vertragsvorlagen → techn. Voraussetzungen → Kommunikationsmaterial → Freigabe Teilnehmer-Onboarding)
- [ ] Admin-UI: Workflow-Fortschritt (Ampel/%), Aufgabenliste

**Won-Deal-Handoff & Projektgenerierung (Spec §8/§12/§13):**
- [ ] Won-Deal-Handoff: **Handoff-Packet** (Scope, Annahmen, Ausschlüsse, Verantwortliche, Risiken, offene Punkte, Termine, kommerzielle Parameter) versioniert; Empfänger nimmt an / mit Auflagen / weist zurück — **kein stilles Won-Label**, fehlende Voraussetzungen erzeugen sichtbare Ausnahme
- [ ] Customer-Success-Record: Ziele/Outcomes, verkaufte Module, Ansprechpartner, offene Voraussetzungen, Onboarding-Plan (Spec §12)
- [ ] Automatische Projektgenerierung aus OfferVersion + `DeliverableTemplate`s: Project/Phasen/Milestones/WorkOrder-Gerüst, geplante Positionen als Deliverables — Projektleitung startet nie mit leerem Board (Spec §13)
- [ ] Change Requests: Ursache + Auswirkung auf Preis/Marge/Termin/Scope; nach Freigabe aktualisieren sie Projekt und Quote/Amendment (Spec §13)

**Zahlungs- & B2B-Belegweg (GoCardless neu per Spec §11/§25; Lexoffice aus alt-7):**
- [ ] `packages/gocardless-adapter` — SEPA-Mandate, Einzüge, Rücklastschriften als **Provider-Events**; interner Zahlungszustand getrennt geführt und abgeglichen, nie blind übernommen (`SepaMandateReference`); Bewohner-SEPA folgt in Phase 8 (O-P4)
- [ ] `packages/lexoffice-adapter` — `upsertContact`, `createInvoice`, `getInvoiceStatus`, `createCreditNote`; **Zwei-Konten-Routing je `IssuingEntity`** (Wonderpower/AKL), getrennte ID-Mappings; Anforderung ohne Gesellschaft → Ablehnung
- [ ] Billing → `InvoiceRequest` (unique `idempotencyKey`) → Worker → Lexoffice → `InvoiceReference`; zyklischer Status-Sync → `PaymentStatus` (`invoice.paid/overdue`)
- [ ] E-Rechnung (XRechnung/ZUGFeRD) — Lexoffice-Fähigkeit verifizieren (ADR-008-Kriterium, R-06-Spike)
- [ ] Tests: **F-04** (Template→Instanz→Schritte→Blocked/Exception→Ready) · **F-23** (Won → Handoff-Packet → Annahme → CS-Record → Projekt automatisch inkl. Deliverables → Handoff Acceptance) · **F-18** (Leistung→Rechnung→Nummer/Status; **Zwei-Konten-Routing** + Doppelauslösungs-Negativtest + Fehlerpfad/manueller Retry)
- **Gate:** F-04 🟢 · F-23 🟢 · F-18 🟢

---

## PHASE 5 — Provisionierung & Activation  ⚪  🆕
**Ziel:** kontrollierte Aktivierung operativer Strukturen aus dem Activation Manifest (Spec §14). **Gate:** F-24.
> **Voraussetzung:** Phase 4.
- [ ] Prisma: `ActivationManifest(+Version)` (maschinenlesbar, gegen Schema validiert), `ReadinessCheckResult`, `ProvisioningRun`, `ProvisioningReport` + Migration
- [ ] Readiness Checks (Spec §14): Vertrag + Zahlungsgrundlage aktiv · vertretungsberechtigte Rollen verifiziert · Gebäude-/Einheitenstruktur geprüft · Module bestätigt · technische Grunddaten/Messkonzept geklärt · Datenschutz/AV geklärt · Betriebsverantwortung festgelegt · kritische Blocker geschlossen oder ausdrücklich akzeptiert
- [ ] **Dry Run:** Dubletten, Rechte, Konflikte, fehlende Referenzen prüfen — Bericht ohne Seiteneffekte
- [ ] Menschliche Freigabe nach Risikoklasse → `activation.manifest_approved`
- [ ] **Idempotenter Provisionierungs-Command:** Organisation, Gebäude, Einheiten, Rollen, Module anlegen **oder aktivieren** (nutzt `ModuleSubscription/Activation` aus WP-1.5; referenziert, kopiert nicht); Doppellauf ohne Doppelwirkung
- [ ] Provisioning Report + Audit-Events; Operations-Verantwortliche + Customer Success informieren; Go-Live-Checks + erste Datenqualitätsprüfung
- [ ] Tests: **F-24** (Manifest → Readiness → Dry Run → Freigabe → Provisionierung → **Doppellauf-Negativtest** → Operations aktiv)
- **Gate:** F-24 🟢

**➡️ Commercial-Durchstich erreicht,** wenn F-22, F-17, F-05, F-23, F-24 🟢 — das nächste Abschlussziel nach Masterplan §1/ADR-012.

---

## PHASE 6 — Hub- & Device-Registry  ⚪  (= alt-4)
**Ziel:** zentrale Geräteverwaltung + sicherer Ingest. **Gates:** F-07, F-08.
> **Voraussetzung:** Phase 1. **Nicht auf dem kritischen Pfad des Durchstichs** — kann bei freier Kapazität parallel zu Phasen 2–5 laufen (R-18: früh starten entschärft späte Hardware-Risiken).
- [ ] Postgres-Image auf **TimescaleDB** umstellen (ADR-002) + Extension/Hypertables-Migration
- [ ] Prisma: Hub-/Device-Domäne (`Hub`, `HubModel/Credential/Configuration/Deployment`, `Device`, `DeviceModel/Type`, `DeviceAssignment/Installation`, `DeviceReading` append-only, `DeviceTelemetry` append-only, `DeviceState`, `DeviceAlert`, Firmware) — **DB-Constraint `(manufacturer, model, serialNumber)` unique**
- [ ] Ingest-API `/api/v1/hubs/{id}/heartbeat|readings|alerts` + `GET /config` — **Hub-Credential-Auth**, idempotente Batches (Batch-ID)
- [ ] **Gerätesicherheit:** individuelle Hub-Credentials (Token/Zertifikat), **Revocation-Prozess** (sofort serverseitig, ohne andere Hubs), Rotation ohne Vor-Ort-Einsatz
- [ ] Worker: Offline-Erkennung (Schwellwert → `hub.offline`), Validierungsschicht (raw → validated, Ersatzwerte als neue Datensätze), Alarm-Regelwerk → **kritischer Alarm erzeugt `ServiceTicket`**
- [ ] Materialisierter `DeviceState` (Dashboards lesen nie Rohtabellen)
- [ ] Tests: **F-07** (Enrollment → Dubletten-Negativtest → Heartbeat → offline → Alarm → Ticket) · **F-08** (Messwert-Batch doppelt → genau einmal; raw→validated)
- **Gate:** F-07 🟢 · F-08 🟢

---

## PHASE 7 — Monteur-PWA (Offline-First)  ⚪  (= alt-5)
**Ziel:** installierbare PWA für Provisionierung. **Gates:** F-09, F-10.
> **Voraussetzung:** Phase 6 (Registry stabil).
- [ ] PWA-Grundgerüst (installierbar, Service-Worker, Auth via Session) in apps/platform Route-Group `(installer)`
- [ ] WorkOrder-/Assignment-Ausbau + Monteur-Auftragsansichten (Tag/Woche), Gebäudestruktur, Checklisten (versioniert)
- [ ] Provisionierung: QR-/Barcode-Scan → Dublettenprüfung → Modellvalidierung → Einbauort → Kommunikationstest (**oder offline vormerken**) → Messwert → Foto → Checkliste → Bestätigung
- [ ] **Offline-First (R-11):** kompletter Ablauf offline; signierte Queue; **Konfliktauflösung — kein Last-Write-Wins** für Protokolle/Checklisten (Konflikte sichtbar); Foto-Upload-Queue mit Wiederaufnahme
- [ ] Regel: Gerät gilt **ohne bestandenen Funktionstest oder dokumentierte Ausnahme** nicht als installiert; „ausstehend wegen Konnektivität" → Nachhol-Pflicht
- [ ] Protokoll-/Unterschrift → `InstallationProtocol` (PDF via Pipeline), Fotos → `Attachment`
- [ ] Tests: **F-09** (inkl. Negativtest ohne Funktionstest) · **F-10** (offline → Sync → Konflikt sichtbar)
- **Gate:** F-09 🟢 · F-10 🟢

---

## PHASE 8 — Powermieter + PILOT  ⚪  ⭐ P1-Modulziel  (= alt-6)
**Ziel:** Powermieter End-to-End, **verifiziert am Pilot Christinenstraße / Lottumstraße**. **Gates:** F-11, F-12.
> **Voraussetzung:** Phasen 2–7 · [PO]: MaKo-Klärung Comgy (E-07), ADR-008, Pilotdaten, Regulatorik O-P1…P4, E-08 geklärt.
> Der Angebots-/Annahmefluss kommt vollständig aus Phase 3 (voller Konfigurator) — der früher hierher vorgezogene Minimalfluss entfällt.
- [ ] Prisma: Powermieter-Domäne (`PowerProject`, `PvSystem/StorageSystem`, `MeteringConcept(+Version)`, `MeteringPoint`, `Tariff/TariffVersion`, `PowerParticipant`, `MeterChange`, `BillingReadiness`, `EnergyAllocation`)
- [ ] Projekt-Onboarding-Template Powermieter (Masterplan §7): Gebäude/Hausanschlüsse → PV/Speicher → Messkonzept → Einheiten-Import → Tarifversion → Vertragsvorlage + Feldmapping → Kommunikationsmaterial
- [ ] Teilnehmer-Onboarding je `PowerParticipant`: Einladung → Daten → **SEPA via GoCardless** (O-P4) → **Stromvertrag via Documenso** → Zählerwechsel/MaKo verfolgen
- [ ] MaKo-Anbindung Comgy (Messwertbezug über Adapter; Zuständigkeiten gemäß §6-Matrix)
- [ ] **Interne Billing-Engine** (ADR-005): Tarifberechnung (dyn. Sonnenstrompreis, O-P2), `EnergyAllocation` je Periode → `Charge`
- [ ] Bewohner-Belegweg gemäß **ADR-008**-Entscheidung umsetzen (Belegpfad hinter Adapter-Grenze)
- [ ] **Billing Readiness** als harte Aktivierungsbedingung (Messkonzept vollständig · Messstellen eichrechtskonform · Tarifversion aktiv · Vertrag signiert · SEPA gültig · MaKo geklärt) → `module.activated`
- [ ] Betriebsdashboard (Teilnehmerquote, Zählerstatus, offene Onboardings, Erzeugung/Verbrauch)
- [ ] **PILOT-Durchlauf** am realen Objekt (21 Messstellen): kompletter Fluss ohne manuelle DB-Eingriffe; erste Abrechnungsperiode fehlerfrei vorbereitet
- [ ] Tests: **F-11** (Lead→…→Modul aktiv, am Pilot) · **F-12** (Billing Readiness → Aktivierung)
- **Gate:** F-11 🟢 · F-12 🟢 · **Pilot produktiv** → P1-Modulziel erreicht ⭐

---

## PHASE 9 — Smokemieter (P2)  ⚪  (= alt-8)
**Ziel:** RWM-Betrieb + garantierter Serviceprozess. **Gate:** F-13.
> **Voraussetzung:** P1-Modulziel erreicht (Phase 8) + Freigabe · Phasen 6/7 (Registry+PWA).
- [ ] **NFR-Gate zuerst:** überwachte Alarmierungskette (Gerät→Hub→Plattform→Serviceprozess→Mensch) mit Verfügbarkeitszielen — Aktivierungsvoraussetzung
- [ ] Prisma: Smokemieter-Domäne (`SmokeProject`, `InspectionRun/Record` append-only, `ReplacementPlan`, `ResidentNotice`) + Betreibervertrag via Documenso
- [ ] Geräteplanung/-installation (PWA, Funktionstest) · Ferninspektion periodisch · Prüfhistorie (DIN 14676, revisionssicher)
- [ ] Kritischer Alarm (Demontage/Störung/Batterie) → **automatisch `ServiceTicket`** → WorkOrder → Prüfnachweis (kein Alarm ohne Ticket — Wächter-Query)
- [ ] Jahres-/Objektbericht (PDF) für HV/Eigentümer
- [ ] Tests: **F-13** (Projekt→…→Aktivierung mit verifizierter Alarmkette→Störung→Ticket→Austausch→Abschluss)
- **Gate:** F-13 🟢

---

## PHASE 10 — Heatmieter (P3)  ⚪  · PHASE 11 — Chargemieter (P3)  ⚪  (= alt-9/10)
> **Nur bei ausdrücklicher Prioritätsanhebung** (Masterplan §1). Bis dahin: **nur Datenmodell** (WP-1.5-Stubs), keine Fachlogik/UI/Adapter.
- [ ] [bei Anhebung] Heatmieter: Geräteverwaltung, Messwert-Validierung mit Wertetrennung, Nutzerwechsel, EED-Verbrauchsinfo, Abrechnungsvorbereitung → **F-14, F-15**; fachliche Klärung O-H1…O-H3
- [ ] [bei Anhebung] Chargemieter: Planung, Ladepunkte, **eichrechtskonforme Abrechnung**, Nutzer-Onboarding, Documenso-Verträge, Ladevorgänge, Förderung → **F-16**; OCPP-ADR (O-C1) zuerst
- **Gate (je Modul, bei Anhebung):** E2E-Kriterien werden dann definiert; aktuell gilt: Datenmodell migriert + Modulgrenzen dokumentiert.

---

## PHASE 12 — Agentische Skalierung  ⚪  🆕 (gated)
**Ziel:** Paula + spezialisierte Agenten auf gemeinsamer Tool-Registry, Autonomiestufen A0–A5, Evaluation/Budgets (Spec §19, §29 Phase 6).
> **Voraussetzung (hart):** E-09/K-07 entschieden · **Agent-Security-Standard steht VOR dem ersten Agenten** (Spec §19: authentifizierte/auditierbare Tool-Aufrufe, Schreibrechte feiner als Leserechte, Prompt-Inhalte nie Autoritätsquelle, Schema-validierte Outputs, Kosten-/Tool-Budgets, Offline-Evaluationen) · stabiler Commercial-Durchstich (Phase 5 🟢).
- [ ] [bei Freigabe] `Agents & Automation`-Kontext: Agentenidentitäten im Berechtigungsmodell, Tool Registry, Model Gateway nach Datenschutzklasse (Spec §16/§23)
- [ ] [bei Freigabe] Erste Agenten im Commercial-Bereich (Lead/Sales/Proposal/Approval) — Start A0–A2 (Observe/Draft/Recommend), A3/A4 nur mit Freigabepfaden
- [ ] [bei Freigabe] Evaluationssätze/Goldens je Agent + Agent-KPIs (Acceptance/Correction Rate, Policy Violations — Spec §27)
- **Gate:** wird bei Konkretisierung definiert (kein F-Fluss vergeben; Masterplan §12 dann ergänzen)

---

## Gate-Übersicht (Phase → E2E-Flüsse, Masterplan §12)

| Phase | Gates | Aktueller Status |
|---|---|---|
| 1 | F-01, F-02, F-03, F-19, F-20, F-21 | F-01/F-02/F-03/F-19/F-20 🟢 · F-21 🟣 |
| 2 🆕 | F-22 | ⚪ |
| 3 | F-17, F-05, F-06 | ⚪ |
| 4 | F-04, F-23, F-18 | ⚪ |
| 5 🆕 | F-24 | ⚪ |
| 6 | F-07, F-08 | ⚪ |
| 7 | F-09, F-10 | ⚪ |
| 8 ⭐ | F-11, F-12 | ⚪ |
| 9 | F-13 | ⚪ |
| 10/11 (P3) | F-14, F-15, F-16 | ⚪ (gated) |
| 12 🆕 | t.b.d. | ⚪ (gated E-09/K-07) |
