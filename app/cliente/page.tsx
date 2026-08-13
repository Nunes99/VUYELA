import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
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

  return (
    <ProtectedRouteStateView state={state} title="Area do cliente">
      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Cartoes digitais</h2>
          <p>Preparado para listar cartoes, pontos e historico quando a Fase 07 chegar.</p>
        </article>
        <article className="dashboard-card">
          <h2>Seguranca da conta</h2>
          <p>O acesso passa por sessao Supabase, perfil proprio e policies RLS.</p>
        </article>
      </div>
    </ProtectedRouteStateView>
  );
}
