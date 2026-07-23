import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import {
  createInvitation,
  acceptInvitation,
  changeMemberRole,
  InvitationError,
} from "@ph360/auth";
import { createOrg, createUserWithMembership } from "./index.js";

describe("invitation lifecycle + audit (F-19)", () => {
  it("invite → accept creates membership + audits member.invited & member.joined", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user: admin } = await createUserWithMembership(org.id, "PLATFORM_ADMIN");
    const { token } = await createInvitation({
      email: "new@example.test",
      organizationId: org.id,
      role: "SALES",
      invitedById: admin.id,
    });
    const invitedEvent = await prisma.auditEvent.findFirst({ where: { action: "member.invited" } });
    expect(invitedEvent).not.toBeNull();

    await acceptInvitation({ token, name: "Neu Nutzer", password: "another-pass-1!" });
    const membership = await prisma.organizationMembership.findFirst({
      where: { organizationId: org.id, role: "SALES" },
    });
    expect(membership).not.toBeNull();
    const joined = await prisma.auditEvent.findFirst({ where: { action: "member.joined" } });
    expect(joined).not.toBeNull();
    const invite = await prisma.invitation.findFirst({ where: { token } });
    expect(invite!.status).toBe("ACCEPTED");
  });

  it("rejects an expired invitation", async () => {
    const org = await createOrg("WEG");
    await prisma.invitation.create({
      data: {
        email: "x@example.test",
        organizationId: org.id,
        role: "SALES",
        token: "expired-1",
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await expect(
      acceptInvitation({ token: "expired-1", name: "X", password: "pass-word-1!" }),
    ).rejects.toBeInstanceOf(InvitationError);
  });

  it("rejects an already-accepted invitation (no reuse)", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user: admin } = await createUserWithMembership(org.id, "PLATFORM_ADMIN");
    const { token } = await createInvitation({
      email: "once@example.test",
      organizationId: org.id,
      role: "SALES",
      invitedById: admin.id,
    });
    await acceptInvitation({ token, name: "Once", password: "reuse-pass-1!" });
    await expect(
      acceptInvitation({ token, name: "Twice", password: "reuse-pass-2!" }),
    ).rejects.toBeInstanceOf(InvitationError);
  });

  it("changeMemberRole audits member.role_changed", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { membership, user } = await createUserWithMembership(org.id, "SALES");
    await changeMemberRole({ membershipId: membership.id, role: "OPERATIONS", actorId: user.id });
    const ev = await prisma.auditEvent.findFirst({ where: { action: "member.role_changed" } });
    expect(ev).not.toBeNull();
    expect((ev!.after as { role: string }).role).toBe("OPERATIONS");
  });
});
