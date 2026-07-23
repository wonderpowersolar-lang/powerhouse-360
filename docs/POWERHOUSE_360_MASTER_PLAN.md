# POWERHOUSE 360 — MASTERPLAN

> **Einzige Quelle der Wahrheit** für Planung und Systemzustand (Masterprompt V2, §3).
> Version 2.0 · Stand 2026-07-12 · Pflege: nach jedem Arbeitspaket (§14/§15).
> Pflichtdokumente: dieser Masterplan · [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) (append-only) · [DECISIONS/](DECISIONS/) (ADRs). Ausgelagert mit Verweis: [DEPLOYMENT.md](DEPLOYMENT.md) (Betriebs-Runbook mit Serverdaten).
> Statusmodell: ⚪ Nicht begonnen · 🔵 Analysiert · 🟡 In Arbeit · 🟠 Blockiert · 🟣 Implementiert, nicht verifiziert · 🟢 End-to-End verifiziert · 🔴 Fehlerhaft/zurückgerollt. 🟢 nur nach tatsächlich durchlaufenem Nutzerfluss (§12).

---

## 1. Vision, Zielbild und kommerzielle Priorisierung

Powerhouse 360 wird das **Betriebssystem für Mehrfamilienhäuser**: eine gemeinsame, modulare Plattform, auf der Vertrieb, Kunden (HV/WEG/Eigentümer), Bewohner, Monteure und technischer Betrieb mit denselben Daten arbeiten — Lead → Qualifizierung → Angebot → Portal → Beauftragung → Vertrag (Documenso-Signatur) → Projekt → Onboarding → Planung → Installation → Hub-/Sensoraktivierung → Modulbetrieb → Service → Abrechnung → Rechnung (Lexoffice B2B / interne Billing-Engine). Kein Prozessschritt erfasst Stammdaten doppelt.

**Verbindliche kommerzielle Priorisierung (steht über allen anderen Kapiteln):**

> **P1-Ziel: Powermieter End-to-End produktiv, verifiziert am realen Pilotprojekt WEG Christinenstraße 36 / Lottumstraße 22, Berlin — Hausverwaltung Hennings, Betriebskonzept AKL Powerhouse 360, 21 Messstellen.**

| Modul | Klasse | Bedeutung |
|---|---|---|
| Powermieter | **P1 — Vollausbau** | einziges Modul mit Ziel 🟢 in den ersten Umsetzungsmonaten; Pilot = Abschlusskriterium |
| Smokemieter | **P2** | Beginn erst nach Powermieter-Aktivierung im Pilot |
| Heatmieter | **P3 — nur Datenmodell** | Entitäten/Beziehungen/Modulgrenzen ja; keine UI, Fachlogik, Adapter bis Prioritätsanhebung |
| Chargemieter | **P3 — nur Datenmodell** | wie Heatmieter |

Jeder Plattformbereich außerhalb des kritischen Pfads „Lead → Vertrag → Projekt → Onboarding → Installation → Powermieter aktiv → Rechnung" wird auf das Minimum reduziert, das dieser Pfad braucht. **Arbeit an P2/P3 vor Erreichen des P1-Ziels ist eine Planabweichung und braucht ausdrückliche Freigabe.**

Führende Systeme: Powerhouse 360 operativ (inkl. Vertragsinhalte/-erzeugung); **Documenso** für Signaturprozesse/-nachweise; **Lexoffice** für Rechnungsnummer/Belegstatus/Zahlungsstatus je Gesellschaftskonto.

## 2. Aktueller Systemzustand (2026-07-12)

**Bestand produktiv:** Marketing-Website (Next.js 16 Scroll-Kino: `/`, `/heatmieter`, `/chargemieter`, `/smokemieter`; Domains powerhouse360.de, chargemieter.de, smokemieter.de) mit zwei Lead-Funnels. `/powermieter`-Seite fehlt (Marketing-Backlog).

**Plattform (Branch `feat/platform-foundation`):**
- Monorepo steht: pnpm+Turborepo; `apps/website` (umgezogen, F-21 🟣), `apps/platform` (Lead-API `POST /api/v1/leads`, Admin-Lead-Liste mit Interim-Basic-Auth), `apps/worker` (Outbox-Dispatcher → E-Mail), `packages/database` (Prisma, Migration `init`: Organization, Lead, LeadActivity, AuditEvent, DomainEvent), `packages/permissions` (8 Permissions, 12 Rollen, Resolver, Unit-Tests — F-20-Kern).
- **Lead-Kette F-01 🟢** (dev, 2026-07-11): Funnel → Website-Proxy → Platform → DB + Audit + Outbox → Worker → Benachrichtigungs-E-Mail → Admin-Liste.
- **Prod-Images verifiziert** (3 Dockerfiles + `docker-compose.prod.yml`, isolierter Stack-Lauf inkl. Migration und echter Persistenz). **VPS-Rollout + Git-Remote bewusst beim PO offen** (R-01 prod / R-02). Runbook: [DEPLOYMENT.md](DEPLOYMENT.md).
- WP-1.2 (Auth/Rollen/Mandanten) angelaufen: Umsetzungsplan + Design-Spec liegen vor (`docs/superpowers/plans/2026-07-11-wp-1.2-auth-rollen-mandanten.md`, `docs/superpowers/specs/2026-07-11-wp-1.2-auth-rollen-mandanten-design.md`); Task 1 committet.

**Nicht vorhanden:** CRM-Qualifizierung, Angebotskonfigurator, Portale, Onboarding-Engine, Documenso-/Lexoffice-Anbindung, Hub-/Device-Code (Hub existiert nur als Marketing-3D-Modell), PWA, Billing.

**Nicht auditiert (ehrlich gekennzeichnet, V2 §2):**
| Gegenstand | Status | Risiko/Anmerkung |
|---|---|---|
| Zoho-Altbestand (CRM-Altdaten) | ⚪ kein Zugang/Export gesichtet | Migrationsquelle §9 |
| Reonic (PV-/Installationsdaten) | ⚪ nicht gesichtet | Datenquelle, nicht Master |
| Excel-/manuelle Bestände (u. a. Pilotdaten 21 Messstellen) | ⚪ nicht gesichtet | Pilot-Voraussetzung |
| Externe HTML/CSS/WeasyPrint-PDF-Pipeline | ⚪ existiert lt. PO extern; Code nicht übergeben | R-17, ADR-003 |
| `documenso-powermieter`-Docker-Setup (gestoppt, auf Dev-Maschine gefunden) | 🔵 Existenz bekannt, Inhalt nicht auditiert | vor Phase 3 sichten |
| Hostinger-E-Mail-Postfächer/SMTP-Zugänge | ⚪ | für Prod-Benachrichtigungen |

## 3. Zielarchitektur und technische Prinzipien

