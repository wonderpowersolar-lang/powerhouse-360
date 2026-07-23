import { describe, it, expect } from "vitest";
import { SYSTEM_ROLES, roleHasPermission, resolvePermissions } from "./index";

const ALLOWED = ["PLATFORM_ADMIN", "OPERATIONS", "PROPERTY_MANAGER"] as const;

describe("object.read (WP-1.3-Kern)", () => {
  it("erlaubt PLATFORM_ADMIN, OPERATIONS und PROPERTY_MANAGER", () => {
    for (const role of ALLOWED) {
      expect(roleHasPermission(role, "object.read")).toBe(true);
    }
  });

  it("verweigert allen übrigen Rollen (deny-by-default, F-20)", () => {
    const allowed = new Set<string>(ALLOWED);
    for (const role of SYSTEM_ROLES) {
      if (allowed.has(role)) continue;
      expect(roleHasPermission(role, "object.read")).toBe(false);
    }
  });

  it("RESIDENT bleibt ohne Permissions (App-Permissions kommen erst mit WP-APP-2)", () => {
    expect(resolvePermissions(["RESIDENT"]).size).toBe(0);
  });
});
