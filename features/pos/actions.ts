"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  buildFallbackIdempotencyKey,
  isAvailablePosPaymentMethod,
  isPosPaymentMethod,
  isValidIdempotencyKey,
  normalizeCartItems,
  normalizePosCustomerLookup,
  parsePosQuote
} from "./model";
import type { PosCartItemInput, PosCustomerCard, PosQuote } from "./model";
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
  payment_attempt_id: string | null;
  payment_status: string;
  receipt_number: string;
}

interface PosFormContext {
  businessId: string;
  branchId: string;
  terminalId: string;
  cart: PosCartItemInput[];
  pointsToRedeem: number;
}

type PosServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function submitPosAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const intent = getFormString(formData, "intent");

  if (intent === "quote") {
    return quotePosTransactionAction(previousState, formData);
  }

  if (intent === "identify") {
    return identifyPosCustomerAction(previousState, formData);
  }

  if (intent === "remove_customer") {
    return removePosCustomerAction(previousState, formData);
  }

  if (intent === "edit_cart") {
    return {
      ...previousState,
      status: "idle",
      message: "Ajuste o carrinho e volte a calcular a venda.",
      quote: null,
      transactionId: null,
      paymentMethod: null,
      paymentAttemptId: null,
      paymentStatus: null,
      receiptNumber: null,
      completedAt: null
    };
  }

  if (intent === "confirm") {
    return confirmPosTransactionAction(previousState, formData);
  }

  if (intent === "reset") {
    return initialPosActionState;
  }

  return createErrorState("Ação de POS inválida.", previousState);
}

export async function quotePosTransactionAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const context = parsePosFormContext(formData, previousState);
  if (!context.ok) {
    return context.state;
  }

  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState(previousState);
  }

  const supabase = await createSupabaseServerClient();
  const quoteResult = await requestServerQuote(
    supabase,
    context.value,
    previousState.card?.customerCardId ?? null
  );

  if (!quoteResult.ok) {
    return createErrorState(quoteResult.message, previousState);
  }

  return createQuoteState({
    previousState,
    context: context.value,
    card: previousState.card,
    quote: quoteResult.quote,
    idempotencyKey: getIdempotencyKey(formData, previousState, context.value, quoteResult.quote),
    message: previousState.card
      ? "Benefícios VUYELA aplicados. Reveja a venda antes do pagamento."
      : "Venda calculada sem cartão. Pode associar um cliente ou avançar para o pagamento."
  });
}

export async function identifyPosCustomerAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const context = parsePosFormContext(formData, previousState);
  if (!context.ok) {
    return context.state;
  }

  const lookupMethod = getFormString(formData, "lookupMethod");
  if (!isLookupMethod(lookupMethod)) {
    return createErrorState("Selecione um método de identificação válido.", previousState);
  }

  const lookupValue = getFormString(formData, "lookupValue");
  if (!lookupValue) {
    return createErrorState(
      lookupMethod === "phone"
        ? "Introduza o telefone do cliente."
        : lookupMethod === "card"
          ? "Introduza o número do cartão."
          : "Leia ou introduza o QR do cartão.",
      previousState
    );
  }

  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState(previousState);
  }

  const normalizedLookup = normalizePosCustomerLookup(lookupMethod, lookupValue);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("lookup_pos_customer", {
    p_business_id: context.value.businessId,
    p_branch_id: context.value.branchId,
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

  const card: PosCustomerCard = {
    customerCardId: row.customer_card_id,
    customerName: row.customer_name,
    cardNumber: row.card_number,
    availablePoints: row.available_points,
    pointValueMznMinor: row.point_value_mzn_minor,
    maximumRedemptionPercent: String(row.maximum_redemption_percent),
    earnRate: String(row.earn_rate)
  };
  const quoteResult = await requestServerQuote(
    supabase,
    context.value,
    card.customerCardId
  );

  if (!quoteResult.ok) {
    return createErrorState(quoteResult.message, previousState);
  }

  return createQuoteState({
    previousState,
    context: context.value,
    card,
    quote: quoteResult.quote,
    idempotencyKey: getIdempotencyKey(formData, previousState, context.value, quoteResult.quote),
    message: "Cliente identificado e benefícios recalculados."
  });
}

async function removePosCustomerAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const context = parsePosFormContext(formData, previousState);
  if (!context.ok) {
    return context.state;
  }

  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState(previousState);
  }

  const supabase = await createSupabaseServerClient();
  const quoteResult = await requestServerQuote(supabase, context.value, null);
  if (!quoteResult.ok) {
    return createErrorState(quoteResult.message, previousState);
  }

  return createQuoteState({
    previousState,
    context: context.value,
    card: null,
    quote: quoteResult.quote,
    idempotencyKey: getIdempotencyKey(formData, previousState, context.value, quoteResult.quote),
    message: "Cartão removido. A venda será concluída sem benefícios VUYELA."
  });
}

