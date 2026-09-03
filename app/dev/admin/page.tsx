import { notFound } from "next/navigation";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import type { AdminDashboardReadyState } from "@/features/admin/model";
import { getAdminCapabilities } from "@/lib/auth/admin-permissions";
import type { AuthPrincipal } from "@/lib/auth/rbac";

const previewPrincipal: AuthPrincipal = {
  profileId: "admin-preview",
  profileRole: "super_admin",
  accountType: "platform",
  mfaVerified: true,
  businessMemberships: []
};

const monthlyVolumes = [2_900_000, 3_550_000, 3_850_000, 4_250_000, 4_950_000, 5_350_000];

const previewState: AdminDashboardReadyState = {
  status: "ready",
  view: "overview",
  query: "",
  filter: "",
  pagination: null,
  capabilities: getAdminCapabilities("super_admin"),
  viewer: {
    displayName: "Admin Vuyela",
    email: "admin@vuyela.co.mz",
    avatarUrl: null
  },
  metrics: {
    totalBusinesses: 2,
    pendingBusinesses: 0,
    activeBusinesses: 2,
    totalProfiles: 3,
    activeSubscriptions: 2,
    openSupportTickets: 0,
    unresolvedFraudEvents: 0,
    completedTransactions: 47,
    grossVolumeMznMinor: 4_580_000,
    pointsIssued: 12_450,
    businessesCreatedLast30Days: 1,
    transactionsLast30Days: 47
  },
  analytics: {
    monthly: ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"].map((label, index) => ({
      label,
      transactions: 4 + index * 2,
      volumeMznMinor: monthlyVolumes[index] ?? 0,
      pointsIssued: 1_500 + index * 220
    })),
    daily: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label, index) => ({
      label,
      transactions: [6, 8, 7, 9, 10, 5, 2][index] ?? 0,
      volumeMznMinor: [550_000, 720_000, 680_000, 810_000, 930_000, 510_000, 380_000][index] ?? 0,
      pointsIssued: [120, 180, 150, 210, 240, 100, 60][index] ?? 0
    })),
    dailyRegistrations: Array.from({ length: 30 }, (_, index) => ({
      label: String(index + 1),
      transactions: [22, 28, 31, 27, 24, 19, 21, 25, 29, 33][index % 10] ?? 0,
      volumeMznMinor: 0,
      pointsIssued: 0
    })),
    hourly: [0, 3, 6, 9, 12, 15, 18, 21].flatMap((hour) =>
      ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, dayIndex) => ({
        day,
        hour,
        transactions:
          hour >= 12 && hour <= 18
            ? Math.max(1, 9 - dayIndex)
            : hour === 9
              ? 4
              : hour === 21
                ? 2
                : 0
      }))
    ),
    paymentMethods: [
      { label: "M-Pesa", value: 2_061_000, percentage: 45 },
      { label: "e-Mola", value: 1_282_400, percentage: 28 },
      { label: "Dinheiro", value: 824_400, percentage: 18 },
      { label: "mKesh", value: 274_800, percentage: 6 },
      { label: "Cartão", value: 137_400, percentage: 3 }
    ],
    categories: [
      { label: "Serviços de beleza", value: 2_840_000, percentage: 62 },
      { label: "Alimentação", value: 730_000, percentage: 16 },
      { label: "Produtos", value: 580_000, percentage: 13 },
      { label: "Outros", value: 430_000, percentage: 9 }
    ],
    topBusinesses: [
      {
        businessId: "business-preview-1",
        name: "Barbershop 21",
        transactions: 38,
        volumeMznMinor: 3_850_000,
        pointsIssued: 10_100
      },
      {
        businessId: "business-preview-2",
        name: "MangoShopp",
        transactions: 9,
        volumeMznMinor: 730_000,
        pointsIssued: 2_350
      }
    ],
    services: [
      { label: "API e base de dados", status: "Online", tone: "active" },
      { label: "Processamento M-Pesa", status: "Online", tone: "active" },
      { label: "Processamento e-Mola", status: "Online", tone: "active" },
      { label: "Sincronização POS", status: "Online", tone: "active" },
      { label: "Backups", status: "Último: hoje 03:00", tone: "neutral" }
    ],
    conversionFunnel: [
      { label: "Registos iniciados", value: 312, percentage: 100 },
      { label: "Cartões emitidos", value: 156, percentage: 50 },
      { label: "Primeira transação", value: 89, percentage: 29 }
    ],
    snapshot: {
      transactionsCurrent30Days: 47,
      transactionsPrevious30Days: 38,
      volumeCurrent30DaysMznMinor: 4_580_000,
      volumePrevious30DaysMznMinor: 4_080_000,
      customerProfiles: 2,
      administratorProfiles: 1,
      profilesCreatedLast30Days: 312,
      cardsCreatedLast30Days: 156,
      firstPurchasesLast30Days: 89,
      resolvedSupportTickets: 18,
      averageSupportResolutionHours: 1.2
    },
    redemptionRate: 85
  },
  businesses: [],
  businessDetail: null,
  categories: [],
  users: [],
  userDetail: null,
  subscriptions: [],
  plans: [],
  tickets: [],
  operators: [],
  fraudEvents: [],
  auditEntries: [
    {
      id: "audit-1",
      action: "business_approved",
      entityTable: "businesses",
      entityId: "business-preview-1",
      actorName: "Admin Vuyela",
      businessName: "Barbershop 21",
      operation: "business approved",
      changeSummary: "Aprovação do negócio Barbershop 21 realizada com sucesso.",
      ipAddress: "127.0.0.1",
      createdAt: "2026-08-31T18:55:00.000Z"
    },
    {
      id: "audit-2",
      action: "business_approved",
      entityTable: "businesses",
      entityId: "business-preview-2",
      actorName: "Admin Vuyela",
      businessName: "MangoShopp",
      operation: "business approved",
      changeSummary: "Aprovação do negócio MangoShopp realizada com sucesso.",
      ipAddress: "127.0.0.1",
      createdAt: "2026-08-31T18:42:00.000Z"
    },
    {
      id: "audit-3",
      action: "transaction_completed",
      entityTable: "transactions",
      entityId: "transaction-preview",
      actorName: "Operador POS",
      businessName: "Barbershop 21",
      operation: "transaction completed",
      changeSummary: "Transação concluída via M-Pesa com sucesso.",
      ipAddress: "127.0.0.1",
      createdAt: "2026-08-31T18:28:00.000Z"
    },
    {
      id: "audit-4",
      action: "backup_completed",
      entityTable: "platform",
      entityId: null,
      actorName: "Sistema",
      businessName: "Plataforma",
      operation: "backup completed",
      changeSummary: "Backup diário do sistema concluído com sucesso.",
      ipAddress: "127.0.0.1",
      createdAt: "2026-08-30T21:59:00.000Z"
    }
  ],
  settings: null
};

export default function AdminPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <ProtectedRouteStateView
      state={{ status: "authorized", principal: previewPrincipal }}
      title="Administração VUYELA"
      variant="admin"
    >
      <AdminDashboard principal={previewPrincipal} state={previewState} />
    </ProtectedRouteStateView>
  );
}
