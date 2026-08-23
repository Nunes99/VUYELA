import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerDashboardView } from "@/features/customer-dashboard/dashboard";
import type { CustomerDashboardViewName } from "@/features/customer-dashboard/dashboard";
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

function viewParam(value: string | string[] | undefined): CustomerDashboardViewName {
  const view = param(value);

  if (
    view === "cartoes" ||
    view === "ofertas" ||
    view === "atividade" ||
    view === "notificacoes" ||
    view === "perfil"
  ) {
    return view;
  }

  return "inicio";
}

const viewTitles: Record<CustomerDashboardViewName, string> = {
  inicio: "Painel do cliente",
  cartoes: "Cartões",
  ofertas: "Explorar ofertas",
  atividade: "Histórico de atividade",
  notificacoes: "Notificações",
  perfil: "Perfil"
};

export default async function CustomerAreaPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/cliente", "/cliente");
  const params = (await searchParams) ?? {};
  const activeView = viewParam(params.vista);
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
      title={viewTitles[activeView]}
      variant="customer"
    >
      {dashboardState ? (
        <CustomerDashboardView
          activeView={activeView}
          cardId={param(params.cartao)}
          editProfile={param(params.editar) === "1"}
          profileStatus={param(params.perfil)}
          state={dashboardState}
        />
      ) : null}
    </ProtectedRouteStateView>
  );
}
