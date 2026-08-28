import Link from "next/link";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { EmailSignInForm, PhoneOtpForm } from "@/features/auth/forms";
import { getPasswordRecoveryPath, getPortalNextPath } from "@/features/auth/portal";
import { PwaInstallAction } from "@/features/pwa/pwa-install-action";

export function getCustomerNextPath(value: string | string[] | undefined) {
  return getPortalNextPath("customer", value);
}

export function getBusinessNextPath(value: string | string[] | undefined) {
  return getPortalNextPath("business", value);
}

export function getPosNextPath(value: string | string[] | undefined) {
  return getPortalNextPath("pos", value);
}

export function CustomerSignInView({
  nextPath,
  callbackError,
  phoneAuthEnabled
}: {
  nextPath: string;
  callbackError: boolean;
  phoneAuthEnabled: boolean;
}) {
  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="signin-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/cliente" inverse />
          <span className="auth-kicker">Acesso de cliente</span>
          <h1 id="signin-title">Entre para ver os seus cartões e YELAS.</h1>
          <p>
            Use o seu e-mail e palavra-passe. As regras de acesso continuam protegidas no servidor e
            no PostgreSQL.
          </p>
        </div>

        <div className="auth-panel auth-panel--forms">
          {callbackError ? (
            <p className="auth-message auth-message--error" role="alert">
              O link é inválido ou expirou. Solicite um novo link de recuperação.
            </p>
          ) : null}
          <div className="auth-form-group">
            <h2>E-mail e palavra-passe</h2>
            <EmailSignInForm nextPath={nextPath} />
          </div>
          {phoneAuthEnabled ? (
            <>
              <div className="auth-divider" role="separator">
                ou
              </div>
              <div className="auth-form-group">
                <h2>Telefone com código</h2>
                <PhoneOtpForm nextPath={nextPath} />
              </div>
            </>
          ) : null}
          <p className="auth-footnote">
            Ainda não tem conta? <Link href="/cadastrar">Criar conta</Link>. Esqueceu a
            palavra-passe?{" "}
            <Link href={getPasswordRecoveryPath("customer", nextPath)}>Recuperar acesso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

export function BusinessSignInView({ nextPath }: { nextPath: string }) {
  return (
    <main className="auth-page auth-page--business">
      <section className="auth-shell auth-shell--compact" aria-labelledby="business-signin-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/negocio" inverse />
          <span className="auth-kicker">Portal de Negócio</span>
          <h1 id="business-signin-title">Gira a operação com uma identidade empresarial.</h1>
          <p>Este acesso é exclusivo para proprietários e membros autorizados do negócio.</p>
        </div>
        <div className="auth-panel auth-panel--forms">
          <EmailSignInForm nextPath={nextPath} portal="business" />
          <p className="auth-footnote">
            Ainda não tem credenciais? <Link href="/cadastrar/negocio">Registar negócio</Link>.
            Esqueceu a palavra-passe?{" "}
            <Link href={getPasswordRecoveryPath("business", nextPath)}>Recuperar acesso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

export function PosSignInView({ nextPath }: { nextPath: string }) {
  return (
    <main className="auth-page auth-page--business">
      <section className="auth-shell auth-shell--compact" aria-labelledby="pos-signin-title">
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href="/pos" inverse />
          <span className="auth-kicker">Aplicação POS</span>
          <h1 id="pos-signin-title">Entre com as suas credenciais de operador.</h1>
          <p>
            O acesso fica limitado aos negócios e filiais atribuídos pela administração do negócio.
          </p>
        </div>
        <div className="auth-panel auth-panel--forms">
          <EmailSignInForm nextPath={nextPath} portal="pos" />
          <PwaInstallAction area="pos" />
          <p className="auth-footnote">
            Ainda não tem acesso? Peça ao administrador do negócio credenciais individuais ou um
            convite de operador. Esqueceu a palavra-passe?{" "}
            <Link href={getPasswordRecoveryPath("pos", nextPath)}>Recuperar acesso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
