import Link from "next/link";
import { ArrowLeft, CircleCheck, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import { PwaInstallAction } from "@/features/pwa/pwa-install-action";
import { canAccessRoute } from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import type { PosContextState } from "./data";
import { PosNavigationDrawer } from "./pos-navigation-drawer";
import { posAppRoutes } from "./routes";

export function PosPortalShell({
  principal,
  context,
  section = "transaction",
  children
}: {
  principal: AuthPrincipal;
  context: PosContextState;
  section?: "transaction" | "settings";
  children: ReactNode;
}) {
  const canManageBusiness = canAccessRoute(principal, "/negocio");
  const terminalReady =
    context.status === "ready" &&
    context.businesses.some((business) =>
      business.terminals.some((terminal) => terminal.status === "active")
    );
  const primaryBusiness = context.status === "ready" ? context.businesses[0] : null;
  const primaryBranch = primaryBusiness?.branches.find(
    (branch) => branch.id === primaryBusiness.defaultBranchId
  );

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
            <strong>
              <span className="pos-portal__title-desktop">POS VUYELA</span>
              <span className="pos-portal__title-mobile">POS</span>
            </strong>
          </span>
        </div>

        <nav aria-label="Navegação do POS" className="pos-portal__actions">
          <PosNavigationDrawer
            activeArea={section === "settings" ? "settings" : "catalog"}
            branchName={primaryBranch?.name ?? "Filial principal"}
            businessName={primaryBusiness?.name ?? "Negócio VUYELA"}
            canManageBusiness={canManageBusiness}
            roleLabel={primaryBusiness?.roleLabels[0] ?? "Operador POS"}
          />
          {!terminalReady ? (
            <span
              className="pos-portal__terminal-status"
              title="Verifique as definições do terminal antes de iniciar uma venda"
            >
              <CircleCheck aria-hidden="true" size={16} />
              <span>Verificar terminal</span>
            </span>
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
      <div className="pos-portal__content">{children}</div>
    </div>
  );
}
