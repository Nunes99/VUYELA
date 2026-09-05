import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const baseStyles = readFileSync(join(root, "vuyela-design-system/src/styles/base.css"), "utf8");
const pageStyles = readFileSync(join(root, "app/globals.css"), "utf8");
const marketingStyles = readFileSync(join(root, "app/marketing.css"), "utf8");
const networkStyles = readFileSync(join(root, "app/rede-viva.css"), "utf8");
const homepage = readFileSync(join(root, "app/(public)/page.tsx"), "utf8");
const offerCarousel = readFileSync(
  join(root, "features/marketing/offer-editorial-carousel.tsx"),
  "utf8"
);
const publicShell = readFileSync(join(root, "components/marketing/public-site-shell.tsx"), "utf8");
const customerDashboard = readFileSync(
  join(root, "features/customer-dashboard/dashboard.tsx"),
  "utf8"
);
const customerCard = readFileSync(
  join(root, "features/customer-cards/customer-card-visual.tsx"),
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
    expect(marketingStyles).toContain("/brand/textures/capulana-primary.jpg");
    expect(networkStyles).toContain("/brand/textures/capulana-primary.jpg");
    expect(marketingStyles).toContain('font-family: "Sora"');
    expect(publicShell).toContain("VuyelaLogo");
    expect(homepage).toContain("/images/maputo-vuyela-hero.png");
    expect(homepage).toContain("/images/vuyela-product-yl.png");
    expect(homepage).toContain("Cada compra");
    expect(homepage).toContain("cria uma razão");
    expect(homepage).toContain("<em>voltar.</em>");
  });

  it("implements the editorial offer filters and automatic carousel from the prototype", () => {
    for (const label of ["Tudo", "Comer", "Cuidar", "Comprar", "Descobrir"]) {
      expect(offerCarousel).toContain(`label: "${label}"`);
    }

    expect(offerCarousel).toContain("5200");
    expect(offerCarousel).not.toContain("scroll-snap-type: x mandatory");
    expect(networkStyles).toContain("scroll-snap-type: x mandatory");
    expect(networkStyles).not.toContain(".rv-offers__flow");
  });

  it("retains the five documented customer mobile navigation destinations", () => {
    for (const label of [
      "Início",
      "Gerir Cartões",
      "Explorar Ofertas",
      "Atividade",
      "O Seu Perfil"
    ]) {
      expect(customerDashboard).toContain(`label: "${label}"`);
    }

    expect(pageStyles).toContain("bottom: max(var(--vy-space-2), env(safe-area-inset-bottom))");
    expect(pageStyles).toContain("top: auto");
    expect(pageStyles).toContain(".customer-dashboard-nav a span");
    expect(pageStyles).toContain("color: var(--vy-text-muted)");
  });

  it("implements the approved member-card and NEW PHAS customer composition", () => {
    expect(homepage).toContain("BusinessDashboardDemo");
    expect(homepage).toContain("rv-business-identity");
    expect(homepage).toContain("business.logoUrl");
    expect(homepage).toContain("OfferEditorialCarousel");
    expect(homepage).toContain("Disponível no telemóvel e no navegador");
    expect(networkStyles).toContain(".rv-wallet__rail");
    expect(networkStyles).not.toContain(".rv-wallet__steps");
    expect(networkStyles).not.toContain(".rv-wallet__benefits");
    expect(networkStyles).toContain(".rv-dashboard__chart");
    expect(customerDashboard).toContain("CustomerSummaryCard");
    expect(customerDashboard).toContain("Seus Cartões Digitais");
    expect(customerDashboard).toContain("Histórico de Atividade");
    expect(customerDashboard).toContain("Editar Dados Pessoais");
    expect(customerDashboard).toContain("Seus Cartões Digitais");
    expect(customerCard).toContain("CustomerCardFace");
    expect(customerCard).toContain("data-face={currentFace}");
    expect(customerCard).toContain("QRCodeSVG");
    expect(pageStyles).toContain("NEW PHAS nodes 418:4266, 428:4266 and 428:4436");
    expect(pageStyles).toContain("NEW PHAS nodes 435:4274, 436:4270, 436:5129,");
    expect(pageStyles).toContain(".customer-dashboard-stats");
    expect(pageStyles).toContain(".customer-digital-card__back-content");
    expect(pageStyles).toContain("NEW PHAS (2): customer flows exported 23 Aug 2026");
  });
});
