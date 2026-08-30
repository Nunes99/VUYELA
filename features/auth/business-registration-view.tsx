"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { BusinessSignUpForm, type BusinessSignUpStep } from "@/features/auth/forms";

const stepCopy = [
  {
    title: "Registe o seu negócio.",
    description: "Crie o acesso do proprietário, identifique o negócio e indique a primeira filial."
  },
  {
    title: "Identifique o seu negócio.",
    description: "Forneça os dados da sua empresa para verificação e registo na plataforma."
  },
  {
    title: "Adicione a sua primeira filial.",
    description: "Indique a localização e os dados de contacto do seu primeiro ponto de operação."
  },
  {
    title: "Reveja os seus dados.",
    description: "Verifique todas as informações antes de submeter o seu pedido de adesão."
  }
] as const;

export function BusinessRegistrationView() {
  const [step, setStep] = useState<BusinessSignUpStep>(0);
  const copy = stepCopy[step];

  return (
    <AuthShell
      description={copy.description}
      eyebrow="Conta de negócio"
      formDescription="Pode rever todos os dados antes de enviar o pedido."
      formTitle="Pedido de adesão"
      id="business-signup-title"
      securityNote="Adesão segura e encriptada de ponta a ponta."
      title={copy.title}
      variant="business"
    >
      <BusinessSignUpForm onStepChange={setStep} />
      <p className="auth-footnote">
        Já tem uma conta de negócio? <Link href="/negocio/entrar">Entrar no portal</Link>.
      </p>
    </AuthShell>
  );
}
