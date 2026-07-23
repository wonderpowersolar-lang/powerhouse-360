import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient(); // same-origin /api/auth
export const { signIn, signOut, useSession } = authClient;
