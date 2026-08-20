"use client";

import { useActionState } from "react";
import { Check, Save, ShieldCheck } from "lucide-react";

import { canAssignProfileRole, canManageProfileRole } from "@/lib/auth/admin-permissions";
import { profileRoles } from "@/lib/auth/rbac";
import type { ProfileRole } from "@/lib/auth/rbac";

import {
  initialAdminActionState,
  reviewBusinessAction,
  reviewFraudEventAction,
  updateProfileRoleAction,
  updateSupportTicketAction
} from "./actions";
import type { AdminOperator } from "./model";

interface BusinessReviewFormProps {
  businessId: string;
  status: string;
}

const profileRoleLabels: Record<ProfileRole, string> = {
  customer: "Cliente",
  support_agent: "Agente de suporte",
  platform_admin: "Admin da plataforma",
  super_admin: "Super admin"
};

export function BusinessReviewForm({ businessId, status }: BusinessReviewFormProps) {
  const [state, action, pending] = useActionState(reviewBusinessAction, initialAdminActionState);
  const decisions = getBusinessDecisions(status);

  if (decisions.length === 0) {
    return null;
  }

  return (
    <form action={action} className="admin-inline-form">
      <input name="businessId" type="hidden" value={businessId} />
      <label>
        <span>Decisao</span>
        <select defaultValue={decisions[0]?.value} name="decision">
          {decisions.map((decision) => (
            <option key={decision.value} value={decision.value}>
              {decision.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-inline-form__wide">
        <span>Motivo</span>
        <input maxLength={1000} name="note" placeholder="Registo interno" />
      </label>
      <SubmitButton label="Aplicar" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function UserRoleForm({
  actorProfileId,
  actorRole,
  userId,
  currentRole
}: {
  actorProfileId: string;
  actorRole: ProfileRole;
  userId: string;
  currentRole: ProfileRole;
}) {
  const [state, action, pending] = useActionState(updateProfileRoleAction, initialAdminActionState);
  const assignableRoles = profileRoles.filter(
    (role) => role !== currentRole && canAssignProfileRole(actorRole, role)
  );

  if (
    actorProfileId === userId ||
    !canManageProfileRole(actorRole, currentRole) ||
    assignableRoles.length === 0
  ) {
    return null;
  }

  return (
    <form action={action} className="admin-inline-form">
      <input name="targetProfileId" type="hidden" value={userId} />
      <label>
        <span>Nova funcao</span>
        <select defaultValue={assignableRoles[0]} name="newRole">
          {assignableRoles.map((role) => (
            <option key={role} value={role}>
              {profileRoleLabels[role]}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-inline-form__wide">
        <span>Motivo</span>
        <input maxLength={1000} name="note" placeholder="Obrigatorio" required />
      </label>
      <SubmitButton label="Guardar" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function SupportTicketForm({
  ticketId,
  status,
  priority,
  assignedToProfileId,
  resolutionNote,
  operators
}: {
  ticketId: string;
  status: string;
  priority: string;
  assignedToProfileId: string | null;
  resolutionNote: string;
  operators: AdminOperator[];
}) {
  const [state, action, pending] = useActionState(
    updateSupportTicketAction,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-inline-form admin-inline-form--support">
      <input name="ticketId" type="hidden" value={ticketId} />
      <label>
        <span>Estado</span>
        <select defaultValue={status} name="status">
          <option value="open">Aberto</option>
          <option value="in_progress">Em curso</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>
      </label>
      <label>
        <span>Prioridade</span>
        <select defaultValue={priority} name="priority">
          <option value="low">Baixa</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </label>
      <label>
        <span>Responsavel</span>
        <select defaultValue={assignedToProfileId ?? ""} name="assignedToProfileId">
          <option value="">Nao atribuido</option>
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-inline-form__wide">
        <span>Resolucao</span>
        <input defaultValue={resolutionNote} maxLength={2000} name="resolutionNote" />
      </label>
      <label className="admin-inline-form__wide">
        <span>Nota interna</span>
        <input maxLength={1000} name="note" />
      </label>
      <SubmitButton label="Guardar" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function FraudReviewForm({
  fraudEventId,
  resolved
}: {
  fraudEventId: string;
  resolved: boolean;
}) {
  const [state, action, pending] = useActionState(reviewFraudEventAction, initialAdminActionState);

  return (
    <form action={action} className="admin-inline-form">
      <input name="fraudEventId" type="hidden" value={fraudEventId} />
      <input name="resolution" type="hidden" value={resolved ? "reopen" : "resolve"} />
      <label className="admin-inline-form__wide">
        <span>Nota da revisao</span>
        <input maxLength={2000} name="note" placeholder="Obrigatorio" required />
      </label>
      <SubmitButton label={resolved ? "Reabrir" : "Resolver"} pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button className="admin-action-button" disabled={pending} type="submit">
      {label === "Aplicar" ? (
        <ShieldCheck aria-hidden="true" size={17} />
      ) : label === "Resolver" ? (
        <Check aria-hidden="true" size={17} />
      ) : (
        <Save aria-hidden="true" size={17} />
      )}
      {pending ? "A guardar..." : label}
    </button>
  );
}

function ActionMessage({ state }: { state: typeof initialAdminActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p className={`admin-action-message admin-action-message--${state.status}`} role="status">
      {state.message}
    </p>
  );
}

function getBusinessDecisions(status: string): Array<{ value: string; label: string }> {
  if (status === "pending_review") {
    return [
      { value: "approve", label: "Aprovar" },
      { value: "reject", label: "Devolver para revisao" }
    ];
  }

  if (status === "active") {
    return [{ value: "suspend", label: "Suspender" }];
  }

  if (status === "suspended") {
    return [{ value: "reactivate", label: "Reactivar" }];
  }

  return [];
}
