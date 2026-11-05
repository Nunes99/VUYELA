import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { FullConfig } from "@playwright/test";

async function pageRoutes(directory: string, segments: string[] = []): Promise<string[]> {
  const routes: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "api") continue;
      const segment = entry.name.startsWith("(")
        ? []
        : [entry.name.startsWith("[") ? "e2e-empty" : entry.name];
      routes.push(...(await pageRoutes(join(directory, entry.name), [...segments, ...segment])));
    } else if (entry.name === "page.tsx") {
      routes.push(`/${segments.join("/")}`);
    }
  }
  return routes;
}

/** Compile cold routes before Playwright starts any per-test deadline. No form submissions. */
export default async function warmTestApplication(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error("O servidor E2E precisa de um baseURL local.");
  const assets = new Set<string>();
  const routes = [
    ...(await pageRoutes(join(process.cwd(), "app"))),
    "/sw.js",
    "/manifest.webmanifest",
    ...["cliente", "negocio", "pos", "admin"].map((area) => `/pwa/${area}/manifest.webmanifest`)
  ];
  for (const route of new Set(routes)) {
    const response = await fetch(new URL(route, baseURL), { signal: AbortSignal.timeout(180_000) });
    if (response.status >= 500)
      throw new Error(`E2E warmup: ${route} devolveu ${response.status}.`);
    const html = await response.text();
    for (const match of html.matchAll(
      /(?:src|href)="(\/_next\/static\/[^"<>]+\.(?:js|css)(?:\?[^"<>]*)?)"/g
    )) {
      const asset = match[1]?.replaceAll("&amp;", "&");
      if (asset && !assets.has(asset)) {
        assets.add(asset);
        const result = await fetch(new URL(asset, baseURL), {
          signal: AbortSignal.timeout(180_000)
        });
        if (!result.ok) throw new Error(`E2E warmup: recurso ${asset} devolveu ${result.status}.`);
        await result.arrayBuffer();
      }
    }
    console.log(`[E2E warmup] ${response.status} ${route}`);
  }
}
