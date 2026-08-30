import { describe, expect, it } from "vitest";

import { parseBusinessDashboardView } from "@/features/business-dashboard/dashboard";
import { businessSettingsRoutes } from "@/features/business-settings/routes";
import { parsePosPaymentView, parsePosSettingsView } from "@/features/pos/pos-settings";
import { posAppRoutes } from "@/features/pos/routes";

describe("portal navigation", () => {
  it("parses every business dashboard view and falls back safely", () => {
    expect(parseBusinessDashboardView("filiais")).toBe("filiais");
    expect(parseBusinessDashboardView("cartoes")).toBe("cartoes");
    expect(parseBusinessDashboardView("unknown")).toBe("dashboard");
  });

  it("parses terminal and payment settings without duplicate routes", () => {
    expect(parsePosSettingsView("seguranca")).toBe("seguranca");
    expect(parsePosSettingsView("unknown")).toBe("geral");
    expect(parsePosPaymentView("emola")).toBe("emola");
    expect(parsePosPaymentView("unknown")).toBe("mpesa");
    expect(posAppRoutes).toEqual({
      root: "/pos",
      signIn: "/pos/entrar",
      invitation: "/pos/convite",
      settings: "/pos/definicoes"
    });
    expect(businessSettingsRoutes).toEqual({
      root: "/negocio/definicoes",
      payments: "/negocio/definicoes/pagamentos"
    });
  });
});
