import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
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
    <AuthShell
      compact
      description="Acesso reservado. Será solicitada verificação multifator para operações sensíveis."
      eyebrow="Administração VUYELA"
      formDescription="Use a sua conta administrativa."
      formTitle="Entrar na Administração"
      homeHref="/"
      id="admin-signin-title"
      title="Administração da plataforma."
      variant="admin"
    >
      <EmailSignInForm
        nextPath={nextPath}
        portal="admin"
        recoveryHref={getPasswordRecoveryPath("admin", nextPath)}
      />
      <p className="auth-footnote">Contas de cliente e de negócio não são aceites nesta área.</p>
    </AuthShell>
  );
}
