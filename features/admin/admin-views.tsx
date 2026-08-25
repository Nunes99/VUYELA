import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  FileClock,
  Globe2,
  KeyRound,
  Landmark,
  LockKeyhole,
  Mail,
  MessageSquare,
  Search,
  Users,
  WalletCards,
  Webhook
} from "lucide-react";

import type { AuthPrincipal } from "@/lib/auth/rbac";

import {
  BusinessCategoryForm,
  BusinessReviewForm,
  FraudTriageForm,
  PlatformSettingsForm,
  PlanEntitlementsForm,
  SubscriptionPlanForm,
  SupportReplyForm,
  SupportTicketForm,
  UserAccountStatusForm,
  UserRoleForm
} from "./action-forms";
import { AdminDonut, AdminLineChart, AdminShareBars } from "./admin-charts";
import { AdminDownloadButton } from "./admin-download-button";
import { formatAdminDate, formatMznMinor } from "./model";
import type {
  AdminAnalyticsData,
  AdminAuditEntry,
  AdminBusiness,
  AdminBusinessDetail,
  AdminCategory,
  AdminDashboardReadyState,
  AdminFraudEvent,
  AdminPlan,
  AdminSubscription,
  AdminSupportTicket,
  AdminSystemSettings,
  AdminUser,
  AdminUserDetail,
  AdminView,
  PlatformMetrics
} from "./model";

export function AdminViewContent({
  state,
  principal
}: {
  state: AdminDashboardReadyState;
  principal: AuthPrincipal;
}) {
  return (
    <section className="admin-view">
      <AdminBreadcrumb view={state.view} />
      <AdminCollectionControls state={state} />
      {state.view === "overview" && state.metrics && state.analytics ? (
        <Overview
          analytics={state.analytics}
          entries={state.auditEntries}
          metrics={state.metrics}
        />
      ) : null}
      {state.view === "businesses" ? (
        <BusinessList
          businesses={state.businesses}
          canReview={state.capabilities.includes("businesses_review")}
          query={state.query}
        />
      ) : null}
      {state.view === "categories" ? <CategoryManagement categories={state.categories} /> : null}
      {state.view === "users" ? (
        <UserList
          actor={principal}
          canManage={state.capabilities.includes("users_manage")}
          query={state.query}
          users={state.users}
        />
      ) : null}
      {state.view === "subscriptions" ? (
        <SubscriptionManagement
          canManage={state.capabilities.includes("subscriptions_manage")}
          plans={state.plans}
          query={state.query}
          subscriptions={state.subscriptions}
        />
      ) : null}
      {state.view === "support" ? (
        <SupportList operators={state.operators} query={state.query} tickets={state.tickets} />
      ) : null}
      {state.view === "fraud" ? (
        <FraudList events={state.fraudEvents} operators={state.operators} query={state.query} />
      ) : null}
      {state.view === "audit" ? (
        <AuditList entries={state.auditEntries} query={state.query} />
      ) : null}
      {state.view === "analytics" && state.metrics && state.analytics ? (
        <Analytics analytics={state.analytics} metrics={state.metrics} range={state.filter} />
      ) : null}
      {state.view === "settings" && state.settings ? (
        <SettingsView settings={state.settings} />
      ) : null}
      {state.view === "business-detail" ? (
        <BusinessDetail
          business={state.businessDetail}
          canReview={state.capabilities.includes("businesses_review")}
        />
      ) : null}
      {state.view === "user-detail" ? (
        <UserDetail
          actor={principal}
          canManage={state.capabilities.includes("users_manage")}
          user={state.userDetail}
        />
      ) : null}
      <AdminPagination state={state} />
    </section>
  );
}

