import { describe, it, expect } from "vitest";
import { prisma } from "@ph360/database";
import { parseObjectCsv, importObjectStructure } from "./import-objects";

let n = 0;
function makeOrg() {
  return prisma.organization.create({
    data: { type: "WEG", name: `Import-Org ${Date.now()}-${n++}` },
  });
}

const CSV = [
  "objekt;gebaeude;strasse;hausnummer;plz;ort;eingang;einheit;etage",
  "Pilot;Christinenstraße 36;Christinenstraße;36;10119;Berlin;Haupteingang;WE 01;EG",
  "Pilot;Christinenstraße 36;Christinenstraße;36;10119;Berlin;Haupteingang;WE 02;1",
  "Pilot;Lottumstraße 22;Lottumstraße;22;10119;Berlin;;WE 01;",
].join("\n");

describe("CSV-Import Property→Building→Unit (WP-1.3-Rest, Masterplan §9)", () => {
  it("parst CSV inkl. EG→0, optionalem Eingang und meldet Formatfehler mit Zeilennummer", () => {
    const ok = parseObjectCsv(CSV);
    expect(ok.errors).toEqual([]);
    expect(ok.rows).toHaveLength(3);
    expect(ok.rows[0]!.etage).toBe(0);
    expect(ok.rows[1]!.etage).toBe(1);
    expect(ok.rows[2]!.eingang).toBeNull();
    expect(ok.rows[2]!.etage).toBeNull();

    const bad = parseObjectCsv(
      "objekt;gebaeude;strasse;hausnummer;plz;ort;eingang;einheit;etage\nPilot;;Str;1;10119;Berlin;;WE 01;\nPilot;Geb;Str;1;10119;Berlin;;WE 02;drei",
    );
    expect(bad.rows).toHaveLength(0);
    expect(bad.errors.map((e) => e.line)).toEqual([2, 3]);

    const wrongHeader = parseObjectCsv("foo;bar\n1;2");
    expect(wrongHeader.errors[0]!.message).toContain("Fehlende Spalten");
  });

  it("Probelauf berichtet, schreibt aber nichts — und ist auditiert", async () => {
    const org = await makeOrg();
    const { rows } = parseObjectCsv(CSV);
    const report = await importObjectStructure(prisma, {
      organizationId: org.id,
      rows,
      dryRun: true,
    });

    expect(report.dryRun).toBe(true);
    expect(report.created).toEqual({ properties: 1, buildings: 2, entrances: 1, units: 3 });
    // Nichts persistiert:
    expect(await prisma.property.count()).toBe(0);
    expect(await prisma.unit.count()).toBe(0);
    // Aber auditierbar:
    expect(await prisma.auditEvent.count({ where: { action: "object.import.dry_run" } })).toBe(1);
  });

  it("Realimport ist idempotent: zweiter Lauf erzeugt nichts Neues (nur 'vorhanden')", async () => {
    const org = await makeOrg();
    const { rows } = parseObjectCsv(CSV);

    const first = await importObjectStructure(prisma, { organizationId: org.id, rows, actorId: "u-import" });
    expect(first.created.units).toBe(3);
    expect(first.errors).toEqual([]);

    const second = await importObjectStructure(prisma, { organizationId: org.id, rows });
    expect(second.created).toEqual({ properties: 0, buildings: 0, entrances: 0, units: 0 });
    expect(second.existing).toEqual({ properties: 3, buildings: 3, entrances: 2, units: 3 });

    expect(await prisma.property.count()).toBe(1);
    expect(await prisma.building.count()).toBe(2);
    expect(await prisma.unit.count()).toBe(3);
    const audits = await prisma.auditEvent.findMany({ where: { action: "object.import.completed" } });
    expect(audits).toHaveLength(2);
    expect(audits[0]!.actorId).toBe("u-import");
  });

  it("fehlerhafte Zeilen landen im Fehlerbericht, gültige werden importiert", async () => {
    const org = await makeOrg();
    const parsed = parseObjectCsv(
      "objekt;gebaeude;strasse;hausnummer;plz;ort;eingang;einheit;etage\nPilot;Geb A;Str;1;10119;Berlin;;WE 01;2\nPilot;;;;;;;WE 02;",
    );
    const report = await importObjectStructure(prisma, {
      organizationId: org.id,
      rows: parsed.rows,
      parseErrors: parsed.errors,
    });
    expect(report.created.units).toBe(1);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]!.line).toBe(3);
  });
});
