import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Shared flat config for the non-Next packages (worker, auth, database,
 * permissions, testing). The two Next apps use eslint-config-next instead.
 *
 * Deliberately the non-type-checked `recommended` preset: type-aware linting
 * would need a project reference per package and turns a ~1s task into a
 * second full type-check on top of `turbo run typecheck`.
 */
export default defineConfig([
  globalIgnores(["dist/**", "build/**", "generated/**", "*.config.mjs"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Leading underscore is the established opt-out for intentionally
      // unused bindings (catch params, destructuring rest, stub args).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // -------------------------------------------------------------------------
  // Boundaries (WP-1.4, Masterplan §3): Packages importieren einander nur
  // entlang der erlaubten Matrix; Fachmodule (module-*) werden bei Entstehung
  // ergänzt und dürfen einander NIE importieren. Durchgesetzt doppelt:
  // hier per Lint (wo `turbo run lint` läuft) und in
  // packages/testing/src/boundaries.test.ts als harte Matrix-Prüfung.
  // -------------------------------------------------------------------------
  ...Object.entries({
    database: [], // Fundament: importiert nichts Internes
    permissions: [],
    observability: [],
    events: ["@ph360/database"],
    notifications: ["@ph360/database", "@ph360/observability"],
    documents: ["@ph360/database"],
    auth: ["@ph360/database", "@ph360/permissions", "@ph360/events"],
    // testing ist Dev-Harness und darf alles importieren → keine Regel
  }).map(([pkg, allowed]) => ({
    files: [`**/packages/${pkg}/**/*.ts`],
    ignores: [`**/packages/${pkg}/**/*.itest.ts`], // Integrationstests nutzen den Test-Harness
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@ph360/*", ...allowed.map((a) => `!${a}`)],
              message: `Boundary-Verstoß: packages/${pkg} darf nur ${allowed.length ? allowed.join(", ") : "keine @ph360-Pakete"} importieren (Masterplan §3; Matrix in eslint-config/base.mjs + boundaries.test.ts).`,
            },
          ],
        },
      ],
    },
  })),
]);
