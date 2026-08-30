import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessPaymentSettingsShell } from "@/features/business-settings/payment-shell";
import { businessSettingsRoutes } from "@/features/business-settings/routes";
import { getPosContext } from "@/features/pos/data";
import { parsePosPaymentView, PosPaymentSettingsView } from "@/features/pos/pos-settings";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Métodos de pagamento do negócio",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function BusinessPaymentSettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/negocio", businessSettingsRoutes.payments);
  const context = state.status === "authorized" ? await getPosContext(state.principal) : null;
  const params = await searchParams;
  const method = parsePosPaymentView(params?.metodo);

  return (
    <ProtectedRouteStateView state={state} title="Métodos de pagamento" variant="business">
      {state.status === "authorized" && context ? (
        <BusinessPaymentSettingsShell>
          <PosPaymentSettingsView
            branchId={singleParam(params?.branchId)}
            businessId={singleParam(params?.businessId)}
            context={context}
            method={method}
            result={singleParam(params?.resultado)}
          />
        </BusinessPaymentSettingsShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
