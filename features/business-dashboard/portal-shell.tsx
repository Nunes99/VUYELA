import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CreditCard,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PackageSearch,
  ScanLine,
  Settings,
  ShieldCheck,
  Store,
  UserPlus,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { ReactNode } from "react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { FlowBreadcrumbs } from "@/components/navigation/flow-navigation";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { signOutAction } from "@/features/auth/actions";
import { PwaInstallAction } from "@/features/pwa/pwa-install-action";
import type { AuthPrincipal } from "@/lib/auth/rbac";
import { getOwnProfileAvatarUrl } from "@/lib/profile-media";

export type BusinessPortalSection =
  | "dashboard"
  | "branches"
  | "team"
  | "catalog"
  | "campaigns"
  | "cards"
  | "customers"
  | "loyalty"
  | "analytics"
  | "subscription"
  | "referrals"
  | "pos"
  | "settings";

const navigation: Array<{
  id: BusinessPortalSection;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", href: "/negocio", label: "Visão geral", icon: LayoutDashboard },
  { id: "branches", href: "/negocio?vista=filiais", label: "Filiais", icon: BriefcaseBusiness },
  { id: "team", href: "/negocio?vista=equipa", label: "Equipa", icon: UsersRound },
  { id: "catalog", href: "/negocio?vista=catalogo", label: "Catálogo", icon: PackageSearch },
  { id: "campaigns", href: "/negocio/campanhas", label: "Campanhas", icon: Grid2X2 },
  { id: "cards", href: "/negocio?vista=cartoes", label: "Cartões", icon: WalletCards },
  { id: "customers", href: "/negocio?vista=clientes", label: "Clientes", icon: CreditCard },
  { id: "loyalty", href: "/negocio?vista=fidelizacao", label: "Fidelização", icon: MessageSquare },
  { id: "analytics", href: "/negocio?vista=analitica", label: "Analítica", icon: BarChart3 },
  { id: "subscription", href: "/negocio/subscricao", label: "Subscrição", icon: Store },
  { id: "referrals", href: "/negocio/indicacoes", label: "Indicações", icon: UserPlus },
  { id: "pos", href: "/negocio?vista=pos", label: "POS", icon: ScanLine },
  { id: "settings", href: "/negocio/definicoes", label: "Definições", icon: Settings }
];

const sectionLabels: Record<BusinessPortalSection, string> = Object.fromEntries(
  navigation.map((item) => [item.id, item.label])
) as Record<BusinessPortalSection, string>;

export async function BusinessPortalShell({
  principal,
  activeSection,
  title,
  subtitle,
  identityLabel = "Gestor VUYELA",
  businessId,
  children
}: {
  principal: AuthPrincipal;
  activeSection: BusinessPortalSection;
  title?: string;
  subtitle?: string;
  identityLabel?: string;
  businessId?: string;
  children: ReactNode;
}) {
  const dashboardHref = withBusinessContext("/negocio", businessId);
  const avatarUrl = await getOwnProfileAvatarUrl(principal.profileId);

  return (
    <div className="business-portal">
      <header className="business-portal__mobile-header">
        <VuyelaLogo className="business-portal__mobile-brand" href="/negocio" inverse />
        <details className="business-portal__mobile-menu">
          <summary aria-label="Abrir navegação do negócio" title="Menu do negócio">
            <Menu aria-hidden="true" size={22} />
          </summary>
          <div className="business-portal__mobile-menu-panel">
            <div className="business-portal__mobile-identity">
              <ProfileAvatar
                className="business-portal__avatar"
                displayName={identityLabel}
                src={avatarUrl}
              />
              <span>
                <strong>{identityLabel}</strong>
                <small>{businessRoleLabel(principal)}</small>
              </span>
            </div>
            <nav aria-label="Navegação móvel do negócio">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    aria-current={activeSection === item.id ? "page" : undefined}
                    className={activeSection === item.id ? "is-active" : undefined}
                    href={withBusinessContext(item.href, businessId)}
                    key={item.id}
                  >
                    <Icon aria-hidden="true" size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <PwaInstallAction area="negocio" />
            <form action={signOutAction}>
              <input type="hidden" name="returnTo" value="/negocio/entrar" />
              <button type="submit">
                <LogOut aria-hidden="true" size={18} />
                <span>Terminar sessão</span>
              </button>
            </form>
          </div>
        </details>
      </header>
      <aside className="business-portal__sidebar">
        <div className="business-portal__sidebar-main">
          <VuyelaLogo className="business-portal__brand" href="/negocio" inverse />
          <nav aria-label="Navegação do negócio" className="business-portal__nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  aria-current={activeSection === item.id ? "page" : undefined}
                  className={activeSection === item.id ? "is-active" : undefined}
                  href={withBusinessContext(item.href, businessId)}
                  key={item.id}
                >
                  <span className="business-portal__active-bar" aria-hidden="true" />
                  <Icon aria-hidden="true" size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="business-portal__sidebar-footer">
          <PwaInstallAction area="negocio" />
          <form action={signOutAction}>
            <input type="hidden" name="returnTo" value="/negocio/entrar" />
            <button type="submit">
              <LogOut aria-hidden="true" size={18} />
              <span>Terminar sessão</span>
            </button>
          </form>
          <div>
            <ShieldCheck aria-hidden="true" size={15} />
            <span>
              <strong>Área protegida</strong>
              <small>Encriptação de nível bancário</small>
            </span>
          </div>
        </div>
      </aside>

      <section className="business-portal__workspace">
        <header className="business-portal__topbar">
          <div>
            {activeSection === "dashboard" ? null : (
              <FlowBreadcrumbs
                className="business-portal__breadcrumbs"
                items={[
                  { label: "Painel", href: dashboardHref },
                  { label: sectionLabels[activeSection] }
                ]}
              />
            )}
            <span>
              <h1>{title ?? "Painel do Negócio"}</h1>
              <small>MFA ativo</small>
            </span>
            <p>{subtitle ?? "Controlo e auditoria operacional de negócio parceiro"}</p>
          </div>
          <div className="business-portal__identity">
            <ProfileAvatar
              className="business-portal__avatar"
              displayName={identityLabel}
              src={avatarUrl}
            />
            <span>
              <strong>{identityLabel}</strong>
              <small>{businessRoleLabel(principal)}</small>
            </span>
          </div>
        </header>
        <div className="business-portal__content">{children}</div>
      </section>
    </div>
  );
}

function withBusinessContext(href: string, businessId?: string): string {
  if (!businessId) {
    return href;
  }

  return `${href}${href.includes("?") ? "&" : "?"}businessId=${encodeURIComponent(businessId)}`;
}

function businessRoleLabel(principal: AuthPrincipal): string {
  const role = principal.businessMemberships.find(
    (membership) => membership.status === "active"
  )?.role;
  const labels = {
    cashier: "Operador de caixa",
    branch_manager: "Gestor de filial",
    business_admin: "Administrador do negócio",
    business_owner: "Proprietário"
  } as const;

  return role ? labels[role] : "Gestão do negócio";
}
