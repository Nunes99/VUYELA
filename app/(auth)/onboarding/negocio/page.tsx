import type { Metadata } from "next";

import { BusinessOnboardingForm } from "@/features/auth/forms";
import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { FlowBackLink } from "@/components/navigation/flow-navigation";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Registar negócio",
  description: "Registe um negócio para validação na VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  const state = await getProtectedRouteState("/cliente", "/onboarding/negocio");

  return (
    <ProtectedRouteStateView state={state} title="Registe um negócio para validação.">
      <FlowBackLink href="/cliente" label="Voltar à área do cliente" />
      <div className="dashboard-card">
        <p>
          O negócio entra como pendente de validação. O acesso completo ao painel vem depois da
          aprovação e configuração de fidelização.
        </p>
        <BusinessOnboardingForm />
      </div>
    </ProtectedRouteStateView>
  );
}
