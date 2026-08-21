import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { PasswordResetForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  description: "Receba instrucoes para recuperar o acesso a sua conta VUYELA.",
  alternates: {
    canonical: "/recuperar-acesso"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function PasswordResetPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--single" aria-labelledby="reset-title">
        <div className="auth-panel auth-panel--forms">
          <VuyelaLogo className="auth-brand auth-brand--dark" />
          <span className="auth-kicker">Recuperacao</span>
          <h1 id="reset-title">Recupere o acesso com seguranca.</h1>
          <p className="auth-intro">
            Indique o email da conta para receber as instrucoes de recuperacao.
          </p>
          <PasswordResetForm />
          <p className="auth-footnote">
            Lembrou a senha? <Link href="/entrar">Voltar ao login</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
