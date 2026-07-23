import { prisma } from "@ph360/database";

/**
 * Resolves the single Powerhouse tenant id. Admin pages/actions run after the
 * org has been seeded/bootstrapped, so this throws (rather than auto-creating)
 * if it is missing — an admin surface must never create the platform tenant.
 */
export async function getPowerhouseOrgId(): Promise<string> {
  const org = await prisma.organization.findFirstOrThrow({
    where: { type: "POWERHOUSE" },
  });
  return org.id;
}
