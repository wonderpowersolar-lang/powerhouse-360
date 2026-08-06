import type { Prisma, PrismaClient, DomainEvent } from "@ph360/database";
import { EVENT_SCHEMAS, isKnownEventType, type EventType } from "./catalog";

type Db = PrismaClient | Prisma.TransactionClient;

export class UnknownEventTypeError extends Error {
  constructor(eventType: string) {
    super(`Unbekannter eventType "${eventType}" — im Katalog (packages/events) registrieren`);
    this.name = "UnknownEventTypeError";
  }
}

export type PublishEventInput = {
  eventType: EventType | (string & {});
  aggregateType: string;
  aggregateId: string;
  organizationId?: string | null;
  actorId?: string | null;
  payload: Record<string, unknown>;
  correlationId?: string | null;
  causationId?: string | null;
  /** Schema-Version des Payloads (Masterplan §3); Default 1. */
  version?: number;
};

/**
 * Publiziert ein Domain-Event über die transaktionale Outbox (ADR-001).
 * IMMER mit dem Transaktions-Client der zugehörigen Zustandsänderung aufrufen —
 * kein Event ohne Zustandsänderung und umgekehrt. Payload wird gegen den
 * Katalog validiert; unbekannte Typen werden abgelehnt.
 */
export async function publishEvent(db: Db, input: PublishEventInput): Promise<DomainEvent> {
  if (!isKnownEventType(input.eventType)) throw new UnknownEventTypeError(input.eventType);
  const payload = EVENT_SCHEMAS[input.eventType].parse(input.payload);
  return db.domainEvent.create({
    data: {
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      organizationId: input.organizationId ?? null,
      actorId: input.actorId ?? null,
      version: input.version ?? 1,
      payload: payload as Prisma.InputJsonValue,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
    },
  });
}
