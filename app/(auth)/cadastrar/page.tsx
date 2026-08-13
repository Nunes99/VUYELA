import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie uma conta VUYELA para usar cartoes digitais ou cadastrar um negocio.",
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
          <Link className="auth-brand" href="/">
            <span>VUYELA</span>
            <small>by LEMOTE</small>
          </Link>
          <span className="auth-kicker">Nova conta</span>
          <h1 id="signup-title">Crie a base da sua conta VUYELA.</h1>
          <p>
            Depois da confirmacao, pode completar o perfil de cliente ou cadastrar um negocio para
            validacao.
          </p>
        </div>

        <div className="auth-panel auth-panel--forms">
          <SignUpForm />
          <p className="auth-footnote">
            Ja tem conta? <Link href="/entrar">Entrar</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
