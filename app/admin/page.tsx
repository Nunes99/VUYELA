import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { getAdminDashboardState } from "@/features/admin/data";
import { normalizeAdminQuery, parseAdminView } from "@/features/admin/model";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Administração",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/admin", "/admin");
  const params = (await searchParams) ?? {};
  const adminState =
    state.status === "authorized"
      ? await getAdminDashboardState(
          state.principal,
          parseAdminView(params.view),
          normalizeAdminQuery(params.q)
        )
      : null;

  return (
    <ProtectedRouteStateView state={state} title="Administração VUYELA">
      {adminState && state.status === "authorized" ? (
        <AdminDashboard principal={state.principal} state={adminState} />
      ) : null}
    </ProtectedRouteStateView>
  );
}
