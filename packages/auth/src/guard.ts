import { prisma } from "@ph360/database";
import { canAny, type Permission } from "@ph360/permissions";
import { recordAudit } from "./audit.js";
import type { AuthContext } from "./context.js";

export class AuthnError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "AuthnError";
  }
}

export class AuthzError extends Error {
  constructor(msg = "Forbidden") {
    super(msg);
    this.name = "AuthzError";
  }
}

function rolesForOrg(ctx: AuthContext, organizationId: string) {
  return ctx.memberships.filter((m) => m.organizationId === organizationId).map((m) => m.role);
}

export function assertOrgScope(ctx: AuthContext | null, organizationId: string): AuthContext {
  if (!ctx) throw new AuthnError();
  if (rolesForOrg(ctx, organizationId).length === 0) throw new AuthzError("Outside tenant scope");
  return ctx;
}

/** Deny-by-default. Throws AuthnError (401) / AuthzError (403). Denials are audited. */
export async function requirePermission(
  ctx: AuthContext | null,
  permission: Permission,
  opts: { organizationId: string },
): Promise<AuthContext> {
  if (!ctx) throw new AuthnError();
  const roles = rolesForOrg(ctx, opts.organizationId);
  const allowed = roles.length > 0 && canAny(roles, permission);
  if (!allowed) {
    // Best-effort audit: a failed audit write must never mask the denial itself
    // (e.g. a bogus organizationId would FK-violate — we still deny, loudly).
    await recordAudit(prisma, {
      action: "authz.denied",
      subjectType: "Permission",
      subjectId: permission,
      actorType: "USER",
      actorId: ctx.userId,
      organizationId: opts.organizationId,
      after: { permission, reason: roles.length === 0 ? "no_membership" : "role_lacks_permission" },
    }).catch((err) => {
      console.error("[auth] failed to record authz.denied audit", err);
    });
    throw new AuthzError();
  }
  return ctx;
}
