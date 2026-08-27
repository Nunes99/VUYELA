import { describe, expect, it } from "vitest";

import { parseBusinessDashboardView } from "@/features/business-dashboard/dashboard";
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
      root: "/negocio/pos",
      settings: "/negocio/pos/definicoes",
      payments: "/negocio/pos/definicoes/pagamentos"
    });
  });
});
