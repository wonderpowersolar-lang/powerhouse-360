import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { requirePermission, AuthzError } from "@ph360/auth";
import type { Permission } from "@ph360/permissions";
import { createOrg, createUserWithMembership } from "./index.js";

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

// The permission each /admin route (or action) enforces — mirrors the page guards:
//   /admin/leads → lead.read (+ lead.qualify action) · /admin/members → member.read
//   (+ invite/assign_role actions) · /admin/audit → audit.read ·
//   /admin/customers → customer.read · /admin/access-scopes → accessscope.manage ·
//   CSV-Import (CLI/Action) → object.import
const ALL: Permission[] = [
  "lead.read",
  "member.read",
  "audit.read",
  "member.invite",
  "member.assign_role",
  "lead.qualify",
  "customer.read",
  "object.import",
  "accessscope.manage",
];

describe("route-level permission contract (F-20)", () => {
  it("RESIDENT is denied every admin route", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(org.id, "RESIDENT");
    const ctx = await ctxFor(user.id);
    for (const p of ALL) {
      await expect(requirePermission(ctx, p, { organizationId: org.id })).rejects.toBeInstanceOf(AuthzError);
    }
  });

  it("SALES may read leads/members but NOT audit or member management", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(org.id, "SALES");
    const ctx = await ctxFor(user.id);
    await expect(requirePermission(ctx, "lead.read", { organizationId: org.id })).resolves.toBeTruthy();
    await expect(requirePermission(ctx, "member.read", { organizationId: org.id })).resolves.toBeTruthy();
    for (const p of ["audit.read", "member.invite", "member.assign_role"] as const) {
      await expect(requirePermission(ctx, p, { organizationId: org.id })).rejects.toBeInstanceOf(AuthzError);
    }
  });

  it("SALES may qualify leads + read customers, but NOT import objects or manage access scopes (WP-1.3-Rest)", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(org.id, "SALES");
    const ctx = await ctxFor(user.id);
    await expect(requirePermission(ctx, "lead.qualify", { organizationId: org.id })).resolves.toBeTruthy();
    await expect(requirePermission(ctx, "customer.read", { organizationId: org.id })).resolves.toBeTruthy();
    for (const p of ["object.import", "accessscope.manage"] as const) {
      await expect(requirePermission(ctx, p, { organizationId: org.id })).rejects.toBeInstanceOf(AuthzError);
    }
  });

  it("OPERATIONS may read customers + import objects, but NOT qualify leads or manage access scopes (WP-1.3-Rest)", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(org.id, "OPERATIONS");
    const ctx = await ctxFor(user.id);
    await expect(requirePermission(ctx, "customer.read", { organizationId: org.id })).resolves.toBeTruthy();
    await expect(requirePermission(ctx, "object.import", { organizationId: org.id })).resolves.toBeTruthy();
    for (const p of ["lead.qualify", "accessscope.manage"] as const) {
      await expect(requirePermission(ctx, p, { organizationId: org.id })).rejects.toBeInstanceOf(AuthzError);
    }
  });

  it("PLATFORM_ADMIN may access every admin route", async () => {
    const org = await createOrg("PROPERTY_MANAGER");
    const { user } = await createUserWithMembership(org.id, "PLATFORM_ADMIN");
    const ctx = await ctxFor(user.id);
    for (const p of ALL) {
      await expect(requirePermission(ctx, p, { organizationId: org.id })).resolves.toBeTruthy();
    }
  });
});
