import { prisma, Prisma } from "@ph360/database";

type Client = typeof prisma | Prisma.TransactionClient;

/** Writes an AuditEvent using our real columns (see schema.prisma `audit_event`). */
export async function recordAudit(
  db: Client,
  input: {
    action: string;
    subjectType: string;
    subjectId: string;
    actorId?: string | null;
    actorType?: "USER" | "SYSTEM" | "WEBHOOK";
    organizationId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    requestId?: string | null;
  },
): Promise<void> {
  await db.auditEvent.create({
    data: {
      action: input.action,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      actorType: input.actorType ?? "USER",
      actorId: input.actorId ?? null,
      organizationId: input.organizationId ?? null,
      before: input.before,
      after: input.after,
      requestId: input.requestId ?? null,
    },
  });
}
