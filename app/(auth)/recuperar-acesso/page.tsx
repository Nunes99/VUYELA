import type { Metadata } from "next";
import Link from "next/link";

import { AuthStandalone } from "@/components/auth/auth-standalone";
import { PasswordResetForm } from "@/features/auth/forms";
import { getPortalLoginPath, getPortalNextPath, parseAuthPortal } from "@/features/auth/portal";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  description: "Receba instruções para recuperar o acesso a sua conta VUYELA.",
  alternates: {
    canonical: "/recuperar-acesso"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default async function PasswordResetPage({
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
    <AuthStandalone
      description="Indique o e-mail da conta para receber as instruções de recuperação."
      eyebrow="Recuperação"
      footer={
        <p className="auth-footnote">
          Lembrou a palavra-passe? <Link href={getPortalLoginPath(portal)}>Voltar ao login</Link>.
        </p>
      }
      id="reset-title"
      title="Recupere o acesso com segurança."
      variant={portal === "customer" ? "customer" : portal}
    >
      <PasswordResetForm nextPath={nextPath} portal={portal} />
    </AuthStandalone>
  );
}
