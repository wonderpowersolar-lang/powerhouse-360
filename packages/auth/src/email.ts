import { prisma, Prisma } from "@ph360/database";

type AuthEmailKind = "email_verification" | "password_reset" | "member_invited";

/** Enqueues an auth email through the transactional outbox (domain_event).
 *  apps/worker drains these; handlers key off eventType `auth.<kind>`. */
export async function enqueueAuthEmail(input: {
  kind: AuthEmailKind;
  email: string;
  url?: string;
  token?: string;
  organizationId?: string | null;
  extra?: Record<string, unknown>;
}): Promise<void> {
  await prisma.domainEvent.create({
    data: {
      eventType: `auth.${input.kind}`,
      aggregateType: "AuthEmail",
      aggregateId: input.email,
      organizationId: input.organizationId ?? null,
      payload: {
        email: input.email,
        url: input.url ?? null,
        token: input.token ?? null,
        ...input.extra,
      } as Prisma.InputJsonValue,
    },
  });
}
