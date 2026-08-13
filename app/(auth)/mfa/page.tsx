import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verificacao adicional",
  description: "Arquitetura MFA-ready para funcoes privilegiadas VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export default function MfaPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--single" aria-labelledby="mfa-title">
        <div className="auth-panel auth-panel--forms">
          <Link className="auth-brand auth-brand--dark" href="/">
            <span>VUYELA</span>
            <small>by LEMOTE</small>
          </Link>
          <span className="auth-kicker">MFA-ready</span>
          <h1 id="mfa-title">Verificacao adicional necessaria.</h1>
          <p className="auth-intro">
            Funcoes de suporte e administracao exigem MFA. A tela final de MFA sera ligada quando o
            provedor estiver configurado para producao.
          </p>
          <Link className="home-link-button home-link-button--primary" href="/entrar">
            Voltar ao login
          </Link>
        </div>
      </section>
    </main>
  );
}
