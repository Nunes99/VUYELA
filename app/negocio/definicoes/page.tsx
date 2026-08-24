import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { BusinessPortalShell } from "@/features/business-dashboard/portal-shell";
import { BusinessSettingsView } from "@/features/business-settings/business-settings";
import { getBusinessSettings } from "@/features/business-settings/data";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Definições do negócio",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function BusinessSettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await getProtectedRouteState("/negocio", "/negocio/definicoes");
  const params = (await searchParams) ?? {};
  const settingsState =
    state.status === "authorized"
      ? await getBusinessSettings(state.principal, param(params.businessId))
      : null;

  return (
    <ProtectedRouteStateView state={state} title="Definições do negócio" variant="business">
      {state.status === "authorized" && settingsState ? (
        <BusinessPortalShell
          activeSection="settings"
          principal={state.principal}
          title="Definições"
        >
          <BusinessSettingsView saveStatus={param(params.estado)} state={settingsState} />
        </BusinessPortalShell>
      ) : null}
    </ProtectedRouteStateView>
  );
}
