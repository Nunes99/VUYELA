import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Download,
  Gift,
  MapPin,
  ScanLine,
  ShieldCheck
} from "lucide-react";
import type { ReactNode } from "react";

import type { BusinessDashboardState } from "./data";
import { formatMznMinor, formatPercent } from "./model";
import type {
  BusinessDashboardBranch,
  BusinessDashboardCampaign,
  BusinessDashboardTransaction,
  BusinessDashboardViewModel
} from "./model";

export const businessDashboardViews = [
  "dashboard",
  "filiais",
  "cartoes",
  "clientes",
  "fidelizacao",
  "analitica",
  "pos",
  "transacoes"
] as const;

export type BusinessDashboardPageView = (typeof businessDashboardViews)[number];

export function parseBusinessDashboardView(
  value: string | string[] | undefined
): BusinessDashboardPageView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return businessDashboardViews.includes(candidate as BusinessDashboardPageView)
    ? (candidate as BusinessDashboardPageView)
    : "dashboard";
}

export function BusinessDashboardView({
  state,
  view = "dashboard"
}: {
  state: BusinessDashboardState;
  view?: BusinessDashboardPageView;
}) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`business-portal-notice${
          state.status === "error" ? " business-portal-notice--error" : ""
        }`}
        aria-labelledby="business-dashboard-notice"
      >
        <h2 id="business-dashboard-notice">Painel indisponível</h2>
        <p>{state.message}</p>
      </section>
    );
  }

  const activeTab = view === "dashboard" ? "perfil" : view;

  return (
    <div className="business-view">
      <BusinessViewToolbar state={state} view={view} />
      <BusinessProfileHeader
        activeTab={activeTab}
        business={state.dashboard.business}
        scopeLabel={state.dashboard.scopeLabel}
      />
      {view === "dashboard" ? <DashboardOverview dashboard={state.dashboard} /> : null}
      {view === "filiais" ? <BranchesView dashboard={state.dashboard} /> : null}
      {view === "cartoes" ? <CardsView dashboard={state.dashboard} /> : null}
      {view === "clientes" ? <CustomersView dashboard={state.dashboard} /> : null}
      {view === "fidelizacao" ? <LoyaltyView dashboard={state.dashboard} /> : null}
      {view === "analitica" ? <AnalyticsView dashboard={state.dashboard} /> : null}
      {view === "pos" ? <PosOverview dashboard={state.dashboard} /> : null}
      {view === "transacoes" ? <TransactionsView dashboard={state.dashboard} /> : null}
    </div>
  );
}

