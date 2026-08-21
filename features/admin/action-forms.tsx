"use client";

import { useActionState } from "react";
import { Check, Save, ShieldCheck } from "lucide-react";

import { canAssignProfileRole, canManageProfileRole } from "@/lib/auth/admin-permissions";
import { profileRoles } from "@/lib/auth/rbac";
import type { ProfileRole } from "@/lib/auth/rbac";

import {
  assignSubscriptionPlanAction,
  reviewBusinessAction,
  reviewFraudEventAction,
  updatePlanEntitlementsAction,
  updateProfileRoleAction,
  updateSupportTicketAction
} from "./actions";
import type { AdminOperator, AdminPlan } from "./model";
import { initialAdminActionState } from "./state";

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
        <span>Decisão</span>
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
        <span>Nova função</span>
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
        <input maxLength={1000} name="note" placeholder="Obrigatório" required />
      </label>
      <SubmitButton label="Guardar" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function SubscriptionPlanForm({
  businessId,
  currentPlanId,
  currentStatus,
  plans
}: {
  businessId: string;
  currentPlanId: string;
  currentStatus: string;
  plans: AdminPlan[];
}) {
  const [state, action, pending] = useActionState(
    assignSubscriptionPlanAction,
    initialAdminActionState
  );
  const activePlans = plans.filter((plan) => plan.isActive);

  if (activePlans.length === 0) {
    return null;
  }

  return (
    <form action={action} className="admin-inline-form">
      <input name="businessId" type="hidden" value={businessId} />
      <label>
        <span>Plano</span>
        <select defaultValue={currentPlanId} name="planId">
          {activePlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Estado</span>
        <select
          defaultValue={
            ["trialing", "active", "paused"].includes(currentStatus) ? currentStatus : "active"
          }
          name="status"
        >
          <option value="trialing">Em teste</option>
          <option value="active">Ativa</option>
          <option value="paused">Pausada</option>
        </select>
      </label>
      <label className="admin-inline-form__wide">
        <span>Motivo</span>
        <input maxLength={1000} name="note" placeholder="Obrigatório" required />
      </label>
      <SubmitButton label="Guardar" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function PlanEntitlementsForm({ plan }: { plan: AdminPlan }) {
  const [state, action, pending] = useActionState(
    updatePlanEntitlementsAction,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-inline-form admin-plan-form">
      <input name="planId" type="hidden" value={plan.id} />
      <label>
        <span>Mensalidade (MZN)</span>
        <input
          defaultValue={plan.monthlyPriceMznMinor === null ? "" : plan.monthlyPriceMznMinor / 100}
          min="0"
          name="monthlyPriceMzn"
          step="0.01"
          type="number"
        />
      </label>
      <label>
        <span>Filiais</span>
        <input defaultValue={plan.branchLimit ?? ""} min="1" name="branchLimit" type="number" />
      </label>
      <label>
        <span>Equipa</span>
        <input defaultValue={plan.staffLimit ?? ""} min="1" name="staffLimit" type="number" />
      </label>
      <label>
        <span>Campanhas</span>
        <input defaultValue={plan.campaignLimit ?? ""} min="0" name="campaignLimit" type="number" />
      </label>
      <label>
        <span>Analítica</span>
        <select defaultValue={plan.analyticsLevel} name="analyticsLevel">
          <option value="none">Sem analítica</option>
          <option value="basic">Básica</option>
          <option value="standard">Padrão</option>
          <option value="advanced">Avançada</option>
        </select>
      </label>
      <label>
        <span>Dias de teste</span>
        <input
          defaultValue={plan.trialDays}
          max="365"
          min="0"
          name="trialDays"
          required
          type="number"
        />
      </label>
      <label className="admin-inline-form__wide">
        <span>Funcionalidades</span>
        <input defaultValue={plan.featureFlags.join(", ")} name="featureFlags" />
      </label>
      <label className="admin-plan-form__toggle">
        <input defaultChecked={plan.isPublic} name="isPublic" type="checkbox" />
        <span>Público</span>
      </label>
      <label className="admin-plan-form__toggle">
        <input defaultChecked={plan.isActive} name="isActive" type="checkbox" />
        <span>Ativo</span>
      </label>
      <label className="admin-inline-form__wide">
        <span>Motivo</span>
        <input maxLength={1000} name="note" placeholder="Obrigatório" required />
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
        <span>Responsável</span>
        <select defaultValue={assignedToProfileId ?? ""} name="assignedToProfileId">
          <option value="">Não atribuído</option>
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-inline-form__wide">
        <span>Resolução</span>
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
        <span>Nota da revisão</span>
        <input maxLength={2000} name="note" placeholder="Obrigatório" required />
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
      { value: "reject", label: "Devolver para revisão" }
    ];
  }

  if (status === "active") {
    return [{ value: "suspend", label: "Suspender" }];
  }

  if (status === "suspended") {
    return [{ value: "reactivate", label: "Reativar" }];
  }

  return [];
}