function Overview({
  metrics,
  analytics,
  entries
}: {
  metrics: PlatformMetrics;
  analytics: AdminAnalyticsData;
  entries: AdminAuditEntry[];
}) {
  return (
    <div className="admin-overview">
      <div className="admin-section-heading">
        <div>
          <span>Sistema operacional</span>
          <h2>Indicadores da plataforma</h2>
        </div>
        <StatusBadge value="active" label="Operação em tempo real" />
      </div>

      <div className="admin-metric-grid">
        <MetricCard
          icon={Building2}
          label="Negócios ativos"
          meta={`${metrics.pendingBusinesses} em aprovação`}
          value={metrics.activeBusinesses.toLocaleString("pt-MZ")}
        />
        <MetricCard
          icon={Users}
          label="Utilizadores"
          meta="Perfis registados"
          value={metrics.totalProfiles.toLocaleString("pt-MZ")}
        />
        <MetricCard
          icon={Activity}
          label="Transações (30 dias)"
          meta="Concluídas no período"
          value={metrics.transactionsLast30Days.toLocaleString("pt-MZ")}
        />
        <MetricCard
          icon={Landmark}
          label="Volume processado"
          meta="Volume bruto acumulado"
          value={formatMznMinor(metrics.grossVolumeMznMinor)}
        />
        <MetricCard
          icon={CreditCard}
          label="Subscrições ativas"
          meta="Em teste ou ativas"
          value={metrics.activeSubscriptions.toLocaleString("pt-MZ")}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Taxa de aprovação"
          meta="Negócios ativos"
          value={percentage(metrics.activeBusinesses, metrics.totalBusinesses)}
        />
      </div>

      <div className="admin-data-grid admin-data-grid--charts">
        <section className="admin-panel admin-panel--wide">
          <PanelHeading meta="Últimos seis meses" title="Volume transacional" />
          <AdminLineChart data={analytics.monthly} />
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Volume liquidado" title="Métodos de pagamento" />
          <AdminDonut data={analytics.paymentMethods} />
        </section>
      </div>

      <div className="admin-data-grid">
        <section className="admin-panel">
          <PanelHeading meta="Desde o arranque" title="Operação acumulada" />
          <dl className="admin-stat-list">
            <Fact
              label="Negócios registados"
              value={metrics.totalBusinesses.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Transações concluídas"
              value={metrics.completedTransactions.toLocaleString("pt-MZ")}
            />
            <Fact label="Volume bruto" value={formatMznMinor(metrics.grossVolumeMznMinor)} />
            <Fact
              label="Pontos emitidos"
              value={`${metrics.pointsIssued.toLocaleString("pt-MZ")} Pts`}
            />
          </dl>
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Todos online" title="Estado dos serviços" />
          <div className="admin-service-list">
            {[
              ["API e base de dados", "Online"],
              ["Processamento M-Pesa", "Operacional"],
              ["Processamento e-Mola", "Operacional"],
              ["Sincronização POS", "Operacional"]
            ].map(([label, status]) => (
              <div key={label}>
                <span>
                  <CheckCircle2 aria-hidden="true" size={16} />
                  {label}
                </span>
                <strong>{status}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-data-grid">
        <section className="admin-panel">
          <PanelHeading meta="Por volume processado" title="Top negócios" />
          <TopBusinessList analytics={analytics} />
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Distribuição do volume" title="Receita por categoria" />
          <AdminShareBars data={analytics.categories} money />
        </section>
      </div>

      <div className="admin-health-grid">
        <HealthCard
          direction="down"
          label="Alertas por rever"
          meta="Risco operacional"
          value={metrics.unresolvedFraudEvents.toLocaleString("pt-MZ")}
        />
        <HealthCard
          direction="up"
          label="Tempo de resposta"
          meta="Pedidos em aberto"
          value={`${metrics.openSupportTickets.toLocaleString("pt-MZ")} tickets`}
        />
        <HealthCard
          direction="up"
          label="Cobertura de subscrição"
          meta="Negócios com plano ativo"
          value={percentage(metrics.activeSubscriptions, metrics.activeBusinesses)}
        />
      </div>

      <section className="admin-panel">
        <PanelHeading meta="Últimos sete dias" title="Mapa de atividade transacional" />
        <div className="admin-heatmap" aria-label="Intensidade de transações por dia">
          {analytics.daily.map((day) => (
            <div key={day.label}>
              <span>{day.label}</span>
              {Array.from({ length: 6 }, (_, index) => (
                <i
                  aria-hidden="true"
                  key={index}
                  style={{ opacity: Math.max(0.16, Math.min(1, (day.transactions + index) / 12)) }}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <PanelHeading meta="Registos imutáveis" title="Atividade de operações recentes" />
        {entries.length > 0 ? (
          <div className="admin-activity-list">
            {entries.map((entry) => (
              <div key={entry.id}>
                <span>
                  <FileClock aria-hidden="true" size={17} />
                </span>
                <p>
                  <strong>{humanize(entry.operation)}</strong>
                  {entry.changeSummary}
                </p>
                <time>{formatAdminDate(entry.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="Ainda não existem operações recentes." />
        )}
      </section>
    </div>
  );
}

function BusinessList({
  businesses,
  canReview,
  query
}: {
  businesses: AdminBusiness[];
  canReview: boolean;
  query: string;
}) {
  return (
    <div className="admin-list-view">
      <div className="admin-list-toolbar">
        <span>Aprovação e estado</span>
        <AdminSearch placeholder="Pesquisar estabelecimento..." query={query} view="businesses" />
      </div>
      {businesses.length === 0 ? (
        <EmptyState label="Nenhum negócio encontrado." />
      ) : (
        <div className="admin-record-list">
          {businesses.map((business) => (
            <article className="admin-record" key={business.id}>
              <div className="admin-record__header">
                <div>
                  <Link href={`/admin?view=business-detail&id=${business.id}`}>
                    <h2>{business.name}</h2>
                  </Link>
                  <p>Proprietário: {business.ownerName}</p>
                </div>
                <StatusBadge value={business.status} />
              </div>
              <dl className="admin-record__facts admin-record__facts--three">
                <Fact label="Slug de sistema" value={business.slug} />
                <Fact label="Data de registo" value={formatAdminDate(business.createdAt)} />
                <Fact label="Última revisão" value={formatAdminDate(business.reviewedAt)} />
              </dl>
              {business.reviewNote ? (
                <p className="admin-record__note">{business.reviewNote}</p>
              ) : null}
              {canReview ? (
                <BusinessReviewForm businessId={business.id} status={business.status} />
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryManagement({ categories }: { categories: AdminCategory[] }) {
  return (
    <div className="admin-management-stack">
      <section className="admin-panel admin-form-panel">
        <PanelHeading meta="Conteúdo público" title="Nova categoria" />
        <BusinessCategoryForm />
      </section>
      <section className="admin-panel">
        <PanelHeading meta={`${categories.length} no diretório`} title="Categorias publicadas" />
        {categories.length === 0 ? (
          <EmptyState label="Nenhuma categoria encontrada." />
        ) : (
          <div className="admin-category-list">
            {categories.map((category) => (
              <details key={category.id}>
                <summary>
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category.description}</small>
                  </span>
                  <span>
                    <StatusBadge value={category.isActive ? "active" : "archived"} />
                    <ArrowRight aria-hidden="true" size={17} />
                  </span>
                </summary>
                <dl className="admin-record__facts admin-record__facts--three">
                  <Fact label="Identificador" value={category.slug} />
                  <Fact
                    label="Ordem de listagem"
                    value={category.sortOrder.toLocaleString("pt-MZ")}
                  />
                  <Fact
                    label="Negócios indexados"
                    value={category.businessCount.toLocaleString("pt-MZ")}
                  />
                </dl>
                <BusinessCategoryForm category={category} />
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UserList({
  users,
  canManage,
  actor,
  query
}: {
  users: AdminUser[];
  canManage: boolean;
  actor: AuthPrincipal;
  query: string;
}) {
  return (
    <div className="admin-list-view">
      <div className="admin-list-toolbar">
        <span>Identidade</span>
        <AdminSearch placeholder="Procurar utilizador..." query={query} view="users" />
      </div>
      <section className="admin-panel admin-table-panel">
        <PanelHeading meta={`${users.length} resultados`} title="Histórico geral de utilizadores" />
        {users.length === 0 ? (
          <EmptyState label="Nenhum utilizador encontrado." />
        ) : (
          <div className="admin-table-list">
            <div className="admin-table-list__head admin-table-list__users">
              <span>Nome completo</span>
              <span>Correio eletrónico</span>
              <span>Telefone</span>
              <span>Registo</span>
              <span>Função</span>
              <span>Estado</span>
            </div>
            {users.map((user, index) => (
              <details key={user.id} open={index === 0}>
                <summary className="admin-table-list__row admin-table-list__users">
                  <Link href={`/admin?view=user-detail&id=${user.id}`}>{user.displayName}</Link>
                  <span>{user.email}</span>
                  <span>{user.phone}</span>
                  <span>{formatDateOnly(user.createdAt)}</span>
                  <StatusBadge value={user.role} />
                  <StatusBadge value={user.accountStatus} />
                </summary>
                {canManage ? (
                  <div className="admin-user-actions">
                    <UserRoleForm
                      actorProfileId={actor.profileId}
                      actorRole={actor.profileRole}
                      currentRole={user.role}
                      userId={user.id}
                    />
                    <UserAccountStatusForm
                      accountStatus={user.accountStatus}
                      actorProfileId={actor.profileId}
                      userId={user.id}
                    />
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SubscriptionManagement({
  subscriptions,
  plans,
  canManage,
  query
}: {
  subscriptions: AdminSubscription[];
  plans: AdminPlan[];
  canManage: boolean;
  query: string;
}) {
  return (
    <div className="admin-management-stack">
      <div className="admin-list-toolbar">
        <span>Financeiro</span>
        <AdminSearch
          placeholder="Procurar planos existentes..."
          query={query}
          view="subscriptions"
        />
      </div>
      <section className="admin-plan-grid">
        {plans.length === 0 ? (
          <EmptyState label="Nenhum plano configurado." />
        ) : (
          plans.map((plan, index) => (
            <article className="admin-plan-card" key={plan.id}>
              <div className="admin-plan-card__heading">
                <div>
                  <h2>{plan.name}</h2>
                  <p>{plan.description}</p>
                </div>
                <StatusBadge value={plan.isActive ? "active" : "paused"} />
              </div>
              <strong className="admin-plan-card__price">
                {plan.monthlyPriceMznMinor === null
                  ? "Sob consulta"
                  : formatMznMinor(plan.monthlyPriceMznMinor)}
              </strong>
              <span>Mensalidade fixa</span>
              <dl className="admin-plan-card__limits">
                <Fact label="Filiais permitidas" value={formatLimit(plan.branchLimit)} />
                <Fact label="Equipa administrativa" value={formatLimit(plan.staffLimit)} />
                <Fact label="Campanhas ativas" value={formatLimit(plan.campaignLimit)} />
                <Fact label="Analítica" value={humanize(plan.analyticsLevel)} />
              </dl>
              {canManage ? (
                <details className="admin-editor" open={index === 0}>
                  <summary>
                    Editar parâmetros do plano <ArrowRight aria-hidden="true" size={17} />
                  </summary>
                  <PlanEntitlementsForm plan={plan} />
                </details>
              ) : null}
            </article>
          ))
        )}
      </section>
      <section className="admin-panel">
        <PanelHeading
          meta={`${subscriptions.length} subscrições`}
          title="Planos atribuídos aos negócios"
        />
        {subscriptions.length === 0 ? (
          <EmptyState label="Nenhuma subscrição encontrada." />
        ) : (
          <div className="admin-subscription-list">
            {subscriptions.map((subscription) => (
              <details key={subscription.id}>
                <summary>
                  <span>
                    <strong>{subscription.businessName}</strong>
                    <small>
                      {subscription.planName} ·{" "}
                      {formatAdminDate(subscription.currentPeriodEnd ?? subscription.trialEndsAt)}
                    </small>
                  </span>
                  <StatusBadge value={subscription.status} />
                </summary>
                {canManage ? (
                  <SubscriptionPlanForm
                    businessId={subscription.businessId}
                    currentPlanId={subscription.planId}
                    currentStatus={subscription.status}
                    plans={plans}
                  />
                ) : null}
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SupportList({
  tickets,
  operators,
  query
}: {
  tickets: AdminSupportTicket[];
  operators: AdminDashboardReadyState["operators"];
  query: string;
}) {
  return (
    <div className="admin-list-view">
      <div className="admin-list-toolbar">
        <span>Administração / Operações / Fila de suporte</span>
        <AdminSearch placeholder="Pesquisar ticket ou negócio..." query={query} view="support" />
      </div>
      <section className="admin-panel admin-table-panel">
        <PanelHeading meta={`${tickets.length} resultados`} title="Tickets em aberto ou recentes" />
        {tickets.length === 0 ? (
          <EmptyState label="Nenhum pedido de suporte encontrado." />
        ) : (
          <div className="admin-ticket-list">
            {tickets.map((ticket, index) => (
              <details key={ticket.id} open={index === 0}>
                <summary>
                  <span className="admin-ticket-list__subject">
                    <strong>{ticket.subject}</strong>
                    <small>#{shortId(ticket.id)}</small>
                  </span>
                  <span>
                    <strong>{ticket.businessName}</strong>
                    <small>{ticket.requesterName}</small>
                  </span>
                  <time>{formatAdminDate(ticket.createdAt)}</time>
                  <StatusBadge value={ticket.priority} />
                  <StatusBadge value={ticket.status} />
                </summary>
                <div className="admin-ticket-list__description">
                  <MessageSquare aria-hidden="true" size={17} />
                  <p>{ticket.description}</p>
                </div>
                {ticket.messages.length > 0 ? (
                  <div className="admin-support-thread">
                    {ticket.messages.map((message) => (
                      <article
                        className={message.isInternal ? "is-internal" : undefined}
                        key={message.id}
                      >
                        <header>
                          <strong>{message.authorName}</strong>
                          <span>
                            {message.isInternal
                              ? "Nota interna"
                              : humanizeStatus(message.deliveryStatus)}
                            {" · "}
                            {formatAdminDate(message.createdAt)}
                          </span>
                        </header>
                        <p>{message.body}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
                <SupportTicketForm
                  assignedToProfileId={ticket.assignedToProfileId}
                  operators={operators}
                  priority={ticket.priority}
                  resolutionNote={ticket.resolutionNote}
                  status={ticket.status}
                  ticketId={ticket.id}
                />
                {ticket.status !== "closed" ? <SupportReplyForm ticketId={ticket.id} /> : null}
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FraudList({
  events,
  operators,
  query
}: {
  events: AdminFraudEvent[];
  operators: AdminDashboardReadyState["operators"];
  query: string;
}) {
  return (
    <div className="admin-list-view">
      <div className="admin-list-toolbar">
        <span>Administração / Segurança / Alertas de risco</span>
        <AdminSearch
          placeholder="Pesquisar por utilizador ou negócio..."
          query={query}
          view="fraud"
        />
      </div>
      {events.length === 0 ? (
        <EmptyState label="Nenhum alerta de fraude encontrado." />
      ) : (
        <div className="admin-risk-list">
          {events.map((event, index) => (
            <article
              className={`admin-risk-card admin-risk-card--${statusTone(event.severity)}`}
              key={event.id}
            >
              <div className="admin-risk-card__heading">
                <span>
                  <AlertTriangle aria-hidden="true" size={19} />
                </span>
                <div>
                  <h2>{humanize(event.eventType)}</h2>
                  <p>{event.detailsSummary}</p>
                </div>
                <span className="admin-risk-card__badges">
                  <StatusBadge value={event.severity} />
                  <StatusBadge value={event.triageStatus} />
                </span>
              </div>
              <dl className="admin-record__facts admin-record__facts--three">
                <Fact
                  label="Utilizador / estabelecimento"
                  value={`${event.businessName} (${event.profileName})`}
                />
                <Fact label="Data do evento" value={formatAdminDate(event.createdAt)} />
                <Fact label="Revisto por" value={event.resolvedByName} />
                <Fact label="Responsável" value={event.assignedToName} />
              </dl>
              {event.resolutionNote ? (
                <p className="admin-record__note">{event.resolutionNote}</p>
              ) : null}
              <details className="admin-editor admin-editor--danger" open={index === 0}>
                <summary>
                  Ação de segurança imediata <ArrowRight aria-hidden="true" size={17} />
                </summary>
                <FraudTriageForm
                  assignedToProfileId={event.assignedToProfileId}
                  fraudEventId={event.id}
                  operators={operators}
                  triageStatus={event.triageStatus}
                />
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditList({ entries, query }: { entries: AdminAuditEntry[]; query: string }) {
  return (
    <div className="admin-list-view">
      <div className="admin-list-toolbar admin-list-toolbar--wrap">
        <span>Administração / Segurança / Histórico de auditoria</span>
        <div className="admin-filter-pills" aria-label="Filtrar auditoria">
          <Link className={!query ? "is-active" : undefined} href="/admin?view=audit">
            Todos
          </Link>
          <Link href="/admin?view=audit&q=create">Criação</Link>
          <Link href="/admin?view=audit&q=update">Atualização</Link>
          <Link href="/admin?view=audit&q=delete">Eliminação</Link>
        </div>
        <AdminSearch placeholder="Procurar eventos..." query={query} view="audit" />
      </div>
      <section className="admin-panel admin-table-panel">
        <PanelHeading
          meta={`${entries.length} registos`}
          title="Registos de atividade do sistema"
        />
        {entries.length === 0 ? (
          <EmptyState label="Nenhum registo de auditoria encontrado." />
        ) : (
          <div className="admin-table-list admin-audit-table">
            <div className="admin-table-list__head admin-table-list__audit">
              <span>Operação</span>
              <span>Detalhes da alteração</span>
              <span>Utilizador</span>
              <span>Negócio</span>
              <span>Recurso</span>
              <span>Data e IP</span>
            </div>
            {entries.map((entry) => (
              <div className="admin-table-list__row admin-table-list__audit" key={entry.id}>
                <strong>{humanize(entry.operation)}</strong>
                <span>{entry.changeSummary}</span>
                <span>{entry.actorName}</span>
                <span>{entry.businessName}</span>
                <code>{entry.entityTable}</code>
                <span>
                  {formatDateOnly(entry.createdAt)}
                  <small>{entry.ipAddress}</small>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Analytics({
  metrics,
  analytics,
  range
}: {
  metrics: PlatformMetrics;
  analytics: AdminAnalyticsData;
  range: string;
}) {
  const activeRange = ["30d", "90d"].includes(range) ? range : "7d";
  const rangeDays = Number.parseInt(activeRange, 10);
  const rangeLabel = `Últimos ${rangeDays} dias`;
  const recent = analytics.daily.reduce(
    (totals, point) => ({
      transactions: totals.transactions + point.transactions,
      volumeMznMinor: totals.volumeMznMinor + point.volumeMznMinor,
      pointsIssued: totals.pointsIssued + point.pointsIssued
    }),
    { transactions: 0, volumeMznMinor: 0, pointsIssued: 0 }
  );

  return (
    <div className="admin-analytics">
      <div className="admin-list-toolbar">
        <div className="admin-filter-pills">
          {["7d", "30d", "90d"].map((value) => (
            <Link
              className={activeRange === value ? "is-active" : undefined}
              href={`/admin?view=analytics&filter=${value}`}
              key={value}
            >
              {value.toUpperCase()}
            </Link>
          ))}
        </div>
        <AdminDownloadButton
          data={analytics.topBusinesses.map((business) => ({
            estabelecimento: business.name,
            transacoes: business.transactions,
            volume_mzn: business.volumeMznMinor / 100,
            pontos_emitidos: business.pointsIssued
          }))}
          filename="vuyela-analitica.csv"
          label="Exportar PDF/CSV"
        />
      </div>
      <div className="admin-metric-grid admin-metric-grid--four">
        <MetricCard
          icon={Activity}
          label="Total de transações"
          meta={rangeLabel}
          value={recent.transactions.toLocaleString("pt-MZ")}
        />
        <MetricCard
          icon={Landmark}
          label="Volume total"
          meta={rangeLabel}
          value={formatMznMinor(recent.volumeMznMinor)}
        />
        <MetricCard
          icon={WalletCards}
          label="Pontos emitidos"
          meta={rangeLabel}
          value={`${recent.pointsIssued.toLocaleString("pt-MZ")} Pts`}
        />
        <MetricCard
          icon={ArrowDownRight}
          label="Taxa de resgate"
          meta="Transações processadas"
          value={`${analytics.redemptionRate}%`}
        />
      </div>
      <div className="admin-data-grid admin-data-grid--charts">
        <section className="admin-panel admin-panel--wide">
          <PanelHeading
            meta={`${(recent.transactions / rangeDays).toLocaleString("pt-MZ", { maximumFractionDigits: 1 })} transações/dia`}
            title={`Transações diárias (${rangeDays} dias)`}
          />
          <AdminLineChart data={analytics.daily} value="transactions" />
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Volume por setor" title="Distribuição por categoria" />
          <AdminShareBars data={analytics.categories} money />
        </section>
      </div>
      <section className="admin-panel admin-table-panel">
        <PanelHeading
          meta={`${metrics.totalBusinesses} negócios registados`}
          title="Parceiros mais ativos da plataforma"
        />
        <div className="admin-table-list">
          <div className="admin-table-list__head admin-table-list__analytics">
            <span>Posição</span>
            <span>Estabelecimento / negócio</span>
            <span>Transações</span>
            <span>Volume financeiro</span>
            <span>Pontos emitidos</span>
          </div>
          {analytics.topBusinesses.map((business, index) => (
            <div
              className="admin-table-list__row admin-table-list__analytics"
              key={business.businessId}
            >
              <strong>#{index + 1}</strong>
              <Link href={`/admin?view=business-detail&id=${business.businessId}`}>
                {business.name}
              </Link>
              <span>{business.transactions.toLocaleString("pt-MZ")}</span>
              <span>{formatMznMinor(business.volumeMznMinor)}</span>
              <strong>{business.pointsIssued.toLocaleString("pt-MZ")} Pts</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingsView({ settings }: { settings: AdminSystemSettings }) {
  return (
    <div className="admin-settings">
      <div className="admin-section-heading">
        <div>
          <span>Definições</span>
          <h2>Configurações globais</h2>
        </div>
      </div>
      <section className="admin-panel admin-form-panel">
        <PanelHeading meta="Persistência segura e auditada" title="Editar definições globais" />
        <PlatformSettingsForm settings={settings} />
      </section>
      <div className="admin-settings-grid">
        <section className="admin-panel">
          <PanelHeading meta="Identidade e localização" title="Definições gerais" />
          <dl className="admin-settings-list">
            <Fact label="Nome da plataforma" value={settings.platformName} />
            <Fact label="URL base" value={settings.publicUrl} />
            <Fact label="Idioma padrão" value={settings.locale} />
            <Fact label="Moeda padrão" value={settings.currency} />
            <Fact label="Fuso horário" value={settings.timeZone} />
          </dl>
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Políticas protegidas" title="Segurança & autenticação" />
          <div className="admin-toggle-list">
            <StatusToggle
              checked={settings.privilegedMfaRequired}
              label="MFA obrigatório para administradores"
            />
            <StatusToggle
              checked={settings.leakedPasswordProtection}
              label="Proteção contra palavras-passe expostas"
            />
            <StatusToggle
              checked={settings.supabaseConnected}
              label="Autenticação Supabase ligada"
            />
          </div>
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Canais operacionais" title="Alertas & notificações" />
          <div className="admin-toggle-list">
            <StatusToggle
              checked={settings.emailConfigured}
              label="Notificações por correio eletrónico"
            />
            <StatusToggle checked={settings.fraudAlerts} label="Alertas de fraude preventiva" />
            <StatusToggle checked={settings.supportAlerts} label="Alertas da fila de suporte" />
          </div>
          <dl className="admin-settings-list">
            <Fact label="Correio eletrónico de segurança" value={settings.securityEmail} />
          </dl>
        </section>
        <section className="admin-panel">
          <PanelHeading meta="Estado dos serviços" title="Integrações & API" />
          <div className="admin-integration-list">
            <Integration icon={Database} label="Supabase" ready={settings.supabaseConnected} />
            <Integration icon={Globe2} label="Vercel" ready={settings.vercelDeployment} />
            <Integration icon={Mail} label="Serviço de e-mail" ready={settings.emailConfigured} />
            <Integration
              icon={Webhook}
              label="Webhooks operacionais"
              ready={settings.supabaseConnected}
            />
          </div>
          <div className="admin-secret-row">
            <KeyRound aria-hidden="true" size={17} />
            <span>Chaves privadas protegidas no servidor</span>
            <LockKeyhole aria-hidden="true" size={17} />
          </div>
        </section>
      </div>
    </div>
  );
}

function BusinessDetail({
  business,
  canReview
}: {
  business: AdminBusinessDetail | null;
  canReview: boolean;
}) {
  if (!business) {
    return <EmptyState label="O estabelecimento solicitado não foi encontrado." />;
  }

  return (
    <div className="admin-detail-view">
      <div className="admin-list-toolbar">
        <Link className="admin-back-link" href="/admin?view=businesses">
          Negócios <ArrowRight aria-hidden="true" size={15} /> Detalhe do negócio
        </Link>
        <AdminDownloadButton
          data={{
            nome: business.name,
            nome_legal: business.legalName,
            nuit: business.nuit,
            estado: business.status,
            proprietario: business.ownerName,
            categoria: business.categoryName,
            telefone: business.phone,
            email: business.email,
            slug: business.slug,
            transacoes: business.transactionCount,
            volume_mzn: business.grossVolumeMznMinor / 100
          }}
          filename={`vuyela-${business.slug}.csv`}
        />
      </div>
      <section className="admin-panel admin-profile-card">
        <div className="admin-profile-card__header">
          <span className="admin-profile-card__mark">
            <Building2 aria-hidden="true" size={26} />
          </span>
          <div>
            <h2>{business.name}</h2>
            <p>
              Proprietário: {business.ownerName} · {business.email} · {business.phone}
            </p>
          </div>
          <StatusBadge value={business.status} />
        </div>
        <div className="admin-profile-tabs">
          <span className="is-active">Perfil</span>
          <span>Filiais ({business.branchCount})</span>
          <span>Transações ({business.transactionCount})</span>
          <span>Cartões emitidos ({business.cardCount})</span>
        </div>
        <dl className="admin-profile-facts">
          <Fact label="Slug de sistema" value={business.slug} />
          <Fact label="Nome legal" value={business.legalName} />
          <Fact label="NUIT" value={business.nuit} />
          <Fact label="Categoria" value={business.categoryName} />
          <Fact label="Data de registo" value={formatAdminDate(business.createdAt)} />
          <Fact label="Última revisão" value={formatAdminDate(business.reviewedAt)} />
          <Fact label="Website" value={business.websiteUrl} />
          <Fact label="Volume processado" value={formatMznMinor(business.grossVolumeMznMinor)} />
        </dl>
        <p className="admin-profile-card__description">{business.description}</p>
      </section>
      <div className="admin-detail-grid">
        <section className="admin-panel">
          <PanelHeading meta="Subscrição ativa" title="Plano atual" />
          {business.subscription ? (
            <>
              <div className="admin-subscription-tier">
                <span>{business.subscription.planName}</span>
                <StatusBadge value={business.subscription.status} />
              </div>
              <dl className="admin-stat-list">
                <Fact
                  label="Limite de filiais"
                  value={`${business.branchCount} / ${formatLimit(business.plan?.branchLimit ?? null)}`}
                />
                <Fact
                  label="Membros de equipa"
                  value={`${business.memberCount} / ${formatLimit(business.plan?.staffLimit ?? null)}`}
                />
                <Fact
                  label="Campanhas ativas"
                  value={formatLimit(business.plan?.campaignLimit ?? null)}
                />
                <Fact
                  label="Fim do período"
                  value={formatAdminDate(
                    business.subscription.currentPeriodEnd ?? business.subscription.trialEndsAt
                  )}
                />
              </dl>
            </>
          ) : (
            <EmptyState label="Este negócio ainda não tem uma subscrição associada." />
          )}
        </section>
        <section className="admin-panel admin-decision-panel">
          <PanelHeading meta="Registo em auditoria" title="Decisão operacional" />
          {canReview ? (
            <BusinessReviewForm businessId={business.id} status={business.status} />
          ) : (
            <p className="admin-empty-copy">
              A sua função permite consultar, mas não alterar este negócio.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function UserDetail({
  user,
  canManage,
  actor
}: {
  user: AdminUserDetail | null;
  canManage: boolean;
  actor: AuthPrincipal;
}) {
  if (!user) {
    return <EmptyState label="O utilizador solicitado não foi encontrado." />;
  }

  return (
    <div className="admin-detail-view">
      <div className="admin-list-toolbar">
        <Link className="admin-back-link" href="/admin?view=users">
          Identidade <ArrowRight aria-hidden="true" size={15} /> Detalhe do utilizador
        </Link>
        <AdminDownloadButton
          data={{
            nome: user.displayName,
            email: user.email,
            telefone: user.phone,
            funcao: user.role,
            idioma: user.locale,
            criado_em: user.createdAt,
            cartoes: user.cards.length
          }}
          filename={`vuyela-utilizador-${shortId(user.id)}.csv`}
        />
      </div>
      <section className="admin-panel admin-profile-card">
        <div className="admin-profile-card__header">
          <span className="admin-console__avatar admin-console__avatar--large">
            {initials(user.displayName)}
          </span>
          <div>
            <h2>{user.displayName}</h2>
            <p>
              {user.email} · {user.phone} · Criado em {formatDateOnly(user.createdAt)}
            </p>
          </div>
          <span className="admin-profile-card__badges">
            <StatusBadge value={user.role} />
            <StatusBadge value={user.accountStatus} />
          </span>
        </div>
        <div className="admin-profile-tabs">
          <span className="is-active">Perfil</span>
          <span>Cartões vinculados ({user.cards.length})</span>
          <span>Transações</span>
          <span>Segurança</span>
        </div>
        <dl className="admin-profile-facts">
          <Fact label="Nome completo" value={user.displayName} />
          <Fact label="Correio eletrónico" value={user.email} />
          <Fact label="Contacto telefónico" value={user.phone} />
          <Fact label="Idioma" value={user.locale} />
          <Fact label="Estado da conta" value={humanizeStatus(user.accountStatus)} />
          <Fact label="Suspensa em" value={formatAdminDate(user.suspendedAt)} />
          <Fact label="Termos aceites" value={formatAdminDate(user.termsAcceptedAt)} />
          <Fact
            label="Consentimento de marketing"
            value={formatAdminDate(user.marketingConsentAt)}
          />
        </dl>
      </section>
      <div className="admin-user-card-grid">
        {user.cards.length === 0 ? (
          <EmptyState label="Este utilizador ainda não tem cartões vinculados." />
        ) : (
          user.cards.map((card) => (
            <article key={card.id}>
              <span className="admin-user-card-grid__logo">VUYELA</span>
              <StatusBadge value={card.status} />
              <strong>{card.businessName}</strong>
              <span>{card.availablePoints.toLocaleString("pt-MZ")} Pts</span>
              <code>{card.cardNumber}</code>
            </article>
          ))
        )}
      </div>
      <section className="admin-panel admin-table-panel">
        <PanelHeading meta="Histórico recente" title="Últimas transações" />
        {user.transactions.length === 0 ? (
          <EmptyState label="Ainda não existem transações para este utilizador." />
        ) : (
          <div className="admin-table-list">
            <div className="admin-table-list__head admin-table-list__transactions">
              <span>Data</span>
              <span>Estabelecimento</span>
              <span>Tipo</span>
              <span>Pontos</span>
            </div>
            {user.transactions.map((transaction) => (
              <div
                className="admin-table-list__row admin-table-list__transactions"
                key={transaction.id}
              >
                <span>{formatDateOnly(transaction.occurredAt)}</span>
                <strong>{transaction.businessName}</strong>
                <span>{transaction.type === "earn" ? "Acumulação" : "Resgate"}</span>
                <strong className={transaction.points >= 0 ? "is-positive" : "is-negative"}>
                  {transaction.points > 0 ? "+" : ""}
                  {transaction.points.toLocaleString("pt-MZ")} Pts
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>
      {canManage ? (
        <section className="admin-panel admin-decision-panel admin-user-actions">
          <PanelHeading meta="Controlo de papéis & acessos" title="Gerir acesso do utilizador" />
          <UserRoleForm
            actorProfileId={actor.profileId}
            actorRole={actor.profileRole}
            currentRole={user.role}
            userId={user.id}
          />
          <UserAccountStatusForm
            accountStatus={user.accountStatus}
            actorProfileId={actor.profileId}
            userId={user.id}
          />
        </section>
      ) : null}
    </div>
  );
}

function AdminBreadcrumb({ view }: { view: AdminView }) {
  const sections: Record<AdminView, string[]> = {
    overview: ["Painel principal", "Visão geral"],
    businesses: ["Empresas", "Aprovação e estado"],
    categories: ["Conteúdo público"],
    users: ["Identidade"],
    subscriptions: ["Financeiro"],
    support: ["Operações", "Fila de suporte"],
    fraud: ["Segurança", "Alertas de risco"],
    audit: ["Segurança", "Histórico de auditoria"],
    analytics: ["Relatórios"],
    settings: ["Definições"],
    "business-detail": ["Empresas", "Detalhe do negócio"],
    "user-detail": ["Identidade", "Detalhe do utilizador"]
  };
  return (
    <nav aria-label="Navegação estrutural" className="admin-breadcrumb">
      <Link href="/admin">Administração</Link>
      {sections[view].map((item) => (
        <span key={item}>
          / <strong>{item}</strong>
        </span>
      ))}
    </nav>
  );
}

const adminFilterOptions: Partial<Record<AdminView, Array<{ value: string; label: string }>>> = {
  businesses: [
    { value: "pending_review", label: "Em aprovação" },
    { value: "active", label: "Ativos" },
    { value: "suspended", label: "Suspensos" }
  ],
  categories: [
    { value: "active", label: "Ativas" },
    { value: "archived", label: "Arquivadas" }
  ],
  users: [
    { value: "active", label: "Contas ativas" },
    { value: "suspended", label: "Contas suspensas" },
    { value: "customer", label: "Clientes" },
    { value: "support_agent", label: "Suporte" }
  ],
  subscriptions: [
    { value: "trialing", label: "Em teste" },
    { value: "active", label: "Ativas" },
    { value: "paused", label: "Pausadas" }
  ],
  support: [
    { value: "open", label: "Abertos" },
    { value: "in_progress", label: "Em curso" },
    { value: "urgent", label: "Urgentes" },
    { value: "resolved", label: "Resolvidos" }
  ],
  fraud: [
    { value: "pending", label: "Pendentes" },
    { value: "reviewing", label: "Em análise" },
    { value: "escalated", label: "Escalados" },
    { value: "critical", label: "Críticos" },
    { value: "resolved", label: "Resolvidos" }
  ],
  audit: [
    { value: "create", label: "Criação" },
    { value: "update", label: "Atualização" },
    { value: "suspension", label: "Suspensão" }
  ]
};

function AdminCollectionControls({ state }: { state: AdminDashboardReadyState }) {
  const options = adminFilterOptions[state.view];
  if (!options || !state.pagination) {
    return null;
  }

  return (
    <div className="admin-collection-controls">
      <div className="admin-filter-pills" aria-label="Filtrar resultados">
        <Link className={!state.filter ? "is-active" : undefined} href={adminHref(state, 1, "")}>
          Todos
        </Link>
        {options.map((option) => (
          <Link
            className={state.filter === option.value ? "is-active" : undefined}
            href={adminHref(state, 1, option.value)}
            key={option.value}
          >
            {option.label}
          </Link>
        ))}
      </div>
      <Link
        className="admin-secondary-button"
        href={`/admin/export?view=${state.view}&q=${encodeURIComponent(state.query)}&filter=${encodeURIComponent(state.filter)}`}
      >
        <Download aria-hidden="true" size={17} />
        Exportar CSV
      </Link>
    </div>
  );
}

function AdminPagination({ state }: { state: AdminDashboardReadyState }) {
  const pagination = state.pagination;
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação" className="admin-pagination">
      <Link
        aria-disabled={pagination.page === 1}
        href={adminHref(state, Math.max(1, pagination.page - 1), state.filter)}
      >
        Anterior
      </Link>
      <span>
        Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} resultados
      </span>
      <Link
        aria-disabled={pagination.page === pagination.totalPages}
        href={adminHref(state, Math.min(pagination.totalPages, pagination.page + 1), state.filter)}
      >
        Seguinte
      </Link>
    </nav>
  );
}

function adminHref(state: AdminDashboardReadyState, page: number, filter: string): string {
  const params = new URLSearchParams({ view: state.view, page: String(page) });
  if (state.query) {
    params.set("q", state.query);
  }
  if (filter) {
    params.set("filter", filter);
  }

  return `/admin?${params.toString()}`;
}

function AdminSearch({
  view,
  query,
  placeholder
}: {
  view: AdminView;
  query: string;
  placeholder: string;
}) {
  return (
    <form action="/admin" className="admin-search" method="get" role="search">
      <input name="view" type="hidden" value={view} />
      <Search aria-hidden="true" size={17} />
      <input
        aria-label="Pesquisar nesta área"
        defaultValue={query}
        maxLength={80}
        name="q"
        placeholder={placeholder}
        type="search"
      />
      <button type="submit">Pesquisar</button>
    </form>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  meta
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <article className="admin-metric">
      <span className="admin-metric__icon">
        <Icon aria-hidden="true" size={19} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  );
}

function HealthCard({
  label,
  value,
  meta,
  direction
}: {
  label: string;
  value: string;
  meta: string;
  direction: "up" | "down";
}) {
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>
        <Icon aria-hidden="true" size={15} />
        {meta}
      </small>
    </article>
  );
}

function PanelHeading({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="admin-panel__heading">
      <div>
        <h2>{title}</h2>
        <p>{meta}</p>
      </div>
    </div>
  );
}

function TopBusinessList({ analytics }: { analytics: AdminAnalyticsData }) {
  if (analytics.topBusinesses.length === 0)
    return <p className="admin-empty-copy">Sem transações no período.</p>;
  const total = analytics.topBusinesses.reduce((sum, item) => sum + item.volumeMznMinor, 0);
  return (
    <ol className="admin-ranking-list">
      {analytics.topBusinesses.map((business, index) => (
        <li key={business.businessId}>
          <span>{index + 1}</span>
          <Link href={`/admin?view=business-detail&id=${business.businessId}`}>
            {business.name}
          </Link>
          <strong>{formatMznMinor(business.volumeMznMinor)}</strong>
          <small>{percentage(business.volumeMznMinor, total)}</small>
        </li>
      ))}
    </ol>
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

function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`admin-status-badge admin-status-badge--${statusTone(value)}`}>
      {label ?? humanizeStatus(value)}
    </span>
  );
}

function StatusToggle({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div>
      <span>
        <strong>{label}</strong>
        <small>{checked ? "Ativo" : "Não configurado"}</small>
      </span>
      <span aria-checked={checked} className={checked ? "is-active" : undefined} role="switch">
        <i />
      </span>
    </div>
  );
}

function Integration({
  icon: Icon,
  label,
  ready
}: {
  icon: typeof Database;
  label: string;
  ready: boolean;
}) {
  return (
    <div>
      <span>
        <Icon aria-hidden="true" size={18} />
        {label}
      </span>
      <StatusBadge
        value={ready ? "active" : "paused"}
        label={ready ? "Operacional" : "Por configurar"}
      />
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

function percentage(value: number, total: number): string {
  return total === 0
    ? "0%"
    : `${new Intl.NumberFormat("pt-MZ", { maximumFractionDigits: 1 }).format((value / total) * 100)}%`;
}

function formatLimit(limit: number | null): string {
  return limit === null ? "Ilimitado" : limit.toLocaleString("pt-MZ");
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function shortId(value: string): string {
  return value.slice(0, 8).toUpperCase();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "U"}${parts[1]?.[0] ?? "V"}`.toUpperCase();
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
    platform_admin: "Administrador",
    super_admin: "Super administrador",
    trialing: "Em teste",
    past_due: "Em atraso",
    paused: "Pausado",
    cancelled: "Cancelado",
    open: "Aberto",
    in_progress: "Em curso",
    resolved: "Resolvido",
    reviewing: "Em análise",
    escalated: "Escalado",
    dismissed: "Descartado",
    closed: "Fechado",
    low: "Baixa",
    normal: "Normal",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente",
    critical: "Crítico",
    create: "Criação",
    update: "Atualização",
    delete: "Eliminação"
  };
  return labels[value] ?? humanize(value);
}

function statusTone(value: string): string {
  if (["active", "resolved", "closed", "low", "create"].includes(value)) return "active";
  if (
    [
      "pending_review",
      "pending",
      "reviewing",
      "trialing",
      "open",
      "in_progress",
      "normal",
      "medium"
    ].includes(value)
  )
    return "pending";
  if (
    ["high", "urgent", "critical", "escalated", "past_due", "suspended", "delete"].includes(value)
  )
    return "danger";
  return "neutral";
}

function humanize(value: string): string {
  const labels: Record<string, string> = {
    acesso_nao_autorizado: "Acesso não autorizado",
    advanced: "Avançada",
    atualizacao_de_plano: "Atualização de plano",
    criacao_de_cartao: "Criação de cartão",
    operacao_sensivel: "Operação sensível",
    padrao_anomalo: "Padrão anómalo",
    standard: "Padrão",
    transacao_suspeita: "Transação suspeita"
  };

  if (labels[value]) return labels[value];

  return value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}
