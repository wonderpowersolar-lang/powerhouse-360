import type { PrismaClient } from "@ph360/database";

/**
 * Auditierter manueller Retry eines DEAD-Events (ADR-001 / Masterplan §3:
 * „Dead-Letter sichtbar mit auditiertem manuellen Retry"). Setzt das Event
 * auf PENDING zurück und nullt die Versuchszähler der nicht erfolgreichen
 * Handler-Executions, damit der Dispatcher es erneut zustellt.
 */
export async function requeueDeadEvent(
  prisma: PrismaClient,
  eventId: string,
  actor: { actorId?: string | null } = {},
): Promise<void> {
  const event = await prisma.domainEvent.findUniqueOrThrow({ where: { id: eventId } });
  if (event.status !== "DEAD") {
    throw new Error(`Event ${eventId} ist ${event.status}, nicht DEAD — kein Requeue`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.eventHandlerExecution.updateMany({
      where: { eventId, status: { not: "SUCCEEDED" } },
      data: { attempts: 0, status: "FAILED" },
    });
    await tx.domainEvent.update({
      where: { id: eventId },
      data: { status: "PENDING", attempts: 0, availableAt: new Date(), lastError: null },
    });
    await tx.auditEvent.create({
      data: {
        organizationId: event.organizationId,
        actorType: actor.actorId ? "USER" : "SYSTEM",
        actorId: actor.actorId ?? null,
        action: "event.requeued",
        subjectType: "DomainEvent",
        subjectId: eventId,
        before: { status: "DEAD", lastError: event.lastError },
        after: { status: "PENDING" },
      },
    });
  });
}
