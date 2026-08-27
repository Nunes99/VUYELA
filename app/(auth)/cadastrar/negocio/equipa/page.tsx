import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { BusinessTeamSignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Criar acesso de equipa",
  description: "Crie credenciais empresariais para aceitar um convite de equipa VUYELA.",
  robots: { index: false, follow: false }
};

interface BusinessTeamSignUpPageProps {
  searchParams: Promise<{ token?: string | string[] | undefined }>;
}

export default async function BusinessTeamSignUpPage({
  searchParams
}: BusinessTeamSignUpPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const validTokenFormat = /^[0-9a-f]{48}$/.test(token);

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--compact" aria-labelledby="team-signup-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">Convite de equipa</span>
          <h1 id="team-signup-title">Credenciais próprias para trabalhar no negócio.</h1>
          <p>
            Este acesso pertence ao Portal de Negócio e mantém a sua identidade de cliente
            completamente separada.
          </p>
        </div>
        <div className="auth-panel auth-panel--forms">
          {validTokenFormat ? (
            <BusinessTeamSignUpForm token={token} />
          ) : (
            <p className="auth-message auth-message--error" role="alert">
              O convite é inválido ou está incompleto. Peça uma nova ligação ao administrador do
              negócio.
            </p>
          )}
          <p className="auth-footnote">
            Já tem credenciais empresariais? <Link href="/negocio/entrar">Entrar no portal</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