export async function confirmPosTransactionAction(
  previousState: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  if (!previousState.quote || previousState.cart.length === 0) {
    return createErrorState("Calcule o carrinho antes de confirmar.", previousState);
  }

  const businessId = getFormString(formData, "businessId") || previousState.businessId;
  const branchId = getFormString(formData, "branchId") || previousState.branchId;
  const terminalId = getFormString(formData, "terminalId") || previousState.terminalId;
  if (!businessId || !branchId || !terminalId) {
    return createErrorState("Selecione um negócio, uma filial e um terminal ativos.", previousState);
  }

  const customerAuthorized = getFormString(formData, "customerAuthorized") === "on";
  if (previousState.quote.pointsToRedeem > 0 && !customerAuthorized) {
    return createErrorState("Confirme a autorização do cliente para utilizar YELAS.", previousState);
  }

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

  if (previousState.quote.netAmountMznMinor === 0 && paymentMethodValue !== "points") {
    return createErrorState("Esta compra está totalmente liquidada com YELAS.", previousState);
  }
  if (previousState.quote.netAmountMznMinor > 0 && paymentMethodValue === "points") {
    return createErrorState("Selecione um método para pagar o valor restante.", previousState);
  }

  const paymentReference = getFormString(formData, "paymentReference");
  if (paymentMethodValue === "card" && paymentReference.length < 4) {
    return createErrorState("Indique a referência emitida pelo terminal bancário.", previousState);
  }

  const idempotencyKey = getIdempotencyKey(
    formData,
    previousState,
    {
      businessId,
      branchId,
      terminalId,
      cart: previousState.cart,
      pointsToRedeem: previousState.quote.pointsToRedeem
    },
    previousState.quote
  );
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return createErrorState("A chave anti-duplicação é inválida.", previousState);
  }

  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState(previousState);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("confirm_pos_cart", {
    p_business_id: businessId,
    p_branch_id: branchId,
    p_terminal_id: terminalId,
    p_customer_card_id: previousState.card?.customerCardId ?? null,
    p_items: previousState.cart,
    p_points_to_redeem: previousState.quote.pointsToRedeem,
    p_expected_gross_amount_mzn_minor: previousState.quote.grossAmountMznMinor,
    p_expected_discount_amount_mzn_minor: previousState.quote.discountAmountMznMinor,
    p_expected_net_amount_mzn_minor: previousState.quote.netAmountMznMinor,
    p_payment_method: paymentMethodValue,
    p_payment_reference: paymentReference || null,
    p_idempotency_key: idempotencyKey,
    p_customer_authorized: customerAuthorized,
    p_metadata: {
      source: "pos",
      cart_line_count: previousState.quote.lines.length,
      customer_authorized: customerAuthorized
    }
  });

  if (error) {
    if (error.code === "23505") {
      return createErrorState("Esta confirmação já foi recebida. Evite reenviar.", previousState);
    }

    return createErrorState(posConfirmationErrorMessage(error.message), previousState);
  }

  const row = Array.isArray(data) ? (data[0] as PosTransactionRow | undefined) : undefined;
  if (!row) {
    return createErrorState("O servidor não devolveu o comprovativo da venda.", previousState);
  }

  return {
    ...previousState,
    card: previousState.card
      ? { ...previousState.card, availablePoints: row.available_balance }
      : null,
    status: "success",
    message: "Venda concluída com sucesso.",
    transactionId: row.transaction_id,
    idempotencyKey,
    paymentMethod: paymentMethodValue,
    paymentAttemptId: row.payment_attempt_id,
    paymentStatus: row.payment_status,
    receiptNumber: row.receipt_number,
    completedAt: new Date().toISOString()
  };
}

