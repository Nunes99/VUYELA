import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { PasswordResetForm } from "@/features/auth/forms";
import { getPortalLoginPath, getPortalNextPath, parseAuthPortal } from "@/features/auth/portal";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  description: "Receba instruções para recuperar o acesso a sua conta VUYELA.",
  alternates: {
    canonical: "/recuperar-acesso"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default async function PasswordResetPage({
  searchParams
}: {
  searchParams: Promise<{
    next?: string | string[] | undefined;
    portal?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const portal = parseAuthPortal(params.portal);
  const nextPath = getPortalNextPath(portal, params.next);

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--single" aria-labelledby="reset-title">
        <div className="auth-panel auth-panel--forms">
          <VuyelaLogo className="auth-brand auth-brand--dark" href="/" />
          <span className="auth-kicker">Recuperação</span>
          <h1 id="reset-title">Recupere o acesso com seguranca.</h1>
          <p className="auth-intro">
            Indique o e-mail da conta para receber as instruções de recuperação.
          </p>
          <PasswordResetForm nextPath={nextPath} portal={portal} />
          <p className="auth-footnote">
            Lembrou a palavra-passe? <Link href={getPortalLoginPath(portal)}>Voltar ao login</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
