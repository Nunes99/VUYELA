import { notFound } from "next/navigation";

import { BusinessPortalShell } from "@/features/business-dashboard/portal-shell";
import type { AuthPrincipal } from "@/lib/auth/rbac";

const previewPrincipal: AuthPrincipal = {
  profileId: "business-preview",
  profileRole: "customer",
  accountType: "business",
  mfaVerified: true,
  businessMemberships: [
    {
      businessId: "business-preview",
      branchId: null,
      role: "business_owner",
      status: "active"
    }
  ]
};

export default function BusinessPortalPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="business-portal-page">
      <BusinessPortalShell
        activeSection="dashboard"
        businessId="business-preview"
        identityLabel="MangoShop"
        principal={previewPrincipal}
        subtitle="Controlo operacional do programa VUYELA"
        title="Painel do Negócio"
      >
        <section className="business-dashboard-section">
          <div className="business-view-toolbar">
            <div>
              <span className="business-eyebrow">Visão geral</span>
              <h2>Operação MangoShop</h2>
              <p>Acompanhe clientes, transações e YELAS a partir de um único portal.</p>
            </div>
          </div>
        </section>
      </BusinessPortalShell>
    </main>
  );
}
