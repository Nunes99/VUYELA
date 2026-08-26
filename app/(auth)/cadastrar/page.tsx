import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { SignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie uma conta VUYELA para usar cartões digitais ou registar um negócio.",
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
    <main className="auth-page">
      <section className="auth-shell auth-shell--compact" aria-labelledby="signup-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">Nova conta</span>
          <h1 id="signup-title">Crie a base da sua conta VUYELA.</h1>
          <p>
            Depois da confirmação, pode completar o perfil de cliente ou registar um negócio para
            validação.
          </p>
        </div>

        <div className="auth-panel auth-panel--forms">
          <SignUpForm />
          <p className="auth-footnote">
            Já tem conta? <Link href="/entrar">Entrar</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
