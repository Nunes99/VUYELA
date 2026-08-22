import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerDashboardView } from "@/features/customer-dashboard/dashboard";
import { getCustomerDashboard } from "@/features/customer-dashboard/data";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cliente",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function CustomerAreaPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/cliente", "/cliente");
  const params = (await searchParams) ?? {};
  const dashboardState =
    state.status === "authorized" ? await getCustomerDashboard(state.principal.profileId) : null;

  return (
    <ProtectedRouteStateView
      customerName={
        dashboardState?.status !== "error"
          ? dashboardState?.dashboard.profile.displayName
          : undefined
      }
      state={state}
      title="Painel do cliente"
      variant="customer"
    >
      {dashboardState ? (
        <CustomerDashboardView profileStatus={param(params.perfil)} state={dashboardState} />
      ) : null}
    </ProtectedRouteStateView>
  );
}
