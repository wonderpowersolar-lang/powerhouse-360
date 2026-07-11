# POWERHOUSE 360 — Zentrales Datenmodell

> Status: 🔵 Analysiert / Entwurf v1 (2026-07-11) — noch keine Migration erzeugt.
> Verbindliche Referenz für alle Module. Änderungen nur mit Eintrag im Änderungsverlauf des [Masterplans](POWERHOUSE_360_MASTER_PLAN.md).

## 1. Grundprinzipien

| Prinzip | Festlegung |
|---|---|
| Datenbank | PostgreSQL (selbst gehostet, Coolify auf Hostinger-VPS, Deutschland) |
| ORM / Migrationen | Prisma (`prisma migrate`) — jede Schemaänderung ist eine versionierte Migration, keine manuellen Schema-Edits |
| Primärschlüssel | UUID v7 (zeitlich sortierbar), Spalte `id` |
| Mandantenfähigkeit | Jede fachliche Tabelle trägt `organizationId` (Powerhouse-interne Tabellen: Powerhouse-Org). Serverseitig erzwungen über zentrale Query-Guards, nicht per Konvention |
| Zeitstempel | `createdAt`, `updatedAt` überall; fachliche Zeitpunkte separat (z. B. `signedAt`, `installedAt`) |
| Löschverhalten | Kein Hard-Delete auf fachlichen Kernobjekten. `deletedAt` (Soft-Delete) + Audit-Event. Hard-Delete nur über dokumentierten DSGVO-Löschprozess |
| Historisierung | Versionierte Objekte (Angebote, Verträge, Tarife, Onboarding-Templates) sind append-only: neue Version statt Update |
| Keine Schatten-DBs | Alle vier Fachmodule nutzen dieselbe Datenbank und dieselben Kernobjekte (Property/Unit/Device/Contract/…) |
| Geld & Mengen | `numeric`-Typen, niemals Float. Beträge in Cent (Integer) oder `numeric(12,2)`, Energiemengen `numeric(14,3)` kWh |
| Externe IDs | Referenzen auf Documenso/Lexoffice/Hersteller-IDs immer in eigenen Mapping-Tabellen bzw. `*Reference`-Feldern, nie als Ersatz für interne IDs |

## 2. Domänenübersicht

```
identity      → Organization, User, Rollen, Scopes, Einladungen
crm           → Lead, Opportunity, Customer, Aktivitäten
realestate    → Property, Building, Unit, Räume, Stellplätze, Anschlüsse
commercial    → Produkte, Preisbücher, Angebote
contracts     → Verträge, Vorlagen, Signaturprozesse (Documenso-Referenzen)
projects      → Projekte, Phasen, Arbeitsaufträge, Protokolle, Tickets
devices       → Hubs, Gateways, Geräte, Telemetrie, Firmware
onboarding    → Templates, Workflows, Schritte, Teilnehmer, Freigaben
billing       → Abrechnungskonten, Leistungen, Rechnungsanforderungen (Lexoffice-Referenzen)
modules       → Modul-Subscriptions, Aktivierungen, Zuordnungen
platform      → AuditEvent, DomainEvent (Outbox), Document, Notification, Task
```

Abhängigkeitsrichtung: `identity` ← alle; `realestate` ← projects/devices/modules; kein Fachmodul referenziert ein anderes Fachmodul direkt — nur über Kernobjekte.

