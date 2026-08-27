import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getPwaManifest, pwaApplications, pwaAreas } from "@/features/pwa/apps";
import { buildServiceWorkerSource } from "@/features/pwa/service-worker";

const legacyManifestRoute = readFileSync(
  join(process.cwd(), "app/manifest.webmanifest/route.ts"),
  "utf8"
);
const manifestRoute = readFileSync(
  join(process.cwd(), "app/pwa/[area]/manifest.webmanifest/route.ts"),
  "utf8"
);
const registration = readFileSync(join(process.cwd(), "features/pwa/pwa-registration.tsx"), "utf8");
const sync = readFileSync(join(process.cwd(), "features/pwa/offline-card-sync.tsx"), "utf8");
const offlinePage = readFileSync(join(process.cwd(), "app/offline/page.tsx"), "utf8");

describe("PWA contract", () => {
  it("defines four separately installable manifests with closed navigation scopes", () => {
    const manifests = pwaAreas.map((area) => getPwaManifest(area));

    expect(manifests.map((item) => item.id)).toEqual(["/cliente", "/negocio", "/pos", "/admin"]);
    expect(manifests.map((item) => item.start_url)).toEqual([
      "/cliente",
      "/negocio",
      "/pos",
      "/admin"
    ]);
    expect(manifests.map((item) => item.scope)).toEqual(["/cliente", "/negocio", "/pos", "/admin"]);
    expect(new Set(manifests.map((item) => item.short_name)).size).toBe(4);

    for (const manifestDefinition of manifests) {
      expect(manifestDefinition.display).toBe("standalone");
      expect(manifestDefinition.icons).toEqual(
        expect.arrayContaining([expect.objectContaining({ purpose: "maskable" })])
      );
      for (const shortcut of manifestDefinition.shortcuts ?? []) {
        expect(shortcut.url.startsWith(String(manifestDefinition.scope))).toBe(true);
      }
    }

    expect(pwaApplications.negocio.shortcuts.every((item) => item.url.startsWith("/negocio"))).toBe(
      true
    );
    expect(pwaApplications.pos.startUrl).toBe("/pos");
    expect(manifestRoute).toContain("pwaAreas.map");
    expect(manifestRoute).toContain('"Content-Type": "application/manifest+json; charset=utf-8"');
    expect(legacyManifestRoute).toContain('getPwaManifest("cliente")');
  });

  it("registers one root-scoped service worker without relying on cached worker code", () => {
    expect(registration).toContain('serviceWorker.register("/sw.js"');
    expect(registration).toContain('scope: "/"');
    expect(registration).toContain('updateViaCache: "none"');
  });

  it("caches only the public shell and never queues writes or private pages", () => {
    const worker = buildServiceWorkerSource("test-version");

    expect(worker).toContain('const OFFLINE_URL = "/offline"');
    expect(worker).toContain('"/pwa/cliente/manifest.webmanifest"');
    expect(worker).toContain('"/pwa/negocio/manifest.webmanifest"');
    expect(worker).toContain('"/pwa/pos/manifest.webmanifest"');
    expect(worker).toContain('"/pwa/admin/manifest.webmanifest"');
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
