# ADR-006 — Test- und Seed-Mandant

Status: **angenommen** (Vorgabe Masterprompt V2, 2026-07-12) · Umsetzung: WP-1.2 (Seed) / fortlaufend

## Entscheidung
- Es existiert ein **dauerhafter, klar gekennzeichneter Testmandant** (Organization mit `type`-Kennzeichnung bzw. eindeutigem Namen „TEST — …") mit realistischen Seed-Daten (Pilot-ähnliche Struktur: Property → Buildings → 21 Units, Teilnehmer, Geräte-Dummies je Phase).
- **E2E-Tests laufen ausschließlich gegen diesen Mandanten.** Produktivmandanten enthalten niemals Testdaten. Damit ist der Widerspruch „keine Mock-Daten in Produktivflüssen" vs. „verpflichtende E2E-Tests" aufgelöst.
- **Testinfrastruktur** (integriert aus WP-1.2-Design): Integrationstests laufen gegen eine dedizierte Datenbank `ph360_test` auf dem lokalen compose-Postgres (Port 5433) via Vitest (`packages/testing`: db-Harness, Global-Setup, Factories); CI nutzt denselben Mechanismus (sobald Remote/CI existiert, R-02).
- Seed ist idempotent; der Testmandant wird auch auf Staging eingespielt, nie auf Prod ohne Kennzeichnung.

## Konsequenzen
+ Reproduzierbare E2E-Flüsse (F-01…F-21) ohne Verschmutzung echter Daten; realistische Demo-Umgebung gratis.
− Seed-Pflege je neuer Domäne gehört zur Definition of Done jedes Arbeitspakets.
