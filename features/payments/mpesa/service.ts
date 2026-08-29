import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

import {
  attemptIdFromMpesaReference,
  parseMpesaProviderResponse
} from "./model";
import type { MpesaProviderResult } from "./model";
import { createMpesaC2BPayment } from "./provider";
import type { MpesaProviderConfiguration } from "./provider";

interface MpesaAttemptContextRow {
  payment_attempt_id: string;
  payment_status: string;
  amount_mzn_minor: number;
  customer_msisdn: string;
  transaction_reference: string;
  public_settings: unknown;
  credentials: unknown;
}

export interface MpesaReconciliationResult {
  transactionId: string | null;
  availableBalance: number;
  paymentAttemptId: string;
  paymentStatus: string;
  receiptNumber: string | null;
}

interface MpesaReconciliationRow {
  transaction_id: string | null;
  available_balance: number;
  payment_attempt_id: string;
  payment_status: string;
  receipt_number: string | null;
}

export async function processMpesaPaymentAttempt(
  attemptId: string
): Promise<MpesaReconciliationResult> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("get_mpesa_payment_attempt_context", {
    p_payment_attempt_id: attemptId
  });

  if (error) throw new Error("Não foi possível carregar a tentativa M-Pesa.");

  const context = firstRow<MpesaAttemptContextRow>(data);
  if (!context) throw new Error("A tentativa M-Pesa não foi encontrada.");

  if (context.payment_status === "reconciled") {
    return readAttemptStatus(attemptId);
  }
  if (["pending", "declined", "cancelled", "expired"].includes(context.payment_status)) {
    return readAttemptStatus(attemptId);
  }

  let providerResult: MpesaProviderResult;
  try {
    providerResult = await createMpesaC2BPayment(configurationFrom(context), {
      attemptId: context.payment_attempt_id,
      amountMznMinor: context.amount_mzn_minor,
      customerMsisdn: context.customer_msisdn,
      transactionReference: context.transaction_reference
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Configuração M-Pesa inválida.";
    providerResult = {
      status: "declined",
      providerReference: null,
      conversationId: null,
      responseCode: "VUYELA-CONFIG",
      responseDescription: message,
      safePayload: {
        responseCode: "VUYELA-CONFIG",
        responseDescription: message,
        providerReference: null,
        conversationId: null,
        thirdPartyReference: null
      }
    };
  }

  return reconcileAttempt(attemptId, providerResult);
}

export async function readMpesaPaymentAttempt(
  attemptId: string
): Promise<MpesaReconciliationResult> {
  return readAttemptStatus(attemptId);
}

export async function reconcileMpesaCallback(payload: unknown): Promise<MpesaReconciliationResult> {
  const response = recordValue(payload);
  const thirdPartyReference = firstString(response, [
    "output_ThirdPartyReference",
    "input_ThirdPartyReference",
    "thirdPartyReference"
  ]);
  const attemptId = thirdPartyReference
    ? attemptIdFromMpesaReference(thirdPartyReference)
    : null;

  if (!attemptId) throw new RangeError("A referência da tentativa M-Pesa é inválida.");

  return reconcileAttempt(attemptId, parseMpesaProviderResponse(payload, 200));
}

async function reconcileAttempt(
  attemptId: string,
  providerResult: MpesaProviderResult
): Promise<MpesaReconciliationResult> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("reconcile_mpesa_payment_attempt", {
    p_payment_attempt_id: attemptId,
    p_provider_status: providerResult.status,
    p_provider_reference:
      providerResult.providerReference ?? providerResult.conversationId ?? null,
    p_failure_code:
      providerResult.status === "declined" ? providerResult.responseCode ?? "DECLINED" : null,
    p_provider_payload: providerResult.safePayload,
    p_event_key: providerEventKey(attemptId, providerResult)
  });

  if (error) throw new Error("Não foi possível reconciliar o pagamento M-Pesa.");

  const row = firstRow<MpesaReconciliationRow>(data);
  if (!row) throw new Error("O M-Pesa não devolveu um estado reconciliável.");

  return mapReconciliation(row);
}

async function readAttemptStatus(attemptId: string): Promise<MpesaReconciliationResult> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("get_mpesa_payment_attempt_status", {
    p_payment_attempt_id: attemptId
  });

  if (error) throw new Error("Não foi possível consultar o pagamento M-Pesa.");

  const row = firstRow<MpesaReconciliationRow>(data);
  if (!row) throw new Error("A tentativa M-Pesa não foi encontrada.");

  return mapReconciliation(row);
}

function configurationFrom(context: MpesaAttemptContextRow): MpesaProviderConfiguration {
  const settings = recordValue(context.public_settings);
  const credentials = recordValue(context.credentials);

  return {
    apiKey: requiredString(credentials.apiKey, "A API key M-Pesa não está configurada."),
    publicKey: requiredString(
      credentials.publicKey,
      "A chave pública M-Pesa não está configurada. Volte a guardar as credenciais."
    ),
    serviceProviderCode: requiredString(
      settings.merchantId,
      "O código do prestador M-Pesa não está configurado."
    ),
    c2bResourceUrl: requiredString(
      settings.c2bResourceUrl,
      "O endpoint C2B M-Pesa não está configurado."
    ),
    requestOrigin: optionalString(settings.requestOrigin) ?? "*",
    timeoutSeconds: integerValue(settings.timeoutSeconds, 120)
  };
}

function providerEventKey(attemptId: string, result: MpesaProviderResult): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        attemptId,
        status: result.status,
        providerReference: result.providerReference,
        conversationId: result.conversationId,
        responseCode: result.responseCode,
        safePayload: result.safePayload
      })
    )
    .digest("hex");
}

function mapReconciliation(row: MpesaReconciliationRow): MpesaReconciliationResult {
  return {
    transactionId: row.transaction_id,
    availableBalance: Number(row.available_balance) || 0,
    paymentAttemptId: row.payment_attempt_id,
    paymentStatus: row.payment_status,
    receiptNumber: row.receipt_number
  };
}

function firstRow<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length > 0 ? (data[0] as T) : null;
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || !value.trim()) throw new RangeError(message);
  return value.trim();
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function integerValue(value: unknown, fallback: number): number {
  const candidate = typeof value === "number" ? value : Number(value);
  return Number.isInteger(candidate) ? candidate : fallback;
}

function firstString(value: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}
