import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  LayoutGrid,
  LogOut,
  ScanLine,
  Settings,
  ShieldCheck,
  UserRound
} from "lucide-react";

import { AuthStandalone } from "@/components/auth/auth-standalone";
import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { signOutAction } from "@/features/auth/actions";
import { PwaInstallAction } from "@/features/pwa/pwa-install-action";
import type { PwaArea } from "@/features/pwa/apps";
import { posAppRoutes } from "@/features/pos/routes";
import { canAccessRoute } from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";
import type { ProtectedRouteState } from "@/lib/auth/session";

interface ProtectedRouteStateViewProps {
  state: ProtectedRouteState;
  title: string;
  children: ReactNode;
  variant?: "default" | "customer" | "admin" | "business" | "pos";
  customerName?: string | undefined;
  customerAvatarUrl?: string | null | undefined;
}

function AuthNotice({
  eyebrow,
  title,
  body,
  actionHref,
  actionLabel,
  installArea,
  allowAccountSwitch = false,
  variant = "customer"
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionHref?: string | undefined;
  actionLabel?: string | undefined;
  installArea?: PwaArea | undefined;
  allowAccountSwitch?: boolean;
  variant?: "customer" | "business" | "pos" | "admin";
}) {
  return (
    <AuthStandalone
      description={body}
      eyebrow={eyebrow}
      id="protected-title"
      title={title}
      variant={variant}
    >
      <div className="auth-notice__actions">
        {actionHref && actionLabel ? (
          <Link className="home-link-button home-link-button--primary" href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
        {allowAccountSwitch && installArea ? (
          <form action={signOutAction} className="auth-account-switch">
            <input type="hidden" name="returnTo" value={`/${installArea}/entrar`} />
            <button className="home-link-button home-link-button--primary" type="submit">
              Entrar com outra conta
            </button>
          </form>
        ) : null}
        {installArea ? <PwaInstallAction area={installArea} /> : null}
      </div>
    </AuthStandalone>
  );
}

export function ProtectedRouteStateView({
  state,
  title,
  children,
  variant = "default",
  customerName,
  customerAvatarUrl
}: ProtectedRouteStateViewProps) {
  const installArea =
    variant === "customer"
      ? "cliente"
      : variant === "admin"
        ? "admin"
        : variant === "business" || variant === "pos"
          ? variant === "pos"
            ? "pos"
            : "negocio"
          : undefined;

  if (state.status === "authorized") {
    if (variant === "admin" || variant === "business" || variant === "pos") {
      const className =
        variant === "admin"
          ? "admin-page"
          : variant === "business"
            ? "business-portal-page"
            : "pos-portal-page";

      return <main className={className}>{children}</main>;
    }

    const isCustomer = variant === "customer";
    const pageClassName = [
      "dashboard-page",
      isCustomer ? "dashboard-page--customer" : "dashboard-page--default"
    ].join(" ");

    return (
      <main className={pageClassName}>
        <section className="dashboard-shell" aria-labelledby="dashboard-title">
          <header className="dashboard-shell__header">
            <VuyelaLogo href={isCustomer ? "/cliente" : "/"} inverse={isCustomer} />
            <div className="dashboard-shell__title">
              {!isCustomer ? <span className="auth-kicker">Área protegida</span> : null}
              <h1 id="dashboard-title">{title}</h1>
            </div>
            {isCustomer ? (
              <Link
                aria-label="Ver notificações"
                className="customer-shell-alert"
                href="/cliente?vista=notificacoes"
              >
                <Bell aria-hidden="true" size={22} />
                <span aria-hidden="true" />
              </Link>
            ) : null}
            <DashboardAreaMenu
              customerAvatarUrl={customerAvatarUrl}
              customerName={customerName}
              principal={state.principal}
              variant={variant}
            />
            {!isCustomer ? (
              <form action={signOutAction}>
                <input type="hidden" name="returnTo" value="/negocio/entrar" />
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
    const isAdmin = variant === "admin";

    return (
      <AuthNotice
        eyebrow={isAdmin ? "Configuração necessária" : "Serviço indisponível"}
        title="Não foi possível iniciar o acesso."
        body={
          isAdmin
            ? "Confirme a configuração de autenticação do ambiente antes de continuar."
            : "Tente novamente dentro de alguns minutos. Se o problema continuar, contacte o suporte VUYELA."
        }
        installArea={installArea}
        variant={normalizeAuthVariant(variant)}
      />
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <AuthNotice
        eyebrow="Login necessário"
        title="Entre para continuar."
        body="Inicie sessão com a conta correspondente a esta aplicação."
        actionHref={state.signInPath}
        actionLabel="Entrar"
        installArea={installArea}
        variant={normalizeAuthVariant(variant)}
      />
    );
  }

  if (state.status === "mfa_required") {
    return (
      <AuthNotice
        eyebrow="MFA necessário"
        title="Verificação adicional obrigatória."
        body="As operações sensíveis exigem verificação multifator antes de continuar."
        actionHref={state.mfaPath}
        actionLabel="Verificar"
        installArea={installArea}
        variant={normalizeAuthVariant(variant)}
      />
    );
  }

  return (
    <AuthNotice
      eyebrow="Sem permissão"
      title="Esta conta não tem acesso a esta área."
      body="Termine esta sessão e entre com as credenciais próprias desta aplicação. Nenhuma área será aberta automaticamente."
      installArea={installArea}
      allowAccountSwitch
      variant={normalizeAuthVariant(variant)}
    />
  );
}

function normalizeAuthVariant(
  variant: ProtectedRouteStateViewProps["variant"]
): "customer" | "business" | "pos" | "admin" {
  return variant === "business" || variant === "pos" || variant === "admin" ? variant : "customer";
}

export function DashboardAreaMenu({
  principal,
  variant,
  customerName,
  customerAvatarUrl,
  includePosSettings = false
}: {
  principal: AuthPrincipal;
  variant: "default" | "customer";
  customerName?: string | undefined;
  customerAvatarUrl?: string | null | undefined;
  includePosSettings?: boolean;
}) {
  const areas = [
    {
      href: "/cliente",
      label: "Cliente",
      icon: UserRound,
      visible: principal.accountType === "customer"
    },
    {
      href: "/negocio",
      label: "Negócio",
      icon: BriefcaseBusiness,
      visible: principal.accountType === "business" && canAccessRoute(principal, "/negocio")
    },
    {
      href: posAppRoutes.root,
      label: "POS",
      icon: ScanLine,
      visible: principal.accountType === "business" && canAccessRoute(principal, "/pos")
    },
    {
      href: posAppRoutes.settings,
      label: "Definições do POS",
      icon: Settings,
      visible:
        includePosSettings &&
        canAccessRoute(principal, "/pos") &&
        canAccessRoute(principal, "/negocio")
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
            <ProfileAvatar
              className="dashboard-area-menu__avatar"
              displayName={customerName || "Cliente VUYELA"}
              src={customerAvatarUrl}
            />
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
            <input type="hidden" name="returnTo" value="/cliente/entrar" />
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
