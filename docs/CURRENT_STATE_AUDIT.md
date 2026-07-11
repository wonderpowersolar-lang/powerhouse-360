# POWERHOUSE 360 — Bestandsaufnahme (Ist-Zustand)

> Stand: 2026-07-11, Branch `feat/cinematic-funnels-legal` (45 Commits vor `main`, `main` ohne eigene Commits — Fast-Forward möglich). Kein Git-Remote konfiguriert.

## 1. Executive Summary

Das Repository ist eine **hochwertige, rein clientseitige Marketing-Website** („Scroll-Kino") für POWERHOUSE 360 und drei der vier Fachmodule — **keine Plattform**. Es existieren: **keine Datenbank, keine Authentifizierung, kein CRM, kein Portal, keine Integrationen (Documenso/Lexoffice/IoT), keine Tests, keine CI/CD**. Die einzige Server-Funktionalität ist eine Lead-API, die eingehende Leads **nur nach `console.log` schreibt — Leads gehen aktuell verloren** (kritisch, siehe RISK-Register R-01).

Konsequenz für den Masterplan: Der Plattformaufbau ist **kein Refactoring, sondern ein Greenfield-Aufbau neben einer zu erhaltenden Marketing-Site**. „Migration" bedeutet: Monorepo-Umbau, Erhalt der Website als eigene App, Anschluss der bestehenden Funnels an das neue CRM.

## 2. Technischer Stack (Ist)

| Bereich | Befund |
|---|---|
| Framework | Next.js 16.2.7 (App Router, TypeScript), React 19.2.4, Tailwind v4 |
| Animation | Lenis Smooth-Scroll + eigene rAF-Progress-Stores (`src/lib/*Progress.ts`). GSAP ist Dependency, wird aber **nirgends importiert**. R3F/three vorhanden, aber Legacy (`STAGE="cinema"` statt `"r3f"` in `src/config/stage.ts`) |
| Server | `output: "standalone"`, Docker Multi-Stage (node:20-alpine), Deploy via Coolify auf Hostinger-VPS (powerhouse360.de) |
| Persistenz | **keine** (kein ORM, keine DB, keine .env-Dateien; einzige env-Nutzung: `NODE_ENV`) |
| Auth | **keine** |
| E-Mail | **keine** |
| Tests | **keine** (Playwright nur als manuelle Visual-QA-Skripte in `scripts/*.cjs`, ohne Assertions/CI) |
| CI/CD | **keine** (kein `.github/`, Deploy manuell/Container) |

## 3. Routen & Funktionsumfang

| Route | Inhalt |
|---|---|
| `/` | Startseiten-Scroll-Journey, 9 Stationen (Hero → System → 4 Module → Exploded → Platform → CTA), Quiet Sections, datengetrieben aus `src/content/sections.ts` |
| `/heatmieter` · `/chargemieter` · `/smokemieter` | Cinematische Modul-One-Pager (fixe Medien-Bühne + scrollende Panels), Content in `src/content/*.ts` |
| **`/powermieter`** | **existiert nicht** — Powermieter nur als Station der Startseite und Funnel-Option |
| `/demo` | `DemoRequestFunnel` (7 Schritte, geführte Demo-Anfrage) |
| `/projekt-besprechen` | `ProjectRequestFunnel` (8 Schritte, inkl. Lead-Scoring/Live-Insights, `src/lib/funnel/scoring.ts`) |
| `/impressum` · `/datenschutz` | Rechtsseiten (AKL Powerhouse 360 GmbH, HRB 286461 B). **AGB fehlen.** Datenschutzerklärung beschreibt CRM/Portal bereits prospektiv |
| `/api/leads` | Einzige API-Route (POST): Validierung (E-Mail-Regex, Pflicht-Consents, Honeypot), dann `deliverLead()` = **nur `console.log`** |
| Middleware | Host-Rewrites: `chargemieter.de`→`/chargemieter`, `smokemieter.de`→`/smokemieter`. Kein Mapping für `heatmieter.de`/`powermieter.de` |

Fehlende Framework-Basics: `not-found`, `error`, `sitemap`, `robots`, AGB.

## 4. Funnels & Lead-Fluss (Ist)

```
/demo bzw. /projekt-besprechen
  → Client-Funnel (sessionStorage-Zwischenstand, Scoring, Insights)
  → POST /api/leads (Validierung, Consents, Honeypot)
  → deliverLead(): console.log        ← ENDE. Keine Persistenz, kein Versand.
```

Modul-CTAs verlinken mit Query-Parametern (`?modul=…&thema=…`), die der Funnel **noch nicht auswertet** (im Code als „vorbereitet" markiert). Die Funnel-Payloads (`src/lib/funnel/types.ts`) sind gut strukturiert und dienen als Ausgangspunkt für das `Lead`-Datenmodell.

## 5. Inhalte & Assets

- **Content:** vollständig datengetrieben (`src/content/*.ts`, zusammen ~1900 Zeilen). Bewusst **keine Preise/Tarife/€-Beträge** irgendwo — Demo-Dashboards zeigen nur illustrative Werte.
- **Medien:** `public/` 214 MB (539 JPG-Frames, 17 MP4). Smokemieter allein 119 MB. `.git` bereits 229 MB — Medien im Git sind ein wachsendes Problem (R-08).
- **Wissensgraph:** `graphify-out/` (1856 Nodes, 93 Communities) — bestätigt: Projektschwerpunkt ist Medien/Story, einziger stark vernetzter Code-Knoten ist die R3F-Generierung.
- **Root-Dateien (untracked):** Geschäfts-PDFs (u. a. `Stromliefervertrag_POWERHOUSE360_final.pdf` — künftige Documenso-Vorlage!, TRuDi-Handbuch, Brand Guidelines, HR-Auszug). Nicht im Git, aber im Arbeitsverzeichnis — gehören in einen geschützten Ablageort (R-09).
- **Vorhandene Doku:** `docs/DESIGN-DIRECTION.md` (kanonisches Design-Dokument der Website), `docs/superpowers/` (Umsetzungspläne/Specs der Modul-Seiten), `docs/design/mood/`.

## 6. Abgleich mit dem Zielbild (Masterprompt)

| Zielbereich | Ist-Zustand |
|---|---|
| 1 Internes CRM | ⚪ nicht vorhanden (nur Lead-API ohne Persistenz) |
| 2 Angebotskonfigurator | ⚪ nicht vorhanden |
| 3 Kunden-/Projektportal | ⚪ nicht vorhanden (nur Demo-Overlays im Marketing) |
| 4 Onboarding-Engine | ⚪ nicht vorhanden |
| 5 Hub-/Flottenverwaltung | ⚪ nicht vorhanden (Hub existiert nur als 3D-Modell/Produktfilm) |
| 6 Device Registry | ⚪ nicht vorhanden |
| 7 Monteur-PWA | ⚪ nicht vorhanden |
| 8 Documenso | ⚪ nicht vorhanden (keine Code-Spur); Vertrags-PDF-Vorlage liegt als Datei vor |
| 9 Lexoffice | ⚪ nicht vorhanden |
| 10–13 Fachmodule | ⚪ als Software nicht vorhanden; als Marketing-Stories 🟢 (3 von 4; Powermieter ohne eigene Seite) |
| 14 Service/Tickets | ⚪ nicht vorhanden |
| 15 Dokumentenmanagement | ⚪ nicht vorhanden |
| 16 Benachrichtigungen | ⚪ nicht vorhanden |
| 17 Audit-Log | ⚪ nicht vorhanden |
| 18 Benutzer-/Rollen-/Mandantenverwaltung | ⚪ nicht vorhanden |
| Landingpage/Funnels (Lead-Quelle) | 🟢 vorhanden und hochwertig — einzige produktive Komponente |

## 7. Stärken, auf denen aufgebaut wird

1. **Lead-Funnel-UX und -Payloadstruktur** sind durchdacht (Scoring, Consents, Honeypot) — direkte Grundlage für das CRM-Lead-Modell.
2. **Content-als-Daten-Disziplin** (keine hart codierten Preise, zentrale Content-Dateien) passt zum Plattform-Prinzip.
3. **Deployment-Pfad existiert** (Docker/Coolify/Hostinger, Standalone-Build) und trägt auch die Plattform-Apps.
4. **Marke, Story und Rechtsseiten** sind produktionsreif; die Datenschutzerklärung antizipiert CRM/Portal bereits.

## 8. Technische Schulden / Sofortbefunde

| # | Befund | Schwere |
|---|---|---|
| 1 | Leads werden nicht persistiert/zugestellt (`deliverLead()` = console.log) | 🔴 kritisch |
| 2 | Kein Git-Remote → kein Off-Site-Backup des Repos | 🔴 kritisch |
| 3 | `main` 45 Commits hinter Arbeitsbranch; kein Merge-/Release-Prozess | 🟠 hoch |
| 4 | Keine Tests, keine CI | 🟠 hoch |
| 5 | 200+ MB Medien im Git (Repo wächst pro Kampagne) | 🟡 mittel |
| 6 | GSAP als ungenutzte Dependency; R3F-Pfad Legacy hinter `STAGE`-Flag | 🟡 niedrig |
| 7 | Middleware ohne heatmieter.de/powermieter.de; `/powermieter`-Seite fehlt | 🟡 niedrig (Marketing-Backlog) |
| 8 | Geschäfts-PDFs unversioniert im Arbeitsverzeichnis | 🟡 mittel (Ablage klären) |
| 9 | AGB-Seite fehlt | 🟡 mittel (vor Portal-Go-Live nötig) |
