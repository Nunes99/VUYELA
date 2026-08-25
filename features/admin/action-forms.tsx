"use client";

import { useActionState } from "react";
import { Check, Save, ShieldCheck } from "lucide-react";

import { canAssignProfileRole, canManageProfileRole } from "@/lib/auth/admin-permissions";
import { profileRoles } from "@/lib/auth/rbac";
import type { ProfileRole } from "@/lib/auth/rbac";

import {
  addSupportTicketMessageAction,
  assignSubscriptionPlanAction,
  reviewBusinessAction,
  triageFraudEventAction,
  updatePlatformSettingsAction,
  updatePlanEntitlementsAction,
  updateProfileAccountStatusAction,
  updateProfileRoleAction,
  updateSupportTicketAction,
  saveBusinessCategoryAction
} from "./actions";
import type { AdminCategory, AdminOperator, AdminPlan, AdminSystemSettings } from "./model";
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

export function BusinessCategoryForm({ category }: { category?: AdminCategory }) {
  const [state, action, pending] = useActionState(
    saveBusinessCategoryAction,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-inline-form admin-category-form">
      <input name="categoryId" type="hidden" value={category?.id ?? ""} />
      <label>
        <span>Nome</span>
        <input defaultValue={category?.name ?? ""} maxLength={100} name="name" required />
      </label>
      <label>
        <span>Identificador</span>
        <input
          defaultValue={category?.slug ?? ""}
          maxLength={100}
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="exemplo-categoria"
          required
        />
      </label>
      <label>
        <span>Ordem</span>
        <input
          defaultValue={category?.sortOrder ?? 100}
          min="0"
          max="9999"
          name="sortOrder"
          required
          type="number"
        />
      </label>
      <label className="admin-inline-form__wide">
        <span>Descrição pública</span>
        <input
          defaultValue={category?.description ?? ""}
          maxLength={500}
          name="description"
          required
        />
      </label>
      <label className="admin-plan-form__toggle">
        <input defaultChecked={category?.isActive ?? true} name="isActive" type="checkbox" />
        <span>Categoria ativa</span>
      </label>
      <label className="admin-inline-form__wide">
        <span>Motivo</span>
        <input maxLength={1000} name="note" placeholder="Obrigatório para auditoria" required />
      </label>
      <SubmitButton label={category ? "Guardar" : "Criar"} pending={pending} />
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

export function UserAccountStatusForm({
  actorProfileId,
  userId,
  accountStatus
}: {
  actorProfileId: string;
  userId: string;
  accountStatus: string;
}) {
  const [state, action, pending] = useActionState(
    updateProfileAccountStatusAction,
    initialAdminActionState
  );

  if (actorProfileId === userId || accountStatus === "closed") {
    return null;
  }

  const nextStatus = accountStatus === "suspended" ? "active" : "suspended";
  return (
    <form action={action} className="admin-inline-form admin-inline-form--danger">
      <input name="targetProfileId" type="hidden" value={userId} />
      <input name="status" type="hidden" value={nextStatus} />
      <label className="admin-inline-form__wide">
        <span>{nextStatus === "suspended" ? "Motivo da suspensão" : "Nota de reativação"}</span>
        <input maxLength={1000} name="reason" placeholder="Obrigatório para auditoria" required />
      </label>
      <SubmitButton
        label={nextStatus === "suspended" ? "Suspender conta" : "Reativar conta"}
        pending={pending}
      />
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

export function SupportReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(
    addSupportTicketMessageAction,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-support-reply-form">
      <input name="ticketId" type="hidden" value={ticketId} />
      <label>
        <span>Nova resposta</span>
        <textarea maxLength={2000} name="body" required rows={4} />
      </label>
      <label className="admin-plan-form__toggle">
        <input name="isInternal" type="checkbox" />
        <span>Guardar apenas como nota interna</span>
      </label>
      <SubmitButton label="Enviar resposta" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function FraudTriageForm({
  fraudEventId,
  triageStatus,
  assignedToProfileId,
  operators
}: {
  fraudEventId: string;
  triageStatus: string;
  assignedToProfileId: string | null;
  operators: AdminOperator[];
}) {
  const [state, action, pending] = useActionState(triageFraudEventAction, initialAdminActionState);
  const resolved = ["resolved", "dismissed"].includes(triageStatus);

  return (
    <form action={action} className="admin-inline-form">
      <input name="fraudEventId" type="hidden" value={fraudEventId} />
      <label>
        <span>Decisão</span>
        <select defaultValue={resolved ? "reopen" : "review"} name="decision">
          {resolved ? <option value="reopen">Reabrir alerta</option> : null}
          {!resolved ? <option value="review">Em análise</option> : null}
          {!resolved ? <option value="escalate">Escalar</option> : null}
          {!resolved ? <option value="resolve">Resolver</option> : null}
          {!resolved ? <option value="dismiss">Descartar</option> : null}
        </select>
      </label>
      <label>
        <span>Responsável</span>
        <select defaultValue={assignedToProfileId ?? ""} name="assignedToProfileId">
          <option value="">Atribuir a mim</option>
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-inline-form__wide">
        <span>Nota da revisão</span>
        <input maxLength={2000} name="note" placeholder="Obrigatória ao escalar ou concluir" />
      </label>
      <SubmitButton label="Guardar triagem" pending={pending} />
      <ActionMessage state={state} />
    </form>
  );
}

export function PlatformSettingsForm({ settings }: { settings: AdminSystemSettings }) {
  const [state, action, pending] = useActionState(
    updatePlatformSettingsAction,
    initialAdminActionState
  );

  return (
    <form action={action} className="admin-platform-settings-form">
      <label>
        <span>Nome da plataforma</span>
        <input defaultValue={settings.platformName} maxLength={100} name="platformName" required />
      </label>
      <label>
        <span>Idioma (código)</span>
        <input defaultValue={settings.locale} maxLength={5} name="locale" required />
      </label>
      <label>
        <span>Moeda</span>
        <input defaultValue={settings.currency} maxLength={3} name="currency" required />
      </label>
      <label>
        <span>Fuso horário</span>
        <input defaultValue={settings.timeZone} maxLength={100} name="timeZone" required />
      </label>
      <label className="admin-inline-form__wide">
        <span>Correio eletrónico de segurança</span>
        <input defaultValue={settings.securityEmail} name="securityEmail" required type="email" />
      </label>
      <label className="admin-plan-form__toggle">
        <input
          defaultChecked={settings.privilegedMfaRequired}
          name="privilegedMfaRequired"
          type="checkbox"
        />
        <span>MFA obrigatório para funções privilegiadas</span>
      </label>
      <label className="admin-plan-form__toggle">
        <input defaultChecked={settings.fraudAlerts} name="fraudAlerts" type="checkbox" />
        <span>Alertas internos de fraude</span>
      </label>
      <label className="admin-plan-form__toggle">
        <input defaultChecked={settings.supportAlerts} name="supportAlerts" type="checkbox" />
        <span>Alertas internos de suporte</span>
      </label>
      <label className="admin-inline-form__wide">
        <span>Motivo da alteração</span>
        <input maxLength={1000} name="note" required />
      </label>
      <SubmitButton label="Guardar definições" pending={pending} />
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
