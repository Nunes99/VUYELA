import Link from "next/link";
import { ChevronDown, LogOut, Settings, ShieldCheck, Store } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardAreaMenu } from "@/components/auth/protected-route-state";
import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import type { PosContextState } from "./data";

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
  const business = context.status === "ready" ? context.businesses[0] : null;
  const branch = business?.branches.find((item) => item.id === business.defaultBranchId);

  return (
    <div className="pos-portal">
      <header className="pos-portal__header">
        <div className="pos-portal__brand-area">
          <VuyelaLogo className="pos-portal__brand" href="/" />
          <span aria-hidden="true" />
          <strong>POS</strong>
        </div>

        <div className="pos-portal__location">
          <Store aria-hidden="true" size={17} />
          <span>
            <strong>{business?.name ?? "Negócio VUYELA"}</strong>
            <small>{branch ? `${branch.name} · ${branch.city}` : "Sede principal"}</small>
          </span>
          <ChevronDown aria-hidden="true" size={16} />
        </div>

        <nav aria-label="Navegação do POS" className="pos-portal__actions">
          <Link className={section === "transaction" ? "is-active" : undefined} href="/pos">
            Nova transação
          </Link>
          <Link
            aria-label="Definições do POS"
            className={section === "settings" ? "is-active" : undefined}
            href="/pos/definicoes"
            title="Definições do POS"
          >
            <Settings aria-hidden="true" size={18} />
          </Link>
          <DashboardAreaMenu principal={principal} variant="default" />
          <form action={signOutAction}>
            <button aria-label="Terminar sessão" title="Terminar sessão" type="submit">
              <LogOut aria-hidden="true" size={18} />
            </button>
          </form>
        </nav>
      </header>
      <div className="pos-portal__secure-bar">
        <ShieldCheck aria-hidden="true" size={14} />
        Sessão protegida e operações validadas no servidor
      </div>
      <div className="pos-portal__content">{children}</div>
    </div>
  );
}
