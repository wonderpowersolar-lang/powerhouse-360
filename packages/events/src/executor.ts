import type { PrismaClient, DomainEvent } from "@ph360/database";

/**
 * Handler-Ausführung mit Idempotenz-Garantie (ADR-001, WP-1.4):
 * `EventHandlerExecution` mit Unique (eventId, handlerName) stellt sicher,
 * dass ein Handler je Event genau eine Wirkung hat — egal wie oft die Queue
 * (at-least-once) denselben Job zustellt. Ab MAX_HANDLER_ATTEMPTS echten
 * Fehlversuchen wird das Event DEAD (Dead-Letter sichtbar, §3); die
 * Wiederaufnahme läuft auditiert über `requeueDeadEvent`.
 */

export const MAX_HANDLER_ATTEMPTS = 5;

export type EventHandler = {
  eventType: string;
  /** Stabiler Name — Teil des Idempotenz-Schlüssels. Nie umbenennen, ohne die Executions zu migrieren. */
  name: string;
  handle: (payload: Record<string, unknown>, event: DomainEvent) => Promise<void>;
};

export type ExecuteOutcome =
  | { outcome: "succeeded" }
  | { outcome: "skipped" } // bereits erfolgreich ausgeführt (Idempotenz)
  | { outcome: "failed"; attempts: number; error: string } // Retry erwünscht
  | { outcome: "dead"; attempts: number; error: string }; // Event ist DEAD, kein Retry

export async function executeHandler(
  prisma: PrismaClient,
  eventId: string,
  handler: Pick<EventHandler, "name" | "handle">,
): Promise<ExecuteOutcome> {
  const event = await prisma.domainEvent.findUniqueOrThrow({ where: { id: eventId } });

  const existing = await prisma.eventHandlerExecution.findUnique({
    where: { eventId_handlerName: { eventId, handlerName: handler.name } },
  });
  if (existing?.status === "SUCCEEDED") return { outcome: "skipped" };

  const attempts = (existing?.attempts ?? 0) + 1;
  const execution = await prisma.eventHandlerExecution.upsert({
    where: { eventId_handlerName: { eventId, handlerName: handler.name } },
    update: { status: "RUNNING", attempts },
    create: { eventId, handlerName: handler.name, status: "RUNNING", attempts },
  });

  try {
    await handler.handle((event.payload ?? {}) as Record<string, unknown>, event);
    await prisma.eventHandlerExecution.update({
      where: { id: execution.id },
      data: { status: "SUCCEEDED", completedAt: new Date(), lastError: null },
    });
    return { outcome: "succeeded" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.eventHandlerExecution.update({
      where: { id: execution.id },
      data: { status: "FAILED", lastError: message },
    });
    if (attempts >= MAX_HANDLER_ATTEMPTS) {
      await prisma.domainEvent.update({
        where: { id: eventId },
        data: { status: "DEAD", attempts, lastError: `${handler.name}: ${message}` },
      });
      return { outcome: "dead", attempts, error: message };
    }
    await prisma.domainEvent.update({ where: { id: eventId }, data: { attempts } });
    return { outcome: "failed", attempts, error: message };
  }
}

/**
 * Markiert das Event PROCESSED, sobald alle erwarteten Handler SUCCEEDED sind.
 * Idempotent; Events ohne Handler werden direkt vom Dispatcher abgeschlossen.
 */
export async function finalizeEventIfComplete(
  prisma: PrismaClient,
  eventId: string,
  expectedHandlerNames: string[],
): Promise<boolean> {
  if (expectedHandlerNames.length === 0) return false;
  const succeeded = await prisma.eventHandlerExecution.count({
    where: { eventId, handlerName: { in: expectedHandlerNames }, status: "SUCCEEDED" },
  });
  if (succeeded < expectedHandlerNames.length) return false;
  await prisma.domainEvent.updateMany({
    where: { id: eventId, status: { in: ["PENDING", "PROCESSING"] } },
    data: { status: "PROCESSED", processedAt: new Date(), lastError: null },
  });
  return true;
}
