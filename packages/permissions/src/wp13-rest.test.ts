import { describe, it, expect } from "vitest";
import { SYSTEM_ROLES, roleHasPermission } from "./index";

/** WP-1.3-Rest: lead.qualify · customer.read · object.import · accessscope.manage */
const MATRIX: Record<string, readonly string[]> = {
  "lead.qualify": ["PLATFORM_ADMIN", "SALES"],
  "customer.read": ["PLATFORM_ADMIN", "SALES", "OPERATIONS"],
  "object.import": ["PLATFORM_ADMIN", "OPERATIONS"],
  "accessscope.manage": ["PLATFORM_ADMIN"],
};

describe("WP-1.3-Rest-Permissions (F-20)", () => {
  for (const [permission, allowed] of Object.entries(MATRIX)) {
    it(`${permission}: erlaubt genau ${allowed.join(", ")}`, () => {
      const allowedSet = new Set(allowed);
      for (const role of SYSTEM_ROLES) {
        expect(
          roleHasPermission(role, permission as never),
          `${role} → ${permission}`,
        ).toBe(allowedSet.has(role));
      }
    });
  }
});
