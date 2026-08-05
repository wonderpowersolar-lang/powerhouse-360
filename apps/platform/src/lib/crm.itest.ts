import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { AuthzError } from "@ph360/auth";
import type { AuthContext } from "@ph360/auth";
import { createOrg, createLead } from "@ph360/testing";
import { qualifyLead } from "./crm";

function ctx(memberships: AuthContext["memberships"], userId = "u-crm-test"): AuthContext {
  return { userId, email: "t@example.test", name: "Test", memberships };
}

describe("Lead-Qualifizierung (F-03: Lead → Kunde/Objekt ohne Doppelerfassung)", () => {
  it("überführt Lead in Kunde + Kontakt + Objekt, setzt CONVERTED und schreibt Audit + Outbox", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const lead = await createLead(powerhouse.id, {
      firstName: "Henriette",
      lastName: "Hennings",
      email: "hv@hennings.test",
      phone: "+49 30 123",
      role: "Hausverwaltung",
    });
    const sales = ctx([{ organizationId: powerhouse.id, role: "SALES" }]);

    const result = await qualifyLead(sales, lead.id, {
      organizationType: "WEG",
      organizationName: "WEG Christinenstraße 36",
      propertyName: "WEG Christinenstraße 36 / Lottumstraße 22",
    });

    expect(result.createdCustomer).toBe(true);
    expect(result.propertyId).not.toBeNull();

    // Kunde = CRM-Datensatz + Kunden-Org; Daten wandern mit, kein Doppel.
    const customer = await prisma.customer.findUniqueOrThrow({
      where: { id: result.customerId },
      include: { customerOrganization: true, contacts: true },
    });
    expect(customer.organizationId).toBe(powerhouse.id);
    expect(customer.customerOrganization.type).toBe("WEG");
    expect(customer.customerOrganization.name).toBe("WEG Christinenstraße 36");
    expect(customer.contacts).toHaveLength(1);
    expect(customer.contacts[0]!.email).toBe("hv@hennings.test");
    expect(customer.contacts[0]!.isPrimary).toBe(true);

    // Objekt gehört der KUNDEN-Org (Masterplan §4 Nr. 2), nicht Powerhouse.
    const property = await prisma.property.findUniqueOrThrow({ where: { id: result.propertyId! } });
    expect(property.organizationId).toBe(customer.customerOrganizationId);

    const reloaded = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(reloaded.status).toBe("CONVERTED");
    expect(reloaded.convertedToCustomerId).toBe(customer.id);

    const activity = await prisma.leadActivity.findFirst({
      where: { leadId: lead.id, type: "STATUS_CHANGED" },
    });
    expect(activity?.actorId).toBe("u-crm-test");

    const audit = await prisma.auditEvent.findFirst({
      where: { action: "lead.qualified", subjectId: lead.id },
    });
    expect(audit).not.toBeNull();
    expect(audit!.organizationId).toBe(powerhouse.id);

    const outbox = await prisma.domainEvent.findFirst({
      where: { eventType: "lead.qualified", aggregateId: lead.id },
    });
    expect(outbox?.status).toBe("PENDING");
  });

  it("ist idempotent: zweite Qualifizierung erzeugt keinen zweiten Kunden/Org/Property", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const lead = await createLead(powerhouse.id);
    const sales = ctx([{ organizationId: powerhouse.id, role: "SALES" }]);
    const input = {
      organizationType: "WEG" as const,
      organizationName: "WEG Doppelt",
      propertyName: "Objekt Doppelt",
    };

    const first = await qualifyLead(sales, lead.id, input);
    const second = await qualifyLead(sales, lead.id, input);

    expect(second.customerId).toBe(first.customerId);
    expect(second.createdCustomer).toBe(false);
    expect(await prisma.customer.count()).toBe(1);
    expect(await prisma.organization.count({ where: { type: "WEG" } })).toBe(1);
    expect(await prisma.property.count()).toBe(1);
    expect(await prisma.customerContact.count()).toBe(1);
  });

  it("Dublettenprüfung per E-Mail: zweiter Lead desselben Kontakts nutzt den bestehenden Kunden", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const sales = ctx([{ organizationId: powerhouse.id, role: "SALES" }]);
    const leadA = await createLead(powerhouse.id, { email: "dublette@example.test" });
    const leadB = await createLead(powerhouse.id, { email: "dublette@example.test" });

    const first = await qualifyLead(sales, leadA.id, {
      organizationType: "PROPERTY_MANAGER",
      organizationName: "HV Hennings",
    });
    const second = await qualifyLead(sales, leadB.id, {
      organizationType: "WEG",
      organizationName: "Sollte nie entstehen",
    });

    expect(second.customerId).toBe(first.customerId);
    expect(second.createdCustomer).toBe(false);
    expect(await prisma.customer.count()).toBe(1);
    expect(await prisma.organization.count({ where: { name: "Sollte nie entstehen" } })).toBe(0);
    const leadBReloaded = await prisma.lead.findUniqueOrThrow({ where: { id: leadB.id } });
    expect(leadBReloaded.convertedToCustomerId).toBe(first.customerId);
  });

  it("ohne propertyName entsteht kein Objekt", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const lead = await createLead(powerhouse.id);
    const sales = ctx([{ organizationId: powerhouse.id, role: "SALES" }]);
    const result = await qualifyLead(sales, lead.id, {
      organizationType: "OWNER",
      organizationName: "Eigentümer Muster",
    });
    expect(result.propertyId).toBeNull();
    expect(await prisma.property.count()).toBe(0);
  });

  it("verweigert Rollen ohne lead.qualify und fremde Mandanten (F-20/F-02)", async () => {
    const powerhouse = await createOrg("POWERHOUSE");
    const other = await createOrg("PROPERTY_MANAGER");
    const lead = await createLead(powerhouse.id);
    const input = { organizationType: "WEG" as const, organizationName: "X" };

    await expect(
      qualifyLead(ctx([{ organizationId: powerhouse.id, role: "RESIDENT" }]), lead.id, input),
    ).rejects.toBeInstanceOf(AuthzError);
    await expect(
      qualifyLead(ctx([{ organizationId: other.id, role: "SALES" }]), lead.id, input),
    ).rejects.toBeInstanceOf(AuthzError);
    expect(await prisma.customer.count()).toBe(0);
  });
});