## 3. Identity & Mandanten

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `Organization` | Mandant (Powerhouse selbst, Hausverwaltung, WEG, Eigentümer, Installationspartner). `type`, `name`, `legalForm`, Rechnungsadresse |
| `OrganizationMembership` | User ↔ Organization, `role`, `status`, `invitedById` |
| `User` | Person mit Login. `email` (unique), `name`, `locale`, `lastLoginAt`. Auth-Daten in Auth-Tabellen (better-auth), nicht hier dupliziert |
| `Role` | Benannte Rolle (`admin`, `sales`, `installer`, `property_manager`, `resident`, `service`, …). Systemrollen + org-spezifische Rollen |
| `Permission` | Feingranulare Berechtigung (`contract.read`, `device.provision`, …). Rollen bündeln Permissions |
| `AccessScope` | Einschränkung einer Membership/Rolle auf Teilbäume: Property-, Building-, Project- oder Modul-Scope. Ein Bewohner sieht nur seine Unit |
| `Team` | Gruppierung innerhalb einer Org (z. B. Montage-Team Nord) |
| `Contact` | Ansprechpartner ohne Login (Telefon, E-Mail, Funktion). Kann später zu User promoted werden |
| `Address` | Wiederverwendbare Adresse (Straße, PLZ, Ort, Geo), referenziert von Org/Property/Contact |
| `Invitation` | Offene Einladung (E-Mail, Rolle, Scope, Token, `expiresAt`, `acceptedAt`) |

## 4. CRM

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `Lead` | Roher Interessent. `source` (→ `LeadSource`), `status` (new/contacted/qualified/disqualified), Kontaktdaten, Freitext, `moduleInterest[]` (powermieter/heatmieter/chargemieter/smokemieter), Herkunfts-URL/Funnel |
| `LeadSource` | Landingpage, Kampagne, Empfehlung, Messe; `CampaignReference` für externe Kampagnen-IDs |
| `LeadActivity` | Zeitstrahl: Anruf, E-Mail, Statuswechsel; `userId`, `payload` |
| `Opportunity` | Qualifizierter Vorgang. `stage` (→ `SalesStage`), `expectedVolume`, verknüpft Lead → Customer/Property |
| `Customer` | Vertragsfähiger Kunde = Verweis auf `Organization` (b2b) oder Person; trägt `customerNumber` (intern, unique) |
| `CustomerContact` | Ansprechpartner-Rollen beim Kunden (Entscheider, Technik, Abrechnung) |
| `Note` / `Task` / `Communication` | Generische Notizen, Aufgaben (mit Fälligkeit, Zuweisung), protokollierte Kommunikation — polymorph via `subjectType`+`subjectId` |

Regel: Ein Lead wird bei Qualifizierung in Customer + Property **überführt** (Daten wandern mit, keine Doppelerfassung). Der Lead bleibt als historisches Objekt mit `convertedToCustomerId` bestehen.

## 5. Immobilienstruktur

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `Property` | Wirtschaftseinheit / Liegenschaft. Eigentümer-Org, Verwalter-Org, Adresse |
| `Building` | Gebäude einer Property. Baujahr, Geschosse, `BuildingSection`/`Entrance` optional darunter |
| `Floor` | Etage (für Geräteverortung und Melderpläne) |
| `Unit` | Wohn-/Gewerbeeinheit. `unitNumber` (unique je Building), Fläche, aktueller Nutzungsstatus, aktueller Bewohner-Contact/User |
| `Room` | Raum einer Unit (für Smokemieter-Melderpflicht und Heatmieter-HKV-Zuordnung) |
| `TechnicalRoom` | Technikraum (Hub-Standort, Zählerschrank, Wärmeerzeuger) |
| `ParkingArea` / `ParkingSpace` | Tiefgarage/Stellplatzanlage und Einzelstellplätze (Chargemieter). `ParkingSpace.assignedUnitId`/`assignedUserId` |
| `InstallationLocation` | Konkreter Einbauort (frei definierbar: Keller, Steigschacht, Flur EG) — Ziel jeder `DeviceInstallation` |
| `GridConnection` | Hausanschluss: Typ (Strom/Wärme), MaLo-ID/MeLo-ID, Netzbetreiber, Leistung |

Regel: Diese Struktur ist die **einzige** Gebäudewahrheit. Kein Modul legt eigene Gebäude-/Einheitentabellen an.

