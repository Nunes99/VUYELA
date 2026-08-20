"use client";

import { CheckCircle2, TicketPlus } from "lucide-react";
import { useActionState } from "react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select } from "../../vuyela-design-system/src/components/Field";

import { acceptReferralAction, createReferralAction, initialReferralActionState } from "./actions";
import type { CustomerReferralProgram } from "./model";

export function CustomerReferralForms({ programs }: { programs: CustomerReferralProgram[] }) {
  return (
    <div className="referral-action-grid">
      <CreateReferralForm programs={programs} />
      <AcceptReferralForm />
    </div>
  );
}

function CreateReferralForm({ programs }: { programs: CustomerReferralProgram[] }) {
  const [state, formAction, pending] = useActionState(
    createReferralAction,
    initialReferralActionState
  );

  return (
    <form action={formAction} className="referral-form">
      <div className="referral-form-heading">
        <span className="customer-dashboard-eyebrow">Convidar</span>
        <h3>Novo codigo</h3>
      </div>
      {programs.length > 0 ? (
        <Select label="Negocio" name="cardId" requiredMark required>
          {programs.map((program) => (
            <option value={program.cardId} key={program.cardId}>
              {program.businessName} · {program.cardNumber}
            </option>
          ))}
        </Select>
      ) : (
        <p className="referral-form-empty">Nenhum programa activo nos seus cartoes.</p>
      )}
      <Button
        type="submit"
        variant="primary"
        loading={pending}
        disabled={programs.length === 0}
        leadingIcon={<TicketPlus size={18} />}
      >
        Gerar codigo
      </Button>
      {state.referralCode ? (
        <output className="referral-code" aria-label="Codigo de indicacao criado">
          {state.referralCode}
        </output>
      ) : null}
      <ActionMessage status={state.status} message={state.message} />
    </form>
  );
}

function AcceptReferralForm() {
  const [state, formAction, pending] = useActionState(
    acceptReferralAction,
    initialReferralActionState
  );

  return (
    <form action={formAction} className="referral-form">
      <div className="referral-form-heading">
        <span className="customer-dashboard-eyebrow">Receber</span>
        <h3>Aceitar convite</h3>
      </div>
      <Input
        label="Codigo"
        name="referralCode"
        placeholder="VY-12AB34CD"
        minLength={11}
        maxLength={11}
        autoCapitalize="characters"
        requiredMark
        required
      />
      <Button
        type="submit"
        variant="outline"
        loading={pending}
        leadingIcon={<CheckCircle2 size={18} />}
      >
        Aceitar codigo
      </Button>
      <ActionMessage status={state.status} message={state.message} />
    </form>
  );
}

function ActionMessage({
  status,
  message
}: {
  status: "idle" | "error" | "success";
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`referral-message referral-message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
