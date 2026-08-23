import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Banknote,
  Bell,
  ChevronRight,
  CreditCard,
  Gift,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Star,
  User,
  UserPlus
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input } from "../../vuyela-design-system/src/components/Field";
import { CustomerCardVisual } from "@/features/customer-cards/customer-card-visual";
import { InAppNotificationList } from "@/features/notifications/in-app-list";
import { OfflineCardSync } from "@/features/pwa/offline-card-sync";

import { updateCustomerProfileAction } from "./actions";
import { CustomerActivityTable } from "./activity-table";
import type { CustomerDashboardState } from "./data";
import type { CustomerDashboardViewModel } from "./model";

export type CustomerDashboardViewName =
  "inicio" | "cartoes" | "ofertas" | "atividade" | "notificacoes" | "perfil";

interface CustomerDashboardViewProps {
  state: CustomerDashboardState;
  activeView?: CustomerDashboardViewName;
  cardId?: string | undefined;
  editProfile?: boolean;
  profileStatus?: string;
}

const navItems = [
  { href: "/cliente", view: "inicio", label: "Início", icon: Home },
  { href: "/cliente?vista=cartoes", view: "cartoes", label: "Cartões", icon: CreditCard },
  { href: "/cliente?vista=ofertas", view: "ofertas", label: "Explorar", icon: Search },
  { href: "/cliente?vista=atividade", view: "atividade", label: "Atividade", icon: Activity },
  { href: "/cliente/indicacoes", view: "indicacoes", label: "Indicações", icon: UserPlus },
  {
    href: "/cliente?vista=notificacoes",
    view: "notificacoes",
    label: "Avisos",
    icon: Bell
  },
  { href: "/cliente?vista=perfil", view: "perfil", label: "Perfil", icon: User }
] as const;

