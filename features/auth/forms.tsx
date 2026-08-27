"use client";

import Link from "next/link";
import React, { useActionState, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  Save,
  Store,
  UserPlus
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Textarea } from "../../vuyela-design-system/src/components/Field";
import {
  requestPasswordResetAction,
  requestPhoneOtpAction,
  signInWithEmailAction,
  signUpBusinessMemberWithEmailAction,
  signUpBusinessWithEmailAction,
  signUpWithEmailAction,
  updatePasswordAction,
  updateCustomerProfileAction,
  verifyPhoneOtpAction
} from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

interface FormProps {
  nextPath?: string | undefined;
  portal?: "customer" | "business" | "admin" | undefined;
}

function ActionMessage({ status, message }: { status: string; message: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`auth-message auth-message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function EmailSignInForm({ nextPath = "/cliente", portal = "customer" }: FormProps) {
  const [state, formAction, pending] = useActionState(
    signInWithEmailAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="portal" value={portal} />
      <Input label="E-mail" name="email" type="email" autoComplete="email" requiredMark required />
      <Input
        label="Palavra-passe"
        name="password"
        type="password"
        autoComplete="current-password"
        requiredMark
        required
      />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={pending}
        leadingIcon={<LogIn size={18} />}
      >
        Entrar
      </Button>
    </form>
  );
}

export function PhoneOtpForm({ nextPath = "/cliente" }: FormProps) {
  const [requestState, requestAction, requesting] = useActionState(
    requestPhoneOtpAction,
    initialAuthActionState
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyPhoneOtpAction,
    initialAuthActionState
  );

  return (
    <div className="auth-form-stack">
      <form action={requestAction} className="auth-form">
        <Input
          label="Telefone"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="Use o formato configurado no Supabase, por exemplo +258..."
          requiredMark
          required
        />
        <ActionMessage status={requestState.status} message={requestState.message} />
        <Button
          type="submit"
          variant="secondary"
          fullWidth
          loading={requesting}
          leadingIcon={<Phone size={18} />}
        >
          Enviar código
        </Button>
      </form>

      <form action={verifyAction} className="auth-form">
        <input type="hidden" name="next" value={nextPath} />
        <Input label="Telefone" name="phone" type="tel" autoComplete="tel" requiredMark required />
        <Input
          label="Código SMS"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          requiredMark
          required
        />
        <ActionMessage status={verifyState.status} message={verifyState.message} />
        <Button type="submit" variant="primary" fullWidth loading={verifying}>
          Confirmar código
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm({ nextPath = "/onboarding/cliente" }: FormProps) {
  const [state, formAction, pending] = useActionState(
    signUpWithEmailAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />
      <Input label="Nome" name="displayName" autoComplete="name" requiredMark required />
      <Input label="E-mail" name="email" type="email" autoComplete="email" requiredMark required />
      <Input
        label="Palavra-passe"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Use pelo menos 8 caracteres."
        requiredMark
        required
      />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="reward"
        fullWidth
        loading={pending}
        leadingIcon={<UserPlus size={18} />}
      >
        Criar conta
      </Button>
    </form>
  );
}

export function PasswordResetForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <Input label="E-mail" name="email" type="email" autoComplete="email" requiredMark required />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={pending}
        leadingIcon={<Mail size={18} />}
      >
        Enviar link
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialAuthActionState);

  return (
    <form action={formAction} className="auth-form">
      <Input
        label="Nova palavra-passe"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Use pelo menos 8 caracteres."
        requiredMark
        required
      />
      <Input
        label="Confirmar nova palavra-passe"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        minLength={8}
        requiredMark
        required
      />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={pending}
        leadingIcon={<KeyRound size={18} />}
      >
        Guardar nova palavra-passe
      </Button>
    </form>
  );
}

export function CustomerOnboardingForm() {
  const [state, formAction, pending] = useActionState(
    updateCustomerProfileAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <Input label="Nome completo" name="displayName" autoComplete="name" requiredMark required />
      <Input label="Telefone" name="phone" type="tel" autoComplete="tel" />
      <Input label="E-mail" name="email" type="email" autoComplete="email" />
      <ActionMessage status={state.status} message={state.message} />
      <div className="auth-form-actions">
        <Link href="/cliente">Cancelar</Link>
        <Button type="submit" variant="primary" loading={pending} leadingIcon={<Save size={18} />}>
          Guardar perfil
        </Button>
      </div>
    </form>
  );
}

export function BusinessSignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpBusinessWithEmailAction,
    initialAuthActionState
  );
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState({
    representativeName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    businessName: "",
    legalName: "",
    nuit: "",
    city: "",
    province: "",
    phone: "",
    description: ""
  });
  const steps = ["Acesso", "Negócio", "Revisão"];

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const focusStep = () => {
    window.requestAnimationFrame(() => headingRef.current?.focus());
  };

  const goToStep = (nextStep: number) => {
    setStep(Math.max(0, Math.min(nextStep, steps.length - 1)));
    focusStep();
  };

  const continueToNextStep = () => {
    const currentPanel = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const controls = Array.from(
      currentPanel?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea") ??
        []
    );
    const firstInvalid = controls.find((control) => !control.checkValidity());

    if (firstInvalid) {
      firstInvalid.reportValidity();
      firstInvalid.focus();
      return;
    }

    goToStep(step + 1);
  };

  return (
    <form action={formAction} className="auth-form auth-wizard" ref={formRef}>
      <div className="auth-wizard__status">
        <p>
          Passo {step + 1} de {steps.length}
        </p>
        <ol aria-label="Progresso do registo do negócio">
          {steps.map((label, index) => (
            <li
              aria-current={index === step ? "step" : undefined}
              className={index === step ? "is-active" : index < step ? "is-done" : ""}
              key={label}
            >
              <span>{index < step ? <Check aria-hidden="true" size={13} /> : index + 1}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>
      </div>

      <h2 className="auth-wizard__heading" ref={headingRef} tabIndex={-1}>
        {steps[step]}
      </h2>

      <fieldset className="auth-wizard__panel" data-step="0" hidden={step !== 0}>
        <legend className="sr-only">Credenciais da conta de negócio</legend>
        <Input
          label="Nome do responsável"
          name="representativeName"
          autoComplete="name"
          onChange={(event) => updateValue("representativeName", event.currentTarget.value)}
          requiredMark
          required
          value={values.representativeName}
        />
        <Input
          label="E-mail de acesso"
          name="email"
          type="email"
          autoComplete="email"
          onChange={(event) => updateValue("email", event.currentTarget.value)}
          requiredMark
          required
          value={values.email}
        />
        <Input
          label="Palavra-passe"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => updateValue("password", event.currentTarget.value)}
          requiredMark
          required
          value={values.password}
        />
        <Input
          label="Confirmar palavra-passe"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => updateValue("passwordConfirmation", event.currentTarget.value)}
          requiredMark
          required
          value={values.passwordConfirmation}
        />
      </fieldset>

      <fieldset className="auth-wizard__panel" data-step="1" hidden={step !== 1}>
        <legend className="sr-only">Identificação e localização do negócio</legend>
        <Input
          label="Nome do negócio"
          name="businessName"
          autoComplete="organization"
          onChange={(event) => updateValue("businessName", event.currentTarget.value)}
          requiredMark
          required
          value={values.businessName}
        />
        <Input
          label="Nome legal"
          name="legalName"
          autoComplete="organization"
          onChange={(event) => updateValue("legalName", event.currentTarget.value)}
          value={values.legalName}
        />
        <Input
          label="NUIT"
          name="nuit"
          inputMode="numeric"
          autoComplete="off"
          minLength={9}
          maxLength={12}
          onChange={(event) => updateValue("nuit", event.currentTarget.value)}
          pattern="[0-9]{9,12}"
          hint="Opcional. Introduza entre 9 e 12 algarismos, sem espaços."
          title="Introduza entre 9 e 12 algarismos."
          value={values.nuit}
        />
        <div className="auth-wizard__grid">
          <Input
            label="Cidade"
            name="city"
            autoComplete="address-level2"
            onChange={(event) => updateValue("city", event.currentTarget.value)}
            requiredMark
            required
            value={values.city}
          />
          <Input
            label="Província"
            name="province"
            autoComplete="address-level1"
            onChange={(event) => updateValue("province", event.currentTarget.value)}
            value={values.province}
          />
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            autoComplete="tel"
            onChange={(event) => updateValue("phone", event.currentTarget.value)}
            value={values.phone}
          />
        </div>
        <Textarea
          label="Descrição"
          name="description"
          onChange={(event) => updateValue("description", event.currentTarget.value)}
          rows={4}
          value={values.description}
        />
      </fieldset>

      <fieldset className="auth-wizard__panel" data-step="2" hidden={step !== 2}>
        <legend className="sr-only">Revisão do registo</legend>
        <dl className="auth-wizard__review">
          <div>
            <dt>Responsável e acesso</dt>
            <dd>{[values.representativeName, values.email].filter(Boolean).join(" · ")}</dd>
          </div>
          <div>
            <dt>Negócio</dt>
            <dd>{values.businessName}</dd>
          </div>
          <div>
            <dt>Nome legal / NUIT</dt>
            <dd>{[values.legalName, values.nuit].filter(Boolean).join(" · ") || "Não indicado"}</dd>
          </div>
          <div>
            <dt>Localização</dt>
            <dd>{[values.city, values.province].filter(Boolean).join(", ")}</dd>
          </div>
          <div>
            <dt>Contactos</dt>
            <dd>{values.phone || "Não indicado"}</dd>
          </div>
        </dl>
        <p className="auth-wizard__hint">
          Confirme os dados antes de enviar. Pode voltar às etapas anteriores sem perder o que já
          preencheu.
        </p>
      </fieldset>

      <ActionMessage status={state.status} message={state.message} />
      <div className="auth-wizard__actions">
        <span>
          {step > 0 ? (
            <button onClick={() => goToStep(step - 1)} type="button">
              <ArrowLeft aria-hidden="true" size={17} /> Voltar
            </button>
          ) : (
            <Link href="/">Cancelar</Link>
          )}
        </span>
        {step < steps.length - 1 ? (
          <Button
            onClick={continueToNextStep}
            trailingIcon={<ArrowRight aria-hidden="true" size={18} />}
            type="button"
            variant="primary"
          >
            Continuar
          </Button>
        ) : (
          <Button
            type="submit"
            variant="reward"
            loading={pending}
            leadingIcon={<Store size={18} />}
          >
            Criar conta de negócio
          </Button>
        )}
      </div>
    </form>
  );
}

export function BusinessTeamSignUpForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    signUpBusinessMemberWithEmailAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <input name="token" type="hidden" value={token} />
      <Input label="Nome" name="displayName" autoComplete="name" requiredMark required />
      <Input
        label="E-mail de acesso"
        name="email"
        type="email"
        autoComplete="email"
        requiredMark
        required
      />
      <Input
        label="Telefone"
        name="phone"
        type="tel"
        autoComplete="tel"
        hint="Preencha quando o convite tiver sido enviado para o telefone."
      />
      <Input
        label="Palavra-passe"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        requiredMark
        required
      />
      <Input
        label="Confirmar palavra-passe"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        minLength={8}
        requiredMark
        required
      />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={pending}
        leadingIcon={<Store size={18} />}
      >
        Criar credenciais de equipa
      </Button>
    </form>
  );
}
