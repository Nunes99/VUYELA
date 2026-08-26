import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { EmailSignInForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Entrar no Portal de Negócio",
  description: "Aceda ao Portal de Negócio VUYELA com as credenciais da empresa.",
  robots: { index: false, follow: false }
};

interface BusinessSignInPageProps {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
}

function getBusinessNextPath(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/negocio") || value.startsWith("//")) {
    return "/negocio";
  }

  return value;
}

export default async function BusinessSignInPage({ searchParams }: BusinessSignInPageProps) {
  const params = await searchParams;
  const nextPath = getBusinessNextPath(params.next);

  return (
    <main className="auth-page auth-page--business">
      <section className="auth-shell auth-shell--compact" aria-labelledby="business-signin-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">Portal de Negócio</span>
          <h1 id="business-signin-title">Gira a operação com uma identidade empresarial.</h1>
          <p>Este acesso é exclusivo para proprietários e membros autorizados do negócio.</p>
        </div>
        <div className="auth-panel auth-panel--forms">
          <EmailSignInForm nextPath={nextPath} portal="business" />
          <p className="auth-footnote">
            Ainda não tem credenciais? <Link href="/cadastrar/negocio">Registar negócio</Link>. É
            cliente? <Link href="/entrar">Entrar como cliente</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
