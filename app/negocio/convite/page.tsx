import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { signOutAction } from "@/features/auth/actions";
import { acceptBusinessInvitationAction } from "@/features/business-operations/actions";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Aceitar convite",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AcceptBusinessInvitationPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";
  const invalid = params.estado === "invalido" || !/^[0-9a-f]{48}$/.test(token);
  const currentPath = token
    ? `/negocio/convite?token=${encodeURIComponent(token)}`
    : "/negocio/convite";
  const authContext = await getAuthContext();
  const principal = authContext.principal;
  const businessSignInPath = `/negocio/entrar?next=${encodeURIComponent(currentPath)}`;
  const teamSignUpPath = `/cadastrar/negocio/equipa?token=${encodeURIComponent(token)}`;

  return (
    <main className="business-invitation-page">
      <VuyelaLogo href="/" />
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
            <h1>Juntar-se à equipa</h1>
            <p>
              Entre com as suas credenciais empresariais ou crie um acesso de equipa exclusivo para
              este convite.
            </p>
            <div className="business-invitation-actions">
              <Link className="business-button business-button--primary" href={businessSignInPath}>
                Entrar no Portal de Negócio
              </Link>
              <Link className="business-button business-button--secondary" href={teamSignUpPath}>
                Criar credenciais de equipa
              </Link>
            </div>
          </>
        ) : principal.accountType !== "business" ? (
          <>
            <ShieldCheck aria-hidden="true" size={34} />
            <h1>Use uma conta de negócio</h1>
            <p>
              Está autenticado como cliente. Termine esta sessão e use credenciais empresariais para
              manter os dois perfis separados.
            </p>
            <div className="business-invitation-actions">
              <form action={signOutAction}>
                <input type="hidden" name="returnTo" value="/negocio/entrar" />
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
            <h1>Juntar-se à equipa</h1>
            <p>
              Confirme para associar esta conta empresarial ao negócio com a função e a filial
              definidas no convite.
            </p>
            <form action={acceptBusinessInvitationAction}>
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
