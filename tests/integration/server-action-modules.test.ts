import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const serverActionModules = [
  "features/admin/actions.ts",
  "features/auth/actions.ts",
  "features/business-campaigns/actions.ts",
  "features/business-settings/actions.ts",
  "features/customer-dashboard/actions.ts",
  "features/notifications/actions.ts",
  "features/pos/actions.ts",
  "features/referrals/actions.ts"
];

describe("server action module contract", () => {
  it.each(serverActionModules)("exports only asynchronous runtime functions from %s", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");

    expect(source).toMatch(/^"use server";/);
    expect(source).not.toMatch(/^export\s+(?:const|let|var|class)\s/m);
    expect(source).not.toMatch(/^export\s+function\s/m);
    expect(source).toMatch(/^export\s+async\s+function\s/m);
  });
});
