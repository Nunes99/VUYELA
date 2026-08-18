import { Activity, Bell, CreditCard, Home, Search, User } from "lucide-react";

import { CustomerCardsView } from "@/features/customer-cards/card-list";
import { InAppNotificationList } from "@/features/notifications/in-app-list";
import { TransactionItem } from "../../vuyela-design-system/src/components/Loyalty";
import { OfferCard } from "../../vuyela-design-system/src/components/Loyalty";

import type { CustomerDashboardState } from "./data";
import type { CustomerDashboardViewModel } from "./model";

interface CustomerDashboardViewProps {
  state: CustomerDashboardState;
}

const navItems = [
  { href: "#inicio", label: "Inicio", icon: Home },
  { href: "#cartoes", label: "Cartoes", icon: CreditCard },
  { href: "#explorar", label: "Explorar", icon: Search },
  { href: "#actividade", label: "Actividade", icon: Activity },
  { href: "#notificacoes", label: "Avisos", icon: Bell },
  { href: "#perfil", label: "Perfil", icon: User }
];

export function CustomerDashboardView({ state }: CustomerDashboardViewProps) {
  if (state.status === "error") {
    return (
      <div className="customer-dashboard-notice customer-dashboard-notice--error" role="status">
        <h2>Dashboard indisponivel</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <CustomerDashboardNav />
      {state.status === "empty" ? <CustomerDashboardEmpty dashboard={state.dashboard} /> : null}
      <CustomerDashboardContent dashboard={state.dashboard} />
    </div>
  );
}

function CustomerDashboardNav() {
  return (
    <nav className="customer-dashboard-nav" aria-label="Navegacao do cliente">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <a href={item.href} key={item.href}>
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function CustomerDashboardEmpty({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section className="customer-dashboard-notice" aria-labelledby="customer-dashboard-empty">
      <h2 id="customer-dashboard-empty">Ainda nao ha actividade</h2>
      <p>
        {dashboard.profile.displayName}, quando aderir a negocios VUYELA, os seus cartoes,
        movimentos e ofertas publicas aparecem aqui.
      </p>
    </section>
  );
}

function CustomerDashboardContent({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <>
      <section
        className="customer-dashboard-home"
        id="inicio"
        aria-labelledby="customer-home-title"
      >
        <div>
          <span className="customer-dashboard-eyebrow">Inicio</span>
          <h2 id="customer-home-title">Ola, {dashboard.profile.displayName}</h2>
          <p>Resumo dos seus cartoes VUYELA e pontos promocionais por estabelecimento.</p>
        </div>

        <div className="customer-dashboard-stats" aria-label="Resumo de pontos">
          <span>
            Pontos<strong>{dashboard.totalPoints.toLocaleString("pt-MZ")}</strong>
          </span>
          <span>
            Equivalente<strong>{dashboard.totalValueMzn.toLocaleString("pt-MZ")} MZN</strong>
          </span>
          <span>
            Cartoes activos<strong>{dashboard.activeCardCount.toLocaleString("pt-MZ")}</strong>
          </span>
        </div>
      </section>

      <section id="cartoes" aria-labelledby="customer-cards-title">
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Cartoes</span>
          <h2 id="customer-cards-title">Cartoes digitais</h2>
        </div>
        <CustomerCardsView
          state={
            dashboard.hasCards
              ? { status: "populated", cards: dashboard.cards }
              : { status: "empty" }
          }
        />
      </section>

      <section id="explorar" aria-labelledby="customer-explore-title">
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Explorar</span>
          <h2 id="customer-explore-title">Ofertas publicas</h2>
        </div>
        {dashboard.hasOffers ? (
          <div className="customer-dashboard-offers">
            {dashboard.offers.map((offer) => (
              <OfferCard
                businessName={offer.businessName}
                description={offer.description}
                key={offer.id}
                title={offer.title}
              />
            ))}
          </div>
        ) : (
          <SectionEmpty
            title="Sem ofertas publicas"
            body="Quando houver ofertas activas, aparecem aqui."
          />
        )}
      </section>

      <section id="actividade" aria-labelledby="customer-activity-title">
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Actividade</span>
          <h2 id="customer-activity-title">Movimentos recentes</h2>
        </div>
        {dashboard.hasActivity ? (
          <div className="customer-dashboard-activity">
            {dashboard.activity.map((item) => (
              <TransactionItem
                description={item.description}
                key={item.id}
                points={item.points}
                timestamp={formatDate(item.occurredAt)}
                title={item.businessName}
                tone={item.tone}
              />
            ))}
          </div>
        ) : (
          <SectionEmpty
            title="Sem actividade recente"
            body="Compras, ganhos e resgates aparecem aqui."
          />
        )}
      </section>

      <section id="notificacoes" aria-labelledby="customer-notifications-title">
        <div className="customer-dashboard-section-heading customer-notification-heading">
          <div>
            <span className="customer-dashboard-eyebrow">Avisos</span>
            <h2 id="customer-notifications-title">Notificacoes</h2>
          </div>
          {dashboard.unreadNotificationCount > 0 ? (
            <span className="customer-notification-count">
              {dashboard.unreadNotificationCount.toLocaleString("pt-MZ")} por ler
            </span>
          ) : null}
        </div>
        <InAppNotificationList notifications={dashboard.notifications} />
      </section>

      <section id="perfil" aria-labelledby="customer-profile-title">
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Perfil</span>
          <h2 id="customer-profile-title">Dados da conta</h2>
        </div>
        <dl className="customer-dashboard-profile">
          <div>
            <dt>Nome</dt>
            <dd>{dashboard.profile.displayName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{dashboard.profile.email ?? "Nao definido"}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{dashboard.profile.phone ?? "Nao definido"}</dd>
          </div>
          <div>
            <dt>Idioma</dt>
            <dd>{dashboard.profile.locale}</dd>
          </div>
          <div>
            <dt>Marketing</dt>
            <dd>{dashboard.profile.marketingConsent ? "Consentido" : "Nao consentido"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function SectionEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="customer-dashboard-section-empty" role="status">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
