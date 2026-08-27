import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Cpu,
  LockKeyhole,
  Printer,
  Settings2,
  Smartphone,
  UsersRound,
  Wifi
} from "lucide-react";

import type { PosPaymentViewId, PosSettingsViewId } from "./pos-settings";
import { posAppRoutes } from "./routes";

const settingsItems = [
  { id: "geral", label: "Geral", icon: Settings2 },
  { id: "dispositivos", label: "Dispositivos", icon: Cpu },
  { id: "impressora", label: "Impressora", icon: Printer },
  { id: "rede", label: "Rede", icon: Wifi },
  { id: "utilizadores", label: "Utilizadores", icon: UsersRound },
  { id: "seguranca", label: "Segurança", icon: LockKeyhole }
] as const;

const paymentItems = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "emola", label: "e-Mola", icon: Smartphone },
  { id: "mkesh", label: "Mkesh", icon: Smartphone },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "cartao", label: "Cartão", icon: CreditCard }
] as const;

export function PosSettingsNavigation({
  view,
  terminalId
}: {
  view: PosSettingsViewId;
  terminalId?: string;
}) {
  return (
    <SettingsNavigationFrame>
      <div className="pos-figma-side-title">Configurações POS</div>
      <nav aria-label="Configurações do POS" className="pos-figma-side-links">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const href = `${posAppRoutes.settings}?vista=${item.id}${terminalId ? `&terminal=${terminalId}` : ""}`;
          return (
            <Link
              aria-current={view === item.id ? "page" : undefined}
              className={view === item.id ? "is-active" : undefined}
              href={href}
              key={item.id}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
              {view === item.id ? <i aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
      <MobileSettingsNav active={view} terminalId={terminalId} />
    </SettingsNavigationFrame>
  );
}

export function PosPaymentNavigation({ method }: { method: PosPaymentViewId }) {
  return (
    <SettingsNavigationFrame payments>
      <Link className="pos-figma-side-return" href={posAppRoutes.settings}>
        <ArrowLeft aria-hidden="true" size={16} />
        Voltar às Configurações
      </Link>
      <div className="pos-figma-side-title">Métodos de Pagamento</div>
      <nav aria-label="Métodos de pagamento" className="pos-figma-side-links">
        {paymentItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              aria-current={method === item.id ? "page" : undefined}
              className={method === item.id ? "is-active" : undefined}
              href={`${posAppRoutes.payments}?metodo=${item.id}`}
              key={item.id}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
              {method === item.id ? <i aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
      <MobilePaymentNav active={method} />
    </SettingsNavigationFrame>
  );
}

function SettingsNavigationFrame({
  children,
  payments = false
}: {
  children: ReactNode;
  payments?: boolean;
}) {
  return (
    <aside className={`pos-figma-navigation${payments ? " pos-figma-navigation--payments" : ""}`}>
      {children}
      <footer className="pos-figma-version">
        <small>Versão do Software</small>
        <strong>v2.4.12-Stable</strong>
      </footer>
    </aside>
  );
}

function MobileSettingsNav({
  active,
  terminalId
}: {
  active: PosSettingsViewId;
  terminalId?: string;
}) {
  return (
    <MobileNavFooter>
      {settingsItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            aria-current={active === item.id ? "page" : undefined}
            className={active === item.id ? "is-active" : undefined}
            href={`${posAppRoutes.settings}?vista=${item.id}${terminalId ? `&terminal=${terminalId}` : ""}`}
            key={item.id}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </MobileNavFooter>
  );
}

function MobilePaymentNav({ active }: { active: PosPaymentViewId }) {
  return (
    <MobileNavFooter>
      {paymentItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            aria-current={active === item.id ? "page" : undefined}
            className={active === item.id ? "is-active" : undefined}
            href={`${posAppRoutes.payments}?metodo=${item.id}`}
            key={item.id}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </MobileNavFooter>
  );
}

function MobileNavFooter({ children }: { children: ReactNode }) {
  return (
    <div className="pos-figma-mobile-nav">
      <nav>{children}</nav>
      <footer>
        <span>v2.4.12-Stable</span>
        <strong>VUYELA BY LEMOTE</strong>
      </footer>
      <i aria-hidden="true" />
    </div>
  );
}
