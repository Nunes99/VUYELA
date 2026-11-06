import { test } from "@playwright/test";
import { expectUnavailablePortal } from "./support/protected-state";

test.setTimeout(180_000);

const dashboardViews = [
  "dashboard",
  "filiais",
  "cartoes",
  "clientes",
  "fidelizacao",
  "analitica",
  "pos",
  "transacoes"
];

test("protects every business dashboard view", async ({ page }) => {
  for (const view of dashboardViews) {
    await page.goto(`/negocio?vista=${view}`);

    await expectUnavailablePortal(page);
  }
});
