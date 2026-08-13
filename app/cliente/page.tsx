import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerCardsView } from "@/features/customer-cards/card-list";
import { getCustomerCards } from "@/features/customer-cards/data";
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
  const cardsState =
    state.status === "authorized"
      ? await getCustomerCards(state.principal.profileId)
      : { status: "empty" as const };

  return (
    <ProtectedRouteStateView state={state} title="Cartoes digitais">
      <CustomerCardsView state={cardsState} />
    </ProtectedRouteStateView>
  );
}
