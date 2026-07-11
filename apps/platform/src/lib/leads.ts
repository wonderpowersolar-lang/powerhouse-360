import { z } from "zod";
import { prisma, Prisma, type ModuleKey } from "@ph360/database";

const MODULE_MAP: Record<string, ModuleKey> = {
  powermieter: "POWERMIETER",
  heatmieter: "HEATMIETER",
  chargemieter: "CHARGEMIETER",
  smokemieter: "SMOKEMIETER",
};

function mapModules(values: string[] | undefined): ModuleKey[] {
  if (!values) return [];
  const out: ModuleKey[] = [];
  for (const value of values) {
    const key = MODULE_MAP[value.toLowerCase()];
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

const contactSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().optional().nullable(),
    company: z.string().trim().optional().nullable(),
    role: z.string().trim().optional().nullable(),
  })
  .passthrough();

/**
 * Superset of the funnel payload. Required fields are validated strictly; the
 * full original object is stored losslessly in `payload`.
 */
export const leadInputSchema = z
  .object({
    leadType: z.enum(["demo_request", "project_request"]),
    contactData: contactSchema,
    consent: z.object({ privacy: z.boolean(), contact: z.boolean() }),
    website: z.string().optional(), // honeypot
    selectedModules: z.array(z.string()).optional(),
    roleOrOrganizationType: z.string().optional().nullable(),
    dwellingUnits: z.string().optional().nullable(),
    buildings: z.number().int().nullable().optional(),
    portfolioSize: z.number().int().nullable().optional(),
    currentSituation: z.string().optional().nullable(),
    recommendedNextStep: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    sourceModule: z.string().optional().nullable(),
    sourceTheme: z.string().optional().nullable(),
  })
  .passthrough();

export type LeadInput = z.infer<typeof leadInputSchema>;

async function getPowerhouseOrgId(): Promise<string> {
  const org = await prisma.organization.findFirst({
    where: { type: "POWERHOUSE" },
  });
  if (org) return org.id;
  const created = await prisma.organization.create({
    data: { type: "POWERHOUSE", name: "AKL Powerhouse 360 GmbH" },
  });
  return created.id;
}

/**
 * Persists a lead together with its activity, audit event and the outbox
 * `lead.created` domain event — all in one transaction. The domain event is
 * drained by apps/worker (notification). This is the R-01 fix: no lead is lost.
 */
export async function createLead(input: LeadInput, requestId: string) {
  const organizationId = await getPowerhouseOrgId();
  const payload = input as unknown as Prisma.InputJsonValue;
  const sourceModuleKey = input.sourceModule
    ? (MODULE_MAP[input.sourceModule.toLowerCase()] ?? null)
    : null;

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        organizationId,
        leadType:
          input.leadType === "demo_request"
            ? "DEMO_REQUEST"
            : "PROJECT_REQUEST",
        firstName: input.contactData.firstName,
        lastName: input.contactData.lastName,
        email: input.contactData.email,
        phone: input.contactData.phone ?? null,
        company: input.contactData.company ?? null,
        role:
          input.roleOrOrganizationType ??
          (input.contactData.role as string | undefined) ??
          null,
        modules: mapModules(input.selectedModules),
        dwellingUnits: input.dwellingUnits ?? null,
        buildings: input.buildings ?? null,
        portfolioSize: input.portfolioSize ?? null,
        currentSituation: input.currentSituation ?? null,
        recommendedNextStep: input.recommendedNextStep ?? null,
        source: input.source ?? null,
        sourceModule: sourceModuleKey,
        sourceTheme: input.sourceTheme ?? null,
        consentPrivacy: input.consent.privacy,
        consentContact: input.consent.contact,
        payload,
      },
    });

    await tx.leadActivity.create({
      data: { leadId: lead.id, type: "CREATED", actorType: "SYSTEM" },
    });

    await tx.auditEvent.create({
      data: {
        organizationId,
        actorType: "SYSTEM",
        action: "lead.created",
        subjectType: "Lead",
        subjectId: lead.id,
        after: {
          leadType: lead.leadType,
          email: lead.email,
        } as Prisma.InputJsonValue,
        requestId,
      },
    });

    await tx.domainEvent.create({
      data: {
        eventType: "lead.created",
        aggregateType: "Lead",
        aggregateId: lead.id,
        organizationId,
        correlationId: requestId,
        payload: {
          leadId: lead.id,
          leadType: lead.leadType,
          email: lead.email,
          name: `${lead.firstName} ${lead.lastName}`,
          modules: lead.modules,
          source: lead.source,
        } as Prisma.InputJsonValue,
      },
    });

    return lead;
  });
}
