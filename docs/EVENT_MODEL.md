# POWERHOUSE 360 — Internes Event-Modell

> Status: 🔵 Analysiert / Entwurf v1 (2026-07-11). Umsetzung in Phase 1 (Outbox + Dispatcher).

## 1. Architekturentscheidung

**Transactional Outbox in PostgreSQL** — kein Kafka/RabbitMQ in Phase 1 (siehe ADR-004).

- Jede Zustandsänderung schreibt ihr Domain-Event **in derselben DB-Transaktion** in die Tabelle `DomainEvent` (Outbox). Dadurch kann kein Event ohne Zustandsänderung und keine Zustandsänderung ohne Event existieren.
- Ein Worker-Prozess (BullMQ auf Redis oder pg-basierter Poller, Entscheidung ADR-004) liest unverarbeitete Events und ruft registrierte **Handler** auf (Onboarding-Trigger, Benachrichtigungen, Lexoffice-Sync, Ticket-Erzeugung …).
- Handler sind **idempotent**: `EventHandlerExecution(eventId, handlerName)` unique — ein Handler verarbeitet ein Event genau einmal erfolgreich; Wiederholungen sind no-ops.
- Fehlgeschlagene Handler: Retry mit Exponential Backoff, nach N Versuchen → Dead-Letter-Status, sichtbar im Admin (manuelle Wiederholung möglich, auditiert).

## 2. Event-Envelope

```jsonc
{
  "id": "uuid-v7",                    // eindeutig, sortierbar
  "eventType": "contract.signed",     // aus dem Katalog unten
  "aggregateType": "Contract",
  "aggregateId": "uuid",
  "organizationId": "uuid",           // Mandanten-Scope
  "occurredAt": "2026-07-11T12:00:00Z",
  "actor": { "type": "user|system|webhook", "id": "uuid|null" },
  "correlationId": "uuid",            // verbindet Prozessketten (z. B. Angebot→Vertrag→Projekt)
  "causationId": "uuid|null",         // das Event, das dieses Event ausgelöst hat
  "version": 1,                       // Schema-Version des Payloads
  "payload": { }                      // typisiert per Zod-Schema je eventType
}
```

Regeln:
- Payloads enthalten **IDs + minimale Fakten**, keine kompletten Objektkopien und keine sensiblen Daten (keine IBAN, keine Vertragsinhalte).
- Payload-Schemata liegen in `packages/events` als Zod-Schemata und sind die einzige Quelle der Wahrheit; Publisher und Handler importieren dieselben Typen.
- Schema-Änderungen nur additiv oder mit `version`-Erhöhung.

## 3. Event-Katalog (verbindlicher Mindestbestand)

### CRM & Commercial
| Event | Auslöser | Wichtige Handler |
|---|---|---|
| `lead.created` | Funnel-Submit, manuelle Anlage | Benachrichtigung Vertrieb, CRM-Task |
| `lead.qualified` | Statuswechsel im CRM | Customer/Property-Anlage anstoßen |
| `offer.created` / `offer.sent` | Angebotskonfigurator | Portal-Zugang, E-Mail an Kunde |
| `offer.accepted` | Kundenportal-Annahme | **Projekt automatisch erzeugen**, Vertragsprozess starten |

### Verträge (Documenso)
| Event | Auslöser | Wichtige Handler |
|---|---|---|
| `contract.created` | Vertragsanlage | Audit |
| `contract.sent_to_documenso` | Adapter-Übergabe | Statusanzeige Portal |
| `contract.signature_started` | Documenso-Webhook | Onboarding-Schritt → Waiting for Signature |
| `contract.partially_signed` | Documenso-Webhook | Erinnerung an ausstehende Unterzeichner |
| `contract.signed` | Documenso-Webhook (final bestätigt) | Finales PDF abholen, Onboarding-Schritt abschließen, ggf. Projekt/Modul-Trigger |
| `contract.failed` | Webhook (declined/voided/expired) oder Retry-Erschöpfung | Ticket für Vertrieb, Onboarding blockieren |

### Projekt & Onboarding
| Event | Auslöser |
|---|---|
| `project.created` · `project.phase_changed` | Angebotsannahme / Phasenwechsel |
| `onboarding.started` · `onboarding.step_completed` · `onboarding.blocked` · `onboarding.ready_for_activation` | Onboarding-Engine |
| `work_order.created` · `work_order.assigned` · `work_order.completed` | Operations / PWA |

### Hub & Geräte
| Event | Auslöser |
|---|---|
| `hub.registered` · `hub.online` · `hub.offline` | PWA-Provisionierung / Heartbeat-Auswertung |
| `device.registered` · `device.assigned` · `device.installed` · `device.activated` · `device.replaced` | Registry / PWA |
| `device.telemetry_received` | Ingest (nur bei fachlich relevanten Zustandswechseln — nicht pro Rohmesswert!) |
| `device.alert_created` · `device.alert_resolved` | Regelwerk (Demontage, Batterie, Offline) → kritische Alarme erzeugen `ServiceTicket` |

### Module & Abrechnung
| Event | Auslöser |
|---|---|
| `module.activated` · `module.suspended` | Aktivierungsprüfung / Betrieb |
| `invoice.requested` | Abrechnungslogik erzeugt `InvoiceRequest` |
| `invoice.created` · `invoice.paid` · `invoice.overdue` | Lexoffice-Sync |

## 4. Verarbeitungsgarantien

| Garantie | Umsetzung |
|---|---|
| At-least-once Delivery | Outbox-Poller markiert erst nach Handler-Erfolg |
| Idempotenz | `EventHandlerExecution`-Unique-Constraint + idempotente Handler-Logik |
| Reihenfolge | Pro `aggregateId` seriell verarbeitet (Partitionierung nach Aggregat); global keine Ordnungsgarantie |
| Wiederholbarkeit | Events sind unveränderlich gespeichert; Replay eines Handlers über Admin möglich (auditiert) |
| Auditierbarkeit | `DomainEvent` ist append-only; Verknüpfung zu `AuditEvent` über `correlationId` |

## 5. Abgrenzung

- **Domain-Events ≠ Audit-Log.** Audit-Log protokolliert *jede* Änderung für Nachvollziehbarkeit; Domain-Events sind die *fachlich bedeutsamen* Zustandswechsel mit Handlern.
- **Domain-Events ≠ Telemetrie.** Geräterohdaten fließen über den Ingest-Pfad (siehe [DEVICE_AND_HUB_PLATFORM.md](DEVICE_AND_HUB_PLATFORM.md)); nur Zustandswechsel (offline→online, Alarm) werden zu Events.
- **Eingehende Webhooks** (Documenso, Lexoffice) landen zuerst in `WebhookInbox` (Rohpayload, Signaturprüfung, Idempotenzschlüssel) und werden dann in interne Events übersetzt — nie direkt in Zustandsänderungen.
