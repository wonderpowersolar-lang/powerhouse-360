import { z } from "zod";
import { prisma, Prisma, type OrganizationType } from "@ph360/database";
import { requirePermission, recordAudit } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { publishEvent } from "@ph360/events";

/**
 * Lead-Qualifizierung (WP-1.3-Rest, Gate F-03): überführt einen Lead ohne
 * Doppelerfassung in Customer + CustomerContact + (optional) Property.
 * Masterplan §4 Nr. 2: der Kunde IST eine Organization — die Property gehört
 * der Kunden-Org, nie dem POWERHOUSE-Mandanten. Alles in einer Transaktion
 * inkl. LeadActivity, Audit-Event und Outbox-Event `lead.qualified` (§3-Katalog).
 */

const CUSTOMER_ORG_TYPES = [
  "PROPERTY_MANAGER",
  "WEG",
  "OWNER",
  "ASSET_HOLDER",
  "COOPERATIVE",
  "OTHER",
] as const satisfies readonly OrganizationType[];

export const qualifyLeadInputSchema = z.object({
  organizationType: z.enum(CUSTOMER_ORG_TYPES),
  organizationName: z.string().trim().min(1, "Organisationsname fehlt"),
  /** Optional: Objekt direkt mitanlegen (gehört der Kunden-Org). */
  propertyName: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type QualifyLeadInput = z.infer<typeof qualifyLeadInputSchema>;

export type QualifyLeadResult = {
  customerId: string;
  propertyId: string | null;
  /** false = Lead war bereits konvertiert oder Kontakt-Dublette wiederverwendet. */
  createdCustomer: boolean;
};

export async function qualifyLead(
  ctx: AuthContext | null,
  leadId: string,
  rawInput: QualifyLeadInput,
): Promise<QualifyLeadResult> {
  const input = qualifyLeadInputSchema.parse(rawInput);
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const auth = await requirePermission(ctx, "lead.qualify", {
    organizationId: lead.organizationId,
  });

  // Idempotenz: ein bereits konvertierter Lead erzeugt nie einen zweiten Kunden.
  if (lead.convertedToCustomerId) {
    return { customerId: lead.convertedToCustomerId, propertyId: null, createdCustomer: false };
  }

  return prisma.$transaction(async (tx) => {
    // Dublettenprüfung per E-Mail im Tenant (§9-Regel): existiert der Kontakt
    // schon bei einem Kunden, wird dieser Kunde wiederverwendet — kein Doppel.
    const existingContact = await tx.customerContact.findFirst({
      where: { email: lead.email, customer: { organizationId: lead.organizationId } },
      select: { customerId: true },
    });

    let customerId: string;
    let createdCustomer = false;
    if (existingContact) {
      customerId = existingContact.customerId;
    } else {
      const customerOrg = await tx.organization.create({
        data: { type: input.organizationType, name: input.organizationName },
      });
      const customer = await tx.customer.create({
        data: {
          organizationId: lead.organizationId,
          customerOrganizationId: customerOrg.id,
        },
      });
      await tx.customerContact.create({
        data: {
          customerId: customer.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          role: lead.role,
          isPrimary: true,
        },
      });
      customerId = customer.id;
      createdCustomer = true;
    }

    // Objekt (optional): gehört der Kunden-Org; upsert über den natürlichen
    // Schlüssel [organizationId, name] — wiederholte Qualifizierung mit
    // demselben Objektnamen erzeugt keine zweite Property.
    let propertyId: string | null = null;
    if (input.propertyName) {
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
      const property = await tx.property.upsert({
        where: {
          organizationId_name: {
            organizationId: customer.customerOrganizationId,
            name: input.propertyName,
          },
        },
        update: {},
        create: {
          organizationId: customer.customerOrganizationId,
          name: input.propertyName,
        },
      });
      propertyId = property.id;
    }

    await tx.lead.update({
      where: { id: lead.id },
      data: { status: "CONVERTED", convertedToCustomerId: customerId },
    });
    await tx.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "STATUS_CHANGED",
        actorType: "USER",
        actorId: auth.userId,
        message: "Lead qualifiziert und in Kunde/Objekt überführt",
        payload: { customerId, propertyId } as Prisma.InputJsonValue,
      },
    });
    await recordAudit(tx, {
      action: "lead.qualified",
      subjectType: "Lead",
      subjectId: lead.id,
      actorType: "USER",
      actorId: auth.userId,
      organizationId: lead.organizationId,
      before: { status: lead.status },
      after: { status: "CONVERTED", customerId, propertyId, createdCustomer },
    });
    await publishEvent(tx, {
      eventType: "lead.qualified",
      aggregateType: "Lead",
      aggregateId: lead.id,
      organizationId: lead.organizationId,
      actorId: auth.userId,
      payload: { leadId: lead.id, customerId, propertyId },
    });

    return { customerId, propertyId, createdCustomer };
  });
}

/** Kundenliste für die Admin-Sicht (Guard: `customer.read` in der Route). */
export async function listCustomers(organizationId: string) {
  return prisma.customer.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      customerOrganization: { select: { name: true, type: true } },
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { convertedLeads: true, opportunities: true } },
    },
  });
}
