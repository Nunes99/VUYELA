import {
  BarChart3,
  Building2,
  ClipboardList,
  Coins,
  CreditCard,
  Gift,
  LineChart,
  Settings,
  Store,
  Users,
  UserPlus
} from "lucide-react";
import Link from "next/link";

import { formatMznMinor, formatPercent } from "./model";
import type { BusinessDashboardBusinessOption, BusinessDashboardState } from "./data";
import type { BusinessDashboardViewModel } from "./model";

interface BusinessDashboardViewProps {
  state: BusinessDashboardState;
}

const navItems = [
  { href: "#overview", label: "Visao geral", icon: BarChart3 },
  { href: "#customers", label: "Clientes", icon: Users },
  { href: "#transactions", label: "Transaccoes", icon: ClipboardList },
  { href: "#points", label: "Pontos", icon: Coins },
  { href: "#campaigns", label: "Campanhas", icon: Gift },
  { href: "/negocio/indicacoes", label: "Indicacoes", icon: UserPlus },
  { href: "/negocio/subscricao", label: "Subscricao", icon: CreditCard },
  { href: "#program", label: "Programa", icon: LineChart },
  { href: "#branches", label: "Filiais", icon: Store },
  { href: "#employees", label: "Equipa", icon: Building2 },
  { href: "#reports", label: "Relatorios", icon: BarChart3 },
  { href: "#settings", label: "Definicoes", icon: Settings }
];

export function BusinessDashboardView({ state }: BusinessDashboardViewProps) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`business-dashboard-notice${
          state.status === "error" ? " business-dashboard-notice--error" : ""
        }`}
        aria-labelledby="business-dashboard-notice"
      >
        <h2 id="business-dashboard-notice">Dashboard indisponivel</h2>
        <p>{state.message}</p>
      </section>
    );
  }

  return (
    <div className="business-dashboard">
      <BusinessDashboardSwitcher
        businesses={state.businesses}
        selectedBranchId={state.selectedBranchId}
        selectedBusinessId={state.selectedBusinessId}
      />
      <BusinessDashboardNav />
      <BusinessDashboardContent dashboard={state.dashboard} />
    </div>
  );
}

function BusinessDashboardSwitcher({
  businesses,
  selectedBusinessId,
  selectedBranchId
}: {
  businesses: BusinessDashboardBusinessOption[];
  selectedBusinessId: string;
  selectedBranchId: string;
}) {
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId);

  return (
    <section className="business-dashboard-switcher" aria-label="Contexto do dashboard">
      <div>
        <span className="business-dashboard-eyebrow">Contexto</span>
        <h2>{selectedBusiness?.name ?? "Negocio VUYELA"}</h2>
        <p>{getScopeCopy(selectedBusiness, selectedBranchId)}</p>
      </div>
      <div className="business-dashboard-switcher__actions">
        {businesses.map((business) => (
          <Link
            className={business.id === selectedBusinessId ? "is-active" : ""}
            href={`/negocio?businessId=${encodeURIComponent(business.id)}`}
            key={business.id}
          >
            {business.name}
          </Link>
        ))}
        {selectedBusiness?.allowWholeBusiness
          ? selectedBusiness.branches.map((branch) => (
              <Link
                className={branch.id === selectedBranchId ? "is-active" : ""}
                href={`/negocio?businessId=${encodeURIComponent(
                  selectedBusiness.id
                )}&branchId=${encodeURIComponent(branch.id)}`}
                key={branch.id}
              >
                {branch.name}
              </Link>
            ))
          : null}
      </div>
    </section>
  );
}

