import type { PosCustomerCard, PosPaymentMethod, PosQuote } from "./model";

export interface PosActionState {
  status: "idle" | "error" | "success";
  message: string;
  businessId: string;
  branchId: string;
  card: PosCustomerCard | null;
  quote: PosQuote | null;
  transactionId: string | null;
  idempotencyKey: string;
  serviceDescription: string;
  paymentMethod: PosPaymentMethod | null;
}

export const initialPosActionState: PosActionState = {
  status: "idle",
  message: "",
  businessId: "",
  branchId: "",
  card: null,
  quote: null,
  transactionId: null,
  idempotencyKey: "",
  serviceDescription: "",
  paymentMethod: null
};
