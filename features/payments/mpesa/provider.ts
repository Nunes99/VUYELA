import "server-only";

import {
  constants,
  createPublicKey,
  publicEncrypt
} from "node:crypto";

import {
  formatMpesaAmount,
  mpesaAttemptReference,
  parseMpesaProviderResponse
} from "./model";
import type { MpesaProviderResult } from "./model";

export interface MpesaProviderConfiguration {
  apiKey: string;
  publicKey: string;
  serviceProviderCode: string;
  c2bResourceUrl: string;
  requestOrigin: string;
  timeoutSeconds: number;
}

export interface MpesaPaymentRequest {
  attemptId: string;
  amountMznMinor: number;
  customerMsisdn: string;
  transactionReference: string;
}

export async function createMpesaC2BPayment(
  configuration: MpesaProviderConfiguration,
  request: MpesaPaymentRequest,
  fetcher: typeof fetch = fetch
): Promise<MpesaProviderResult> {
  validateConfiguration(configuration);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.min(Math.max(configuration.timeoutSeconds, 10), 600) * 1_000
  );

  try {
    const response = await fetcher(configuration.c2bResourceUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${encryptMpesaApiKey(configuration.apiKey, configuration.publicKey)}`,
        "Content-Type": "application/json",
        Origin: configuration.requestOrigin
      },
      body: JSON.stringify({
        input_TransactionReference: request.transactionReference.slice(0, 40),
        input_CustomerMSISDN: request.customerMsisdn,
        input_Amount: formatMpesaAmount(request.amountMznMinor),
        input_ThirdPartyReference: mpesaAttemptReference(request.attemptId),
        input_ServiceProviderCode: configuration.serviceProviderCode
      }),
      cache: "no-store",
      signal: controller.signal
    });
    const payload = await readJsonResponse(response);

    return parseMpesaProviderResponse(payload, response.status);
  } catch (error) {
    const description =
      error instanceof Error && error.name === "AbortError"
        ? "O pedido expirou sem confirmação do M-Pesa. O estado será verificado antes de repetir."
        : "Não foi possível confirmar a resposta do M-Pesa. A tentativa permanece pendente.";

    return {
      status: "pending",
      providerReference: null,
      conversationId: null,
      responseCode: null,
      responseDescription: description,
      safePayload: {
        responseCode: null,
        responseDescription: description,
        providerReference: null,
        conversationId: null,
        thirdPartyReference: mpesaAttemptReference(request.attemptId)
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function encryptMpesaApiKey(apiKey: string, publicKeyBase64: string): string {
  const apiKeyValue = apiKey.trim();
  const publicKeyValue = publicKeyBase64
    .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");

  if (apiKeyValue.length < 8 || publicKeyValue.length < 128) {
    throw new RangeError("As credenciais M-Pesa estão incompletas.");
  }

  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyValue, "base64"),
    format: "der",
    type: "spki"
  });

  return publicEncrypt(
    { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(apiKeyValue, "utf8")
  ).toString("base64");
}

function validateConfiguration(configuration: MpesaProviderConfiguration): void {
  const resourceUrl = new URL(configuration.c2bResourceUrl);

  if (resourceUrl.protocol !== "https:") {
    throw new RangeError("O endpoint M-Pesa deve usar HTTPS.");
  }
  if (!configuration.serviceProviderCode.trim()) {
    throw new RangeError("O código do prestador M-Pesa é obrigatório.");
  }
  if (!configuration.requestOrigin.trim()) {
    throw new RangeError("A origem autorizada do pedido M-Pesa é obrigatória.");
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { description: `Resposta HTTP ${response.status} sem JSON válido.` };
  }
}
