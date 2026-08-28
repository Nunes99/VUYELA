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

    expect(actions).toContain('intent === "back_to_identify"');
    expect(actions).toContain('intent === "back_to_services"');
    expect(workflow).toContain("Cancelar transação");
    expect(workflow).toContain("Voltar ao pagamento");
  });

  it("makes business onboarding reversible and reviewable", () => {
    const forms = read("features/auth/forms.tsx");

    expect(forms).toContain('const steps = ["Acesso", "Negócio", "Revisão"]');
    expect(forms).toContain("Pode voltar às etapas anteriores sem perder");
    expect(forms).toContain("continueToNextStep");
  });

  it("provides global loading feedback and reusable route orientation", () => {
    expect(read("app/loading.tsx")).toContain('aria-live="polite"');
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
    expect(posSettingsNavigation).toContain('className="pos-figma-mobile-brand"');
    expect(offlinePage).not.toContain("<span>VUYELA by LEMOTE</span>");
  });
});
