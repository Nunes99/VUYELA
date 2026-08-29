import type { Metadata } from "next";
import Link from "next/link";

import { AuthStandalone } from "@/components/auth/auth-standalone";
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
    <AuthStandalone
      description="Utilize o link recebido por e-mail para atualizar a palavra-passe desta conta."
      eyebrow="Nova palavra-passe"
      footer={
        <p className="auth-footnote">
          O link expirou?{" "}
          <Link href={getPasswordRecoveryPath(portal, nextPath)}>Solicitar outro link</Link>.
        </p>
      }
      id="update-password-title"
      title="Defina uma nova palavra-passe segura."
      variant={portal === "customer" ? "customer" : portal}
    >
      <UpdatePasswordForm nextPath={nextPath} portal={portal} />
    </AuthStandalone>
  );
}