**Modularer Monolith** im Monorepo (Stack im Detail: [ADR-007](DECISIONS/ADR-007-stack-und-hosting.md), Entwurf zur Freigabe):

```
apps/      website · platform (Admin/CRM + Kundenportal + Bewohnerportal + Monteur-PWA
           als Route-Groups + /api/v1 + Webhooks) · worker (Outbox/Jobs)
packages/  database · permissions · auth · testing · domain/<context> · events ·
           validation · api-client · documents · notifications · device-sdk ·
           documenso-adapter · lexoffice-adapter · pdf-pipeline-adapter · ui · observability
Kontexte:  identity → realestate/platform → crm → commercial → contracts → projects →
           onboarding · devices → module-{powermieter,smokemieter,heatmieter,chargemieter} → billing
```

**Prinzipien (verbindlich):** ein Repo · ein Datenmodell · eine Auth · ein Mandantenmodell (§4) · serverseitig erzwungene Berechtigungen · Bounded Contexts (eslint-boundaries; Fachmodule importieren nie einander; Cross-Kontext über Domain-Events) · stabile interne + versionierte externe APIs (`/api/v1`, Webhooks mit Signaturprüfung + `WebhookInbox`) · Adapter für alle Fremdsysteme (Documenso, Lexoffice, PDF-Pipeline, Geräteprotokolle) · echte Migrationen · vollständiges Audit-Logging · reproduzierbare Tests · keine Mock-Daten in Produktivflüssen (Testmandant, [ADR-006](DECISIONS/ADR-006-test-und-seed-mandant.md)) · keine stillen Datenkorrekturen · keine fest codierten Tarife/Vertragsinhalte · keine Schatten-DBs je Modul · **Rohmesswerte/Telemetrie append-only; Korrekturen = neue Datensätze mit Referenz** ([ADR-002](DECISIONS/ADR-002-telemetrie-zeitreihenspeicher.md)).

**Events** ([ADR-001](DECISIONS/ADR-001-event-infrastruktur-outbox.md)): Transactional Outbox, Envelope mit `eventType/aggregate/organizationId/actor/correlationId/causationId/version/payload` (Zod-typisiert, IDs statt Objektkopien, keine sensiblen Daten). Katalog (Mindestbestand): `lead.created/qualified`, `offer.created/sent/accepted`, `contract.created/sent_to_documenso/signature_started/partially_signed/signed/failed`, `project.created/phase_changed`, `onboarding.started/step_completed/blocked/ready_for_activation`, `work_order.created/assigned/completed`, `hub.registered/online/offline`, `device.registered/assigned/installed/activated/replaced/telemetry_received/alert_created/alert_resolved`, `module.activated/suspended`, `invoice.requested/created/paid/overdue`. Verarbeitung: at-least-once, Handler-idempotent, pro Aggregat seriell, Dead-Letter sichtbar mit auditiertem manuellen Retry.

**API-Regeln:** jede Route deklariert Permission + Org-Scope-Quelle + Zod-Schema (sonst kein Merge); Idempotenz für extern mutierende Endpunkte; Adapter-Aufrufe nur im Worker (Retry/Backoff), Fehlerzustände sichtbar mit manuellem Retry; Fremdsystem-Timeouts raten nie Zustände.

**Laufzeit (Coolify, Hostinger-VPS, DE):** Container website · platform (`app.powerhouse360.de`) · worker · postgres (Phase 4: Timescale-Image) · documenso (`sign.powerhouse360.de`, Phase 3) · minio. Umgebungen dev (compose) / staging / prod mit getrennten Secrets. Runbook: [DEPLOYMENT.md](DEPLOYMENT.md).

## 4. Mandanten- und Gesellschaftsmodell

**Gesellschaften (getrennte Rechtsträger, ein System):**
| `IssuingEntity` | Rolle |
|---|---|
| **Wonderpower GmbH** | operative Installationsgesellschaft (PV, Speicher, Wallboxen, WP, Montage-/Werkleistungen) |
| **AKL Powerhouse 360 GmbH** | Plattform-, Messstellen- und Abrechnungsgesellschaft (Powermieter-Betriebskonzepte, Energiedaten, Billing) |

**Regeln:** Jede Entität mit Außenwirkung (Offer, Contract, InvoiceRequest, Dokument mit Briefkopf) trägt verpflichtend eine `issuingEntityId`. Der Lexoffice-Adapter routet je IssuingEntity auf das jeweilige Konto (**beide Konten existieren**, PO 2026-07-12); ID-Mappings werden je Konto getrennt geführt; eine Rechnungsanforderung ohne eindeutige Gesellschaft wird abgelehnt. Der Documenso-Adapter setzt die ausstellende Gesellschaft in Absender/Signaturrollen/Referenzen.

**Mandantenstruktur (Antworten auf die V2-Strukturfragen):**
1. **Hausverwaltung (z. B. Hennings) = eigene Organization** (Mandant). Zugriff auf Objekte fremder Eigentümer-Mandanten läuft **ausschließlich über explizite, auditierbare `AccessScope`-Zuweisungen** (Property-/Building-/Projekt-Scope) — nie über Sonderfälle in der Fachlogik ([ADR-004](DECISIONS/ADR-004-mandantenisolation.md)).
2. **WEG / Eigentümer / Bestandshalter = Kunden-Organization** und Vertragspartner; Properties gehören der Eigentümer-Org, `managedByOrganizationId` verweist auf die HV.
3. **Bewohnerdaten:** Verantwortlicher ist die Plattform (AKL) im Rahmen des jeweiligen Modulvertrags. Bewohner-User haben Unit-Scope auf ihre eigene Einheit; **HV/Eigentümer sehen keine Einzelverbrauchsprofile ohne dokumentierte Rechtsgrundlage** (nur Aggregate/eigene Objekte) — §6 Querschnitt/DSGVO.
4. **Scopes:** Plattform-Mitarbeiter (mandantenübergreifend per Systemrolle) · HV-Mitarbeiter (mehrere Objekte/WEGs via AccessScopes) · WEG-Beirat (ein Objekt) · Bewohner (eine Unit) · Monteur (zugewiesene WorkOrders) · Installationspartner (eigene Aufträge + eigene Mitarbeiter).
5. **Isolation:** `organizationId` auf jeder Mandanten-Tabelle, serverseitige Guard-Erzwingung (deny-by-default), Postgres-RLS als Härtungsoption; keine Schema-pro-Mandant ([ADR-004](DECISIONS/ADR-004-mandantenisolation.md)).

## 5. Datenmodell

**Grundprinzipien:** PostgreSQL (Phase 4: +Timescale-Extension) · Prisma-Migrationen · UUID · `organizationId` verpflichtend (globale Tabellen explizit registriert) · `createdAt/updatedAt` · Soft-Delete auf Kernobjekten + DSGVO-Löschprozess · versionierte Objekte append-only (Offer, Contract, Tariff, OnboardingTemplate) · Geld als Integer-Cent/`numeric`, Energie `numeric(14,3)` · externe IDs nur in Mapping-Tabellen/`*Reference` · **DB-Constraints statt UI-Validierung** (Seriennummern-Eindeutigkeit `(manufacturer, model, serialNumber)`, Idempotenzschlüssel unique).

