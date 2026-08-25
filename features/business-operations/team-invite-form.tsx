"use client";

import { Copy, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { inviteBusinessMemberAction } from "./actions";
import type { BusinessOperationBranch } from "./model";

const initialState = { status: "idle" as const, message: "" };

export function TeamInviteForm({
  businessId,
  branches
}: {
  businessId: string;
  branches: BusinessOperationBranch[];
}) {
  const [state, formAction, pending] = useActionState(inviteBusinessMemberAction, initialState);
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    if (!state.invitePath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${state.invitePath}`);
    setCopied(true);
  }

  return (
    <form action={formAction} className="business-operation-form business-operation-form--invite">
      <input name="businessId" type="hidden" value={businessId} />
      <label>
        <span>E-mail</span>
        <input autoComplete="email" name="email" placeholder="nome@empresa.co.mz" type="email" />
      </label>
      <label>
        <span>Telefone</span>
        <input autoComplete="tel" name="phone" placeholder="+258 84 000 0000" type="tel" />
      </label>
      <label>
        <span>Função</span>
        <select defaultValue="cashier" name="role">
          <option value="cashier">Operador de caixa</option>
          <option value="branch_manager">Gestor de filial</option>
          <option value="business_admin">Administrador</option>
        </select>
      </label>
      <label>
        <span>Filial</span>
        <select defaultValue="" name="branchId">
          <option value="">Todo o negócio</option>
          {branches
            .filter((branch) => branch.isActive)
            .map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
        </select>
      </label>
      <button className="business-button business-button--primary" disabled={pending} type="submit">
        <Send aria-hidden="true" size={16} />
        {pending ? "A criar..." : "Criar convite"}
      </button>

      {state.status !== "idle" ? (
        <div
          className={`business-operation-feedback business-operation-feedback--${state.status}`}
          role="status"
        >
          <p>{state.message}</p>
          {state.invitePath ? (
            <div>
              <input aria-label="Ligação privada do convite" readOnly value={state.invitePath} />
              <button onClick={copyInvite} title="Copiar ligação" type="button">
                <Copy aria-hidden="true" size={16} />
                {copied ? "Copiada" : "Copiar"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
