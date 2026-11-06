import { expect, type Page } from "@playwright/test";

/** Assert the active UI, excluding Next's transient hidden streaming copies. */
export async function expectUnavailablePortal(
  page: Page,
  eyebrow = "Serviço indisponível"
): Promise<void> {
  const shell = page.locator(".auth-shell:visible");
  await expect(shell).toHaveCount(1);
  await expect(
    shell.getByRole("heading", { name: "Não foi possível iniciar o acesso.", exact: true })
  ).toBeVisible();
  await expect(shell.getByText(eyebrow, { exact: true })).toBeVisible();
}
