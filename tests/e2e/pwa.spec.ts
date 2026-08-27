import { expect, test } from "@playwright/test";

test("exposes four independently installable applications and one safe worker", async ({
  page
}) => {
  test.setTimeout(120_000);
  const applications = [
    {
      area: "cliente",
      page: "/cliente",
      name: "VUYELA Cliente by LEMOTE",
      scope: "/cliente"
    },
    {
      area: "negocio",
      page: "/negocio",
      name: "VUYELA Negócio by LEMOTE",
      scope: "/negocio"
    },
    {
      area: "pos",
      page: "/pos",
      name: "VUYELA POS by LEMOTE",
      scope: "/pos"
    },
    {
      area: "admin",
      page: "/admin",
      name: "VUYELA Administração",
      scope: "/admin"
    }
  ] as const;

  for (const application of applications) {
    const manifestPath = `/pwa/${application.area}/manifest.webmanifest`;
    const manifestResponse = await page.request.get(manifestPath);
    expect(manifestResponse.ok()).toBe(true);
    expect(manifestResponse.headers()["content-type"]).toContain("application/manifest+json");
    const manifest = await manifestResponse.json();
    expect(manifest).toMatchObject({
      id: application.page,
      name: application.name,
      start_url: application.page,
      scope: application.scope,
      display: "standalone"
    });

    await page.goto(application.page);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", manifestPath);
  }

  await page.goto("/negocio/pos");
  await expect(page).toHaveURL(/\/pos$/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/pwa/pos/manifest.webmanifest"
  );

  await page.goto("/pos/entrar");
  await expect(page.getByRole("button", { name: "Instalar aplicação" })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/pwa/pos/manifest.webmanifest"
  );

  const workerResponse = await page.request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  expect(workerResponse.headers()["content-type"]).toContain("application/javascript");
  expect(workerResponse.headers()["service-worker-allowed"]).toBe("/");

  await page.goto("/cliente");
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          return Boolean(registration?.active && navigator.serviceWorker.controller);
        }),
      { timeout: 30_000 }
    )
    .toBe(true);
});

test("opens previously loaded card identification while offline", async ({ page, context }) => {
  await page.goto("/");

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          const shell = await caches.match("/offline");
          return Boolean(registration?.active && navigator.serviceWorker.controller && shell);
        }),
      { timeout: 30_000 }
    )
    .toBe(true);

  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("vuyela-offline", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("card-identification")) {
          request.result.createObjectStore("card-identification", { keyPath: "key" });
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("card-identification", "readwrite");
        transaction.objectStore("card-identification").put({
          key: "current",
          payload: {
            version: 1,
            updatedAt: "2026-08-21T10:00:00.000Z",
            cards: [
              {
                id: "card-1",
                businessId: "business-1",
                businessName: "Cafe Central",
                cardNumber: "VY-OFFLINE-0001",
                qrCode: "VUYELA:CARD:business-1:VY-OFFLINE-0001"
              }
            ]
          }
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });

  await context.setOffline(true);
  try {
    await page.goto("/cliente");
    await expect(page.getByRole("heading", { name: "Cartões disponíveis offline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cafe Central" })).toBeVisible();
    await expect(page.getByText("VY-OFFLINE-0001", { exact: true })).toBeVisible();
    await expect(page.getByText(/usar YELAS requer ligação/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Remover deste dispositivo" })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
