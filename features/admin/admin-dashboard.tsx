import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileClock,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import { hasAdminCapability } from "@/lib/auth/admin-permissions";
import type { AdminCapability } from "@/lib/auth/admin-permissions";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import { AdminViewContent } from "./admin-views";
import type { AdminDashboardState, AdminView } from "./model";

const adminNavigation: Array<{
  view: AdminView;
  label: string;
  icon: typeof LayoutDashboard;
  capability: AdminCapability;
}> = [
  {
    view: "overview",
    label: "Visão Geral",
    icon: LayoutDashboard,
    capability: "platform_metrics_read"
  },
  { view: "businesses", label: "Negócios", icon: Building2, capability: "businesses_read" },
  { view: "categories", label: "Categorias", icon: Grid2X2, capability: "categories_manage" },
  { view: "users", label: "Utilizadores", icon: Users, capability: "users_read" },
  {
    view: "subscriptions",
    label: "Subscrições",
    icon: CreditCard,
    capability: "subscriptions_read"
  },
  { view: "support", label: "Suporte", icon: MessageSquare, capability: "support_manage" },
  { view: "fraud", label: "Fraude", icon: AlertTriangle, capability: "fraud_review" },
  { view: "audit", label: "Auditoria", icon: FileClock, capability: "audit_read" },
  {
    view: "analytics",
    label: "Analítica",
    icon: BarChart3,
    capability: "platform_metrics_read"
  },
  { view: "settings", label: "Configurações", icon: Settings, capability: "users_manage" }
];

export function AdminDashboard({
  state,
  principal
}: {
  state: AdminDashboardState;
  principal: AuthPrincipal;
}) {
  const activeView = parentView(state.view);
  const viewer =
    state.status === "ready"
      ? state.viewer
      : { displayName: "Admin VUYELA", email: profileRoleLabel(principal.profileRole) };

  return (
    <div className="admin-console">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <VuyelaLogo className="admin-sidebar__logo" href="/" inverse />
          <nav aria-label="Administração da plataforma" className="admin-sidebar__nav">
            {adminNavigation
              .filter((item) => hasAdminCapability(principal.profileRole, item.capability))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    aria-current={activeView === item.view ? "page" : undefined}
                    className={activeView === item.view ? "is-active" : undefined}
                    href={`/admin?view=${item.view}`}
                    key={item.view}
                  >
                    <span className="admin-sidebar__indicator" />
                    <Icon aria-hidden="true" size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="admin-sidebar__footer">
          <form action={signOutAction}>
            <button type="submit">
              <span className="admin-sidebar__indicator" />
              <LogOut aria-hidden="true" size={18} />
              <span>Terminar sessão</span>
            </button>
          </form>
          <div className="admin-sidebar__security">
            <ShieldCheck aria-hidden="true" size={16} />
            <span>
              <strong>Área protegida</strong>
              <small>Encriptação de nível bancário</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="admin-console__main">
        <header className="admin-console__bar">
          <div className="admin-console__title">
            <div>
              <h1>{viewTitle(state.view)}</h1>
              <span className="admin-mfa-badge">MFA ativo</span>
            </div>
            <p>{viewSubtitle(state.view)}</p>
          </div>
          <div className="admin-console__identity">
            <Link
              aria-label="Abrir fila de suporte"
              className="admin-console__bell"
              href="/admin?view=support"
            >
              <Bell aria-hidden="true" size={21} />
              <span aria-hidden="true" />
            </Link>
            <span className="admin-console__avatar" aria-hidden="true">
              {initials(viewer.displayName)}
            </span>
            <span className="admin-console__user">
              <strong>{viewer.displayName}</strong>
              <small>{profileRoleLabel(principal.profileRole)}</small>
            </span>
          </div>
        </header>

        <div className="admin-console__content">
          {state.status === "denied" || state.status === "error" ? (
            <section className="admin-console__notice" role="alert">
              <h2>{state.status === "denied" ? "Acesso limitado" : "Dados indisponíveis"}</h2>
              <p>{state.message}</p>
            </section>
          ) : (
            <AdminViewContent principal={principal} state={state} />
          )}
        </div>
      </div>
    </div>
  );
}

function parentView(view: AdminView): AdminView {
  if (view === "business-detail") {
    return "businesses";
  }
  if (view === "user-detail") {
    return "users";
  }
  return view;
}

function viewTitle(view: AdminView): string {
  const titles: Record<AdminView, string> = {
    overview: "Painel de Controlo - Visão Geral",
    businesses: "Gerir Estabelecimentos & Negócios",
    categories: "Gerir Categorias de Negócio",
    users: "Controlo de Acesso & Utilizadores",
    subscriptions: "Configuração de Planos de Subscrição",
    support: "Fila operacional - Suporte",
    fraud: "Revisão de risco - Fraude",
    audit: "Histórico imutável - Auditoria",
    analytics: "Painel de Desempenho Global",
    settings: "Painel Administrativo do Sistema",
    "business-detail": "Ficha do Estabelecimento",
    "user-detail": "Gestão de Identidade"
  };
  return titles[view];
}

function viewSubtitle(view: AdminView): string {
  const subtitles: Record<AdminView, string> = {
    overview: "Administração Geral VUYELA Moçambique",
    businesses: "Administração Geral VUYELA Moçambique",
    categories: "Administração Geral VUYELA Moçambique",
    users: "Administração Geral VUYELA Moçambique",
    subscriptions: "Administração Geral VUYELA Moçambique",
    support: "Gestão de incidentes e apoio a estabelecimentos VUYELA",
    fraud: "Auditoria preventiva e deteção de anomalias no sistema de pontos",
    audit: "Registos de segurança e alterações de estado do diretório VUYELA",
    analytics: "Analítica agregada de atividade, volume de transações e emissão de pontos",
    settings: "Configuração e calibração de políticas globais da plataforma",
    "business-detail": "Controlo e auditoria operacional de negócio parceiro",
    "user-detail": "Visualização detalhada de dados cadastrais e acessos do utilizador"
  };
  return subtitles[view];
}

function profileRoleLabel(role: AuthPrincipal["profileRole"]): string {
  const labels: Record<AuthPrincipal["profileRole"], string> = {
    customer: "Cliente",
    support_agent: "Agente de suporte",
    platform_admin: "Administrador",
    super_admin: "Super Administrador"
  };
  return labels[role];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "A"}${parts[1]?.[0] ?? "V"}`.toUpperCase();
}
