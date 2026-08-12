import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "dist/**",
      "next-env.d.ts",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "vuyela-design-system/dist/**"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];

export default eslintConfig;
