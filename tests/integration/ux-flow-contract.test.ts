import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("professional UX flow contract", () => {
  it("keeps the selected business in every portal navigation destination", () => {
    const shell = read("features/business-dashboard/portal-shell.tsx");

    expect(shell).toContain("withBusinessContext(item.href, businessId)");
    expect(shell).toContain("encodeURIComponent(businessId)");
  });

  it("supports reversible POS stages before a transaction is confirmed", () => {
    const actions = read("features/pos/actions.ts");
    const workflow = read("features/pos/pos-workflow.tsx");

    expect(actions).toContain('intent === "edit_cart"');
    expect(actions).toContain('intent === "remove_customer"');
    expect(actions).toContain('intent === "reset"');
    expect(workflow).toContain("Carrinho");
    expect(workflow).toContain("Benefícios");
  });

  it("makes business onboarding reversible and reviewable", () => {
    const forms = read("features/auth/forms.tsx");

    expect(forms).toContain('const steps = ["Acesso", "Negócio", "Filial", "Revisão"]');
    expect(forms).toContain("goToStep(step - 1)");
    expect(forms).toContain("auth-wizard__review-section");
    expect(forms).toContain("continueToNextStep");
  });

  it("provides global loading feedback and reusable route orientation", () => {
    expect(read("app/loading.tsx")).toContain("PortalLoading");
    expect(read("components/system/portal-loading.tsx")).toContain('aria-live="polite"');
    expect(read("components/navigation/flow-navigation.tsx")).toContain(
      'aria-label="Localização na plataforma"'
    );
  });

  it("uses one branded authentication shell without exposing implementation details", () => {
    const authShell = read("components/auth/auth-shell.tsx");
    const portalSignIn = read("features/auth/portal-sign-in.tsx");
    const protectedRoute = read("components/auth/protected-route-state.tsx");

    expect(authShell).toContain("VuyelaLogo");
    expect(portalSignIn).toContain("AuthShell");
    expect(portalSignIn).not.toMatch(/PostgreSQL|server-side|RBAC/);
    expect(protectedRoute).not.toContain("helpers server-side");
  });

  it("keeps one visible brand and one navigation trigger in compact portal headers", () => {
    const businessShell = read("features/business-dashboard/portal-shell.tsx");
    const posShell = read("features/pos/pos-shell.tsx");
    const posSettingsNavigation = read("features/pos/pos-settings-navigation.tsx");
    const offlinePage = read("app/offline/page.tsx");

    expect(businessShell).not.toContain("business-portal__mobile-context");
    expect(posShell).toContain('className="pos-portal__mobile-symbol" compact');
    expect(posShell).toContain("pos-portal__terminal-status");
    expect(posSettingsNavigation).toContain('className="pos-figma-mobile-brand"');
    expect(read("features/pos/pos-workflow.tsx")).toContain("pos-sale__mobile-cart-bar");
    expect(offlinePage).not.toContain("<span>VUYELA by LEMOTE</span>");
  });

  it("gives business creation and management forms explicit pending feedback", () => {
    const pendingButton = read("components/forms/pending-submit-button.tsx");
    const operations = read("features/business-operations/views.tsx");
    const campaigns = read("features/business-campaigns/campaigns.tsx");
    const teamInvite = read("features/business-operations/team-invite-form.tsx");
    const posOperator = read("features/business-operations/pos-operator-form.tsx");

    expect(pendingButton).toContain("useFormStatus");
    expect(pendingButton).toContain("form-submit-spinner");
    expect(operations).toContain("PendingSubmitButton");
    expect(campaigns).toContain("PendingSubmitButton");
    expect(teamInvite).toContain('pendingLabel="A criar convite..."');
    expect(posOperator).toContain('pendingLabel="A criar acesso..."');
  });

  it("keeps the POS catalog hierarchy aligned with the approved service catalog frame", () => {
    const workflow = read("features/pos/pos-workflow.tsx");
    const shell = read("features/pos/pos-shell.tsx");

    expect(workflow).toContain("Catálogo de Serviços");
    expect(workflow).toContain("pos-sale__item-details");
    expect(workflow).toContain("Carrinho de Vendas");
    expect(workflow).toContain("pos-sale__benefit-zone");
    expect(shell).not.toContain("FlowBreadcrumbs");
  });
});
