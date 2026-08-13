import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Negocio",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function BusinessAreaPage() {
  const state = await getProtectedRouteState("/negocio", "/negocio");

  return (
    <ProtectedRouteStateView state={state} title="Dashboard do negocio">
      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>RBAC centralizado</h2>
          <p>A rota exige membro ativo com papel de branch manager, admin ou owner.</p>
        </article>
        <article className="dashboard-card">
          <h2>Isolamento por tenant</h2>
          <p>Dados privados continuam protegidos por `business_id` e policies RLS.</p>
        </article>
      </div>
    </ProtectedRouteStateView>
  );
}
