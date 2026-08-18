import type { Metadata } from "next";
import Link from "next/link";

import { UpdatePasswordForm } from "@/features/auth/forms";

export const metadata: Metadata = {
  title: "Definir nova senha",
  description: "Defina uma nova senha para a sua conta VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--single" aria-labelledby="update-password-title">
        <div className="auth-panel auth-panel--forms">
          <Link className="auth-brand auth-brand--dark" href="/">
            <span>VUYELA</span>
            <small>by LEMOTE</small>
          </Link>
          <span className="auth-kicker">Nova senha</span>
          <h1 id="update-password-title">Defina uma nova senha segura.</h1>
          <p className="auth-intro">
            O link recebido por email abriu uma sessao temporaria para actualizar a sua senha.
          </p>
          <UpdatePasswordForm />
          <p className="auth-footnote">
            O link expirou? <Link href="/recuperar-acesso">Solicitar outro link</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
