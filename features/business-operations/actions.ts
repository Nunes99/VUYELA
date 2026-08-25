"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRouteAccess } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  isCatalogItemKind,
  isManageableBusinessMemberRole,
  type BusinessInvitationActionState
} from "./model";

interface InvitationRpcRow {
  invitation_id: string;
  invitation_token: string;
  expires_at: string;
}

const initialInvitationState: BusinessInvitationActionState = {
  status: "idle",
  message: ""
};

export async function manageBusinessBranchAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio");
  const businessId = field(formData, "businessId");
  const action = field(formData, "operation");
  const name = field(formData, "name");
  const city = field(formData, "city");

  if (
    !businessId ||
    !isAllowedAction(action, ["create", "update", "suspend", "activate", "delete"])
  ) {
    redirectWithResult("filiais", businessId, "erro");
  }
  if ((action === "create" || action === "update") && (name.length < 2 || city.length < 2)) {
    redirectWithResult("filiais", businessId, "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_business_branch", {
    p_business_id: businessId,
    p_branch_id: nullableField(formData, "branchId"),
    p_action: action,
    p_name: name,
    p_slug: field(formData, "slug") || slugify(name),
    p_phone: field(formData, "phone"),
    p_email: field(formData, "email"),
    p_address_line: field(formData, "addressLine"),
    p_city: city,
    p_province: field(formData, "province"),
    p_is_primary: field(formData, "isPrimary") === "on"
  });

  if (error) {
    redirectWithResult("filiais", businessId, operationErrorCode(error.message));
  }

  revalidateBusinessPaths();
  redirectWithResult("filiais", businessId, "guardado");
}

export async function inviteBusinessMemberAction(
  _previousState: BusinessInvitationActionState = initialInvitationState,
  formData: FormData
): Promise<BusinessInvitationActionState> {
  void _previousState;
  await requireRouteAccess("/negocio", "/negocio");
  const businessId = field(formData, "businessId");
  const role = field(formData, "role");
  const email = field(formData, "email").toLowerCase();
  const phone = field(formData, "phone");

  if (!businessId || !isManageableBusinessMemberRole(role) || (!email && !phone)) {
    return { status: "error", message: "Indique um contacto e uma função válidos." };
  }
  if ((role === "cashier" || role === "branch_manager") && !field(formData, "branchId")) {
    return { status: "error", message: "Selecione a filial para esta função." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_business_member_invitation", {
    p_business_id: businessId,
    p_email: email || null,
    p_phone: phone || null,
    p_role: role,
    p_branch_id: nullableField(formData, "branchId")
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("already belongs")
        ? "Este contacto já pertence à equipa do negócio."
        : "Não foi possível criar o convite. Confirme os dados e tente novamente."
    };
  }

  const row = Array.isArray(data) ? (data[0] as InvitationRpcRow | undefined) : undefined;
  if (!row?.invitation_token) {
    return { status: "error", message: "O convite foi criado sem uma ligação utilizável." };
  }

  revalidateBusinessPaths();
  return {
    status: "success",
    message: `Convite válido até ${formatDate(row.expires_at)}. Partilhe esta ligação apenas com a pessoa convidada.`,
    invitePath: `/negocio/convite?token=${encodeURIComponent(row.invitation_token)}`
  };
}

export async function revokeBusinessInvitationAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio");
  const businessId = field(formData, "businessId");
  const invitationId = field(formData, "invitationId");
  if (!businessId || !invitationId) redirectWithResult("equipa", businessId, "erro");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_business_member_invitation", {
    p_business_id: businessId,
    p_invitation_id: invitationId
  });
  if (error) redirectWithResult("equipa", businessId, "erro");

  revalidateBusinessPaths();
  redirectWithResult("equipa", businessId, "guardado");
}

export async function acceptBusinessInvitationAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/cliente", "/negocio/convite");
  const token = field(formData, "token");
  if (!/^[0-9a-f]{48}$/.test(token)) redirect("/negocio/convite?estado=invalido");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_business_member_invitation", { p_token: token });
  if (error) redirect("/negocio/convite?estado=invalido");

  revalidateBusinessPaths();
  redirect("/negocio?resultado=convite-aceite");
}

export async function manageBusinessMemberAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio");
  const businessId = field(formData, "businessId");
  const memberId = field(formData, "memberId");
  const action = field(formData, "operation");
  const role = field(formData, "role");
  if (
    !businessId ||
    !memberId ||
    !isAllowedAction(action, ["update", "suspend", "activate", "remove"]) ||
    !isManageableBusinessMemberRole(role)
  ) {
    redirectWithResult("equipa", businessId, "erro");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_business_member", {
    p_business_id: businessId,
    p_member_id: memberId,
    p_action: action,
    p_role: role,
    p_branch_id: nullableField(formData, "branchId")
  });
  if (error) redirectWithResult("equipa", businessId, operationErrorCode(error.message));

  revalidateBusinessPaths();
  redirectWithResult("equipa", businessId, "guardado");
}

export async function manageBusinessCatalogItemAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio");
  const businessId = field(formData, "businessId");
  const action = field(formData, "operation");
  const kind = field(formData, "kind");
  const name = field(formData, "name");
  const priceMznMinor = parseMoneyMinor(field(formData, "priceMzn"));
  const sortOrder = integerField(formData, "sortOrder", 100);

  if (
    !businessId ||
    !isAllowedAction(action, ["create", "update", "suspend", "activate", "delete"]) ||
    !isCatalogItemKind(kind) ||
    priceMznMinor === null ||
    sortOrder < 0 ||
    ((action === "create" || action === "update") && name.length < 2)
  ) {
    redirectWithResult("catalogo", businessId, "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_business_catalog_item", {
    p_business_id: businessId,
    p_item_id: nullableField(formData, "itemId"),
    p_action: action,
    p_branch_id: nullableField(formData, "branchId"),
    p_kind: kind,
    p_sku: field(formData, "sku"),
    p_name: name,
    p_description: field(formData, "description"),
    p_price_mzn_minor: priceMznMinor,
    p_sort_order: sortOrder
  });
  if (error) redirectWithResult("catalogo", businessId, operationErrorCode(error.message));

  revalidateBusinessPaths();
  redirectWithResult("catalogo", businessId, "guardado");
}

export async function manageCustomerCardAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio");
  const businessId = field(formData, "businessId");
  const cardId = field(formData, "cardId");
  const action = field(formData, "operation");
  const view = field(formData, "returnView") === "clientes" ? "clientes" : "cartoes";
  if (!businessId || !cardId || !isAllowedAction(action, ["block", "activate", "archive"])) {
    redirectWithResult(view, businessId, "erro");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_customer_card_status", {
    p_business_id: businessId,
    p_card_id: cardId,
    p_action: action,
    p_reason: field(formData, "reason")
  });
  if (error) redirectWithResult(view, businessId, operationErrorCode(error.message));

  revalidateBusinessPaths();
  redirectWithResult(view, businessId, "guardado");
}

export async function manageCampaignStateAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio/campanhas");
  const businessId = field(formData, "businessId");
  const campaignId = field(formData, "campaignId");
  const action = field(formData, "operation");
  if (
    !businessId ||
    !campaignId ||
    !isAllowedAction(action, ["activate", "pause", "resume", "complete", "cancel", "duplicate"])
  ) {
    redirectCampaigns(businessId, "erro");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_campaign_state", {
    p_business_id: businessId,
    p_campaign_id: campaignId,
    p_action: action
  });
  if (error) redirectCampaigns(businessId, "erro");

  revalidateBusinessPaths();
  redirectCampaigns(businessId, "guardado");
}

export async function updateBusinessCampaignAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio/campanhas");
  const businessId = field(formData, "businessId");
  const campaignId = field(formData, "campaignId");
  const name = field(formData, "name");
  const startsAt = optionalDateTime(formData, "startsAt");
  const endsAt = optionalDateTime(formData, "endsAt");
  if (!businessId || !campaignId || name.length < 3) {
    redirectCampaigns(businessId, "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_business_campaign", {
    p_business_id: businessId,
    p_campaign_id: campaignId,
    p_name: name,
    p_starts_at: startsAt,
    p_ends_at: endsAt
  });
  if (error) redirectCampaigns(businessId, operationErrorCode(error.message));

  revalidateBusinessPaths();
  redirectCampaigns(businessId, "guardado");
}

export async function manageBusinessOfferAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", "/negocio/campanhas");
  const businessId = field(formData, "businessId");
  const action = field(formData, "operation");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const startsAt = optionalDateTime(formData, "startsAt");
  const endsAt = optionalDateTime(formData, "endsAt");

  if (
    !businessId ||
    !isAllowedAction(action, ["create", "update", "suspend", "activate", "delete"]) ||
    ((action === "create" || action === "update") && (title.length < 3 || description.length < 10))
  ) {
    redirectCampaigns(businessId, "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_business_offer", {
    p_business_id: businessId,
    p_offer_id: nullableField(formData, "offerId"),
    p_action: action,
    p_campaign_id: nullableField(formData, "campaignId"),
    p_slug: field(formData, "slug") || slugify(title),
    p_title: title,
    p_description: description,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_is_public: field(formData, "isPublic") === "on"
  });
  if (error) redirectCampaigns(businessId, operationErrorCode(error.message));

  revalidateBusinessPaths();
  redirectCampaigns(businessId, "guardado");
}

function revalidateBusinessPaths() {
  revalidatePath("/negocio");
  revalidatePath("/negocio/campanhas");
  revalidatePath("/cliente");
  revalidatePath("/estabelecimentos");
  revalidatePath("/ofertas");
}

function redirectWithResult(view: string, businessId: string, result: string): never {
  const params = new URLSearchParams({ vista: view, resultado: result });
  if (businessId) params.set("businessId", businessId);
  redirect(`/negocio?${params.toString()}`);
}

function redirectCampaigns(businessId: string, result: string): never {
  const params = new URLSearchParams({ resultado: result });
  if (businessId) params.set("businessId", businessId);
  redirect(`/negocio/campanhas?${params.toString()}`);
}

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableField(formData: FormData, key: string): string | null {
  return field(formData, key) || null;
}

function integerField(formData: FormData, key: string, fallback: number): number {
  const value = field(formData, key);
  return /^\d+$/.test(value) ? Number(value) : fallback;
}

function parseMoneyMinor(value: string): number | null {
  const normalized = value.replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

function optionalDateTime(formData: FormData, key: string): string | null {
  const value = field(formData, key);
  if (!value) return null;
  const date = new Date(`${value}:00+02:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isAllowedAction<T extends string>(value: string, actions: readonly T[]): value is T {
  return actions.includes(value as T);
}

function operationErrorCode(message: string): string {
  if (message.includes("limit")) return "limite-atingido";
  if (message.includes("cannot be deleted") || message.includes("cannot be suspended")) {
    return "operacao-bloqueada";
  }
  return "erro";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium" }).format(new Date(value));
}
