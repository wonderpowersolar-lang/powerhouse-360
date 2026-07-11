# POWERHOUSE 360 — MASTERPLAN

> **Zentrale, dauerhaft gepflegte Arbeitsgrundlage des Gesamtprojekts.**
> Version 1.0 · Stand 2026-07-11 · Pflege: nach jedem Arbeitspaket (siehe §16).
> Statusmodell: ⚪ Nicht begonnen · 🔵 Analysiert · 🟡 In Arbeit · 🟠 Blockiert · 🟣 Implementiert, nicht verifiziert · 🟢 End-to-End verifiziert · 🔴 Fehlerhaft/zurückgerollt.
> 🟢 gibt es nur nach tatsächlich durchlaufenem Nutzerfluss ([E2E_TEST_MATRIX.md](E2E_TEST_MATRIX.md)).

---

## 1. Vision und Zielbild

Powerhouse 360 wird das **Betriebssystem für Mehrfamilienhäuser**: eine gemeinsame, modulare Plattform, auf der Vertrieb, Kunden (HV/WEG/Eigentümer), Bewohner, Monteure und technischer Betrieb mit **denselben Daten** arbeiten — vom Lead bis zur Rechnung:

Lead → Qualifizierung → Angebot → Kundenportal → Beauftragung → Vertrag (Documenso) → Projekt → Onboarding → technische Planung → Installation → Hub-/Sensoraktivierung → Modulbetrieb (Powermieter · Heatmieter · Chargemieter · Smokemieter) → Service → Abrechnung → Rechnung (Lexoffice).

Kein Prozessschritt erfasst Kunden-, Gebäude-, Einheiten-, Geräte- oder Vertragsdaten doppelt. Führende Systeme: Powerhouse operativ; **Documenso** (self-hosted) für Signaturprozesse; **Lexoffice** für Rechnungsnummer/Belegstatus/Zahlungsstatus.

## 2. Aktueller Systemzustand (Kurzfassung; Details: [CURRENT_STATE_AUDIT.md](CURRENT_STATE_AUDIT.md))

- Repo = **hochwertige Marketing-Site** (Next.js 16, Scroll-Kino für /, /heatmieter, /chargemieter, /smokemieter; /powermieter fehlt) + zwei Lead-Funnels.
- **Kein Backend:** keine DB, kein Auth, keine Integrationen, keine Tests, keine CI. Einzige API: `POST /api/leads` → **`console.log` — Leads gehen verloren (R-01)**.
- Kein Git-Remote (R-02); `main` 45 Commits hinter Arbeitsbranch; Medien 214 MB im Git.
- Deployment: Docker/Coolify auf Hostinger-VPS (powerhouse360.de, chargemieter.de, smokemieter.de).
- **Alle 18 Zielbereiche des Auftrags: ⚪ nicht vorhanden** — Plattformaufbau ist Greenfield neben zu erhaltender Website.

## 3. Zielarchitektur (Details: [TARGET_ARCHITECTURE.md](TARGET_ARCHITECTURE.md))

Modularer Monolith im pnpm/Turborepo-Monorepo: `apps/website` (Bestand), `apps/platform` (Admin/CRM + Kundenportal + Bewohnerportal + Monteur-PWA + `/api/v1` + Webhooks), `apps/worker` (Outbox/Jobs). Fachlogik in `packages/domain` (Bounded Contexts, per Lint erzwungen), Adapter-Packages für Documenso/Lexoffice/Geräte. Eine PostgreSQL, better-auth, Domain-Events via Outbox+pg-boss. Betrieb: Coolify/Hostinger-VPS inkl. self-hosted Documenso (`sign.powerhouse360.de`) und MinIO. (ADR-001…005)

## 4. Technische Prinzipien

Ein Repository · ein Datenmodell · eine Auth · ein Mandantenmodell · serverseitig erzwungene Berechtigungen · klare Bounded Contexts · stabile interne + versionierte externe APIs · Domain-Events · Adapter statt Anbieter-Kopplung · echte Migrationen · vollständiges Audit-Logging · reproduzierbare Tests · **keine Mock-Daten in Produktivflüssen** · keine stillen Datenkorrekturen · keine hart codierten Tarife/Vertragsinhalte · keine Schatten-Datenbanken je Modul.

## 5. Zentrale Domänen

identity · crm · realestate · commercial · contracts · projects/operations · devices/hubs · onboarding · billing · module-{powermieter,heatmieter,chargemieter,smokemieter} · platform (documents, events, audit, notifications). Abhängigkeitsregeln in [TARGET_ARCHITECTURE.md §3](TARGET_ARCHITECTURE.md).

## 6. Datenmodell

Vollständig in [DATA_MODEL.md](DATA_MODEL.md) (mandantenfähig, versionierte Kernobjekte, kritische Invarianten wie Seriennummern-Eindeutigkeit, Vertrags-Unveränderlichkeit, Messwert-Qualitätskette, Rechnungs-Idempotenz).

## 7. Modulübersicht

