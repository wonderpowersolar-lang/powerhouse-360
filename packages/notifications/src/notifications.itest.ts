import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { notifyViaEmail } from "./notify";
import type { MailTransport } from "./transport";

async function makeEvent() {
  return prisma.domainEvent.create({
    data: {
      eventType: "lead.created",
      aggregateType: "Lead",
      aggregateId: "lead-1",
      payload: { name: "Vera", email: "v@example.test", leadType: "PROJECT_REQUEST" },
    },
  });
}

function fakeTransport(fail = false) {
  const sent: { to: string; subject: string }[] = [];
  const transport: MailTransport = {
    sendMail: async (opts) => {
      if (fail) throw new Error("SMTP down");
      sent.push({ to: opts.to, subject: opts.subject });
    },
  };
  return { transport, sent };
}

describe("packages/notifications — Zustellstatus + Duplikatfreiheit (WP-1.4)", () => {
  it("erzeugt genau eine Notification je (Event, Vorlage, Empfänger) — auch bei Handler-Retry", async () => {
    const ev = await makeEvent();
    const { transport, sent } = fakeTransport();
    const input = {
      recipient: "vertrieb@powerhouse360.test",
      templateKey: "lead.created.notify",
      payload: { name: "Vera", email: "v@example.test", leadType: "PROJECT_REQUEST" },
      eventId: ev.id,
    };

    const first = await notifyViaEmail(prisma, transport, input);
    const second = await notifyViaEmail(prisma, transport, input); // Retry-Simulation

    expect(first.status).toBe("SENT");
    expect(second.id).toBe(first.id); // Zeile wiederverwendet
    expect(sent).toHaveLength(1); // keine Doppelzustellung
    expect(await prisma.notification.count()).toBe(1);
    expect(first.subject).toContain("Neuer Lead");
  });

  it("Zustellfehler → Status FAILED mit Fehler; erneuter Versuch stellt dieselbe Zeile zu", async () => {
    const ev = await makeEvent();
    const bad = fakeTransport(true);
    const input = {
      recipient: "x@example.test",
      templateKey: "auth.password_reset",
      payload: { url: "https://app/reset" },
      eventId: ev.id,
    };

    await expect(notifyViaEmail(prisma, bad.transport, input)).rejects.toThrow("SMTP down");
    const failed = await prisma.notification.findFirstOrThrow({ where: { eventId: ev.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toContain("SMTP down");

    const good = fakeTransport();
    const retried = await notifyViaEmail(prisma, good.transport, input);
    expect(retried.id).toBe(failed.id);
    expect(retried.status).toBe("SENT");
    expect(good.sent).toHaveLength(1);
    expect(await prisma.notification.count()).toBe(1);
  });

  it("unbekannter templateKey wird abgelehnt, ohne eine Zeile zu erzeugen", async () => {
    const { transport } = fakeTransport();
    await expect(
      notifyViaEmail(prisma, transport, {
        recipient: "x@example.test",
        templateKey: "gibts.nicht",
        payload: {},
      }),
    ).rejects.toThrow("Unbekannter templateKey");
    expect(await prisma.notification.count()).toBe(0);
  });
});
