import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  FileClock,
  Search,
  Shield,
  Tickets,
  Users
} from "lucide-react";

import { hasAdminCapability } from "@/lib/auth/admin-permissions";
import type { AdminCapability } from "@/lib/auth/admin-permissions";
import type { AuthPrincipal } from "@/lib/auth/rbac";

import {
  BusinessReviewForm,
  FraudReviewForm,
  PlanEntitlementsForm,
  SubscriptionPlanForm,
  SupportTicketForm,
  UserRoleForm
} from "./action-forms";
import { formatAdminDate, formatMznMinor } from "./model";
import type {
  AdminAuditEntry,
  AdminBusiness,
  AdminDashboardReadyState,
  AdminDashboardState,
  AdminFraudEvent,
  AdminPlan,
  AdminSubscription,
  AdminSupportTicket,
  AdminUser,
  AdminView,
  PlatformMetrics
} from "./model";

const adminNavigation: Array<{
  view: AdminView;
  label: string;
  icon: typeof BarChart3;
  capability: AdminCapability;
}> = [
  { view: "overview", label: "Visao geral", icon: BarChart3, capability: "platform_metrics_read" },
  { view: "businesses", label: "Negócios", icon: Building2, capability: "businesses_read" },
  { view: "users", label: "Utilizadores", icon: Users, capability: "users_read" },
  {
    view: "subscriptions",
    label: "Subscrições",
    icon: CreditCard,
    capability: "subscriptions_read"
  },
  { view: "support", label: "Suporte", icon: Tickets, capability: "support_manage" },
  { view: "fraud", label: "Fraude", icon: AlertTriangle, capability: "fraud_review" },
  { view: "audit", label: "Auditoria", icon: FileClock, capability: "audit_read" }
];

