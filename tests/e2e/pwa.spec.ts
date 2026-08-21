import { expect, test } from "@playwright/test";

test("exposes an installable manifest and service worker", async ({ page }) => {
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: "VUYELA by LEMOTE",
    short_name: "VUYELA",
    start_url: "/cliente",
    display: "standalone"
  });

  const workerResponse = await page.request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  expect(workerResponse.headers()["content-type"]).toContain("application/javascript");
  expect(workerResponse.headers()["service-worker-allowed"]).toBe("/");

  await page.goto("/");
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
    await expect(page.getByText(/usar pontos requer ligação/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Remover deste dispositivo" })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
