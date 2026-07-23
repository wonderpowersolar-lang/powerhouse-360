"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuthContext, requirePermission, createInvitation, changeMemberRole } from "@ph360/auth";
import { SYSTEM_ROLES, type SystemRole } from "@ph360/permissions";
import { getPowerhouseOrgId } from "../../../lib/org";

function parseRole(value: FormDataEntryValue | null): SystemRole {
  const role = String(value ?? "");
  if (!(SYSTEM_ROLES as readonly string[]).includes(role)) {
    throw new Error(`Ungültige Rolle: ${role}`);
  }
  return role as SystemRole;
}

function parseEmail(value: FormDataEntryValue | null): string {
  const email = String(value ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Ungültige E-Mail-Adresse.");
  }
  return email;
}

export async function inviteAction(formData: FormData) {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "member.invite", { organizationId });
  await createInvitation({
    email: parseEmail(formData.get("email")),
    role: parseRole(formData.get("role")),
    organizationId,
    invitedById: ctx!.userId,
  });
  revalidatePath("/admin/members");
}

export async function changeRoleAction(formData: FormData) {
  const ctx = await getAuthContext(await headers());
  const organizationId = await getPowerhouseOrgId();
  await requirePermission(ctx, "member.assign_role", { organizationId });
  await changeMemberRole({
    membershipId: String(formData.get("membershipId")),
    role: parseRole(formData.get("role")),
    actorId: ctx!.userId,
  });
  revalidatePath("/admin/members");
}
