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

export default async function CustomerAreaPage() {
  const state = await getProtectedRouteState("/cliente", "/cliente");
  const dashboardState =
    state.status === "authorized" ? await getCustomerDashboard(state.principal.profileId) : null;

  return (
    <ProtectedRouteStateView state={state} title="Dashboard do cliente">
      {dashboardState ? <CustomerDashboardView state={dashboardState} /> : null}
    </ProtectedRouteStateView>
  );
}
