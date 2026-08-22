import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const baseStyles = readFileSync(join(root, "vuyela-design-system/src/styles/base.css"), "utf8");
const pageStyles = readFileSync(join(root, "app/globals.css"), "utf8");
const homepage = readFileSync(join(root, "app/(public)/page.tsx"), "utf8");
const customerDashboard = readFileSync(
  join(root, "features/customer-dashboard/dashboard.tsx"),
  "utf8"
);

describe("approved VUYELA design contract", () => {
  it("self-hosts the approved Sora and Inter typefaces", () => {
    expect(baseStyles).toContain('font-family: "Sora"');
    expect(baseStyles).toContain('font-family: "Inter"');
    expect(baseStyles).toContain("/fonts/sora-latin.woff2");
    expect(baseStyles).toContain("/fonts/inter-latin.woff2");
  });

  it("uses the official mark and cultural pattern instead of text-only branding", () => {
    expect(pageStyles).toContain("/brand/pattern.svg");
    expect(homepage).toContain("VuyelaLogo");
    expect(homepage).toContain("Cada compra");
    expect(homepage).toContain("cria uma razão");
    expect(homepage).toContain("para voltar.");
  });

  it("includes the four documented benefit categories", () => {
    expect(homepage).toContain("Descontos exclusivos");
    expect(homepage).toContain("Pontos que valem");
    expect(homepage).toContain("Válido em vários lugares");
    expect(homepage).toContain("Ofertas personalizadas");
  });

  it("retains the five documented customer mobile navigation destinations", () => {
    for (const label of ["Início", "Cartões", "Explorar", "Atividade", "Perfil"]) {
      expect(customerDashboard).toContain(`label: "${label}"`);
    }

    expect(pageStyles).toContain("bottom: max(var(--vy-space-2), env(safe-area-inset-bottom))");
    expect(pageStyles).toContain("top: auto");
    expect(pageStyles).toContain(".customer-dashboard-nav a span");
    expect(pageStyles).toContain("color: var(--vy-text-muted)");
  });
});