export function CustomerDashboardView({
  state,
  activeView = "inicio",
  cardId,
  editProfile = false,
  profileStatus
}: CustomerDashboardViewProps) {
  if (state.status === "error") {
    return (
      <div className="customer-painel-notice customer-painel-notice--error" role="status">
        <h2>Painel indisponível</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  const selectedCard = cardId
    ? state.dashboard.cards.find((card) => card.id === cardId)
    : undefined;

  return (
    <div className="customer-dashboard">
      <CustomerDashboardNav activeView={activeView} />
      {state.status === "empty" && activeView === "inicio" ? (
        <CustomerDashboardEmpty dashboard={state.dashboard} />
      ) : null}
      <OfflineCardSync cards={state.dashboard.cards} />
      <main className="customer-dashboard-view">
        {activeView === "inicio" ? <CustomerHome dashboard={state.dashboard} /> : null}
        {activeView === "cartoes" ? (
          selectedCard ? (
            <CustomerCardDetail card={selectedCard} />
          ) : (
            <CustomerCardsHub dashboard={state.dashboard} />
          )
        ) : null}
        {activeView === "ofertas" ? <CustomerOffers dashboard={state.dashboard} /> : null}
        {activeView === "atividade" ? <CustomerActivity dashboard={state.dashboard} /> : null}
        {activeView === "notificacoes" ? (
          <CustomerNotifications dashboard={state.dashboard} />
        ) : null}
        {activeView === "perfil" ? (
          <CustomerProfile
            dashboard={state.dashboard}
            editProfile={editProfile}
            profileStatus={profileStatus}
          />
        ) : null}
      </main>
    </div>
  );
}

function CustomerDashboardNav({ activeView }: { activeView: CustomerDashboardViewName }) {
  return (
    <nav className="customer-dashboard-nav" aria-label="Navegação do cliente">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.view === activeView;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "is-active" : undefined}
            href={item.href}
            key={item.href}
            title={item.label}
          >
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

function CustomerHome({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <>
      <section className="customer-dashboard-overview" aria-labelledby="customer-home-title">
        <div className="customer-dashboard-overview__heading">
          <span className="customer-dashboard-eyebrow">Painel</span>
          <h2 id="customer-home-title">Olá, {dashboard.profile.displayName}</h2>
          <p>Acompanhe os seus pontos, cartões e benefícios num só lugar.</p>
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
            note="valor disponível"
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

      <section className="customer-home-section" aria-labelledby="home-cards-title">
        <CustomerSectionHeader
          actionHref="/cliente?vista=cartoes"
          actionLabel="Gerir cartões"
          eyebrow="Os seus cartões"
          title="Cartões digitais"
          titleId="home-cards-title"
        />
        {dashboard.hasCards ? (
          <div className="customer-home-card-grid">
            {dashboard.cards.slice(0, 2).map((card) => (
              <Link
                className="customer-home-card-link"
                href={`/cliente?vista=cartoes&cartao=${encodeURIComponent(card.id)}`}
                key={card.id}
              >
                <CustomerCardVisual card={card} compact />
                <span>
                  Ver detalhes <ChevronRight aria-hidden="true" size={16} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <SectionEmpty
            icon={CreditCard}
            title="Ainda não tem cartões"
            body="Quando aderir a um negócio VUYELA, o cartão digital aparecerá aqui."
          />
        )}
      </section>

      <div className="customer-dashboard-columns">
        <section>
          <CustomerSectionHeader
            actionHref="/cliente?vista=atividade"
            actionLabel="Ver histórico"
            eyebrow="Atividade"
            title="Movimentos recentes"
            titleId="home-activity-title"
          />
          <CustomerActivityPreview dashboard={dashboard} />
        </section>
        <section>
          <CustomerSectionHeader
            actionHref="/cliente?vista=ofertas"
            actionLabel="Ver todas"
            eyebrow="Explorar"
            title="Ofertas em destaque"
            titleId="home-offers-title"
          />
          <CustomerOfferGrid dashboard={dashboard} limit={2} />
        </section>
      </div>
    </>
  );
}

function CustomerCardsHub({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-cards-title">
      <CustomerPageHeading
        eyebrow="Gerir cartões"
        title="Painel de Cartões"
        description="Consulte os saldos e os benefícios de cada programa de fidelização."
        titleId="customer-cards-title"
      />
      {dashboard.hasCards ? (
        <div className="customer-cards-hub-grid">
          {dashboard.cards.map((card) => (
            <article className="customer-card-hub-item" key={card.id}>
              <CustomerCardVisual card={card} compact />
              <div className="customer-card-hub-item__content">
                <div>
                  <span>{card.currentTierName}</span>
                  <h3>{card.businessName}</h3>
                  <p>{card.cardNumber}</p>
                </div>
                <strong>{card.availablePoints.toLocaleString("pt-MZ")} Pts</strong>
                <small>{card.valueMzn.toLocaleString("pt-MZ")} MZN</small>
                <Link href={`/cliente?vista=cartoes&cartao=${encodeURIComponent(card.id)}`}>
                  Ver cartão <ChevronRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <SectionEmpty
          icon={CreditCard}
          title="Ainda não tem cartões"
          body="Os cartões emitidos por negócios VUYELA aparecerão nesta área."
        />
      )}
    </section>
  );
}

function CustomerCardDetail({ card }: { card: CustomerDashboardViewModel["cards"][number] }) {
  return (
    <section aria-labelledby="customer-card-detail-title">
      <Link className="customer-back-link" href="/cliente?vista=cartoes">
        <ArrowLeft aria-hidden="true" size={17} /> Voltar aos cartões
      </Link>
      <CustomerPageHeading
        eyebrow="Detalhes do cartão"
        title={card.businessName}
        description={`${card.currentTierName} · ${card.statusLabel}`}
        titleId="customer-card-detail-title"
      />
      <div className="customer-card-detail-grid">
        <div className="customer-card-detail-visual">
          <CustomerCardVisual card={card} />
          <p>Use o botão no cartão para alternar entre a frente e o verso.</p>
        </div>
        <div className="customer-card-identification">
          <span className="customer-dashboard-eyebrow">Identificação no estabelecimento</span>
          <h3>QR Code do cartão</h3>
          <p>
            Apresente este código no momento da compra. O número do cartão ou o telefone associado
            também podem ser usados no POS.
          </p>
          <div className="customer-card-identification__facts">
            <span>
              Número do cliente<strong>{card.cardNumber}</strong>
            </span>
            <span>
              Saldo disponível
              <strong>{card.availablePoints.toLocaleString("pt-MZ")} pontos</strong>
            </span>
            <span>
              Valor equivalente<strong>{card.valueMzn.toLocaleString("pt-MZ")} MZN</strong>
            </span>
            <span>
              Validade<strong>{card.expiryLabel}</strong>
            </span>
          </div>
          <div className="customer-card-security-note">
            <ShieldCheck aria-hidden="true" size={20} />
            <span>
              <strong>Código pessoal e seguro</strong>
              <small>Não partilhe capturas do seu QR Code com terceiros.</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomerActivity({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-activity-title">
      <CustomerPageHeading
        eyebrow="Atividade"
        title="Histórico de Atividade"
        description="Consulte todos os pontos ganhos e utilizados nos seus cartões."
        titleId="customer-activity-title"
      />
      {dashboard.hasActivity ? (
        <CustomerActivityTable activity={dashboard.activity} />
      ) : (
        <SectionEmpty
          icon={Activity}
          title="Sem movimentos"
          body="O seu histórico de compras, pontos ganhos e utilizações aparecerá aqui."
        />
      )}
    </section>
  );
}

function CustomerOffers({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-offers-title">
      <CustomerPageHeading
        eyebrow="Explorar ofertas"
        title="Ganhe e dobre os pontos"
        description="Descubra benefícios exclusivos dos estabelecimentos VUYELA."
        titleId="customer-offers-title"
      />
      <div className="customer-offers-hero">
        <Image
          alt="Refeição num estabelecimento parceiro VUYELA"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 75vw"
          src="/images/offer-prawns.jpg"
        />
        <div>
          <span>Benefícios exclusivos</span>
          <h3>Cada compra pode valer ainda mais.</h3>
          <p>Consulte as campanhas disponíveis e acumule pontos nos negócios que prefere.</p>
        </div>
      </div>
      <div className="customer-offers-heading">
        <h3>Todas as ofertas disponíveis</h3>
        <span>{dashboard.offers.length.toLocaleString("pt-MZ")} ofertas</span>
      </div>
      <CustomerOfferGrid dashboard={dashboard} />
    </section>
  );
}

function CustomerNotifications({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-notifications-title">
      <CustomerPageHeading
        eyebrow="Centro de avisos"
        title="Notificações"
        description="Novidades, movimentos e campanhas dos seus programas."
        titleId="customer-notifications-title"
      />
      <div className="customer-notifications-summary">
        <Bell aria-hidden="true" size={22} />
        <span>
          <strong>{dashboard.unreadNotificationCount.toLocaleString("pt-MZ")}</strong>
          <small>por ler</small>
        </span>
      </div>
      <InAppNotificationList notifications={dashboard.notifications} />
    </section>
  );
}

function CustomerProfile({
  dashboard,
  editProfile,
  profileStatus
}: {
  dashboard: CustomerDashboardViewModel;
  editProfile: boolean;
  profileStatus?: string;
}) {
  if (editProfile) {
    return (
      <section aria-labelledby="customer-profile-edit-title">
        <Link className="customer-back-link" href="/cliente?vista=perfil">
          <ArrowLeft aria-hidden="true" size={17} /> Voltar ao perfil
        </Link>
        <CustomerPageHeading
          eyebrow="Definições"
          title="Editar Perfil"
          description="Mantenha os seus dados atualizados para facilitar a identificação no POS."
          titleId="customer-profile-edit-title"
        />
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
        <CustomerProfileForm dashboard={dashboard} />
      </section>
    );
  }

  return (
    <section aria-labelledby="customer-profile-title">
      <CustomerPageHeading
        eyebrow="Conta"
        title="O Seu Perfil"
        description="Consulte os seus dados pessoais e preferências."
        titleId="customer-profile-title"
      />
      <div className="customer-profile-layout">
        <div className="customer-profile-card">
          <span className="customer-profile-avatar" aria-hidden="true">
            {initials(dashboard.profile.displayName)}
          </span>
          <h3>{dashboard.profile.displayName}</h3>
          <p>Cliente VUYELA</p>
          <strong>Membro desde {formatMemberDate(dashboard.cards[0]?.joinedAt)}</strong>
        </div>
        <div className="customer-profile-information">
          <div className="customer-profile-information__heading">
            <div>
              <span className="customer-dashboard-eyebrow">Informação pessoal</span>
              <h3>Dados da conta</h3>
            </div>
            <Link href="/cliente?vista=perfil&editar=1">
              <Pencil aria-hidden="true" size={16} /> Editar perfil
            </Link>
          </div>
          <dl>
            <ProfileFact icon={User} label="Nome completo" value={dashboard.profile.displayName} />
            <ProfileFact
              icon={Mail}
              label="E-mail"
              value={dashboard.profile.email ?? "Não definido"}
            />
            <ProfileFact
              icon={Phone}
              label="Telefone"
              value={dashboard.profile.phone ?? "Não definido"}
            />
            <ProfileFact icon={MapPin} label="Região" value="Moçambique" />
          </dl>
          <div className="customer-profile-preferences">
            <span>
              <strong>Comunicações de benefícios</strong>
              <small>Ofertas e novidades dos seus programas.</small>
            </span>
            <b>{dashboard.profile.marketingConsent ? "Ativas" : "Desativadas"}</b>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileFact({
  icon: Icon,
  label,
  value
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>
        <Icon aria-hidden="true" size={18} /> {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function CustomerProfileForm({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <form action={updateCustomerProfileAction} className="customer-profile-form">
      <div className="customer-profile-form__grid">
        <Input
          autoComplete="name"
          defaultValue={dashboard.profile.displayName}
          label="Nome completo"
          maxLength={100}
          minLength={2}
          name="displayName"
          required
          requiredMark
        />
        <Input
          autoComplete="tel"
          defaultValue={dashboard.profile.phone ?? ""}
          hint="Opcional. Permite identificar o cartão no POS sem usar o QR."
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
      <Button leadingIcon={<Save aria-hidden="true" size={18} />} type="submit" variant="primary">
        Guardar alterações
      </Button>
    </form>
  );
}

function CustomerActivityPreview({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  if (!dashboard.hasActivity) {
    return (
      <SectionEmpty
        icon={Activity}
        title="Sem movimentos recentes"
        body="O histórico de pontos aparecerá aqui."
      />
    );
  }

  return (
    <div className="customer-activity-preview">
      {dashboard.activity.slice(0, 4).map((item) => (
        <article key={item.id}>
          <span className={`is-${item.tone}`}>
            <Activity aria-hidden="true" size={17} />
          </span>
          <div>
            <strong>{item.businessName}</strong>
            <small>{item.description}</small>
          </div>
          <b className={`is-${item.tone}`}>
            {item.points > 0 ? "+" : ""}
            {item.points.toLocaleString("pt-MZ")} Pts
          </b>
        </article>
      ))}
    </div>
  );
}

function CustomerOfferGrid({
  dashboard,
  limit
}: {
  dashboard: CustomerDashboardViewModel;
  limit?: number;
}) {
  const offers = typeof limit === "number" ? dashboard.offers.slice(0, limit) : dashboard.offers;

  if (offers.length === 0) {
    return (
      <SectionEmpty
        icon={Gift}
        title="Sem ofertas públicas"
        body="As campanhas dos estabelecimentos parceiros aparecerão aqui."
      />
    );
  }

  return (
    <div className="customer-offer-grid">
      {offers.map((offer, index) => (
        <article className="customer-offer-card" key={offer.id}>
          <div className="customer-offer-card__image">
            <Image
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 32vw"
              src={index % 2 === 0 ? "/images/offer-prawns.jpg" : "/images/offer-bakery.jpg"}
            />
            <span>Oferta</span>
          </div>
          <div>
            <small>{offer.businessName}</small>
            <h3>{offer.title}</h3>
            <p>{offer.description}</p>
            <Link href="/ofertas">
              Ver oferta <ChevronRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </article>
      ))}
    </div>
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

function CustomerPageHeading({
  eyebrow,
  title,
  description,
  titleId
}: {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
}) {
  return (
    <header className="customer-page-heading">
      <span className="customer-dashboard-eyebrow">{eyebrow}</span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function CustomerSectionHeader({
  eyebrow,
  title,
  titleId,
  actionHref,
  actionLabel
}: {
  eyebrow: string;
  title: string;
  titleId: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="customer-dashboard-section-heading">
      <div>
        <span className="customer-dashboard-eyebrow">{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
      </div>
      <Link href={actionHref}>
        {actionLabel} <ChevronRight aria-hidden="true" size={16} />
      </Link>
    </div>
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "C"}${parts[1]?.[0] ?? "V"}`.toUpperCase();
}

function formatMemberDate(value: string | undefined): string {
  return value
    ? new Intl.DateTimeFormat("pt-MZ", { month: "long", year: "numeric" }).format(new Date(value))
    : "hoje";
}
