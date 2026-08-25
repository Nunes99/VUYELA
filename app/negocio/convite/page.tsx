import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { acceptBusinessInvitationAction } from "@/features/business-operations/actions";
import { getProtectedRouteState } from "@/lib/auth/session";

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
  const state = await getProtectedRouteState("/cliente", currentPath);

  return (
    <ProtectedRouteStateView state={state} title="Convite para negócio" variant="business">
      {state.status === "authorized" ? (
        <main className="business-invitation-page">
          <VuyelaLogo href="/" />
          <section>
            {invalid ? (
              <>
                <ShieldCheck aria-hidden="true" size={34} />
                <h1>Convite inválido ou expirado</h1>
                <p>Peça ao administrador do negócio para criar uma nova ligação privada.</p>
              </>
            ) : (
              <>
                <CheckCircle2 aria-hidden="true" size={34} />
                <h1>Juntar-se à equipa</h1>
                <p>
                  Confirme para associar esta conta ao negócio com a função e a filial definidas no
                  convite.
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
      ) : null}
    </ProtectedRouteStateView>
  );
}
