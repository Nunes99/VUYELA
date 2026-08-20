"use server";

import { revalidatePath } from "next/cache";

import { isNotificationEmailConfigured, isSupabaseConfigured } from "@/lib/env";
import { requireRouteAccess } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  isCampaignPlannedChannel,
  isCampaignRewardType,
  isCampaignType,
  isDeliverableCampaignChannel
} from "./model";
import type {
  CampaignAudienceCriteria,
  CampaignPlannedChannel,
  CampaignRewardType,
  CampaignRuleConfig,
  CampaignType
} from "./model";

export interface CampaignActionState {
  status: "idle" | "error" | "success";
  message: string;
  campaignId: string | null;
}

interface CampaignCreateRow {
  campaign_id: string;
  campaign_status: string;
  eligible_count: number;
  consented_count: number;
}

interface ParsedCampaignForm {
  businessId: string;
  name: string;
  campaignType: CampaignType;
  startsAt: string | null;
  endsAt: string | null;
  rules: CampaignRuleConfig;
  audience: CampaignAudienceCriteria;
  saveAsDraft: boolean;
}

type ParseResult =
  { ok: true; value: ParsedCampaignForm } | { ok: false; state: CampaignActionState };

type StringParseResult = { ok: true; value: string } | { ok: false; state: CampaignActionState };

export const initialCampaignActionState: CampaignActionState = {
  status: "idle",
  message: "",
  campaignId: null
};

export async function submitCampaignAction(
  _previousState: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const parsed = parseCampaignForm(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  if (!isSupabaseConfigured()) {
    return createErrorState(
      "Supabase ainda nao esta configurado neste ambiente. Configure as variaveis antes de criar campanhas."
    );
  }

  await requireRouteAccess("/negocio", "/negocio/campanhas");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_campaign_with_audience", {
    p_business_id: parsed.value.businessId,
    p_name: parsed.value.name,
    p_campaign_type: parsed.value.campaignType,
    p_starts_at: parsed.value.startsAt,
    p_ends_at: parsed.value.endsAt,
    p_rules: parsed.value.rules,
    p_audience: parsed.value.audience,
    p_save_as_draft: parsed.value.saveAsDraft
  });

  if (error) {
    if (error.message.includes("Campaign limit reached for subscription plan")) {
      return createErrorState("O limite de campanhas abertas do plano foi atingido.");
    }

    return createErrorState("Nao foi possivel criar a campanha. Confirme permissoes e regras.");
  }

  const row = Array.isArray(data) ? (data[0] as CampaignCreateRow | undefined) : undefined;

  if (!row) {
    return createErrorState("Campanha criada, mas a resposta de analitica veio incompleta.");
  }

  revalidatePath("/negocio");
  revalidatePath("/negocio/campanhas");

  return {
    status: "success",
    message: `Campanha ${row.campaign_status} criada com ${row.eligible_count.toLocaleString(
      "pt-MZ"
    )} clientes elegiveis.`,
    campaignId: row.campaign_id
  };
}

