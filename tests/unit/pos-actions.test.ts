import { describe, expect, it } from "vitest";

import {
  confirmPosTransactionAction,
  quotePosTransactionAction,
  submitPosAction
} from "@/features/pos/actions";
import { initialPosActionState } from "@/features/pos/state";
import type { PosActionState } from "@/features/pos/state";

const identifiedState: PosActionState = {
  ...initialPosActionState,
  status: "success",
  businessId: "business-1",
  branchId: "branch-1",
  card: {
    customerCardId: "card-1",
    customerName: "Ana Mucavele",
    cardNumber: "VY-8F2K-91M",
    availablePoints: 120,
    pointValueMznMinor: 100,
    maximumRedemptionPercent: "50.00",
    earnRate: "0.0500"
  }
};

describe("POS server actions", () => {
  it("keeps the identified customer when quote validation fails", async () => {
    const formData = new FormData();
    formData.set("grossAmountMzn", "0");

    const state = await quotePosTransactionAction(identifiedState, formData);

    expect(state.status).toBe("error");
    expect(state.card?.customerCardId).toBe("card-1");
    expect(state.message).toBe("O valor da compra deve ser maior que zero.");
  });

  it("builds a quote with a client-provided duplicate-submission key", async () => {
    const formData = new FormData();
    formData.set("grossAmountMzn", "200");
    formData.set("pointsToRedeem", "20");
    formData.set("idempotencyKey", "pos_1234567890ab");

    const state = await quotePosTransactionAction(identifiedState, formData);

    expect(state.status).toBe("success");
    expect(state.quote?.pointsToRedeem).toBe(20);
    expect(state.idempotencyKey).toBe("pos_1234567890ab");
  });

  it("preserves the service description for the confirmation receipt", async () => {
    const state = await quotePosTransactionAction(
      identifiedState,
      formWith({
        grossAmountMzn: "200",
        serviceDescription: "Corte masculino e barba"
      })
    );

    expect(state.serviceDescription).toBe("Corte masculino e barba");
  });

  it("requires customer authorization before confirmation reaches Supabase", async () => {
    const quotedState = await quotePosTransactionAction(
      identifiedState,
      formWith({
        grossAmountMzn: "200",
        idempotencyKey: "pos_1234567890ab"
      })
    );
    const state = await confirmPosTransactionAction(quotedState, formWith({}));

    expect(state.status).toBe("error");
    expect(state.message).toBe("Confirme a autorização do cliente antes de concluir.");
  });

  it("rejects an unsupported payment method before confirmation", async () => {
    const quotedState = await quotePosTransactionAction(
      identifiedState,
      formWith({
        grossAmountMzn: "200",
        idempotencyKey: "pos_1234567890ab"
      })
    );
    const state = await confirmPosTransactionAction(
      quotedState,
      formWith({ customerAuthorized: "on", paymentMethod: "crypto" })
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Selecione um método de pagamento válido.");
  });

  it("rejects provider methods that are not configured", async () => {
    const quotedState = await quotePosTransactionAction(
      identifiedState,
      formWith({
        grossAmountMzn: "200",
        idempotencyKey: "pos_1234567890ab"
      })
    );
    const state = await confirmPosTransactionAction(
      quotedState,
      formWith({ customerAuthorized: "on", paymentMethod: "mpesa" })
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe(
      "Este método de pagamento ainda não está configurado para utilização."
    );
  });

  it("routes the unified POS action by intent", async () => {
    const state = await submitPosAction(identifiedState, formWith({ intent: "reset" }));

    expect(state).toEqual(initialPosActionState);
  });

  it("rejects an unknown customer identification method before querying Supabase", async () => {
    const state = await submitPosAction(
      initialPosActionState,
      formWith({
        intent: "identify",
        businessId: "business-1",
        lookupMethod: "email",
        lookupValue: "cliente@example.com"
      })
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Selecione um método de identificação válido.");
  });
});

function formWith(values: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
