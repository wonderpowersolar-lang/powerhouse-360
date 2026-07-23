import type { Permission } from "./permissions";

/** System roles (mirror of the Prisma SystemRole enum — keep in sync). */
export const SYSTEM_ROLES = [
  "PLATFORM_ADMIN",
  "SALES",
  "OPERATIONS",
  "SERVICE",
  "FINANCE",
  "PROPERTY_MANAGER",
  "OWNER_BOARD",
  "BILLING_CONTACT",
  "INSTALLER_PARTNER_ADMIN",
  "INSTALLER",
  "RESIDENT",
  "PARKING_USER",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

const ALL: Permission[] = [
  "lead.read",
  "lead.update",
  "audit.read",
  "member.read",
  "member.invite",
  "member.assign_role",
  "member.remove",
  "organization.read",
];

/** Role → permissions (WP-1.2 scope). Empty = no capability until its feature ships. */
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  PLATFORM_ADMIN: ALL,
  SALES: ["lead.read", "lead.update", "member.read", "organization.read"],
  OPERATIONS: ["lead.read", "member.read", "organization.read"],
  SERVICE: ["lead.read", "member.read", "organization.read"],
  FINANCE: ["lead.read", "member.read", "organization.read"],
  PROPERTY_MANAGER: ["lead.read", "organization.read"],
  OWNER_BOARD: ["organization.read"],
  BILLING_CONTACT: [],
  INSTALLER_PARTNER_ADMIN: [],
  INSTALLER: [],
  RESIDENT: [],
  PARKING_USER: [],
};
