import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
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

  return (
    <ProtectedRouteStateView state={state} title="POS VUYELA">
      <div className="dashboard-card">
        <h2>Acesso de caixa e filial</h2>
        <p>
          Esta rota aceita cashier, branch manager, admin ou owner ativos. Operacoes de pontos so
          serao ligadas ao loyalty engine transacional na Fase 06.
        </p>
      </div>
    </ProtectedRouteStateView>
  );
}
