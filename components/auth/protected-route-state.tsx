import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import type { ProtectedRouteState } from "@/lib/auth/session";

interface ProtectedRouteStateViewProps {
  state: ProtectedRouteState;
  title: string;
  children: ReactNode;
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

export function ProtectedRouteStateView({ state, title, children }: ProtectedRouteStateViewProps) {
  if (state.status === "authorized") {
    return (
      <main className="dashboard-page">
        <section className="dashboard-shell" aria-labelledby="dashboard-title">
          <header className="dashboard-shell__header">
            <VuyelaLogo />
            <div className="dashboard-shell__title">
              <span className="auth-kicker">Area protegida</span>
              <h1 id="dashboard-title">{title}</h1>
            </div>
            <form action={signOutAction}>
              <button className="dashboard-signout" type="submit">
                <LogOut aria-hidden="true" size={18} />
                <span>Terminar sessao</span>
              </button>
            </form>
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
        title="Autenticacao ainda nao esta ligada."
        body="Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para testar esta area protegida com sessoes reais."
      />
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <AuthNotice
        eyebrow="Login necessario"
        title="Entre para continuar."
        body="Esta area usa helpers server-side e RBAC centralizado antes de renderizar dados privados."
        actionHref={state.signInPath}
        actionLabel="Entrar"
      />
    );
  }

  if (state.status === "mfa_required") {
    return (
      <AuthNotice
        eyebrow="MFA necessario"
        title="Verificacao adicional obrigatoria."
        body="Funcoes privilegiadas precisam de MFA antes de acessar rotas sensiveis."
        actionHref={state.mfaPath}
        actionLabel="Verificar"
      />
    );
  }

  return (
    <AuthNotice
      eyebrow="Sem permissao"
      title="Esta conta nao tem acesso a esta area."
      body="As permissoes sao avaliadas no servidor por perfil, membro ativo, negocio e filial."
      actionHref="/cliente"
      actionLabel="Ir para cliente"
    />
  );
}
