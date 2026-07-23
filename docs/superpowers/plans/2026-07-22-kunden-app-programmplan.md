# Kunden-App-Programm — Gesamtplan (Index)

> **For agentic workers:** Dies ist der Programm-Index, KEIN ausführbarer Task-Plan. Pro Arbeitspaket existiert ein eigener ausführbarer Plan (Tabelle unten) — diesen mit superpowers:subagent-driven-development bzw. superpowers:executing-plans abarbeiten. Konvention: **1 WP = 1 Session**, WP fertig erst bei grünem Gate (Masterplan §11/§12).

**Goal:** Bewohner-/Powermieter-Kunden-App (iOS zuerst, TestFlight; Android folgt) als Client der zentralen Powerhouse-360-Plattform — inklusive des dafür nötigen Plattform-Unterbaus (Auth, Objektbaum, Messwertkern, Ingestion, Aggregation, App-API).

**Spec (maßgeblich):** `docs/superpowers/specs/2026-07-22-kunden-app-architekturplan.md` (v0.1.0) + `docs/DECISIONS/ADR-009-telemetrie-ingestion-hub-plattform.md`

---

## Ausführungsreihenfolge

| # | WP | Plan-Datei | Gate | Abhängigkeit |
|---|---|---|---|---|
| 1 | **WP-1.2** Auth/Rollen/Mandanten (Tasks 2–13 + V2-Deltas) | `2026-07-11-wp-1.2-auth-rollen-mandanten.md` (bestehend, maßgeblich) | F-02, F-19, F-20 | — |
| 2 | **WP-1.3-Kern** Immobilien-Objektbaum + Pilot-Seed | `2026-07-22-wp-1.3-kern-immobilien.md` | F-03 (Teil) | WP-1.2 |
| 3 | **WP-APP-1** Messkern + Ingestion + Hub-Simulator | `2026-07-22-wp-app-1-messkern-ingestion.md` | F-08 (Kern) | WP-1.3-Kern |
| 4 | **WP-APP-2** Bewohner-Fachmodell + Aggregation + App-API | `2026-07-22-wp-app-2-aggregation-app-api.md` | F-APP-1 (API) | WP-APP-1 |
| 5 | **WP-APP-3** Mobile-Grundgerüst gegen Mocks *(parallel ab Contract-Freeze in WP-APP-2)* | `2026-07-22-wp-app-3-mobile-grundgeruest.md` | Demo-Build iOS-Simulator | App-Contracts aus WP-APP-2 |
| 6 | **WP-APP-4** Mobile-Integration (echte API, Push, Offline) | `2026-07-22-wp-app-4-mobile-integration.md` | F-APP-1 (E2E) | WP-APP-2 + 3 |
| 7 | **WP-APP-5** Pilot + TestFlight + DSGVO-Abschluss | `2026-07-22-wp-app-5-pilot-testflight.md` | F-APP-2 | WP-APP-4 + PO-Punkte |
| 8 | danach | Android-Beta, V1.1-Backlog (Spec §8 „danach") | — | — |

## Parallel-Track beim PO (terminkritisch, nicht code-blockierend)

1. **Apple Developer Account** (vsl. AKL Powerhouse 360 GmbH — bis Bestätigung keine Festlegung; blockiert nur TestFlight/Push, WP-APP-5)
2. **VPS-Rollout + DNS** (Staging/Prod für App-E2E, WP-APP-4/5)
3. **Git-Remote + CI** (R-02)
4. **Pilotdatenliste** (21 Messstellen, Zähler↔Wohnung-Zuordnung) + **Pilottarife** (WP-APP-2-Seed, WP-APP-5)
5. Google Play Console (erst nach stabiler iOS-Version)

## Verbindliche Regeln für jede Session

- Vor Plattform-Arbeit: Masterplan §10/§14 lesen; nach jedem WP: Masterplan-Status + `IMPLEMENTATION_LOG.md` (append-only) pflegen; 🟢 nur nach tatsächlich durchlaufenem E2E-Fluss.
- Spec und dieser Index sind **lebende Dokumente**: Abweichungen während der Umsetzung werden dort nachgeführt (Änderungsverlauf), nicht stillschweigend umgesetzt.
- Kein `git push` (kein Remote, R-02); Commits je Task gemäß Plan.
- Testdaten nur gegen den Testmandanten (ADR-006); Demo-/Testdaten strikt von Produktivdaten getrennt.

## Änderungsverlauf

| Datum | Änderung |
|---|---|
| 2026-07-22 | Erstfassung (nach Freigabe Architekturplan v0.1) |
