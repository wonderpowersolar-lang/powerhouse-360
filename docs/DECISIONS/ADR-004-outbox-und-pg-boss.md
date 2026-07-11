# ADR-004 — Events via Transactional Outbox + pg-boss (kein Redis/Kafka)

Status: vorgeschlagen (2026-07-11) · Kontext: Phase 1

## Kontext
Der Masterprompt fordert eindeutige, idempotente, wiederholbare, auditierbare Domain-Events. Infrastruktur: eine VPS, Kleinst-Team.

## Entscheidung
- **Transactional Outbox**: Events werden in derselben DB-Transaktion wie die Zustandsänderung in `DomainEvent` geschrieben.
- **pg-boss** (Postgres-basierte Job-Queue) im `apps/worker` als Dispatcher + für alle Hintergrundjobs (Documenso-/Lexoffice-Aufrufe, Reminder, PDF-Generierung, Sync-Läufe).
- Handler-Idempotenz über `EventHandlerExecution`-Unique-Constraint; Retry mit Backoff; Dead-Letter sichtbar im Admin.

## Alternativen
- BullMQ + Redis: performanter, aber zusätzliche Infrastruktur (Redis) ohne aktuellen Bedarf.
- Kafka/NATS: klar überdimensioniert.

## Konsequenzen
+ Keine zusätzliche Infrastruktur; exactly-once-Wirkung über Idempotenzschicht; alles im DB-Backup enthalten.
− Durchsatzgrenzen von Postgres-Queues — akzeptiert; Migrationspfad zu BullMQ bleibt offen, da `packages/events` die Queue kapselt.