function parseCampaignForm(formData: FormData): ParseResult {
  const businessId = getRequiredFormString(formData, "businessId", "Negocio");
  if (!businessId.ok) {
    return businessId;
  }

  const name = getRequiredFormString(formData, "name", "Nome da campanha");
  if (!name.ok) {
    return name;
  }

  if (name.value.length < 3 || name.value.length > 80) {
    return createParseError("O nome da campanha deve ter entre 3 e 80 caracteres.");
  }

  const campaignTypeValue = getRequiredFormString(formData, "campaignType", "Tipo");
  if (!campaignTypeValue.ok) {
    return campaignTypeValue;
  }

  if (!isCampaignType(campaignTypeValue.value)) {
    return createParseError("Tipo de campanha invalido.");
  }

  const rewardTypeValue = getRequiredFormString(formData, "rewardType", "Beneficio");
  if (!rewardTypeValue.ok) {
    return rewardTypeValue;
  }

  if (!isCampaignRewardType(rewardTypeValue.value)) {
    return createParseError("Beneficio da campanha invalido.");
  }

  const plannedChannelValue = getRequiredFormString(formData, "plannedChannel", "Canal");
  if (!plannedChannelValue.ok) {
    return plannedChannelValue;
  }

  if (!isCampaignPlannedChannel(plannedChannelValue.value)) {
    return createParseError("Canal planeado invalido.");
  }

  if (!isDeliverableCampaignChannel(plannedChannelValue.value)) {
    return createParseError("Este canal ainda nao esta disponivel para envio.");
  }

  if (plannedChannelValue.value === "email" && !isNotificationEmailConfigured()) {
    return createParseError("O canal de email ainda nao esta configurado.");
  }

  const startsAt = parseOptionalMaputoDate(formData, "startsAt");
  if (!startsAt.ok) {
    return startsAt;
  }

  const endsAt = parseOptionalMaputoDate(formData, "endsAt");
  if (!endsAt.ok) {
    return endsAt;
  }

  if (startsAt.value && endsAt.value && new Date(endsAt.value) <= new Date(startsAt.value)) {
    return createParseError("A data de fim deve ser posterior ao inicio.");
  }

  const rules = parseRules(formData, rewardTypeValue.value, plannedChannelValue.value);
  if (!rules.ok) {
    return rules;
  }

  const audience = parseAudience(formData, campaignTypeValue.value, plannedChannelValue.value);
  if (!audience.ok) {
    return audience;
  }

  return {
    ok: true,
    value: {
      businessId: businessId.value,
      name: name.value,
      campaignType: campaignTypeValue.value,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      rules: rules.value,
      audience: audience.value,
      saveAsDraft: getFormString(formData, "intent") === "draft"
    }
  };
}

function parseRules(
  formData: FormData,
  rewardType: CampaignRewardType,
  plannedChannel: CampaignPlannedChannel
): { ok: true; value: CampaignRuleConfig } | { ok: false; state: CampaignActionState } {
  const rules: CampaignRuleConfig = {
    rewardType,
    plannedChannel,
    notificationSubject: "",
    notificationBody: ""
  };

  const notificationSubject = getRequiredFormString(
    formData,
    "notificationSubject",
    "Assunto da notificacao"
  );
  if (!notificationSubject.ok) {
    return notificationSubject;
  }

  const notificationBody = getRequiredFormString(
    formData,
    "notificationBody",
    "Mensagem da notificacao"
  );
  if (!notificationBody.ok) {
    return notificationBody;
  }

  if (notificationSubject.value.length > 120) {
    return createParseError("O assunto da notificacao deve ter ate 120 caracteres.");
  }

  if (notificationBody.value.length < 10 || notificationBody.value.length > 2000) {
    return createParseError("A mensagem deve ter entre 10 e 2000 caracteres.");
  }

  rules.notificationSubject = notificationSubject.value;
  rules.notificationBody = notificationBody.value;

  if (rewardType === "points_multiplier") {
    const pointsMultiplier = parseOptionalNumber(formData, "pointsMultiplier", "Multiplicador");
    if (!pointsMultiplier.ok) {
      return pointsMultiplier;
    }

    rules.pointsMultiplier = pointsMultiplier.value ?? 2;

    if (rules.pointsMultiplier < 1 || rules.pointsMultiplier > 10) {
      return createParseError("O multiplicador deve estar entre 1 e 10.");
    }
  }

  if (rewardType === "bonus_points") {
    const bonusPoints = parseOptionalInteger(formData, "bonusPoints", "Pontos bonus");
    if (!bonusPoints.ok) {
      return bonusPoints;
    }

    rules.bonusPoints = bonusPoints.value ?? 0;

    if (rules.bonusPoints <= 0 || rules.bonusPoints > 100_000) {
      return createParseError("Os pontos bonus devem estar entre 1 e 100000.");
    }
  }

  if (rewardType === "discount_percent") {
    const discountPercent = parseOptionalNumber(formData, "discountPercent", "Desconto");
    if (!discountPercent.ok) {
      return discountPercent;
    }

    rules.discountPercent = discountPercent.value ?? 0;

    if (rules.discountPercent <= 0 || rules.discountPercent > 100) {
      return createParseError("O desconto deve estar entre 1% e 100%.");
    }
  }

  return { ok: true, value: rules };
}

