import type {
  PosCartItemInput,
  PosCustomerCard,
  PosPaymentMethod,
  PosQuote
} from "./model";

export interface PosActionState {
  status: "idle" | "error" | "success";
  message: string;
  businessId: string;
  branchId: string;
  terminalId: string;
  cart: PosCartItemInput[];
  card: PosCustomerCard | null;
  quote: PosQuote | null;
  transactionId: string | null;
  idempotencyKey: string;
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
  cart: [],
  card: null,
  quote: null,
  transactionId: null,
  idempotencyKey: "",
  paymentMethod: null,
  paymentAttemptId: null,
  paymentStatus: null,
  receiptNumber: null,
  completedAt: null
};
