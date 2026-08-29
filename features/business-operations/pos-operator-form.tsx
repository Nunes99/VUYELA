"use client";

import { Check, Copy, KeyRound, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { provisionPosOperatorAction } from "./actions";
import type { BusinessOperationBranch, PosOperatorProvisionActionState } from "./model";

const initialState: PosOperatorProvisionActionState = {
  status: "idle",
  message: ""
};

export function PosOperatorForm({
  businessId,
  branches
}: {
  businessId: string;
  branches: BusinessOperationBranch[];
}) {
  const [state, formAction] = useActionState(provisionPosOperatorAction, initialState);
  const [copied, setCopied] = useState<"login" | "password" | "all" | null>(null);
  const activeBranches = branches.filter((branch) => branch.isActive);

  async function copyValue(kind: "login" | "password" | "all") {
    if (!state.credentials) return;
    const value =
      kind === "login"
        ? state.credentials.login
        : kind === "password"
          ? state.credentials.password
          : `VUYELA POS\nLogin: ${state.credentials.login}\nPalavra-passe: ${state.credentials.password}\nAcesso: ${window.location.origin}${state.credentials.signInPath}`;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
  }

  return (
    <form action={formAction} className="business-operation-form business-operation-form--operator">
      <input name="businessId" type="hidden" value={businessId} />
      <label>
        <span>Nome do operador</span>
        <input
          autoComplete="name"
          maxLength={120}
          minLength={2}
          name="displayName"
          placeholder="Nome completo"
          required
        />
      </label>
      <label>
        <span>E-mail de acesso</span>
        <input
          autoComplete="off"
          name="email"
          placeholder="operador@empresa.co.mz"
          required
          type="email"
        />
      </label>
      <label>
        <span>Telefone opcional</span>
        <input autoComplete="tel" name="phone" placeholder="+258 84 000 0000" type="tel" />
      </label>
      <label>
        <span>Filial</span>
        <select defaultValue="" name="branchId" required>
          <option disabled value="">
            Selecionar filial
          </option>
          {activeBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>
      <PendingSubmitButton
        className="business-button business-button--primary"
        leadingIcon={<UserRoundPlus aria-hidden="true" size={16} />}
        pendingLabel="A criar acesso..."
        type="submit"
      >
        Criar operador POS
      </PendingSubmitButton>

      {state.status !== "idle" ? (
        <div
          className={`business-operation-feedback business-operation-feedback--${state.status} business-operation-credentials`}
          role={state.status === "error" ? "alert" : "status"}
        >
          <p>{state.message}</p>
          {state.credentials ? (
            <div className="business-operation-credentials__content">
              <CredentialField
                copied={copied === "login"}
                label="Login"
                onCopy={() => copyValue("login")}
                value={state.credentials.login}
              />
              <CredentialField
                copied={copied === "password"}
                label="Palavra-passe temporária"
                onCopy={() => copyValue("password")}
                value={state.credentials.password}
              />
              <button
                onClick={() => copyValue("all")}
                title="Copiar todas as credenciais"
                type="button"
              >
                {copied === "all" ? (
                  <Check aria-hidden="true" size={16} />
                ) : (
                  <Copy aria-hidden="true" size={16} />
                )}
                {copied === "all" ? "Credenciais copiadas" : "Copiar tudo"}
              </button>
              <Link href={state.credentials.signInPath}>
                <KeyRound aria-hidden="true" size={16} />
                Abrir entrada do POS
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function CredentialField({
  copied,
  label,
  onCopy,
  value
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <span className="business-operation-credentials__field">
        <input aria-label={label} readOnly value={value} />
        <button aria-label={`Copiar ${label.toLowerCase()}`} onClick={onCopy} type="button">
          {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
        </button>
      </span>
    </label>
  );
}
