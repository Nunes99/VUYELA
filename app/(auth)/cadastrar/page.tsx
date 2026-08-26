import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
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
    <main className="auth-page">
      <section className="auth-shell auth-shell--compact" aria-labelledby="signup-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">Conta de cliente</span>
          <h1 id="signup-title">Crie a sua conta pessoal VUYELA.</h1>
          <p>Adira aos cartões dos seus negócios favoritos e acompanhe todas as suas YELAS.</p>
        </div>

        <div className="auth-panel auth-panel--forms">
          <SignUpForm />
          <p className="auth-footnote">
            Já tem conta? <Link href="/entrar">Entrar</Link>. Pretende gerir uma empresa?{" "}
            <Link href="/cadastrar/negocio">Registar negócio</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
