import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Boundary-Matrix (WP-1.4, Masterplan §3): Packages importieren einander nur
 * entlang dieser erlaubten Kanten — Fachmodule (module-*) dürfen einander nie
 * importieren und werden hier ergänzt, sobald sie entstehen. Der Test prüft
 * package.json-Abhängigkeiten UND echte Import-Statements im Quelltext;
 * dieselbe Matrix lebt als Lint-Regel in eslint-config/base.mjs.
 * `testing` ist Dev-Harness (darf alles); devDependencies sind Werkzeug, keine
 * Architektur-Kante — geprüft werden dependencies + Quell-Imports.
 */
const ALLOWED: Record<string, string[]> = {
  database: [],
  permissions: [],
  observability: [],
  events: ["@ph360/database"],
  notifications: ["@ph360/database", "@ph360/observability"],
  auth: ["@ph360/database", "@ph360/permissions", "@ph360/events"],
  "eslint-config": [],
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const packagesDir = join(root, "packages");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "generated" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|tsx|mjs)$/.test(entry)) out.push(p);
  }
  return out;
}

describe("Package-Boundaries (Masterplan §3, WP-1.4)", () => {
  const pkgs = readdirSync(packagesDir).filter((p) => statSync(join(packagesDir, p)).isDirectory());

  it("jede Package ist in der Matrix registriert (neue Pakete bewusst einordnen)", () => {
    for (const pkg of pkgs) {
      if (pkg === "testing") continue;
      expect(ALLOWED, `packages/${pkg} fehlt in der Boundary-Matrix`).toHaveProperty(pkg);
    }
  });

  for (const pkg of pkgs) {
    if (pkg === "testing") continue;
    it(`packages/${pkg} hält die Matrix ein (dependencies + Imports)`, () => {
      const allowed = new Set(ALLOWED[pkg] ?? []);
      const pkgJson = JSON.parse(readFileSync(join(packagesDir, pkg, "package.json"), "utf8")) as {
        dependencies?: Record<string, string>;
      };
      for (const dep of Object.keys(pkgJson.dependencies ?? {})) {
        if (dep.startsWith("@ph360/")) {
          expect(allowed.has(dep), `packages/${pkg} dependency ${dep} ist nicht erlaubt`).toBe(true);
        }
      }
      for (const file of sourceFiles(join(packagesDir, pkg))) {
        if (file.endsWith(".itest.ts")) continue; // Integrationstests nutzen den Harness
        const src = readFileSync(file, "utf8");
        for (const m of src.matchAll(/from\s+["'](@ph360\/[a-z-]+)["']/g)) {
          expect(
            allowed.has(m[1]!),
            `${file.replace(root + "/", "")} importiert ${m[1]} — nicht in der Matrix`,
          ).toBe(true);
        }
      }
    });
  }

  it("apps importieren nie andere apps", () => {
    const appsDir = join(root, "apps");
    for (const app of readdirSync(appsDir)) {
      const p = join(appsDir, app, "src");
      let files: string[] = [];
      try {
        files = sourceFiles(p);
      } catch {
        continue; // app ohne src (z. B. native mobile)
      }
      for (const file of files) {
        const src = readFileSync(file, "utf8");
        expect(
          /from\s+["']@ph360\/(website|platform|worker|mobile)["']/.test(src),
          `${file.replace(root + "/", "")} importiert eine andere App`,
        ).toBe(false);
      }
    }
  });
});
