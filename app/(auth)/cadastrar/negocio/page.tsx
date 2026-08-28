import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { BusinessSignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Criar conta de negócio",
  description: "Crie credenciais exclusivas e registe o seu negócio na VUYELA.",
  robots: { index: false, follow: false }
};

export default function BusinessSignUpPage() {
  return (
    <AuthShell
      description="Crie o acesso do proprietário, identifique o negócio e indique a primeira filial."
      eyebrow="Conta de negócio"
      formDescription="Pode rever todos os dados antes de enviar o pedido."
      formTitle="Pedido de adesão"
      id="business-signup-title"
      title="Registe o seu negócio."
      variant="business"
    >
      <BusinessSignUpForm />
      <p className="auth-footnote">
        Já tem uma conta de negócio? <Link href="/negocio/entrar">Entrar no portal</Link>.
      </p>
    </AuthShell>
  );
}
