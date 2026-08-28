import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardAreaMenu } from "@/components/auth/protected-route-state";
import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { FlowBreadcrumbs } from "@/components/navigation/flow-navigation";
import { signOutAction } from "@/features/auth/actions";
import { PwaInstallAction } from "@/features/pwa/pwa-install-action";
import { canAccessRoute } from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import type { PosContextState } from "./data";
import { posAppRoutes } from "./routes";

export function PosPortalShell({
  principal,
  section = "transaction",
  children
}: {
  principal: AuthPrincipal;
  context: PosContextState;
  section?: "transaction" | "settings";
  children: ReactNode;
}) {
  const canManageBusiness = canAccessRoute(principal, "/negocio");

  return (
    <div className={`pos-portal pos-portal--${section}`}>
      <header className="pos-portal__header">
        {section === "settings" ? (
          <Link
            aria-label="Voltar ao POS"
            className="pos-portal__mobile-back"
            href={posAppRoutes.root}
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </Link>
        ) : null}
        <div className="pos-portal__brand-area">
          <VuyelaLogo className="pos-portal__brand" href={posAppRoutes.root} />
          <VuyelaLogo className="pos-portal__mobile-symbol" compact href={posAppRoutes.root} />
          <span aria-hidden="true" />
          <span className="pos-portal__protected-title">
            <small>Área protegida</small>
            <strong>POS VUYELA</strong>
          </span>
        </div>

        <nav aria-label="Navegação do POS" className="pos-portal__actions">
          {canManageBusiness ? (
            <DashboardAreaMenu includePosSettings principal={principal} variant="default" />
          ) : null}
          <PwaInstallAction area="pos" />
          <form action={signOutAction}>
            <input type="hidden" name="returnTo" value={posAppRoutes.signIn} />
            <button type="submit">
              <LogOut aria-hidden="true" size={18} />
              <span>Terminar sessão</span>
            </button>
          </form>
        </nav>
      </header>
      <div className="pos-portal__content">
        {section === "transaction" ? (
          <FlowBreadcrumbs
            className="pos-portal__breadcrumbs"
            items={
              canManageBusiness
                ? [{ label: "Negócio", href: "/negocio" }, { label: "POS" }]
                : [{ label: "POS" }]
            }
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
