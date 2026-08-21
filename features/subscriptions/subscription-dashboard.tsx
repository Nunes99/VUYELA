import { BarChart3, Check, CreditCard, Megaphone, Store, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatMznMinor } from "@/features/business-dashboard/model";

import type { BusinessSubscriptionState, SubscriptionBusinessOption } from "./data";
import { formatEntitlementLimit, getAnalyticsLabel, getFeatureLabel, getUsageRatio } from "./model";
import type { PlanEntitlements, SubscriptionPlan } from "./model";

export function BusinessSubscriptionView({ state }: { state: BusinessSubscriptionState }) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`business-dashboard-notice${
          state.status === "error" ? " business-painel-notice--error" : ""
        }`}
        aria-labelledby="business-subscription-notice"
      >
        <h2 id="business-subscription-notice">Subscrição indisponível</h2>
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
  const { subscription, entitlements, usage, availablePlans } = state.overview;

  return (
    <div className="business-subscription">
      <SubscriptionContextSwitcher
        businesses={state.businesses}
        selectedBusinessId={state.selectedBusinessId}
      />

      <section className="business-subscription-hero" aria-labelledby="subscription-title">
        <div>
          <span className="business-dashboard-eyebrow">Subscrição</span>
          <h2 id="subscription-title">{subscription?.plan.name ?? "Sem plano ativo"}</h2>
          <p>{selectedBusiness?.name ?? "Negócio VUYELA"}</p>
        </div>
        <div className="business-subscription-hero__summary">
          <span
            className={`admin-status-badge admin-status-badge--${getSubscriptionStatusTone(
              subscription?.status
            )}`}
          >
            {getSubscriptionStatusLabel(subscription?.status)}
          </span>
          <strong>
            {subscription?.plan.monthlyPriceMznMinor === null
              ? "Sob consulta"
              : formatMznMinor(subscription?.plan.monthlyPriceMznMinor ?? 0)}
          </strong>
          <span>por mes</span>
        </div>
      </section>

      {entitlements ? (
        <section className="business-subscription-section" aria-labelledby="usage-title">
          <div className="business-dashboard-section-heading">
            <span className="business-dashboard-eyebrow">Consumo</span>
            <h2 id="usage-title">Capacidade atual</h2>
          </div>
          <div className="business-subscription-usage-grid">
            <UsageMeter
              icon={<Store aria-hidden="true" size={20} />}
              label="Filiais"
              limit={entitlements.branchLimit}
              used={usage.branches}
            />
            <UsageMeter
              icon={<Users aria-hidden="true" size={20} />}
              label="Equipa"
              limit={entitlements.staffLimit}
              used={usage.staff}
            />
            <UsageMeter
              icon={<Megaphone aria-hidden="true" size={20} />}
              label="Campanhas abertas"
              limit={entitlements.campaignLimit}
              used={usage.campaigns}
            />
            <article className="business-subscription-usage">
              <div className="business-subscription-usage__heading">
                <BarChart3 aria-hidden="true" size={20} />
                <span>Analítica</span>
              </div>
              <strong>{getAnalyticsLabel(entitlements.analyticsLevel)}</strong>
            </article>
          </div>
          <FeatureList entitlements={entitlements} />
        </section>
      ) : null}

      <section className="business-subscription-section" aria-labelledby="plans-title">
        <div className="business-dashboard-section-heading">
          <span className="business-dashboard-eyebrow">Planos</span>
          <h2 id="plans-title">Catálogo disponível</h2>
        </div>
        <PlanGrid currentPlanId={subscription?.plan.id ?? null} plans={availablePlans} />
      </section>
    </div>
  );
}

function SubscriptionContextSwitcher({
  businesses,
  selectedBusinessId
}: {
  businesses: SubscriptionBusinessOption[];
  selectedBusinessId: string;
}) {
  return (
    <section className="business-dashboard-switcher" aria-label="Contexto da subscrição">
      <div>
        <span className="business-dashboard-eyebrow">Contexto</span>
        <h2>Plano do negócio</h2>
      </div>
      <div className="business-dashboard-switcher__actions">
        <Link href="/negocio">Painel</Link>
        {businesses.map((business) => (
          <Link
            className={business.id === selectedBusinessId ? "is-active" : ""}
            href={`/negocio/subscricao?businessId=${encodeURIComponent(business.id)}`}
            key={business.id}
          >
            {business.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function UsageMeter({
  icon,
  label,
  used,
  limit
}: {
  icon: ReactNode;
  label: string;
  used: number;
  limit: number | null;
}) {
  const ratio = getUsageRatio(used, limit);

  return (
    <article className="business-subscription-usage">
      <div className="business-subscription-usage__heading">
        {icon}
        <span>{label}</span>
      </div>
      <strong>
        {used.toLocaleString("pt-MZ")} / {formatEntitlementLimit(limit)}
      </strong>
      {limit === null ? null : (
        <div
          aria-label={`${label}: ${Math.round(ratio * 100)}% utilizado`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(ratio * 100)}
          className="business-subscription-meter"
          role="progressbar"
        >
          <span style={{ width: `${ratio * 100}%` }} />
        </div>
      )}
    </article>
  );
}

function FeatureList({ entitlements }: { entitlements: PlanEntitlements }) {
  if (entitlements.featureFlags.length === 0) {
    return null;
  }

  return (
    <div className="business-subscription-features" aria-label="Funcionalidades do plano">
      {entitlements.featureFlags.map((feature) => (
        <span key={feature}>
          <Check aria-hidden="true" size={16} />
          {getFeatureLabel(feature)}
        </span>
      ))}
    </div>
  );
}

function PlanGrid({
  plans,
  currentPlanId
}: {
  plans: SubscriptionPlan[];
  currentPlanId: string | null;
}) {
  if (plans.length === 0) {
    return <p className="business-dashboard-empty">Nenhum plano público disponível.</p>;
  }

  return (
    <div className="business-subscription-plans">
      {plans.map((plan) => (
        <article
          className={`business-subscription-plan${
            plan.id === currentPlanId ? " business-subscription-plan--current" : ""
          }`}
          key={plan.id}
        >
          <div className="business-subscription-plan__heading">
            <div>
              <span>{plan.id === currentPlanId ? "Plano atual" : "Plano"}</span>
              <h3>{plan.name}</h3>
            </div>
            <CreditCard aria-hidden="true" size={20} />
          </div>
          <strong>
            {plan.monthlyPriceMznMinor === null
              ? "Sob consulta"
              : formatMznMinor(plan.monthlyPriceMznMinor)}
          </strong>
          <p>{plan.description}</p>
          <dl>
            <PlanFact label="Filiais" value={formatEntitlementLimit(plan.branchLimit)} />
            <PlanFact label="Equipa" value={formatEntitlementLimit(plan.staffLimit)} />
            <PlanFact label="Campanhas" value={formatEntitlementLimit(plan.campaignLimit)} />
            <PlanFact label="Analítica" value={getAnalyticsLabel(plan.analyticsLevel)} />
          </dl>
        </article>
      ))}
    </div>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function getSubscriptionStatusLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    trialing: "Em teste",
    active: "Ativa",
    past_due: "Pagamento pendente",
    paused: "Pausada"
  };

  return status ? (labels[status] ?? status) : "Sem subscrição";
}

function getSubscriptionStatusTone(status: string | undefined): string {
  if (status === "active") {
    return "active";
  }

  if (status === "trialing") {
    return "pending";
  }

  if (status === "past_due") {
    return "danger";
  }

  return "neutral";
}
