"use client";

import Link from "next/link";
import {
  CreditCard,
  Gift,
  ListFilter,
  LogOut,
  Menu,
  MonitorCog,
  Settings,
  Store,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import { posAppRoutes } from "@/features/pos/routes";

interface PosNavigationDrawerProps {
  activeArea: "catalog" | "settings";
  branchName: string;
  businessName: string;
  canManageBusiness: boolean;
  roleLabel: string;
}

const posNavigation = [
  { id: "catalog", href: posAppRoutes.root, label: "Catálogo de Serviços", icon: ListFilter },
  { id: "settings", href: posAppRoutes.settings, label: "Terminal POS", icon: MonitorCog }
] as const;

const businessNavigation = [
  { href: "/negocio?vista=clientes", label: "Clientes", icon: UsersRound },
  { href: "/negocio?vista=fidelizacao", label: "Fidelização", icon: Gift },
  { href: "/negocio/subscricao", label: "Subscrição", icon: CreditCard },
  { href: "/negocio/indicacoes", label: "Indicações", icon: UserPlus },
  { href: "/negocio/definicoes", label: "Configurações", icon: Settings }
] as const;

export function PosNavigationDrawer({
  activeArea,
  branchName,
  businessName,
  canManageBusiness,
  roleLabel
}: PosNavigationDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="Abrir menu do POS"
        className="pos-portal__menu-button"
        onClick={() => setOpen(true)}
        title="Menu do POS"
        type="button"
      >
        <Menu aria-hidden="true" size={19} />
        <span>Menu</span>
      </button>

      {open
        ? createPortal(
            <div className="pos-drawer" role="presentation">
              <button
                aria-label="Fechar menu do POS"
                className="pos-drawer__backdrop"
                onClick={() => setOpen(false)}
                type="button"
              />
              <aside
                aria-label="Menu do POS"
                aria-modal="true"
                className="pos-drawer__panel"
                role="dialog"
              >
                <header className="pos-drawer__header">
                  <VuyelaLogo className="pos-drawer__brand" href={posAppRoutes.root} />
                  <button aria-label="Fechar menu" onClick={() => setOpen(false)} type="button">
                    <X aria-hidden="true" size={20} />
                  </button>
                </header>

                <div className="pos-drawer__scope">
                  <span aria-hidden="true">{initials(businessName)}</span>
                  <div>
                    <strong>{businessName}</strong>
                    <small>
                      {branchName} · {roleLabel}
                    </small>
                  </div>
                </div>

                <nav aria-label="Navegação principal do POS" className="pos-drawer__navigation">
                  {posNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeArea;
                    return (
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={isActive ? "is-active" : undefined}
                        href={item.href}
                        key={`${item.href}-${item.label}`}
                        onClick={() => setOpen(false)}
                      >
                        <Icon aria-hidden="true" size={19} />
                        <span>{item.label}</span>
                        {isActive ? <i aria-hidden="true" /> : null}
                      </Link>
                    );
                  })}

                  {canManageBusiness
                    ? businessNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
                            <Icon aria-hidden="true" size={19} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })
                    : null}
                </nav>

                <footer className="pos-drawer__footer">
                  <form action={signOutAction}>
                    <input name="returnTo" type="hidden" value={posAppRoutes.signIn} />
                    <button type="submit">
                      <LogOut aria-hidden="true" size={19} />
                      <span>Sair</span>
                    </button>
                  </form>
                  <div>
                    <Store aria-hidden="true" size={15} />
                    <span>Vuyela POS</span>
                    <small>v1.0.0</small>
                  </div>
                </footer>
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
