/** The ONLY place permissions are defined (Masterplan §8 — einzige Quelle des Permission-Katalogs). */
export const PERMISSIONS = [
  "lead.read",
  "lead.update",
  "audit.read",
  "member.read",
  "member.invite",
  "member.assign_role",
  "member.remove",
  "organization.read",
  "object.read",
  "lead.qualify",
  "customer.read",
  "object.import",
  "accessscope.manage",
  "project.read",
  "project.create",
  "document.read",
  "document.upload",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
