# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Intern (AKL/Wonderpower):** Vertrieb und technischer Betrieb arbeiten in der Plattform (Admin/CRM: Leads, Kunden, Objekte, Zugriffsbereiche, Audit).
- **Kunden:** Hausverwaltungen, WEGs und Eigentümer von Mehrfamilienhäusern — evaluieren über die Marketing-Site, beauftragen, nutzen später Portale.
- **Bewohner:** nutzen die Powermieter-App (native SwiftUI, eigene Design-Referenz in `apps/mobile/design-reference/`) für Verbrauch, Abrechnung, Status.
- **Monteure:** Monteur-PWA (geplant, Teil der Plattform-Roadmap).

## Product Purpose

POWERHOUSE 360 ist das **Betriebssystem für Mehrfamilienhäuser**: eine modulare Plattform, auf der Vertrieb, Kunden, Bewohner, Monteure und Betrieb mit denselben Daten arbeiten — über die volle Kette Lead → Qualifizierung → Angebot → Vertrag (Documenso) → Projekt → Installation → Modulbetrieb → Abrechnung → Rechnung (Lexoffice B2B / interne Billing-Engine). Erfolg heißt aktuell: der kommerzielle Durchstich dieser Kette (Commercial-first, ADR-012), verifiziert am Powermieter-Pilot.

## Positioning

**Ein Datenmodell für alles.** Kein Prozessschritt erfasst Stammdaten doppelt — Vertrieb, Betrieb, Bewohner und Abrechnung laufen auf derselben Quelle der Wahrheit (eine PostgreSQL, Prisma-Schema in `packages/database`). Das ist der Anspruch, den ein Wettbewerber mit zusammengekauften Einzeltools nicht ehrlich kopieren kann.

## Operating Context

- Monorepo (pnpm + Turborepo): `apps/website` (Marketing, Next.js 16 „Scroll-Kino"; Domains powerhouse360.de, chargemieter.de, smokemieter.de), `apps/platform` (Admin/CRM, Portale, `/api/v1`), `apps/worker` (Outbox, Syncs), `apps/mobile` (SwiftUI-Bewohner-App).
- Module mit fester Priorität: **Powermieter P1** (erste Modul-Nutzlast, Pilot = Abschlusskriterium Phase 8), **Smokemieter P2**, **Heatmieter/Chargemieter P3** (nur Datenmodell).
- Masterplan `docs/POWERHOUSE_360_MASTER_PLAN.md` ist Planungsgrundlage; vor Plattform-Arbeit lesen, nach jedem Arbeitspaket pflegen.

## Capabilities and Constraints

- Arbeit an P2/P3-Modulen vor Powermieter-Aktivierung ist eine **Planabweichung** und braucht ausdrückliche Freigabe.
- Terminologie: die Modulmarken heißen Powermieter, Heatmieter, Chargemieter, Smokemieter („Gerätemiete statt Investition" als Modell); Träger ist die Dachmarke POWERHOUSE 360.
- Marketing-Backlog (bekannt, offen): `/powermieter`-Seite fehlt auf der Website.
- Design-System: vier Kernkomponenten + Token-Set sind als claude.ai/design-Projekt synchronisiert (`.design-sync/`, Re-Sync via Driver — siehe `.design-sync/NOTES.md`).

## Brand Commitments

- Dachmarke **POWERHOUSE 360** mit Logo-Verlauf Blau → Teal → Grün; Assets im Repo-Root (`POWERHOUSE 360.svg` u. a.) und `apps/website/public/brand/`.
- **Die im Code etablierte Web-Welt ist führend** (bestätigt 2026-08-14): Off-Black-Noir fürs Marketing, helle App-Welt für Produkt-UI (`theme-light`-Scope), Sora als Schrift, Verlauf als zentrales Akzentmittel. `PowerHouse360 - V1 - Brand - GuideLines.pdf` ist historische Referenz, nicht bindend.
- Sprache der Produkte und Inhalte: Deutsch.

## Evidence on Hand

- **Pilotprojekt öffentlich nennbar** (bestätigt 2026-08-14): WEG Christinenstraße 36 / Lottumstraße 22, Berlin — Hausverwaltung Hennings, Betriebskonzept AKL Powerhouse 360, 21 Messstellen.
- Rechtliches/Reales im Repo-Root: Stromliefervertrag (final), HRB-Auszug, Transparenzregister-Unterlagen.
- Website-KPIs (`apps/website/src/content/*.ts`) sind **glaubwürdige Demo-Zustände**, keine echten Kundenzahlen. Es gibt bisher keine Testimonials, Kundenlogos oder Fallstudien — künftige Design-Arbeit darf keine erfinden.

## Product Principles

1. **Commercial-first:** der kritische Pfad Lead → Vertrag → Betrieb schlägt jeden Ausbau (ADR-012).
2. **Keine Doppelerfassung:** jede neue Fläche arbeitet auf dem gemeinsamen Datenmodell, nie auf einer Insel.
3. **Module sind Marken, keine Silos:** eigene Namen und Akzente, dieselben Daten und Prozesse.
4. **Nur echte Belege:** der Pilot ist nennbar; alles andere bleibt erkennbar Demo — nichts wird erfunden.
5. **Zwei Welten, eine Marke:** Noir überzeugt (Marketing), die helle App-Welt arbeitet (Produkt) — beide aus denselben Tokens.
