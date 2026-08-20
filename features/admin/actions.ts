"use server";

import { isIP } from "node:net";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { AdminAccessDeniedError, requireAdminCapability } from "@/lib/auth/admin-access";
import { isProfileRole } from "@/lib/auth/rbac";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export interface AdminActionState {
  status: "idle" | "error" | "success";
  message: string;
}

export const initialAdminActionState: AdminActionState = {
  status: "idle",
  message: ""
};

export async function reviewBusinessAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const businessId = getFormString(formData, "businessId");
  const decision = getFormString(formData, "decision");
  const note = getFormString(formData, "note");

  if (!isUuid(businessId) || !["approve", "reject", "suspend", "reactivate"].includes(decision)) {
    return adminError("Pedido de revisao invalido.");
  }

  if (["reject", "suspend"].includes(decision) && note.length < 4) {
    return adminError("Registe um motivo com pelo menos 4 caracteres.");
  }

  const principal = await getActionPrincipal("businesses_review");

  if (!principal) {
    return adminError("A sua funcao nao permite rever negocios.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_review_business", {
    p_actor_profile_id: principal.profileId,
    p_business_id: businessId,
    p_decision: decision,
    p_note: note || null,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess("Estado do negocio actualizado e auditado.");
}

export async function updateProfileRoleAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const targetProfileId = getFormString(formData, "targetProfileId");
  const newRole = getFormString(formData, "newRole");
  const note = getFormString(formData, "note");

  if (!isUuid(targetProfileId) || !isProfileRole(newRole) || note.length < 4) {
    return adminError("Seleccione uma funcao e registe o motivo da alteracao.");
  }

  const principal = await getActionPrincipal("users_manage");

  if (!principal) {
    return adminError("A sua funcao nao permite alterar permissoes.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_update_profile_role", {
    p_actor_profile_id: principal.profileId,
    p_target_profile_id: targetProfileId,
    p_new_role: newRole,
    p_note: note,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess("Funcao do utilizador actualizada e auditada.");
}

export async function updateSupportTicketAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const ticketId = getFormString(formData, "ticketId");
  const status = getFormString(formData, "status");
  const priority = getFormString(formData, "priority");
  const assignedToProfileId = getFormString(formData, "assignedToProfileId");
  const resolutionNote = getFormString(formData, "resolutionNote");
  const note = getFormString(formData, "note");

  if (
    !isUuid(ticketId) ||
    !["open", "in_progress", "resolved", "closed"].includes(status) ||
    !["low", "normal", "high", "urgent"].includes(priority) ||
    (assignedToProfileId && !isUuid(assignedToProfileId))
  ) {
    return adminError("Actualizacao de suporte invalida.");
  }

  if (["resolved", "closed"].includes(status) && resolutionNote.length < 4) {
    return adminError("Registe a resolucao antes de concluir o pedido.");
  }

  const principal = await getActionPrincipal("support_manage");

  if (!principal) {
    return adminError("A sua funcao nao permite gerir suporte.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_update_support_ticket", {
    p_actor_profile_id: principal.profileId,
    p_ticket_id: ticketId,
    p_status: status,
    p_priority: priority,
    p_assigned_to_profile_id: assignedToProfileId || null,
    p_resolution_note: resolutionNote || null,
    p_note: note || null,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess("Pedido de suporte actualizado e auditado.");
}

export async function reviewFraudEventAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fraudEventId = getFormString(formData, "fraudEventId");
  const resolution = getFormString(formData, "resolution");
  const note = getFormString(formData, "note");

  if (!isUuid(fraudEventId) || !["resolve", "reopen"].includes(resolution) || note.length < 4) {
    return adminError("Registe uma decisao e o respectivo motivo.");
  }

  const principal = await getActionPrincipal("fraud_review");

  if (!principal) {
    return adminError("A sua funcao nao permite rever alertas de fraude.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_review_fraud_event", {
    p_actor_profile_id: principal.profileId,
    p_fraud_event_id: fraudEventId,
    p_resolution: resolution,
    p_note: note,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess("Alerta de fraude actualizado e auditado.");
}

async function getActionPrincipal(capability: Parameters<typeof requireAdminCapability>[0]) {
  try {
    return await requireAdminCapability(capability);
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      return null;
    }

    throw error;
  }
}

async function getRequestAuditContext() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const realIp = requestHeaders.get("x-real-ip")?.trim() ?? "";
  const candidateIp = forwardedFor || realIp;

  return {
    ipAddress: isIP(candidateIp) ? candidateIp : null,
    userAgent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null
  };
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getDatabaseActionMessage(message: string): string {
  if (message.includes("own role")) {
    return "Nao pode alterar a sua propria funcao administrativa.";
  }

  if (message.includes("final super admin")) {
    return "O ultimo super admin nao pode ser despromovido.";
  }

  if (message.includes("privileged platform roles")) {
    return "Apenas um super admin pode gerir funcoes administrativas superiores.";
  }

  if (message.includes("transition")) {
    return "O estado do registo mudou. Actualize a pagina e tente novamente.";
  }

  return "Nao foi possivel concluir a operacao administrativa.";
}

function revalidateAdmin() {
  revalidatePath("/admin");
}

function adminError(message: string): AdminActionState {
  return { status: "error", message };
}

function adminSuccess(message: string): AdminActionState {
  return { status: "success", message };
}
