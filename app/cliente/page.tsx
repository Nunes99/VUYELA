import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerDashboardView } from "@/features/customer-dashboard/dashboard";
import type { CustomerDashboardViewName } from "@/features/customer-dashboard/dashboard";
import { getCustomerDashboard } from "@/features/customer-dashboard/data";
import type { CustomerDashboardQuery } from "@/features/customer-dashboard/data";
import { getPublicMarketplaceSnapshot } from "@/features/public-marketplace/data";
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
    view === "negocios" ||
    view === "ofertas" ||
    view === "atividade" ||
    view === "notificacoes" ||
    view === "perfil"
  ) {
    return view;
  }

  return "inicio";
}

function pageParam(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(param(value) ?? "1", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function customerQuery(
  params: Record<string, string | string[] | undefined>
): CustomerDashboardQuery {
  const movement = param(params.movimento);
  const period = param(params.periodo);
  const notificationCategory = param(params.aviso);

  return {
    activityPage: pageParam(params.pagina),
    activityMovement: movement === "earn" || movement === "redeem" ? movement : "all",
    activityPeriod: period === "90" || period === "all" ? period : "30",
    activityQuery: param(params.q) ?? "",
    notificationPage: pageParam(params.paginaAvisos),
    notificationCategory:
      notificationCategory === "offers" ||
      notificationCategory === "transactions" ||
      notificationCategory === "system"
        ? notificationCategory
        : "all"
  };
}

const viewTitles: Record<CustomerDashboardViewName, string> = {
  inicio: "Painel do Cliente",
  cartoes: "Gerir Cartões",
  negocios: "Descobrir Negócios",
  ofertas: "Explorar Ofertas",
  atividade: "Histórico de Atividade",
  notificacoes: "Avisos e Alertas",
  perfil: "O Seu Perfil"
};

export default async function CustomerAreaPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/cliente", "/cliente");
  const params = (await searchParams) ?? {};
  const activeView = viewParam(params.vista);
  const [dashboardState, marketplaceState] =
    state.status === "authorized"
      ? await Promise.all([
          getCustomerDashboard(state.principal.profileId, customerQuery(params)),
          activeView === "negocios" ? getPublicMarketplaceSnapshot() : Promise.resolve(null)
        ])
      : [null, null];

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
          businesses={marketplaceState?.snapshot.businesses ?? []}
          cardId={param(params.cartao)}
          editProfile={param(params.editar) === "1"}
          profileStatus={param(params.perfil)}
          offerStatus={param(params.oferta)}
          membershipStatus={param(params.adesao)}
          state={dashboardState}
        />
      ) : null}
    </ProtectedRouteStateView>
  );
}
