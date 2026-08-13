import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessDashboardView } from "@/features/business-dashboard/dashboard";
import { getBusinessDashboard } from "@/features/business-dashboard/data";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Negocio",
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
  const dashboardState =
    state.status === "authorized"
      ? await getBusinessDashboard(state.principal, {
          businessId: getSearchParam(params.businessId),
          branchId: getSearchParam(params.branchId)
        })
      : null;

  return (
    <ProtectedRouteStateView state={state} title="Dashboard do negocio">
      {dashboardState ? <BusinessDashboardView state={dashboardState} /> : null}
    </ProtectedRouteStateView>
  );
}
