import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getBusinessSubscription } from "@/features/subscriptions/data";
import { BusinessSubscriptionView } from "@/features/subscriptions/subscription-dashboard";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Subscricao do negocio",
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
    <ProtectedRouteStateView state={state} title="Subscricao do negocio">
      {subscriptionState ? <BusinessSubscriptionView state={subscriptionState} /> : null}
    </ProtectedRouteStateView>
  );
}
