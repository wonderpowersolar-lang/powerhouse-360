import { prisma, Prisma, type Organization, type OrganizationType, type Lead } from "@ph360/database";

let n = 0;
const uniq = () => `${Date.now()}-${n++}`;

export function createOrg(
  type: OrganizationType = "PROPERTY_MANAGER",
  overrides: { name?: string } = {},
): Promise<Organization> {
  return prisma.organization.create({ data: { type, name: overrides.name ?? `Org ${uniq()}` } });
}

type LeadData = Prisma.LeadUncheckedCreateInput;
export function createLead(organizationId: string, overrides: Partial<LeadData> = {}): Promise<Lead> {
  return prisma.lead.create({
    data: {
      organizationId,
      leadType: "DEMO_REQUEST",
      firstName: "Test",
      lastName: `User-${uniq()}`,
      email: `lead-${uniq()}@example.test`,
      consentPrivacy: true,
      consentContact: true,
      payload: {},
      ...overrides,
    },
  });
}
