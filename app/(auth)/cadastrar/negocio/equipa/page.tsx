import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
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
  const isPosInvite = destination === "pos";

  return (
    <AuthShell
      compact
      description={
        isPosInvite
          ? "Crie as credenciais individuais associadas à filial e função definidas no convite."
          : "Crie um acesso de equipa separado de qualquer conta de cliente."
      }
      eyebrow={isPosInvite ? "Convite de operador POS" : "Convite de equipa"}
      formDescription="Confirme os seus dados para aceitar o convite."
      formTitle="Criar credenciais"
      id="team-signup-title"
      title={isPosInvite ? "Prepare o seu acesso ao POS." : "Junte-se à equipa do negócio."}
      variant={isPosInvite ? "pos" : "business"}
    >
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
    </AuthShell>
  );
}
