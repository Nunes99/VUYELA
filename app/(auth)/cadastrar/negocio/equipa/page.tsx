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
  searchParams: Promise<{
    token?: string | string[] | undefined;
    destination?: string | string[] | undefined;
  }>;
}

export default async function BusinessTeamSignUpPage({
  searchParams
}: BusinessTeamSignUpPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const destination = params.destination === "pos" ? "pos" : "business";
  const validTokenFormat = /^[0-9a-f]{48}$/.test(token);

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--compact" aria-labelledby="team-signup-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">
            {destination === "pos" ? "Convite de operador POS" : "Convite de equipa"}
          </span>
          <h1 id="team-signup-title">
            {destination === "pos"
              ? "Credenciais próprias para operar o POS."
              : "Credenciais próprias para trabalhar no negócio."}
          </h1>
          <p>
            Este acesso mantém a sua identidade de cliente separada e respeita a função e a filial
            atribuídas pelo administrador.
          </p>
        </div>
        <div className="auth-panel auth-panel--forms">
          {validTokenFormat ? (
            <BusinessTeamSignUpForm destination={destination} token={token} />
          ) : (
            <p className="auth-message auth-message--error" role="alert">
              O convite é inválido ou está incompleto. Peça uma nova ligação ao administrador do
              negócio.
            </p>
          )}
          <p className="auth-footnote">
            Já tem credenciais?{" "}
            <Link href={destination === "pos" ? "/pos/entrar" : "/negocio/entrar"}>
              {destination === "pos" ? "Entrar no POS" : "Entrar no portal"}
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
