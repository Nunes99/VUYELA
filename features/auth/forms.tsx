"use client";

import { useActionState } from "react";
import { KeyRound, LogIn, Mail, Phone, Save, Store, UserPlus } from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Textarea } from "../../vuyela-design-system/src/components/Field";
import {
  requestPasswordResetAction,
  requestPhoneOtpAction,
  signInWithEmailAction,
  signUpWithEmailAction,
  submitBusinessOnboardingAction,
  updatePasswordAction,
  updateCustomerProfileAction,
  verifyPhoneOtpAction
} from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

interface FormProps {
  nextPath?: string | undefined;
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

export function EmailSignInForm({ nextPath = "/cliente" }: FormProps) {
  const [state, formAction, pending] = useActionState(
    signInWithEmailAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />
      <Input label="Email" name="email" type="email" autoComplete="email" requiredMark required />
      <Input
        label="Senha"
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
          Enviar codigo
        </Button>
      </form>

      <form action={verifyAction} className="auth-form">
        <input type="hidden" name="next" value={nextPath} />
        <Input label="Telefone" name="phone" type="tel" autoComplete="tel" requiredMark required />
        <Input
          label="Codigo SMS"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          requiredMark
          required
        />
        <ActionMessage status={verifyState.status} message={verifyState.message} />
        <Button type="submit" variant="primary" fullWidth loading={verifying}>
          Confirmar codigo
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
      <Input label="Email" name="email" type="email" autoComplete="email" requiredMark required />
      <Input
        label="Senha"
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
      <Input label="Email" name="email" type="email" autoComplete="email" requiredMark required />
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
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Use pelo menos 8 caracteres."
        requiredMark
        required
      />
      <Input
        label="Confirmar nova senha"
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
        Guardar nova senha
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
      <Input label="Email" name="email" type="email" autoComplete="email" />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={pending}
        leadingIcon={<Save size={18} />}
      >
        Guardar perfil
      </Button>
    </form>
  );
}

export function BusinessOnboardingForm() {
  const [state, formAction, pending] = useActionState(
    submitBusinessOnboardingAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <Input
        label="Nome do negocio"
        name="businessName"
        autoComplete="organization"
        requiredMark
        required
      />
      <Input label="Nome legal" name="legalName" autoComplete="organization" />
      <Input
        label="NUIT"
        name="nuit"
        inputMode="numeric"
        autoComplete="off"
        minLength={9}
        maxLength={12}
        pattern="[0-9]{9,12}"
        hint="Opcional. Introduza entre 9 e 12 algarismos, sem espacos."
        title="Introduza entre 9 e 12 algarismos."
      />
      <Input label="Cidade" name="city" autoComplete="address-level2" requiredMark required />
      <Input label="Provincia" name="province" autoComplete="address-level1" />
      <Input label="Telefone" name="phone" type="tel" autoComplete="tel" />
      <Input label="Email do negocio" name="email" type="email" autoComplete="email" />
      <Textarea label="Descricao" name="description" rows={4} />
      <ActionMessage status={state.status} message={state.message} />
      <Button
        type="submit"
        variant="reward"
        fullWidth
        loading={pending}
        leadingIcon={<Store size={18} />}
      >
        Enviar para validacao
      </Button>
    </form>
  );
}
