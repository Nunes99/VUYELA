import { Activity, Bell, CreditCard, Home, Save, Search, User, UserPlus } from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input } from "../../vuyela-design-system/src/components/Field";
import { CustomerCardsView } from "@/features/customer-cards/card-list";
import { InAppNotificationList } from "@/features/notifications/in-app-list";
import { OfflineCardSync } from "@/features/pwa/offline-card-sync";
import { TransactionItem } from "../../vuyela-design-system/src/components/Loyalty";
import { OfferCard } from "../../vuyela-design-system/src/components/Loyalty";

import type { CustomerDashboardState } from "./data";
import type { CustomerDashboardViewModel } from "./model";
import { updateCustomerProfileAction } from "./actions";

interface CustomerDashboardViewProps {
  state: CustomerDashboardState;
  profileStatus?: string;
}

const navItems = [
  { href: "#inicio", label: "Início", icon: Home },
  { href: "#cartoes", label: "Cartões", icon: CreditCard },
  { href: "#explorar", label: "Explorar", icon: Search },
  { href: "#actividade", label: "Atividade", icon: Activity },
  { href: "/cliente/indicacoes", label: "Indicações", icon: UserPlus },
  { href: "#notificacoes", label: "Avisos", icon: Bell },
  { href: "#perfil", label: "Perfil", icon: User }
];

export function CustomerDashboardView({ state, profileStatus }: CustomerDashboardViewProps) {
  if (state.status === "error") {
    return (
      <div className="customer-painel-notice customer-painel-notice--error" role="status">
        <h2>Painel indisponível</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <CustomerDashboardNav />
      {state.status === "empty" ? <CustomerDashboardEmpty dashboard={state.dashboard} /> : null}
      <CustomerDashboardContent dashboard={state.dashboard} profileStatus={profileStatus} />
    </div>
  );
}

function CustomerDashboardNav() {
  return (
    <nav className="customer-dashboard-nav" aria-label="Navegação do cliente">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <a href={item.href} key={item.href} title={item.label}>
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
      <h2 id="customer-dashboard-empty">Ainda não há atividade</h2>
      <p>
        {dashboard.profile.displayName}, quando aderir a negócios VUYELA, os seus cartões,
        movimentos e ofertas públicas aparecem aqui.
      </p>
    </section>
  );
}

function CustomerDashboardContent({
  dashboard,
  profileStatus
}: {
  dashboard: CustomerDashboardViewModel;
  profileStatus?: string;
}) {
  return (
    <>
      <OfflineCardSync cards={dashboard.cards} />
      <section
        className="customer-dashboard-home"
        id="inicio"
        aria-labelledby="customer-home-title"
      >
        <div>
          <span className="customer-dashboard-eyebrow">Início</span>
          <h2 id="customer-home-title">Olá, {dashboard.profile.displayName}</h2>
          <p>Resumo dos seus cartões VUYELA e pontos promocionais por estabelecimento.</p>
        </div>

        <div className="customer-dashboard-stats" aria-label="Resumo de pontos">
          <span>
            Pontos<strong>{dashboard.totalPoints.toLocaleString("pt-MZ")}</strong>
          </span>
          <span>
            Equivalente<strong>{dashboard.totalValueMzn.toLocaleString("pt-MZ")} MZN</strong>
          </span>
          <span>
            Cartões ativos<strong>{dashboard.activeCardCount.toLocaleString("pt-MZ")}</strong>
          </span>
        </div>
      </section>

      <section id="cartoes" aria-labelledby="customer-cards-title">
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Cartões</span>
          <h2 id="customer-cards-title">Cartões digitais</h2>
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
          <h2 id="customer-explore-title">Ofertas públicas</h2>
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
            title="Sem ofertas públicas"
            body="Quando houver ofertas ativas, aparecem aqui."
          />
        )}
      </section>

      <section id="actividade" aria-labelledby="customer-activity-title">
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Atividade</span>
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
            title="Sem atividade recente"
            body="Compras, ganhos e resgates aparecem aqui."
          />
        )}
      </section>

      <section id="notificacoes" aria-labelledby="customer-notifications-title">
        <div className="customer-painel-section-heading customer-notification-heading">
          <div>
            <span className="customer-dashboard-eyebrow">Avisos</span>
            <h2 id="customer-notifications-title">Notificações</h2>
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
        {profileStatus === "guardado" ? (
          <p className="customer-profile-message customer-profile-message--success" role="status">
            Perfil atualizado. O telefone já pode ser usado para identificação no POS.
          </p>
        ) : null}
        {profileStatus === "erro" ? (
          <p className="customer-profile-message customer-profile-message--error" role="alert">
            Não foi possível atualizar o perfil. Confirme o nome e o formato do telefone.
          </p>
        ) : null}
        <form action={updateCustomerProfileAction} className="customer-profile-form">
          <div className="customer-profile-form__grid">
            <Input
              autoComplete="name"
              defaultValue={dashboard.profile.displayName}
              label="Nome"
              maxLength={100}
              minLength={2}
              name="displayName"
              required
              requiredMark
            />
            <Input
              autoComplete="tel"
              defaultValue={dashboard.profile.phone ?? ""}
              hint="Opcional. Permite identificar o seu cartão no POS sem usar o QR."
              inputMode="tel"
              label="Telefone"
              name="phone"
              placeholder="+258 84 000 0000"
            />
          </div>
          <div className="customer-profile-form__email">
            <span>E-mail</span>
            <strong>{dashboard.profile.email ?? "Não definido"}</strong>
            <small>O e-mail é gerido pelo sistema de autenticação.</small>
          </div>
          <label className="customer-profile-consent">
            <input
              defaultChecked={dashboard.profile.marketingConsent}
              name="marketingConsent"
              type="checkbox"
            />
            <span>
              <strong>Comunicações de benefícios</strong>
              <small>Receber ofertas e novidades dos programas a que aderiu.</small>
            </span>
          </label>
          <Button
            leadingIcon={<Save aria-hidden="true" size={18} />}
            type="submit"
            variant="primary"
          >
            Guardar perfil
          </Button>
        </form>
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
