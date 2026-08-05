# ADR-012: Bauabfolge — Commercial Core vor Powermieter-Betrieb

**Status:** Angenommen (PO Leon, 2026-08-05)
**Datum:** 2026-08-05
**Bezug:** [Founding Specification v2.0](../FOUNDING-SPEC-v2.0.md) §29/§30, [Masterplan](../POWERHOUSE_360_MASTER_PLAN.md) §7/§10/§14, [EXECUTION_ROADMAP](../EXECUTION_ROADMAP.md), [FOUNDING-SPEC-ABGLEICH](../FOUNDING-SPEC-ABGLEICH.md) K-01

## Kontext

Die am 2026-08-02 erstellte Founding Specification v2.0 wurde am 2026-08-05 ins Repository aufgenommen. Sie bezeichnet sich als verbindliche Produktverfassung (§1) und gibt in §29/§30 eine Bauabfolge vor, die der bis dahin gültigen des Masterplans (Stand 2026-07-12) **entgegenläuft**:

| | Masterplan §10 (bisher gültig) | Founding Spec §29/§30 |
|---|---|---|
| zuerst | Onboarding-Engine → Documenso → Hub/Device → Monteur-PWA | Commercial Core (CRM) |
| dann | **Phase 6: Powermieter inkl. Pilot Christinenstraße** — P1-Abschlussziel | Angebotskonfigurator → Contract-to-Delivery → Provisionierung |
| später | Phase 7: Angebotskonfigurator & Lexoffice | **Phase 5: PowerMieter** |

