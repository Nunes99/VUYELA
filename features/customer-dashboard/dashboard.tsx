import Link from "next/link";
import {
  Activity,
  Banknote,
  Bell,
  CreditCard,
  Gift,
  Home,
  Save,
  Search,
  Star,
  User,
  UserPlus
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input } from "../../vuyela-design-system/src/components/Field";
import { CustomerCardsView } from "@/features/customer-cards/card-list";
import { InAppNotificationList } from "@/features/notifications/in-app-list";
import { OfflineCardSync } from "@/features/pwa/offline-card-sync";
import { TransactionItem } from "../../vuyela-design-system/src/components/Loyalty";

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
          <Link href={item.href} key={item.href} title={item.label}>
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
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
        className="customer-dashboard-overview"
        id="inicio"
        aria-labelledby="customer-home-title"
      >
        <div className="customer-dashboard-overview__heading">
          <span className="customer-dashboard-eyebrow">Início</span>
          <h2 id="customer-home-title">Olá, {dashboard.profile.displayName}</h2>
          <p>Resumo da sua conta VUYELA</p>
        </div>
        <div className="customer-dashboard-stats" aria-label="Resumo da conta">
          <CustomerSummaryCard
            icon={Star}
            label="Pontos"
            note="pontos acumulados"
            tone="points"
            value={dashboard.totalPoints.toLocaleString("pt-MZ")}
          />
          <CustomerSummaryCard
            icon={Banknote}
            label="Equivalente"
            mobileLabel="Valor"
            note="valor resgatável"
            tone="value"
            value={`${dashboard.totalValueMzn.toLocaleString("pt-MZ")} MZN`}
          />
          <CustomerSummaryCard
            icon={CreditCard}
            label="Cartões"
            mobileLabel="Ativos"
            note={dashboard.activeCardCount === 1 ? "cartão ativo" : "cartões ativos"}
            tone="cards"
            value={dashboard.activeCardCount.toLocaleString("pt-MZ")}
          />
        </div>
      </section>

      <section
        className="customer-dashboard-cards-section"
        id="cartoes"
        aria-labelledby="customer-cards-title"
      >
        <div className="customer-dashboard-section-heading">
          <span className="customer-dashboard-eyebrow">Cartões</span>
          <h2 id="customer-cards-title">
            {dashboard.cards.length === 1 ? "Cartão digital" : "Cartões digitais"}
          </h2>
        </div>
        <CustomerCardsView
          state={
            dashboard.hasCards
              ? { status: "populated", cards: dashboard.cards }
              : { status: "empty" }
          }
        />
      </section>

      <div className="customer-dashboard-columns">
        <section
          className="customer-dashboard-offers-section"
          id="explorar"
          aria-labelledby="customer-explore-title"
        >
          <div className="customer-dashboard-section-heading">
            <div>
              <span className="customer-dashboard-eyebrow">Explorar</span>
              <h2 id="customer-explore-title">Ofertas públicas</h2>
            </div>
            {dashboard.hasOffers ? <Link href="/ofertas">Ver todas</Link> : null}
          </div>
          {dashboard.hasOffers ? (
            <div className="customer-dashboard-offers">
              {dashboard.offers.map((offer) => (
                <article className="customer-dashboard-offer" key={offer.id}>
                  <span>
                    <Gift aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <strong>{offer.title}</strong>
                    <b>{offer.businessName}</b>
                    <small>{offer.description}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <SectionEmpty
              icon={Gift}
              title="Sem ofertas públicas"
              body="Quando houver ofertas ativas de estabelecimentos parceiros, elas aparecerão aqui."
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
              icon={Activity}
              title="Sem movimentos recentes"
              body="O seu histórico de compras, pontos ganhos e resgates aparecerá aqui."
            />
          )}
        </section>
      </div>

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

function CustomerSummaryCard({
  icon: Icon,
  label,
  mobileLabel,
  note,
  tone,
  value
}: {
  icon: typeof Star;
  label: string;
  mobileLabel?: string | undefined;
  note: string;
  tone: "points" | "value" | "cards";
  value: string;
}) {
  return (
    <article className={`customer-summary-card customer-summary-card--${tone}`}>
      <span className="customer-summary-card__label" data-mobile-label={mobileLabel}>
        {label}
      </span>
      <span className="customer-summary-card__icon">
        <Icon aria-hidden="true" size={22} />
      </span>
      <strong>{value}</strong>
      <small>{note}</small>
      <span className="customer-summary-card__sparkline" aria-hidden="true" />
    </article>
  );
}

function SectionEmpty({
  title,
  body,
  icon: Icon
}: {
  title: string;
  body: string;
  icon?: typeof Gift | undefined;
}) {
  return (
    <div className="customer-dashboard-section-empty" role="status">
      {Icon ? (
        <span className="customer-dashboard-section-empty__icon">
          <Icon aria-hidden="true" size={24} />
        </span>
      ) : null}
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
