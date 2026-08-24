"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  buildFallbackIdempotencyKey,
  buildPosQuote,
  isPosPaymentMethod,
  isAvailablePosPaymentMethod,
  isValidIdempotencyKey,
  normalizePosCustomerLookup,
  parseMznToMinorUnits
} from "./model";
import { initialPosActionState } from "./state";
import type { PosActionState } from "./state";

interface PosLookupRow {
  customer_card_id: string;
  customer_name: string;
  card_number: string;
  available_points: number;
  point_value_mzn_minor: number;
  maximum_redemption_percent: number | string;
  earn_rate: number | string;
}

interface PosTransactionRow {
  transaction_id: string;
  available_balance: number;
}

export async function submitPosAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const intent = getFormString(formData, "intent");

  if (intent === "identify") {
    return identifyPosCustomerAction(previousState, formData);
  }

  if (intent === "quote") {
    return quotePosTransactionAction(previousState, formData);
  }

  if (intent === "confirm") {
    return confirmPosTransactionAction(previousState, formData);
  }

  if (intent === "reset") {
    return initialPosActionState;
  }

  return createErrorState("Ação de POS inválida.", previousState);
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredFormString(formData: FormData, key: string, label: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return {
      ok: false as const,
      state: createErrorState(`${label} é obrigatório.`)
    };
  }

  return {
    ok: true as const,
    value
  };
}

function createErrorState(message: string, previousState?: PosActionState): PosActionState {
  return {
    ...initialPosActionState,
    ...previousState,
    status: "error",
    message,
    transactionId: null
  };
}

function getSupabaseNotConfiguredState(): PosActionState {
  return createErrorState(
    "Supabase ainda não está configurado neste ambiente. Configure as variáveis antes de usar o POS."
  );
}

export async function identifyPosCustomerAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const businessId = getRequiredFormString(formData, "businessId", "Negócio");
  if (!businessId.ok) {
    return businessId.state;
  }
  const branchId = getFormString(formData, "branchId");

  const lookupMethod = getFormString(formData, "lookupMethod");
  if (!isLookupMethod(lookupMethod)) {
    return createErrorState("Selecione um método de identificação válido.", previousState);
  }

  const lookupValue = getRequiredFormString(
    formData,
    "lookupValue",
    lookupMethod === "phone" ? "Telefone" : lookupMethod === "card" ? "Número do cartão" : "QR"
  );
  if (!lookupValue.ok) {
    return lookupValue.state;
  }
  const normalizedLookup = normalizePosCustomerLookup(lookupMethod, lookupValue.value);

  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("lookup_pos_customer", {
    p_business_id: businessId.value,
    p_branch_id: branchId || null,
    p_lookup_method: normalizedLookup.method,
    p_lookup_value: normalizedLookup.value
  });

  if (error) {
    return createErrorState("Não foi possível identificar o cliente.", previousState);
  }

  const row = Array.isArray(data) ? (data[0] as PosLookupRow | undefined) : undefined;

  if (!row) {
    return createErrorState(
      lookupMethod === "phone"
        ? "Não existe um cartão ativo associado a este telefone neste negócio."
        : "Cartão ativo não encontrado para este negócio.",
      previousState
    );
  }

  return {
    ...initialPosActionState,
    status: "success",
    message: "Cliente identificado. Introduza o valor da compra.",
    businessId: businessId.value,
    branchId,
    card: {
      customerCardId: row.customer_card_id,
      customerName: row.customer_name,
      cardNumber: row.card_number,
      availablePoints: row.available_points,
      pointValueMznMinor: row.point_value_mzn_minor,
      maximumRedemptionPercent: String(row.maximum_redemption_percent),
      earnRate: String(row.earn_rate)
    }
  };
}

function isLookupMethod(value: string): value is "qr" | "card" | "phone" {
  return value === "qr" || value === "card" || value === "phone";
}

export async function quotePosTransactionAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  if (!previousState.card) {
    return createErrorState("Identifique o cliente antes de calcular.", previousState);
  }

  const grossAmount = parseRequiredMoney(
    formData,
    "grossAmountMzn",
    "Valor da compra",
    previousState
  );
  if (!grossAmount.ok) {
    return grossAmount.state;
  }

  if (grossAmount.value <= 0) {
    return createErrorState("O valor da compra deve ser maior que zero.", previousState);
  }

  const discountAmount = parseOptionalMoney(formData, "discountAmountMzn", previousState);
  if (!discountAmount.ok) {
    return discountAmount.state;
  }

  const pointsToRedeem = parseOptionalInteger(formData, "pointsToRedeem", previousState);
  if (!pointsToRedeem.ok) {
    return pointsToRedeem.state;
  }

  if (discountAmount.value > grossAmount.value) {
    return createErrorState("O desconto não pode ser maior que a compra.", previousState);
  }

  const quote = buildPosQuote({
    grossAmountMznMinor: grossAmount.value,
    discountAmountMznMinor: discountAmount.value,
    requestedPointsToRedeem: pointsToRedeem.value,
    card: previousState.card
  });
  const serviceDescription = getFormString(formData, "serviceDescription").slice(0, 160);

  return {
    ...previousState,
    status: "success",
    message: "Valor calculado. Confirme com o cliente.",
    quote,
    serviceDescription,
    transactionId: null,
    idempotencyKey: getIdempotencyKey(formData, { ...previousState, quote })
  };
}

