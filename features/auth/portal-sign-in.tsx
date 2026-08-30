import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
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
  const recoveryHref = getPasswordRecoveryPath("customer", nextPath);

  return (
    <AuthShell
      compact
      description="Consulte os seus cartões, saldo em YELAS, atividade e ofertas num só lugar."
      eyebrow="Área do cliente"
      formDescription="Introduza os dados usados no seu registo."
      formTitle="Entrar na sua conta"
      homeHref="/"
      id="signin-title"
      title="Bem-vindo de volta."
    >
      {callbackError ? (
        <p className="auth-message auth-message--error" role="alert">
          O link é inválido ou expirou. Solicite um novo link de recuperação.
        </p>
      ) : null}
      <div className="auth-form-group">
        <EmailSignInForm nextPath={nextPath} recoveryHref={recoveryHref} />
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
        Ainda não tem conta? <Link href="/cadastrar">Criar conta</Link>.
      </p>
    </AuthShell>
  );
}

export function BusinessSignInView({ nextPath }: { nextPath: string }) {
  return (
    <AuthShell
      compact
      description="Gerencie as suas filiais, campanhas, cartões emitidos e muito mais num único local seguro."
      eyebrow="Conta de negócio"
      formDescription="Introduza as suas credenciais para aceder ao portal."
      formTitle="Entrar no portal"
      homeHref="/"
      id="business-signin-title"
      title="Aceda ao seu portal."
      variant="business"
    >
      <EmailSignInForm
        cancelHref="/"
        nextPath={nextPath}
        portal="business"
        recoveryHref={getPasswordRecoveryPath("business", nextPath)}
      />
      <p className="auth-footnote">
        Ainda não tem conta? <Link href="/cadastrar/negocio">Criar conta de negócio</Link>.
      </p>
    </AuthShell>
  );
}

export function PosSignInView({ nextPath }: { nextPath: string }) {
  return (
    <AuthShell
      compact
      description="Registe vendas e movimentos de YELAS na filial que lhe foi atribuída."
      eyebrow="Aplicação POS"
      formDescription="Use as credenciais individuais fornecidas pelo negócio."
      formTitle="Acesso de operador"
      homeHref="/"
      id="pos-signin-title"
      title="Entre no POS VUYELA."
      variant="pos"
    >
      <EmailSignInForm
        nextPath={nextPath}
        portal="pos"
        recoveryHref={getPasswordRecoveryPath("pos", nextPath)}
      />
      <PwaInstallAction area="pos" />
      <p className="auth-footnote">
        Ainda não tem acesso? Peça credenciais individuais ao administrador do negócio.
      </p>
    </AuthShell>
  );
}