**Domänen und Entitäten (Zielbild; implementiert wird je Phase nur, was der kritische Pfad braucht):**

| Domäne | Entitäten |
|---|---|
| Identity | Organization, OrganizationMembership, User, Role, Permission, Team, Contact, Address, Invitation, AccessScope, **IssuingEntity** |
| CRM | Lead ✅, LeadSource, LeadActivity ✅, Opportunity, Customer, CustomerContact, SalesStage, Note, Task, Communication, CampaignReference |
| Immobilien | Property, Building, BuildingSection, Entrance, Floor, Unit, Room, TechnicalRoom, ParkingArea, ParkingSpace, InstallationLocation, GridConnection |
| Commercial | Product, ProductModule, ProductVersion, PriceBook, PriceRule, Offer, OfferVersion, OfferItem, OfferOption, OfferAcceptance, CommercialCondition |
| Verträge | Contract, **ContractType (Pflichtfeld `signatureLevel`: TEXTFORM / SES / QES / WET_SIGNATURE)**, ContractVersion, ContractTemplate, ContractParticipant, ContractFieldMapping (nur Signatur-/Datums-/Identitätsfelder, ADR-003), ContractSignatureRequest, ContractStatus, ContractAuditEvent, DocumensoDocumentReference, DocumensoRecipientReference |
| Projekt/Operations | Project, ProjectPhase, ProjectMilestone, WorkOrder, WorkOrderAssignment, InstallationTask, ServiceTicket, Appointment, Checklist, ChecklistResult, InstallationProtocol, HandoverProtocol, Attachment, Comment |
| Hub/Geräte | Hub, HubModel, HubCredential, HubConfiguration, HubDeployment, Gateway, Device, DeviceModel, DeviceType, Sensor, Meter, DeviceAssignment, DeviceInstallation, **DeviceReading (append-only)**, **DeviceTelemetry (append-only, Zeitreihenspeicher)**, DeviceState, DeviceAlert, FirmwareVersion, FirmwareDeployment, ConnectivityStatus, BatteryStatus, SignalQuality |
| Onboarding | OnboardingTemplate(+Version), OnboardingWorkflow, OnboardingStepDefinition/-Instance, OnboardingParticipant, OnboardingInvitation, OnboardingTask, OnboardingRequirement, OnboardingDocument, OnboardingConsent, OnboardingApproval, OnboardingForm/-Submission, OnboardingDependency, OnboardingTrigger, OnboardingDeadline/-Reminder, OnboardingException, OnboardingAuditEvent |
| Abrechnung | BillingAccount, BillingPeriod, **Tariff, TariffVersion**, Charge, RecurringCharge, InvoiceRequest (unique `idempotencyKey`, Pflicht `issuingEntityId`), InvoiceReference, PaymentStatus, AccountingContactReference, AccountingSync, AccountingSyncError |
| Module | ModuleSubscription, ModuleActivation, ModuleConfiguration, ModuleStatus, BuildingModule, UnitModule, DeviceModuleAssignment |
| Plattform | Document, AuditEvent ✅, DomainEvent ✅ (Outbox), EventHandlerExecution, Notification, WebhookInbox |

✅ = bereits migriert (Migration `init`). **P3-Politik:** Heat-/Chargemieter-Entitäten (HeatProject, ReadingSchedule, OccupancyChange, HeatStatement, AllocationKey, ChargingProject, ChargePoint, ChargingSession, LoadManagementPlan, ChargingAuthorization, FundingCase …) werden in **WP-1.5 als Datenmodell + Migrationsstubs** angelegt — null Fachlogik, UI oder Adapter bis Prioritätsanhebung.

**Kritische Invarianten:** Vertrag wird `signed` nur über bestätigten Documenso-Status (Verifikations-Read) oder dokumentierte, auditierte Ausnahme · Messwert-Qualitätskette raw → validated → substitute/estimated/corrected, Finalisierungs-Snapshots unveränderlich · keine Doppelrechnungen (Idempotenzschlüssel) · jede Query durch Org-Scope-Guard · Onboarding-Reihenfolge: Projekt-Onboarding vor Bewohner-Onboarding (Engine-erzwungen).

## 6. Regulatorische Anforderungen je Modul

> Regulatorik treibt Datenmodell, Prozesse und Aktivierungsbedingungen. **Kein Rechtsrat durch den Agenten** — Anforderungen werden strukturell vorgesehen; fachliche/rechtliche Verifikation: PO + externe Berater. Jede Zeile hat Status + Verantwortlichen.

### Powermieter (P1 — blockierend für Billing Readiness)
| Anforderung | Status | Verantwortlich |
|---|---|---|
| Mieterstrom-Rahmen: § 42a EnWG, EEG-Mieterstromzuschlag-Voraussetzungen | ⚪ zu verifizieren | PO/extern |
| Pflichtangaben Stromrechnung (§ 40 ff. EnWG, StromGVV wo anwendbar) → Rechnungslayout der Billing-Engine | ⚪ | PO/extern + Umsetzung |
| Rollenmodell Marktkommunikation: Lieferant in Kundenanlage vs. Vollversorgung (O-P1) | ⚪ | PO/extern |
| **MaKo-Split mit Comgy (präferierter wMSB)** — siehe Tabelle unten | ⚪ Klärungsgespräch | PO + Comgy |
| Eichrecht: nur eichrechtskonforme Zähler/Messwerte als Abrechnungsgrundlage; Wertetrennung roh/validiert/Abrechnung | 🔵 im Datenmodell vorgesehen | Umsetzung |
| SEPA: elektronische Mandatserteilung nach EPC-Regeln (O-P4: Documenso-Dokument vs. Portal-Prozess) | ⚪ | PO/extern |
| Dynamischer Sonnenstrompreis: Preisformel + Nachweispflichten (O-P2) | ⚪ | PO/extern |
| Lieferantenpflichten (EnWG-Meldungen, Stromkennzeichnung) — Plattform vs. Dienstleister (O-P3) | ⚪ | PO/extern |

**MaKo-Zuständigkeitsmatrix Comgy ↔ Powerhouse 360 (vor Phase 6 auszufüllen):**
| Prozess | Comgy (wMSB) | PH360 | Status |
|---|---|---|---|
| Messstellenbetrieb, Zählerwechsel, Eichfristen | vermutl. ✔ | — | ⚪ |
| Fernauslesung + Messwertbereitstellung (Format/Frequenz/API) | vermutl. ✔ | Konsum via Adapter | ⚪ |
| GPKE-Prozesse (Lieferantenwechsel, An-/Abmeldung Lieferstelle) | ? | ? | ⚪ |
| Stammdatenänderungen (MeLo/MaLo) | ? | ? | ⚪ |
| Abrechnung Messstellenbetrieb | ✔ | Weiterberechnung? | ⚪ |

