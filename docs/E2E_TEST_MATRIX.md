# POWERHOUSE 360 — E2E-Testmatrix

> Status je Fluss: ⚪ Nicht begonnen · 🔵 Analysiert · 🟡 In Arbeit · 🟠 Blockiert · 🟣 Implementiert, nicht verifiziert · 🟢 End-to-End verifiziert · 🔴 Fehlerhaft.
> Ein Bereich des Masterplans wird erst 🟢, wenn seine Flüsse hier 🟢 sind. Aktualisierung nach jedem Arbeitspaket.

## Kernflüsse

| # | Fluss | Schritte (Kurzform) | Phase | Status | Zuletzt getestet |
|---|---|---|---|---|---|
| F-01 | Lead-Eingang | Funnel (/demo, /projekt-besprechen) → POST /api/v1/leads → Lead in DB → im CRM sichtbar → Benachrichtigung Vertrieb | 1 | ⚪ | — |
| F-02 | Mandant & Rollen | Org anlegen → User einladen → Rolle+Scope → Zugriff nur im Scope (Negativtest Cross-Tenant) | 1 | ⚪ | — |
| F-03 | Lead → Kunde/Objekt | Lead qualifizieren → Customer+Property ohne Doppelerfassung → Audit-Trail | 1 | ⚪ | — |
| F-04 | Onboarding generisch | Template versionieren → Workflow instanziieren → Schritte (form/document/approval) → Blocked/Exception → Ready for Activation | 2 | ⚪ | — |
| F-05 | Vertragsprozess (Documenso) | Vertragsdaten → Template → Documenso-Dokument → 2 Unterzeichner in Reihenfolge → Webhook (inkl. Duplikat-Replay) → signed → finales PDF+Hash → Onboarding-Schritt zu | 3 | ⚪ | — |
| F-06 | Vertrags-Fehlerpfad | declined/expired → contract.failed → Schritt offen, Task erzeugt, manueller Neustart | 3 | ⚪ | — |
| F-07 | Hub & Gerät | Hub-Enrollment → Gerät registrieren (Dubletten-Negativtest) → Zuordnung → Heartbeat → offline-Erkennung → Alarm → Ticket | 4 | ⚪ | — |
| F-08 | Ingest-Idempotenz | Messwert-Batch doppelt senden → genau einmal wirksam; raw→validated Kette | 4 | ⚪ | — |
| F-09 | Monteur-Provisionierung | WorkOrder → PWA: scannen → validieren → Einbauort → Funktionstest → Foto → Protokoll → Gerät installed (Negativtest: ohne Funktionstest) | 5 | ⚪ | — |
| F-10 | PWA offline | Auftrag offline abarbeiten → Sync → Konfliktfall sichtbar | 5 | ⚪ | — |

## Modulflüsse (Definition of Done des Masterprompts)

| # | Fluss | Schritte | Phase | Status |
|---|---|---|---|---|
| F-11 | Powermieter komplett | Lead → Angebot → Annahme → Vertrag (Documenso) → Projekt → HV-Onboarding → Bewohner-Einladung → SEPA → Stromvertrag (Documenso) → technische Freigabe → Modul aktiv | 6 | ⚪ |
| F-12 | Powermieter Billing Readiness | Zählerstatus + Tarifversion + signierte Verträge → Readiness-Prüfung → Aktivierung | 6 | ⚪ |
| F-13 | Smokemieter komplett | Projekt → Betreibervertrag → Geräteplanung → Installation → Funktionstest → Aktivierung → Störung (Demontage) → Ticket → Austausch → Abschluss | 7 | ⚪ |
| F-14 | Heatmieter komplett | Projekt → Vertrag → Geräteimport → Installation → Messwert → Validierung → Nutzerwechsel → Abrechnungsdatensatz | 8 | ⚪ |
| F-15 | Heatmieter Nutzerwechsel | Zwischenablesung → Bewohnerwechsel → getrennte Verbrauchszuordnung | 8 | ⚪ |
| F-16 | Chargemieter komplett | Lead → Förderberatung → Angebot → Vertrag → Planung → Installation → Nutzer-Einladung → Nutzungsvertrag → Test-Ladevorgang → Abrechnungsdatensatz | 9 | ⚪ |
| F-17 | Angebot & Portal | Konfigurator → Angebot mit Varianten → Portalzugang → Vergleich → Annahme → Projekt automatisch → Portal wird Projektportal | 10 | ⚪ |
| F-18 | Lexoffice | Leistung → InvoiceRequest → Lexoffice-Rechnung → Nummer/Belegstatus zurück → Zahlungsstatus → Doppelauslösungs-Negativtest → Fehlerpfad + manueller Retry | 10 | ⚪ |

## Querschnittsflüsse

| # | Fluss | Phase | Status |
|---|---|---|---|
| F-19 | Audit-Vollständigkeit: Vertragsstatuswechsel, Downloads, Rollenänderungen, Retries erscheinen im Audit-Log | 1+ | ⚪ |
| F-20 | Berechtigungs-Negativmatrix: je Rolle 3 verbotene Aktionen → 403 | 1+ | ⚪ |
| F-21 | Bestandsschutz Marketing-Site: powerhouse360.de/chargemieter.de/smokemieter.de unverändert erreichbar nach Monorepo-Umbau (Smoke-Test aller Routen + Funnel-Submit) | 1 | ⚪ |
