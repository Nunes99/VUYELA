import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Home,
  Languages,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Plus,
  QrCode,
  Pencil,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Star,
  User
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input } from "../../vuyela-design-system/src/components/Field";
import { CustomerCardVisual } from "@/features/customer-cards/customer-card-visual";
import { InAppNotificationList } from "@/features/notifications/in-app-list";
import { OfflineCardSync } from "@/features/pwa/offline-card-sync";
import { signOutAction } from "@/features/auth/actions";

import { updateCustomerProfileAction } from "./actions";
import { CustomerActivityTable } from "./activity-table";
import { CustomerMobileCardDetail } from "./mobile-card-detail";
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
  {
    href: "/cliente?vista=cartoes",
    view: "cartoes",
    label: "Gerir Cartões",
    mobileLabel: "Cartões",
    icon: CreditCard
  },
  {
    href: "/cliente?vista=ofertas",
    view: "ofertas",
    label: "Explorar Ofertas",
    mobileLabel: "Ofertas",
    icon: Gift
  },
  { href: "/cliente?vista=atividade", view: "atividade", label: "Atividade", icon: Activity },
  {
    href: "/cliente?vista=perfil",
    view: "perfil",
    label: "O Seu Perfil",
    mobileLabel: "Perfil",
    icon: User
  }
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
      <OfflineCardSync cards={state.dashboard.cards} />
      <main className="customer-dashboard-view">
        {activeView === "inicio" ? <CustomerHome dashboard={state.dashboard} /> : null}
        {activeView === "cartoes" ? (
          selectedCard ? (
            <CustomerCardDetail card={selectedCard} dashboard={state.dashboard} />
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
            <span data-mobile-label={"mobileLabel" in item ? item.mobileLabel : item.label}>
              {item.label}
            </span>
          </Link>
        );
      })}
      <form action={signOutAction} className="customer-dashboard-nav__signout">
        <button type="submit">
          <LogOut aria-hidden="true" size={17} /> Terminar sessão
        </button>
      </form>
      <div className="customer-dashboard-nav__security">
        <ShieldCheck aria-hidden="true" size={15} />
        <span>
          <strong>Área protegida</strong>
          <small>Encriptação de nível bancário</small>
        </span>
      </div>
    </nav>
  );
}

