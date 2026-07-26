# Übergabe: WP-APP-1 — Messkern, Ingestion, Hub-Simulator

Startpunkt für eine frische Session. Stand 2026-07-26.

---

## Prompt

> Setze WP-APP-1 um. Der Plan liegt in
> `docs/superpowers/plans/2026-07-22-wp-app-1-messkern-ingestion.md`
> (10 Tasks). Nutze `superpowers:subagent-driven-development` und arbeite
> Task für Task ab.
>
> Bevor du anfängst, lies `docs/HANDOFF-WP-APP-1.md` — dort steht, was sich
> seit Planerstellung geändert hat.

---

## Was der Plan will

Mess-/Gerätekern nach ADR-009: Prisma-Modelle `Hub` … `DeviceAlert`,
idempotente Telemetrie-Ingestion unter `/api/v1/ingest/*` mit Hub-Token-Auth
inkl. Rotation und Revocation, Worker-seitige `DeviceState`-Materialisierung
mit Lückenerkennung, dazu ein deterministischer Hub-Simulator. Gate
**F-08-Kern**.

Neu entstehen `packages/api-contracts`, `packages/ingestion` und
`tools/hub-simulator` (Letzteres macht eine Erweiterung von
`pnpm-workspace.yaml` um `tools/*` nötig, Task 9).

## Vorbedingungen — alle erfüllt

Am 2026-07-26 verifiziert:

| Prüfung | Stand |
|---|---|
| Vitest unit | 10/10 grün |
| Vitest integration (echtes Postgres `ph360_test`) | 29/29 grün |
| `turbo run lint` | 7/7 Pakete grün |
| `turbo run typecheck` | 6/6 Pakete grün |
| Next-Builds Website + Platform | durch |

WP-1.2 (Auth/RBAC) und WP-1.3-Kern (Objektbaum) sind gebaut und migriert; die
im Plan geforderten Factories (`createProperty`, `createBuilding`,
`createEntrance`, `createUnit`) und der Pilotstruktur-Seed existieren.

Dev-Datenbank starten: `docker compose up -d --wait postgres`
(Postgres auf :5433, Dev-DB `ph360`, Test-DB `ph360_test`).

## Seit Planerstellung geändert — WICHTIG

**Der Plan sagt „kein `git push` (kein Remote, R-02)". Das stimmt nicht mehr.**
Es gibt jetzt ein Remote, und es ist **öffentlich**.

Folgen für die Arbeit:
- Vor jedem Push auf Secrets prüfen. Bisher war alles sauber (keine `.env` je
  committet, keine Keys, keine Connection-Strings, keine Server-IPs).
- Default-Branch ist `main`; der alte reine Website-Stand liegt auf
  `legacy-website`. Es gibt keinen offenen PR.
- Ob auf `main` direkt oder auf einem Feature-Branch gearbeitet wird, ist eine
  offene Entscheidung — bei einem Arbeitspaket dieser Grösse spricht viel für
  einen eigenen Branch.

**Die iOS-App hat bereits eine Client-Schicht gegen die noch nicht existierende
App-API.** Sie liegt in `apps/mobile/PowermieterApp/PowermieterApp/API/` und
läuft gegen `MockPowermieterAPI`. WP-APP-1 berührt sie nicht, aber:

**Der `summary`-Contract von WP-APP-2 wurde am 2026-07-26 erweitert** — in
Spec §4.2 (`docs/superpowers/specs/2026-07-22-kunden-app-architekturplan.md`)
*und* im WP-APP-2-Plan. Neu: `recentPower { watts, intervalEnd,
intervalMinutes }`, `today.costCents`, `today.pvKwh`, `today.gridKwh`; `split`
ist als monatsbezogen dokumentiert. `recentPower` heisst bewusst nicht
`livePower`: Bei 15-Minuten-Messung existiert keine momentane Wirkleistung,
geliefert wird der Mittelwert des letzten abgeschlossenen Intervalls. Das ist
für WP-APP-2 relevant, nicht für WP-APP-1 — aber wer den Messkern baut, sollte
wissen, dass die Aggregation später diese Felder bedienen muss.

## Offene Produktentscheidung (nicht Teil von WP-APP-1)

Die App-API ist ausschliesslich bewohnerbezogen (`PowerParticipant`,
`assertParticipantScope`). Die Vermieter- und Verwaltungsansichten der App —
Gebäudeaggregate, Wohneinheiten-Vergleich, Anlagenstatus — haben **keinen**
Contract. Braucht irgendwann eine eigene Entscheidung.

## Umfang

Der Plan hat 3.720 Zeilen und 10 Tasks: Schema, Contracts, Ingestion-Paket,
Hub-Auth mit Token-Rotation, Batch-Idempotenz, Platform-Routen,
Worker-Materialisierung, Simulator, Gate. Deutlich mehr Backend-Substanz als
die vorangegangene Portierung der Mobile-App, die selbst schon mehrere Runden
gebraucht hat. Realistisch mehrere Sessions.

Sinnvoll: Task für Task abarbeiten, nach jedem Task committen, zwischendurch
`/context-save`.
