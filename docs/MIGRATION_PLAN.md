# POWERHOUSE 360 — Migrationsplan

> Status: 🔵 Entwurf v1 (2026-07-11). Besonderheit: Es gibt **keine Bestandsdaten zu migrieren** (keine DB im Ist-Zustand). „Migration" = Repo-Umbau + Bestandsschutz der Website + Anschluss des Lead-Flusses + künftige Stammdaten-Erstbefüllung.

## 1. Repo-Migration → Monorepo (Phase 1, WP-1.0)

Vorbedingungen: Git-Remote einrichten (R-02), `feat/cinematic-funnels-legal` nach `main` mergen (Fast-Forward möglich, 45 Commits), Tag `website-v1` setzen.

Schritte (als ein reviewbarer Umbau, ohne Verhaltensänderung der Website):
1. pnpm + Turborepo einführen; `git mv` der heutigen App nach `apps/website` (Historie bleibt erhalten).
2. Root-`package.json` → Workspaces; Website-Build/Dockerfile-Pfade anpassen (`output: standalone` bleibt).
3. Coolify-Deployment auf neues Build-Kommando umstellen (Staging zuerst); Smoke-Test F-21 (alle Routen + Funnel-Submit auf allen drei Domains).
4. Aufräumen im selben Zug: ungenutzte GSAP-Dependency entfernen ODER bewusst behalten (Entscheidung im PR dokumentieren); Geschäfts-PDFs aus dem Projektordner in geschützte Ablage verschieben (R-09); `.gitignore` um `graphify-out/`, `*-raw.*`-Rohmedien-Policy ergänzen.
5. Medienstrategie festhalten: bestehende 214 MB bleiben vorerst (kein History-Rewrite); **neue** Kampagnen-Medien ab jetzt via Objektspeicher/LFS (R-08).

Rollback: Tag `website-v1` + altes Dockerfile bleiben deploybar, bis Staging-Smoke grün ist.

## 2. Lead-Fluss-Migration (Phase 1, WP-1.1)

Ist: `apps/website /api/leads` → console.log. Ziel: Platform-API persistiert.
1. Platform-App mit `POST /api/v1/leads` (Zod-Validierung = Superset der heutigen Regeln, Honeypot, Rate-Limit) → `Lead` in DB → `lead.created` → E-Mail-Benachrichtigung an Vertrieb.
2. Website-Route `/api/leads` wird zum dünnen Proxy auf die Platform-API (Retry + lokaler Fallback-Log, damit bei Plattform-Ausfall kein Lead verloren geht) — Funnel-Frontend bleibt unverändert.
3. Funnel wertet künftig `?modul=&thema=`-Parameter aus und übergibt sie ins Lead-Payload (kleine Website-Änderung, bereits „vorbereitet").
4. Verifikation: F-01 E2E; erst danach console.log-Pfad entfernen.

## 3. Stammdaten-Erstbefüllung (laufend ab Phase 1)

Quellen sind manuell/CSV, da kein Altsystem existiert:
- Kunden/Objekte aus laufender Akquise → CRM-Formulare + CSV-Import (Property/Building/Unit-Import mit Validierung; Pflicht für Powermieter-„Einheiten importieren").
- Produktkatalog/Preisbuch → Seed-Skript aus gepflegter Quelle (keine Preise im Code).
- Gerätekataloge (`DeviceType`/`DeviceModel`) → Seed je Modul-Phase.
- Vertragsvorlagen → Documenso-Templates + `ContractTemplate`-Registrierung (Startbestand: vorhandener Stromliefervertrag).

Jeder Import: idempotent (natürliche Schlüssel), Probelauf-Modus, Fehlerbericht, Audit-Event.

## 4. Umgebungs- & Betriebs-Migration

| Schritt | Phase |
|---|---|
| docker-compose für lokale Entwicklung (postgres, documenso, minio, mailpit) | 1 |
| Staging-Umgebung auf VPS (eigene Subdomains, eigene DB) | 1 |
| Tägliche Off-Site-Backups DB + MinIO, dokumentierter Restore-Test | 1 (vor ersten echten Daten!) |
| Documenso staging → prod | 3 |
| DNS: app.powerhouse360.de, sign.powerhouse360.de (Hostinger-DNS; Cutover-Stand siehe Memory/VPS-Doku) | 1/3 |
| Middleware-Erweiterung heatmieter.de/powermieter.de (Marketing-Backlog, unabhängig) | Backlog |

## 5. Nicht-Ziele

- Kein History-Rewrite des Git-Repos (Medien bleiben in der Historie).
- Keine Übernahme der Demo-Overlay-Daten der Website in die Plattform (Marketing-Illustration ≠ Daten).
- Keine Big-Bang-Umstellung: Website-Deploy bleibt während des gesamten Umbaus lauffähig; jeder Migrationsschritt ist einzeln rückrollbar.
