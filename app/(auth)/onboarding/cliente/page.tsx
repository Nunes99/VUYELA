import type { Metadata } from "next";

import { CustomerOnboardingForm } from "@/features/auth/forms";
import { getProtectedRouteState } from "@/lib/auth/session";
import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";

export const metadata: Metadata = {
  title: "Onboarding de cliente",
  description: "Complete o perfil de cliente VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function CustomerOnboardingPage() {
  const state = await getProtectedRouteState("/cliente", "/onboarding/cliente");

  return (
    <ProtectedRouteStateView state={state} title="Complete o seu perfil de cliente.">
      <div className="dashboard-card">
        <p>
          Estes dados criam a base para cartões digitais, notificações e recuperação de acesso nas
          próximas fases.
        </p>
        <CustomerOnboardingForm />
      </div>
    </ProtectedRouteStateView>
  );
}
