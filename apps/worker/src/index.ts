import PgBoss from "pg-boss";
import { prisma } from "@ph360/database";
import {
  executeHandler,
  finalizeEventIfComplete,
  type EventHandler,
} from "@ph360/events";
import {
  createSmtpTransport,
  leadNotifyTo,
  notifyViaEmail,
} from "@ph360/notifications";
import { createLogger } from "@ph360/observability";

/**
 * Event-Dauerdienst (WP-1.4, ADR-001): transaktionale Outbox (`DomainEvent`)
 * → pg-boss-Queue → idempotente Handler.
 * - Dispatcher (Poll) reiht je (Event, Handler) einen pg-boss-Job ein;
 *   `singletonKey` dedupliziert die Einreihung, `EventHandlerExecution`
 *   (Unique eventId+handlerName) garantiert genau eine Wirkung.
 * - Retry/Backoff macht pg-boss; die Versuchszählung führt der Executor —
 *   ab MAX_HANDLER_ATTEMPTS wird das Event DEAD (sichtbar; Requeue auditiert
 *   über `requeueDeadEvent`).
 * - Verarbeitung sequentiell (batchSize 1) — grobkörnige Erfüllung von
 *   „pro Aggregat seriell" (§3) wie bisher; Feinsteuerung folgt bei Bedarf.
 */

const log = createLogger({ service: "worker" });
const POLL_INTERVAL_MS = 3000;
const BATCH_SIZE = 20;
const QUEUE = "domain-events";

const transport = createSmtpTransport();

const HANDLERS: EventHandler[] = [
  {
    eventType: "lead.created",
    name: "lead-created-notify-email",
    handle: async (payload, event) => {
      await notifyViaEmail(prisma, transport, {
        recipient: leadNotifyTo,
        templateKey: "lead.created.notify",
        payload,
        organizationId: event.organizationId,
        eventId: event.id,
      });
    },
  },
  ...(["email_verification", "password_reset", "member_invited"] as const).map(
    (kind): EventHandler => ({
      eventType: `auth.${kind}`,
      name: `auth-${kind}-email`,
      handle: async (payload, event) => {
        const recipient = String(payload.email ?? "");
        if (!recipient) throw new Error(`auth.${kind}: payload.email fehlt`);
        await notifyViaEmail(prisma, transport, {
          recipient,
          templateKey: `auth.${kind}`,
          payload,
          organizationId: event.organizationId,
          eventId: event.id,
        });
      },
    }),
  ),
];

const handlersFor = (eventType: string) => HANDLERS.filter((h) => h.eventType === eventType);
const handlerByName = new Map(HANDLERS.map((h) => [h.name, h]));

type JobData = { eventId: string; handlerName: string };

/** Outbox-Dispatcher: PENDING-Events in die Queue relayen (erst senden, dann
 *  markieren — ein Crash dazwischen führt nur zu erneutem, deduplizierten Send). */
async function dispatchTick(boss: PgBoss): Promise<void> {
  const events = await prisma.domainEvent.findMany({
    where: { status: "PENDING", availableAt: { lte: new Date() } },
    orderBy: { availableAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, eventType: true },
  });
  for (const ev of events) {
    const handlers = handlersFor(ev.eventType);
    if (handlers.length === 0) {
      // Kein Handler registriert (noch): als verarbeitet markieren — wie bisher.
      await prisma.domainEvent.updateMany({
        where: { id: ev.id, status: "PENDING" },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
      continue;
    }
    for (const h of handlers) {
      await boss.send(
        QUEUE,
        { eventId: ev.id, handlerName: h.name } satisfies JobData,
        {
          singletonKey: `${ev.id}:${h.name}`,
          retryLimit: 10, // Sicherheitsnetz — die fachliche Grenze zieht der Executor (MAX_HANDLER_ATTEMPTS)
          retryDelay: 5,
          retryBackoff: true,
          expireInSeconds: 120,
        },
      );
    }
    await prisma.domainEvent.updateMany({
      where: { id: ev.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
  }
  if (events.length > 0) log.info("dispatched", { count: events.length });
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL fehlt");

  const boss = new PgBoss({ connectionString, schema: "pgboss" });
  boss.on("error", (err) => log.error("pg-boss error", { error: String(err) }));
  await boss.start();
  await boss.createQueue(QUEUE);

  await boss.work<JobData>(QUEUE, { batchSize: 1 }, async (jobs) => {
    for (const job of jobs) {
      const { eventId, handlerName } = job.data;
      const handler = handlerByName.get(handlerName);
      if (!handler) {
        log.warn("unknown handler — job dropped", { handlerName, eventId });
        continue;
      }
      const result = await executeHandler(prisma, eventId, handler);
      switch (result.outcome) {
        case "succeeded":
        case "skipped": {
          const done = await finalizeEventIfComplete(
            prisma,
            eventId,
            handlersFor(handler.eventType).map((h) => h.name),
          );
          log.info("handler done", { eventId, handlerName, outcome: result.outcome, finalized: done });
          break;
        }
        case "dead":
          log.error("event DEAD after max attempts", {
            eventId,
            handlerName,
            attempts: result.attempts,
            error: result.error,
          });
          break; // kein Rethrow — Dead-Letter ist erreicht, Requeue nur manuell/auditiert
        case "failed":
          log.warn("handler failed — retry scheduled", {
            eventId,
            handlerName,
            attempts: result.attempts,
            error: result.error,
          });
          throw new Error(result.error); // pg-boss retried mit Backoff
      }
    }
  });

  let running = true;
  const loop = (async () => {
    while (running) {
      try {
        await dispatchTick(boss);
      } catch (err) {
        log.error("dispatch tick error", { error: String(err) });
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  })();

  const shutdown = async (signal: string) => {
    log.info("shutting down", { signal });
    running = false;
    await loop.catch(() => undefined);
    await boss.stop({ wait: true, timeout: 10_000 });
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  log.info("event worker started (outbox → pg-boss)", { queue: QUEUE, pollMs: POLL_INTERVAL_MS });
}

main().catch((err) => {
  log.error("worker startup failed", { error: String(err) });
  process.exit(1);
});