function BusinessDashboardNav() {
  return (
    <nav className="business-dashboard-nav" aria-label="Navegacao do negocio">
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

function BusinessDashboardContent({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  return (
    <>
      <section id="overview" className="business-dashboard-hero" aria-labelledby="overview-title">
        <div>
          <span className="business-dashboard-eyebrow">{dashboard.scopeLabel}</span>
          <h2 id="overview-title">{dashboard.business.name}</h2>
          <p>
            Resumo dos ultimos 90 dias com vendas, clientes, pontos, liability promocional e
            retencao.
          </p>
        </div>
        <div className="business-dashboard-stat-grid">
          <Stat label="Vendas" value={formatMznMinor(dashboard.overview.revenueMznMinor)} />
          <Stat
            label="Transaccoes"
            value={dashboard.overview.transactionCount.toLocaleString("pt-MZ")}
          />
          <Stat label="Clientes" value={dashboard.overview.customerCount.toLocaleString("pt-MZ")} />
          <Stat
            label="Ticket medio"
            value={formatMznMinor(dashboard.overview.averageTicketMznMinor)}
          />
        </div>
      </section>

      <section id="points" className="business-dashboard-section" aria-labelledby="points-title">
        <SectionHeading
          eyebrow="Pontos"
          title="Liability e actividade"
          id="points-title"
          body="Valor promocional em aberto e ritmo de utilizacao de pontos."
        />
        <div className="business-dashboard-stat-grid business-dashboard-stat-grid--wide">
          <Stat
            label="Pontos disponiveis"
            value={dashboard.points.availablePoints.toLocaleString("pt-MZ")}
          />
          <Stat label="Liability" value={formatMznMinor(dashboard.points.liabilityMznMinor)} />
          <Stat
            label="Ganhos historicos"
            value={dashboard.points.lifetimeEarned.toLocaleString("pt-MZ")}
          />
          <Stat
            label="Resgatados"
            value={dashboard.points.lifetimeRedeemed.toLocaleString("pt-MZ")}
          />
          <Stat label="Taxa de resgate" value={formatPercent(dashboard.points.redemptionRate)} />
          <Stat label="Retencao" value={formatPercent(dashboard.retention.retentionRate)} />
        </div>
      </section>

      <section
        id="customers"
        className="business-dashboard-section"
        aria-labelledby="customers-title"
      >
        <SectionHeading
          eyebrow="Clientes"
          title="Clientes e saldos"
          id="customers-title"
          body={`${dashboard.retention.retainedCustomerCount.toLocaleString(
            "pt-MZ"
          )} clientes regressaram mais de uma vez.`}
        />
        <CustomerList dashboard={dashboard} />
      </section>

      <section
        id="transactions"
        className="business-dashboard-section"
        aria-labelledby="transactions-title"
      >
        <SectionHeading
          eyebrow="Transaccoes"
          title="Movimentos recentes"
          id="transactions-title"
          body="Compras confirmadas pelo POS e loyalty engine."
        />
        <TransactionList dashboard={dashboard} />
      </section>

      <section
        id="campaigns"
        className="business-dashboard-section"
        aria-labelledby="campaigns-title"
      >
        <div className="business-dashboard-section-toolbar">
          <SectionHeading
            eyebrow="Campanhas"
            title="Campanhas e ofertas"
            id="campaigns-title"
            body={`${dashboard.settings.activeOffers.toLocaleString("pt-MZ")} ofertas activas.`}
          />
          {dashboard.hasManagerScope ? (
            <Link className="business-dashboard-link-button" href="/negocio/campanhas">
              Gerir campanhas
            </Link>
          ) : null}
        </div>
        <CampaignList dashboard={dashboard} />
      </section>

      <section id="program" className="business-dashboard-section" aria-labelledby="program-title">
        <SectionHeading
          eyebrow="Programa"
          title="Regras de fidelizacao"
          id="program-title"
          body="Configuracao actual usada pelo POS e pelos cartoes digitais."
        />
        <ProgramPanel dashboard={dashboard} />
      </section>

      <section
        id="branches"
        className="business-dashboard-section"
        aria-labelledby="branches-title"
      >
        <SectionHeading
          eyebrow="Filiais"
          title="Performance por filial"
          id="branches-title"
          body="Receita e transaccoes no escopo seleccionado."
        />
        <BranchList dashboard={dashboard} />
      </section>

      <section
        id="employees"
        className="business-dashboard-section"
        aria-labelledby="employees-title"
      >
        <SectionHeading
          eyebrow="Equipa"
          title="Membros activos"
          id="employees-title"
          body="Papeis que participam na gestao e operacao."
        />
        <EmployeeList dashboard={dashboard} />
      </section>

      <section id="reports" className="business-dashboard-section" aria-labelledby="reports-title">
        <SectionHeading
          eyebrow="Relatorios"
          title="Indicadores principais"
          id="reports-title"
          body="Blocos prontos para relatórios operacionais."
        />
        <div className="business-dashboard-report-grid">
          {dashboard.reports.map((report) => (
            <article className="business-dashboard-report" key={report.id}>
              <span>{report.label}</span>
              <strong>{report.value}</strong>
              <p>{report.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="settings"
        className="business-dashboard-section"
        aria-labelledby="settings-title"
      >
        <SectionHeading
          eyebrow="Definicoes"
          title="Estado operacional"
          id="settings-title"
          body="Resumo de estados que afectam o dashboard e o POS."
        />
        <SettingsPanel dashboard={dashboard} />
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  id,
  body
}: {
  eyebrow: string;
  title: string;
  id: string;
  body: string;
}) {
  return (
    <div className="business-dashboard-section-heading">
      <span className="business-dashboard-eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="business-dashboard-stat">
      {label}
      <strong>{value}</strong>
    </span>
  );
}

function CustomerList({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  if (dashboard.customers.length === 0) {
    return <SectionEmpty title="Sem clientes" body="Clientes aparecem depois da adesao." />;
  }

  return (
    <div className="business-dashboard-list">
      {dashboard.customers.slice(0, 8).map((customer) => (
        <article className="business-dashboard-row" key={customer.id}>
          <div>
            <h3>{customer.customerName}</h3>
            <p>{customer.cardNumber}</p>
          </div>
          <dl>
            <div>
              <dt>Pontos</dt>
              <dd>{customer.availablePoints.toLocaleString("pt-MZ")}</dd>
            </div>
            <div>
              <dt>Liability</dt>
              <dd>{formatMznMinor(customer.liabilityMznMinor)}</dd>
            </div>
            <div>
              <dt>Ultima compra</dt>
              <dd>
                {customer.lastTransactionAt ? formatDate(customer.lastTransactionAt) : "Sem compra"}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function TransactionList({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  if (dashboard.transactions.length === 0) {
    return <SectionEmpty title="Sem transaccoes" body="Compras confirmadas aparecem aqui." />;
  }

  return (
    <div className="business-dashboard-list">
      {dashboard.transactions.slice(0, 8).map((transaction) => (
        <article className="business-dashboard-row" key={transaction.id}>
          <div>
            <h3>{transaction.customerName}</h3>
            <p>
              {transaction.branchName} · {formatDate(transaction.occurredAt)}
            </p>
          </div>
          <dl>
            <div>
              <dt>Total</dt>
              <dd>{formatMznMinor(transaction.netAmountMznMinor)}</dd>
            </div>
            <div>
              <dt>Ganhou</dt>
              <dd>{transaction.pointsEarned.toLocaleString("pt-MZ")} pts</dd>
            </div>
            <div>
              <dt>Usou</dt>
              <dd>{transaction.pointsRedeemed.toLocaleString("pt-MZ")} pts</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function CampaignList({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  if (!dashboard.hasManagerScope) {
    return (
      <SectionEmpty
        title="Campanhas restritas"
        body="Campanhas e ofertas sao geridas por admin ou owner do negocio."
      />
    );
  }

  if (dashboard.campaigns.length === 0) {
    return <SectionEmpty title="Sem campanhas" body="Campanhas criadas aparecem aqui." />;
  }

  return (
    <div className="business-dashboard-mini-grid">
      {dashboard.campaigns.slice(0, 6).map((campaign) => (
        <article className="business-dashboard-mini" key={campaign.id}>
          <span>{campaign.status}</span>
          <h3>{campaign.name}</h3>
          <p>{campaign.campaignType}</p>
        </article>
      ))}
    </div>
  );
}

function ProgramPanel({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  if (!dashboard.program) {
    return <SectionEmpty title="Sem programa" body="Configure um programa para activar pontos." />;
  }

  return (
    <dl className="business-dashboard-facts">
      <Fact label="Nome" value={dashboard.program.name} />
      <Fact label="Estado" value={dashboard.program.status} />
      <Fact label="Taxa" value={`${Number(dashboard.program.earnRate) * 100}%`} />
      <Fact label="Valor do ponto" value={formatMznMinor(dashboard.program.pointValueMznMinor)} />
      <Fact label="Max. resgate" value={`${dashboard.program.maximumRedemptionPercent}%`} />
      <Fact
        label="Validade"
        value={
          dashboard.program.pointsExpireAfterDays
            ? `${dashboard.program.pointsExpireAfterDays} dias`
            : "Sem validade"
        }
      />
    </dl>
  );
}

function BranchList({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  if (dashboard.branches.length === 0) {
    return <SectionEmpty title="Sem filiais" body="Filiais activas aparecem aqui." />;
  }

  return (
    <div className="business-dashboard-mini-grid">
      {dashboard.branches.map((branch) => (
        <article className="business-dashboard-mini" key={branch.id}>
          <span>{branch.isPrimary ? "Principal" : branch.city}</span>
          <h3>{branch.name}</h3>
          <p>
            {branch.transactionCount.toLocaleString("pt-MZ")} transaccoes ·{" "}
            {formatMznMinor(branch.revenueMznMinor)}
          </p>
        </article>
      ))}
    </div>
  );
}

function EmployeeList({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  if (dashboard.employees.length === 0) {
    return <SectionEmpty title="Sem equipa" body="Membros activos aparecem aqui." />;
  }

  return (
    <div className="business-dashboard-mini-grid">
      {dashboard.employees.map((employee) => (
        <article className="business-dashboard-mini" key={employee.id}>
          <span>{roleLabel(employee.role)}</span>
          <h3>{employee.displayName}</h3>
          <p>{employee.branchName}</p>
        </article>
      ))}
    </div>
  );
}

function SettingsPanel({ dashboard }: { dashboard: BusinessDashboardViewModel }) {
  return (
    <dl className="business-dashboard-facts">
      <Fact label="Negocio" value={dashboard.settings.businessStatus} />
      <Fact label="Programa" value={dashboard.settings.programStatus} />
      <Fact label="Subscricao" value={dashboard.settings.subscriptionStatus} />
      <Fact
        label="Ofertas activas"
        value={dashboard.settings.activeOffers.toLocaleString("pt-MZ")}
      />
    </dl>
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

function SectionEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="business-dashboard-empty" role="status">
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

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    cashier: "Caixa",
    branch_manager: "Gestor de filial",
    business_admin: "Admin",
    business_owner: "Owner"
  };

  return labels[role] ?? role;
}

function getScopeCopy(
  business: BusinessDashboardBusinessOption | undefined,
  selectedBranchId: string
): string {
  if (!business) {
    return "Sem contexto seleccionado";
  }

  if (!selectedBranchId) {
    return "Todo o negocio";
  }

  const branch = business.branches.find((item) => item.id === selectedBranchId);

  return branch ? `${branch.name} - ${branch.city}` : "Filial seleccionada";
}
