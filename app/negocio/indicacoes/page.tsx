import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessPortalShell } from "@/features/business-dashboard/portal-shell";
import { BusinessReferralsView } from "@/features/referrals/business-referrals";
import { getBusinessReferrals } from "@/features/referrals/data";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Indicações do negócio",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function BusinessReferralsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/negocio", "/negocio/indicacoes");
  const params = (await searchParams) ?? {};
  const referralState =
    state.status === "authorized"
      ? await getBusinessReferrals(state.principal, {
          businessId: getSearchParam(params.businessId)
        })
      : null;

  return (
    <ProtectedRouteStateView state={state} title="Indicações do negócio" variant="business">
      {state.status === "authorized" && referralState ? (
        <BusinessPortalShell
          activeSection="referrals"
          businessId={
            referralState.status === "ready" ? referralState.selectedBusinessId : undefined
          }
          principal={state.principal}
          title="Indicações"
        >
          <BusinessReferralsView state={referralState} />
        </BusinessPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
