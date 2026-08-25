import { notFound } from "next/navigation";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import type { PosContextState } from "@/features/pos/data";
import type { PosPaymentMethod, PosStepId } from "@/features/pos/model";
import { PosPortalShell } from "@/features/pos/pos-shell";
import type { PosActionState } from "@/features/pos/state";
import { initialPosActionState } from "@/features/pos/state";
import { PosWorkflow } from "@/features/pos/pos-workflow";
import type { AuthPrincipal } from "@/lib/auth/rbac";

const previewPrincipal: AuthPrincipal = {
  profileId: "pos-preview",
  profileRole: "customer",
  mfaVerified: true,
  businessMemberships: [
    {
      businessId: "business-preview",
      branchId: "branch-preview",
      role: "cashier",
      status: "active"
    }
  ]
};

const previewContext: PosContextState = {
  status: "ready",
  businesses: [
    {
      id: "business-preview",
      name: "Barbershop 21",
      branches: [
        {
          id: "branch-preview",
          businessId: "business-preview",
          name: "Filial Principal",
          city: "Maputo"
        }
      ],
      defaultBranchId: "branch-preview",
      requiresBranch: false,
      roleLabels: ["Caixa"],
      canManage: false,
      terminals: [
        {
          id: "terminal-preview",
          businessId: "business-preview",
          branchId: "branch-preview",
          code: "POS-001",
          name: "Caixa Principal",
          status: "active",
          lastSeenAt: new Date().toISOString(),
          settings: {
            locale: "pt-MZ",
            currency: "MZN",
            timezone: "Africa/Maputo",
            requireCustomerAuthorization: true,
            printReceiptAutomatically: false,
            showPointsBalance: true,
            showMznEquivalent: true,
            inactivityTimeoutMinutes: 15,
            allowedLookupMethods: ["qr", "card", "phone"]
          },
          devices: []
        }
      ],
      paymentChannels: [
        {
          id: "cash-preview",
          businessId: "business-preview",
          branchId: "branch-preview",
          method: "cash",
          mode: "manual",
          status: "active",
          providerKey: null,
          maskedIdentifier: null,
          credentialsConfigured: false,
          publicSettings: {}
        },
        {
          id: "card-preview",
          businessId: "business-preview",
          branchId: "branch-preview",
          method: "card",
          mode: "manual",
          status: "active",
          providerKey: null,
          maskedIdentifier: null,
          credentialsConfigured: false,
          publicSettings: {}
        }
      ],
      catalogItems: [
        ["item-1", "Corte de Cabelo", "Corte clássico ou moderno", 140000],
        ["item-2", "Barba Completa", "Aparar, desenhar e finalizar", 80000],
        ["item-3", "Corte + Barba", "Serviço combinado", 200000],
        ["item-4", "Lavagem Premium", "Lavagem e tratamento", 60000],
        ["item-5", "Tratamento Capilar", "Cuidado intensivo", 120000],
        ["item-6", "Acabamento", "Detalhes e finalização", 40000]
      ].map(([id, name, description, priceMznMinor], index) => ({
        id: String(id),
        branchId: null,
        kind: "service" as const,
        sku: `SRV-${index + 1}`,
        name: String(name),
        description: String(description),
        priceMznMinor: Number(priceMznMinor),
        sortOrder: index
      }))
    }
  ]
};

const previewCard = {
  customerCardId: "card-preview",
  customerName: "Ana Manjate",
  cardNumber: "VY-6885-4797",
  availablePoints: 3450,
  pointValueMznMinor: 100,
  maximumRedemptionPercent: "50",
  earnRate: "0.10"
};

const previewQuote = {
  grossAmountMznMinor: 140000,
  discountAmountMznMinor: 0,
  pointsToRedeem: 0,
  pointsRedeemedValueMznMinor: 0,
  maximumRedeemablePoints: 700,
  pointsEarned: 140,
  netAmountMznMinor: 140000
};

function previewState(step: PosStepId): PosActionState {
  const base: PosActionState = {
    ...initialPosActionState,
    businessId: "business-preview",
    branchId: "branch-preview",
    terminalId: "terminal-preview",
    idempotencyKey: "pos_preview_123456789",
    catalogItemId: "item-1",
    serviceDescription: "Corte de Cabelo"
  };

  if (step === "identify") return base;

  const withCard = { ...base, card: previewCard };
  if (step === "services") return withCard;

  const withQuote = { ...withCard, quote: previewQuote };
  if (step === "authorize" || step === "confirm") return withQuote;

  return {
    ...withQuote,
    status: "success",
    message: "Transação concluída.",
    transactionId: "TXN-20260825-001",
    paymentMethod: "cash",
    paymentAttemptId: "payment-preview",
    paymentStatus: "reconciled",
    receiptNumber: "VY-2026-00891",
    completedAt: "2026-08-25T10:42:00.000Z"
  };
}

function stepFrom(value: string | string[] | undefined): PosStepId {
  return typeof value === "string" &&
    ["identify", "services", "authorize", "confirm", "success"].includes(value)
    ? (value as PosStepId)
    : "identify";
}

export default async function PosPreviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const step = stepFrom(params.etapa);
  const paymentMethod: PosPaymentMethod | null = step === "confirm" ? "cash" : null;

  return (
    <ProtectedRouteStateView
      state={{ status: "authorized", principal: previewPrincipal }}
      title="POS VUYELA"
      variant="pos"
    >
      <PosPortalShell context={previewContext} principal={previewPrincipal}>
        <PosWorkflow
          context={previewContext}
          initialPaymentMethod={paymentMethod}
          initialState={previewState(step)}
          key={step}
        />
      </PosPortalShell>
    </ProtectedRouteStateView>
  );
}