export function BusinessProfileHeader({
  business,
  activeTab,
  scopeLabel
}: {
  business: { id: string; name: string; status: string };
  activeTab: string;
  scopeLabel?: string;
}) {
  const tabs = [
    { id: "perfil", label: "Perfil", href: "/negocio" },
    { id: "filiais", label: "Filiais", href: "/negocio?vista=filiais" },
    { id: "campanhas", label: "Campanhas", href: "/negocio/campanhas" },
    { id: "transacoes", label: "Transações", href: "/negocio?vista=transacoes" },
    { id: "cartoes", label: "Cartões Emitidos", href: "/negocio?vista=cartoes" },
    { id: "analitica", label: "Analítica", href: "/negocio?vista=analitica" },
    { id: "clientes", label: "Clientes", href: "/negocio?vista=clientes" }
  ];

  return (
    <section className="business-profile-header">
      <div className="business-profile-header__identity">
        <span aria-hidden="true">
          <BriefcaseBusiness size={23} />
        </span>
        <div>
          <h2>{business.name}</h2>
          <p>{scopeLabel ?? "Gestão integral do negócio"}</p>
        </div>
        <StatusBadge value={business.status} />
      </div>
      <nav aria-label="Áreas do negócio" className="business-profile-tabs">
        {tabs.map((tab) => (
          <Link
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={activeTab === tab.id ? "is-active" : undefined}
            href={`${tab.href}${tab.href.includes("?") ? "&" : "?"}businessId=${business.id}`}
            key={tab.id}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}

function BusinessViewToolbar({
  state,
  view
}: {
  state: Extract<BusinessDashboardState, { status: "ready" }>;
  view: BusinessDashboardPageView;
}) {
  const { dashboard } = state;
  const labels: Record<BusinessDashboardPageView, string> = {
    dashboard: "Visão geral",
    filiais: "Filiais",
    cartoes: "Cartões Emitidos",
    clientes: "Clientes",
    fidelizacao: "Programa de Fidelização",
    analitica: "Analítica",
    pos: "Terminal POS",
    transacoes: "Transações"
  };

  return (
    <>
      <div className="business-view-toolbar">
        <p>
          Administração <span>/</span> Empresas <span>/</span> <strong>{labels[view]}</strong>
        </p>
        {view === "dashboard" || view === "analitica" ? (
          <a
            className="business-button business-button--primary"
            download={`relatorio-${dashboard.business.name.toLowerCase().replace(/\s+/g, "-")}.csv`}
            href={buildDashboardCsvUrl(dashboard)}
          >
            <Download aria-hidden="true" size={16} />
            Exportar relatório
          </a>
        ) : view === "pos" ? (
          <Link className="business-button business-button--primary" href="/pos">
            <ScanLine aria-hidden="true" size={16} />
            Abrir POS
          </Link>
        ) : dashboard.hasManagerScope && view === "fidelizacao" ? (
          <Link
            className="business-button business-button--primary"
            href={`/negocio/definicoes?businessId=${dashboard.business.id}`}
          >
            Editar regras
          </Link>
        ) : null}
      </div>
      {state.businesses.length > 1 || state.dashboard.branches.length > 1 ? (
        <nav aria-label="Selecionar contexto do negócio" className="business-context-nav">
          {state.businesses.map((business) => (
            <Link
              className={business.id === state.selectedBusinessId ? "is-active" : undefined}
              href={`/negocio?vista=${view}&businessId=${business.id}`}
              key={business.id}
            >
              {business.name}
            </Link>
          ))}
          {state.dashboard.branches.length > 1 ? <span aria-hidden="true" /> : null}
          {state.dashboard.branches.length > 1 ? (
            <Link
              className={!state.selectedBranchId ? "is-active" : undefined}
              href={`/negocio?vista=${view}&businessId=${state.selectedBusinessId}`}
            >
              Todas as filiais
            </Link>
          ) : null}
          {state.dashboard.branches.length > 1
            ? state.dashboard.branches.map((branch) => (
                <Link
                  className={branch.id === state.selectedBranchId ? "is-active" : undefined}
                  href={`/negocio?vista=${view}&businessId=${state.selectedBusinessId}&branchId=${branch.id}`}
                  key={branch.id}
                >
                  {branch.name}
                </Link>
              ))
            : null}
        </nav>
      ) : null}
    </>
  );
}

function DashboardOverview({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  const monthSeries = buildMonthSeries(dashboard.transactions);

  return (
    <>
      <div className="business-metric-grid business-metric-grid--four">
        <Metric
          label="Receita mensal"
          value={formatMznMinor(dashboard.overview.revenueMznMinor)}
          meta="Período selecionado"
          tone="dark"
        />
        <Metric
          label="Transações"
          value={dashboard.overview.transactionCount.toLocaleString("pt-MZ")}
          meta="Compras concluídas"
        />
        <Metric
          label="Clientes ativos"
          value={dashboard.overview.activeCustomerCount.toLocaleString("pt-MZ")}
          meta={`${dashboard.overview.customerCount.toLocaleString("pt-MZ")} registados`}
        />
        <Metric
          label="Pontos emitidos"
          value={`${dashboard.points.lifetimeEarned.toLocaleString("pt-MZ")} Pts`}
          meta={formatMznMinor(dashboard.points.liabilityMznMinor)}
          tone="teal"
        />
      </div>

      <div className="business-two-column business-two-column--chart">
        <Panel title="Receita dos últimos seis meses" meta="Evolução mensal">
          <MiniBarChart
            values={monthSeries.map((item) => item.value)}
            labels={monthSeries.map((item) => item.label)}
          />
        </Panel>
        <Panel title="Atividade de pontos" meta="Responsabilidade atual">
          <ProgressRows
            rows={[
              {
                label: "Pontos disponíveis",
                value: dashboard.points.availablePoints,
                total: Math.max(dashboard.points.lifetimeEarned, 1),
                display: `${dashboard.points.availablePoints.toLocaleString("pt-MZ")} Pts`
              },
              {
                label: "Pontos resgatados",
                value: dashboard.points.lifetimeRedeemed,
                total: Math.max(dashboard.points.lifetimeEarned, 1),
                display: `${dashboard.points.lifetimeRedeemed.toLocaleString("pt-MZ")} Pts`
              },
              {
                label: "Responsabilidade",
                value: dashboard.points.liabilityMznMinor,
                total: Math.max(dashboard.overview.revenueMznMinor, 1),
                display: formatMznMinor(dashboard.points.liabilityMznMinor)
              }
            ]}
          />
        </Panel>
      </div>

      <div className="business-two-column business-two-column--activity">
        <Panel title="Últimas transações registadas" meta="Movimentos recentes">
          <TransactionTable transactions={dashboard.transactions.slice(0, 6)} />
        </Panel>
        <div className="business-side-stack">
          <Panel title="Filiais" meta={`${dashboard.branches.length} no total`}>
            <CompactBranchList branches={dashboard.branches.slice(0, 4)} />
          </Panel>
          <Panel title="Campanhas em curso" meta={`${dashboard.campaigns.length} registadas`}>
            <CompactCampaignList campaigns={dashboard.campaigns.slice(0, 3)} />
          </Panel>
        </div>
      </div>
    </>
  );
}

function BranchesView({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  return (
    <section className="business-record-list" aria-label="Filiais do negócio">
      {dashboard.branches.length === 0 ? (
        <EmptyState title="Sem filiais" body="As filiais ativas aparecem aqui." />
      ) : (
        dashboard.branches.map((branch) => (
          <article className="business-record" key={branch.id}>
            <div className="business-record__heading">
              <div>
                <h3>{branch.name}</h3>
                {branch.isPrimary ? <small>SEDE</small> : null}
              </div>
              <StatusBadge value="active" label="Ativa" />
            </div>
            <dl className="business-record__facts business-record__facts--four">
              <Fact
                label="Localização"
                value={branch.city}
                detail={branch.isPrimary ? "Filial principal" : "Filial operacional"}
              />
              <Fact label="Transações" value={branch.transactionCount.toLocaleString("pt-MZ")} />
              <Fact label="Receita" value={formatMznMinor(branch.revenueMznMinor)} tone="teal" />
              <Fact label="Âmbito" value={dashboard.scopeLabel} />
            </dl>
          </article>
        ))
      )}
    </section>
  );
}

function CardsView({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  const activeCards = dashboard.customers.length;
  return (
    <>
      <div className="business-metric-grid business-metric-grid--four">
        <Metric label="Total de cartões" value={activeCards.toLocaleString("pt-MZ")} />
        <Metric label="Cartões ativos" value={activeCards.toLocaleString("pt-MZ")} tone="teal" />
        <Metric
          label="Pontos em circulação"
          value={`${dashboard.points.availablePoints.toLocaleString("pt-MZ")} Pts`}
        />
        <Metric
          label="Valor equivalente"
          value={formatMznMinor(dashboard.points.liabilityMznMinor)}
          tone="teal"
        />
      </div>
      <Panel title="Controlo de cartões digitais" meta={`${activeCards} cartões`}>
        {dashboard.customers.length === 0 ? (
          <EmptyState
            title="Sem cartões emitidos"
            body="Os cartões aparecem após a adesão dos clientes."
          />
        ) : (
          <div className="business-data-table">
            <div className="business-data-table__head business-data-table__cards">
              <span>Cartão</span>
              <span>Cliente</span>
              <span>Data de emissão</span>
              <span>Saldo</span>
              <span>Ganhos</span>
              <span>Resgatados</span>
              <span>Estado</span>
            </div>
            {dashboard.customers.map((customer) => (
              <div
                className="business-data-table__row business-data-table__cards"
                key={customer.id}
              >
                <strong>#{customer.cardNumber}</strong>
                <span>{customer.customerName}</span>
                <span>{formatDate(customer.joinedAt)}</span>
                <strong>{customer.availablePoints.toLocaleString("pt-MZ")} Pts</strong>
                <span>{customer.lifetimeEarned.toLocaleString("pt-MZ")} Pts</span>
                <span>{customer.lifetimeRedeemed.toLocaleString("pt-MZ")} Pts</span>
                <StatusBadge value="active" label="Ativo" />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function CustomersView({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  const averagePoints = dashboard.customers.length
    ? Math.round(dashboard.points.availablePoints / dashboard.customers.length)
    : 0;
  return (
    <>
      <div className="business-metric-grid business-metric-grid--three">
        <Metric
          label="Total de clientes"
          value={dashboard.overview.customerCount.toLocaleString("pt-MZ")}
        />
        <Metric
          label="Clientes recorrentes"
          value={dashboard.retention.retainedCustomerCount.toLocaleString("pt-MZ")}
        />
        <Metric
          label="Pontos médios"
          value={`${averagePoints.toLocaleString("pt-MZ")} Pts`}
          tone="teal"
        />
      </div>
      <Panel
        title="Histórico de clientes registados"
        meta={`${dashboard.customers.length} clientes`}
      >
        {dashboard.customers.length === 0 ? (
          <EmptyState
            title="Sem clientes"
            body="Os clientes aparecem depois da adesão ao programa."
          />
        ) : (
          <div className="business-data-table">
            <div className="business-data-table__head business-data-table__customers">
              <span>Nome</span>
              <span>Cartão</span>
              <span>Saldo</span>
              <span>Responsabilidade</span>
              <span>Última compra</span>
              <span>Estado</span>
            </div>
            {dashboard.customers.map((customer) => (
              <div
                className="business-data-table__row business-data-table__customers"
                key={customer.id}
              >
                <strong>{customer.customerName}</strong>
                <span>{customer.cardNumber}</span>
                <strong>{customer.availablePoints.toLocaleString("pt-MZ")} Pts</strong>
                <span>{formatMznMinor(customer.liabilityMznMinor)}</span>
                <span>
                  {customer.lastTransactionAt
                    ? formatDate(customer.lastTransactionAt)
                    : "Sem compra"}
                </span>
                <StatusBadge value="active" label="Ativo" />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function LoyaltyView({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  const program = dashboard.program;
  return (
    <>
      <div className="business-metric-grid business-metric-grid--four">
        <Metric
          label="Total de pontos emitidos"
          value={`${dashboard.points.lifetimeEarned.toLocaleString("pt-MZ")} Pts`}
        />
        <Metric
          label="Pontos resgatados"
          value={`${dashboard.points.lifetimeRedeemed.toLocaleString("pt-MZ")} Pts`}
        />
        <Metric
          label="Taxa de resgate"
          value={formatPercent(dashboard.points.redemptionRate)}
          tone="gold"
        />
        <Metric
          label="Responsabilidade financeira"
          value={formatMznMinor(dashboard.points.liabilityMznMinor)}
          tone="teal"
        />
      </div>
      <div className="business-two-column">
        <Panel title="Configuração do programa" meta={program ? "Ativo" : "Não configurado"}>
          {program ? (
            <dl className="business-definition-list">
              <Fact label="Nome do programa" value={program.name} />
              <Fact
                label="Taxa de recompensa"
                value={`${Number(program.earnRate) * 100}% do valor da compra`}
              />
              <Fact
                label="Valor unitário do ponto"
                value={formatMznMinor(program.pointValueMznMinor)}
              />
              <Fact
                label="Máximo de resgate por transação"
                value={`${program.maximumRedemptionPercent}% do total`}
              />
              <Fact
                label="Validade dos pontos"
                value={
                  program.pointsExpireAfterDays
                    ? `${program.pointsExpireAfterDays} dias`
                    : "Sem validade definida"
                }
              />
            </dl>
          ) : (
            <EmptyState
              title="Sem programa"
              body="Configure o programa para começar a emitir pontos."
            />
          )}
        </Panel>
        <Panel title="Termos legais e gerais" meta="Contrato do programa">
          <div className="business-legal-copy">
            <strong>Responsabilidade promocional do emissor</strong>
            <p>
              {program?.name
                ? `O programa ${program.name} atribui pontos promocionais segundo as regras configuradas pelo negócio.`
                : "Os termos serão apresentados após a configuração do programa."}
            </p>
            <div>
              <ShieldCheck aria-hidden="true" size={18} /> Alterações às regras exigem permissões de
              administração do negócio.
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function AnalyticsView({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  const monthSeries = buildMonthSeries(dashboard.transactions);
  return (
    <>
      <div className="business-metric-grid business-metric-grid--three">
        <Metric label="Vendas totais" value={formatMznMinor(dashboard.overview.revenueMznMinor)} />
        <Metric
          label="Transações"
          value={dashboard.overview.transactionCount.toLocaleString("pt-MZ")}
        />
        <Metric
          label="Clientes únicos"
          value={dashboard.overview.activeCustomerCount.toLocaleString("pt-MZ")}
        />
        <Metric
          label="Ticket médio"
          value={formatMznMinor(dashboard.overview.averageTicketMznMinor)}
        />
        <Metric label="Taxa de retenção" value={formatPercent(dashboard.retention.retentionRate)} />
        <Metric
          label="Responsabilidade de pontos"
          value={formatMznMinor(dashboard.points.liabilityMznMinor)}
          tone="teal"
        />
      </div>
      <div className="business-three-column">
        <Panel title="Vendas por período" meta="Últimos seis meses">
          <MiniBarChart
            values={monthSeries.map((item) => item.value)}
            labels={monthSeries.map((item) => item.label)}
          />
        </Panel>
        <Panel title="Transações por tipo" meta="Compras e resgates">
          <DonutMetric
            value={Math.round(dashboard.points.redemptionRate * 100)}
            label="Com pontos"
          />
        </Panel>
        <Panel title="Distribuição por filial" meta="Receita">
          <ProgressRows
            rows={dashboard.branches.slice(0, 5).map((branch) => ({
              label: branch.name,
              value: branch.revenueMznMinor,
              total: Math.max(dashboard.overview.revenueMznMinor, 1),
              display: formatMznMinor(branch.revenueMznMinor)
            }))}
          />
        </Panel>
      </div>
    </>
  );
}

function PosOverview({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  const latest = dashboard.transactions[0];
  return (
    <>
      <div className="business-metric-grid business-metric-grid--four">
        <Metric label="Estado do terminal" value="Por registar" />
        <Metric
          label="Última transação"
          value={latest ? formatDateTime(latest.occurredAt) : "Sem transações"}
        />
        <Metric label="Taxa de erro" value="Sem medição" />
        <Metric
          label="Filiais disponíveis"
          value={dashboard.branches.length.toLocaleString("pt-MZ")}
          tone="teal"
        />
      </div>
      <div className="business-two-column">
        <Panel title="Identificação e terminal" meta="Métodos disponíveis">
          <dl className="business-definition-list">
            <Fact label="Negócio associado" value={dashboard.business.name} />
            <Fact label="Escopo atual" value={dashboard.scopeLabel} />
          </dl>
          <ul className="business-check-list">
            <li>
              <CheckCircle2 size={16} /> Código QR digital
            </li>
            <li>
              <CheckCircle2 size={16} /> Número do cartão
            </li>
            <li>
              <CheckCircle2 size={16} /> Contacto telefónico opcional
            </li>
          </ul>
        </Panel>
        <Panel title="Fluxo de integração transacional" meta="Cinco etapas">
          <ol className="business-flow-steps">
            {["Identificar", "Serviços", "Autorizar", "Confirmar", "Sucesso"].map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <Panel
        title="Últimas transações registadas neste POS"
        meta={`${dashboard.transactions.length} movimentos`}
      >
        <TransactionTable transactions={dashboard.transactions.slice(0, 8)} />
      </Panel>
    </>
  );
}

function TransactionsView({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  return (
    <Panel
      title="Transações do negócio"
      meta={`${dashboard.transactions.length} movimentos no período`}
    >
      <TransactionTable transactions={dashboard.transactions} />
    </Panel>
  );
}

function Panel({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className="business-panel">
      <header>
        <h3>{title}</h3>
        {meta ? <span>{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  meta,
  tone = "default"
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: "default" | "dark" | "teal" | "gold" | "success";
}) {
  return (
    <article className={`business-metric business-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </article>
  );
}

function Fact({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "teal";
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={tone === "teal" ? "is-teal" : undefined}>{value}</dd>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function StatusBadge({ value, label }: { value: string; label?: string }) {
  const active = value === "active" || value === "approved";
  return (
    <span
      className={`business-status ${
        active ? "business-status--active" : "business-status--neutral"
      }`}
    >
      {label ?? (active ? "Ativo" : statusLabel(value))}
    </span>
  );
}

function TransactionTable({ transactions }: { transactions: BusinessDashboardTransaction[] }) {
  if (transactions.length === 0)
    return (
      <EmptyState title="Sem transações" body="As compras confirmadas pelo POS aparecem aqui." />
    );
  return (
    <div className="business-data-table">
      <div className="business-data-table__head business-data-table__transactions">
        <span>Transação</span>
        <span>Cliente</span>
        <span>Filial</span>
        <span>Valor real</span>
        <span>Pontos</span>
        <span>Data</span>
      </div>
      {transactions.map((transaction) => (
        <div
          className="business-data-table__row business-data-table__transactions"
          key={transaction.id}
        >
          <strong>#{shortId(transaction.id)}</strong>
          <span>{transaction.customerName}</span>
          <span>{transaction.branchName}</span>
          <strong>{formatMznMinor(transaction.netAmountMznMinor)}</strong>
          <span className="is-teal">+{transaction.pointsEarned.toLocaleString("pt-MZ")} Pts</span>
          <span>{formatDateTime(transaction.occurredAt)}</span>
        </div>
      ))}
    </div>
  );
}

function CompactBranchList({ branches }: { branches: BusinessDashboardBranch[] }) {
  if (branches.length === 0)
    return <EmptyState title="Sem filiais" body="Nenhuma filial disponível." />;
  return (
    <div className="business-compact-list">
      {branches.map((branch) => (
        <div key={branch.id}>
          <span>
            <MapPin size={15} />
            <strong>{branch.name}</strong>
            <small>{branch.city}</small>
          </span>
          <StatusBadge value="active" label={branch.isPrimary ? "SEDE" : "ATIVA"} />
        </div>
      ))}
    </div>
  );
}

function CompactCampaignList({ campaigns }: { campaigns: BusinessDashboardCampaign[] }) {
  if (campaigns.length === 0)
    return <EmptyState title="Sem campanhas" body="Nenhuma campanha em curso." />;
  return (
    <div className="business-compact-list">
      {campaigns.map((campaign) => (
        <div key={campaign.id}>
          <span>
            <Gift size={15} />
            <strong>{campaign.name}</strong>
            <small>{campaign.campaignType}</small>
          </span>
          <StatusBadge value={campaign.status} />
        </div>
      ))}
    </div>
  );
}

function ProgressRows({
  rows
}: {
  rows: Array<{ label: string; value: number; total: number; display: string }>;
}) {
  if (rows.length === 0)
    return <EmptyState title="Sem dados" body="Ainda não existem valores para apresentar." />;
  return (
    <div className="business-progress-list">
      {rows.map((row) => (
        <div key={row.label}>
          <span>
            <strong>{row.label}</strong>
            <b>{row.display}</b>
          </span>
          <i>
            <span
              style={{ width: `${Math.min(100, Math.max(3, (row.value / row.total) * 100))}%` }}
            />
          </i>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="business-mini-chart">
      {values.map((value, index) => (
        <div key={`${labels[index]}-${index}`}>
          <i style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="business-donut">
      <div style={{ background: `conic-gradient(#0d9488 0 ${value}%, #dfe8ec ${value}% 100%)` }}>
        <span>
          <strong>{value}%</strong>
          <small>{label}</small>
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="business-empty">
      <Clock3 aria-hidden="true" size={23} />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function buildMonthSeries(transactions: BusinessDashboardTransaction[]) {
  const formatter = new Intl.DateTimeFormat("pt-MZ", { month: "short" });
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    const value = transactions
      .filter((transaction) => {
        const occurred = new Date(transaction.occurredAt);
        return (
          occurred.getFullYear() === date.getFullYear() && occurred.getMonth() === date.getMonth()
        );
      })
      .reduce((sum, transaction) => sum + transaction.netAmountMznMinor, 0);
    return { label: formatter.format(date), value };
  });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function shortId(value: string): string {
  return value.slice(0, 8).toUpperCase();
}

function statusLabel(value: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    scheduled: "Agendada",
    completed: "Terminada",
    paused: "Pausada",
    suspended: "Suspenso",
    pending_review: "Em aprovação"
  };
  return labels[value] ?? value;
}

function buildDashboardCsvUrl(dashboard: BusinessDashboardViewModel): string {
  const rows = [
    ["Transação", "Cliente", "Filial", "Valor MZN", "Pontos ganhos", "Data"],
    ...dashboard.transactions.map((transaction) => [
      transaction.id,
      transaction.customerName,
      transaction.branchName,
      (transaction.netAmountMznMinor / 100).toFixed(2),
      String(transaction.pointsEarned),
      transaction.occurredAt
    ])
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
}
