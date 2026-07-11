# ADR-005 — Bounded Contexts als Packages, erzwungen per Lint

Status: vorgeschlagen (2026-07-11) · Kontext: Phase 1

## Entscheidung
- Fachlogik lebt in `packages/domain/<context>` (crm, commercial, contracts, onboarding, projects, devices, billing, module-powermieter, module-heatmieter, module-chargemieter, module-smokemieter) — nicht in Apps, nicht in einem `/modules`-Top-Level.
- Import-Regeln werden mit **eslint-boundaries** erzwungen: Fachmodule importieren nur Kern-Kontexte und nie einander; Adapter nur von contracts/billing/devices; Apps nur `packages/*`-Öffentliches.
- Jeder Kontext exportiert Services über einen `index.ts` (öffentliche API); interne Dateien sind tabu (Lint-Regel).
- Cross-Kontext-Reaktionen laufen über Domain-Events (ADR-004), nicht über direkte Aufrufe in fremde Interna.

## Begründung
Der Masterprompt verlangt klare Domänengrenzen bei gleichzeitigem Monolith. Ordner-Konventionen ohne Erzwingung erodieren; Lint-Gates machen die Grenze zum Build-Kriterium und halten spätere Extraktion (z. B. Ingest-Service) realistisch.

## Konsequenzen
+ Architektur bleibt prüfbar statt dokumentiert-aber-ignoriert.
− Initialer Setup-Aufwand der Regeln; gelegentliche Reibung bei Querschnittsbedarf → dann bewusst Kern-Kontext erweitern statt Grenze aufweichen.
