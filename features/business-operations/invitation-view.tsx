import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import { acceptBusinessInvitationAction } from "./actions";

type InvitationDestination = "business" | "pos";

export function BusinessInvitationView({
  destination,
  invalid,
  principal,
  token
}: {
  destination: InvitationDestination;
  invalid: boolean;
  principal: AuthPrincipal | null;
  token: string;
}) {
  const isPosInvitation = destination === "pos";
  const rootPath = isPosInvitation ? "/pos" : "/negocio";
  const signInPath = `${rootPath}/entrar?next=${encodeURIComponent(
    `${rootPath}/convite?token=${encodeURIComponent(token)}`
  )}`;
  const teamSignUpPath = `/cadastrar/negocio/equipa?token=${encodeURIComponent(token)}${
    isPosInvitation ? "&destination=pos" : ""
  }`;

  return (
    <main className="business-invitation-page">
      <VuyelaLogo href={rootPath} />
      <section>
        {invalid ? (
          <>
            <ShieldCheck aria-hidden="true" size={34} />
            <h1>Convite inválido ou expirado</h1>
            <p>Peça ao administrador do negócio para criar uma nova ligação privada.</p>
          </>
        ) : !principal ? (
          <>
            <CheckCircle2 aria-hidden="true" size={34} />
            <h1>{isPosInvitation ? "Juntar-se à equipa do POS" : "Juntar-se à equipa"}</h1>
            <p>
              Entre com as suas credenciais próprias ou crie um acesso de equipa exclusivo para este
              convite.
            </p>
            <div className="business-invitation-actions">
              <Link className="business-button business-button--primary" href={signInPath}>
                {isPosInvitation ? "Entrar no VUYELA POS" : "Entrar no Portal de Negócio"}
              </Link>
              <Link className="business-button business-button--secondary" href={teamSignUpPath}>
                Criar credenciais de equipa
              </Link>
            </div>
          </>
        ) : principal.accountType !== "business" ? (
          <>
            <ShieldCheck aria-hidden="true" size={34} />
            <h1>Use credenciais de equipa</h1>
            <p>
              Está autenticado como cliente. Termine esta sessão para manter os perfis e as
              permissões completamente separados.
            </p>
            <div className="business-invitation-actions">
              <form action={signOutAction}>
                <input type="hidden" name="returnTo" value={`${rootPath}/entrar`} />
                <button className="business-button business-button--primary" type="submit">
                  Terminar sessão
                </button>
              </form>
              <Link className="business-button business-button--secondary" href={teamSignUpPath}>
                Criar credenciais de equipa
              </Link>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 aria-hidden="true" size={34} />
            <h1>{isPosInvitation ? "Ativar acesso ao POS" : "Juntar-se à equipa"}</h1>
            <p>
              Confirme para associar esta conta ao negócio com a função e a filial definidas no
              convite.
            </p>
            <form action={acceptBusinessInvitationAction}>
              <input name="destination" type="hidden" value={destination} />
              <input name="token" type="hidden" value={token} />
              <button className="business-button business-button--primary" type="submit">
                Aceitar convite
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
