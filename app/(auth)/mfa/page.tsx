import type { Metadata } from "next";
import Link from "next/link";

import { AuthStandalone } from "@/components/auth/auth-standalone";
import { redirect } from "next/navigation";

import { MfaForm } from "@/features/auth/mfa-form";
import { getSafeMfaNextPath } from "@/features/auth/mfa";
import { getDefaultAuthenticatedPath, requiresMfa } from "@/lib/auth/rbac";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Verificação adicional",
  description: "Verificação multifator para funções privilegiadas VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

interface MfaPageProps {
  searchParams: Promise<{
    next?: string | string[] | undefined;
  }>;
}

export const dynamic = "force-dynamic";

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const [params, authContext] = await Promise.all([searchParams, getAuthContext()]);
  const nextPath = getSafeMfaNextPath(params.next);
  const signInPath = nextPath.startsWith("/admin") ? "/admin/entrar" : "/entrar";

  if (!authContext.principal) {
    redirect(`${signInPath}?next=${encodeURIComponent(nextPath)}`);
  }

  if (!requiresMfa(authContext.principal.profileRole)) {
    redirect(getDefaultAuthenticatedPath(authContext.principal));
  }

  if (authContext.principal.mfaVerified) {
    redirect(nextPath);
  }

  return (
    <AuthStandalone
      description="Introduza o código temporário da sua aplicação de autenticação."
      eyebrow="Verificação em dois passos"
      footer={
        <p className="auth-footnote">
          Não consegue concluir? <Link href={signInPath}>Voltar ao login</Link>.
        </p>
      }
      id="mfa-title"
      title="Verificação adicional necessária."
      variant="admin"
    >
      <MfaForm nextPath={nextPath} signInPath={signInPath} />
    </AuthStandalone>
  );
}
