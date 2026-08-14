import { describe, it, expect } from "vitest";
import { SYSTEM_ROLES, roleHasPermission } from "./index";

/** WP-1.5: project.read/create · document.read/upload */
const MATRIX: Record<string, readonly string[]> = {
  "project.read": ["PLATFORM_ADMIN", "SALES", "OPERATIONS", "SERVICE"],
  "project.create": ["PLATFORM_ADMIN", "OPERATIONS"],
  "document.read": ["PLATFORM_ADMIN", "SALES", "OPERATIONS", "SERVICE"],
  "document.upload": ["PLATFORM_ADMIN", "SALES", "OPERATIONS"],
};

describe("WP-1.5-Permissions (F-20)", () => {
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
