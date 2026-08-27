import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { redirect } from "next/navigation";

import { MfaForm } from "@/features/auth/mfa-form";
import { getSafeMfaNextPath } from "@/features/auth/mfa";
import { getDefaultAuthenticatedPath, requiresMfa } from "@/lib/auth/rbac";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Verificação adicional",
  description: "Verificação multifator para funções privilegiadas VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

interface MfaPageProps {
  searchParams: Promise<{
    next?: string | string[] | undefined;
  }>;
}

export const dynamic = "force-dynamic";

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const [params, authContext] = await Promise.all([searchParams, getAuthContext()]);
  const nextPath = getSafeMfaNextPath(params.next);
  const signInPath = nextPath.startsWith("/admin") ? "/admin/entrar" : "/entrar";

  if (!authContext.principal) {
    redirect(`${signInPath}?next=${encodeURIComponent(nextPath)}`);
  }

  if (!requiresMfa(authContext.principal.profileRole)) {
    redirect(getDefaultAuthenticatedPath(authContext.principal));
  }

  if (authContext.principal.mfaVerified) {
    redirect(nextPath);
  }

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--single" aria-labelledby="mfa-title">
        <div className="auth-panel auth-panel--forms">
          <VuyelaLogo className="auth-brand auth-brand--dark" href="/admin" />
          <span className="auth-kicker">Verificação em dois passos</span>
          <h1 id="mfa-title">Verificação adicional necessária.</h1>
          <p className="auth-intro">
            Funções de suporte e administração exigem um código temporário além da sua
            palavra-passe.
          </p>
          <MfaForm nextPath={nextPath} signInPath={signInPath} />
          <p className="auth-footnote">
            Não consegue concluir? <Link href={signInPath}>Voltar ao login</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
