import { prisma } from "@ph360/database";
import { auth } from "@ph360/auth";

/**
 * Bootstraps (or repairs) the platform admin. Replaces the interim Basic-Auth
 * operator credentials. Requires ADMIN_EMAIL + ADMIN_PASSWORD in the environment
 * and a seeded POWERHOUSE organization. Idempotent: re-running upserts the
 * membership and leaves an existing user untouched.
 *
 *   ADMIN_EMAIL=admin@powerhouse360.de ADMIN_PASSWORD='…' pnpm ph360:create-admin
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.");
  }

  const org = await prisma.organization.findFirstOrThrow({ where: { type: "POWERHOUSE" } });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // The invitation-only `user.create.before` hook allows this signup when the
    // user table is empty and email === ADMIN_EMAIL. If other users already
    // exist, seed a short-lived bootstrap invitation so the hook lets it through.
    if ((await prisma.user.count()) > 0) {
      await prisma.invitation.create({
        data: {
          email,
          organizationId: org.id,
          role: "PLATFORM_ADMIN",
          token: `bootstrap-${Date.now()}`,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
    }
    const res = await auth.api.signUpEmail({ body: { email, password, name: "Platform Admin" } });
    user = await prisma.user.update({ where: { id: res.user.id }, data: { emailVerified: true } });
  }

  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: "PLATFORM_ADMIN", status: "ACTIVE" },
    create: { userId: user.id, organizationId: org.id, role: "PLATFORM_ADMIN" },
  });

  console.log(`[create-admin] ${email} is PLATFORM_ADMIN in ${org.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
