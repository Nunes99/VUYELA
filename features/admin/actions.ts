"use server";

import { isIP } from "node:net";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { AdminAccessDeniedError, requireAdminCapability } from "@/lib/auth/admin-access";
import { isProfileRole } from "@/lib/auth/rbac";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import type { AdminActionState } from "@/features/admin/state";

export async function reviewBusinessAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const businessId = getFormString(formData, "businessId");
  const decision = getFormString(formData, "decision");
  const note = getFormString(formData, "note");

  if (!isUuid(businessId) || !["approve", "reject", "suspend", "reactivate"].includes(decision)) {
    return adminError("Pedido de revisão inválido.");
  }

  if (["reject", "suspend"].includes(decision) && note.length < 4) {
    return adminError("Registe um motivo com pelo menos 4 caracteres.");
  }

  const principal = await getActionPrincipal("businesses_review");

  if (!principal) {
    return adminError("A sua função não permite rever negócios.");
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
  return adminSuccess("Estado do negócio atualizado e auditado.");
}

export async function saveBusinessCategoryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const categoryId = getFormString(formData, "categoryId");
  const slug = getFormString(formData, "slug").toLowerCase();
  const name = getFormString(formData, "name");
  const description = getFormString(formData, "description");
  const sortOrder = parseRequiredInteger(formData.get("sortOrder"), 0, 9999);
  const note = getFormString(formData, "note");

  if (
    (categoryId && !isUuid(categoryId)) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    name.length < 2 ||
    description.length < 10 ||
    sortOrder === undefined ||
    note.length < 4
  ) {
    return adminError("Revise o nome, identificador, descrição, ordem e motivo da alteração.");
  }

  const principal = await getActionPrincipal("categories_manage");
  if (!principal) {
    return adminError("A sua função não permite gerir categorias.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_save_business_category", {
    p_actor_profile_id: principal.profileId,
    p_category_id: categoryId || null,
    p_slug: slug,
    p_name: name,
    p_description: description,
    p_sort_order: sortOrder,
    p_is_active: formData.get("isActive") === "on",
    p_note: note,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  revalidatePath("/estabelecimentos");
  revalidatePath("/");
  return adminSuccess(
    categoryId ? "Categoria atualizada e auditada." : "Categoria criada e auditada."
  );
}

export async function updateProfileRoleAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const targetProfileId = getFormString(formData, "targetProfileId");
  const newRole = getFormString(formData, "newRole");
  const note = getFormString(formData, "note");

  if (!isUuid(targetProfileId) || !isProfileRole(newRole) || note.length < 4) {
    return adminError("Selecione uma função e registe o motivo da alteração.");
  }

  const principal = await getActionPrincipal("users_manage");

  if (!principal) {
    return adminError("A sua função não permite alterar permissões.");
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
  return adminSuccess("Função do utilizador atualizada e auditada.");
}

export async function updateProfileAccountStatusAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const targetProfileId = getFormString(formData, "targetProfileId");
  const status = getFormString(formData, "status");
  const reason = getFormString(formData, "reason");

  if (
    !isUuid(targetProfileId) ||
    !["active", "suspended"].includes(status) ||
    (status === "suspended" && reason.length < 4)
  ) {
    return adminError("Selecione um estado e registe o respetivo motivo.");
  }

  const principal = await getActionPrincipal("users_manage");
  if (!principal) {
    return adminError("A sua função não permite alterar o estado de contas.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc(
    "admin_set_profile_account_status",
    {
      p_actor_profile_id: principal.profileId,
      p_target_profile_id: targetProfileId,
      p_status: status,
      p_reason: reason || "Reativação aprovada pelo administrador",
      p_ip_address: auditContext.ipAddress,
      p_user_agent: auditContext.userAgent
    }
  );

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess(
    status === "suspended" ? "Conta suspensa e acesso bloqueado." : "Conta reativada com sucesso."
  );
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
    return adminError("Atualização de suporte inválida.");
  }

  if (["resolved", "closed"].includes(status) && resolutionNote.length < 4) {
    return adminError("Registe a resolução antes de concluir o pedido.");
  }

  const principal = await getActionPrincipal("support_manage");

  if (!principal) {
    return adminError("A sua função não permite gerir suporte.");
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
  return adminSuccess("Pedido de suporte atualizado e auditado.");
}

export async function addSupportTicketMessageAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const ticketId = getFormString(formData, "ticketId");
  const body = getFormString(formData, "body");
  const isInternal = formData.get("isInternal") === "on";

  if (!isUuid(ticketId) || body.length < 2) {
    return adminError("Escreva uma resposta antes de enviar.");
  }

  const principal = await getActionPrincipal("support_manage");
  if (!principal) {
    return adminError("A sua função não permite responder a pedidos de suporte.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc(
    "admin_add_support_ticket_message",
    {
      p_actor_profile_id: principal.profileId,
      p_ticket_id: ticketId,
      p_body: body,
      p_is_internal: isInternal,
      p_ip_address: auditContext.ipAddress,
      p_user_agent: auditContext.userAgent
    }
  );

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess(
    isInternal ? "Nota interna registada." : "Resposta colocada na fila de envio."
  );
}

export async function reviewFraudEventAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fraudEventId = getFormString(formData, "fraudEventId");
  const resolution = getFormString(formData, "resolution");
  const note = getFormString(formData, "note");

  if (!isUuid(fraudEventId) || !["resolve", "reopen"].includes(resolution) || note.length < 4) {
    return adminError("Registe uma decisão e o respetivo motivo.");
  }

  const principal = await getActionPrincipal("fraud_review");

  if (!principal) {
    return adminError("A sua função não permite rever alertas de fraude.");
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
  return adminSuccess("Alerta de fraude atualizado e auditado.");
}

export async function triageFraudEventAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fraudEventId = getFormString(formData, "fraudEventId");
  const decision = getFormString(formData, "decision");
  const assignedToProfileId = getFormString(formData, "assignedToProfileId");
  const note = getFormString(formData, "note");

  if (
    !isUuid(fraudEventId) ||
    !["review", "escalate", "resolve", "dismiss", "reopen"].includes(decision) ||
    (assignedToProfileId && !isUuid(assignedToProfileId)) ||
    (["escalate", "resolve", "dismiss"].includes(decision) && note.length < 4)
  ) {
    return adminError("Selecione uma decisão válida e registe a nota necessária.");
  }

  const principal = await getActionPrincipal("fraud_review");
  if (!principal) {
    return adminError("A sua função não permite fazer a triagem de fraude.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_triage_fraud_event", {
    p_actor_profile_id: principal.profileId,
    p_fraud_event_id: fraudEventId,
    p_decision: decision,
    p_assigned_to_profile_id: assignedToProfileId || null,
    p_note: note || null,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  return adminSuccess("Triagem de fraude atualizada e auditada.");
}

export async function updatePlatformSettingsAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const platformName = getFormString(formData, "platformName");
  const locale = getFormString(formData, "locale");
  const currency = getFormString(formData, "currency").toUpperCase();
  const timeZone = getFormString(formData, "timeZone");
  const securityEmail = getFormString(formData, "securityEmail").toLowerCase();
  const note = getFormString(formData, "note");

  if (
    platformName.length < 2 ||
    !/^[a-z]{2}-[A-Z]{2}$/.test(locale) ||
    !/^[A-Z]{3}$/.test(currency) ||
    timeZone.length < 3 ||
    !/^\S+@\S+\.\S+$/.test(securityEmail) ||
    note.length < 4
  ) {
    return adminError("Revise as definições e registe o motivo da alteração.");
  }

  const principal = await getActionPrincipal("users_manage");
  if (!principal) {
    return adminError("A sua função não permite alterar definições globais.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_update_platform_settings", {
    p_actor_profile_id: principal.profileId,
    p_platform_name: platformName,
    p_locale: locale,
    p_currency: currency,
    p_timezone: timeZone,
    p_security_email: securityEmail,
    p_privileged_mfa_required: formData.get("privilegedMfaRequired") === "on",
    p_fraud_alerts: formData.get("fraudAlerts") === "on",
    p_support_alerts: formData.get("supportAlerts") === "on",
    p_note: note,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateAdmin();
  revalidatePath("/");
  return adminSuccess("Definições globais atualizadas e auditadas.");
}

export async function assignSubscriptionPlanAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const businessId = getFormString(formData, "businessId");
  const planId = getFormString(formData, "planId");
  const status = getFormString(formData, "status");
  const note = getFormString(formData, "note");

  if (
    !isUuid(businessId) ||
    !isUuid(planId) ||
    !["trialing", "active", "paused"].includes(status) ||
    note.length < 4
  ) {
    return adminError("Selecione um plano, estado e motivo válidos.");
  }

  const principal = await getActionPrincipal("subscriptions_manage");

  if (!principal) {
    return adminError("A sua função não permite alterar subscrições.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_assign_subscription_plan", {
    p_actor_profile_id: principal.profileId,
    p_business_id: businessId,
    p_plan_id: planId,
    p_status: status,
    p_note: note,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateSubscriptions();
  return adminSuccess("Subscrição atualizada e auditada.");
}

export async function updatePlanEntitlementsAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const planId = getFormString(formData, "planId");
  const monthlyPrice = parseMznMinor(formData.get("monthlyPriceMzn"));
  const branchLimit = parseNullableInteger(formData.get("branchLimit"), 1);
  const staffLimit = parseNullableInteger(formData.get("staffLimit"), 1);
  const campaignLimit = parseNullableInteger(formData.get("campaignLimit"), 0);
  const trialDays = parseRequiredInteger(formData.get("trialDays"), 0, 365);
  const analyticsLevel = getFormString(formData, "analyticsLevel");
  const featureFlags = parseFeatureFlags(getFormString(formData, "featureFlags"));
  const note = getFormString(formData, "note");

  if (
    !isUuid(planId) ||
    monthlyPrice === undefined ||
    branchLimit === undefined ||
    staffLimit === undefined ||
    campaignLimit === undefined ||
    trialDays === undefined ||
    !["none", "basic", "standard", "advanced"].includes(analyticsLevel) ||
    !featureFlags ||
    note.length < 4
  ) {
    return adminError("Revise o preco, limites, funcionalidades e motivo do plano.");
  }

  const principal = await getActionPrincipal("subscriptions_manage");

  if (!principal) {
    return adminError("A sua função não permite configurar planos.");
  }

  const auditContext = await getRequestAuditContext();
  const { error } = await createSupabaseServiceRoleClient().rpc("admin_update_plan_entitlements", {
    p_actor_profile_id: principal.profileId,
    p_plan_id: planId,
    p_monthly_price_mzn_minor: monthlyPrice,
    p_branch_limit: branchLimit,
    p_staff_limit: staffLimit,
    p_campaign_limit: campaignLimit,
    p_analytics_level: analyticsLevel,
    p_feature_flags: featureFlags,
    p_is_public: formData.get("isPublic") === "on",
    p_is_active: formData.get("isActive") === "on",
    p_trial_days: trialDays,
    p_note: note,
    p_ip_address: auditContext.ipAddress,
    p_user_agent: auditContext.userAgent
  });

  if (error) {
    return adminError(getDatabaseActionMessage(error.message));
  }

  revalidateSubscriptions();
  return adminSuccess("Plano e permissões atualizados e auditados.");
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

function parseMznMinor(value: FormDataEntryValue | null): number | null | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : undefined;
}

function parseNullableInteger(
  value: FormDataEntryValue | null,
  minimum: number
): number | null | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : undefined;
}

function parseRequiredInteger(
  value: FormDataEntryValue | null,
  minimum: number,
  maximum: number
): number | undefined {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : undefined;
}

function parseFeatureFlags(value: string): string[] | null {
  const flags = [
    ...new Set(
      value
        .split(",")
        .map((flag) => flag.trim().toLowerCase())
        .filter(Boolean)
    )
  ];

  return flags.every((flag) => /^[a-z][a-z0-9_]{1,63}$/.test(flag)) ? flags : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getDatabaseActionMessage(message: string): string {
  if (message.includes("own role")) {
    return "Não pode alterar a sua própria função administrativa.";
  }

  if (message.includes("final super admin")) {
    return "O último super admin não pode ser despromovido.";
  }

  if (message.includes("privileged platform roles")) {
    return "Apenas um super admin pode gerir funções administrativas superiores.";
  }

  if (message.includes("transition")) {
    return "O estado do registo mudou. Atualize a página e tente novamente.";
  }

  if (message.includes("limit is below current usage")) {
    return "O novo plano fica abaixo do consumo atual do negócio.";
  }

  if (message.includes("limit reached for subscription plan")) {
    return "O limite configurado no plano foi atingido.";
  }

  if (message.includes("category is assigned to businesses")) {
    return "Esta categoria ainda está associada a negócios e não pode ser desativada.";
  }

  if (message.includes("duplicate key")) {
    return "Já existe uma categoria com este identificador.";
  }

  return "Não foi possível concluir a operação administrativa.";
}

function revalidateAdmin() {
  revalidatePath("/admin");
}

function revalidateSubscriptions() {
  revalidateAdmin();
  revalidatePath("/negocio");
  revalidatePath("/negocio/campanhas");
  revalidatePath("/negocio/subscricao");
  revalidatePath("/");
}

function adminError(message: string): AdminActionState {
  return { status: "error", message };
}

function adminSuccess(message: string): AdminActionState {
  return { status: "success", message };
}
