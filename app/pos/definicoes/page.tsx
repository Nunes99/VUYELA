import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getPosContext } from "@/features/pos/data";
import { PosPortalShell } from "@/features/pos/pos-shell";
import { parsePosSettingsView, PosSettingsView } from "@/features/pos/pos-settings";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Definições do POS",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function PosSettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/pos", "/pos/definicoes");
  const context = state.status === "authorized" ? await getPosContext(state.principal) : null;
  const params = await searchParams;
  const view = parsePosSettingsView(params?.vista);
  const terminalId = singleParam(params?.terminal);
  const result = singleParam(params?.resultado);

  return (
    <ProtectedRouteStateView state={state} title="Definições do POS" variant="pos">
      {state.status === "authorized" && context ? (
        <PosPortalShell context={context} principal={state.principal} section="settings">
          <PosSettingsView context={context} result={result} terminalId={terminalId} view={view} />
        </PosPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
