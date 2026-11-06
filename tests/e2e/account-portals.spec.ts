import { expect, test } from "@playwright/test";

const authenticationRoutes = [
  "/cliente/entrar",
  "/negocio/entrar",
  "/pos/entrar",
  "/admin/entrar",
  "/recuperar-acesso",
  "/definir-senha",
  "/cliente"
];

test("keeps every authentication surface readable and inside the viewport", async ({ page }) => {
  const auth = page.locator(".auth-shell:visible");
  test.setTimeout(120_000);

  for (const route of authenticationRoutes) {
    await page.goto(route);
    await auth
      .locator('input:not([type="hidden"]), button')
      .first()
      .waitFor({ state: "visible" });

    await expect(auth).toHaveCount(1);
    const layout = await auth.evaluate((root) => {
      const shell = root;
      const formPanel = root.querySelector<HTMLElement>(".auth-panel--forms");
      const heading = root.querySelector<HTMLElement>(".auth-panel h1");
      const headingPanel = heading?.closest<HTMLElement>(".auth-panel");
      const controls = Array.from(
        root.querySelectorAll<HTMLElement>('input:not([type="hidden"]), button')
      ).filter((control) => control.getClientRects().length > 0);
      const shellRect = shell?.getBoundingClientRect();
      const formRect = formPanel?.getBoundingClientRect();
      const headingRect = heading?.getBoundingClientRect();
      const headingPanelRect = headingPanel?.getBoundingClientRect();

      return {
        bodyScrollWidth: document.body.scrollWidth,
        controlHeights: controls.map((control) => control.getBoundingClientRect().height),
        formWidth: formRect?.width ?? 0,
        headingInsidePanel: Boolean(
          headingRect &&
          headingPanelRect &&
          headingRect.left >= headingPanelRect.left &&
          headingRect.right <= headingPanelRect.right
        ),
        isSingle: shell?.classList.contains("auth-shell--single") ?? false,
        logoHref: root.querySelector<HTMLAnchorElement>(".auth-brand")?.getAttribute("href"),
        shellInsideViewport: Boolean(
          shellRect && shellRect.left >= 0 && shellRect.right <= window.innerWidth + 0.5
        ),
        viewportWidth: window.innerWidth
      };
    });

    expect(layout.bodyScrollWidth, route).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.shellInsideViewport, route).toBe(true);
    expect(layout.headingInsidePanel, route).toBe(true);
    expect(Math.min(...layout.controlHeights), route).toBeGreaterThanOrEqual(44);
    expect(layout.logoHref, route).toBe("/");

    if (layout.isSingle && layout.viewportWidth >= 768) {
      expect(layout.formWidth, route).toBeGreaterThanOrEqual(480);
    }
  }
});

test("keeps customer and business registration as distinct responsive flows", async ({ page }) => {
  const auth = page.locator(".auth-shell:visible");
  test.setTimeout(120_000);
  await page.goto("/cliente/entrar");
  await expect(auth.locator('input[name="portal"]')).toHaveValue("customer");
  await expect(page).toHaveURL(/\/cliente\/entrar$/);

  await page.goto("/cadastrar/negocio");

  await expect(page.getByRole("heading", { name: "Registe o seu negócio." })).toBeVisible();
  await expect(auth.getByLabel("Nome do responsável")).toBeVisible();
  await expect(auth.getByLabel("E-mail de acesso")).toBeVisible();
  await expect(
    auth.getByLabel("Progresso do registo do negócio").getByRole("listitem")
  ).toHaveCount(4);
  await expect(auth.locator('input[name="portal"]')).toHaveCount(0);

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);

  await page.goto("/entrar/negocio");
  await expect(auth.locator('input[name="portal"]')).toHaveValue("business");
  await expect(auth.getByText("Entrar como cliente")).toHaveCount(0);

  await page.goto(`/cadastrar/negocio/equipa?token=${"a".repeat(48)}`);
  await expect(page.getByRole("heading", { name: "Junte-se à equipa do negócio." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar credenciais de equipa" })).toBeVisible();

  await page.goto("/negocio/entrar");
  await expect(auth.locator('input[name="portal"]')).toHaveValue("business");
  await expect(page.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/");
  await expect(page).toHaveURL(/\/negocio\/entrar$/);

  await page.goto("/pos/entrar");
  await expect(auth.locator('input[name="portal"]')).toHaveValue("pos");
  await expect(auth.getByText(/Peça credenciais individuais ao administrador/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Instalar aplicação" })).toBeVisible();
  await expect(page).toHaveURL(/\/pos\/entrar$/);

  await page.goto("/admin/entrar");
  await expect(auth.locator('input[name="portal"]')).toHaveValue("admin");
  await expect(auth.getByText("Contas de cliente e de negócio não são aceites")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/entrar$/);
});

test("uses a compact business menu on mobile without exposing the customer portal", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile navigation contract");

  await page.goto("/dev/business");
  await expect(page.locator(".business-portal__mobile-brand")).toBeVisible();
  await page.locator('summary[aria-label="Abrir navegação do negócio"]').click();

  const mobileNavigation = page.getByRole("navigation", { name: "Navegação móvel do negócio" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Filiais" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "POS" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Cliente", exact: true })).toHaveCount(0);

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
});
