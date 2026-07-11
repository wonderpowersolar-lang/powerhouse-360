import { prisma } from "@ph360/database";
import { sendMail, leadNotifyTo } from "./mailer.js";

/**
 * Outbox dispatcher (WP-1.1 / WP-1.4 seed). Polls the domain_event table,
 * claims PENDING events optimistically, dispatches to handlers, and applies
 * retry/backoff. Idempotent: a claimed event is only processed once.
 * See docs/EVENT_MODEL.md.
 */

const POLL_INTERVAL_MS = 3000;
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;

type Handler = (payload: Record<string, unknown>) => Promise<void>;

const handlers: Record<string, Handler> = {
  "lead.created": async (payload) => {
    const name = String(payload.name ?? "Unbekannt");
    const email = String(payload.email ?? "—");
    const leadType = String(payload.leadType ?? "—");
    const source = payload.source ? String(payload.source) : "—";
    const modules = Array.isArray(payload.modules)
      ? (payload.modules as string[]).join(", ") || "—"
      : "—";

    await sendMail({
      to: leadNotifyTo,
      subject: `Neuer Lead: ${name} (${leadType})`,
      text: [
        `Neuer Lead über den Funnel.`,
        ``,
        `Name:    ${name}`,
        `E-Mail:  ${email}`,
        `Typ:     ${leadType}`,
        `Module:  ${modules}`,
        `Quelle:  ${source}`,
        ``,
        `Details im Admin: /admin/leads`,
      ].join("\n"),
    });
  },
};

function backoffSeconds(attempts: number): number {
  return Math.min(60 * 5, 5 * 2 ** attempts);
}

async function claimBatch(): Promise<
  { id: string; eventType: string; payload: unknown; attempts: number }[]
> {
  const candidates = await prisma.domainEvent.findMany({
    where: { status: "PENDING", availableAt: { lte: new Date() } },
    orderBy: { availableAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, eventType: true, payload: true, attempts: true },
  });

  const claimed: typeof candidates = [];
  for (const ev of candidates) {
    // Optimistic claim: only succeeds if still PENDING (guards concurrency).
    const res = await prisma.domainEvent.updateMany({
      where: { id: ev.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
    if (res.count === 1) claimed.push(ev);
  }
  return claimed;
}

async function processEvent(ev: {
  id: string;
  eventType: string;
  payload: unknown;
  attempts: number;
}): Promise<void> {
  const handler = handlers[ev.eventType];
  try {
    if (handler) {
      await handler((ev.payload ?? {}) as Record<string, unknown>);
    }
    // Unknown event types are marked processed (no handler registered yet).
    await prisma.domainEvent.update({
      where: { id: ev.id },
      data: { status: "PROCESSED", processedAt: new Date(), lastError: null },
    });
  } catch (err) {
    const attempts = ev.attempts + 1;
    const dead = attempts >= MAX_ATTEMPTS;
    await prisma.domainEvent.update({
      where: { id: ev.id },
      data: {
        status: dead ? "DEAD" : "PENDING",
        attempts,
        availableAt: new Date(Date.now() + backoffSeconds(attempts) * 1000),
        lastError: err instanceof Error ? err.message : String(err),
      },
    });
    console.error(
      `[worker] ${ev.eventType} ${ev.id} failed (attempt ${attempts}${
        dead ? ", DEAD" : ""
      }):`,
      err
    );
  }
}

async function tick(): Promise<void> {
  const batch = await claimBatch();
  if (batch.length === 0) return;
  console.log(`[worker] processing ${batch.length} event(s)`);
  for (const ev of batch) await processEvent(ev);
}

let running = true;

async function loop(): Promise<void> {
  while (running) {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] tick error:", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

function shutdown(signal: string): void {
  console.log(`[worker] ${signal} received, shutting down`);
  running = false;
  void prisma.$disconnect().finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("[worker] outbox dispatcher started");
void loop();
