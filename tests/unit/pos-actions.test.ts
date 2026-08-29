import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmPosTransactionAction,
  quotePosTransactionAction,
  submitPosAction
} from "@/features/pos/actions";
import type { PosQuote } from "@/features/pos/model";
import { initialPosActionState } from "@/features/pos/state";
import type { PosActionState } from "@/features/pos/state";

const rpc = vi.fn();

vi.mock("@/lib/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc })
}));

const cart = [{ catalogItemId: "1a9cdb03-8b4a-4c4f-88eb-4723008eeb91", quantity: 2 }];
const quote: PosQuote = {
  lines: [
    {
      catalogItemId: cart[0]!.catalogItemId,
      sku: "SKU-1",
      name: "Corte",
      description: null,
      quantity: 2,
      unitPriceMznMinor: 10_000,
      grossAmountMznMinor: 20_000,
      loyaltyDiscountPercent: 10,
      discountAmountMznMinor: 2_000,
      netAmountMznMinor: 18_000
    }
  ],
  grossAmountMznMinor: 20_000,
  discountAmountMznMinor: 2_000,
  availableBalance: 120,
  maximumRedeemablePoints: 90,
  pointsToRedeem: 50,
  pointsRedeemedValueMznMinor: 5_000,
  pointsEarned: 6,
  netAmountMznMinor: 13_000
};
const card = {
  customerCardId: "card-1",
  customerName: "Ana Mucavele",
  cardNumber: "VY-8F2K-91M",
  availablePoints: 120,
  pointValueMznMinor: 100,
  maximumRedemptionPercent: "50.00",
  earnRate: "0.0500"
};
const cartState: PosActionState = {
  ...initialPosActionState,
  businessId: "business-1",
  branchId: "branch-1",
  terminalId: "terminal-1",
  cart,
  card
};

describe("POS server actions", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: quote, error: null });
  });

  it("keeps the current customer when cart validation fails", async () => {
    const state = await quotePosTransactionAction(cartState, formWith({ cartItems: "[]" }));

    expect(state.status).toBe("error");
    expect(state.card?.customerCardId).toBe("card-1");
    expect(state.message).toBe("Adicione pelo menos um produto ou serviço válido.");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("requests a server-authoritative quote for the complete cart", async () => {
    const state = await quotePosTransactionAction(
      cartState,
      formWith({
        cartItems: JSON.stringify(cart),
        pointsToRedeem: "50",
        idempotencyKey: "pos_1234567890ab"
      })
    );

    expect(rpc).toHaveBeenCalledWith("quote_pos_cart", {
      p_business_id: "business-1",
      p_branch_id: "branch-1",
      p_terminal_id: "terminal-1",
      p_customer_card_id: "card-1",
      p_items: cart,
      p_points_to_redeem: 50
    });
    expect(state.quote).toEqual(quote);
    expect(state.idempotencyKey).toBe("pos_1234567890ab");
  });

  it("requires customer authorization only when YELAS are debited", async () => {
    const state = await confirmPosTransactionAction(
      { ...cartState, quote, idempotencyKey: "pos_1234567890ab" },
      formWith({ paymentMethod: "cash" })
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Confirme a autorização do cliente para utilizar YELAS.");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("allows a no-card sale and confirms the same quoted cart", async () => {
    const guestQuote = {
      ...quote,
      discountAmountMznMinor: 0,
      availableBalance: 0,
      maximumRedeemablePoints: 0,
      pointsToRedeem: 0,
      pointsRedeemedValueMznMinor: 0,
      pointsEarned: 0,
      netAmountMznMinor: 20_000,
      lines: [
        {
          ...quote.lines[0]!,
          loyaltyDiscountPercent: 10,
          discountAmountMznMinor: 0,
          netAmountMznMinor: 20_000
        }
      ]
    } satisfies PosQuote;
    rpc.mockResolvedValueOnce({
      data: [
        {
          transaction_id: "transaction-1",
          available_balance: 0,
          payment_attempt_id: "attempt-1",
          payment_status: "reconciled",
          receipt_number: "VY-1234567890"
        }
      ],
      error: null
    });

    const state = await confirmPosTransactionAction(
      {
        ...cartState,
        card: null,
        quote: guestQuote,
        idempotencyKey: "pos_1234567890ab"
      },
      formWith({ paymentMethod: "cash" })
    );

    expect(state.status).toBe("success");
    expect(state.transactionId).toBe("transaction-1");
    expect(rpc).toHaveBeenCalledWith(
      "confirm_pos_cart",
      expect.objectContaining({
        p_customer_card_id: null,
        p_items: cart,
        p_customer_authorized: false
      })
    );
  });

  it("rejects provider methods until their adapter is active", async () => {
    const noRedemptionQuote = {
      ...quote,
      pointsToRedeem: 0,
      pointsRedeemedValueMznMinor: 0,
      netAmountMznMinor: 18_000
    };
    const state = await confirmPosTransactionAction(
      { ...cartState, quote: noRedemptionQuote },
      formWith({ paymentMethod: "mpesa" })
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe(
      "Este método de pagamento ainda não está configurado para utilização."
    );
  });

  it("returns to the catalogue without losing the draft cart", async () => {
    const state = await submitPosAction(
      { ...cartState, quote },
      formWith({ intent: "edit_cart" })
    );

    expect(state.card?.customerCardId).toBe("card-1");
    expect(state.cart).toEqual(cart);
    expect(state.quote).toBeNull();
  });

  it("routes reset through the unified POS action", async () => {
    const state = await submitPosAction(cartState, formWith({ intent: "reset" }));
    expect(state).toEqual(initialPosActionState);
  });

  it("rejects an unknown customer identification method before querying Supabase", async () => {
    const state = await submitPosAction(
      cartState,
      formWith({
        intent: "identify",
        cartItems: JSON.stringify(cart),
        lookupMethod: "email",
        lookupValue: "cliente@example.com"
      })
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Selecione um método de identificação válido.");
    expect(rpc).not.toHaveBeenCalled();
  });
});

function formWith(values: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}
