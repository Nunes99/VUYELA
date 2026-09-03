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
  PencilLine,
  Phone,
  Save,
  Store,
  UserPlus
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select, Textarea } from "../../vuyela-design-system/src/components/Field";
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
import type { AuthPortal } from "@/features/auth/portal";
import { initialAuthActionState } from "@/features/auth/state";

interface FormProps {
  cancelHref?: string | undefined;
  nextPath?: string | undefined;
  portal?: "customer" | "business" | "pos" | "admin" | undefined;
  recoveryHref?: string | undefined;
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

export function EmailSignInForm({
  cancelHref,
  nextPath = "/cliente",
  portal = "customer",
  recoveryHref
}: FormProps) {
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
      {recoveryHref ? (
        <div className="auth-form__recovery">
          <Link href={recoveryHref}>Esqueceu a palavra-passe?</Link>
        </div>
      ) : null}
      <ActionMessage status={state.status} message={state.message} />
      {cancelHref ? (
        <div className="auth-form__submit-row">
          <Link href={cancelHref}>Cancelar</Link>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            leadingIcon={<LogIn size={18} />}
          >
            Entrar
          </Button>
        </div>
      ) : (
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={pending}
          leadingIcon={<LogIn size={18} />}
        >
          Entrar
        </Button>
      )}
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

export function PasswordResetForm({ nextPath, portal }: { nextPath: string; portal: AuthPortal }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <input name="next" type="hidden" value={nextPath} />
      <input name="portal" type="hidden" value={portal} />
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

export function UpdatePasswordForm({ nextPath, portal }: { nextPath: string; portal: AuthPortal }) {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialAuthActionState);

  return (
    <form action={formAction} className="auth-form">
      <input name="next" type="hidden" value={nextPath} />
      <input name="portal" type="hidden" value={portal} />
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

export type BusinessSignUpStep = 0 | 1 | 2 | 3;

export function BusinessSignUpForm({
  onStepChange
}: {
  onStepChange?: (step: BusinessSignUpStep) => void;
} = {}) {
  const [state, formAction, pending] = useActionState(
    signUpBusinessWithEmailAction,
    initialAuthActionState
  );
  const [step, setStep] = useState<BusinessSignUpStep>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState({
    representativeName: "",
    representativePhone: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    businessName: "",
    nuit: "",
    businessType: "",
    businessSector: "",
    branchName: "",
    city: "",
    province: "",
    branchPhone: "",
    addressLine: "",
    openingTime: "08:00",
    closingTime: "20:00",
    description: "",
    termsAccepted: false
  });
  const steps = ["Acesso", "Negócio", "Filial", "Revisão"] as const;

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const focusStep = () => {
    window.requestAnimationFrame(() => headingRef.current?.focus());
  };

  const goToStep = (nextStep: number) => {
    const boundedStep = Math.max(0, Math.min(nextStep, steps.length - 1)) as BusinessSignUpStep;
    setStep(boundedStep);
    onStepChange?.(boundedStep);
    focusStep();
  };

  const continueToNextStep = () => {
    const currentPanel = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const controls = Array.from(
      currentPanel?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input, textarea, select"
      ) ?? []
    );
    const passwordConfirmation = formRef.current?.elements.namedItem(
      "passwordConfirmation"
    ) as HTMLInputElement | null;

    if (step === 0 && passwordConfirmation) {
      passwordConfirmation.setCustomValidity(
        values.password === values.passwordConfirmation
          ? ""
          : "As palavras-passe introduzidas não coincidem."
      );
    }
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
          label="Número de telefone"
          maxLength={24}
          name="representativePhone"
          type="tel"
          autoComplete="tel"
          onChange={(event) => updateValue("representativePhone", event.currentTarget.value)}
          placeholder="Ex.: +258 84 123 4567"
          title="Use apenas algarismos, espaços, parênteses, pontos ou hífenes."
          requiredMark
          required
          value={values.representativePhone}
        />
        <div className="auth-wizard__grid auth-wizard__grid--credentials">
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
            onChange={(event) => {
              event.currentTarget.setCustomValidity("");
              updateValue("passwordConfirmation", event.currentTarget.value);
            }}
            requiredMark
            required
            value={values.passwordConfirmation}
          />
        </div>
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
        <input name="legalName" type="hidden" value={values.businessName} />
        <div className="auth-wizard__grid">
          <Input
            label="NUIT (Identificação Tributária)"
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
          <Select
            label="Tipo de negócio"
            name="businessType"
            onChange={(event) => updateValue("businessType", event.currentTarget.value)}
            requiredMark
            required
            value={values.businessType}
          >
            <option value="">Selecione uma opção</option>
            <option value="empresario-individual">Empresário em nome individual</option>
            <option value="sociedade-por-quotas">Sociedade por quotas</option>
            <option value="sociedade-anonima">Sociedade anónima</option>
            <option value="associacao">Associação ou cooperativa</option>
            <option value="outra">Outra entidade</option>
          </Select>
        </div>
        <Select
          label="Sector de atividade"
          name="businessSector"
          onChange={(event) => updateValue("businessSector", event.currentTarget.value)}
          requiredMark
          required
          value={values.businessSector}
        >
          <option value="">Selecione o sector</option>
          <option value="alimentacao-bebidas">Alimentação e bebidas</option>
          <option value="beleza-bem-estar">Beleza e bem-estar</option>
          <option value="comercio-retalho">Comércio e retalho</option>
          <option value="saude">Saúde</option>
          <option value="servicos-profissionais">Serviços profissionais</option>
          <option value="turismo-hotelaria">Turismo e hotelaria</option>
          <option value="outro">Outro</option>
        </Select>
        <Textarea
          label="Descrição breve do negócio (opcional)"
          name="description"
          onChange={(event) => updateValue("description", event.currentTarget.value)}
          rows={4}
          value={values.description}
        />
      </fieldset>

      <fieldset className="auth-wizard__panel" data-step="2" hidden={step !== 2}>
        <legend className="sr-only">Dados da primeira filial</legend>
        <div className="auth-wizard__grid">
          <Input
            label="Nome da filial"
            name="branchName"
            onChange={(event) => updateValue("branchName", event.currentTarget.value)}
            placeholder="Ex.: Filial Maputo Centro"
            requiredMark
            required
            value={values.branchName}
          />
          <Select
            label="Província"
            name="province"
            autoComplete="address-level1"
            onChange={(event) => updateValue("province", event.currentTarget.value)}
            requiredMark
            required
            value={values.province}
          >
            <option value="">Selecione a província</option>
            {mozambiqueProvinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </Select>
          <Input
            label="Distrito"
            name="city"
            autoComplete="address-level2"
            onChange={(event) => updateValue("city", event.currentTarget.value)}
            placeholder="Ex.: KaMpfumo"
            requiredMark
            required
            value={values.city}
          />
          <Input
            label="Telefone da filial"
            maxLength={24}
            name="branchPhone"
            type="tel"
            autoComplete="tel"
            onChange={(event) => updateValue("branchPhone", event.currentTarget.value)}
            placeholder="Ex.: +258 21 300 400"
            title="Use apenas algarismos, espaços, parênteses, pontos ou hífenes."
            requiredMark
            required
            value={values.branchPhone}
          />
        </div>
        <Input
          label="Endereço completo"
          name="addressLine"
          autoComplete="street-address"
          onChange={(event) => updateValue("addressLine", event.currentTarget.value)}
          placeholder="Ex.: Avenida Mao Tse Tung, n.º 450"
          requiredMark
          required
          value={values.addressLine}
        />
        <div className="auth-wizard__grid">
          <Input
            label="Abertura"
            name="openingTime"
            type="time"
            onChange={(event) => updateValue("openingTime", event.currentTarget.value)}
            requiredMark
            required
            value={values.openingTime}
          />
          <Input
            label="Encerramento"
            name="closingTime"
            type="time"
            onChange={(event) => updateValue("closingTime", event.currentTarget.value)}
            requiredMark
            required
            value={values.closingTime}
          />
        </div>
      </fieldset>

      <fieldset className="auth-wizard__panel" data-step="3" hidden={step !== 3}>
        <legend className="sr-only">Revisão do registo</legend>
        <dl className="auth-wizard__review">
          <div className="auth-wizard__review-section">
            <div>
              <dt>1. Acesso</dt>
              <button onClick={() => goToStep(0)} type="button">
                <PencilLine aria-hidden="true" size={14} /> Editar
              </button>
            </div>
            <dd>
              <span>Nome do responsável</span>
              <strong>{values.representativeName}</strong>
              <span>E-mail de acesso</span>
              <strong>{values.email}</strong>
            </dd>
          </div>
          <div className="auth-wizard__review-section">
            <div>
              <dt>2. Negócio</dt>
              <button onClick={() => goToStep(1)} type="button">
                <PencilLine aria-hidden="true" size={14} /> Editar
              </button>
            </div>
            <dd>
              <span>Nome do negócio</span>
              <strong>{values.businessName}</strong>
              <span>NUIT</span>
              <strong>{values.nuit || "Não indicado"}</strong>
              <span>Tipo / Sector</span>
              <strong>{humanizeOption(values.businessType, values.businessSector)}</strong>
            </dd>
          </div>
          <div className="auth-wizard__review-section">
            <div>
              <dt>3. Filial</dt>
              <button onClick={() => goToStep(2)} type="button">
                <PencilLine aria-hidden="true" size={14} /> Editar
              </button>
            </div>
            <dd>
              <span>Filial principal</span>
              <strong>{values.branchName}</strong>
              <span>Localização</span>
              <strong>
                {[values.addressLine, values.city, values.province].filter(Boolean).join(", ")}
              </strong>
              <span>Contacto / Horário</span>
              <strong>
                {values.branchPhone} · {values.openingTime}–{values.closingTime}
              </strong>
            </dd>
          </div>
        </dl>
        <label className="auth-wizard__consent">
          <input
            checked={values.termsAccepted}
            name="termsAccepted"
            onChange={(event) =>
              setValues((current) => ({ ...current, termsAccepted: event.currentTarget.checked }))
            }
            required
            type="checkbox"
          />
          <span>
            Li e aceito os <Link href="/termos">Termos e Condições</Link> e a{" "}
            <Link href="/privacidade">Política de Privacidade</Link> da plataforma.
          </span>
        </label>
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
        {step < 3 ? (
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
            variant="primary"
            loading={pending}
            leadingIcon={<Store aria-hidden="true" size={18} />}
          >
            Submeter pedido
          </Button>
        )}
      </div>
    </form>
  );
}

const mozambiqueProvinces = [
  "Cabo Delgado",
  "Gaza",
  "Inhambane",
  "Manica",
  "Maputo Cidade",
  "Maputo Província",
  "Nampula",
  "Niassa",
  "Sofala",
  "Tete",
  "Zambézia"
] as const;

function humanizeOption(...values: string[]) {
  return values
    .filter(Boolean)
    .map((value) => value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()))
    .join(" · ");
}

export function BusinessTeamSignUpForm({
  token,
  destination = "business"
}: {
  token: string;
  destination?: "business" | "pos";
}) {
  const [state, formAction, pending] = useActionState(
    signUpBusinessMemberWithEmailAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="auth-form">
      <input name="token" type="hidden" value={token} />
      <input name="destination" type="hidden" value={destination} />
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
