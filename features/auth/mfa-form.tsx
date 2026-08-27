"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound, QrCode, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input } from "../../vuyela-design-system/src/components/Field";
import { isValidTotpCode } from "@/features/auth/mfa";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MfaStep = "loading" | "error" | "enrollment_required" | "enrolling" | "challenge";

interface EnrollmentDetails {
  qrCode: string;
  secret: string;
}

interface MfaFormProps {
  nextPath: string;
  signInPath?: string;
}

const genericMfaError = "Não foi possível concluir a verificação. Tente novamente.";

export function MfaForm({ nextPath, signInPath = "/entrar" }: MfaFormProps) {
  const router = useRouter();
  const [supabase] = useState(createSupabaseBrowserClient);
  const [step, setStep] = useState<MfaStep>("loading");
  const [factorId, setFactorId] = useState("");
  const [incompleteFactorIds, setIncompleteFactorIds] = useState<string[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareMfa() {
      const [{ data: userData, error: userError }, assurance, factors] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors()
      ]);

      if (cancelled) {
        return;
      }

      if (userError || !userData.user) {
        router.replace(`${signInPath}?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      if (assurance.error || factors.error) {
        setError(genericMfaError);
        setStep("error");
        return;
      }

      if (assurance.data.currentLevel === "aal2") {
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const verifiedTotp = factors.data.totp[0];

      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setStep("challenge");
        return;
      }

      setIncompleteFactorIds(
        factors.data.all
          .filter((factor) => factor.factor_type === "totp" && factor.status === "unverified")
          .map((factor) => factor.id)
      );
      setStep("enrollment_required");
    }

    void prepareMfa();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router, signInPath, supabase]);

  async function startEnrollment() {
    setError("");
    setPending(true);

    try {
      for (const staleFactorId of incompleteFactorIds) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: staleFactorId
        });

        if (unenrollError) {
          throw unenrollError;
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "VUYELA Admin"
      });

      if (enrollError) {
        throw enrollError;
      }

      setIncompleteFactorIds([]);
      setFactorId(data.id);
      setEnrollment({
        qrCode: data.totp.qr_code,
        secret: data.totp.secret
      });
      setStep("enrolling");
    } catch {
      setError("Não foi possível iniciar a configuração do autenticador. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedCode = code.trim();

    if (!isValidTotpCode(normalizedCode) || !factorId) {
      setError("Introduza o código de 6 digitos do seu autenticador.");
      return;
    }

    setPending(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });

      if (challenge.error) {
        throw challenge.error;
      }

      const verification = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: normalizedCode
      });

      if (verification.error) {
        throw verification.error;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Código inválido ou expirado. Confirme o autenticador e tente novamente.");
      setPending(false);
    }
  }

  if (step === "loading") {
    return (
      <p className="auth-message auth-message--success" role="status">
        A preparar a verificação segura...
      </p>
    );
  }

  if (step === "enrollment_required") {
    return (
      <div className="auth-form">
        <p className="auth-intro">
          Ligue a conta a uma aplicação autenticadora para proteger as funções administrativas.
        </p>
        {error ? (
          <p className="auth-message auth-message--error" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          fullWidth
          loading={pending}
          leadingIcon={<QrCode size={18} />}
          onClick={startEnrollment}
        >
          Configurar autenticador
        </Button>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="auth-form">
        <p className="auth-message auth-message--error" role="alert">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          fullWidth
          leadingIcon={<RefreshCw size={18} />}
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={verifyCode}>
      {step === "enrolling" && enrollment ? (
        <div className="mfa-enrollment">
          <p>
            Leia este código QR com Google Authenticator, Microsoft Authenticator ou equivalente.
          </p>
          <div className="mfa-qr">
            <Image
              src={enrollment.qrCode}
              alt="Código QR para configurar o autenticador VUYELA"
              width={220}
              height={220}
              unoptimized
            />
          </div>
          <p className="mfa-secret-label">Chave para introdução manual</p>
          <code className="mfa-secret">{enrollment.secret}</code>
        </div>
      ) : (
        <p className="auth-intro">
          Introduza o código atual da aplicação autenticadora ligada a esta conta.
        </p>
      )}

      <Input
        label="Código de verificação"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        requiredMark
        required
      />
      {error ? (
        <p className="auth-message auth-message--error" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={pending}
        leadingIcon={step === "enrolling" ? <ShieldCheck size={18} /> : <KeyRound size={18} />}
      >
        {step === "enrolling" ? "Ativar e continuar" : "Verificar e continuar"}
      </Button>
    </form>
  );
}