## 6. Commercial & Angebot

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `Product` / `ProductModule` / `ProductVersion` | Verkaufbare Produkte (Module, Hub-Infrastruktur, Installation, Planung, Wartung, Förderberatung). Versioniert; Preise nie hart im Code |
| `PriceBook` / `PriceRule` | Preislisten mit Gültigkeitszeitraum; Regeln (Staffel nach Einheitenzahl, Aufschläge) |
| `Offer` / `OfferVersion` | Angebot an einen Customer für eine Property. Version append-only; `status` (draft/sent/viewed/accepted/rejected/expired) |
| `OfferItem` / `OfferOption` | Positionen (Produktversion, Menge, Preis) und optionale Varianten zum Vergleich |
| `OfferAcceptance` | Annahme: wer, wann, aus welchem Portal, IP; löst `offer.accepted` aus |
| `CommercialCondition` | Sonderkonditionen (Rabatt, Laufzeit) mit Freigabevermerk |

## 7. Verträge (Documenso-gekoppelt)

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `ContractType` | Kundenvertrag, Modulvertrag, Stromliefervertrag, Mieterstromvertrag, Ladeinfrastruktur-, Wallbox-Nutzungs-, Service-, Wartungsvertrag, Auftragsbestätigung, Vollmacht, SEPA-Dokument, Einwilligung, HV-Vereinbarung, Eigentümer-, Bewohnervertrag |
| `ContractTemplate` (+ Version) | Vorlage je ContractType; referenziert `DocumensoTemplateReference`; `ContractFieldMapping` beschreibt Feld→Template-Zuordnung (konfigurierbar, testbar) |
| `Contract` / `ContractVersion` | Vertragsinstanz. `status` (draft/pending_signature/partially_signed/signed/declined/voided/expired), Partei-Verweise, Modul-/Projekt-Bezug. Unterzeichnete Version unveränderbar (Hash des finalen PDFs) |
| `ContractParticipant` | Unterzeichner mit Rolle und Signaturreihenfolge |
| `ContractSignatureRequest` | Ein Durchlauf bei Documenso: `documensoDocumentId`, Status, Webhook-Verlauf, Retry-Zähler |
| `DocumensoDocumentReference` / `DocumensoTemplateReference` / `DocumensoRecipientReference` | ID-Mappings Powerhouse ↔ Documenso (Umgebung mitgespeichert: dev/test/prod) |
| `ContractAuditEvent` | Jede Statusänderung mit Quelle (webhook/manual/system) |

Details: [DOCUMENSO_INTEGRATION.md](DOCUMENSO_INTEGRATION.md)

## 8. Projekte & Operations

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `Project` | Entsteht automatisch aus Angebotsannahme/Vertrag. Property-, Customer-, Modul-Bezug; `ProjectPhase`, `ProjectMilestone` |
| `WorkOrder` | Arbeitsauftrag (Installation, Wartung, Austausch, Störung). `type`, `status`, `scheduledAt`, Zielobjekte (Building/Unit/Device), `WorkOrderAssignment` → Monteur/Team |
| `InstallationTask` | Einzelschritt eines WorkOrders (Gerät X in Raum Y) |
| `ServiceTicket` | Störung/Serviceanfrage. Quelle (Alarm, Bewohner, HV, intern), Priorität, SLA-Felder, verknüpfter WorkOrder |
| `Appointment` | Termin mit Beteiligten und Objektbezug |
| `Checklist` / `ChecklistResult` | Versionierte Checklisten je Auftragstyp; Ergebnisse mit Pflichtfeld-Validierung |
| `InstallationProtocol` / `HandoverProtocol` | Abschlussdokumente mit Unterschrift (PWA), generiertes PDF als `Document` |
| `Attachment` / `Comment` | Polymorphe Anhänge/Kommentare (Fotos der Monteure etc.) |

