# PO-Offenposten — Kunden-App-Programm

Punkte, die **nur der Product Owner** liefern oder entscheiden kann. Blockieren die Entwicklung nicht sofort (es wird gegen Simulator/Mocks/lokale DB gearbeitet), sind aber **terminkritisch** für die jeweils genannten Arbeitspakete. Stand: 2026-07-23.

Bezug: [Programmplan](superpowers/plans/2026-07-22-kunden-app-programmplan.md) · [Architekturplan](superpowers/specs/2026-07-22-kunden-app-architekturplan.md) (§8 Parallel-Track, §10 Risiken).

## A. Blockiert Auslieferung/Test (App)

- [ ] **Apple Developer Account** — voraussichtlich auf **AKL Powerhouse 360 GmbH** (bis Bestätigung nicht auf Privatperson/Wonderpower festlegen). 99 €/Jahr. Blockiert TestFlight + Push → **WP-APP-5**. (Entwicklung via iOS-Simulator läuft ohne.)
- [ ] **VPS-Rollout + DNS-Cutover** (Cloudflare → Hostinger-NS) — liefert Staging-/Prod-URL für App-E2E. Schließt R-01 (prod). Blockt **WP-APP-4/5**.
- [ ] **Git-Remote + CI** (R-02) — aktuell Deploy nur per `git archive | scp`, kein Remote. Bremst Qualitätssicherung aller WPs.
- [ ] **Google Play Console** (25 € einmalig) — erst nach stabiler iOS-Testversion. Android-Beta nach **WP-APP-5**.

## B. Blockiert echte Daten / Abrechnungsanzeige

- [ ] **Pilotdatenliste** Christinenstraße 36 / Lottumstraße 22 (21 Messstellen): Zuordnung Zähler ↔ Wohnung/Zählpunkt. Grundlage für Mapping + Seed → **WP-APP-5** (bis dahin Hub-Simulator).
- [ ] **Pilotdaten-Verfügbarkeit verifizieren** (V-02): Ist die echte Telemetrie-Pipeline erreichbar/dokumentiert? Nicht voraussetzen — Ergebnis wird dokumentiert.
- [ ] **Pilottarife** (Arbeitspreis PV/Netz, Grundpreis) für die €-/Ersparnis-Anzeige → **WP-APP-2**-Seed. Sonst nur kWh, keine Kosten.
- [ ] **Hosting-DE-Verifikation** (V-04): VPS-Rechenzentrum-Standort DE bestätigen; Nicht-DE-Datenflüsse (APNs/FCM, Expo/EAS) DSGVO-seitig bewerten.

## C. Entscheidungen (kein Code, aber blockierend)

- [ ] **Design-Palette:** App-Prototyp nutzt eigenes Grün `#39954C` + Energie-Domänenfarben; Marketing-Website nutzt `#3DB36A` / Deep Navy `#0D1626`. **Verbindliche Palette für die App festlegen** → **WP-APP-3**. (Referenz: `apps/mobile/design-reference/`.)
- [ ] **ADR-007** (Stack & Hosting-Topologie) — Entwurf, Freigabe offen (E-01).
- [ ] **ADR-008** (Bewohner-Belegweg: Lexoffice AKL-Konto vs. interner Pfad) — Entscheidung vor Phase 6 (E-02).
- [ ] **ADR-009** (Telemetrie-Ingestion Hub→Plattform) — mit dem Architekturplan freigegeben; nur zur Kenntnis.

## D. Bereitstellungen (optional, verbessern die Arbeit)

- [ ] **Vollständigen Design-Prototyp** via Claude Design **„Send to Claude Code Web"** in den Workspace seeden (umgeht die 256-KiB-`get_file`-Kappung; liefert `support.js`, `ios-frame.jsx`, Assets). Aktuell liegt nur ein Teilcapture in `apps/mobile/design-reference/`.
- [ ] **Git-Identität** setzen (aktuell Default `leonliedtke@Mac.fritz.box`), falls saubere Autor-Angaben gewünscht.

---
*Diese Liste beim Abarbeiten pflegen; erledigte Punkte abhaken, nicht löschen (Nachvollziehbarkeit).*
