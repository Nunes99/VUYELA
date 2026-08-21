import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildServiceWorkerSource } from "@/features/pwa/service-worker";

const manifest = readFileSync(join(process.cwd(), "app/manifest.ts"), "utf8");
const registration = readFileSync(join(process.cwd(), "features/pwa/pwa-registration.tsx"), "utf8");
const sync = readFileSync(join(process.cwd(), "features/pwa/offline-card-sync.tsx"), "utf8");
const offlinePage = readFileSync(join(process.cwd(), "app/offline/page.tsx"), "utf8");

describe("PWA contract", () => {
  it("defines an installable standalone manifest with regular and maskable icons", () => {
    expect(manifest).toContain('name: "VUYELA by LEMOTE"');
    expect(manifest).toContain('start_url: "/cliente"');
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain('purpose: "maskable"');
    expect(manifest).toContain("vuyela-192.png");
    expect(manifest).toContain("vuyela-512.png");
  });

  it("registers one root-scoped service worker without relying on cached worker code", () => {
    expect(registration).toContain('serviceWorker.register("/sw.js"');
    expect(registration).toContain('scope: "/"');
    expect(registration).toContain('updateViaCache: "none"');
  });

  it("caches only the public shell and never queues writes or private pages", () => {
    const worker = buildServiceWorkerSource("test-version");

    expect(worker).toContain('const OFFLINE_URL = "/offline"');
    expect(worker).toContain('request.method !== "GET"');
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain("fetch(request).catch");
    expect(worker).toContain('url.pathname.startsWith("/_next/static/")');
    expect(worker).not.toContain('cache.put("/cliente"');
    expect(worker).not.toContain("point_wallets");
    expect(worker).not.toContain("point_ledger");
    expect(worker).not.toContain('addEventListener("sync"');
  });

  it("syncs only active identification fields and serves a noindex offline route", () => {
    expect(sync).toContain('card.status === "active"');
    expect(sync).toContain("businessName: card.businessName");
    expect(sync).toContain("cardNumber: card.cardNumber");
    expect(sync).toContain("qrCode: card.qrCode");
    expect(sync).not.toContain("availablePoints");
    expect(sync).not.toContain("valueMzn");
    expect(offlinePage).toContain("OfflineCardList");
    expect(offlinePage).toContain("index: false");
  });
});
