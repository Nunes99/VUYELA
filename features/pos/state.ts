import type { PosCustomerCard, PosQuote } from "./model";

export interface PosActionState {
  status: "idle" | "error" | "success";
  message: string;
  businessId: string;
  branchId: string;
  card: PosCustomerCard | null;
  quote: PosQuote | null;
  transactionId: string | null;
  idempotencyKey: string;
}

export const initialPosActionState: PosActionState = {
  status: "idle",
  message: "",
  businessId: "",
  branchId: "",
  card: null,
  quote: null,
  transactionId: null,
  idempotencyKey: ""
};
