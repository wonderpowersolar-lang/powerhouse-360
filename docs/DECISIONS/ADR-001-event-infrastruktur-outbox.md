# ADR-001 — Event-Infrastruktur: Transactional Outbox + datenbankbasierte Queue

Status: **angenommen** (Vorgabe Masterprompt V2, 2026-07-12) · ersetzt alt-ADR-004 (2026-07-11)

## Entscheidung
Domain-Events werden **in derselben DB-Transaktion** wie die Zustandsänderung in die Outbox-Tabelle `DomainEvent` geschrieben und von `apps/worker` verarbeitet. Queue-Mechanik ist **Postgres-basiert** (pg-boss als Ziel); **kein externer Message-Broker** (kein Kafka, kein RabbitMQ, kein Redis), solange der Monolith besteht. Events sind eindeutig, idempotent (Handler-Idempotenz über `EventHandlerExecution`-Unique-Constraint), wiederholbar und auditierbar.

## Ist-Stand (2026-07-12)
Outbox-Tabelle + Poll-/Claim-/Retry-Dispatcher sind implementiert und verifiziert (Lead-Kette F-01). Umstellung des Dispatchers auf pg-boss + `EventHandlerExecution` folgt in WP-1.4.

## Konsequenzen
+ Keine zusätzliche Infrastruktur; kein Event ohne Zustandsänderung (und umgekehrt); alles im DB-Backup.
− Durchsatzgrenzen von Postgres-Queues — akzeptiert; `packages/events` kapselt die Queue, Migrationspfad bleibt offen.
