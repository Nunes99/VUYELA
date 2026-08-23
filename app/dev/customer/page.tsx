import { notFound } from "next/navigation";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerDashboardView } from "@/features/customer-dashboard/dashboard";
import type { CustomerDashboardViewName } from "@/features/customer-dashboard/dashboard";
import { buildCustomerDashboardViewModel } from "@/features/customer-dashboard/model";
import { buildDigitalCustomerCard } from "@/features/customer-cards/model";

const cards = [
  ["card-1", "business-1", "Barbershop 21", "VY-6885-4797", 3450, 6200],
  ["card-2", "business-2", "Café Maputo", "VY-2391-1123", 820, 1700]
].map(([id, businessId, businessName, cardNumber, availablePoints, lifetimeEarned]) =>
  buildDigitalCustomerCard({
    id: String(id),
    businessId: String(businessId),
    businessName: String(businessName),
    businessLogoUrl: null,
    customerName: "Nunes José",
    cardNumber: String(cardNumber),
    status: "active",
    joinedAt: "2026-09-24T08:00:00.000Z",
    availablePoints: Number(availablePoints),
    lifetimeEarned: Number(lifetimeEarned),
    pointValueMznMinor: 10,
    pointsExpireAfterDays: 365,
    tiers: [
      { id: "base", name: "Silver", minimumLifetimePoints: 0, sortOrder: 0 },
      { id: "gold", name: "Gold", minimumLifetimePoints: 5000, sortOrder: 1 }
    ]
  })
);

const dashboard = buildCustomerDashboardViewModel({
  cards,
  profile: {
    displayName: "Nunes José",
    email: "nunes.jose@lemote.com",
    phone: "+258 84 123 4567",
    locale: "pt-MZ",
    marketingConsent: true
  },
  activity: [
    {
      id: "activity-1",
      businessName: "Barbershop 21",
      cardName: "Premium Barbershop",
      description: "Corte de cabelo e barba",
      points: 300,
      occurredAt: new Date().toISOString(),
      tone: "earn"
    },
    {
      id: "activity-2",
      businessName: "Café Maputo",
      cardName: "Fidelidade Café",
      description: "Café e pastel de nata",
      points: 120,
      occurredAt: new Date(Date.now() - 86400000).toISOString(),
      tone: "earn"
    }
  ],
  offers: [
    {
      id: "offer-1",
      businessName: "Barbershop 21",
      title: "20% no corte premium",
      description: "Válido até ao final do mês."
    },
    {
      id: "offer-2",
      businessName: "Café Maputo",
      title: "Compre 1 e ganhe outro café",
      description: "Disponível em todas as lojas."
    },
    {
      id: "offer-3",
      businessName: "Farmácia Central",
      title: "10% em vitaminas",
      description: "Benefício para clientes VUYELA."
    }
  ],
  notifications: [
    {
      id: "notification-1",
      businessName: "Barbershop 21",
      subject: "Pontos acumulados",
      body: "Ganhou 300 pontos na sua última visita.",
      createdAt: new Date().toISOString(),
      readAt: null
    },
    {
      id: "notification-2",
      businessName: "Farmácia Central",
      subject: "Nova oferta disponível",
      body: "Foi adicionado um novo desconto em vitaminas.",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      readAt: new Date().toISOString()
    }
  ]
});

const titles: Record<CustomerDashboardViewName, string> = {
  inicio: "Painel do Cliente",
  cartoes: "Gerir Cartões",
  ofertas: "Explorar Ofertas",
  atividade: "Histórico de Atividade",
  notificacoes: "Avisos e Alertas",
  perfil: "O Seu Perfil"
};

function viewFrom(value: string | string[] | undefined): CustomerDashboardViewName {
  return typeof value === "string" && value in titles
    ? (value as CustomerDashboardViewName)
    : "inicio";
}

export default async function CustomerPreviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const activeView = viewFrom(params.vista);

  return (
    <ProtectedRouteStateView
      customerName={dashboard.profile.displayName}
      state={{
        status: "authorized",
        principal: {
          profileId: "preview",
          profileRole: "customer",
          mfaVerified: true,
          businessMemberships: []
        }
      }}
      title={titles[activeView]}
      variant="customer"
    >
      <CustomerDashboardView
        activeView={activeView}
        cardId={typeof params.cartao === "string" ? params.cartao : undefined}
        editProfile={params.editar === "1"}
        state={{ status: "populated", dashboard }}
      />
    </ProtectedRouteStateView>
  );
}
