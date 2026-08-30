import Link from "next/link";
import { ArrowLeft, LogOut, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";

import { businessSettingsRoutes } from "./routes";

export function BusinessPaymentSettingsShell({ children }: { children: ReactNode }) {
  return (
    <div className="pos-portal pos-portal--settings business-payment-portal">
      <header className="pos-portal__header business-payment-portal__header">
        <Link
          aria-label="Voltar às definições do negócio"
          className="pos-portal__mobile-back"
          href={businessSettingsRoutes.root}
        >
          <ArrowLeft aria-hidden="true" size={16} />
        </Link>
        <div className="pos-portal__brand-area">
          <VuyelaLogo className="pos-portal__brand" href="/negocio" />
          <VuyelaLogo className="pos-portal__mobile-symbol" compact href="/negocio" />
          <span aria-hidden="true" />
          <span className="pos-portal__protected-title">
            <small>Área protegida</small>
            <strong>GESTÃO VUYELA</strong>
          </span>
        </div>

        <nav aria-label="Ações das definições do negócio" className="pos-portal__actions">
          <Link
            className="business-payment-portal__settings-link"
            href={businessSettingsRoutes.root}
          >
            <Settings2 aria-hidden="true" size={17} />
            <span>Definições do negócio</span>
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="returnTo" value="/negocio/entrar" />
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
