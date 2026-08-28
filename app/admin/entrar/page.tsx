import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { EmailSignInForm } from "@/features/auth/forms";
import { getPasswordRecoveryPath, getPortalNextPath } from "@/features/auth/portal";

export const metadata: Metadata = {
  title: "Entrar na Administração",
  description: "Acesso reservado à Administração VUYELA.",
  robots: { index: false, follow: false }
};

interface AdminSignInPageProps {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
}

function getAdminNextPath(value: string | string[] | undefined) {
  return getPortalNextPath("admin", value);
}

export default async function AdminSignInPage({ searchParams }: AdminSignInPageProps) {
  const params = await searchParams;
  const nextPath = getAdminNextPath(params.next);

  return (
    <main className="auth-page auth-page--admin">
      <section className="auth-shell auth-shell--compact" aria-labelledby="admin-signin-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/admin" inverse />
          <span className="auth-kicker">Administração VUYELA</span>
          <h1 id="admin-signin-title">Acesso reservado à gestão da plataforma.</h1>
          <p>Use as credenciais administrativas e conclua a verificação multifator.</p>
        </div>
        <div className="auth-panel auth-panel--forms">
          <EmailSignInForm nextPath={nextPath} portal="admin" />
          <p className="auth-footnote">
            Contas de cliente e de negócio não são aceites nesta área. Esqueceu a palavra-passe?{" "}
            <Link href={getPasswordRecoveryPath("admin", nextPath)}>Recuperar acesso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
