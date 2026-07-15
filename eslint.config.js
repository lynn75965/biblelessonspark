import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // dist: build output.
    // backups/, SSOT-PROJECT-FILES/: gitignored local-only directories
    // (untracked, not part of the repo -- eslint scans the filesystem
    // directly and doesn't respect .gitignore on its own, so these need
    // an explicit ignore here even though `git ls-files`-based tooling,
    // like the ASCII guard, already skips them for free).
    // docs/white-label/examples/: illustrative code snippets meant to be
    // copy-pasted into branding.ts, not valid standalone TypeScript.
    ignores: ["dist", "backups", "SSOT-PROJECT-FILES", "docs/white-label/examples"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
