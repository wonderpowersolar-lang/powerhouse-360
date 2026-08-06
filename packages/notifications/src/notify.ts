import type { Prisma, PrismaClient, Notification } from "@ph360/database";
import { renderTemplate } from "./templates";
import { mailFrom, type MailTransport } from "./transport";

/**
 * Benachrichtigung mit Zustellstatus (WP-1.4): eine `Notification`-Zeile je
 * (Event, Vorlage, Empfänger) — der Unique-Constraint macht Handler-Retries
 * duplikatfrei: existiert die Zeile schon, wird sie wiederverwendet und nur
 * zugestellt, wenn sie noch nicht SENT ist.
 */
export async function notifyViaEmail(
  prisma: PrismaClient,
  transport: MailTransport,
  input: {
    recipient: string;
    templateKey: string;
    payload: Record<string, unknown>;
    organizationId?: string | null;
    eventId?: string | null;
  },
): Promise<Notification> {
  const rendered = renderTemplate(input.templateKey, input.payload);

  let notification =
    input.eventId != null
      ? await prisma.notification.findUnique({
          where: {
            eventId_templateKey_recipient: {
              eventId: input.eventId,
              templateKey: input.templateKey,
              recipient: input.recipient,
            },
          },
        })
      : null;
  notification ??= await prisma.notification.create({
    data: {
      organizationId: input.organizationId ?? null,
      eventId: input.eventId ?? null,
      channel: "EMAIL",
      recipient: input.recipient,
      templateKey: input.templateKey,
      payload: input.payload as Prisma.InputJsonValue,
      subject: rendered.subject,
    },
  });
  if (notification.status === "SENT") return notification;

  try {
    await transport.sendMail({
      from: mailFrom,
      to: input.recipient,
      subject: rendered.subject,
      text: rendered.text,
    });
    return await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date(), error: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", error: message },
    });
    throw err; // Retry-Entscheidung liegt beim Aufrufer (Executor/pg-boss)
  }
}
