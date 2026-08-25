import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardAreaMenu } from "@/components/auth/protected-route-state";
import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import type { PosContextState } from "./data";

export function PosPortalShell({
  principal,
  children
}: {
  principal: AuthPrincipal;
  context: PosContextState;
  section?: "transaction" | "settings";
  children: ReactNode;
}) {
  return (
    <div className="pos-portal">
      <header className="pos-portal__header">
        <div className="pos-portal__brand-area">
          <VuyelaLogo className="pos-portal__brand" href="/" />
          <span aria-hidden="true" />
          <span className="pos-portal__protected-title">
            <small>Área protegida</small>
            <strong>POS VUYELA</strong>
          </span>
        </div>

        <nav aria-label="Navegação do POS" className="pos-portal__actions">
          <DashboardAreaMenu includePosSettings principal={principal} variant="default" />
          <form action={signOutAction}>
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
