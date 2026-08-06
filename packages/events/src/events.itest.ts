import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import {
  publishEvent,
  UnknownEventTypeError,
  executeHandler,
  finalizeEventIfComplete,
  requeueDeadEvent,
  MAX_HANDLER_ATTEMPTS,
} from "./index";

async function makeEvent(eventType = "lead.qualified") {
  const org = await prisma.organization.create({
    data: { type: "POWERHOUSE", name: `Events-Org ${Date.now()}-${Math.random()}` },
  });
  const lead = { leadId: "11111111-1111-4111-8111-111111111111" };
  return publishEvent(prisma, {
    eventType,
    aggregateType: "Lead",
    aggregateId: lead.leadId,
    organizationId: org.id,
    payload: {
      leadId: lead.leadId,
      customerId: "22222222-2222-4222-8222-222222222222",
      propertyId: null,
    },
  });
}

describe("packages/events — Outbox-Publisher (ADR-001, Masterplan §3)", () => {
  it("publiziert Katalog-Events mit Envelope (version, actor) und validiert den Payload", async () => {
    const ev = await makeEvent();
    expect(ev.status).toBe("PENDING");
    expect(ev.version).toBe(1);

    await expect(
      publishEvent(prisma, {
        eventType: "lead.qualified",
        aggregateType: "Lead",
        aggregateId: "x",
        payload: { leadId: "keine-uuid", customerId: "auch-nicht", propertyId: null },
      }),
    ).rejects.toThrow(); // Zod
  });

  it("lehnt unbekannte eventTypes ab (keine Tippfehler-Events)", async () => {
    await expect(
      publishEvent(prisma, {
        eventType: "lead.craeted",
        aggregateType: "Lead",
        aggregateId: "x",
        payload: {},
      }),
    ).rejects.toBeInstanceOf(UnknownEventTypeError);
    expect(await prisma.domainEvent.count()).toBe(0);
  });
});

describe("packages/events — Executor-Idempotenz (F-19/F-20-Absicherung, WP-1.4-Gate)", () => {
  it("doppelte Zustellung → genau eine Wirkung (EventHandlerExecution-Unique)", async () => {
    const ev = await makeEvent();
    let sideEffects = 0;
    const handler = {
      name: "test-once",
      handle: async () => {
        sideEffects++;
      },
    };

    const first = await executeHandler(prisma, ev.id, handler);
    const second = await executeHandler(prisma, ev.id, handler); // at-least-once-Duplikat

    expect(first.outcome).toBe("succeeded");
    expect(second.outcome).toBe("skipped");
    expect(sideEffects).toBe(1);
    expect(await prisma.eventHandlerExecution.count({ where: { eventId: ev.id } })).toBe(1);
  });

  it("Fehlversuche zählen hoch; ab MAX_HANDLER_ATTEMPTS wird das Event DEAD (Dead-Letter sichtbar)", async () => {
    const ev = await makeEvent();
    const failing = {
      name: "test-fail",
      handle: async () => {
        throw new Error("kaputt");
      },
    };

    for (let i = 1; i < MAX_HANDLER_ATTEMPTS; i++) {
      const r = await executeHandler(prisma, ev.id, failing);
      expect(r.outcome).toBe("failed");
    }
    const last = await executeHandler(prisma, ev.id, failing);
    expect(last.outcome).toBe("dead");

    const reloaded = await prisma.domainEvent.findUniqueOrThrow({ where: { id: ev.id } });
    expect(reloaded.status).toBe("DEAD");
    expect(reloaded.lastError).toContain("kaputt");
    const exec = await prisma.eventHandlerExecution.findUniqueOrThrow({
      where: { eventId_handlerName: { eventId: ev.id, handlerName: "test-fail" } },
    });
    expect(exec.attempts).toBe(MAX_HANDLER_ATTEMPTS);
    expect(exec.status).toBe("FAILED");
  });

  it("finalizeEventIfComplete markiert PROCESSED erst, wenn ALLE Handler erfolgreich sind", async () => {
    const ev = await makeEvent();
    const a = { name: "h-a", handle: async () => undefined };
    const b = { name: "h-b", handle: async () => undefined };

    await executeHandler(prisma, ev.id, a);
    expect(await finalizeEventIfComplete(prisma, ev.id, ["h-a", "h-b"])).toBe(false);

    await executeHandler(prisma, ev.id, b);
    expect(await finalizeEventIfComplete(prisma, ev.id, ["h-a", "h-b"])).toBe(true);

    const reloaded = await prisma.domainEvent.findUniqueOrThrow({ where: { id: ev.id } });
    expect(reloaded.status).toBe("PROCESSED");
    expect(reloaded.processedAt).not.toBeNull();
  });

  it("requeueDeadEvent: auditierter manueller Retry setzt DEAD → PENDING und nullt Versuche", async () => {
    const ev = await makeEvent();
    const failing = { name: "test-fail", handle: async () => Promise.reject(new Error("x")) };
    for (let i = 0; i < MAX_HANDLER_ATTEMPTS; i++) await executeHandler(prisma, ev.id, failing);
    expect((await prisma.domainEvent.findUniqueOrThrow({ where: { id: ev.id } })).status).toBe("DEAD");

    await requeueDeadEvent(prisma, ev.id, { actorId: "u-ops" });

    const reloaded = await prisma.domainEvent.findUniqueOrThrow({ where: { id: ev.id } });
    expect(reloaded.status).toBe("PENDING");
    expect(reloaded.attempts).toBe(0);
    const exec = await prisma.eventHandlerExecution.findUniqueOrThrow({
      where: { eventId_handlerName: { eventId: ev.id, handlerName: "test-fail" } },
    });
    expect(exec.attempts).toBe(0);
    const audit = await prisma.auditEvent.findFirst({ where: { action: "event.requeued", subjectId: ev.id } });
    expect(audit?.actorId).toBe("u-ops");

    // Nicht-DEAD-Events sind nicht requeue-bar
    await expect(requeueDeadEvent(prisma, ev.id)).rejects.toThrow("nicht DEAD");
  });
});
