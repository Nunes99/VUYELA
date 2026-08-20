import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerReferralsView } from "@/features/referrals/customer-referrals";
import { getCustomerReferrals } from "@/features/referrals/data";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Indicacoes",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function CustomerReferralsPage() {
  const state = await getProtectedRouteState("/cliente", "/cliente/indicacoes");
  const referralState =
    state.status === "authorized" ? await getCustomerReferrals(state.principal.profileId) : null;

  return (
    <ProtectedRouteStateView state={state} title="Indicacoes">
      {referralState ? <CustomerReferralsView state={referralState} /> : null}
    </ProtectedRouteStateView>
  );
}
