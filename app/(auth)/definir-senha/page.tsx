import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { UpdatePasswordForm } from "@/features/auth/forms";
import {
  getPasswordRecoveryPath,
  getPortalNextPath,
  parseAuthPortal
} from "@/features/auth/portal";

export const metadata: Metadata = {
  title: "Definir nova palavra-passe",
  description: "Defina uma nova palavra-passe para a sua conta VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({
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
      <section className="auth-shell auth-shell--single" aria-labelledby="update-password-title">
        <div className="auth-panel auth-panel--forms">
          <VuyelaLogo className="auth-brand auth-brand--dark" href="/" />
          <span className="auth-kicker">Nova palavra-passe</span>
          <h1 id="update-password-title">Defina uma nova palavra-passe segura.</h1>
          <p className="auth-intro">
            O link recebido por e-mail abriu uma sessão temporária para atualizar a sua
            palavra-passe.
          </p>
          <UpdatePasswordForm nextPath={nextPath} portal={portal} />
          <p className="auth-footnote">
            O link expirou?{" "}
            <Link href={getPasswordRecoveryPath(portal, nextPath)}>Solicitar outro link</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
