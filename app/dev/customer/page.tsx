import { notFound } from "next/navigation";

import { ProtectedRouteStateView } from "@/components/auth/protected-route-state";
import { CustomerDashboardView } from "@/features/customer-dashboard/dashboard";
import type { CustomerDashboardViewName } from "@/features/customer-dashboard/dashboard";
import { buildCustomerDashboardViewModel } from "@/features/customer-dashboard/model";
import { buildDigitalCustomerCard } from "@/features/customer-cards/model";
import type { MarketplaceBusiness } from "@/features/public-marketplace/model";

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

const previewBusinesses: MarketplaceBusiness[] = [
  {
    id: "business-1",
    slug: "barbershop-21",
    name: "Barbershop 21",
    description: "Cortes, barba e cuidados pessoais com benefícios em cada visita.",
    phone: "+258 84 000 0021",
    email: "ola@barbershop21.co.mz",
    websiteUrl: null,
    logoUrl: null,
    coverUrl: "/images/offer-prawns.jpg",
    activatedAt: "2026-08-01T08:00:00.000Z",
    category: {
      id: "category-beauty",
      slug: "beleza",
      name: "Beleza",
      description: "Beleza e cuidados pessoais"
    },
    program: {
      name: "YELAS Barbershop 21",
      earnRate: 0.1,
      pointValueMznMinor: 100,
      maximumRedemptionPercent: 50,
      pointsExpireAfterDays: 365,
      terms: null
    },
    branches: [previewBranch("business-1", "barbershop-21-maputo", "Maputo")],
    offers: []
  },
  {
    id: "business-2",
    slug: "cafe-maputo",
    name: "Café Maputo",
    description: "Café moçambicano, pastelaria fresca e recompensas para clientes habituais.",
    phone: "+258 84 000 0012",
    email: "ola@cafemaputo.co.mz",
    websiteUrl: null,
    logoUrl: null,
    coverUrl: "/images/offer-bakery.jpg",
    activatedAt: "2026-08-02T08:00:00.000Z",
    category: {
      id: "category-restaurants",
      slug: "restaurantes",
      name: "Restaurantes",
      description: "Restauração e cafés"
    },
    program: {
      name: "Fidelidade Café Maputo",
      earnRate: 0.05,
      pointValueMznMinor: 100,
      maximumRedemptionPercent: 50,
      pointsExpireAfterDays: 180,
      terms: null
    },
    branches: [previewBranch("business-2", "cafe-maputo-central", "Maputo")],
    offers: []
  },
  {
    id: "business-3",
    slug: "farmacia-central",
    name: "Farmácia Central",
    description: "Saúde, bem-estar e um programa de YELAS disponível para adesão imediata.",
    phone: "+258 84 000 0033",
    email: "apoio@farmaciacentral.co.mz",
    websiteUrl: null,
    logoUrl: null,
    coverUrl: "/images/offer-prawns.jpg",
    activatedAt: "2026-08-03T08:00:00.000Z",
    category: {
      id: "category-health",
      slug: "saude",
      name: "Saúde",
      description: "Saúde e bem-estar"
    },
    program: {
      name: "Mais Saúde",
      earnRate: 0.08,
      pointValueMznMinor: 100,
      maximumRedemptionPercent: 40,
      pointsExpireAfterDays: 365,
      terms: null
    },
    branches: [previewBranch("business-3", "farmacia-central-maputo", "Maputo")],
    offers: []
  }
];

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
      businessId: "business-barbershop",
      businessName: "Barbershop 21",
      title: "20% no corte premium",
      description: "Válido até ao final do mês.",
      categorySlug: "beleza",
      categoryName: "Beleza",
      href: "/estabelecimentos/barbershop-21",
      customerCardId: "card-barbershop",
      isFavorite: true,
      offerNotificationsEnabled: true,
      claimId: null,
      claimCode: null,
      claimStatus: null,
      claimExpiresAt: null
    },
    {
      id: "offer-2",
      businessId: "business-cafe",
      businessName: "Café Maputo",
      title: "Compre 1 e ganhe outro café",
      description: "Disponível em todas as lojas.",
      categorySlug: "restaurantes",
      categoryName: "Restaurantes",
      href: "/estabelecimentos/cafe-maputo",
      customerCardId: "card-cafe",
      isFavorite: false,
      offerNotificationsEnabled: true,
      claimId: null,
      claimCode: null,
      claimStatus: null,
      claimExpiresAt: null
    },
    {
      id: "offer-3",
      businessId: "business-pharmacy",
      businessName: "Farmácia Central",
      title: "10% em vitaminas",
      description: "Benefício para clientes VUYELA.",
      categorySlug: "saude",
      categoryName: "Saúde",
      href: "/estabelecimentos/farmacia-central",
      customerCardId: "card-pharmacy",
      isFavorite: false,
      offerNotificationsEnabled: false,
      claimId: null,
      claimCode: null,
      claimStatus: null,
      claimExpiresAt: null
    }
  ],
  notifications: [
    {
      id: "notification-1",
      businessName: "Barbershop 21",
      subject: "YELAS acumuladas",
      body: "Ganhou 300 YELAS na sua última visita.",
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
  negocios: "Descobrir Negócios",
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
          accountType: "customer",
          mfaVerified: true,
          businessMemberships: []
        }
      }}
      title={titles[activeView]}
      variant="customer"
    >
      <CustomerDashboardView
        activeView={activeView}
        businesses={previewBusinesses}
        cardId={typeof params.cartao === "string" ? params.cartao : undefined}
        editProfile={params.editar === "1"}
        membershipStatus={typeof params.adesao === "string" ? params.adesao : undefined}
        state={{ status: "populated", dashboard }}
      />
    </ProtectedRouteStateView>
  );
}

function previewBranch(businessId: string, id: string, city: string) {
  return {
    id,
    businessId,
    slug: id,
    name: "Filial principal",
    city,
    province: "Maputo",
    addressLine: null,
    phone: null,
    email: null,
    latitude: null,
    longitude: null,
    isPrimary: true,
    openingHours: null,
    timezone: "Africa/Maputo"
  };
}
