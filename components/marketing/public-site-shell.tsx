import Link from "next/link";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";

export type PublicNavigationKey = "home" | "how" | "customers" | "business" | "pricing" | "help";

const publicNavigation: Array<{
  href: string;
  key: PublicNavigationKey;
  label: string;
}> = [
  { href: "/", key: "home", label: "Início" },
  { href: "/como-funciona", key: "how", label: "Como funciona" },
  { href: "/clientes", key: "customers", label: "Para clientes" },
  { href: "/negocios", key: "business", label: "Para negócios" },
  { href: "/precos", key: "pricing", label: "Preços" },
  { href: "/ajuda", key: "help", label: "Ajuda" }
];

interface PublicSiteShellProps {
  active: PublicNavigationKey;
  children: ReactNode;
}

export function PublicSiteShell({ active, children }: PublicSiteShellProps) {
  return (
    <div className="marketing-site">
      <PublicHeader active={active} />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

function PublicHeader({ active }: { active: PublicNavigationKey }) {
  return (
    <header className="marketing-header" aria-label="Navegação principal">
      <div className="marketing-container marketing-header__inner">
        <VuyelaLogo className="marketing-header__logo" inverse />

        <nav className="marketing-header__nav" aria-label="Páginas públicas">
          {publicNavigation.map((item) => (
            <Link
              aria-current={item.key === active ? "page" : undefined}
              href={item.href}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="marketing-header__actions">
          <Link className="marketing-button marketing-button--ghost" href="/entrar">
            Entrar
          </Link>
          <Link className="marketing-button marketing-button--teal" href="/cadastrar">
            Registar
          </Link>
        </div>

        <details className="marketing-menu">
          <summary aria-label="Abrir navegação">
            <Menu aria-hidden="true" size={20} />
          </summary>
          <nav aria-label="Navegação móvel">
            {publicNavigation.map((item) => (
              <Link
                aria-current={item.key === active ? "page" : undefined}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/entrar">Entrar</Link>
            <Link className="marketing-menu__register" href="/cadastrar">
              Registar
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-container marketing-footer__main">
        <div className="marketing-footer__brand">
          <VuyelaLogo inverse />
          <p>A plataforma de fidelização digital pensada para clientes e negócios em Moçambique.</p>
          <strong>Volte. Ganhe. Cresça.</strong>
        </div>

        <div className="marketing-footer__links">
          <nav aria-label="Soluções">
            <strong>Soluções</strong>
            <Link href="/clientes">Para clientes</Link>
            <Link href="/negocios">Para negócios</Link>
            <Link href="/pos">Integração POS</Link>
          </nav>
          <nav aria-label="Empresa">
            <strong>Empresa</strong>
            <Link href="/como-funciona">Como funciona</Link>
            <Link href="/precos">Preços</Link>
            <Link href="/estabelecimentos">Parceiros</Link>
          </nav>
          <nav aria-label="Recursos">
            <strong>Recursos</strong>
            <Link href="/ajuda">Ajuda e FAQ</Link>
            <Link href="/ofertas">Ofertas</Link>
            <Link href="/pesquisar">Pesquisar</Link>
          </nav>
        </div>
      </div>

      <div className="marketing-container marketing-footer__bottom">
        <small>© 2026 VUYELA by LEMOTE. Feito com orgulho em Moçambique.</small>
        <div>
          <Link href="/ajuda">Suporte</Link>
          <Link href="/entrar">Área reservada</Link>
        </div>
      </div>
    </footer>
  );
}
