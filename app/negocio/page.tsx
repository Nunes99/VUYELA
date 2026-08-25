import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import {
  BusinessDashboardView,
  parseBusinessDashboardView
} from "@/features/business-dashboard/dashboard";
import { getBusinessDashboard } from "@/features/business-dashboard/data";
import { getBusinessOperations } from "@/features/business-operations/data";
import {
  BusinessPortalShell,
  type BusinessPortalSection
} from "@/features/business-dashboard/portal-shell";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Negócio",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function BusinessAreaPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/negocio", "/negocio");
  const params = (await searchParams) ?? {};
  const view = parseBusinessDashboardView(params.vista);
  const dashboardState =
    state.status === "authorized"
      ? await getBusinessDashboard(state.principal, {
          businessId: getSearchParam(params.businessId),
          branchId: getSearchParam(params.branchId)
        })
      : null;
  const operationViews = new Set(["filiais", "equipa", "catalogo", "cartoes", "clientes"]);
  const operationsState =
    dashboardState?.status === "ready" && operationViews.has(view)
      ? await getBusinessOperations(
          dashboardState.selectedBusinessId,
          dashboardState.dashboard.hasManagerScope
        )
      : null;

  const sectionByView: Record<typeof view, BusinessPortalSection> = {
    dashboard: "dashboard",
    filiais: "branches",
    equipa: "team",
    catalogo: "catalog",
    cartoes: "cards",
    clientes: "customers",
    fidelizacao: "loyalty",
    analitica: "analytics",
    pos: "pos",
    transacoes: "analytics"
  };

  return (
    <ProtectedRouteStateView state={state} title="Painel do negócio" variant="business">
      {state.status === "authorized" && dashboardState ? (
        <BusinessPortalShell
          activeSection={sectionByView[view]}
          principal={state.principal}
          title={view === "dashboard" ? "Painel do Negócio" : undefined}
        >
          <BusinessDashboardView
            operationResult={getSearchParam(params.resultado)}
            operationsState={operationsState}
            state={dashboardState}
            view={view}
          />
        </BusinessPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
