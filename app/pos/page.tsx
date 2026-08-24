import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getPosContext } from "@/features/pos/data";
import { PosPortalShell } from "@/features/pos/pos-shell";
import { PosWorkflow } from "@/features/pos/pos-workflow";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "POS",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const state = await getProtectedRouteState("/pos", "/pos");
  const posContext = state.status === "authorized" ? await getPosContext(state.principal) : null;

  return (
    <ProtectedRouteStateView state={state} title="POS VUYELA" variant="pos">
      {state.status === "authorized" && posContext ? (
        <PosPortalShell context={posContext} principal={state.principal}>
          <PosWorkflow context={posContext} />
        </PosPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