async function requestServerQuote(
  supabase: PosServerClient,
  context: PosFormContext,
  customerCardId: string | null
): Promise<{ ok: true; quote: PosQuote } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc("quote_pos_cart", {
    p_business_id: context.businessId,
    p_branch_id: context.branchId,
    p_terminal_id: context.terminalId,
    p_customer_card_id: customerCardId,
    p_items: context.cart,
    p_points_to_redeem: context.pointsToRedeem
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("unavailable")) {
      return { ok: false, message: "Um item do carrinho deixou de estar disponível nesta filial." };
    }
    if (message.includes("maximum redeemable") || message.includes("maximum redeemable balance")) {
      return { ok: false, message: "A quantidade de YELAS excede o máximo permitido nesta venda." };
    }

    return { ok: false, message: "Não foi possível calcular o carrinho no servidor." };
  }

  try {
    return { ok: true, quote: parsePosQuote(data) };
  } catch {
    return { ok: false, message: "O servidor devolveu uma cotação inválida." };
  }
}

function createQuoteState({
  previousState,
  context,
  card,
  quote,
  idempotencyKey,
  message
}: {
  previousState: PosActionState;
  context: PosFormContext;
  card: PosCustomerCard | null;
  quote: PosQuote;
  idempotencyKey: string;
  message: string;
}): PosActionState {
  return {
    ...previousState,
    status: "success",
    message,
    businessId: context.businessId,
    branchId: context.branchId,
    terminalId: context.terminalId,
    cart: context.cart,
    card: card ? { ...card, availablePoints: quote.availableBalance } : null,
    quote,
    transactionId: null,
    idempotencyKey,
    paymentMethod: null,
    paymentAttemptId: null,
    paymentStatus: null,
    receiptNumber: null,
    completedAt: null
  };
}

function parsePosFormContext(
  formData: FormData,
  previousState: PosActionState
): { ok: true; value: PosFormContext } | { ok: false; state: PosActionState } {
  const businessId = getFormString(formData, "businessId") || previousState.businessId;
  const branchId = getFormString(formData, "branchId") || previousState.branchId;
  const terminalId = getFormString(formData, "terminalId") || previousState.terminalId;

  if (!businessId || !branchId || !terminalId) {
    return {
      ok: false,
      state: createErrorState(
        "Selecione um negócio, uma filial e um terminal ativos.",
        previousState
      )
    };
  }

  const cartValue = getFormString(formData, "cartItems");
  let cart: PosCartItemInput[];
  try {
    cart = normalizeCartItems(cartValue ? JSON.parse(cartValue) : previousState.cart);
  } catch {
    return {
      ok: false,
      state: createErrorState("Adicione pelo menos um produto ou serviço válido.", previousState)
    };
  }

  const pointsValue = getFormString(formData, "pointsToRedeem");
  const pointsToRedeem = pointsValue ? Number(pointsValue) : 0;
  if (!Number.isSafeInteger(pointsToRedeem) || pointsToRedeem < 0) {
    return {
      ok: false,
      state: createErrorState("As YELAS a utilizar devem ser um número válido.", previousState)
    };
  }

  return {
    ok: true,
    value: { businessId, branchId, terminalId, cart, pointsToRedeem }
  };
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
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

function getSupabaseNotConfiguredState(previousState: PosActionState): PosActionState {
  return createErrorState(
    "Supabase ainda não está configurado neste ambiente. Configure as variáveis antes de usar o POS.",
    previousState
  );
}

function isLookupMethod(value: string): value is "qr" | "card" | "phone" {
  return value === "qr" || value === "card" || value === "phone";
}

function getIdempotencyKey(
  formData: FormData,
  state: PosActionState,
  context: PosFormContext,
  quote: PosQuote
): string {
  const fromForm = getFormString(formData, "idempotencyKey");

  if (fromForm) {
    return fromForm;
  }

  if (state.idempotencyKey) {
    return state.idempotencyKey;
  }

  return buildFallbackIdempotencyKey({
    businessId: context.businessId,
    branchId: context.branchId,
    terminalId: context.terminalId,
    customerCardId: state.card?.customerCardId ?? null,
    cart: context.cart,
    netAmountMznMinor: quote.netAmountMznMinor,
    pointsToRedeem: quote.pointsToRedeem
  });
}

function posConfirmationErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("changed") || normalized.includes("reviewed again")) {
    return "O carrinho ou os preços mudaram. Volte a rever a venda antes de pagar.";
  }
  if (normalized.includes("authorization")) {
    return "A autorização do cliente é obrigatória para utilizar YELAS.";
  }
  if (normalized.includes("payment channel")) {
    return "O método de pagamento não está ativo para esta filial.";
  }
  if (normalized.includes("attempt already exists")) {
    return "Esta tentativa de pagamento já existe e precisa de revisão.";
  }

  return "Não foi possível concluir a venda. Nenhum pagamento ou movimento de YELAS foi registado.";
}
