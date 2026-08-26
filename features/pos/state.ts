import type { PosCustomerCard, PosPaymentMethod, PosQuote } from "./model";

export interface PosActionState {
  status: "idle" | "error" | "success";
  message: string;
  businessId: string;
  branchId: string;
  terminalId: string;
  card: PosCustomerCard | null;
  quote: PosQuote | null;
  draftQuote: PosQuote | null;
  transactionId: string | null;
  idempotencyKey: string;
  serviceDescription: string;
  catalogItemId: string;
  paymentMethod: PosPaymentMethod | null;
  paymentAttemptId: string | null;
  paymentStatus: string | null;
  receiptNumber: string | null;
  completedAt: string | null;
}

export const initialPosActionState: PosActionState = {
  status: "idle",
  message: "",
  businessId: "",
  branchId: "",
  terminalId: "",
  card: null,
  quote: null,
  draftQuote: null,
  transactionId: null,
  idempotencyKey: "",
  serviceDescription: "",
  catalogItemId: "",
  paymentMethod: null,
  paymentAttemptId: null,
  paymentStatus: null,
  receiptNumber: null,
  completedAt: null
};