function CustomerHome({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <>
      <section className="customer-dashboard-overview" aria-labelledby="customer-home-title">
        <div className="customer-dashboard-overview__heading">
          <span className="customer-dashboard-eyebrow">Moçambique</span>
          <h2 id="customer-home-title">Olá, {dashboard.profile.displayName}</h2>
          <p>
            <span>Seu resumo de fidelidade digital</span>
            <span className="customer-dashboard-overview__date">Hoje, {formatToday()}</span>
          </p>
        </div>
        <div className="customer-mobile-total" aria-label="Total acumulado">
          <span>Total acumulado</span>
          <strong>{dashboard.totalPoints.toLocaleString("pt-MZ")} Pts</strong>
          <small>Equivale a ~ {dashboard.totalValueMzn.toLocaleString("pt-MZ")} MZN</small>
          <Star aria-hidden="true" size={28} />
        </div>
        <div
          className={["customer-dashboard-stats", "customer-summary-grid--wide"].join(" ")}
          aria-label="Resumo da conta"
        >
          <CustomerSummaryCard
            icon={Star}
            label="Pontos acumulados"
            note={`Equivale a ~ ${dashboard.totalValueMzn.toLocaleString("pt-MZ")} MZN`}
            tone="points"
            value={`${dashboard.totalPoints.toLocaleString("pt-MZ")} Pts`}
          />
          <CustomerSummaryCard
            icon={CreditCard}
            label="Cartões ativos"
            note={`Em ${dashboard.activeCardCount.toLocaleString("pt-MZ")} estabelecimentos`}
            tone="cards"
            value={`${dashboard.activeCardCount.toLocaleString("pt-MZ")} Cartões`}
          />
          <CustomerSummaryCard
            icon={Gift}
            label="Ofertas disponíveis"
            note="Explore descontos"
            tone="value"
            value={`${dashboard.offers.length.toLocaleString("pt-MZ")} Ativas`}
          />
        </div>
      </section>

      <div className="customer-home-primary-grid">
        <section className="customer-home-section" aria-labelledby="home-cards-title">
          <CustomerSectionHeader
            actionHref="/cliente?vista=cartoes"
            actionLabel={`Ver todos (${dashboard.cards.length.toLocaleString("pt-MZ")})`}
            title="Seus Cartões"
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
                  <div className="customer-mobile-only">
                    <CustomerMobileCardPreview card={card} />
                  </div>
                  <div className="customer-desktop-only">
                    <CustomerCardVisual card={card} compact />
                  </div>
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

        <section className="customer-home-activity">
          <CustomerSectionHeader
            actionHref="/cliente?vista=atividade"
            actionLabel="Ver extrato"
            title="Atividade Recente"
            titleId="home-activity-title"
          />
          <CustomerActivityPreview dashboard={dashboard} />
        </section>

        <nav className="customer-quick-actions" aria-label="Ações rápidas">
          <h2>Ações Rápidas</h2>
          <button disabled title="Transferências ainda não disponíveis" type="button">
            <ArrowRight aria-hidden="true" />
            <span>Transferir</span>
          </button>
          <button disabled title="Recargas ainda não disponíveis" type="button">
            <Plus aria-hidden="true" />
            <span>Recarregar</span>
          </button>
          <button disabled title="Pagamentos ainda não disponíveis" type="button">
            <CreditCard aria-hidden="true" />
            <span>Pagar</span>
          </button>
          <Link
            href={
              dashboard.cards[0]
                ? `/cliente?vista=cartoes&cartao=${encodeURIComponent(dashboard.cards[0].id)}`
                : "/cliente?vista=cartoes"
            }
          >
            <QrCode aria-hidden="true" />
            <span>QR Code</span>
          </Link>
        </nav>
      </div>

      <section className="customer-home-offers">
        <CustomerSectionHeader
          actionHref="/cliente?vista=ofertas"
          actionLabel="Ver todas"
          title="Ofertas em Destaque"
          titleId="home-offers-title"
        />
        <CustomerOfferGrid dashboard={dashboard} limit={3} />
      </section>
    </>
  );
}

