import { CalendarDays, Gift, Megaphone, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatMznMinor, formatPercent } from "@/features/business-dashboard/model";

import { CampaignCreationForm } from "./campaign-form";
import { getCampaignStatusLabel, getCampaignTypeLabel } from "./model";
import type { BusinessCampaignBusinessOption, BusinessCampaignsState } from "./data";
import type { BusinessCampaign } from "./model";

export function BusinessCampaignsView({ state }: { state: BusinessCampaignsState }) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`business-dashboard-notice${
          state.status === "error" ? " business-dashboard-notice--error" : ""
        }`}
        aria-labelledby="business-campaigns-notice"
      >
        <h2 id="business-campaigns-notice">Campanhas indisponiveis</h2>
        <p>{state.message}</p>
        <Link className="business-campaign-link" href="/negocio">
          Voltar ao dashboard
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

      <section className="business-dashboard-hero" aria-labelledby="business-campaigns-title">
        <div>
          <span className="business-dashboard-eyebrow">Campanhas</span>
          <h2 id="business-campaigns-title">{selectedBusiness?.name ?? "Negocio VUYELA"}</h2>
          <p>Campanhas privadas do negocio com regras, agenda, segmentos e analitica.</p>
        </div>
        <div className="business-dashboard-stat-grid">
          <CampaignStat
            icon={<Megaphone size={18} />}
            label="Activas"
            value={state.analytics.activeCampaigns.toLocaleString("pt-MZ")}
          />
          <CampaignStat
            icon={<CalendarDays size={18} />}
            label="Agendadas"
            value={state.analytics.scheduledCampaigns.toLocaleString("pt-MZ")}
          />
          <CampaignStat
            icon={<Users size={18} />}
            label="Audiencia"
            value={state.analytics.totalAudienceCount.toLocaleString("pt-MZ")}
          />
          <CampaignStat
            icon={<ShieldCheck size={18} />}
            label="Consentimento"
            value={formatPercent(state.analytics.consentCoverageRate)}
          />
        </div>
      </section>

      <section className="business-campaign-layout" aria-label="Gestao de campanhas">
        <div className="business-dashboard-section">
          <SectionHeading
            eyebrow="Criacao"
            title="Nova campanha"
            body="Crie uma campanha baseada em regras e audiencia calculada no servidor."
          />
          <CampaignCreationForm
            businesses={state.businesses}
            selectedBusinessId={state.selectedBusinessId}
          />
        </div>

        <aside className="business-dashboard-section">
          <SectionHeading
            eyebrow="Analitica"
            title="Resumo"
            body="Indicadores agregados das campanhas deste negocio."
          />
          <dl className="business-dashboard-facts business-campaign-facts">
            <Fact label="Total" value={state.analytics.totalCampaigns.toLocaleString("pt-MZ")} />
            <Fact
              label="Rascunhos"
              value={state.analytics.draftCampaigns.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Concluidas"
              value={state.analytics.completedCampaigns.toLocaleString("pt-MZ")}
            />
            <Fact
              label="Media audiencia"
              value={state.analytics.averageAudienceCount.toLocaleString("pt-MZ")}
            />
          </dl>
        </aside>
      </section>

      <section className="business-dashboard-section" aria-labelledby="campaign-list-title">
        <SectionHeading
          eyebrow="Historico"
          title="Campanhas do negocio"
          id="campaign-list-title"
          body="Lista operacional com calendario, tipo e audiencia elegivel."
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
        <p>Admins e owners gerem campanhas por negocio.</p>
      </div>
      <div className="business-dashboard-switcher__actions">
        <Link href="/negocio">Dashboard</Link>
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
              <dt>Audiencia</dt>
              <dd>{campaign.audienceCount.toLocaleString("pt-MZ")}</dd>
            </div>
            <div>
              <dt>Consentidos</dt>
              <dd>{campaign.consentedAudienceCount.toLocaleString("pt-MZ")}</dd>
            </div>
            <div>
              <dt>Min. gasto</dt>
              <dd>{formatAudienceSpend(campaign)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function CampaignStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="business-dashboard-stat business-campaign-stat">
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
    return "Sem calendario";
  }

  const start = campaign.startsAt ? formatDate(campaign.startsAt) : "Inicio aberto";
  const end = campaign.endsAt ? formatDate(campaign.endsAt) : "Fim aberto";

  return `${start} a ${end}`;
}

function formatAudienceSpend(campaign: BusinessCampaign): string {
  return campaign.audience.minTotalSpentMznMinor
    ? formatMznMinor(campaign.audience.minTotalSpentMznMinor)
    : "Sem minimo";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
