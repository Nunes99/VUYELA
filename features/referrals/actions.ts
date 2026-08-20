"use server";

import { revalidatePath } from "next/cache";

import { requireRouteAccess } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ReferralActionState {
  status: "idle" | "error" | "success";
  message: string;
  referralCode: string | null;
}

export interface ReferralProgramActionState {
  status: "idle" | "error" | "success";
  message: string;
}

interface CreatedReferralRow {
  referral_id: string;
  referral_code: string;
  expires_at: string;
}

interface AcceptedReferralRow {
  referral_id: string;
  outcome: string;
}

export const initialReferralActionState: ReferralActionState = {
  status: "idle",
  message: "",
  referralCode: null
};

export const initialReferralProgramActionState: ReferralProgramActionState = {
  status: "idle",
  message: ""
};

export async function createReferralAction(
  _previousState: ReferralActionState,
  formData: FormData
): Promise<ReferralActionState> {
  const cardId = getFormString(formData, "cardId");

  if (!isUuid(cardId)) {
    return referralError("Seleccione um cartao valido.");
  }

  if (!isSupabaseConfigured()) {
    return referralError("Supabase ainda nao esta configurado neste ambiente.");
  }

  await requireRouteAccess("/cliente", "/cliente/indicacoes");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_customer_referral", {
    p_referrer_card_id: cardId
  });

  if (error) {
    return referralError(
      error.message.includes("limit")
        ? "Atingiu o limite de convites abertos para este negocio."
        : "Nao foi possivel criar o convite. Confirme se o programa esta activo."
    );
  }

  const row = Array.isArray(data) ? (data[0] as CreatedReferralRow | undefined) : undefined;

  if (!row) {
    return referralError("O convite foi criado, mas a resposta veio incompleta.");
  }

  revalidateReferralPaths();

  return {
    status: "success",
    message: `Convite valido ate ${formatDate(row.expires_at)}.`,
    referralCode: row.referral_code
  };
}

export async function acceptReferralAction(
  _previousState: ReferralActionState,
  formData: FormData
): Promise<ReferralActionState> {
  const referralCode = getFormString(formData, "referralCode").toUpperCase();

  if (!/^VY-[A-Z0-9]{8}$/.test(referralCode)) {
    return referralError("Introduza um codigo VUYELA valido.");
  }

  if (!isSupabaseConfigured()) {
    return referralError("Supabase ainda nao esta configurado neste ambiente.");
  }

  await requireRouteAccess("/cliente", "/cliente/indicacoes");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("accept_customer_referral", {
    p_referral_code: referralCode
  });

  if (error) {
    return referralError("Nao foi possivel validar este convite.");
  }

  const row = Array.isArray(data) ? (data[0] as AcceptedReferralRow | undefined) : undefined;

  if (!row) {
    return referralError("A validacao do convite veio incompleta.");
  }

  if (row.outcome !== "accepted") {
    return referralError(getReferralOutcomeMessage(row.outcome));
  }

  revalidateReferralPaths();

  return {
    status: "success",
    message: "Convite aceite. O premio fica elegivel depois da compra minima.",
    referralCode: null
  };
}

export async function configureReferralProgramAction(
  _previousState: ReferralProgramActionState,
  formData: FormData
): Promise<ReferralProgramActionState> {
  const businessId = getFormString(formData, "businessId");
  const minimumPurchase = parseMznToMinor(formData, "minimumPurchaseMzn");
  const referrerRewardPoints = parseInteger(formData, "referrerRewardPoints");
  const referredRewardPoints = parseInteger(formData, "referredRewardPoints");
  const inviteValidDays = parseInteger(formData, "inviteValidDays");
  const maxOpenInvites = parseInteger(formData, "maxOpenInvites");
  const rewardLimitCount = parseInteger(formData, "rewardLimitCount");
  const rewardLimitPeriodDays = parseInteger(formData, "rewardLimitPeriodDays");

  if (
    !isUuid(businessId) ||
    minimumPurchase === null ||
    referrerRewardPoints === null ||
    referredRewardPoints === null ||
    inviteValidDays === null ||
    maxOpenInvites === null ||
    rewardLimitCount === null ||
    rewardLimitPeriodDays === null
  ) {
    return programError("Preencha todas as regras com valores validos.");
  }

  if (
    minimumPurchase < 0 ||
    referrerRewardPoints < 1 ||
    referrerRewardPoints > 1000000 ||
    referredRewardPoints < 0 ||
    referredRewardPoints > 1000000 ||
    inviteValidDays < 1 ||
    inviteValidDays > 90 ||
    maxOpenInvites < 1 ||
    maxOpenInvites > 100 ||
    rewardLimitCount < 1 ||
    rewardLimitCount > 1000 ||
    rewardLimitPeriodDays < 1 ||
    rewardLimitPeriodDays > 365
  ) {
    return programError("Uma ou mais regras estao fora dos limites permitidos.");
  }

  if (!isSupabaseConfigured()) {
    return programError("Supabase ainda nao esta configurado neste ambiente.");
  }

  await requireRouteAccess("/negocio", "/negocio/indicacoes");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("configure_referral_program", {
    p_business_id: businessId,
    p_is_active: getFormString(formData, "isActive") === "on",
    p_qualifying_purchase_minimum_mzn_minor: minimumPurchase,
    p_referrer_reward_points: referrerRewardPoints,
    p_referred_reward_points: referredRewardPoints,
    p_invite_valid_days: inviteValidDays,
    p_max_open_invites_per_referrer: maxOpenInvites,
    p_reward_limit_count: rewardLimitCount,
    p_reward_limit_period_days: rewardLimitPeriodDays
  });

  if (error) {
    return programError("Nao foi possivel guardar o programa. Confirme o negocio e as regras.");
  }

  revalidateReferralPaths();

  return { status: "success", message: "Programa de indicacoes actualizado." };
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseInteger(formData: FormData, key: string): number | null {
  const value = getFormString(formData, key);

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseMznToMinor(formData: FormData, key: string): number | null {
  const value = getFormString(formData, key).replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [mzn, cents = ""] = value.split(".");
  const parsed = Number(mzn) * 100 + Number(cents.padEnd(2, "0"));

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function referralError(message: string): ReferralActionState {
  return { status: "error", message, referralCode: null };
}

function programError(message: string): ReferralProgramActionState {
  return { status: "error", message };
}

function getReferralOutcomeMessage(outcome: string): string {
  const messages: Record<string, string> = {
    expired: "Este convite expirou.",
    blocked: "Este convite nao cumpre as regras de elegibilidade.",
    program_inactive: "O programa de indicacoes deste negocio esta inactivo.",
    card_required: "Adira primeiro ao programa de fidelizacao deste negocio.",
    already_referred: "Este cartao ja esta associado a outra indicacao.",
    rewarded: "Este convite ja foi premiado.",
    reversed: "O premio deste convite foi revertido.",
    cancelled: "Este convite foi cancelado."
  };

  return messages[outcome] ?? "Este convite ja nao esta disponivel.";
}

function revalidateReferralPaths() {
  revalidatePath("/cliente");
  revalidatePath("/cliente/indicacoes");
  revalidatePath("/negocio");
  revalidatePath("/negocio/indicacoes");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