## 9. Hub- & Geräteplattform

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `HubModel` / `Hub` | Hub-Typ (RPi5-basiert) und Instanz: `serialNumber` (unique), Projekt-/Building-Zuordnung, Standort (`TechnicalRoom`), `HubConfiguration` (LoRaWAN-, Modbus-Konfig als versioniertes JSON), `HubCredential` (Secrets nur als Hash/Verweis auf Secret-Store), Online-Status, `lastSeenAt`, Softwareversion, `HubDeployment` (Rollout-Historie) |
| `Gateway` | LoRaWAN-Gateway (kann im Hub integriert sein) |
| `DeviceType` / `DeviceModel` | Typ (Stromzähler, WMZ, HKV, Wasserzähler, Rauchmelder, Wallbox, Sensor) und konkretes Herstellermodell (Protokoll, erwartete Messgrößen) |
| `Device` | Gerät: `serialNumber` **unique je Hersteller+Modell** (DB-Constraint), `externalId` (DevEUI, OCPP-ID, MeLo), Lifecycle-Status (registered/assigned/installed/active/faulty/removed/replaced) |
| `DeviceAssignment` | Zuordnung Gerät → Hub + Building/Unit/Room + Modul; zeitlich begrenzt (Historie bleibt) |
| `DeviceInstallation` | Konkreter Einbau (Monteur, WorkOrder, Fotos, Funktionstest-Ergebnis, `InstallationLocation`) |
| `DeviceReading` | Fachlich relevante Messwerte (Zählerstände) — getrennt von Telemetrie; `quality` (raw/validated/substitute/estimated/corrected) |
| `DeviceTelemetry` | Hochfrequente Rohdaten (Signal, Batterie, Status) — eigene Tabelle, Aufbewahrungsregeln, ggf. später TimescaleDB |
| `DeviceState` / `ConnectivityStatus` / `BatteryStatus` / `SignalQuality` | Aktueller Zustand (materialisiert für schnelle Dashboards) |
| `DeviceAlert` | Alarm (Demontage, Batterie, Offline, Störung) mit `severity`; kritische Alarme erzeugen automatisch `ServiceTicket` |
| `FirmwareVersion` / `FirmwareDeployment` | Firmware-Katalog und Rollout-Historie |

Details: [DEVICE_AND_HUB_PLATFORM.md](DEVICE_AND_HUB_PLATFORM.md)

## 10. Onboarding

Vollständig in [ONBOARDING_ENGINE.md](ONBOARDING_ENGINE.md). Kernentitäten: `OnboardingTemplate(+Version)`, `OnboardingWorkflow` (Instanz je Projekt/Teilnehmer), `OnboardingStepDefinition`/`OnboardingStepInstance`, `OnboardingParticipant`, `OnboardingInvitation`, `OnboardingTask`, `OnboardingRequirement`, `OnboardingDocument`, `OnboardingConsent`, `OnboardingApproval`, `OnboardingForm`/`OnboardingSubmission`, `OnboardingDependency`, `OnboardingTrigger`, `OnboardingDeadline`/`OnboardingReminder`, `OnboardingException`, `OnboardingAuditEvent`.

## 11. Abrechnung (Lexoffice-gekoppelt)

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `BillingAccount` | Abrechnungskonto je Customer (Zahlungsart, SEPA-Mandatsreferenz → Vertragsdokument) |
| `BillingPeriod` | Abrechnungszeitraum je Modul/Projekt |
| `Charge` / `RecurringCharge` | Abrechenbare Einzelleistung / wiederkehrende Leistung (Quelle: Modulbetrieb, Service, Ladevorgang) |
| `InvoiceRequest` | Rechnungsanforderung an Lexoffice: Positionen, Leistungszeitraum, `idempotencyKey` (unique), Status (pending/sent/created/failed) |
| `InvoiceReference` | Antwort: Lexoffice-Rechnungs-ID, Rechnungsnummer, Belegstatus |
| `PaymentStatus` | Synchronisierter Zahlungsstatus (offen, bezahlt, überfällig, Betrag offen) |
| `AccountingContactReference` | Mapping Customer ↔ Lexoffice-Kontakt-ID |
| `AccountingSync` / `AccountingSyncError` | Sync-Läufe und sichtbare Fehlerzustände mit manueller Wiederholung |

