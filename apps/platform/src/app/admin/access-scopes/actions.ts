"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@ph360/auth";
import { grantAccessScope, revokeAccessScope } from "../../../lib/access-scopes";

/** Guard (`accessscope.manage` im POWERHOUSE-Mandanten) liegt im Service. */
export async function grantScopeAction(formData: FormData) {
  const ctx = await getAuthContext(await headers());
  const scopeType = String(formData.get("scopeType") ?? "");
  if (scopeType !== "PROPERTY" && scopeType !== "BUILDING") {
    throw new Error(`Ungültiger Scope-Typ: ${scopeType}`);
  }
  await grantAccessScope(ctx, {
    organizationId: String(formData.get("organizationId") ?? ""),
    scopeType,
    propertyId: String(formData.get("propertyId") ?? "") || null,
    buildingId: String(formData.get("buildingId") ?? "") || null,
  });
  revalidatePath("/admin/access-scopes");
  revalidatePath("/admin/objects");
}

export async function revokeScopeAction(formData: FormData) {
  const ctx = await getAuthContext(await headers());
  await revokeAccessScope(ctx, String(formData.get("scopeId") ?? ""));
  revalidatePath("/admin/access-scopes");
  revalidatePath("/admin/objects");
}
