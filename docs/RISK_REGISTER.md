# POWERHOUSE 360 — Risikoregister

> Status: lebendes Dokument, Pflege nach jedem Arbeitspaket. Bewertung: Eintrittswahrscheinlichkeit × Auswirkung (H/M/N).

| ID | Risiko | W'keit | Auswirkung | Gegenmaßnahme | Status |
|---|---|---|---|---|---|
| R-01 | **Leads gehen aktuell verloren** (`deliverLead()` = console.log; Container-Neustart löscht selbst Logs) | sicher (Ist-Zustand) | H — Umsatz | WP-1.1 umgesetzt: Persistenz + Audit + Outbox-Benachrichtigung + Website-Proxy, **in Dev verifiziert (F-01)**. In Prod erst nach Deploy der Plattform + Website-Proxy wirksam. | 🟡 in Dev behoben, Prod-Deploy offen |
| R-02 | **Kein Git-Remote / kein Repo-Backup**; Verlust der Workstation = Verlust des Codes | M | H | Privates Remote (GitHub o. ä.) einrichten, Push-Routine; Voraussetzung für CI | 🔴 offen |
| R-03 | Greenfield-Umfang wird unterschätzt (18 Zielbereiche, 0 vorhanden) — Verzettelung über Module | H | H | Strikte Phasenreihenfolge, ein Modul zuerst komplett (Powermieter), Definition of Done je Phase, kein Modul-Hopping | offen |
| R-04 | Regulatorik Mieterstrom/Messstellenbetrieb (EnWG/MsbG, Eichrecht, SMGW/TRuDi) erzwingt Architekturänderungen im Powermieter-Billing | M | H | Fachliche Klärung vor Phase 6 (externe Beratung); Messkonzept-Modell flexibel halten; TRuDi-Handbuch liegt vor | offen |
| R-05 | Documenso-Self-Hosting: Betriebsaufwand, Upgrade-Brüche der API, E-Mail-Zustellbarkeit | M | M | Staging-Instanz zuerst, Version pinnen, Adapter kapselt API, SMTP-Zustellung früh testen | offen |
| R-06 | Lexoffice-API-Limits/Feature-Lücken (z. B. Webhooks/Zahlungsstatus-Granularität) | M | M | Frühzeitiger API-Spike vor Phase 10; Polling-Fallback eingeplant | offen |
| R-07 | Ein-Personen-/Kleinst-Team: Bus-Faktor, Review-Lücken | H | M | Masterplan als externes Gedächtnis, ADRs, CI-Gates, kleine PRs | offen |
| R-08 | Repo-Größe (Medien 214 MB, .git 229 MB) wächst pro Kampagne; Clones/CI langsam | H | N–M | Mittelfristig Git-LFS oder Objektspeicher für Frames; neue Medien nicht mehr ins Repo (Entscheidung vor Phase 1-CI) | offen |
| R-09 | Sensible Geschäfts-PDFs unversioniert im Projektordner (Verlust/Verwechslung) | M | N | In geschützte Ablage (Portal-Dokumentenmanagement sobald vorhanden; bis dahin Cloud-Ablage) verschieben | offen |
| R-10 | Webhook-/Sync-Fehler erzeugen falsche Vertrags-/Rechnungszustände | M | H | Idempotente Inbox, Statusmaschinen mit legalen Übergängen, Verifikations-Reads, Audit (siehe Integrationsdokumente) | mitigiert im Design |
| R-11 | Offline-PWA-Synchronisierung (Konflikte, verlorene Erfassungen auf Baustelle) | M | M | Signierte Queue, Konfliktregeln, E2E-Test F-10; Phase 5 nicht vor stabiler Registry | offen |
| R-12 | Telemetrie-Volumen sprengt Postgres-Dimensionierung der VPS | N (früh) → M (Skalierung) | M | Materialisierte States, Rollierung, Partitionierung/Timescale-Option; Metriken beobachten | beobachten |
| R-13 | OCPP/Hersteller-Anbindung Wallboxen komplexer als geplant (CSMS-Frage) | M | M | ADR + Spike in Phase 9; Adapter-Grenze schützt Fachlogik | offen |
| R-14 | Ein-VPS-Betrieb: DB, Plattform, Documenso, Storage teilen sich eine Maschine (Ausfall = Totalausfall) | M | H | Tägliche Off-Site-Backups (DB+Storage), dokumentiertes Restore, Monitoring; zweite VPS ab Produktivkunden | offen |
| R-15 | DSGVO-Pflichten (VVT, AVV, Löschkonzept) bremsen Go-Lives, wenn spät begonnen | M | M | Pro Phase DSGVO-Checkpunkt in Definition of Done; VVT ab Phase 6 Pflicht | offen |
| R-16 | Marketing-Site-Regression durch Monorepo-Umbau | M | M | Umbau als reiner Move ohne Codeänderung, Smoke-Test F-21, Deploy-Pfad erst umstellen, wenn Staging grün | offen |

## Ausgetretene Risiken / Entscheidungen daraus
*(noch keine)*
