import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // ─────────────────────────────────────────────
      // TypeScript
      // ─────────────────────────────────────────────

      // Avoid `any`
      "@typescript-eslint/no-explicit-any": "error",

      // Do not suppress TypeScript errors without explanation
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
        },
      ],

      // Unused code
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ─────────────────────────────────────────────
      // JavaScript
      // ─────────────────────────────────────────────

      "no-var": "error",
      "prefer-const": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",

      // ─────────────────────────────────────────────
      // React
      // ─────────────────────────────────────────────

      "react-hooks/exhaustive-deps": "error",

      // ─────────────────────────────────────────────
      // Code Quality
      // ─────────────────────────────────────────────

      // Avoid accidental console.log()
      "no-console": [
        "warn",
        {
          allow: ["warn", "error", "info"],
        },
      ],

      // Prevent debugger statements
      "no-debugger": "error",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "src/components/ui/**", // Ignore shadcn auto-generated UI components
    "src/hooks/use-mobile.ts", // Ignore shadcn auto-generated hooks
  ]),
]);

export default eslintConfig;