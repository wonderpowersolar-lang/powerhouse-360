# POWERHOUSE 360 — Mobile App

Ordner für die App-Entwicklung (Mobile App / Kunden-App).

## Status

🟡 Neu angelegt — noch kein Code. Tech-Stack und Scope sind noch nicht festgelegt.

## Einordnung ins Monorepo

Dieser Ordner liegt unter `apps/*` und wird damit automatisch Teil des
pnpm-Workspace, sobald hier eine `package.json` existiert.

Bestehende Apps im Monorepo:

- `apps/website` — öffentliche Website (powerhouse360.de)
- `apps/platform` — Admin/CRM + Kundenportal + Bewohnerportal + Monteur-PWA (app.powerhouse360.de)
- `apps/worker` — Hintergrund-Jobs (Outbox-Dispatcher → E-Mail)

## Nächste Schritte

1. Scope klären: Was soll die App können, für wen (Kunden, Bewohner, Monteure)?
2. Tech-Stack entscheiden (z. B. React Native / Expo vs. PWA-Ausbau von `apps/platform`)
3. Projekt scaffolden (`package.json` anlegen → Workspace-Paket)
