import { AlertTriangle, CheckCircle2, Gift, Hourglass, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ReferralProgramForm } from "./business-form";
import { calculatePointsValueMznMinor, formatMznMinor, getReferralStatusLabel } from "./model";
import type { BusinessReferralsReadyState, BusinessReferralsState } from "./data";

export function BusinessReferralsView({ state }: { state: BusinessReferralsState }) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`business-dashboard-notice${
          state.status === "error" ? " business-painel-notice--error" : ""
        }`}
        aria-labelledby="business-referral-notice"
      >
        <h2 id="business-referral-notice">Indicações indisponíveis</h2>
        <p>{state.message}</p>
        <Link className="business-campaign-link" href="/negocio">
          Voltar ao painel
        </Link>
      </section>
    );
  }

  return (
    <div className="business-painel business-referrals">
      <BusinessReferralSwitcher state={state} />

      <section className="business-dashboard-hero" aria-labelledby="business-referrals-title">
        <div>
          <span className="business-dashboard-eyebrow">Indicações</span>
          <h2 id="business-referrals-title">{state.selectedBusinessName}</h2>
          <p>Regras ativas, convites, premios emitidos e controlos de elegibilidade.</p>
        </div>
        <div className="business-dashboard-stat-grid">
          <ReferralStat
            icon={<CheckCircle2 size={18} />}
            label="Premiadas"
            value={state.summary.rewardedCount.toLocaleString("pt-MZ")}
          />
          <ReferralStat
            icon={<Gift size={18} />}
            label="Pontos emitidos"
            value={state.summary.totalIssuedPoints.toLocaleString("pt-MZ")}
          />
          <ReferralStat
            icon={<Users size={18} />}
            label="Equivalente"
            value={formatMznMinor(state.summary.totalIssuedValueMznMinor)}
          />
          <ReferralStat
            icon={<AlertTriangle size={18} />}
            label="Alertas"
            value={state.summary.fraudEventCount.toLocaleString("pt-MZ")}
          />
        </div>
      </section>

      <section className="business-referral-layout" aria-label="Programa de indicações">
        <div className="business-dashboard-section">
          <SectionHeading eyebrow="Configuração" title="Regras do programa" />
          <ReferralProgramForm businessId={state.selectedBusinessId} rules={state.rules} />
        </div>
        <aside className="business-dashboard-section">
          <SectionHeading eyebrow="Economia" title="Premios actuais" />
          <dl className="business-painel-facts referral-economics">
            <Fact
              label="Compra minima"
              value={formatMznMinor(state.rules.qualifyingPurchaseMinimumMznMinor)}
            />
            <Fact
              label="Indicador"
              value={`${state.rules.referrerRewardPoints.toLocaleString("pt-MZ")} pts`}
              detail={formatMznMinor(
                calculatePointsValueMznMinor(
                  state.rules.referrerRewardPoints,
                  state.pointValueMznMinor
                )
              )}
            />
            <Fact
              label="Convidado"
              value={`${state.rules.referredRewardPoints.toLocaleString("pt-MZ")} pts`}
              detail={formatMznMinor(
                calculatePointsValueMznMinor(
                  state.rules.referredRewardPoints,
                  state.pointValueMznMinor
                )
              )}
            />
            <Fact
              label="Limite"
              value={`${state.rules.rewardLimitCount}/${state.rules.rewardLimitPeriodDays} dias`}
            />
            <Fact label="Estado" value={state.rules.isActive ? "Ativo" : "Inativo"} />
          </dl>
        </aside>
      </section>

      <section
        className="business-dashboard-section"
        aria-labelledby="business-referral-list-title"
      >
        <SectionHeading
          eyebrow="Operação"
          title="Convites recentes"
          id="business-referral-list-title"
        />
        <BusinessReferralList state={state} />
      </section>
    </div>
  );
}

function BusinessReferralSwitcher({ state }: { state: BusinessReferralsReadyState }) {
  return (
    <section className="business-dashboard-switcher" aria-label="Contexto de indicações">
      <div>
        <span className="business-dashboard-eyebrow">Contexto</span>
        <h2>Indicações</h2>
        <p>Programa por negócio.</p>
      </div>
      <div className="business-dashboard-switcher__actions">
        <Link href="/negocio">Painel</Link>
        {state.businesses.map((business) => (
          <Link
            className={business.id === state.selectedBusinessId ? "is-active" : ""}
            href={`/negocio/indicacoes?businessId=${encodeURIComponent(business.id)}`}
            key={business.id}
          >
            {business.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function BusinessReferralList({ state }: { state: BusinessReferralsReadyState }) {
  if (state.referrals.length === 0) {
    return (
      <div className="business-dashboard-empty" role="status">
        <Hourglass size={22} aria-hidden="true" />
        <h3>Sem convites</h3>
        <p>Os convites criados pelos clientes aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div className="business-dashboard-list">
      {state.referrals.map((referral) => (
        <article className="business-painel-row business-referral-row" key={referral.id}>
          <div>
            <span className={`referral-status referral-status--${referral.status}`}>
              {getReferralStatusLabel(referral.status)}
            </span>
            <h3>{referral.referralCode}</h3>
            <p>
              {state.cardNumberById[referral.referrerCardId] ?? "Cartão indicador"}
              {referral.referredCardId
                ? ` · ${state.cardNumberById[referral.referredCardId] ?? "Cartão indicado"}`
                : ""}
            </p>
          </div>
          <dl>
            <div>
              <dt>Criado</dt>
              <dd>{formatDate(referral.createdAt)}</dd>
            </div>
            <div>
              <dt>Indicador</dt>
              <dd>{referral.referrerRewardPoints.toLocaleString("pt-MZ")} pts</dd>
            </div>
            <div>
              <dt>Convidado</dt>
              <dd>{referral.referredRewardPoints.toLocaleString("pt-MZ")} pts</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function ReferralStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="business-painel-stat business-referral-stat">
      {icon}
      {label}
      <strong>{value}</strong>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  id
}: {
  eyebrow: string;
  title: string;
  id?: string | undefined;
}) {
  return (
    <div className="business-dashboard-section-heading">
      <span className="business-dashboard-eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function Fact({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail?: string | undefined;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {detail ? <small>{detail}</small> : null}
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
