import type { Permission } from "./permissions";
import { ROLE_PERMISSIONS, type SystemRole } from "./roles";

export function roleHasPermission(role: SystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Union of all permissions granted by the given roles. */
export function resolvePermissions(roles: SystemRole[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const role of roles) for (const p of ROLE_PERMISSIONS[role] ?? []) out.add(p);
  return out;
}

export function canAny(roles: SystemRole[], permission: Permission): boolean {
  return roles.some((r) => roleHasPermission(r, permission));
}