**Billing Readiness = harte, prüfbare Aktivierungsbedingung:** vollständiges Messkonzept · alle Messstellen eichrechtskonform erfasst · Tarifversion aktiv · Vertrag signiert · SEPA-Mandat gültig · MaKo-Zuständigkeit geklärt.

### Smokemieter (P2)
DIN 14676 (Inspektion, Dokumentationspflichten) + landesrechtliche RWM-Pflichten · lückenlose, revisionssichere Prüfhistorie je Gerät/Einheit (append-only `InspectionRecord`) · Lebensschutznähe: Demontage-/Störungserkennung löst garantierten, überwachten Serviceprozess aus — Verfügbarkeits-/Alarmierungskette ist **Aktivierungsvoraussetzung** (§8). Status: 🔵 konzipiert · Verantwortlich: Umsetzung + PO (O-S1 Gerätehersteller, O-S2 Prüfkriterien-Katalog).

### Heatmieter (P3 — im Datenmodell vorsehen)
HeizkostenV (Verteilerschlüssel, Abrechnungsregeln) · EED/HKVO unterjährige Verbrauchsinformation · Interoperabilität/Fernablesbarkeit · strikte Wertetrennung bis finalisierter Abrechnungsstand. Offen: O-H1 Ersatzwertverfahren (VDI 2077), O-H2 Nutzerwechsel-Split, O-H3 Abrechnung selbst vs. Vorbereitung.

### Chargemieter (P3 — im Datenmodell vorsehen)
Eichrechtskonforme Ladepunktabrechnung (signierte Messwerte, Transparenzsoftware) als Zulassungsvoraussetzung kWh-genauer Abrechnung · Ladesäulenverordnung/Preisangaben · OCPP nur über Adapter. Offen: O-C1 OCPP-Topologie, O-C2 Eichrecht-Wallboxen, O-C3 Förderkatalog.

### Querschnitt (alle Module, P1)
| Anforderung | Festlegung | Status |
|---|---|---|
| **Signaturniveaus** | je `ContractType` Pflichtfeld TEXTFORM/SES/QES/WET_SIGNATURE; QES/Schriftform-Verträge werden nicht digital signierbar angeboten (O-03: QES-Bedarf je Vertragstyp klären) | 🔵 modelliert, ⚪ Zuordnung |
| **E-Rechnungspflicht B2B** | XRechnung/ZUGFeRD empfangbar + gemäß Fristen ausstellbar; Lexoffice-Fähigkeit verifizieren (ADR-008-Kriterium) | ⚪ |
| **DSGVO** | Verbrauchs-/Telemetriedaten = personenbezogen/verhaltensoffenbarend: Löschkonzept mit Fristen je Datenart, Auskunftsprozesse, AV-Verträge (Hostinger, Comgy, Lexoffice), Rollentrennung (HV ohne Einzelprofile), keine sensiblen Daten in Logs (Logger-Redaction) | ⚪ VVT vor Phase-6-Go-Live |
| **Aufbewahrung** | steuer-/handelsrechtliche Fristen (Rechnungen/Verträge/Protokolle) vs. Löschkonzept explizit modelliert | ⚪ |

## 7. Modulübersicht mit Prioritätsklassen

| Modul | Klasse | Kern (Kurzform) | Software | Marketing | Offene fachliche Entscheidungen |
|---|---|---|---|---|---|
| **Powermieter** | P1 | Mieterstromprojekt: Gebäude/Hausanschlüsse, PV/Speicher, Messkonzept+Messpunkte, Teilnehmer+Einheiten, Tarifversionen (dyn. Sonnenstrompreis), Stromverträge via Documenso, SEPA, Zählerwechsel, **Billing Readiness (§6)**, Energiezuordnung, Abrechnungsvorbereitung via interner Billing-Engine (ADR-005). Modell-Ergänzungen: PowerProject, PvSystem/StorageSystem, MeteringConcept(+Version), MeteringPoint, PowerTariff→Tariff/TariffVersion, PowerParticipant (Statuskette bis aktiv), MeterChange, BillingReadiness, EnergyAllocation | ⚪ (Phase 6, **Pilot = DoD**) | 🟡 keine eigene Seite | O-P1…O-P4 (§6) |
| **Smokemieter** | P2 | RWM-Betrieb: Ferninspektion (InspectionRun/Record append-only), Batterie-/Funkstatus, Demontageerkennung → **garantierter Serviceprozess** (Alert→Ticket→WorkOrder→Prüfnachweis; kein kritischer Alarm ohne Ticket), Austauschplanung, Bewohnerkommunikation, Betreiber-/Serviceverträge | ⚪ (Phase 8) | 🟢 smokemieter.de | O-S1, O-S2 |
| **Heatmieter** | P3 | nur Datenmodell: WMZ/HKV/Wasserzähler, Gerätewechsel, Nutzerwechsel (OccupancyChange), Fernablesung, Wertetrennung, EED-Verbrauchsinfo, Perioden/Kostenpositionen/Verteilerschlüssel, HeatStatement | ⚪ (Ph. 9 bei Anhebung) | 🟢 | O-H1…O-H3 |
| **Chargemieter** | P3 | nur Datenmodell: Ladeinfrastruktur, Stellplätze, ChargePoint/Wallboxen, Lastmanagement, Berechtigungen (RFID/App), ChargingSession, Tarife, Förderung (FundingCase) | ⚪ (Ph. 10 bei Anhebung) | 🟢 chargemieter.de | O-C1…O-C3 |

**Onboarding-Engine (P1, Kernbereich):** versionierte Workflow-Templates statt fest codierter Formulare; Schritt-Typen form/document_upload/contract/consent/approval/internal_task/requirement/invitation; Workflow-Statusmodell Draft → … → Ready for Activation → Active (+Blocked/Cancelled); ein `contract`-Schritt gilt erst abgeschlossen, wenn (1) korrekter Vertrag aus richtiger Template-Version, (2) alle Unterzeichner eingeladen, (3) Documenso final bestätigt, (4) Dokument gespeichert/referenziert, (5) Status synchronisiert. **Projekt-Onboarding vor Bewohner-Onboarding** (Engine-erzwungen). Powermieter-Projekt-Onboarding-Kette gemäß V2 §14 (Organisation → … → Billing Readiness → Aktivierung).

