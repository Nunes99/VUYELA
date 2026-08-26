import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessPortalShell } from "@/features/business-dashboard/portal-shell";
import { getBusinessSubscription } from "@/features/subscriptions/data";
import { BusinessSubscriptionView } from "@/features/subscriptions/subscription-dashboard";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Subscrição do negócio",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function BusinessSubscriptionPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/negocio", "/negocio/subscricao");
  const params = (await searchParams) ?? {};
  const businessId = typeof params.businessId === "string" ? params.businessId : undefined;
  const subscriptionState =
    state.status === "authorized"
      ? await getBusinessSubscription(state.principal, { businessId })
      : null;

  return (
    <ProtectedRouteStateView state={state} title="Subscrição do negócio" variant="business">
      {state.status === "authorized" && subscriptionState ? (
        <BusinessPortalShell
          activeSection="subscription"
          businessId={
            subscriptionState.status === "ready" ? subscriptionState.selectedBusinessId : undefined
          }
          principal={state.principal}
          title="Subscrição"
        >
          <BusinessSubscriptionView state={subscriptionState} />
        </BusinessPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
