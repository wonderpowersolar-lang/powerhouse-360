"use server";

import { redirect } from "next/navigation";
import { acceptInvitation, InvitationError } from "@ph360/auth";

export interface AcceptState {
  error: string;
}

/**
 * Accepts an invitation and redirects to the login page on success.
 *
 * Signature is `(token, prevState, formData)` so `acceptAction.bind(null, token)`
 * yields the `(prevState, formData)` shape `useActionState` expects.
 *
 * Only `InvitationError` (invalid/expired token) is surfaced to the user; any
 * other failure is rethrown to the error boundary. Name/password are validated
 * here first so a too-short password returns a clean message instead of an
 * opaque better-auth error from `signUpEmail`.
 */
export async function acceptAction(
  token: string,
  _prev: AcceptState | null,
  formData: FormData,
): Promise<AcceptState> {
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2) return { error: "Bitte gib deinen Namen an." };
  if (password.length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };

  try {
    await acceptInvitation({ token, name, password });
  } catch (e) {
    if (e instanceof InvitationError) return { error: e.message };
    throw e;
  }
  redirect("/login?next=/admin/leads");
}
