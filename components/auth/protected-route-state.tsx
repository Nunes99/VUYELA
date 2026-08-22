import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  LayoutGrid,
  LogOut,
  ScanLine,
  ShieldCheck,
  UserRound
} from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import { canAccessRoute } from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";
import type { ProtectedRouteState } from "@/lib/auth/session";

interface ProtectedRouteStateViewProps {
  state: ProtectedRouteState;
  title: string;
  children: ReactNode;
  variant?: "default" | "customer";
  customerName?: string | undefined;
}

function AuthNotice({
  eyebrow,
  title,
  body,
  actionHref,
  actionLabel
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionHref?: string | undefined;
  actionLabel?: string | undefined;
}) {
  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--single" aria-labelledby="protected-title">
        <div className="auth-panel auth-panel--forms">
          <VuyelaLogo className="auth-brand auth-brand--dark" />
          <span className="auth-kicker">{eyebrow}</span>
          <h1 id="protected-title">{title}</h1>
          <p className="auth-intro">{body}</p>
          {actionHref && actionLabel ? (
            <Link className="home-link-button home-link-button--primary" href={actionHref}>
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function ProtectedRouteStateView({
  state,
  title,
  children,
  variant = "default",
  customerName
}: ProtectedRouteStateViewProps) {
  if (state.status === "authorized") {
    const isCustomer = variant === "customer";
    const pageClassName = [
      "dashboard-page",
      isCustomer ? "dashboard-page--customer" : "dashboard-page--default"
    ].join(" ");

    return (
      <main className={pageClassName}>
        <section className="dashboard-shell" aria-labelledby="dashboard-title">
          <header className="dashboard-shell__header">
            <VuyelaLogo inverse={isCustomer} />
            <div className="dashboard-shell__title">
              {!isCustomer ? <span className="auth-kicker">Área protegida</span> : null}
              <h1 id="dashboard-title">{title}</h1>
            </div>
            {isCustomer ? (
              <a
                aria-label="Ver notificações"
                className="customer-shell-alert"
                href="#notificacoes"
              >
                <Bell aria-hidden="true" size={22} />
                <span aria-hidden="true" />
              </a>
            ) : null}
            <DashboardAreaMenu
              customerName={customerName}
              principal={state.principal}
              variant={variant}
            />
            {!isCustomer ? (
              <form action={signOutAction}>
                <button className="dashboard-signout" type="submit">
                  <LogOut aria-hidden="true" size={18} />
                  <span>Terminar sessão</span>
                </button>
              </form>
            ) : null}
          </header>
          {children}
        </section>
      </main>
    );
  }

  if (state.status === "auth_not_configured") {
    return (
      <AuthNotice
        eyebrow="Configurar Supabase"
        title="Autenticação ainda não está ligada."
        body="Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para testar esta área protegida com sessões reais."
      />
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <AuthNotice
        eyebrow="Login necessário"
        title="Entre para continuar."
        body="Esta área usa helpers server-side e RBAC centralizado antes de renderizar dados privados."
        actionHref={state.signInPath}
        actionLabel="Entrar"
      />
    );
  }

  if (state.status === "mfa_required") {
    return (
      <AuthNotice
        eyebrow="MFA necessário"
        title="Verificação adicional obrigatória."
        body="Funções privilegiadas precisam de MFA antes de acessar rotas sensiveis."
        actionHref={state.mfaPath}
        actionLabel="Verificar"
      />
    );
  }

  return (
    <AuthNotice
      eyebrow="Sem permissão"
      title="Esta conta não tem acesso a esta área."
      body="As permissões são avaliadas no servidor por perfil, membro ativo, negócio e filial."
      actionHref="/cliente"
      actionLabel="Ir para cliente"
    />
  );
}

function DashboardAreaMenu({
  principal,
  variant,
  customerName
}: {
  principal: AuthPrincipal;
  variant: "default" | "customer";
  customerName?: string | undefined;
}) {
  const areas = [
    { href: "/cliente", label: "Cliente", icon: UserRound, visible: true },
    {
      href: "/negocio",
      label: "Negócio",
      icon: BriefcaseBusiness,
      visible: canAccessRoute(principal, "/negocio")
    },
    {
      href: "/pos",
      label: "POS",
      icon: ScanLine,
      visible: canAccessRoute(principal, "/pos")
    },
    {
      href: "/admin",
      label: "Administração",
      icon: ShieldCheck,
      visible: canAccessRoute(principal, "/admin")
    }
  ].filter((area) => area.visible);

  return (
    <details
      className={`dashboard-area-menu${variant === "customer" ? " dashboard-area-menu--customer" : ""}`}
    >
      <summary title="Mudar de área">
        {variant === "customer" ? (
          <>
            <span className="dashboard-area-menu__avatar" aria-hidden="true">
              {initials(customerName)}
            </span>
            <span className="dashboard-area-menu__identity">
              <strong>{customerName || "Cliente VUYELA"}</strong>
              <small>Cliente</small>
            </span>
            <ChevronDown aria-hidden="true" size={17} />
          </>
        ) : (
          <>
            <LayoutGrid aria-hidden="true" size={18} />
            <span>Áreas</span>
          </>
        )}
      </summary>
      <nav aria-label="Mudar de área">
        {areas.map((area) => {
          const Icon = area.icon;

          return (
            <Link href={area.href} key={area.href}>
              <Icon aria-hidden="true" size={18} />
              <span>{area.label}</span>
            </Link>
          );
        })}
        {variant === "customer" ? (
          <form action={signOutAction}>
            <button type="submit">
              <LogOut aria-hidden="true" size={18} />
              <span>Terminar sessão</span>
            </button>
          </form>
        ) : null}
      </nav>
    </details>
  );
}

function initials(name: string | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (parts.length === 0) {
    return "CV";
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}
