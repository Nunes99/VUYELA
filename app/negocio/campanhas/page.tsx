import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessCampaignsView } from "@/features/business-campaigns/campaigns";
import { getBusinessCampaigns } from "@/features/business-campaigns/data";
import { BusinessPortalShell } from "@/features/business-dashboard/portal-shell";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Campanhas",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function BusinessCampaignsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/negocio", "/negocio/campanhas");
  const params = (await searchParams) ?? {};
  const campaignsState =
    state.status === "authorized"
      ? await getBusinessCampaigns(state.principal, {
          businessId: getSearchParam(params.businessId)
        })
      : null;

  return (
    <ProtectedRouteStateView state={state} title="Campanhas do negócio" variant="business">
      {state.status === "authorized" && campaignsState ? (
        <BusinessPortalShell
          activeSection="campaigns"
          principal={state.principal}
          title="Campanhas"
        >
          <BusinessCampaignsView
            operationResult={getSearchParam(params.resultado)}
            state={campaignsState}
          />
        </BusinessPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
