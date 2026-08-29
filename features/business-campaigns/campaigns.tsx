import {
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Copy,
  Gift,
  Megaphone,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  XCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ImageUploadField } from "@/components/forms/image-upload-field";
import { formatPercent } from "@/features/business-dashboard/model";
import { BusinessProfileHeader } from "@/features/business-dashboard/dashboard";
import {
  manageBusinessOfferAction,
  manageCampaignStateAction,
  updateBusinessCampaignAction
} from "@/features/business-operations/actions";
import { BusinessOperationResult } from "@/features/business-operations/views";

import { CampaignCreationForm } from "./campaign-form";
import { getCampaignStatusLabel, getCampaignTypeLabel } from "./model";
import type { BusinessCampaignBusinessOption, BusinessCampaignsState } from "./data";
import type { BusinessCampaign, BusinessOffer } from "./model";

export function BusinessCampaignsView({
  state,
  operationResult
}: {
  state: BusinessCampaignsState;
  operationResult?: string | undefined;
}) {
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
      <BusinessOperationResult result={operationResult} />

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
        <CampaignList businessId={state.selectedBusinessId} campaigns={state.campaigns} />
      </section>

      <section className="business-dashboard-section" aria-labelledby="offer-list-title">
        <SectionHeading
          eyebrow="Benefícios"
          title="Ofertas do negócio"
          id="offer-list-title"
          body="Publique, suspenda e associe benefícios às campanhas sem criar versões paralelas."
        />
        <details className="business-operation-editor business-operation-editor--create">
          <summary>
            <Gift aria-hidden="true" size={18} /> Criar oferta
          </summary>
          <OfferForm
            businessId={state.selectedBusinessId}
            campaigns={state.campaigns}
            operation="create"
          />
        </details>
        <OfferList
          businessId={state.selectedBusinessId}
          campaigns={state.campaigns}
          offers={state.offers}
        />
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

function CampaignList({
  campaigns,
  businessId
}: {
  campaigns: BusinessCampaign[];
  businessId: string;
}) {
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
          <div className="business-operation-actions business-campaign-row-actions">
            {campaign.status === "draft" || campaign.status === "scheduled" ? (
              <CampaignAction
                businessId={businessId}
                campaignId={campaign.id}
                icon={<CheckCircle2 size={15} />}
                label="Ativar"
                operation="activate"
              />
            ) : null}
            {campaign.status === "active" || campaign.status === "scheduled" ? (
              <CampaignAction
                businessId={businessId}
                campaignId={campaign.id}
                icon={<CirclePause size={15} />}
                label="Pausar"
                operation="pause"
              />
            ) : null}
            {campaign.status === "paused" ? (
              <CampaignAction
                businessId={businessId}
                campaignId={campaign.id}
                icon={<CheckCircle2 size={15} />}
                label="Retomar"
                operation="resume"
              />
            ) : null}
            {campaign.status === "active" || campaign.status === "paused" ? (
              <CampaignAction
                businessId={businessId}
                campaignId={campaign.id}
                icon={<CheckCircle2 size={15} />}
                label="Concluir"
                operation="complete"
              />
            ) : null}
            {campaign.status !== "completed" && campaign.status !== "cancelled" ? (
              <CampaignAction
                businessId={businessId}
                campaignId={campaign.id}
                icon={<XCircle size={15} />}
                label="Cancelar"
                operation="cancel"
                tone="danger"
              />
            ) : null}
            <CampaignAction
              businessId={businessId}
              campaignId={campaign.id}
              icon={<Copy size={15} />}
              label="Duplicar"
              operation="duplicate"
            />
          </div>
          {campaign.status !== "completed" && campaign.status !== "cancelled" ? (
            <details className="business-operation-editor business-operation-editor--inline business-campaign-edit">
              <summary>
                <Pencil aria-hidden="true" size={15} /> Editar calendário
              </summary>
              <form action={updateBusinessCampaignAction} className="business-operation-form">
                <input name="businessId" type="hidden" value={businessId} />
                <input name="campaignId" type="hidden" value={campaign.id} />
                <label>
                  <span>Nome</span>
                  <input defaultValue={campaign.name} name="name" required />
                </label>
                <label>
                  <span>Início</span>
                  <input
                    defaultValue={toMaputoInput(campaign.startsAt)}
                    name="startsAt"
                    type="datetime-local"
                  />
                </label>
                <label>
                  <span>Fim</span>
                  <input
                    defaultValue={toMaputoInput(campaign.endsAt)}
                    name="endsAt"
                    type="datetime-local"
                  />
                </label>
                <button className="business-button business-button--primary" type="submit">
                  <Save aria-hidden="true" size={15} /> Guardar
                </button>
              </form>
            </details>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function OfferList({
  offers,
  campaigns,
  businessId
}: {
  offers: BusinessOffer[];
  campaigns: BusinessCampaign[];
  businessId: string;
}) {
  if (offers.length === 0) {
    return <SectionEmpty title="Sem ofertas" body="As ofertas publicadas aparecem aqui." />;
  }

  return (
    <div className="business-operation-grid business-offer-management-grid">
      {offers.map((offer) => (
        <article className="business-operation-card" key={offer.id}>
          {offer.imageUrl ? (
            <div className="business-offer-management-card__media">
              <Image alt="" fill sizes="(max-width: 760px) 100vw, 33vw" src={offer.imageUrl} unoptimized />
            </div>
          ) : null}
          <header>
            <div>
              <span className="business-dashboard-eyebrow">
                {offer.isPublic ? "Pública" : "Privada"} · {offer.isActive ? "Ativa" : "Suspensa"}
              </span>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
            </div>
          </header>
          <dl className="business-operation-facts">
            <Fact label="Ativações" value={offer.claimCount.toLocaleString("pt-MZ")} />
            <Fact label="Início" value={offer.startsAt ? formatDate(offer.startsAt) : "Imediato"} />
            <Fact label="Fim" value={offer.endsAt ? formatDate(offer.endsAt) : "Sem limite"} />
          </dl>
          <details className="business-operation-editor">
            <summary>
              <Pencil aria-hidden="true" size={15} /> Editar oferta
            </summary>
            <OfferForm
              businessId={businessId}
              campaigns={campaigns}
              offer={offer}
              operation="update"
            />
          </details>
          <div className="business-operation-actions">
            <OfferStatusForm businessId={businessId} offer={offer} />
            {offer.claimCount === 0 ? (
              <OfferStatusForm businessId={businessId} offer={offer} operation="delete" />
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function OfferForm({
  businessId,
  campaigns,
  operation,
  offer
}: {
  businessId: string;
  campaigns: BusinessCampaign[];
  operation: "create" | "update";
  offer?: BusinessOffer | undefined;
}) {
  return (
    <form action={manageBusinessOfferAction} className="business-operation-form">
      <input name="businessId" type="hidden" value={businessId} />
      <input name="offerId" type="hidden" value={offer?.id ?? ""} />
      <input name="operation" type="hidden" value={operation} />
      <input name="previousImageUrl" type="hidden" value={offer?.imageUrl ?? ""} />
      <div className="business-operation-form__wide">
        <ImageUploadField
          currentUrl={offer?.imageUrl}
          label="Fotografia promocional"
          name="image"
          removeName="removeImage"
        />
      </div>
      <label>
        <span>Título</span>
        <input defaultValue={offer?.title} name="title" required />
      </label>
      <label>
        <span>Identificador</span>
        <input defaultValue={offer?.slug} name="slug" placeholder="gerado-pelo-titulo" />
      </label>
      <label>
        <span>Campanha</span>
        <select defaultValue={offer?.campaignId ?? ""} name="campaignId">
          <option value="">Sem campanha associada</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Início</span>
        <input
          defaultValue={toMaputoInput(offer?.startsAt)}
          name="startsAt"
          type="datetime-local"
        />
      </label>
      <label>
        <span>Fim</span>
        <input defaultValue={toMaputoInput(offer?.endsAt)} name="endsAt" type="datetime-local" />
      </label>
      <label className="business-operation-form__wide">
        <span>Descrição</span>
        <textarea
          defaultValue={offer?.description}
          minLength={10}
          name="description"
          required
          rows={3}
        />
      </label>
      <label className="business-operation-checkbox">
        <input defaultChecked={offer?.isPublic} name="isPublic" type="checkbox" />
        <span>Mostrar no catálogo público</span>
      </label>
      <button className="business-button business-button--primary" type="submit">
        <Save aria-hidden="true" size={16} /> Guardar oferta
      </button>
    </form>
  );
}

function CampaignAction({
  businessId,
  campaignId,
  operation,
  icon,
  label,
  tone
}: {
  businessId: string;
  campaignId: string;
  operation: string;
  icon: ReactNode;
  label: string;
  tone?: "danger" | undefined;
}) {
  return (
    <form action={manageCampaignStateAction}>
      <input name="businessId" type="hidden" value={businessId} />
      <input name="campaignId" type="hidden" value={campaignId} />
      <input name="operation" type="hidden" value={operation} />
      <button className={`business-button${tone ? " business-button--danger" : ""}`} type="submit">
        {icon}
        {label}
      </button>
    </form>
  );
}

function OfferStatusForm({
  businessId,
  offer,
  operation
}: {
  businessId: string;
  offer: BusinessOffer;
  operation?: "delete" | undefined;
}) {
  const action = operation ?? (offer.isActive ? "suspend" : "activate");
  return (
    <form action={manageBusinessOfferAction}>
      {Object.entries({
        businessId,
        offerId: offer.id,
        operation: action,
        campaignId: offer.campaignId ?? "",
        slug: offer.slug,
        title: offer.title,
        description: offer.description,
        previousImageUrl: offer.imageUrl ?? "",
        startsAt: toMaputoInput(offer.startsAt),
        endsAt: toMaputoInput(offer.endsAt),
        isPublic: offer.isPublic ? "on" : ""
      }).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        className={`business-button${operation ? " business-button--danger" : ""}`}
        type="submit"
      >
        {operation ? (
          <Trash2 size={15} />
        ) : offer.isActive ? (
          <CirclePause size={15} />
        ) : (
          <CheckCircle2 size={15} />
        )}
        {operation ? "Eliminar" : offer.isActive ? "Suspender" : "Ativar"}
      </button>
    </form>
  );
}

function toMaputoInput(value: string | null | undefined): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
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
