import type { PrismaClient, Prisma } from "../generated/client/index.js";

/**
 * CSV-Import Property→Building→Unit (WP-1.3-Rest, Masterplan §9).
 * Regeln: idempotent über natürliche Schlüssel · Probelauf mit
 * Abweichungsbericht · Audit-Event je Import · keine stillen Korrekturen.
 * Erster Realimport: Pilotdaten Christinenstraße (sobald Liste vorliegt, E-06).
 *
 * Erwartete Spalten (Header, Semikolon-getrennt — Excel-DE-Standard):
 *   objekt;gebaeude;strasse;hausnummer;plz;ort;eingang;einheit;etage
 * `eingang` und `etage` sind optional (leer erlaubt); `etage` ist eine Zahl,
 * "EG" wird als 0 gelesen.
 */

export const IMPORT_HEADERS = [
  "objekt",
  "gebaeude",
  "strasse",
  "hausnummer",
  "plz",
  "ort",
  "eingang",
  "einheit",
  "etage",
] as const;

export type ImportRow = {
  objekt: string;
  gebaeude: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  eingang: string | null;
  einheit: string;
  etage: number | null;
};

export type RowError = { line: number; message: string };

export type ImportCounts = {
  properties: number;
  buildings: number;
  entrances: number;
  units: number;
};

export type ImportReport = {
  dryRun: boolean;
  totalRows: number;
  created: ImportCounts;
  existing: ImportCounts;
  errors: RowError[];
};

function splitCsvLine(line: string): string[] {
  // Minimaler Parser: Semikolon-getrennt, optionale doppelte Anführungszeichen.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ";") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

/** Parst CSV-Text; Zeilennummern sind 1-basiert inkl. Header (Zeile 1). */
export function parseObjectCsv(text: string): { rows: ImportRow[]; errors: RowError[] } {
  const lines = text
    .replace(/^\uFEFF/, "") // BOM (Excel)
    .split(/\r?\n/)
    .filter((l, idx) => idx === 0 || l.trim() !== "");
  const errors: RowError[] = [];
  const rows: ImportRow[] = [];
  if (lines.length === 0 || lines[0]!.trim() === "") {
    return { rows, errors: [{ line: 1, message: "Leere Datei" }] };
  }
  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const missing = IMPORT_HEADERS.filter((h) => h !== "eingang" && h !== "etage" && !header.includes(h));
  if (missing.length > 0) {
    return {
      rows,
      errors: [
        {
          line: 1,
          message: `Fehlende Spalten: ${missing.join(", ")} — erwartet: ${IMPORT_HEADERS.join(";")}`,
        },
      ],
    };
  }
  const col = (name: (typeof IMPORT_HEADERS)[number]) => header.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cells = splitCsvLine(lines[i]!);
    const get = (name: (typeof IMPORT_HEADERS)[number]) => {
      const idx = col(name);
      return idx >= 0 ? (cells[idx] ?? "") : "";
    };
    const required = ["objekt", "gebaeude", "strasse", "hausnummer", "plz", "ort", "einheit"] as const;
    const empty = required.filter((name) => get(name) === "");
    if (empty.length > 0) {
      errors.push({ line: lineNo, message: `Pflichtfelder leer: ${empty.join(", ")}` });
      continue;
    }
    const etageRaw = get("etage");
    let etage: number | null = null;
    if (etageRaw !== "") {
      if (/^eg$/i.test(etageRaw)) etage = 0;
      else if (/^-?\d+$/.test(etageRaw)) etage = Number.parseInt(etageRaw, 10);
      else {
        errors.push({ line: lineNo, message: `Etage "${etageRaw}" ist keine Zahl (oder "EG")` });
        continue;
      }
    }
    rows.push({
      objekt: get("objekt"),
      gebaeude: get("gebaeude"),
      strasse: get("strasse"),
      hausnummer: get("hausnummer"),
      plz: get("plz"),
      ort: get("ort"),
      eingang: get("eingang") === "" ? null : get("eingang"),
      einheit: get("einheit"),
      etage,
    });
  }
  return { rows, errors };
}

class DryRunRollback extends Error {
  constructor(public readonly report: ImportReport) {
    super("dry-run rollback");
  }
}

