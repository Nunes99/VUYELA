import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { EmailSignInForm, PhoneOtpForm } from "@/features/auth/forms";
import { isPhoneAuthEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta VUYELA com e-mail e palavra-passe.",
  alternates: {
    canonical: "/entrar"
  },
  robots: {
    index: false,
    follow: false
  }
};

interface SignInPageProps {
  searchParams: Promise<{
    erro?: string | string[] | undefined;
    next?: string | string[] | undefined;
  }>;
}

function getNextPath(next: string | string[] | undefined) {
  if (Array.isArray(next)) {
    return "/conta";
  }

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/conta";
  }

  return next;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath = getNextPath(params.next);
  const callbackError = params.erro === "link-invalido";
  const phoneAuthEnabled = isPhoneAuthEnabled();

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="signin-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">Acesso seguro</span>
          <h1 id="signin-title">Entre para ver os seus pontos e negócios.</h1>
          <p>
            Use o seu e-mail e palavra-passe. As regras de acesso continuam protegidas no servidor e
            no PostgreSQL.
          </p>
        </div>

        <div className="auth-panel auth-panel--forms">
          {callbackError ? (
            <p className="auth-message auth-message--error" role="alert">
              O link é inválido ou expirou. Solicite um novo link de recuperação.
            </p>
          ) : null}
          <div className="auth-form-group">
            <h2>E-mail e palavra-passe</h2>
            <EmailSignInForm nextPath={nextPath} />
          </div>
          {phoneAuthEnabled ? (
            <>
              <div className="auth-divider" role="separator">
                ou
              </div>
              <div className="auth-form-group">
                <h2>Telefone com código</h2>
                <PhoneOtpForm nextPath={nextPath} />
              </div>
            </>
          ) : null}
          <p className="auth-footnote">
            Ainda não tem conta? <Link href="/cadastrar">Criar conta</Link>. Esqueceu a
            palavra-passe? <Link href="/recuperar-acesso">Recuperar acesso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
