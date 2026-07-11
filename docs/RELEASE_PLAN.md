# POWERHOUSE 360 — Release-Plan

> Status: 🔵 Entwurf v1 (2026-07-11). Releases folgen den Phasen des [Masterplans](POWERHOUSE_360_MASTER_PLAN.md); jede Phase endet mit einem benannten, deploybaren Stand.

## Release-Zuschnitt

| Release | Inhalt (Kurz) | Nutzbar für | Gate (muss 🟢 sein) |
|---|---|---|---|
| R0 „Fundament" | Monorepo, CI, Staging, DB, Auth, Mandanten/Rollen, Audit, **Lead-Persistenz + CRM-Minimal** | Vertrieb intern | F-01, F-02, F-03, F-19, F-20, F-21 |
| R1 „Onboarding-Engine" | Templates, Workflows, Aufgaben, Einladungen, Fortschritt | Operations intern | F-04 |
| R2 „Verträge" | Documenso self-hosted, Adapter, Vertragsobjekte, Webhooks, Audit | Vertrieb + Kunden (erste echte Signaturen) | F-05, F-06 |
| R3 „Geräte-Fundament" | Hub-/Device-Registry, Ingest, Alarme→Tickets | Operations | F-07, F-08 |
| R4 „Monteur-PWA" | Aufträge, Provisionierung, Protokolle, Offline | Monteure | F-09, F-10 |
| R5 „Powermieter" | Projekt-/Teilnehmer-Onboarding, SEPA, Stromvertrag, Tarife, Billing Readiness, Betriebsdashboard | erstes Pilotobjekt | F-11, F-12 |
| R6 „Smokemieter" | Gerätebetrieb, Ferninspektion, Störung→Service | Pilotobjekt | F-13 |
| R7 „Heatmieter" | Messwerte, Validierung, Nutzerwechsel, Abrechnungsvorbereitung | Pilotobjekt | F-14, F-15 |
| R8 „Chargemieter" | Planung, Ladepunkte, Nutzer-Onboarding, Ladevorgänge | Pilotobjekt | F-16 |
| R9 „Commercial + Lexoffice" | Angebotskonfigurator, Kundenportal-Vollausbau, Rechnungssync | Gesamtprozess | F-17, F-18 |

## Regeln

1. **Deploy-Reihenfolge:** Feature-Branch → PR (CI grün) → `main` → Staging-Deploy automatisch → Staging-E2E → manueller Prod-Deploy (Coolify). Prod-Deploys werden im [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) vermerkt.
2. **Website-Releases** (Marketing) sind von Plattform-Releases entkoppelt — eigener Container, eigener Zyklus.
3. **Versionierung:** Plattform `platform-vX.Y`; Datenbank-Migrationen laufen vor App-Start (Migrations-Job), abwärtskompatible Migrationen bevorzugt (expand→migrate→contract).
4. **Rollback:** Container-Rollback via Coolify + ggf. Migrations-Gegenstück; nicht rückrollbare Migrationen brauchen expliziten Vermerk im PR.
5. **Pilotprinzip:** R5–R8 werden je an einem realen Pilotobjekt abgenommen, bevor Breitenrollout; Erkenntnisse fließen in den Masterplan zurück.
