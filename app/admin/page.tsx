import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { getProtectedRouteState } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Administracao",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const state = await getProtectedRouteState("/admin", "/admin");

  return (
    <ProtectedRouteStateView state={state} title="Administracao VUYELA">
      <div className="dashboard-card">
        <h2>MFA activo e operacoes privilegiadas</h2>
        <p>
          Rotas privilegiadas exigem papel de plataforma e MFA. Acoes administrativas sensiveis
          devem usar service-role server-side com auditoria.
        </p>
      </div>
    </ProtectedRouteStateView>
  );
}
