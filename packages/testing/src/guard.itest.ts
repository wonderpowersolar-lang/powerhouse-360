import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { requirePermission, assertOrgScope, AuthzError, AuthnError } from "@ph360/auth";
import { createOrg, createLead, createUserWithMembership } from "./index.js";

// Build an AuthContext directly from memberships (no HTTP needed for guard tests).
async function ctxFor(userId: string) {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { organizationId: true, role: true },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return {
    userId,
    email: user.email,
    name: user.name,
    memberships: memberships.map((m) => ({ organizationId: m.organizationId, role: m.role as never })),
  };
}

describe("requirePermission — tenant isolation (F-02) + role matrix (F-20)", () => {
  it("allows a SALES user to read leads in their own org", async () => {
    const orgA = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(orgA.id, "SALES");
    const ctx = await ctxFor(user.id);
    await expect(requirePermission(ctx, "lead.read", { organizationId: orgA.id })).resolves.toBeTruthy();
  });

  it("denies cross-tenant access (SALES in A cannot read B) and writes an authz.denied audit", async () => {
    const orgA = await createOrg("PROPERTY_MANAGER");
    const orgB = await createOrg("WEG");
    const { user } = await createUserWithMembership(orgA.id, "SALES");
    await createLead(orgB.id);
    const ctx = await ctxFor(user.id);
    await expect(requirePermission(ctx, "lead.read", { organizationId: orgB.id })).rejects.toBeInstanceOf(AuthzError);
    const audits = await prisma.auditEvent.findMany({ where: { action: "authz.denied", actorId: user.id } });
    expect(audits.length).toBe(1);
    expect((audits[0]!.after as { reason: string }).reason).toBe("no_membership");
  });

  it("denies forbidden actions per role (F-20): SALES cannot invite/assign_role/read audit", async () => {
    const orgA = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(orgA.id, "SALES");
    const ctx = await ctxFor(user.id);
    for (const perm of ["member.invite", "member.assign_role", "audit.read"] as const) {
      await expect(requirePermission(ctx, perm, { organizationId: orgA.id })).rejects.toBeInstanceOf(AuthzError);
    }
  });

  it("assertOrgScope throws AuthnError without a context", () => {
    expect(() => assertOrgScope(null, "x")).toThrow(AuthnError);
  });
});
