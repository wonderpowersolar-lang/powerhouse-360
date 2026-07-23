import { prisma } from "@ph360/database";
import { auth } from "./auth";
import type { SystemRole } from "@ph360/permissions";

export interface Membership {
  organizationId: string;
  role: SystemRole;
}

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  memberships: Membership[];
}

/** Resolves the auth context from request headers, or null if unauthenticated.
 *  better-auth's getSession returns `{ session, user } | null` — user is a
 *  sibling of session, not nested. */
export async function getAuthContext(headers: Headers): Promise<AuthContext | null> {
  const result = await auth.api.getSession({ headers });
  if (!result) return null;
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: result.user.id, status: "ACTIVE" },
    select: { organizationId: true, role: true },
  });
  return {
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    memberships: memberships.map((m) => ({ organizationId: m.organizationId, role: m.role as SystemRole })),
  };
}
