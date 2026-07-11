# POWERHOUSE 360 — Deployment (Hostinger VPS + Coolify)

> Stand 2026-07-11. Monorepo-Prod-Deploy. Betrieb: Hostinger-VPS, Coolify, Deutschland.
> **Secrets werden ausschließlich auf dem Server gesetzt** (`.env`), nie im Repo.

## Artefakte (im Repo, verifiziert)

| Datei | Zweck |
|---|---|
| `apps/website/Dockerfile` | Website-Image (Next standalone, alpine). Context = Repo-Root |
| `apps/platform/Dockerfile` | Plattform-Image (Next standalone + Prisma, debian-slim) |
| `apps/worker/Dockerfile` | Worker-Image (tsx + Prisma) |
| `docker-compose.prod.yml` | Gesamtstack: postgres + migrate(one-shot) + platform + worker + website |
| `.env.prod.example` | Vorlage der Server-Secrets |

Alle drei Images bauen mit **Build-Context = Repo-Root**:
```bash
docker compose -f docker-compose.prod.yml build
```

## Deploy-Schritte auf dem VPS

Voraussetzung: Code liegt auf dem VPS. Da (noch) **kein Git-Remote** existiert, per Archiv:
```bash
# lokal:
git archive --format=tar.gz -o ph360.tar.gz HEAD
scp ph360.tar.gz USER@VPS:/opt/ph360/
# auf dem VPS:
mkdir -p /opt/ph360/app && tar -xzf /opt/ph360/ph360.tar.gz -C /opt/ph360/app
cd /opt/ph360/app
cp .env.prod.example .env      # dann Secrets eintragen (siehe unten)
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```
`migrate` läuft als One-shot vor platform/worker und wendet `prisma migrate deploy` an. Danach einmalig den Seed (Powerhouse-Org):
```bash
docker compose -f docker-compose.prod.yml run --rm worker pnpm --filter @ph360/database seed
```

### Secrets (DU setzt sie — ich darf das nicht)
In `/opt/ph360/app/.env` gemäß `.env.prod.example`: `POSTGRES_PASSWORD`, identisches Passwort in `DATABASE_URL`/`DIRECT_DATABASE_URL`, `PLATFORM_INGEST_TOKEN` (`openssl rand -hex 32`), `ADMIN_BASIC_PASSWORD`, `SMTP_*` (Hostinger-Postfach).

### Domains / Reverse-Proxy (Coolify)
- `powerhouse360.de` (+ chargemieter.de, smokemieter.de) → Service **website** :3000
- `app.powerhouse360.de` → Service **platform** :3100
- `platform` und `postgres` NICHT öffentlich exponieren außer `app.` (Admin). `PLATFORM_API_URL=http://platform:3100` bleibt intern.
- In Coolify entweder dieses Compose importieren oder je Service eine Application anlegen (Dockerfile-Pfad + Root-Context).

## Cutover-Reihenfolge (bricht die Live-Site nicht)
1. Neuen Stack bauen & starten (oben), **noch ohne** Domain-Umhängen.
2. `website`-Container intern prüfen (`curl` gegen den Container: `GET /` = 200; ein Funnel-`POST /api/leads` → Lead im `platform`-Admin `app.…/admin/leads`).
3. Erst dann in Coolify die Domains vom alten Website-Container auf den neuen `website`-Service umhängen.
4. Alten Single-App-Container stoppen, wenn der neue trägt. Rollback = Domains zurückhängen.

## Bekannte Blocker / Hinweise
- **DNS:** Cutover Cloudflare→Hostinger-NS war offen (siehe VPS-Deploy-Notiz). Prüfen, dass die Domains tatsächlich auf den VPS zeigen, bevor umgehängt wird.
- **R-01 in Prod** ist erst geschlossen, wenn `platform`+`postgres`+`worker` laufen UND die neue `website` (mit Proxy-Route) live ist.
- **Kein Git-Remote (R-02):** Archiv-Deploy oben; für Coolify-Git-Deploy zuerst Remote einrichten.
- `apps/platform/src/middleware.ts` (Basic-Auth) ist interim → WP-1.2 better-auth.
