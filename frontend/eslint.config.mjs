import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default [
  {
    ignores: ["node_modules", ".next/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        project: "./tsconfig.json"
      },
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      "@next/next": nextPlugin
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules
    }
  }
];