function CustomerCardsHub({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-cards-title">
      <CustomerMobileHeader action="add" title="Gerir Cartões" />
      <CustomerPageHeading
        title="Seus Cartões Digitais"
        description="Aceda ao saldo de fidelidade de cada estabelecimento."
        titleId="customer-cards-title"
      />
      <div className="customer-card-filters" aria-label="Resumo dos cartões">
        <span className="is-active">Todos</span>
        <span>Parceiros</span>
        <span>Lojas</span>
        <span>Favoritos</span>
      </div>
      {dashboard.hasCards ? (
        <div className="customer-cards-hub-grid">
          {dashboard.cards.map((card) => (
            <article className="customer-card-hub-item" key={card.id}>
              <CustomerCardVisual card={card} compact />
              <div className="customer-card-hub-item__content">
                <div>
                  <span>{card.currentTierName}</span>
                  <h3>{card.businessName}</h3>
                  <p>Número: {card.cardNumber}</p>
                </div>
                <strong>{card.availablePoints.toLocaleString("pt-MZ")} Pontos</strong>
                <small>Equivale a {card.valueMzn.toLocaleString("pt-MZ")} MZN</small>
                <Link href={`/cliente?vista=cartoes&cartao=${encodeURIComponent(card.id)}`}>
                  Ver detalhes <ChevronRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </article>
          ))}
          <Link className="customer-add-card" href="/estabelecimentos">
            <Plus aria-hidden="true" size={16} /> Adicionar novo cartão digital
          </Link>
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

function CustomerCardDetail({
  card,
  dashboard
}: {
  card: CustomerDashboardViewModel["cards"][number];
  dashboard: CustomerDashboardViewModel;
}) {
  return (
    <section aria-labelledby="customer-card-detail-title">
      <div className="customer-mobile-only">
        <CustomerMobileCardDetail
          activity={dashboard.activity.filter((item) => item.businessName === card.businessName)}
          card={card}
        />
      </div>
      <div className="customer-desktop-only">
        <CustomerPageHeading
          breadcrumb="Seus Cartões"
          title="Detalhes do Cartão"
          description={`${card.businessName} · ${card.currentTierName} · ${card.statusLabel}`}
          titleId="customer-card-detail-title"
        />
        <div className="customer-card-detail-grid">
          <div className="customer-card-detail-visual">
            <CustomerCardVisual card={card} />
            <p>Use o botão no cartão para alternar entre a frente e o verso.</p>
          </div>
          <div className="customer-card-identification">
            <h3>QR Code de identificação em loja</h3>
            <p>
              Apresente este QR Code no momento do pagamento para acumular pontos ou resgatar
              recompensas pendentes. O número do cartão ou o telefone associado também podem ser
              usados no POS.
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
      </div>
    </section>
  );
}

function CustomerActivity({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-activity-title">
      <CustomerMobileHeader action="notifications" title="Histórico de Pontos" />
      <CustomerPageHeading
        breadcrumb="Início"
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
      <CustomerMobileHeader action="notifications" title="Explorar Ofertas" />
      <CustomerPageHeading
        title="Explorar Ofertas"
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
          <span>Campanha em destaque</span>
          <h3>Ganhe mais pontos nos estabelecimentos que prefere.</h3>
          <p>Ative um benefício disponível e volte a comprar com mais vantagens.</p>
        </div>
      </div>
      <div className="customer-offers-heading">
        <h3>Todas as Ofertas Disponíveis</h3>
        <span>{dashboard.offers.length.toLocaleString("pt-MZ")} ofertas</span>
      </div>
      <div className="customer-offer-filters" aria-label="Categorias de ofertas">
        <span className="is-active">Restaurantes</span>
        <span>Compras</span>
        <span>Saúde</span>
      </div>
      <CustomerOfferGrid dashboard={dashboard} />
    </section>
  );
}

function CustomerNotifications({ dashboard }: { dashboard: CustomerDashboardViewModel }) {
  return (
    <section aria-labelledby="customer-notifications-title">
      <CustomerMobileHeader action="read" back title="Avisos e Alertas" />
      <CustomerPageHeading
        breadcrumb="Início"
        title="Avisos e Alertas"
        description="Novidades, movimentos e campanhas dos seus programas."
        titleId="customer-notifications-title"
      />
      <div className="customer-notifications-panel">
        <div className="customer-notifications-panel__heading">
          <h3>Últimas notificações</h3>
          <span>{dashboard.unreadNotificationCount.toLocaleString("pt-MZ")} por ler</span>
        </div>
        <div className="customer-notification-filters" aria-label="Categorias de notificações">
          <span className="is-active">Todas</span>
          <span>Transações</span>
          <span>Ofertas</span>
          <span>Sistema</span>
        </div>
        <InAppNotificationList notifications={dashboard.notifications} />
      </div>
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
        <CustomerMobileEditHeader />
        <Link className="customer-back-link" href="/cliente?vista=perfil">
          <ArrowLeft aria-hidden="true" size={17} /> Voltar ao perfil
        </Link>
        <CustomerPageHeading
          breadcrumb="Perfil"
          title="O Seu Perfil"
          description="Edite os seus dados pessoais e mantenha a identificação no POS atualizada."
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
      <CustomerMobileHeader action="notifications" title="O Seu Perfil" />
      <CustomerPageHeading
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
      <div className="customer-mobile-profile-preferences">
        <h3>Segurança e preferências</h3>
        <Link href="/cliente?vista=perfil&editar=1">
          <LockKeyhole aria-hidden="true" /> Alterar código PIN de segurança
          <ChevronRight aria-hidden="true" />
        </Link>
        <button disabled type="button">
          <Settings2 aria-hidden="true" /> Configurações de biometria / FaceID
          <ChevronRight aria-hidden="true" />
        </button>
        <Link href="/cliente?vista=notificacoes">
          <Bell aria-hidden="true" /> Notificações e alertas push
          <ChevronRight aria-hidden="true" />
        </Link>
        <button disabled type="button">
          <Languages aria-hidden="true" /> Idioma e moedas secundárias
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <form action={signOutAction} className="customer-mobile-signout">
        <button type="submit">
          <LogOut aria-hidden="true" /> Terminar sessão da conta
        </button>
      </form>
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
    <form
      action={updateCustomerProfileAction}
      className="customer-profile-form"
      id="customer-profile-edit-form"
    >
      <h3>Editar Dados Pessoais</h3>
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
      <div className="customer-mobile-profile-extra-fields">
        <label>
          <span>E-mail de acesso</span>
          <input readOnly type="email" value={dashboard.profile.email ?? ""} />
        </label>
        <label>
          <span>Data de nascimento</span>
          <input disabled placeholder="Ex.: 24/09/1995" type="text" />
        </label>
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
          <span className="customer-activity-preview__amount">
            <b className={`is-${item.tone}`}>
              {item.points > 0 ? "+" : ""}
              {item.points.toLocaleString("pt-MZ")} Pts
            </b>
            <time dateTime={item.occurredAt}>{formatActivityPreviewDate(item.occurredAt)}</time>
          </span>
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
            <Link href="/ofertas">Ativar Benefício</Link>
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
  breadcrumb,
  title,
  description,
  titleId
}: {
  eyebrow?: string;
  breadcrumb?: string;
  title: string;
  description: string;
  titleId: string;
}) {
  return (
    <header className="customer-page-heading">
      {eyebrow ? <span className="customer-dashboard-eyebrow">{eyebrow}</span> : null}
      <h2 id={titleId}>{title}</h2>
      {breadcrumb ? (
        <span className="customer-page-heading__breadcrumb">
          {breadcrumb} <ChevronRight aria-hidden="true" size={14} /> <strong>{title}</strong>
        </span>
      ) : null}
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
  eyebrow?: string;
  title: string;
  titleId: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="customer-dashboard-section-heading">
      <div>
        {eyebrow ? <span className="customer-dashboard-eyebrow">{eyebrow}</span> : null}
        <h2 id={titleId}>{title}</h2>
      </div>
      <Link href={actionHref}>
        {actionLabel} <ChevronRight aria-hidden="true" size={16} />
      </Link>
    </div>
  );
}

function CustomerMobileHeader({
  action,
  back = false,
  title
}: {
  action: "add" | "notifications" | "read";
  back?: boolean;
  title: string;
}) {
  const actionContent = action === "add" ? <Plus /> : action === "read" ? <Check /> : <Bell />;
  const actionLabel =
    action === "add"
      ? "Adicionar cartão"
      : action === "read"
        ? "Marcar todas como lidas"
        : "Ver avisos";

  return (
    <header className="customer-mobile-header">
      {back ? (
        <Link aria-label="Voltar ao início" href="/cliente">
          <ArrowLeft />
        </Link>
      ) : (
        <span className="customer-mobile-header__mark" aria-hidden="true">
          V
        </span>
      )}
      <h2>{title}</h2>
      {action === "notifications" ? (
        <Link aria-label={actionLabel} href="/cliente?vista=notificacoes">
          {actionContent}
        </Link>
      ) : action === "add" ? (
        <Link aria-label={actionLabel} href="/estabelecimentos">
          {actionContent}
        </Link>
      ) : (
        <button aria-label={actionLabel} disabled title={actionLabel} type="button">
          {actionContent}
        </button>
      )}
    </header>
  );
}

function CustomerMobileCardPreview({
  card
}: {
  card: CustomerDashboardViewModel["cards"][number];
}) {
  const cardSuffix = card.cardNumber.replace(/\D/g, "").slice(-4);

  return (
    <article className="customer-mobile-card-preview" aria-label={`Cartão ${card.businessName}`}>
      <span className="customer-mobile-card-preview__pattern" aria-hidden="true" />
      <header>
        <strong>{card.businessName}</strong>
        <span>{card.currentTierName}</span>
      </header>
      <div>
        <strong>{card.availablePoints.toLocaleString("pt-MZ")} Pts</strong>
        <small>
          {card.customerName} •••• {cardSuffix}
        </small>
      </div>
    </article>
  );
}

function CustomerMobileEditHeader() {
  return (
    <header className="customer-mobile-edit-header">
      <Link href="/cliente?vista=perfil">Cancelar</Link>
      <h2>Editar Dados</h2>
      <button form="customer-profile-edit-form" type="submit">
        Gravar
      </button>
    </header>
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

function formatToday(): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "long"
  }).format(new Date());
}

function formatActivityPreviewDate(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = new Intl.DateTimeFormat("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  if (date.toDateString() === today.toDateString()) return `Hoje, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;

  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
