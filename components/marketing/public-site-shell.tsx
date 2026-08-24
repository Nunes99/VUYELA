import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  CircleUserRound,
  FileText,
  Home,
  Info,
  Menu,
  Tag,
  X
} from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";

export type PublicNavigationKey = "home" | "how" | "customers" | "business" | "pricing" | "help";

const publicNavigation: Array<{
  href: string;
  icon: typeof Home;
  key: PublicNavigationKey;
  label: string;
}> = [
  { href: "/", icon: Home, key: "home", label: "Início" },
  { href: "/como-funciona", icon: Info, key: "how", label: "Como funciona" },
  { href: "/clientes", icon: CircleUserRound, key: "customers", label: "Para clientes" },
  { href: "/negocios", icon: BriefcaseBusiness, key: "business", label: "Para negócios" },
  { href: "/precos", icon: Tag, key: "pricing", label: "Preços" },
  { href: "/ajuda", icon: FileText, key: "help", label: "Ajuda" }
];

interface PublicSiteShellProps {
  active: PublicNavigationKey;
  children: ReactNode;
}

export function PublicSiteShell({ active, children }: PublicSiteShellProps) {
  return (
    <div className={`marketing-site marketing-site--${active}`}>
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
            <Menu className="marketing-menu__open" aria-hidden="true" size={18} />
            <X className="marketing-menu__close" aria-hidden="true" size={18} />
          </summary>
          <nav aria-label="Navegação móvel">
            <VuyelaLogo className="marketing-menu__logo" inverse />
            {publicNavigation.map((item) => (
              <Link
                aria-current={item.key === active ? "page" : undefined}
                href={item.href}
                key={item.key}
              >
                <item.icon aria-hidden="true" size={18} />
                {item.label}
              </Link>
            ))}
            <div className="marketing-menu__actions">
              <Link className="marketing-menu__register" href="/cadastrar">
                Registar
              </Link>
              <Link className="marketing-menu__login" href="/entrar">
                Entrar
              </Link>
            </div>
            <div className="marketing-menu__social" aria-label="Redes sociais VUYELA">
              <Image alt="" aria-hidden="true" height={18} src="/brand/facebook.svg" width={18} />
              <Image alt="" aria-hidden="true" height={18} src="/brand/instagram.svg" width={18} />
              <Image alt="" aria-hidden="true" height={18} src="/brand/linkedin.svg" width={18} />
            </div>
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
          <p>
            A primeira plataforma de fidelização 100% digital pensada para impulsionar negócios em
            Moçambique.
          </p>
          <strong>Volta. Ganha. Cresce.</strong>
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
            <Link href="/">Sobre nós</Link>
            <Link href="/como-funciona">Como funciona</Link>
            <Link href="/precos">Preços</Link>
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
        <small>© 2026 VUYELA. Todos os direitos reservados. Feito com orgulho em Moçambique.</small>
        <div className="marketing-footer__social" aria-label="Redes sociais VUYELA">
          <Image alt="" aria-hidden="true" height={18} src="/brand/facebook.svg" width={18} />
          <Image alt="" aria-hidden="true" height={18} src="/brand/instagram.svg" width={18} />
          <Image alt="" aria-hidden="true" height={18} src="/brand/linkedin.svg" width={18} />
        </div>
      </div>
    </footer>
  );
}
