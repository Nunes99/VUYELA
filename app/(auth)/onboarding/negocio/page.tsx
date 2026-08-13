import type { Metadata } from "next";

import { BusinessOnboardingForm } from "@/features/auth/forms";
import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cadastrar negocio",
  description: "Cadastre um negocio para validacao na VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  const state = await getProtectedRouteState("/cliente", "/onboarding/negocio");

  return (
    <ProtectedRouteStateView state={state} title="Cadastre um negocio para validacao.">
      <div className="dashboard-card">
        <p>
          O negocio entra como pendente de validacao. O acesso completo ao dashboard vem depois da
          aprovacao e configuracao de fidelizacao.
        </p>
        <BusinessOnboardingForm />
      </div>
    </ProtectedRouteStateView>
  );
}
