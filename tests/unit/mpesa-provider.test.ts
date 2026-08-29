import {
  constants,
  generateKeyPairSync,
  privateDecrypt
} from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  createMpesaC2BPayment,
  encryptMpesaApiKey
} from "@/features/payments/mpesa/provider";

const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKey = keyPair.publicKey
  .export({ format: "der", type: "spki" })
  .toString("base64");

describe("M-Pesa provider adapter", () => {
  it("encrypts the API key with RSA PKCS#1 before transport", () => {
    const encrypted = encryptMpesaApiKey("1234567890abcdef1234567890abcdef", publicKey);
    const decrypted = privateDecrypt(
      { key: keyPair.privateKey, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(encrypted, "base64")
    );

    expect(decrypted.toString("utf8")).toBe("1234567890abcdef1234567890abcdef");
  });

  it("sends the official C2B field structure without exposing the plain API key", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Response(
        JSON.stringify({
          output_ResponseCode: "INS-0",
          output_ResponseDesc: "Request processed successfully",
          output_TransactionID: "MPESA-123",
          output_ConversationID: "CONV-123"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await createMpesaC2BPayment(
      {
        apiKey: "1234567890abcdef1234567890abcdef",
        publicKey,
        serviceProviderCode: "171717",
        c2bResourceUrl: "https://api.sandbox.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/",
        requestOrigin: "*",
        timeoutSeconds: 30
      },
      {
        attemptId: "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba",
        amountMznMinor: 12_505,
        customerMsisdn: "258841234567",
        transactionReference: "POS-01-ORDER"
      },
      fetcher
    );

    const request = fetcher.mock.calls[0];
    const init = request?.[1];
    const headers = init?.headers as Record<string, string>;
    const body = JSON.parse(String(init?.body)) as Record<string, string>;

    expect(headers.Authorization).toMatch(/^Bearer /);
    expect(headers.Authorization).not.toContain("1234567890abcdef1234567890abcdef");
    expect(body).toMatchObject({
      input_TransactionReference: "POS-01-ORDER",
      input_CustomerMSISDN: "258841234567",
      input_Amount: "125.05",
      input_ServiceProviderCode: "171717"
    });
    expect(body.input_ThirdPartyReference).toMatch(/^VUYELA-/);
    expect(result).toMatchObject({ status: "authorized", providerReference: "MPESA-123" });
  });

  it("keeps an ambiguous network failure pending instead of charging again", async () => {
    const result = await createMpesaC2BPayment(
      {
        apiKey: "1234567890abcdef1234567890abcdef",
        publicKey,
        serviceProviderCode: "171717",
        c2bResourceUrl: "https://api.sandbox.vm.co.mz/c2b",
        requestOrigin: "*",
        timeoutSeconds: 30
      },
      {
        attemptId: "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba",
        amountMznMinor: 10_000,
        customerMsisdn: "258841234567",
        transactionReference: "POS-01"
      },
      vi.fn(async () => {
        throw new TypeError("network unavailable");
      })
    );

    expect(result.status).toBe("pending");
    expect(result.responseDescription).toMatch(/permanece pendente/);
  });
});
