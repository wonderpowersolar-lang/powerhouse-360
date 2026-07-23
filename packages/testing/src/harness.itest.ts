import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { createOrg, createLead } from "./index.js";

describe("test harness / tenant scoping", () => {
  it("isolates leads per organization and truncates between tests", async () => {
    const a = await createOrg("PROPERTY_MANAGER");
    const b = await createOrg("WEG");
    await createLead(a.id);
    await createLead(b.id);
    const inA = await prisma.lead.findMany({ where: { organizationId: a.id } });
    expect(inA).toHaveLength(1);
    expect(inA[0]!.organizationId).toBe(a.id);
  });
});
