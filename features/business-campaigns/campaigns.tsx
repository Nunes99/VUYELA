import { CalendarDays, Gift, Megaphone, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatPercent } from "@/features/business-dashboard/model";
import { BusinessProfileHeader } from "@/features/business-dashboard/dashboard";

import { CampaignCreationForm } from "./campaign-form";
import { getCampaignStatusLabel, getCampaignTypeLabel } from "./model";
import type { BusinessCampaignBusinessOption, BusinessCampaignsState } from "./data";
import type { BusinessCampaign } from "./model";

export function BusinessCampaignsView({ state }: { state: BusinessCampaignsState }) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`business-dashboard-notice${
          state.status === "error" ? " business-painel-notice--error" : ""
        }`}
        aria-labelledby="business-campaigns-notice"
      >
        <h2 id="business-campaigns-notice">Campanhas indisponíveis</h2>
        <p>{state.message}</p>
        <Link className="business-campaign-link" href="/negocio">
          Voltar ao painel
        </Link>
      </section>
    );
  }

  const selectedBusiness = state.businesses.find(
    (business) => business.id === state.selectedBusinessId
  );

  return (
    <div className="business-campaigns">
      <CampaignContextSwitcher
        businesses={state.businesses}
        selectedBusinessId={state.selectedBusinessId}
      />
      {selectedBusiness ? (
        <BusinessProfileHeader
          activeTab="campanhas"
          business={{ ...selectedBusiness, status: "active" }}
          scopeLabel="Campanhas e comunicação com clientes"
        />
      ) : null}

      <section className="business-dashboard-hero" aria-labelledby="business-campaigns-title">
        <div>
          <span className="business-dashboard-eyebrow">Campanhas</span>
          <h2 id="business-campaigns-title">{selectedBusiness?.name ?? "Negócio VUYELA"}</h2>
          <p>Campanhas privadas do negócio com regras, agenda, segmentos e analítica.</p>
        </div>
        <div className="business-dashboard-stat-grid">
          <CampaignStat
            icon={<Megaphone size={18} />}
            label="Ativas"
            value={state.analytics.activeCampaigns.toLocaleString("pt-MZ")}
          />
          <CampaignStat
            icon={<CalendarDays size={18} />}
            label="Agendadas"
            value={state.analytics.scheduledCampaigns.toLocaleString("pt-MZ")}
          />
          <CampaignStat
            icon={<Users size={18} />}
            label="Audiência"
            value={state.analytics.totalAudienceCount.toLocaleString("pt-MZ")}
          />
          <CampaignStat
            icon={<ShieldCheck size={18} />}
            label="Consentimento"
            value={formatPercent(state.analytics.consentCoverageRate)}
          />
        </div>
      </section>

      <section className="business-campaign-layout" aria-label="Gestão de campanhas">
        <div className="business-dashboard-section">
          <SectionHeading
            eyebrow="Criação"
            title="Nova campanha"
            body="Crie uma campanha baseada em regras e audiência calculada no servidor."
          />
          {state.canCreateCampaign ? (
            <CampaignCreationForm
              businesses={state.businesses}
              selectedBusinessId={state.selectedBusinessId}
              emailDeliveryConfigured={state.emailDeliveryConfigured}
            />
          ) : (
            <div className="business-dashboard-empty" role="status">
              <Megaphone aria-hidden="true" size={22} />
              <h3>Limite de campanhas atingido</h3>
              <p>
                {state.campaignUsage.toLocaleString("pt-MZ")} de{" "}
                {state.campaignLimit?.toLocaleString("pt-MZ")} campanhas abertas.
              </p>
              <Link className="business-campaign-link" href="/negocio/subscricao">
                Ver subscrição
              </Link>
            </div>
          )}
        </div>

        <aside className="business-dashboard-section">
          <SectionHeading
            eyebrow="Analítica"
            title="Resumo"
            body="Indicadores agregados das campanhas deste negócio."
          />
          <dl className="business-painel-facts business-campaign-facts">
            <Fact label="Total" value={state.analytics.totalCampaigns.toLocaleString("pt-MZ")} />
            <Fact
              label="Rascunhos"
              value={state.analytics.draftCampaigns.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Concluídas"
              value={state.analytics.completedCampaigns.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Média da audiência"
              value={state.analytics.averageAudienceCount.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Notificações"
              value={state.analytics.notificationCount.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Entregues"
              value={state.analytics.deliveredNotificationCount.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Falhas"
              value={state.analytics.failedNotificationCount.toLocaleString("pt-MZ")}
            />
          </dl>
        </aside>
      </section>

      <section className="business-dashboard-section" aria-labelledby="campaign-list-title">
        <SectionHeading
          eyebrow="Histórico"
          title="Campanhas do negócio"
          id="campaign-list-title"
          body="Lista operacional com calendário, tipo e audiência elegível."
        />
        <CampaignList campaigns={state.campaigns} />
      </section>
    </div>
  );
}

function CampaignContextSwitcher({
  businesses,
  selectedBusinessId
}: {
  businesses: BusinessCampaignBusinessOption[];
  selectedBusinessId: string;
}) {
  return (
    <section className="business-dashboard-switcher" aria-label="Contexto de campanhas">
      <div>
        <span className="business-dashboard-eyebrow">Contexto</span>
        <h2>Campanhas</h2>
        <p>Administradores e proprietários gerem campanhas por negócio.</p>
      </div>
      <div className="business-dashboard-switcher__actions">
        <Link href="/negocio">Painel</Link>
        {businesses.map((business) => (
          <Link
            className={business.id === selectedBusinessId ? "is-active" : ""}
            href={`/negocio/campanhas?businessId=${encodeURIComponent(business.id)}`}
            key={business.id}
          >
            {business.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function CampaignList({ campaigns }: { campaigns: BusinessCampaign[] }) {
  if (campaigns.length === 0) {
    return <SectionEmpty title="Sem campanhas" body="Campanhas criadas aparecem aqui." />;
  }

  return (
    <div className="business-dashboard-list">
      {campaigns.map((campaign) => (
        <article className="business-dashboard-row" key={campaign.id}>
          <div>
            <span className="business-dashboard-eyebrow">
              {getCampaignStatusLabel(campaign.status)}
            </span>
            <h3>{campaign.name}</h3>
            <p>
              {getCampaignTypeLabel(campaign.campaignType)} · {formatCampaignWindow(campaign)}
            </p>
          </div>
          <dl>
            <div>
              <dt>Audiência</dt>
              <dd>{campaign.audienceCount.toLocaleString("pt-MZ")}</dd>
            </div>
            <div>
              <dt>Na fila</dt>
              <dd>{campaign.queuedNotificationCount.toLocaleString("pt-MZ")}</dd>
            </div>
            <div>
              <dt>Entregues</dt>
              <dd>{campaign.deliveredNotificationCount.toLocaleString("pt-MZ")}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function CampaignStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="business-painel-stat business-campaign-stat">
      {icon}
      {label}
      <strong>{value}</strong>
    </div>
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
  id?: string | undefined;
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
      <Gift size={22} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function formatCampaignWindow(campaign: BusinessCampaign): string {
  if (!campaign.startsAt && !campaign.endsAt) {
    return "Sem calendário";
  }

  const start = campaign.startsAt ? formatDate(campaign.startsAt) : "Início aberto";
  const end = campaign.endsAt ? formatDate(campaign.endsAt) : "Fim aberto";

  return `${start} a ${end}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