Der Masterplan hatte den Konfigurator bereits als dokumentierte Abweichung teilweise vorgezogen („minimaler Angebots-/Annahmefluss wird aus Phase 7 in Phase 6 vorgezogen", §10) — weil die Powermieter-DoD ihn braucht. Die Spec dreht das Verhältnis vollständig um: Sie macht den kommerziellen Durchstich zum Fundament und die Module zur Nutzlast. Ihr 12-Wochen-Startplan endet in Woche 12 mit „Lead → Angebot → Vertrag → Projekt → Provisionierung → Operations", nicht mit dem Pilot.

Beide Reihenfolgen sind in sich schlüssig. Sie lassen sich nicht kombinieren, weil sie um dieselben Ressourcen konkurrieren.

## Entscheidung

**Die Bauabfolge der Founding Specification gilt. Commercial Core und Angebotskonfigurator werden vor dem Powermieter-Betrieb gebaut.**

Der Powermieter-Pilot Christinenstraße bleibt Ziel, verliert aber seinen Rang als nächstes Abschlussziel.

## Begründung

Aus der Spec ableitbar:

- **Der Konfigurator ist die Datenquelle für alles Nachgelagerte.** Spec §8/§14: Eine angenommene Solution Configuration wird zur versionierten Quelle für Vertrag, Projektstruktur, Materialbedarf, Onboarding und Provisionierung — über das Activation Manifest. Baut man Operations zuerst, werden diese Daten für den Pilot manuell erfasst und der Konfigurator später gegen einen bereits laufenden Betrieb nachgerüstet. Genau den Medienbruch, den die Spec als Kern des Produkts eliminiert, würde die alte Reihenfolge zuerst herstellen und dann wieder auflösen müssen.
- **Risiko §31 „CRM und Operations driften auseinander".** Die Spec nennt als Gegenmaßnahme gemeinsame IDs, Contracts und Events. Diese Gemeinsamkeit ist billiger herzustellen, wenn das kommerzielle Modell zuerst steht, als wenn zwei Stammdatenwelten nachträglich zusammengeführt werden.
- **Ein Pilot ohne kommerziellen Vorlauf beweist nur die Hälfte.** Die Powermieter-DoD des Masterplans beginnt selbst mit „Lead → Angebot → Annahme" — sie setzt den kommerziellen Pfad bereits voraus.

> **Offen:** Die geschäftliche Begründung des PO (Vertriebsdruck, Zoho-Ablösung, Pilot-Terminlage) ist hier nicht dokumentiert und vom PO zu ergänzen. Die obigen Punkte sind aus der Spec abgeleitet, nicht vom Entscheider genannt.

## Konsequenzen

**Positiv**

- Der offene CRM-Rest aus WP-1.3 (Lead-Qualifizierung, CSV-/Zoho-Import, AccessScope-Guards, IssuingEntity-Pflicht) rückt vom Nachzügler auf den kritischen Pfad — er ist bereits spezifiziert und teilweise vorbereitet.
- WP-1.1 (Lead-Persistenz, F-01 grün) und WP-1.2 (Auth/Rollen/Mandanten, abgeschlossen) zahlen unmittelbar auf die neue Phase 1 ein. Es wird nichts weggeworfen.
- Documenso (bisher Phase 3) wird durch den Vertragsschritt nach dem Angebot früher gebraucht und behält seinen Rang — [ADR-003](ADR-003-dokumentenerzeugung-vs-signatur.md) bleibt unberührt.

**Negativ**

- **Der Pilot Christinenstraße verschiebt sich deutlich.** Er war das P1-Abschlussziel und der einzige geplante Nachweis an Realdaten (21 Messstellen, echte Teilnehmer). Bis er läuft, bleibt die gesamte Kette Messkonzept → Zählerstände → Billing Readiness → Abrechnung unverifiziert. Das ist der reale Preis dieser Entscheidung.
- **Hub-/Device-Registry (Phase 4) und Monteur-PWA (Phase 5) rücken nach hinten.** Damit verzögert sich auch die Klärung der Hardware-nahen Risiken — Offline-First-Konfliktauflösung (R-11), Hub-Credentials und Revocation —, die technisch die unsichersten Teile des Systems sind. Risiken spät zu klären macht sie nicht kleiner.
- **Die native Bewohner-App wartet länger.** `apps/mobile` ist mit 5 Tabs und 11 Detailscreens weitgehend gebaut, ihr Backend (WP-APP-1/2) ist es nicht. Die App hängt am Powermieter-Betrieb und rückt mit ihm nach hinten — fertige Oberfläche ohne Datenquelle, auf unbestimmte Zeit.
- ~~**Masterplan und EXECUTION_ROADMAP sind ab sofort in ihrer Phasenreihenfolge überholt.**~~ **Behoben 2026-08-05:** beide Dokumente sind auf die neue Reihenfolge umgestellt (Masterplan v2.1 §10 mit Mapping alt→neu).

## Offene Punkte

Diese ADR entscheidet die Reihenfolge, nicht deren Ausgestaltung. Ungeklärt bleibt:

1. **Was passiert mit dem Pilot in der Zwischenzeit?** Ausgesetzt, oder mit reduziertem Umfang parallel weiterbetrieben? Gibt es eine vertragliche oder terminliche Bindung gegenüber der Christinenstraße?
2. ~~**Wie werden die Masterplan-Phasen 2–7 neu geschnitten?**~~ **Erledigt 2026-08-05:** Neuschnitt in Masterplan §10 (v2.1) + EXECUTION_ROADMAP — neue Phasen 2 Commercial Core · 3 Konfigurator & Vertrag · 4 Contract-to-Delivery · 5 Provisionierung · 6/7 Hub/PWA · 8 Powermieter+Pilot · 9–11 Module · 12 Agenten; Gates F-22/F-23/F-24 ergänzt, F-17 neu gefasst.
3. ~~**Gilt der 12-Wochen-Startplan der Spec (§30) als Terminplan?**~~ **Festgelegt 2026-08-05 (Masterplan §10):** Reihenfolge-Vorgabe, keine Kalendervorgabe — Woche 1–4 sind durch Phase 0/1 teilweise erledigt.
4. **Wann kommt „Agents & Automation" dazu?** Mehrere Agenten der Spec (Lead, Sales, Proposal, Approval) sitzen im jetzt vorgezogenen Bereich — siehe [Abgleich K-07](../FOUNDING-SPEC-ABGLEICH.md).

## Revision

Diese ADR ist abzulösen, wenn einer dieser Fälle eintritt:

- Der Pilot Christinenstraße wird vertraglich oder wirtschaftlich terminkritisch — dann ist die Reihenfolge erneut abzuwägen.
- Der Commercial Core erreicht Woche 12 der Spec ohne verifizierten E2E-Durchstich; dann ist die Annahme, dass der kommerzielle Pfad das tragfähigere Fundament ist, praktisch widerlegt.
- Die Founding Spec wird in v2.1+ in §29/§30 geändert.
