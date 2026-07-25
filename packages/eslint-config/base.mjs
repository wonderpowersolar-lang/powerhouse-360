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
]);