**Hub-/Device-Plattform (P1):** zentrale Registry (Lifecycle registered→…→replaced, zeitbehaftete Zuordnungen, materialisierter DeviceState, Alarme→Tickets); Hub-zentriert (RPi5: LoRaWAN-NS/Decoder + Modbus/RS485 lokal; Cloud nur signiertes HTTPS-Push/Pull, idempotente Batches, lokales Puffern append-only); **Gerätesicherheit verbindlich:** individuelle Hub-Credentials (Token/Zertifikat), dokumentierter **Revocation-Prozess** (Sperrung serverseitig sofort, ohne andere Hubs), Rotation ohne Vor-Ort-Einsatz, keine unverschlüsselte Übertragung.

**Monteur-PWA (P1) — Offline-First als Risiko erster Klasse (R-11):** kompletter Provisionierungsprozess offline durchführbar; Konfliktauflösung definiert (**kein Last-Write-Wins** für Protokolle/Checklisten — Konflikte sichtbar); Foto-Upload-Queue mit Wiederaufnahme; Funktionstest darf als „ausstehend wegen fehlender Konnektivität" markiert werden und **muss nachgeholt werden, bevor das Gerät als installiert gilt**.

**Angebotskonfigurator + Kundenportal (P1, Powermieter-Umfang):** strukturierter Produktkonfigurator (nur Powermieter, Hub-Infrastruktur, Installation, Planung, Wartung/Service, Betriebsleistungen); jedes Angebot trägt IssuingEntity; Portal: Angebote ansehen/vergleichen/annehmen, Signaturstatus, Projektstatus, Dokumente, Aufgaben, Benutzer einladen, Rechnungen, Servicefälle; nach Annahme wird das Angebotsportal automatisch Projekt-/Betriebsportal.

## 8. Nicht-funktionale Anforderungen (NFR)

| Bereich | Anforderung | Status / Verifikationsweg |
|---|---|---|
| Verfügbarkeit | Klassen je Bereich; **strengste: Smokemieter-Alarmkette** (Gerät→Hub→Plattform→Serviceprozess→Mensch) — ohne funktionierende, überwachte Kette **keine P2-Aktivierung**. Pilot-Phase Plattform: Best-Effort mit Monitoring; Ziele werden vor Phase 8 quantifiziert | ⚪ (Ziele Phase 8), Kette = E2E-Test F-13 |
| Monitoring/Alerting | Plattform, Documenso-Server, Lexoffice-Sync, Hub-Flotte (Offline-Schwellwerte + Eskalation); Fehlerzustände der Adapter sichtbar mit manuellem Retry | ⚪ Grundausbau Phase 3/4 |
| Backup/Restore | dokumentierte Strategie mit RTO/RPO (Pilot-Vorschlag: RPO ≤ 24 h, RTO ≤ 4 h; ADR-007) für DB, MinIO-Dokumente, Documenso-Instanz; **Restore wird tatsächlich getestet — ungetestetes Backup gilt als nicht vorhanden** | ⚪ Pflicht vor ersten echten Kundendaten (WP-1.2/1.3) |
| Hosting-Realität | kein Managed Postgres/Queues bei Hostinger → Bewertung + Entscheidung in [ADR-007](DECISIONS/ADR-007-stack-und-hosting.md) (VPS-Postgres + Off-Site-Backups vs. Managed-EU-DB; DSGVO/AVV als Kriterium) | 🟡 Entwurf liegt vor, Freigabe offen |
| Security | Least-Privilege-Rollen (Tabelle unten), serverseitige Prüfung überall, Secrets nie im Repo (Coolify/Server-`.env`), TLS durchgängig, Hub-Credentials + Revocation (§7), Rate-Limits (Auth/Funnel/Webhooks), CSRF/Security-Header | 🔵 konzipiert; Umsetzung je WP |
| Log-Hygiene | Verträge, SEPA, Verbrauchsprofile, Tokens erscheinen **nie** in Logs (zentrale Redaction in `packages/observability`) | ⚪ WP-1.4 |
| Datenschutz-Betrieb | Löschkonzept, Auskunftsprozesse, AVV, Aufbewahrung (§6 Querschnitt) | ⚪ vor Phase-6-Go-Live |
| Documenso-Betrieb | **Single Point of Failure des Vertriebsprozesses**: Backup-/Restore-Verfahren, Update-Prozess, Monitoring+Alarmierung, Verfügbarkeitsziel — **ohne Betriebskonzept kein Prod-Gang** | ⚪ Phase 3-Gate |

**Rollenmodell (Least Privilege, Ist: 12 Systemrollen in `packages/permissions`):** PLATFORM_ADMIN · SALES · OPERATIONS · SERVICE · FINANCE · PROPERTY_MANAGER · OWNER_BOARD · BILLING_CONTACT · INSTALLER_PARTNER_ADMIN · INSTALLER · RESIDENT · PARKING_USER. Permission-Katalog wächst je Phase (`<domain>.<action>`, einzige Quelle: `packages/permissions`); 2FA (TOTP) für interne Rollen ab WP-1.2-Folgeausbau; Bewohner via Magic-Link-Einladung (später).

## 9. Migrationsstrategie mit Quellsystemen

Kein produktives Altsystem mit führenden Daten — aber **benannte Quellen** für die Erstbefüllung:

| Quelle | Inhalt | Strategie | Status |
|---|---|---|---|
| **Zoho-Altbestand** | CRM-Altdaten (Kontakte, Leads, Historie) | Export (CSV/API) → idempotenter Import in Lead/Customer/Contact mit Dublettenprüfung (E-Mail), Probelauf-Modus, Fehlerbericht, Audit | ⚪ Exportzugang offen (PO) |
| **Reonic** | PV-/Installations-/Planungsdaten | **Datenquelle, nicht Master**: gezielte Übernahme in PvSystem/Device-Stammdaten je Projekt; kein Live-Sync in Phase 1–6 | ⚪ Zugang/Format offen (PO) |
| **Excel/manuell** | Bestandslisten, **Pilotdaten Christinenstraße (21 Messstellen, Einheiten, Teilnehmer)** | CSV-Import-Werkzeuge für Property/Building/Unit + MeteringPoint (WP-1.3/Phase 6); Pilotdaten = erster Realimport | ⚪ Listen anfordern (PO) |
| **Bestandscode** | Website-Funnels (Lead-Payload) | ✅ erledigt (WP-1.1: Proxy → Plattform, verlustfrei inkl. Original-Payload) | 🟢 dev |

Regeln: jeder Import idempotent (natürliche Schlüssel) · Probelauf mit Abweichungsbericht · Audit-Event je Import · keine stillen Korrekturen. Repo-/Betriebsmigrationen (Monorepo, Staging, Backups, DNS) laufen als Phase-1-Arbeitspakete (§10) bzw. via [DEPLOYMENT.md](DEPLOYMENT.md).

## 10. Umsetzungsphasen und priorisierte Aufgaben

