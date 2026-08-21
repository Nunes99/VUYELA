import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessCampaignsView } from "@/features/business-campaigns/campaigns";
import { getBusinessCampaigns } from "@/features/business-campaigns/data";
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
    <ProtectedRouteStateView state={state} title="Campanhas do negócio">
      {campaignsState ? <BusinessCampaignsView state={campaignsState} /> : null}
    </ProtectedRouteStateView>
  );
}
