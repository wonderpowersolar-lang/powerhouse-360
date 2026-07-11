import { describe, it, expect } from "vitest";
import {
  SYSTEM_ROLES,
  ROLE_PERMISSIONS,
  roleHasPermission,
  resolvePermissions,
  canAny,
} from "./index.js";

describe("roleHasPermission", () => {
  it("PLATFORM_ADMIN has every permission", () => {
    for (const p of ROLE_PERMISSIONS.PLATFORM_ADMIN) expect(roleHasPermission("PLATFORM_ADMIN", p)).toBe(true);
    expect(roleHasPermission("PLATFORM_ADMIN", "member.invite")).toBe(true);
  });

  it("SALES can read/update leads but NOT invite, assign roles, or read audit", () => {
    expect(roleHasPermission("SALES", "lead.read")).toBe(true);
    expect(roleHasPermission("SALES", "lead.update")).toBe(true);
    expect(roleHasPermission("SALES", "member.invite")).toBe(false);
    expect(roleHasPermission("SALES", "member.assign_role")).toBe(false);
    expect(roleHasPermission("SALES", "audit.read")).toBe(false);
  });

  it("member management + audit.read are PLATFORM_ADMIN-only in WP-1.2", () => {
    const adminOnly = ["member.invite", "member.assign_role", "member.remove", "audit.read"] as const;
    for (const role of SYSTEM_ROLES) {
      if (role === "PLATFORM_ADMIN") continue;
      for (const p of adminOnly) expect(roleHasPermission(role, p)).toBe(false);
    }
  });

  it("resolvePermissions unions multiple roles", () => {
    const set = resolvePermissions(["SALES", "OWNER_BOARD"]);
    expect(set.has("lead.update")).toBe(true);
    expect(set.has("organization.read")).toBe(true);
    expect(set.has("audit.read")).toBe(false);
  });

  it("feature-less roles grant nothing", () => {
    for (const role of ["RESIDENT", "INSTALLER", "PARKING_USER", "BILLING_CONTACT"] as const) {
      expect(resolvePermissions([role]).size).toBe(0);
    }
  });

  it("canAny works across a role list", () => {
    expect(canAny(["RESIDENT", "SALES"], "lead.read")).toBe(true);
    expect(canAny(["RESIDENT", "OWNER_BOARD"], "lead.read")).toBe(false);
  });
});