Reihenfolge folgt der kommerziellen Priorisierung (§1). Abweichung dokumentiert: **minimaler Angebots-/Annahmefluss wird aus Phase 7 in Phase 6 vorgezogen** (Powermieter-DoD „Lead → Angebot → Annahme" braucht ihn vor dem Commercial-Vollausbau).

> **Step-by-Step-Abarbeitung:** Die operative Zerlegung jeder Phase in abhakbare Schritte (mit Voraussetzungen, WP-Grenzen und Gates) steht in der ausgelagerten [EXECUTION_ROADMAP.md](EXECUTION_ROADMAP.md). Diese Tabelle bleibt die strategische Sicht; die Roadmap ist das Arbeitsblatt.

| Phase | Inhalt (Kurz) | Gates (§12) | Status |
|---|---|---|---|
| **0 — Bestandsaufnahme & Masterplan** | Audit + Plan V1 (2026-07-11); **WP-0.2 V2-Rebaseline** (2026-07-12: dieses Dokument, ADR-001…008, Doku-Konsolidierung) | — | 🟢 |
| **1 — Core & Datenmigration** | s. WP-Tabelle unten: Identity/Mandanten/IssuingEntity, Immobilien, Projekte-Kern, Audit, Outbox, Testmandant, P3-Stubs | F-01 🟢 · F-02/F-03/F-19/F-20/F-21 | 🟡 |
| **2 — Onboarding-Engine** | Templates+Versionierung, Schritte, Teilnehmer, Einladungen, Aufgaben, Dokumente, Verträge (Schnittstelle), Erinnerungen, Freigaben, Fortschritt, Aktivierungsbedingungen | F-04 | ⚪ |
| **3 — Documenso-Integration** | self-hosted Server + **Betriebskonzept (Gate!)**, PDF-Übergabe gemäß ADR-003 (externe Pipeline integrieren), Signaturniveaus je ContractType, Empfänger/Reihenfolge, idempotente Webhooks, finale Dokumente, Audit, Retry | F-05, F-06 | ⚪ |
| **4 — Hub- & Device-Registry** | Hubs, Geräte, Zuordnungen, Telemetrie im Zeitreihenspeicher (ADR-002, Timescale-Image), Status/Alarme→Tickets, zertifikats-/tokenbasierte Auth mit Revocation | F-07, F-08 | ⚪ |
| **5 — Monteur-PWA** | Arbeitsaufträge, **Offline-First**-Provisionierung, Funktionstest (offline vormerkbar), Fotos, Protokolle, Konfliktauflösung, Sync | F-09, F-10 | ⚪ |
| **6 — Powermieter inkl. Pilot** | Projekt-/Teilnehmer-Onboarding, SEPA, Documenso-Verträge, Tarife/Tarifversionen, Zählerstatus, MaKo-Zuständigkeiten mit Comgy, **Billing Readiness**, interne Billing-Engine (ADR-005/008), Betriebsdashboard, minimaler Angebots-/Annahmefluss. **Abschluss: Pilot Christinenstraße E2E verifiziert** | F-11, F-12 | ⚪ |
| **7 — Commercial & Lexoffice** | Angebotskonfigurator (Powermieter-Umfang), Kundenportal-Vervollständigung, automatische Projekterzeugung, Rechnungsanforderungen, Lexoffice-Sync mit **Zwei-Konten-Routing je IssuingEntity** | F-17, F-18 | ⚪ |
| **8 — Smokemieter (P2)** | Gerätebetrieb, Ferninspektion, Alarme mit überwachter Alarmierungskette (NFR-Gate), Serviceprozesse, revisionssichere Prüfhistorie, Berichte | F-13 | ⚪ |
| **9 — Heatmieter** | nur bei Prioritätsanhebung | F-14, F-15 | ⚪ (P3) |
| **10 — Chargemieter** | nur bei Prioritätsanhebung | F-16 | ⚪ (P3) |

**Phase-1-Arbeitspakete:**

| WP | Inhalt | Status |
|---|---|---|
| WP-1.0 Repo-/Deploy-Fundament | Monorepo ✅, docker-compose ✅, Prod-Images verifiziert ✅; **offen:** Git-Remote (R-02), CI, VPS-Rollout ([DEPLOYMENT.md](DEPLOYMENT.md), beim PO), Website-Route-Sweep (F-21-Rest) | 🟣 |
| WP-1.1 Lead-Persistenz | Lead-Kette komplett, F-01 🟢 dev; Prod nach Rollout | 🟢 dev |
| WP-1.2 Auth/Rollen/Mandanten | better-auth (Auth) + eigene RBAC (OrganizationMembership/Invitation/SystemRole), Guards/Audit, Login/Invite/Accept/Members/Audit-UI, Bootstrap-Admin; ersetzt Interim-Basic-Auth (ADR-010). Tasks 1–13 committet, Suite grün (F-02/F-19/F-20) | 🟢 |
| WP-1.3 Immobilien + CRM | Property→Unit-Baum, CSV-Import (Pilotdaten!), Lead-Qualifizierung → Customer/Property, `AccessScope`-Teilbaum, IssuingEntity-Pflicht auf Außenwirkungs-Entitäten | ⚪ |
| WP-1.4 Events/Worker-Ausbau | pg-boss-Dauerdienst, `EventHandlerExecution`, Notification-Grundgerüst, Logger-Redaction, Idempotenz-/Berechtigungs-Testsuite (F-19/F-20) | 🟡 (Outbox+Dispatcher stehen) |
| WP-1.5 Projekt-/Modul-/Dokumentstruktur | Project-Kern, Document-Objekt (MinIO), ModuleSubscription/-Activation-Gerüst, **P3-Datenmodell-Stubs (Heat/Charge)** | ⚪ |

## 11. Definition of Done

**Technisch (jeder Bereich):** echte Migration · keine Mock-Daten im Produktivpfad (Testmandant ADR-006) · serverseitige Validierung + Berechtigungsprüfung · Audit-Logging · Fehlerbehandlung + Lade-/Leer-/Fehlerzustände · mobile Prüfung · automatisierte Tests · keine beschädigten Bestandsfunktionen · Masterplan + [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) aktualisiert · relevante §6-Anforderungen erfüllt oder mit Risiko dokumentiert.

**End-to-End (Kurzketten):**
- *Vertragsprozess:* Vertragsdaten → Template → Signaturniveau prüfen → PDF rendern (eigene Pipeline) → Documenso-Dokument → Empfänger → Signatur → Webhook (idempotent, inkl. Duplikat-Replay) → Status → finales Dokument referenziert → Onboarding-Schritt zu.
- *Powermieter (P1-Abschluss):* Lead → Angebot → Annahme → Vertrag (Documenso) → Projekt → HV-Onboarding → Bewohner-Einladung → SEPA → Stromvertrag (Documenso) → technische Freigabe → **Billing Readiness** → Modul aktiv — **verifiziert am Pilot Christinenstraße**.
- *Lexoffice:* Leistung → InvoiceRequest mit IssuingEntity → korrektes Konto → Rechnungsnummer → Belegstatus → Zahlungsstatus.
- *Smokemieter (P2):* Projekt → Betreibervertrag → Planung → Installation → Funktionstest → Aktivierung **mit verifizierter Alarmierungskette** → Störung → Ticket → Austausch → Abschluss.
- *Heat-/Chargemieter:* E2E-Kriterien bei Prioritätsanhebung; bis dahin: Datenmodell migriert, Modulgrenzen dokumentiert.

## 12. Teststrategie inkl. Testmandanten-Konzept

**Testmandant ([ADR-006](DECISIONS/ADR-006-test-und-seed-mandant.md)):** dauerhafter, gekennzeichneter Mandant mit realistischen Seeds (pilot-ähnlich); E2E ausschließlich dagegen; Produktivmandanten nie mit Testdaten; Integrationstests gegen `ph360_test`-DB (compose-Postgres :5433) via Vitest (`packages/testing`).

**Pyramide:** TS strict + ESLint(+boundaries) → Vitest-Unit (Domain-Services, Statusmaschinen 100 % Übergänge inkl. illegaler) → Integration (echte Migrationen, Org-Guards, Outbox-Idempotenz, Webhook-Inbox) → Adapter/Contract (Documenso-Staging, Lexoffice-Testorg, PDF-Pipeline-Fixtures) → Playwright-E2E (Matrix unten). Jede API-Route: ≥ 1 Positiv- + 1 Berechtigungs-Negativtest. **Keine erfundenen Tests** — Nichtgetestetes wird im Log dokumentiert (was/warum nicht/Restrisiko/nächster Schritt). CI-Gate ab Git-Remote (R-02): lint → typecheck → unit → integration → build → e2e(staging).

**E2E-Matrix (Gates; Bereich wird erst 🟢, wenn sein Fluss 🟢):**

| # | Fluss | Phase | Status |
|---|---|---|---|
| F-01 | Lead-Eingang: Funnel → API → DB → CRM sichtbar → Benachrichtigung | 1 | 🟢 2026-07-11 (dev) |
| F-02 | Mandant & Rollen inkl. Cross-Tenant-Negativtest | 1 | 🟢 (WP-1.2: Guard requirePermission+assertOrgScope; Cross-Tenant→AuthzError+Audit; itest) |
| F-03 | Lead → Kunde/Objekt ohne Doppelerfassung | 1 | ⚪ |
| F-04 | Onboarding generisch (Template→Instanz→Schritte→Blocked/Exception→Ready) | 2 | ⚪ |
| F-05 | Vertragsprozess Documenso inkl. Webhook-Duplikat-Replay | 3 | ⚪ |
| F-06 | Vertrags-Fehlerpfad (declined/expired → Task → Neustart) | 3 | ⚪ |
| F-07 | Hub & Gerät (Enrollment→Dubletten-Negativ→Heartbeat→offline→Alarm→Ticket) | 4 | ⚪ |
| F-08 | Ingest-Idempotenz + raw→validated-Kette | 4 | ⚪ |
| F-09 | Monteur-Provisionierung inkl. Negativtest ohne Funktionstest | 5 | ⚪ |
| F-10 | PWA offline → Sync → Konflikt sichtbar | 5 | ⚪ |
| F-11 | **Powermieter komplett (Pilot)** | 6 | ⚪ |
| F-12 | Powermieter Billing Readiness → Aktivierung | 6 | ⚪ |
| F-13 | Smokemieter komplett inkl. Alarmierungskette | 8 | ⚪ |
| F-14 | Heatmieter komplett | 9 (P3) | ⚪ |
| F-15 | Heatmieter Nutzerwechsel | 9 (P3) | ⚪ |
| F-16 | Chargemieter komplett | 10 (P3) | ⚪ |
| F-17 | Angebot & Portal (Konfigurator→Annahme→Projekt automatisch) | 7 | ⚪ |
| F-18 | Lexoffice inkl. Zwei-Konten-Routing + Doppelauslösungs-Negativtest | 7 | ⚪ |
| F-19 | Audit-Vollständigkeit (Statuswechsel, Downloads, Rollen, Retries) | 1+ | 🟢 (WP-1.2: auth.login/member.*/authz.denied + Audit-UI /admin/audit) |
| F-20 | Berechtigungs-Negativmatrix je Rolle | 1+ | 🟢 (WP-1.2: Unit-Matrix + Guard- + Route-Level-Negativtests) |
| F-21 | Bestandsschutz Marketing-Site nach Monorepo-Umbau | 1 | 🟣 (Startseite+Funnel-Proxy ✅; Route-Sweep + Prod-Build-Smoke offen) |

## 13. Offene Entscheidungen und Risiken

**Offene Entscheidungen:**
| ID | Entscheidung | Frist/Phase | Status |
|---|---|---|---|
| E-01 | [ADR-007 Stack & Hosting](DECISIONS/ADR-007-stack-und-hosting.md) freigeben (ersetzt alt O-01/O-02 — Stack ist implementiert, Freigabe formalisiert) | vor WP-1.2-Abschluss | 🟡 Entwurf liegt vor |
| E-02 | [ADR-008 Bewohner-Belegweg](DECISIONS/ADR-008-bewohner-belegweg.md) entscheiden | vor Phase 6 | 🟡 Entwurf liegt vor |
| E-03 | QES-Bedarf je Vertragstyp (alt O-03) → `signatureLevel`-Zuordnung | Phase 3 | ⚪ |
| E-04 | Medienstrategie Git/LFS für neue Kampagnen (alt O-04) | vor CI | ⚪ |
| E-05 | PDF-Pipeline-Übergabe (Code/Repo/Zugang; ADR-003) | vor Phase 3 | ⚪ PO |
| E-06 | Zoho-/Reonic-/Excel-Exporte + Pilotdaten (21 Messstellen) bereitstellen | vor WP-1.3 | ⚪ PO |
| E-07 | MaKo-Zuständigkeitsmatrix mit Comgy (§6) | vor Phase 6 | ⚪ PO |
| O-P1…P4 · O-S1…S2 · O-H1…H3 · O-C1…C3 | fachliche Modulentscheidungen (§6/§7) | je Modulphase | ⚪ |

**Risikoregister:**
| ID | Risiko | W'keit×Ausw. | Gegenmaßnahme | Status |
|---|---|---|---|---|
| R-01 | Lead-Verlust in Prod (alter console.log-Pfad live) | sicher×H | WP-1.1 ✅ dev; **schließt erst mit VPS-Rollout** | 🟡 dev behoben, Prod offen |
| R-02 | Kein Git-Remote → kein Repo-Backup, keine CI | M×H | privates Remote + Push (PO-Freigabe) | 🔴 offen |
| R-03 | Greenfield-Verzettelung über Module | H×H | **V2-P1-Regel (§1)**, DoD je Phase, kein Modul-Hopping | mitigiert durch V2 |
| R-04 | Powermieter-Regulatorik erzwingt Umbauten | M×H | §6-Klärungen vor Phase 6 (E-07, O-P1…P4), Messkonzept flexibel | offen |
| R-05 | Documenso-Betrieb (SPOF Vertrieb): Updates, Zustellbarkeit | M×M | Betriebskonzept = Phase-3-Gate (§8), Staging zuerst, Version gepinnt | offen |
| R-06 | Lexoffice-API-Limits/Lücken (E-Rechnung, Webhooks) | M×M | API-Spike vor Phase 7; Polling-Fallback; ADR-008-Kriterien | offen |
| R-07 | Bus-Faktor Kleinstteam | H×M | Masterplan als externes Gedächtnis, ADRs, kleine PRs, CI-Gates | offen |
| R-08 | Repo-Größe (Medien 200+ MB) | H×N–M | E-04; neue Medien nicht mehr ins Repo | offen |
| R-09 | Geschäfts-PDFs unversioniert im Projektordner | M×N | in geschützte Ablage (DMS sobald vorhanden) | offen |
| R-10 | Webhook-/Sync-Fehler erzeugen falsche Zustände | M×H | idempotente Inbox, legale Statusübergänge, Verifikations-Reads, Audit | mitigiert im Design |
| R-11 | **Offline-PWA-Sync (Risiko erster Klasse, V2 §19)** | M×M | Offline-First-Pflichten §7, Konfliktauflösung, F-10 | offen |
| R-12 | Telemetrie-Volumen | N→M×M | ADR-002 (Timescale), Retention, materialisierte States | mitigiert im Design |
| R-13 | OCPP/Wallbox-Komplexität | M×M | P3; Adapter-Grenze; ADR bei Anhebung | offen (P3) |
| R-14 | Ein-VPS-Totalausfall (DB+Plattform+Documenso+Storage) | M×H | Off-Site-Backups + getesteter Restore (§8, ADR-007); zweite VPS ab Produktivkunden | offen |
| R-15 | DSGVO-Pflichten bremsen Go-Lives | M×M | §6-Querschnitt als DoD-Checkpunkt; VVT vor Phase 6 | offen |
| R-16 | Marketing-Site-Regression durch Umbauten | M×M | F-21-Sweep, entkoppelte Deploys | offen |
| R-17 | **Übergabe externe PDF-Pipeline ungeklärt** | M×M | E-05; Adapter-Schnittstelle wird unabhängig entworfen | 🆕 offen |

## 14. Aktueller Fortschritt und nächste verbindliche Schritte

| Bereich (V2 §1) | Status |
|---|---|
| Masterplan & Pflichtdoku (V2-Struktur) | 🟢 (2026-07-12) |
| Monorepo-/Deploy-Fundament | 🟣 (Images verifiziert; Rollout/Remote offen) |
| 1 CRM — Lead-Kern | 🟢 dev (F-01); Qualifizierung ⚪ (WP-1.3) |
| 17 Audit · 16 Notifications · Events/Outbox | 🟣 (Lead-Pfad live; Ausbau WP-1.4) |
| 18 Identity/Rollen/Mandanten | 🟢 (Permissions + better-auth + Memberships/Invitations + Audit-UI; F-02/F-19/F-20 grün) |
| 2 Konfigurator · 3 Portal · 4 Onboarding · 5 Hubs · 6 Registry · 7 PWA · 8 Documenso · 9 Lexoffice · 10 Powermieter · 14 Service · 15 DMS | ⚪ (konzipiert 🔵 in §3–§9) |
| 11 Smokemieter (P2) · 12/13 Heat/Charge (P3) | ⚪ (P3: nur Datenmodell in WP-1.5) |
| Marketing-Site + Funnels | 🟢 produktiv (Lead-Zustellung prod: nach Rollout) |

**Nächste verbindliche Schritte (Reihenfolge):**
1. **PO:** VPS-Rollout gemäß [DEPLOYMENT.md](DEPLOYMENT.md) (+ Secrets) → schließt R-01 prod; **Git-Remote** anlegen/pushen → schließt R-02, ermöglicht CI.
2. **PO:** ADR-007 freigeben (E-01); E-05/E-06 anstoßen (PDF-Pipeline, Datenexporte, Pilotdaten).
3. **Umsetzung: WP-1.2 fortsetzen** nach `docs/superpowers/plans/2026-07-11-wp-1.2-auth-rollen-mandanten.md` — Task 2 (better-auth-Tabellen + RBAC-Modelle + Migration `auth_and_rbac`) beginnt; **plus V2-Delta:** Testmandant-Seed (ADR-006) + IssuingEntity-Stammdaten.
4. WP-1.3 → WP-1.4 → WP-1.5 (§10-Tabelle).
5. Parallel ohne Implementierung: E-07/O-P1…P4-Klärungen terminieren (R-04).

## 15. Änderungsverlauf

| Datum | Version | Änderung | Begründung |
|---|---|---|---|
| 2026-07-11 | 1.0 | Erstfassung: Audit, Zielarchitektur, 20+ Konzeptdokumente, Phasenplan, ADR-001…005 (alt). Dokumentierte Auftragsabweichungen: 3 statt 7 Apps; Angebots-Minimal in Phase 6 vorgezogen | Phase-0-Auftrag (Masterprompt V1) |
| 2026-07-12 | 2.0 | **V2-Rebaseline:** Doku-Konsolidierung auf 3 Pflichtdokumente (16 Konzeptdokumente + 4 Moduldokumente als Kapitel absorbiert und gelöscht; DEPLOYMENT.md bleibt als verlinktes Runbook); **ADR-Neunummerierung nach V2-Vorgabe** — Mapping: alt-ADR-004(Outbox)→ADR-001 · alt-ADR-003(Documenso)→ADR-003 (erweitert um Signatur-Layer/externe PDF-Pipeline) · alt-ADR-001/002/005(Monorepo/Stack/Boundaries)→ADR-007 (Entwurf zur Freigabe) · neu: ADR-002 (Timescale), ADR-004 (Mandantenisolation), ADR-005 (Billing-Engine), ADR-006 (Testmandant), ADR-008 (Bewohner-Belegweg, Entwurf); Phasen-Neuschnitt (Commercial+Lexoffice = Phase 7 vor Smokemieter = Phase 8; Heat/Charge P3-gated); kommerzielle Priorisierung + Pilot-Anker (§1); neue Pflichtkapitel §4 Mandanten-/Gesellschaftsmodell (IssuingEntity), §6 Regulatorik, §8 NFR, §9 Quellsysteme; Statusstände (F-/R-/WP-) verlustfrei übernommen; R-17 + E-01…E-07 ergänzt | **Masterprompt V2** ersetzt V1 (2026-07-12); PO-Antworten: PDF-Pipeline extern vorhanden, Housekeeping ja, beide Lexoffice-Konten existieren |