export async function confirmPosTransactionAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  if (!previousState.card || !previousState.quote) {
    return createErrorState("Calcule a transação antes de confirmar.", previousState);
  }

  const businessId = getFormString(formData, "businessId") || previousState.businessId;

  if (!businessId) {
    return createErrorState("O negócio é obrigatório.", previousState);
  }

  if (getFormString(formData, "customerAuthorized") !== "on") {
    return createErrorState("Confirme a autorização do cliente antes de concluir.", previousState);
  }

  const branchId = getFormString(formData, "branchId") || previousState.branchId || null;
  const cashierMemberId = getFormString(formData, "cashierMemberId") || null;
  const paymentMethodValue = getFormString(formData, "paymentMethod");

  if (!isPosPaymentMethod(paymentMethodValue)) {
    return createErrorState("Selecione um método de pagamento válido.", previousState);
  }

  if (!isAvailablePosPaymentMethod(paymentMethodValue)) {
    return createErrorState(
      "Este método de pagamento ainda não está configurado para utilização.",
      previousState
    );
  }
  const idempotencyKey = getIdempotencyKey(formData, previousState);

  if (!isValidIdempotencyKey(idempotencyKey)) {
    return createErrorState("A chave anti-duplicação é inválida.", previousState);
  }

  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const supabase = await createSupabaseServerClient();
  const rpcName =
    previousState.quote.pointsToRedeem > 0 ? "redeem_purchase_points" : "record_purchase_points";
  const { data, error } = await supabase.rpc(rpcName, {
    p_business_id: businessId,
    p_branch_id: branchId,
    p_customer_card_id: previousState.card.customerCardId,
    p_gross_amount_mzn_minor: previousState.quote.grossAmountMznMinor,
    p_discount_amount_mzn_minor: previousState.quote.discountAmountMznMinor,
    ...(previousState.quote.pointsToRedeem > 0
      ? { p_points_to_redeem: previousState.quote.pointsToRedeem }
      : {}),
    p_cashier_member_id: cashierMemberId,
    p_external_reference: idempotencyKey,
    p_metadata: {
      source: "pos",
      customer_authorized: getFormString(formData, "customerAuthorized") === "on",
      service_description: previousState.serviceDescription || null,
      payment_method: paymentMethodValue
    }
  });

  if (error) {
    if (error.code === "23505") {
      return createErrorState("Esta confirmação já foi recebida. Evite reenviar.", previousState);
    }

    return createErrorState("Não foi possível confirmar a transação.", previousState);
  }

  const row = Array.isArray(data) ? (data[0] as PosTransactionRow | undefined) : undefined;

  return {
    ...previousState,
    card: row
      ? {
          ...previousState.card,
          availablePoints: row.available_balance
        }
      : previousState.card,
    status: "success",
    message: "Transação confirmada com sucesso.",
    transactionId: row?.transaction_id ?? null,
    idempotencyKey,
    paymentMethod: paymentMethodValue
  };
}

function parseRequiredMoney(
  formData: FormData,
  key: string,
  label: string,
  previousState: PosActionState
) {
  const value = getRequiredFormString(formData, key, label);

  if (!value.ok) {
    return { ok: false as const, state: createErrorState(value.state.message, previousState) };
  }

  try {
    return { ok: true as const, value: parseMznToMinorUnits(value.value) };
  } catch {
    return {
      ok: false as const,
      state: createErrorState(`${label} deve estar em MZN.`, previousState)
    };
  }
}

function parseOptionalMoney(formData: FormData, key: string, previousState: PosActionState) {
  const value = getFormString(formData, key);

  if (!value) {
    return { ok: true as const, value: 0 };
  }

  try {
    return { ok: true as const, value: parseMznToMinorUnits(value) };
  } catch {
    return {
      ok: false as const,
      state: createErrorState("O desconto deve estar em MZN.", previousState)
    };
  }
}

function parseOptionalInteger(formData: FormData, key: string, previousState: PosActionState) {
  const value = getFormString(formData, key);

  if (!value) {
    return { ok: true as const, value: 0 };
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return {
      ok: false as const,
      state: createErrorState("Os pontos a usar devem ser válidos.", previousState)
    };
  }

  return { ok: true as const, value: parsed };
}

function getIdempotencyKey(formData: FormData, state: PosActionState): string {
  const fromForm = getFormString(formData, "idempotencyKey");

  if (fromForm) {
    return fromForm;
  }

  if (state.idempotencyKey) {
    return state.idempotencyKey;
  }

  if (!state.card || !state.quote) {
    return "";
  }

  return buildFallbackIdempotencyKey({
    businessId: getFormString(formData, "businessId") || state.businessId,
    branchId: getFormString(formData, "branchId") || state.branchId,
    customerCardId: state.card.customerCardId,
    grossAmountMznMinor: state.quote.grossAmountMznMinor,
    pointsToRedeem: state.quote.pointsToRedeem
  });
}