| Modul | Fachkonzept | Software | Marketing |
|---|---|---|---|
| Powermieter | [MODULES/POWERMIETER.md](MODULES/POWERMIETER.md) 🔵 | ⚪ (Phase 6) | 🟡 nur Startseiten-Station, eigene Seite fehlt |
| Heatmieter | [MODULES/HEATMIETER.md](MODULES/HEATMIETER.md) 🔵 | ⚪ (Phase 8) | 🟢 |
| Chargemieter | [MODULES/CHARGEMIETER.md](MODULES/CHARGEMIETER.md) 🔵 | ⚪ (Phase 9) | 🟢 |
| Smokemieter | [MODULES/SMOKEMIETER.md](MODULES/SMOKEMIETER.md) 🔵 | ⚪ (Phase 7) | 🟢 |

## 8. Abhängigkeiten (kritischer Pfad)

```
Phase 1 (Core: DB/Auth/Mandanten/Audit/Events/CRM-Minimal)
  → Phase 2 (Onboarding-Engine)         → Phase 3 (Documenso)  ┐
  → Phase 4 (Hub/Device-Registry)       → Phase 5 (Monteur-PWA)┼→ Phase 6 (Powermieter, erstes E2E-Modul)
                                                               ┘     → Phase 7 (Smokemieter)
                                                                     → Phase 8 (Heatmieter)
                                                                     → Phase 9 (Chargemieter)
  Phase 10 (Angebotskonfigurator + Kundenportal-Vollausbau + Lexoffice) — Konfigurator-Minimal wird für Phase 6 vorgezogen (§10)
```

Externe Abhängigkeiten: Documenso-Server-Betrieb (R-05), Lexoffice-API (R-06), fachlich-regulatorische Klärungen Powermieter (R-04, O-P1…P4), Gerätehersteller-Festlegungen (O-S1, O-C1).

## 9. Migrationsstrategie

Keine Bestandsdaten vorhanden → „Migration" = Monorepo-Umbau ohne Website-Regression, Lead-Fluss-Anschluss, Stammdaten-Erstbefüllung per idempotenten Imports/Seeds. Details: [MIGRATION_PLAN.md](MIGRATION_PLAN.md).

## 10. Umsetzungsphasen & priorisierte Arbeitspakete

Reihenfolge gegenüber dem Auftrag unverändert (Phasen 0–10); eine Anpassung: **WP-6.0 zieht einen minimalen Angebots-/Annahmefluss aus Phase 10 vor**, weil die Powermieter-DoD (Lead→Angebot→Annahme→…) ihn braucht. Begründung dokumentiert hier + ADR-Verweis bei Umsetzung.

### Phase 0 — Bestandsaufnahme & Masterplan 🟢 (dieses Dokument, 2026-07-11)

### Phase 1 — Core & Fundament ⚪
| WP | Inhalt | Akzeptanz (Auszug) |
|---|---|---|
| **WP-1.0** Repo-Fundament | Git-Remote + Branch-Konsolidierung (`main` aktualisieren, Tag `website-v1`), pnpm/Turborepo, Website → `apps/website`, CI-Grundgerüst, docker-compose (postgres/minio/mailpit), Staging | F-21 🟢; CI läuft auf PR |
| **WP-1.1** Lead-Persistenz (**erste Implementierungseinheit**, behebt R-01) | `packages/database` (Erstmigration: identity + crm-Kern + platform), `apps/platform` mit `POST /api/v1/leads`, Website-Proxy, E-Mail-Notify (SMTP Hostinger), Admin-Lead-Liste mit Login | F-01 🟢; kein console.log-Pfad mehr |
| WP-1.2 Mandanten/Rollen/Audit | better-auth + Organizations, Rollen/Permissions/Scopes (`packages/permissions`), AuditEvent, Einladungen | F-02, F-19, F-20 🟢 |
| WP-1.3 Immobilienstruktur + CRM | Property→Unit-Baum, CSV-Import, Lead-Qualifizierung → Customer/Property, Notizen/Aufgaben | F-03 🟢 |
| WP-1.4 Events/Worker | Outbox, pg-boss, Handler-Registry, Notification-Grundgerüst | Idempotenz-Tests grün |

### Phase 2 — Onboarding-Engine ⚪ → [ONBOARDING_ENGINE.md](ONBOARDING_ENGINE.md) · Gate F-04
### Phase 3 — Documenso ⚪ → [DOCUMENSO_INTEGRATION.md](DOCUMENSO_INTEGRATION.md) · Gates F-05, F-06 (inkl. Staging-Server-Betrieb)
### Phase 4 — Hub- & Device-Registry ⚪ → [DEVICE_AND_HUB_PLATFORM.md](DEVICE_AND_HUB_PLATFORM.md) · Gates F-07, F-08
### Phase 5 — Monteur-PWA ⚪ · Gates F-09, F-10
### Phase 6 — Powermieter ⚪ (inkl. WP-6.0 Angebots-Minimal + Portal-Basis) · Gates F-11, F-12 · **Pilotobjekt**
### Phase 7 — Smokemieter ⚪ · Gate F-13
### Phase 8 — Heatmieter ⚪ · Gates F-14, F-15
### Phase 9 — Chargemieter ⚪ · Gate F-16 (OCPP-ADR zu Beginn)
### Phase 10 — Commercial-Vollausbau & Lexoffice ⚪ → [LEXOFFICE_INTEGRATION.md](LEXOFFICE_INTEGRATION.md) · Gates F-17, F-18

