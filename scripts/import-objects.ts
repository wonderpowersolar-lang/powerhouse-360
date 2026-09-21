import { readFileSync } from "node:fs";
import { prisma, parseObjectCsv, importObjectStructure } from "@ph360/database";

/**
 * CSV-Import Property→Building→Unit (WP-1.3-Rest, Masterplan §9).
 *
 *   pnpm ph360:import-objects -- --file pilot.csv --org <organizationId> [--dry-run]
 *   pnpm ph360:import-objects -- --file pilot.csv --org TEST [--dry-run]
 *
 * `--org TEST` löst den ADR-006-Testmandanten auf (Namenspräfix "TEST — ").
 * Spalten: objekt;gebaeude;strasse;hausnummer;plz;ort;eingang;einheit;etage
 */
function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const file = arg("file");
  const orgArg = arg("org");
  const dryRun = process.argv.includes("--dry-run");
  if (!file || !orgArg) {
    throw new Error(
      "Usage: pnpm ph360:import-objects -- --file <pfad.csv> --org <organizationId|TEST> [--dry-run]",
    );
  }

  const organizationId =
    orgArg === "TEST"
      ? (
          await prisma.organization.findFirstOrThrow({
            where: { name: { startsWith: "TEST — " } },
          })
        ).id
      : orgArg;

  const text = readFileSync(file, "utf8");
  const { rows, errors } = parseObjectCsv(text);
  const report = await importObjectStructure(prisma, {
    organizationId,
    rows,
    parseErrors: errors,
    dryRun,
  });

  const fmt = (c: { properties: number; buildings: number; entrances: number; units: number }) =>
    `Properties ${c.properties} · Gebäude ${c.buildings} · Eingänge ${c.entrances} · Units ${c.units}`;
  console.log(`[import] ${dryRun ? "PROBELAUF (keine Änderungen)" : "Import"} — Org ${organizationId}`);
  console.log(`[import] Zeilen: ${report.totalRows}`);
  console.log(`[import] Neu:       ${fmt(report.created)}`);
  console.log(`[import] Vorhanden: ${fmt(report.existing)}`);
  if (report.errors.length > 0) {
    console.error(`[import] Fehlerbericht (${report.errors.length}):`);
    for (const e of report.errors) console.error(`  Zeile ${e.line}: ${e.message}`);
    process.exitCode = 1;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("[import] failed:", err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  });
