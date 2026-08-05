"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@ph360/auth";
import { qualifyLead, qualifyLeadInputSchema } from "../../../lib/crm";

/**
 * Lead qualifizieren → Kunde/Objekt (F-03). Guard (`lead.qualify`) und
 * Transaktion liegen im Domain-Service `qualifyLead` — die Action ist nur
 * der Form-Adapter.
 */
export async function qualifyLeadAction(formData: FormData) {
  const ctx = await getAuthContext(await headers());
  const leadId = String(formData.get("leadId") ?? "");
  const input = qualifyLeadInputSchema.parse({
    organizationType: String(formData.get("organizationType") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    propertyName: String(formData.get("propertyName") ?? ""),
  });
  await qualifyLead(ctx, leadId, input);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/objects");
}
