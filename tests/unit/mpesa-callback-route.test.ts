import { afterEach, describe, expect, it, vi } from "vitest";

const { reconcileMpesaCallback } = vi.hoisted(() => ({
  reconcileMpesaCallback: vi.fn()
}));

vi.mock("@/features/payments/mpesa/service", () => ({ reconcileMpesaCallback }));

import { POST } from "@/app/api/payments/mpesa/callback/route";

describe("M-Pesa callback route", () => {
  afterEach(() => {
    delete process.env.MPESA_CALLBACK_TOKEN;
    reconcileMpesaCallback.mockReset();
  });

  it("rejects callbacks without the configured secret", async () => {
    process.env.MPESA_CALLBACK_TOKEN = "a".repeat(48);
    const response = await POST(
      new Request("https://vuyela.example/api/payments/mpesa/callback", {
        method: "POST",
        body: JSON.stringify({ output_ResponseCode: "INS-0" })
      })
    );

    expect(response.status).toBe(401);
    expect(reconcileMpesaCallback).not.toHaveBeenCalled();
  });

  it("reconciles an authenticated callback and returns an idempotent acknowledgement", async () => {
    const token = "b".repeat(48);
    process.env.MPESA_CALLBACK_TOKEN = token;
    const payload = {
      output_ResponseCode: "INS-0",
      output_ThirdPartyReference: "VUYELA-6AB0D80EE6F24AD2B74775876D1C70BA"
    };
    reconcileMpesaCallback.mockResolvedValueOnce({
      transactionId: "transaction-1",
      availableBalance: 120,
      paymentAttemptId: "6ab0d80e-e6f2-4ad2-b747-75876d1c70ba",
      paymentStatus: "reconciled",
      receiptNumber: "VY-123"
    });

    const response = await POST(
      new Request(`https://vuyela.example/api/payments/mpesa/callback?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    );

    expect(response.status).toBe(200);
    expect(reconcileMpesaCallback).toHaveBeenCalledWith(payload);
    await expect(response.json()).resolves.toMatchObject({ ok: true, status: "reconciled" });
  });
});