function parseAudience(
  formData: FormData,
  campaignType: CampaignType,
  plannedChannel: CampaignPlannedChannel
): { ok: true; value: CampaignAudienceCriteria } | { ok: false; state: CampaignActionState } {
  const minPurchaseCount = parseOptionalInteger(formData, "minPurchaseCount", "Compras minimas");
  if (!minPurchaseCount.ok) {
    return minPurchaseCount;
  }

  const maxPurchaseCount = parseOptionalInteger(formData, "maxPurchaseCount", "Compras maximas");
  if (!maxPurchaseCount.ok) {
    return maxPurchaseCount;
  }

  const minTotalSpent = parseOptionalMoney(formData, "minTotalSpentMzn", "Gasto minimo");
  if (!minTotalSpent.ok) {
    return minTotalSpent;
  }

  const inactiveDays = parseOptionalInteger(formData, "lastPurchaseBeforeDays", "Dias inactivo");
  if (!inactiveDays.ok) {
    return inactiveDays;
  }

  const minPointsBalance = parseOptionalInteger(formData, "minPointsBalance", "Pontos minimos");
  if (!minPointsBalance.ok) {
    return minPointsBalance;
  }

  const city = getFormString(formData, "city");

  if (campaignType === "location" && !city) {
    return createParseError("Campanhas por localizacao precisam de uma cidade.");
  }

  return {
    ok: true,
    value: {
      city: city || undefined,
      tierName: getFormString(formData, "tierName") || undefined,
      minPurchaseCount: minPurchaseCount.value ?? undefined,
      maxPurchaseCount: maxPurchaseCount.value ?? undefined,
      minTotalSpentMznMinor: minTotalSpent.value ?? undefined,
      lastPurchaseBeforeDays:
        inactiveDays.value ?? (campaignType === "inactive_customer" ? 30 : undefined),
      minPointsBalance: minPointsBalance.value ?? undefined,
      requiresMarketingConsent:
        plannedChannel !== "in_app" || getFormString(formData, "requiresMarketingConsent") === "on"
    }
  };
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredFormString(formData: FormData, key: string, label: string): StringParseResult {
  const value = getFormString(formData, key);

  if (!value) {
    return createParseError(`${label} e obrigatorio.`);
  }

  return {
    ok: true,
    value
  };
}

function parseOptionalInteger(formData: FormData, key: string, label: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return { ok: true as const, value: null };
  }

  if (!/^\d+$/.test(value)) {
    return createParseError(`${label} deve ser um numero inteiro.`);
  }

  return { ok: true as const, value: Number(value) };
}

function parseOptionalNumber(formData: FormData, key: string, label: string) {
  const value = getFormString(formData, key).replace(",", ".");

  if (!value) {
    return { ok: true as const, value: null };
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    return createParseError(`${label} deve ser numerico.`);
  }

  return { ok: true as const, value: Number(value) };
}

function parseOptionalMoney(formData: FormData, key: string, label: string) {
  const value = getFormString(formData, key).replace(",", ".");

  if (!value) {
    return { ok: true as const, value: null };
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    return createParseError(`${label} deve usar MZN com ate duas casas decimais.`);
  }

  const [mznPart, centsPart = ""] = value.split(".");

  return { ok: true as const, value: Number(mznPart) * 100 + Number(centsPart.padEnd(2, "0")) };
}

function parseOptionalMaputoDate(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return { ok: true as const, value: null };
  }

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  const candidate = hasTimezone ? value : `${value}${hasSeconds ? "" : ":00"}+02:00`;
  const date = new Date(candidate);

  if (!Number.isFinite(date.getTime())) {
    return createParseError("Data invalida.");
  }

  return { ok: true as const, value: date.toISOString() };
}

function createParseError(message: string): { ok: false; state: CampaignActionState } {
  return {
    ok: false,
    state: createErrorState(message)
  };
}

function createErrorState(message: string): CampaignActionState {
  return {
    status: "error",
    message,
    campaignId: null
  };
}
