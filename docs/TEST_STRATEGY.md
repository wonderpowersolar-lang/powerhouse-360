# POWERHOUSE 360 — Teststrategie

> Status: 🔵 Entwurf v1 (2026-07-11). Ist-Zustand: **null automatisierte Tests, keine CI**. Diese Strategie ist ab Phase 1 verbindlich; jede Phase liefert ihre Tests mit (Definition of Done).

## 1. Testpyramide & Werkzeuge

| Ebene | Werkzeug | Gegenstand | Pflicht ab |
|---|---|---|---|
| Statisch | TypeScript strict, ESLint (+ eslint-boundaries für Kontextgrenzen) | Typfehler, verbotene Importe, fehlende Route-Deklarationen | Phase 1 |
| Unit | Vitest | Domain-Services, Scoring, Statusmaschinen (Vertrag, Onboarding, Device-Lifecycle), Feldmapping-Validierung | Phase 1 |
| Integration | Vitest + Testcontainers (PostgreSQL) | Repositories mit echten Migrationen, Org-Scope-Guards, Outbox/Handler-Idempotenz, Webhook-Inbox | Phase 1 |
| Contract/Adapter | Vitest + aufgezeichnete Fixtures; Documenso: echte Staging-Instanz | documenso-adapter, lexoffice-adapter (Fehlerklassen, Retry, Idempotenz) | Phase 3 / 10 |
| E2E | Playwright (echter Test-Runner, nicht die bisherigen Diagnose-Skripte) | kritische Nutzerflüsse lt. [E2E_TEST_MATRIX.md](E2E_TEST_MATRIX.md) gegen Staging/lokalen Stack | Phase 1 (Funnel→CRM), wächst je Phase |
| Visual-QA | bestehende `scripts/*.cjs` (Marketing-Site) | Scroll-Kino-Regressionen — bleibt manuelles Werkzeug, wird nicht CI-Pflicht | Bestand |

Zielgrößen: Domain-Services ≥ 80 % Zweigabdeckung; kritische Statusmaschinen 100 % Übergangs-Abdeckung (inkl. illegaler Übergänge); jede API-Route mindestens ein Positiv- + ein Berechtigungs-Negativtest.

## 2. Grundregeln

1. **Keine erfundenen Tests, keine erfundenen Ergebnisse.** Was nicht getestet werden konnte, wird im [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) dokumentiert: was getestet wurde, was nicht, warum nicht, Restrisiko, nächster Schritt.
2. **Reproduzierbar:** Tests laufen lokal (`docker-compose` für Postgres/Documenso) und in CI identisch; Seeds/Factories in `packages/testing`.
3. **Keine Mock-Daten in Produktivpfaden** — Mocks nur in Testcode; Adapter-Tests nutzen Sandbox-/Staging-Instanzen (Lexoffice-Testorganisation, eigene Documenso-Staging-Instanz).
4. **Ein Bereich wird erst 🟢**, wenn der vollständige relevante Nutzerfluss (E2E-Matrix-Zeile) tatsächlich ausgeführt wurde — automatisiert oder dokumentiert manuell.
5. **Migrationstests:** jede Prisma-Migration läuft in CI gegen leere DB + gegen Seed-Bestand (up), Rollback-Strategie dokumentiert.

## 3. CI-Pipeline (einzurichten in Phase 1, GitHub Actions o. ä. — erfordert Git-Remote, R-02)

```
lint → typecheck → unit → integration (Testcontainers) → build (turbo) → e2e (kritische Flüsse) → artefakt/deploy staging
```

- PR-Gate: lint+typecheck+unit+integration Pflicht; E2E nightly + vor Release.
- `npm audit`/Dependency-Scan wöchentlich.
- Deploy nach prod nur von `main` nach grünem Staging-E2E-Lauf.

## 4. Modulübergreifende Spezialfälle (müssen explizit getestet werden)

- **Idempotenz:** doppelter Documenso-Webhook, doppelter Lexoffice-Job, doppelter Hub-Batch — jeweils exakt eine Wirkung.
- **Berechtigungen:** Mandanten-Crossover-Versuche (HV A liest Objekt von HV B → 403 + Audit), Bewohner liest fremde Unit.
- **Statusmaschinen:** illegale Übergänge werden abgewiesen (Vertrag `signed` ohne Webhook-Bestätigung unmöglich).
- **Offline-PWA:** Queue-Replay nach Verbindungsabbruch, Konfliktfall.
- **Messwertketten:** raw → validated → substitute; Finalisierungs-Snapshot ändert sich nicht bei Nachkorrektur.
- **Onboarding-Gates:** Bewohner-Onboarding startet nicht vor Abschluss des Projekt-Onboardings; Exception-Pfad auditiert.
