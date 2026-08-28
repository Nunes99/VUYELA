import { expect, test } from "@playwright/test";

test("shows the protected business subscription fallback", async ({ page }) => {
  await page.goto("/negocio/subscricao");

  await expect(
    page.getByRole("heading", { name: "Não foi possível iniciar o acesso." })
  ).toBeVisible();
  await expect(page.getByText("Serviço indisponível")).toBeVisible();
});
