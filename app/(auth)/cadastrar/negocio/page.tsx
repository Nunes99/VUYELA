import type { Metadata } from "next";
import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { BusinessSignUpForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Criar conta de negócio",
  description: "Crie credenciais exclusivas e registe o seu negócio na VUYELA.",
  robots: { index: false, follow: false }
};

export default function BusinessSignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="business-signup-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/" inverse />
          <span className="auth-kicker">Conta de negócio</span>
          <h1 id="business-signup-title">Um acesso criado exclusivamente para o seu negócio.</h1>
          <p>
            Registe as credenciais, a identidade comercial e a filial principal. O pedido seguirá
            para validação sem criar um perfil de cliente.
          </p>
        </div>
        <div className="auth-panel auth-panel--forms">
          <BusinessSignUpForm />
          <p className="auth-footnote">
            Já tem uma conta de negócio? <Link href="/negocio/entrar">Entrar no portal</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
