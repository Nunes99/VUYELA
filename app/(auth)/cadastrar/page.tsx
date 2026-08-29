import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie uma conta pessoal VUYELA para usar cartões digitais e acumular YELAS.",
  alternates: {
    canonical: "/cadastrar"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function SignUpPage() {
  return (
    <AuthShell
      compact
      description="Adira a cartões, acompanhe as suas YELAS e descubra ofertas dos negócios que prefere."
      eyebrow="Conta de cliente"
      formDescription="O registo demora menos de dois minutos."
      formTitle="Dados da conta"
      id="signup-title"
      title="Crie a sua conta VUYELA."
    >
      <SignUpForm />
      <p className="auth-footnote">
        Já tem conta? <Link href="/cliente/entrar">Entrar</Link>.
      </p>
    </AuthShell>
  );
}
