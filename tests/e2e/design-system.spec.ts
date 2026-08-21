import { expect, test } from "@playwright/test";

test("shows the design system preview route", async ({ page }) => {
  await page.goto("/dev/design-system");

  await expect(page.getByRole("heading", { name: "VUYELA Design System" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ações, formulários e feedback" })).toBeVisible();
  await expect(
    page.getByText("Equivalente a 250 MZN neste estabelecimento: Restaurante Mares")
  ).toBeVisible();
});
