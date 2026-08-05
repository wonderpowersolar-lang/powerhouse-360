# Abgleich: Founding Specification v2.0 ↔ Masterplan & ADRs

**Stand:** 2026-08-05 · **Anlass:** Aufnahme der [Founding Specification v2.0](FOUNDING-SPEC-v2.0.md) (Stand 2026-08-02) ins Repository

Die Founding Spec bezeichnet sich als „verbindliche Produktverfassung und Zielarchitektur" (§1) und ersetzt v1.0 + 1.1. Sie ist **nicht** identisch mit dem bisher gültigen [Masterplan](POWERHOUSE_360_MASTER_PLAN.md) (Stand 2026-07-12) und den [ADRs](DECISIONS/) 001–011. Dieses Dokument listet jede Abweichung, bewertet sie und hält fest, welche Fassung gilt.

**Was dieses Dokument ist:** ein Entscheidungsprotokoll. **Was es nicht ist:** eine Umsetzung. Masterplan und [EXECUTION_ROADMAP](EXECUTION_ROADMAP.md) sind bewusst noch unverändert — ihre Anpassung ist Folgearbeit (siehe [§ Offene Folgeaufgaben](#offene-folgeaufgaben)).

---

## Übersicht

| ID | Thema | Bewertung | Es gilt | Status |
|---|---|---|---|---|
| K-01 | Bauabfolge: Pilot zuerst vs. Commercial zuerst | **Echter Konflikt, strategisch** | Founding Spec | ✅ entschieden ([ADR-012](DECISIONS/ADR-012-bauabfolge-commercial-first.md), PO 2026-08-05) |
| K-02 | Documenso: Vorlagen im Provider oder im eigenen System | **Echter Konflikt, technisch** | ADR-003 (Vorschlag) | 🟡 PO-Freigabe offen |
| K-03 | Native Bewohner-App fehlt in der Spec | **Lücke der Spec** | ADR-011 (Vorschlag) | 🟡 PO-Freigabe offen |
| K-04 | Spec führt vier bereits entschiedene Punkte als „offen" | **Spec hinter Repo-Stand** | ADRs 001/002/005/010 | 🟡 Spec-Korrektur bei v2.1 |
| K-05 | Repo-Struktur (apps/packages) weicht ab | Zielbild vs. Ist | Ist-Struktur, Spec als Zielbild | 🟡 Mapping unten, kein Umbau |
| K-06 | Modul **PowerWRX** existiert im Masterplan nicht | **Lücke des Masterplans** | — | 🔴 PO-Entscheidung nötig |
| K-07 | Agentensystem (21 Agenten, A0–A5) fehlt im Masterplan | **Lücke des Masterplans** | Founding Spec | 🔴 Einordnung nötig |
| K-08 | Rollenmodell: 12 Systemrollen vs. 13 Spec-Rollen | Kleinteilig | — | 🟡 Abgleich beim CRM-Ausbau |
| K-09 | Gate-Nomenklatur G0–G8 vs. F-01…F-21 | Zwei Ebenen, kein Konflikt | beide | 🟡 zusammenführen |
| K-10 | Schreibweise der Modulnamen | Trivial, aber von der Spec selbst moniert | — | 🟡 festlegen |

---

## K-01 — Bauabfolge · ✅ entschieden

**Spec (§29, §30):** Phase 0 Fundament → **1 Commercial Core (CRM)** → **2 Angebotskonfigurator** → 3 Contract-to-Delivery → 4 Provisionierung → **5 Module und Betrieb (PowerMieter)** → 6 Agentische Skalierung. Der 12-Wochen-Startplan endet in Woche 12 mit dem E2E-Durchstich „Lead → Angebot → Vertrag → Projekt → Provisionierung → Operations".

**Masterplan (§7, §10):** Powermieter ist **P1**, der Pilot Christinenstraße ist das P1-Abschlussziel in **Phase 6**. Der Angebotskonfigurator liegt in **Phase 7** — mit der ausdrücklich dokumentierten Ausnahme, dass ein *minimaler* Angebots-/Annahmefluss nach Phase 6 vorgezogen wird, weil die Powermieter-DoD ihn braucht.

**Bewertung:** Das ist eine Umkehrung, keine Nuance. Die beiden Pläne bauen dieselben Bausteine in gegenläufiger Reihenfolge.

**Entscheidung (PO Leon, 2026-08-05):** **Commercial Core zuerst.** Die Founding Spec gewinnt. Begründung, Konsequenzen und Revisit-Trigger stehen in [ADR-012](DECISIONS/ADR-012-bauabfolge-commercial-first.md).

---

## K-02 — Documenso: Vorlagen im Provider oder im eigenen System · 🟡

**Spec (§10 „Ausgaben des Konfigurators", §11 „Documenso"):**
- „Vertrag bzw. **Documenso-Vorlage** mit strukturiertem Feldmapping"
- „**Vorlagen** und Feldmapping werden versioniert"

**[ADR-003](DECISIONS/ADR-003-dokumentenerzeugung-vs-signatur.md) (angenommen 2026-07-12):**
- Vertragsdokumente werden **vollständig im Powerhouse-System** erzeugt (HTML/CSS/WeasyPrint-Pipeline)
- Vertragsinhalte leben in versionierten `ContractTemplate`s im eigenen System — „**niemals** in Documenso-Templates"
- Documenso erhält ausschließlich fertige PDFs plus Signaturfeld-Definitionen

**Bewertung:** Die Spec-Formulierung lässt sich als „Documenso-Vorlage" im Sinne von Provider-Templates lesen — das wäre der direkte Gegensatz zu ADR-003. Möglich ist auch die harmlose Lesart „Vertrag bzw. Signaturvorlage". Die Spec ist an dieser Stelle unpräzise; ADR-003 ist es nicht und nennt eine technische Begründung (Vendor-Lock-in, Versionierbarkeit, Testbarkeit).

**Vorschlag:** **ADR-003 gilt weiter.** Die Spec-Passagen sind so zu lesen, dass „Vorlage" das interne `ContractTemplate` meint und Documenso nur Signaturfelder erhält. Bei Spec v2.1 §10/§11 entsprechend nachschärfen.

---

## K-03 — Native Bewohner-App fehlt in der Spec · 🟡

**Spec (§23 Repository-Struktur):** apps = `web-commercial`, `web-delivery`, `web-operations`, `portal-customer`, `installer-pwa`, `api`, `worker`, `hub-console`. Eine native App kommt im gesamten Dokument nicht vor; §7 „Mobile und Vor-Ort" beschreibt ausschließlich Installateur-Workflows.

**Repo:** [ADR-011](DECISIONS/ADR-011-kunden-app-nur-bewohner.md) (angenommen PO 2026-07-26) legt die Kunden-App als reine Bewohner-App fest; `apps/mobile` ist eine native SwiftUI-App mit 5 Tabs und 11 Detailscreens.

**Bewertung:** Lücke der Spec, kein Widerspruch in der Sache — die Spec verbietet keine native App, sie erwähnt sie nur nicht. Die Bewohner-Zielgruppe ist in der Spec vorhanden (§6: „Bewohner/Mieter — einfach onboarden, Verträge verstehen, Verbräuche sehen").

**Vorschlag:** **ADR-011 gilt weiter.** Bei Spec v2.1 die Repo-Struktur um die native Bewohner-App ergänzen und §7 „Mobile und Vor-Ort" um den Bewohner-Kanal erweitern.

---

## K-04 — Spec führt bereits entschiedene Punkte als „offen" · 🟡

§35 „Offene Entscheidungen" listet vier Punkte, die im Repo per ADR entschieden sind:

| Spec §35 sagt „offen" | Tatsächlich entschieden in | Entscheidung |
|---|---|---|
| „Zeitreihenstrategie und Aufbewahrung je Messdatenklasse" | [ADR-002](DECISIONS/ADR-002-telemetrie-zeitreihenspeicher.md) (angenommen) | TimescaleDB als Postgres-Extension, append-only |
| „Identity Provider: Eigenbetrieb versus spezialisierter EU-fähiger Anbieter" | [ADR-010](DECISIONS/ADR-010-better-auth-und-eigene-rbac.md) (angenommen) | better-auth + eigene RBAC-Tabellen |
| „Konkrete Workflow Engine und Queue-Technologie" | [ADR-001](DECISIONS/ADR-001-event-infrastruktur-outbox.md) (angenommen) | Transactional Outbox + pg-boss |
| „Abgrenzung Lexoffice/Accounting gegenüber internem Billing Ledger" | [ADR-005](DECISIONS/ADR-005-bewohnerabrechnung-billing-engine.md) (angenommen), [ADR-008](DECISIONS/ADR-008-bewohner-belegweg.md) (Entwurf) | interne Billing-Engine; Lexoffice als B2B-Belegweg |

Weiterhin **zu Recht offen** in §35: Hosting-Topologie ([ADR-007](DECISIONS/ADR-007-stack-und-hosting.md) ist noch Entwurf), Device-PKI/OTA, Product Configuration Language, semantische Metrikschicht, Model Gateway, White-Label-Isolation, Datenmigration, Namenskonventionen.

**Vorschlag:** **Die ADRs gelten.** §35 bei Spec v2.1 um die vier erledigten Punkte kürzen und stattdessen auf die ADRs verweisen.

---

## K-05 — Repo-Struktur · 🟡

**Spec (§23):**

| Bereich | Spec-Zielbild |
|---|---|
| apps | `web-commercial`, `web-delivery`, `web-operations`, `portal-customer`, `installer-pwa`, `api`, `worker`, `hub-console` |
| packages | `domain-*`, `application-*`, `integrations-*`, `agents-*`, `workflows-*`, `ui`, `auth`, `events`, `observability`, `testkit` |

**Ist:** apps = `platform`, `website`, `worker`, `mobile` · packages = `auth`, `database`, `permissions`, `testing`, `eslint-config`

**Bewertung:** Kein Konflikt, sondern Zielbild vs. gewachsener Stand. Die Spec-Struktur trennt drei Web-Oberflächen, die heute in `apps/platform` zusammenliegen. Ein Umbau jetzt wäre reiner Verschiebeaufwand ohne fachlichen Gewinn.

**Vorschlag:** **Ist-Struktur beibehalten.** Die Spec-Struktur ist Zielbild für den Zeitpunkt, an dem Commercial-, Delivery- und Operations-Oberflächen tatsächlich getrennte Deployments oder Teams rechtfertigen. Grobes Mapping:

| Spec | heute |
|---|---|
| `web-commercial`, `web-delivery`, `web-operations` | `apps/platform` (eine Next.js-App) |
| `portal-customer` | `apps/platform` (geplant), Bewohner nativ in `apps/mobile` |
| `api` | `apps/platform` (Route Handlers) |
| `worker` | `apps/worker` ✅ |
| `installer-pwa`, `hub-console` | noch nicht gebaut |
| `auth`, `testkit` | `packages/auth`, `packages/testing` ✅ |
| `domain-*`, `application-*`, `events`, `observability` | teils `packages/database`, `packages/permissions`; sonst offen |

---

## K-06 — Modul PowerWRX · 🔴 Entscheidung nötig

**Spec (§15):** PowerWRX ist eines von sechs Operations-Modulen — Serviceanfragen, Medien, Triage, Freigabelogik, Terminabstimmung mit Mietern und Handwerkern, Leistung/Abnahme/Dokumentation/Rechnung, WhatsApp- und E-Mail-Kommunikation als kontrollierte Kanäle.

**Masterplan (§7):** kennt nur Powermieter (P1), Smokemieter (P2), Heatmieter (P3), Chargemieter (P3). PowerWRX kommt nicht vor — Service/Tickets existieren dort nur als Querschnittsfunktion („14 Service").

**Offen (PO):** Ist PowerWRX ein eigenes Modul mit Prioritätsklasse, oder der Ausbau des vorhandenen Service-Querschnitts unter neuem Namen? Davon hängt ab, ob es ins Modulraster von Masterplan §7 aufgenommen wird.

---

## K-07 — Agentensystem · 🔴 Einordnung nötig

**Spec (§19):** 21 benannte Agenten (Paula als Orchestratorin plus 20 Fachagenten), sechs Autonomiestufen A0–A5, acht Agenten-Sicherheitsregeln, eigener Bounded Context „Agents & Automation" (§16), Agent-KPIs (§27), Evaluationspflicht in der Definition of Done (§28). Spec-Phase 6 ist die agentische Skalierung.

**Masterplan:** kein Agentensystem, keine Autonomiestufen, kein Agenten-Kontext.

**Bewertung:** Der größte inhaltliche Zuwachs der Spec gegenüber dem Masterplan — und mit der Entscheidung aus K-01 rückt er näher, weil mehrere Agenten (Lead, Sales, Proposal, Approval) genau im jetzt vorgezogenen Commercial-Bereich sitzen.

**Offen:** Wann wird „Agents & Automation" als Kontext aufgenommen, und welche Agenten sind im Commercial Core bereits vorgesehen? Die Spec-Sicherheitsregeln (§19: Tool-Auth, Schreibrechte feiner als Leserechte, Prompt-Inhalte niemals Autoritätsquelle, Schema-Validierung, Budgets) sollten festgelegt sein, **bevor** der erste Agent gebaut wird — nicht danach.

---

## K-08 — Rollenmodell · 🟡

**Ist:** 12 Systemrollen in `packages/permissions` — PLATFORM_ADMIN, SALES, OPERATIONS, SERVICE, FINANCE, PROPERTY_MANAGER, OWNER_BOARD, BILLING_CONTACT, INSTALLER_PARTNER_ADMIN, INSTALLER, RESIDENT, PARKING_USER.

**Spec (§6):** 13 Zielgruppen — u. a. Sales Operations, Projektleitung, Technische Planung, Customer Success, Partner/White Label.

**Bewertung:** Überwiegend deckungsgleich, aber die Spec kennt Rollen ohne Entsprechung (Sales Operations, Projektleitung, Technische Planung, Customer Success) — allesamt im jetzt vorgezogenen Commercial-/Delivery-Bereich.

**Vorschlag:** Abgleich beim CRM-/Delivery-Ausbau, nicht vorab. `packages/permissions` bleibt die einzige Quelle.

---

## K-09 — Gate-Nomenklatur · 🟡

**Spec (§8):** G0 Intake Ready → G1 Qualified → G2 Solution Ready → G3 Commercial Ready → G4 Contracted → G5 Handoff Accepted → G6 Technical Ready → G7 Provisioned → G8 Live, je mit Leitereignis.

**Masterplan (§12) / Roadmap:** F-01…F-21 als E2E-Flüsse und Phasen-Gates.

**Bewertung:** Kein Konflikt — G0–G8 sind fachliche Lifecycle-Gates eines Kundenvorgangs, F-01…F-21 sind Testnachweise je Phase. Sie beschreiben verschiedene Ebenen.

**Vorschlag:** Beide behalten, aber in der Roadmap sichtbar verknüpfen (welcher F-Fluss weist welches G-Gate nach), damit nicht zwei konkurrierende Fortschrittsbegriffe entstehen.

---

## K-10 — Schreibweise der Modulnamen · 🟡

Spec: PowerMieter, HeatMieter, ChargeMieter, SmokeMieter, PowerWRX, PowerHub. Masterplan: Powermieter, Heatmieter, Chargemieter, Smokemieter. Domains laut Masterplan §7: smokemieter.de, chargemieter.de.

Die Spec fordert in §35 selbst „verbindliche Namenskonventionen für Marken, Module und Gesellschaften" — offenbar ist ihr die Uneinheitlichkeit bewusst. **Offen (PO):** eine Schreibweise festlegen und durchziehen.

---

## Offene Folgeaufgaben

Aus diesem Abgleich folgt Arbeit, die hier bewusst **nicht** erledigt wurde:

1. **Masterplan §7/§10 und EXECUTION_ROADMAP auf die neue Bauabfolge umstellen** (aus K-01/ADR-012). Betrifft die Phasen 2–7 vollständig sowie Masterplan §14 „Nächste verbindliche Schritte". Der größte Brocken.
2. **PO-Freigabe für K-02 und K-03** einholen — beides sind Vorschläge, keine Entscheidungen.
3. **K-06 (PowerWRX) und K-07 (Agentensystem) entscheiden** — ohne diese Entscheidungen bleibt das Modul- und Kontextraster unvollständig.
4. **Spec v2.1 vorbereiten** mit den Korrekturen aus K-02, K-03, K-04 (die Spec selbst verlangt in §32 versionierte Änderung mit Anlass, Konsequenzen und Entscheidungsträger).
5. **[ADR-007](DECISIONS/ADR-007-stack-und-hosting.md) freigeben** — steht seit 2026-07-12 als Entwurf und blockiert die Hosting-Klärung, die auch die Spec in §35 offen führt.

---

## Was die Spec bestätigt

Der Vollständigkeit halber — an diesen Stellen decken sich Spec und Repo, hier ist nichts zu tun:

- **Modularer Monolith**, TypeScript/Node, Next.js, Postgres als System of Record (Spec §23 ↔ Masterplan §3)
- **Transactional Outbox**, Events mit Schema-Version und Correlation (Spec §18 ↔ ADR-001)
- **Rohmesswerte unveränderlich**, Korrekturen als gekennzeichnete Adjustments, Quality Flags (Spec §21 ↔ ADR-002)
- **Mandantentrennung** als verpflichtende Zuordnung mit Scope-Bindung (Spec §20 ↔ ADR-004)
- **Testmandant** und „keine Mock-Logik in produktiven Pfaden" (Spec §1, §28 ↔ ADR-006)
- **Definition of Done** mit E2E-Nachweis, Audit, Migration/Rollback, Lade-/Leer-/Fehlerzuständen (Spec §28 ↔ Masterplan §11)
- **ADR-Prozess** als verbindliches Instrument, inklusive der Pflicht für Entwicklungsagenten, relevante ADRs vor Änderungen zu lesen (Spec §28)