Release-Zuschnitt: [RELEASE_PLAN.md](RELEASE_PLAN.md).

## 11. Priorisierte nächste Aufgaben (verbindlich)

1. **Masterplan-Freigabe durch Leon** (insb. ADR-001/002-Bestätigung, §13-Entscheidungen O-01/O-02)
2. WP-1.0 Repo-Fundament (Voraussetzung für alles; enthält R-02-Fix)
3. WP-1.1 Lead-Persistenz (stoppt aktiven Lead-Verlust R-01)
4. WP-1.2 → WP-1.4 in Reihenfolge
5. Parallel (nicht blockierend): fachliche Klärungen O-P1…P4 anstoßen (R-04)

## 12. Definition of Done

Je Bereich: echte Migration · keine Mock-Daten im Produktivpfad · serverseitige Validierung + Berechtigungsprüfung · Audit-Logging · Fehler-/Lade-/Leerzustände · mobile Prüfung · automatisierte Tests ([TEST_STRATEGY.md](TEST_STRATEGY.md)) · keine beschädigten Bestandsfunktionen (F-21) · aktualisierte Doku · aktualisierter Masterplan. End-to-End-Definitionen je Modul: [E2E_TEST_MATRIX.md](E2E_TEST_MATRIX.md) F-05, F-11…F-18.

## 13. Offene Entscheidungen

| ID | Entscheidung | Frist/Phase | Status |
|---|---|---|---|
| O-01 | ADR-001 App-Schnitt (3 Apps) bestätigen | vor WP-1.0 | offen |
| O-02 | ADR-002 Stack (Postgres/Prisma/better-auth) bestätigen | vor WP-1.1 | offen |
| O-03 | QES-Bedarf einzelner Vertragstypen (Documenso-Grenze) | vor Phase 3-Abschluss | offen |
| O-04 | Medienstrategie Git (LFS/Objektspeicher für neue Kampagnen) | mit WP-1.0 | offen |
| O-P1…P4 | Powermieter-Regulatorik (MSB/SMGW, Preisformel, Lieferantenpflichten, SEPA-Form) | vor Phase 6 | offen |
| O-H1…H3 | Heatmieter-Fachverfahren | vor Phase 8 | offen |
| O-C1…C3 | Chargemieter OCPP/Eichrecht/Förderkatalog | vor Phase 9 | offen |
| O-S1…S2 | Smokemieter Gerätehersteller/Prüfkatalog | vor Phase 7 | offen |

## 14. Risiken

Vollständig in [RISK_REGISTER.md](RISK_REGISTER.md). Top-3 aktuell: R-01 Lead-Verlust (aktiv!), R-02 kein Repo-Backup, R-03 Greenfield-Verzettelung.

## 15. Aktueller Fortschritt

| Bereich (Auftrag §1) | Status |
|---|---|
| Masterplan & Doku-Fundament | 🟢 (dieses Paket, 2026-07-11) |
| 1 CRM · 2 Angebotskonfigurator · 3 Portal · 4 Onboarding · 5 Hubs · 6 Registry · 7 PWA · 8 Documenso · 9 Lexoffice · 10–13 Module · 14 Service · 15 DMS · 16 Notifications · 17 Audit · 18 Identity | ⚪ (Konzepte 🔵 in den verlinkten Dokumenten) |
| Marketing-Site + Funnels (Bestand) | 🟢 produktiv (Lead-Zustellung 🔴 → WP-1.1) |

## 16. Pflegeprozess dieses Plans (verbindlich)

Nach jedem Arbeitspaket: (1) Statusmodell in §10/§15 aktualisieren, (2) [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) ergänzen (inkl. „nicht getestet, warum, Restrisiko"), (3) [E2E_TEST_MATRIX.md](E2E_TEST_MATRIX.md) pflegen, (4) neue Risiken/Entscheidungen in §13/§14 bzw. Register/ADRs, (5) §11 neu priorisieren, (6) Änderungsverlauf §17 ergänzen. Planänderungen nie stillschweigend — immer mit Begründung im Verlauf.

## 17. Änderungsverlauf

| Datum | Version | Änderung | Begründung |
|---|---|---|---|
| 2026-07-11 | 1.0 | Erstfassung: Audit, Zielarchitektur, alle Konzeptdokumente, Phasenplan, ADR-001…005 | Phase-0-Auftrag (Masterprompt). Abweichungen vom Auftrag: App-Schnitt 3 statt 7 Apps (ADR-001); WP-6.0 zieht Angebots-Minimal aus Phase 10 vor (DoD-Konsistenz Powermieter) |