Details: [LEXOFFICE_INTEGRATION.md](LEXOFFICE_INTEGRATION.md)

## 12. Modulverwaltung

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `ModuleSubscription` | Gebuchtes Modul je Customer/Property (aus Vertrag), Laufzeit, Konditionen |
| `ModuleActivation` | Aktivierung nach erfüllten Voraussetzungen (Onboarding grün, Geräte installiert, Verträge signiert). `activatedAt`, `activatedById`, Prüfprotokoll |
| `ModuleConfiguration` | Modulspezifische Konfiguration (versioniertes JSON mit Schema-Validierung) |
| `ModuleStatus` | Betriebszustand (active/suspended/terminated) |
| `BuildingModule` / `UnitModule` | Welche Gebäude/Einheiten am Modul teilnehmen |
| `DeviceModuleAssignment` | Welche Geräte welchem Modul dienen (ein WMZ kann nur Heatmieter, ein Zweirichtungszähler ggf. Powermieter dienen) |

Modulspezifische Entitäten (Tarife, Messkonzepte, Ladevorgänge, Ablesewerte, Verteilerschlüssel) sind in den Modul-Dokumenten unter [MODULES/](MODULES/) definiert und referenzieren ausschließlich die Kernobjekte dieses Dokuments.

## 13. Plattformdienste

| Entität | Zweck / Schlüsselfelder |
|---|---|
| `Document` | Zentrales Dokumentenobjekt (Verträge-PDFs, Protokolle, Uploads). Storage-Key, Hash, MIME, Berechtigungskontext, Aufbewahrungsklasse |
| `AuditEvent` | Unveränderliches Protokoll: `actorId`, `actorType` (user/system/webhook), `action`, `subjectType`+`subjectId`, `before`/`after` (redigiert), `requestId` |
| `DomainEvent` | Transactional-Outbox-Tabelle für alle Events aus [EVENT_MODEL.md](EVENT_MODEL.md): `eventType`, `payload`, `aggregateId`, `occurredAt`, `processedAt`, `attempts` |
| `Notification` | Benachrichtigung (E-Mail/Portal/Push) mit Template-Referenz und Zustellstatus |
| `WebhookInbox` | Eingehende Webhooks (Documenso, Lexoffice, OCPP-Backends): Rohpayload, Signaturprüfung, Idempotenzschlüssel, Verarbeitungsstatus |

## 14. Kritische Invarianten (DB-erzwungen wo möglich)

1. `Device(manufacturer, model, serialNumber)` unique — keine doppelten Seriennummern.
2. Ein `Contract` erreicht `signed` nur über einen bestätigten Documenso-Webhook oder manuell dokumentierte Ausnahme mit Audit-Event.
3. `InvoiceRequest.idempotencyKey` unique — keine Doppelrechnungen.
4. `OfferVersion`, `ContractVersion`, `OnboardingTemplateVersion`, Tarifversionen: append-only (kein UPDATE auf inhaltstragenden Spalten; via Trigger/Anwendungsschicht erzwungen).
5. Messwerte: `DeviceReading.quality`-Kette raw → validated → substitute/estimated/corrected; finalisierte Abrechnungswerte referenzieren die exakte Reading-Menge (Snapshot), nachträgliche Korrekturen erzeugen neue Werte, überschreiben nie.
6. Jede fachliche Query läuft durch den Org-Scope-Guard; Tabellen ohne `organizationId` sind explizit als global markiert.

## 15. Offene Punkte

- [ ] Entscheidung TimescaleDB/Partitionierung für `DeviceTelemetry` (erst bei realem Datenvolumen, siehe RISK-Register R-12)
- [ ] DSGVO-Löschkonzept je Entität (Aufbewahrungsfristen Verträge 10 Jahre, Messwerte, Bewerber-Leads)
- [ ] Prisma-Schema-Aufteilung je Domäne (multi-file schema) — bei Phase-1-Start festlegen
