export type MpesaResultStatus = "authorized" | "pending" | "declined";

export interface MpesaProviderResult {
  status: MpesaResultStatus;
  providerReference: string | null;
  conversationId: string | null;
  responseCode: string | null;
  responseDescription: string;
  safePayload: Record<string, string | null>;
}

const MOZAMBIQUE_MOBILE_PATTERN = /^(?:258)?(8[45][0-9]{7})$/;

export function normalizeMpesaMsisdn(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  const match = MOZAMBIQUE_MOBILE_PATTERN.exec(digits);

  if (!match?.[1]) {
    throw new RangeError("Introduza um número M-Pesa Vodacom válido (84 ou 85).");
  }

  return `258${match[1]}`;
}

export function formatMpesaAmount(amountMznMinor: number): string {
  if (!Number.isSafeInteger(amountMznMinor) || amountMznMinor <= 0) {
    throw new RangeError("O valor M-Pesa deve ser positivo.");
  }

  return `${Math.floor(amountMznMinor / 100)}.${String(amountMznMinor % 100).padStart(2, "0")}`;
}

export function parseMpesaProviderResponse(
  payload: unknown,
  httpStatus: number
): MpesaProviderResult {
  const response = recordValue(payload);
  const responseCode = firstString(response, ["output_ResponseCode", "responseCode", "code"]);
  const responseDescription =
    firstString(response, ["output_ResponseDesc", "responseDescription", "description", "message"]) ??
    defaultDescription(httpStatus);
  const providerReference = firstString(response, [
    "output_TransactionID",
    "transactionId",
    "transactionID",
    "providerReference"
  ]);
  const conversationId = firstString(response, [
    "output_ConversationID",
    "conversationId",
    "conversationID"
  ]);

  return {
    status: responseStatus(responseCode, httpStatus),
    providerReference,
    conversationId,
    responseCode,
    responseDescription,
    safePayload: {
      responseCode,
      responseDescription,
      providerReference,
      conversationId,
      thirdPartyReference: firstString(response, [
        "output_ThirdPartyReference",
        "input_ThirdPartyReference",
        "thirdPartyReference"
      ])
    }
  };
}

export function mpesaAttemptReference(attemptId: string): string {
  const compact = attemptId.replaceAll("-", "").toUpperCase();

  if (!/^[0-9A-F]{32}$/.test(compact)) {
    throw new RangeError("A tentativa M-Pesa tem um identificador inválido.");
  }

  return `VUYELA-${compact}`;
}

export function attemptIdFromMpesaReference(reference: string): string | null {
  const compact = reference.trim().toUpperCase().replace(/^VUYELA-/, "");

  if (!/^[0-9A-F]{32}$/.test(compact)) return null;

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20)
  ].join("-").toLowerCase();
}

function responseStatus(responseCode: string | null, httpStatus: number): MpesaResultStatus {
  if (responseCode === "INS-0") return "authorized";
  if (httpStatus === 202 || httpStatus >= 500 || responseCode === null) return "pending";
  return "declined";
}

function defaultDescription(httpStatus: number): string {
  if (httpStatus === 202) return "Pedido aceite para processamento.";
  if (httpStatus >= 500) return "O M-Pesa não confirmou o estado do pagamento.";
  return "Resposta recebida do M-Pesa.";
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstString(value: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
  }

  return null;
}
