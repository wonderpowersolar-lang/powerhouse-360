import {
  prisma,
  Prisma,
  type Organization,
  type OrganizationType,
  type Lead,
  type Property,
  type Building,
  type Entrance,
  type Unit,
} from "@ph360/database";
import { auth } from "@ph360/auth";
import type { SystemRole } from "@ph360/permissions";

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

export async function createUserWithMembership(
  organizationId: string,
  role: SystemRole,
  opts: { email?: string; password?: string } = {},
) {
  const email = opts.email ?? `user-${uniq()}@example.test`;
  const password = opts.password ?? "test-password-123!";
  // Bypass the invitation-only guard in tests by seeding a pending invite first.
  await prisma.invitation.create({
    data: { email, organizationId, role, token: `t-${uniq()}`, expiresAt: new Date(Date.now() + 3_600_000) },
  });
  const { user } = await auth.api.signUpEmail({ body: { email, password, name: email } });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  const membership = await prisma.organizationMembership.create({
    data: { userId: user.id, organizationId, role },
  });
  return { user, email, password, membership };
}

export function createProperty(
  organizationId: string,
  overrides: { name?: string } = {},
): Promise<Property> {
  return prisma.property.create({
    data: { organizationId, name: overrides.name ?? `Property ${uniq()}` },
  });
}

export async function createBuilding(
  propertyId: string,
  overrides: { name?: string; street?: string; houseNumber?: string } = {},
): Promise<Building> {
  const address = await prisma.address.create({
    data: {
      street: overrides.street ?? "Teststraße",
      houseNumber: overrides.houseNumber ?? "1",
      postalCode: "10119",
      city: "Berlin",
    },
  });
  return prisma.building.create({
    data: { propertyId, name: overrides.name ?? `Gebäude ${uniq()}`, addressId: address.id },
  });
}

export function createEntrance(
  buildingId: string,
  overrides: { label?: string } = {},
): Promise<Entrance> {
  return prisma.entrance.create({
    data: { buildingId, label: overrides.label ?? `Eingang ${uniq()}` },
  });
}

export function createUnit(
  buildingId: string,
  overrides: { label?: string; entranceId?: string; floor?: number } = {},
): Promise<Unit> {
  return prisma.unit.create({
    data: {
      buildingId,
      label: overrides.label ?? `WE ${uniq()}`,
      entranceId: overrides.entranceId ?? null,
      floor: overrides.floor ?? null,
    },
  });
}
