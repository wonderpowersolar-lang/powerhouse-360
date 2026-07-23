import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { prisma } from "@ph360/database";
import { enqueueAuthEmail } from "./email";
import { recordAudit } from "./audit";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false, // gated below by user.create.before (invitation-only)
    requireEmailVerification: true,
    minPasswordLength: 8,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url, token }) => {
      await enqueueAuthEmail({ kind: "password_reset", email: user.email, url, token });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url, token }) => {
      // Skip invitation-based signups: acceptInvitation() verifies the email in
      // the same transaction, so a verification link would be pointless and
      // confusing. At this point (during signUpEmail) the invite is still PENDING.
      const pendingInvite = await prisma.invitation.findFirst({
        where: {
          email: { equals: user.email.toLowerCase(), mode: "insensitive" },
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });
      if (pendingInvite) return;
      await enqueueAuthEmail({ kind: "email_verification", email: user.email, url, token });
    },
  },
  user: {
    additionalFields: {
      locale: { type: "string", required: false, defaultValue: "de", input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Invitation-only: allow if a pending, non-expired invite exists for the email,
          // OR the bootstrap admin (email === ADMIN_EMAIL and no users yet).
          const email = user.email.toLowerCase();
          const invite = await prisma.invitation.findFirst({
            where: {
              email: { equals: email, mode: "insensitive" },
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
          });
          if (invite) return;
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          if (adminEmail && email === adminEmail) {
            const count = await prisma.user.count();
            if (count === 0) return;
          }
          // Throw APIError (not a plain Error) so better-auth returns a clean 4xx
          // with this message instead of an opaque 500.
          throw new APIError("BAD_REQUEST", { message: "Sign-up is invitation-only." });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await recordAudit(prisma, {
            action: "auth.login",
            subjectType: "User",
            subjectId: session.userId,
            actorType: "USER",
            actorId: session.userId,
          });
        },
      },
    },
  },
  plugins: [nextCookies()], // MUST be last
});

export type Auth = typeof auth;
