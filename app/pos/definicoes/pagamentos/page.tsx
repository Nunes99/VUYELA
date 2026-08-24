import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getPosContext } from "@/features/pos/data";
import { PosPortalShell } from "@/features/pos/pos-shell";
import { parsePosPaymentView, PosPaymentSettingsView } from "@/features/pos/pos-settings";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Pagamentos do POS",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function PosPaymentSettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/pos", "/pos/definicoes/pagamentos");
  const context = state.status === "authorized" ? await getPosContext(state.principal) : null;
  const method = parsePosPaymentView((await searchParams)?.metodo);

  return (
    <ProtectedRouteStateView state={state} title="Pagamentos do POS" variant="pos">
      {state.status === "authorized" && context ? (
        <PosPortalShell context={context} principal={state.principal} section="settings">
          <PosPaymentSettingsView context={context} method={method} />
        </PosPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