export function AdminDashboard({
  state,
  principal
}: {
  state: AdminDashboardState;
  principal: AuthPrincipal;
}) {
  return (
    <div className="admin-console">
      <header className="admin-console__bar">
        <div>
          <span className="admin-console__role">{profileRoleLabel(principal.profileRole)}</span>
          <p>MFA confirmado</p>
        </div>
        <Shield aria-hidden="true" size={22} />
      </header>

      <nav className="admin-console__nav" aria-label="Administração da plataforma">
        {adminNavigation
          .filter((item) => hasAdminCapability(principal.profileRole, item.capability))
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                aria-current={state.view === item.view ? "page" : undefined}
                className={state.view === item.view ? "is-active" : undefined}
                href={`/admin?view=${item.view}`}
                key={item.view}
                title={item.label}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {state.status === "denied" || state.status === "error" ? (
        <section className="admin-console__notice" role="alert">
          <h2>{state.status === "denied" ? "Acesso limitado" : "Dados indisponíveis"}</h2>
          <p>{state.message}</p>
        </section>
      ) : (
        <AdminViewContent principal={principal} state={state} />
      )}
    </div>
  );
}

function AdminViewContent({
  state,
  principal
}: {
  state: AdminDashboardReadyState;
  principal: AuthPrincipal;
}) {
  if (state.view === "overview" && state.metrics) {
    return <Overview metrics={state.metrics} />;
  }

  return (
    <section className="admin-console__section">
      <div className="admin-console__section-heading">
        <div>
          <span>{viewEyebrow(state.view)}</span>
          <h2>{viewTitle(state.view)}</h2>
        </div>
        <AdminSearch query={state.query} view={state.view} />
      </div>

      {state.view === "businesses" ? (
        <BusinessList
          businesses={state.businesses}
          canReview={state.capabilities.includes("businesses_review")}
        />
      ) : null}
      {state.view === "users" ? (
        <UserList
          actor={principal}
          canManage={state.capabilities.includes("users_manage")}
          users={state.users}
        />
      ) : null}
      {state.view === "subscriptions" ? (
        <SubscriptionManagement
          canManage={state.capabilities.includes("subscriptions_manage")}
          plans={state.plans}
          subscriptions={state.subscriptions}
        />
      ) : null}
      {state.view === "support" ? (
        <SupportList operators={state.operators} tickets={state.tickets} />
      ) : null}
      {state.view === "fraud" ? <FraudList events={state.fraudEvents} /> : null}
      {state.view === "audit" ? <AuditList entries={state.auditEntries} /> : null}
    </section>
  );
}

function Overview({ metrics }: { metrics: PlatformMetrics }) {
  const primaryMetrics = [
    { label: "Negócios ativos", value: metrics.activeBusinesses.toLocaleString("pt-MZ") },
    { label: "Em aprovação", value: metrics.pendingBusinesses.toLocaleString("pt-MZ") },
    { label: "Utilizadores", value: metrics.totalProfiles.toLocaleString("pt-MZ") },
    { label: "Subscrições ativas", value: metrics.activeSubscriptions.toLocaleString("pt-MZ") },
    { label: "Suporte em aberto", value: metrics.openSupportTickets.toLocaleString("pt-MZ") },
    { label: "Alertas por rever", value: metrics.unresolvedFraudEvents.toLocaleString("pt-MZ") }
  ];

  return (
    <section className="admin-console__overview">
      <div className="admin-console__section-heading">
        <div>
          <span>Plataforma</span>
          <h2>Visao geral</h2>
        </div>
        <span className="admin-status-badge admin-status-badge--active">Operacional</span>
      </div>
      <div className="admin-metric-grid">
        {primaryMetrics.map((metric) => (
          <article className="admin-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-console__split">
        <div className="admin-summary-block">
          <span>Operação acumulada</span>
          <dl>
            <Fact
              label="Negócios registados"
              value={metrics.totalBusinesses.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Transações concluídas"
              value={metrics.completedTransactions.toLocaleString("pt-MZ")}
            />
            <Fact label="Volume bruto" value={formatMznMinor(metrics.grossVolumeMznMinor)} />
            <Fact label="Pontos emitidos" value={metrics.pointsIssued.toLocaleString("pt-MZ")} />
          </dl>
        </div>
        <div className="admin-summary-block">
          <span>Últimos 30 dias</span>
          <dl>
            <Fact
              label="Novos negócios"
              value={metrics.businessesCreatedLast30Days.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Transações"
              value={metrics.transactionsLast30Days.toLocaleString("pt-MZ")}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function AdminSearch({ view, query }: { view: AdminView; query: string }) {
  return (
    <form action="/admin" className="admin-search" method="get" role="search">
      <input name="view" type="hidden" value={view} />
      <Search aria-hidden="true" size={17} />
      <input
        aria-label="Pesquisar nesta área"
        defaultValue={query}
        maxLength={80}
        name="q"
        placeholder="Pesquisar"
        type="search"
      />
      <button type="submit">Pesquisar</button>
    </form>
  );
}

function BusinessList({
  businesses,
  canReview
}: {
  businesses: AdminBusiness[];
  canReview: boolean;
}) {
  if (businesses.length === 0) {
    return <EmptyState label="Nenhum negócio encontrado." />;
  }

  return (
    <div className="admin-record-list">
      {businesses.map((business) => (
        <article className="admin-record" key={business.id}>
          <div className="admin-record__header">
            <div>
              <h3>{business.name}</h3>
              <p>{business.ownerName}</p>
            </div>
            <StatusBadge value={business.status} />
          </div>
          <dl className="admin-record__facts">
            <Fact label="Slug" value={business.slug} />
            <Fact label="Registo" value={formatAdminDate(business.createdAt)} />
            <Fact label="Última revisão" value={formatAdminDate(business.reviewedAt)} />
          </dl>
          {business.reviewNote ? <p className="admin-record__note">{business.reviewNote}</p> : null}
          {canReview ? (
            <BusinessReviewForm businessId={business.id} status={business.status} />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function UserList({
  users,
  canManage,
  actor
}: {
  users: AdminUser[];
  canManage: boolean;
  actor: AuthPrincipal;
}) {
  if (users.length === 0) {
    return <EmptyState label="Nenhum utilizador encontrado." />;
  }

  return (
    <div className="admin-record-list">
      {users.map((user) => (
        <article className="admin-record" key={user.id}>
          <div className="admin-record__header">
            <div>
              <h3>{user.displayName}</h3>
              <p>{user.email}</p>
            </div>
            <StatusBadge value={user.role} />
          </div>
          <dl className="admin-record__facts">
            <Fact label="Telefone" value={user.phone} />
            <Fact label="Registo" value={formatAdminDate(user.createdAt)} />
          </dl>
          {canManage ? (
            <UserRoleForm
              actorProfileId={actor.profileId}
              actorRole={actor.profileRole}
              currentRole={user.role}
              userId={user.id}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function SubscriptionManagement({
  subscriptions,
  plans,
  canManage
}: {
  subscriptions: AdminSubscription[];
  plans: AdminPlan[];
  canManage: boolean;
}) {
  return (
    <div className="admin-subscription-management">
      <div>
        <h3>Planos</h3>
        <PlanCatalog canManage={canManage} plans={plans} />
      </div>
      <div>
        <h3>Subscrições por negócio</h3>
        <SubscriptionList canManage={canManage} plans={plans} subscriptions={subscriptions} />
      </div>
    </div>
  );
}

function PlanCatalog({ plans, canManage }: { plans: AdminPlan[]; canManage: boolean }) {
  if (plans.length === 0) {
    return <EmptyState label="Nenhum plano configurado." />;
  }

  return (
    <div className="admin-record-list">
      {plans.map((plan) => (
        <article className="admin-record" key={plan.id}>
          <div className="admin-record__header">
            <div>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </div>
            <StatusBadge value={plan.isActive ? "active" : "paused"} />
          </div>
          <dl className="admin-record__facts">
            <Fact
              label="Mensalidade"
              value={
                plan.monthlyPriceMznMinor === null
                  ? "Sob consulta"
                  : formatMznMinor(plan.monthlyPriceMznMinor)
              }
            />
            <Fact label="Filiais" value={formatAdminLimit(plan.branchLimit)} />
            <Fact label="Equipa" value={formatAdminLimit(plan.staffLimit)} />
            <Fact label="Campanhas" value={formatAdminLimit(plan.campaignLimit)} />
            <Fact label="Analítica" value={plan.analyticsLevel} />
          </dl>
          {canManage ? <PlanEntitlementsForm plan={plan} /> : null}
        </article>
      ))}
    </div>
  );
}

function SubscriptionList({
  subscriptions,
  plans,
  canManage
}: {
  subscriptions: AdminSubscription[];
  plans: AdminPlan[];
  canManage: boolean;
}) {
  if (subscriptions.length === 0) {
    return <EmptyState label="Nenhuma subscrição encontrada." />;
  }

  return (
    <div className="admin-record-list">
      {subscriptions.map((subscription) => (
        <article className="admin-record" key={subscription.id}>
          <div className="admin-record__header">
            <div>
              <h3>{subscription.businessName}</h3>
              <p>{subscription.planName}</p>
            </div>
            <StatusBadge value={subscription.status} />
          </div>
          <dl className="admin-record__facts">
            <Fact
              label="Mensalidade"
              value={
                subscription.monthlyPriceMznMinor === null
                  ? "Sob consulta"
                  : formatMznMinor(subscription.monthlyPriceMznMinor)
              }
            />
            <Fact
              label="Fim do período"
              value={formatAdminDate(subscription.currentPeriodEnd ?? subscription.trialEndsAt)}
            />
          </dl>
          {canManage ? (
            <SubscriptionPlanForm
              businessId={subscription.businessId}
              currentPlanId={subscription.planId}
              currentStatus={subscription.status}
              plans={plans}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function formatAdminLimit(limit: number | null): string {
  return limit === null ? "Ilimitado" : limit.toLocaleString("pt-MZ");
}

function SupportList({
  tickets,
  operators
}: {
  tickets: AdminSupportTicket[];
  operators: AdminDashboardReadyState["operators"];
}) {
  if (tickets.length === 0) {
    return <EmptyState label="Nenhum pedido de suporte encontrado." />;
  }

  return (
    <div className="admin-record-list">
      {tickets.map((ticket) => (
        <article className="admin-record" key={ticket.id}>
          <div className="admin-record__header">
            <div>
              <h3>{ticket.subject}</h3>
              <p>{ticket.description}</p>
            </div>
            <div className="admin-record__badges">
              <StatusBadge value={ticket.priority} />
              <StatusBadge value={ticket.status} />
            </div>
          </div>
          <dl className="admin-record__facts">
            <Fact label="Solicitante" value={ticket.requesterName} />
            <Fact label="Negócio" value={ticket.businessName} />
            <Fact label="Responsável" value={ticket.assignedToName} />
            <Fact label="Criado" value={formatAdminDate(ticket.createdAt)} />
          </dl>
          <SupportTicketForm
            assignedToProfileId={ticket.assignedToProfileId}
            operators={operators}
            priority={ticket.priority}
            resolutionNote={ticket.resolutionNote}
            status={ticket.status}
            ticketId={ticket.id}
          />
        </article>
      ))}
    </div>
  );
}

function FraudList({ events }: { events: AdminFraudEvent[] }) {
  if (events.length === 0) {
    return <EmptyState label="Nenhum alerta de fraude encontrado." />;
  }

  return (
    <div className="admin-record-list">
      {events.map((event) => (
        <article className="admin-record" key={event.id}>
          <div className="admin-record__header">
            <div>
              <h3>{humanize(event.eventType)}</h3>
              <p>{event.detailsSummary}</p>
            </div>
            <StatusBadge value={event.resolvedAt ? "resolved" : event.severity} />
          </div>
          <dl className="admin-record__facts">
            <Fact label="Negócio" value={event.businessName} />
            <Fact label="Utilizador" value={event.profileName} />
            <Fact label="Revisto por" value={event.resolvedByName} />
            <Fact label="Criado" value={formatAdminDate(event.createdAt)} />
          </dl>
          {event.resolutionNote ? (
            <p className="admin-record__note">{event.resolutionNote}</p>
          ) : null}
          <FraudReviewForm fraudEventId={event.id} resolved={Boolean(event.resolvedAt)} />
        </article>
      ))}
    </div>
  );
}

function AuditList({ entries }: { entries: AdminAuditEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState label="Nenhum registo de auditoria encontrado." />;
  }

  return (
    <div className="admin-audit-list">
      {entries.map((entry) => (
        <article className="admin-audit-row" key={entry.id}>
          <ClipboardList aria-hidden="true" size={18} />
          <div>
            <h3>{humanize(entry.operation)}</h3>
            <p>{entry.changeSummary}</p>
            <span>
              {entry.actorName} | {entry.businessName} | {formatAdminDate(entry.createdAt)}
            </span>
          </div>
          <div className="admin-audit-row__meta">
            <StatusBadge value={entry.action} />
            <code>{entry.entityTable}</code>
            <small>{entry.ipAddress}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`admin-status-badge admin-status-badge--${statusTone(value)}`}>
      {humanizeStatus(value)}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="admin-empty-state">
      <p>{label}</p>
    </div>
  );
}

function viewTitle(view: AdminView): string {
  return adminNavigation.find((item) => item.view === view)?.label ?? "Administração";
}

function viewEyebrow(view: AdminView): string {
  const labels: Record<AdminView, string> = {
    overview: "Plataforma",
    businesses: "Aprovação e estado",
    users: "Identidade e acesso",
    subscriptions: "Planos por negócio",
    support: "Fila operacional",
    fraud: "Revisão de risco",
    audit: "Histórico imutavel"
  };

  return labels[view];
}

function profileRoleLabel(role: AuthPrincipal["profileRole"]): string {
  const labels: Record<AuthPrincipal["profileRole"], string> = {
    customer: "Cliente",
    support_agent: "Agente de suporte",
    platform_admin: "Admin da plataforma",
    super_admin: "Super admin"
  };

  return labels[role];
}

function humanizeStatus(value: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    pending_review: "Em aprovação",
    active: "Ativo",
    suspended: "Suspenso",
    archived: "Arquivado",
    customer: "Cliente",
    support_agent: "Suporte",
    platform_admin: "Admin",
    super_admin: "Super admin",
    trialing: "Em teste",
    past_due: "Em atraso",
    paused: "Pausado",
    cancelled: "Cancelado",
    open: "Aberto",
    in_progress: "Em curso",
    resolved: "Resolvido",
    closed: "Fechado",
    low: "Baixa",
    normal: "Normal",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
    critical: "Critica",
    create: "Criacao",
    update: "Atualização",
    delete: "Eliminacao",
    permission_change: "Permissão",
    suspension: "Suspensao"
  };

  return labels[value] ?? humanize(value);
}

function statusTone(value: string): string {
  if (["active", "resolved", "closed", "low", "create"].includes(value)) {
    return "active";
  }

  if (["pending_review", "trialing", "open", "in_progress", "normal", "medium"].includes(value)) {
    return "pending";
  }

  if (
    ["high", "urgent", "critical", "past_due", "suspended", "delete", "suspension"].includes(value)
  ) {
    return "danger";
  }

  return "neutral";
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}
