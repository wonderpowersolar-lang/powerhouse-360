import { randomBytes } from "node:crypto";
import { prisma } from "@ph360/database";
import type { SystemRole } from "@ph360/permissions";
import { auth } from "./auth.js";
import { recordAudit } from "./audit.js";
import { enqueueAuthEmail } from "./email.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

/**
 * Creates a pending invitation, enqueues the invite email (outbox → worker) and
 * writes a `member.invited` audit event. Returns the token for the accept URL.
 */
export async function createInvitation(input: {
  email: string;
  organizationId: string;
  role: SystemRole;
  invitedById: string;
}): Promise<{ id: string; token: string }> {
  const email = input.email.trim().toLowerCase();
  const token = randomBytes(24).toString("base64url");
  const invitation = await prisma.invitation.create({
    data: {
      email,
      organizationId: input.organizationId,
      role: input.role,
      token,
      invitedById: input.invitedById,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { name: true },
  });
  await enqueueAuthEmail({
    kind: "member_invited",
    email,
    organizationId: input.organizationId,
    url: `${process.env.AUTH_URL ?? "http://localhost:3100"}/invite/${token}`,
    extra: { organizationName: org?.name ?? "Powerhouse 360" },
  });
  await recordAudit(prisma, {
    action: "member.invited",
    subjectType: "Invitation",
    subjectId: invitation.id,
    actorId: input.invitedById,
    organizationId: input.organizationId,
    after: { email, role: input.role },
  });
  return { id: invitation.id, token };
}

/**
 * Accepts a pending invitation: creates the better-auth user (the invitation-only
 * `user.create.before` hook allows it because the invite is still PENDING),
 * verifies the email, creates the org membership, marks the invite ACCEPTED and
 * audits `member.joined` — all in one transaction so the invite cannot be reused.
 */
export async function acceptInvitation(input: {
  token: string;
  name: string;
  password: string;
}): Promise<{ userId: string }> {
  const invitation = await prisma.invitation.findUnique({ where: { token: input.token } });
  if (!invitation || invitation.status !== "PENDING") {
    throw new InvitationError("Einladung ungültig.");
  }
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    throw new InvitationError("Einladung abgelaufen.");
  }
  const { user } = await auth.api.signUpEmail({
    body: { email: invitation.email, password: input.password, name: input.name },
  });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    await tx.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        invitedById: invitation.invitedById,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    await recordAudit(tx, {
      action: "member.joined",
      subjectType: "User",
      subjectId: user.id,
      actorId: user.id,
      organizationId: invitation.organizationId,
      after: { email: invitation.email, role: invitation.role },
    });
  });
  return { userId: user.id };
}

/** Changes a member's role and audits `member.role_changed` (before/after). */
export async function changeMemberRole(input: {
  membershipId: string;
  role: SystemRole;
  actorId: string;
}) {
  const before = await prisma.organizationMembership.findUniqueOrThrow({
    where: { id: input.membershipId },
  });
  const after = await prisma.organizationMembership.update({
    where: { id: input.membershipId },
    data: { role: input.role },
  });
  await recordAudit(prisma, {
    action: "member.role_changed",
    subjectType: "OrganizationMembership",
    subjectId: after.id,
    actorId: input.actorId,
    organizationId: after.organizationId,
    before: { role: before.role },
    after: { role: after.role },
  });
  return after;
}
