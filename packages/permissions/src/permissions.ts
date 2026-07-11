/** The ONLY place permissions are defined (SECURITY_AND_PERMISSIONS §3). */
export const PERMISSIONS = [
  "lead.read",
  "lead.update",
  "audit.read",
  "member.read",
  "member.invite",
  "member.assign_role",
  "member.remove",
  "organization.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