const zeroCounts = (): ImportCounts => ({ properties: 0, buildings: 0, entrances: 0, units: 0 });

/**
 * Importiert Zeilen idempotent in den Objektbaum einer Organisation.
 * `dryRun: true` führt alle Schritte in einer Transaktion aus und rollt sie
 * zurück — der Bericht zeigt, was passieren WÜRDE (Probelauf, §9).
 * Audit: `object.import.completed` (auch für Probeläufe, mit dryRun-Flag).
 */
export async function importObjectStructure(
  prisma: PrismaClient,
  opts: {
    organizationId: string;
    rows: ImportRow[];
    parseErrors?: RowError[];
    dryRun?: boolean;
    actorId?: string | null;
  },
): Promise<ImportReport> {
  const dryRun = opts.dryRun ?? false;
  await prisma.organization.findUniqueOrThrow({ where: { id: opts.organizationId } });

  const run = async (tx: Prisma.TransactionClient): Promise<ImportReport> => {
    const report: ImportReport = {
      dryRun,
      totalRows: opts.rows.length,
      created: zeroCounts(),
      existing: zeroCounts(),
      errors: [...(opts.parseErrors ?? [])],
    };
    for (const row of opts.rows) {
      let property = await tx.property.findUnique({
        where: { organizationId_name: { organizationId: opts.organizationId, name: row.objekt } },
      });
      if (property) report.existing.properties++;
      else {
        property = await tx.property.create({
          data: { organizationId: opts.organizationId, name: row.objekt },
        });
        report.created.properties++;
      }

      let building = await tx.building.findUnique({
        where: { propertyId_name: { propertyId: property.id, name: row.gebaeude } },
      });
      if (building) report.existing.buildings++;
      else {
        const address = await tx.address.create({
          data: { street: row.strasse, houseNumber: row.hausnummer, postalCode: row.plz, city: row.ort },
        });
        building = await tx.building.create({
          data: { propertyId: property.id, name: row.gebaeude, addressId: address.id },
        });
        report.created.buildings++;
      }

      let entranceId: string | null = null;
      if (row.eingang) {
        const existingEntrance = await tx.entrance.findUnique({
          where: { buildingId_label: { buildingId: building.id, label: row.eingang } },
        });
        if (existingEntrance) {
          entranceId = existingEntrance.id;
          report.existing.entrances++;
        } else {
          const created = await tx.entrance.create({
            data: { buildingId: building.id, label: row.eingang },
          });
          entranceId = created.id;
          report.created.entrances++;
        }
      }

      const existingUnit = await tx.unit.findUnique({
        where: { buildingId_label: { buildingId: building.id, label: row.einheit } },
      });
      if (existingUnit) report.existing.units++;
      else {
        await tx.unit.create({
          data: { buildingId: building.id, label: row.einheit, entranceId, floor: row.etage },
        });
        report.created.units++;
      }
    }
    return report;
  };

  let report: ImportReport;
  if (dryRun) {
    report = await prisma
      .$transaction(async (tx) => {
        throw new DryRunRollback(await run(tx));
      })
      .catch((err: unknown) => {
        if (err instanceof DryRunRollback) return err.report;
        throw err;
      });
  } else {
    report = await prisma.$transaction(async (tx) => {
      const r = await run(tx);
      await tx.auditEvent.create({
        data: {
          organizationId: opts.organizationId,
          actorType: opts.actorId ? "USER" : "SYSTEM",
          actorId: opts.actorId ?? null,
          action: "object.import.completed",
          subjectType: "Organization",
          subjectId: opts.organizationId,
          after: JSON.parse(JSON.stringify(r)) as Prisma.InputJsonValue,
        },
      });
      return r;
    });
  }
  if (dryRun) {
    // Probelauf auditierbar machen — außerhalb der zurückgerollten Transaktion.
    await prisma.auditEvent.create({
      data: {
        organizationId: opts.organizationId,
        actorType: opts.actorId ? "USER" : "SYSTEM",
        actorId: opts.actorId ?? null,
        action: "object.import.dry_run",
        subjectType: "Organization",
        subjectId: opts.organizationId,
        after: JSON.parse(JSON.stringify(report)) as Prisma.InputJsonValue,
      },
    });
  }
  return report;
}
