import { Clock3, Gift, Link2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { CustomerReferralForms } from "./customer-forms";
import {
  calculatePointsValueMznMinor,
  formatMznMinor,
  getReferralRoleLabel,
  getReferralStatusLabel
} from "./model";
import type { CustomerReferralsState } from "./data";
import type { CustomerReferralProgram, ReferralHistoryItem } from "./model";

export function CustomerReferralsView({ state }: { state: CustomerReferralsState }) {
  if (state.status === "error" || state.status === "empty") {
    return (
      <section
        className={`customer-dashboard-notice${
          state.status === "error" ? " customer-painel-notice--error" : ""
        }`}
        aria-labelledby="customer-referral-notice"
      >
        <h2 id="customer-referral-notice">Indicações indisponíveis</h2>
        <p>{state.message}</p>
        <Link className="referral-back-link" href="/cliente">
          Voltar ao início
        </Link>
      </section>
    );
  }

  return (
    <div className="customer-painel customer-referrals">
      <div className="referral-page-actions">
        <Link className="referral-back-link" href="/cliente">
          Painel
        </Link>
      </div>

      <section className="customer-dashboard-home" aria-labelledby="customer-referrals-title">
        <div>
          <span className="customer-dashboard-eyebrow">Indicações</span>
          <h2 id="customer-referrals-title">Convites e prémios</h2>
          <p>Partilhe códigos dos seus cartões e acompanhe compras qualificadas.</p>
        </div>
        <div className="customer-dashboard-stats" aria-label="Resumo de indicações">
          <span>
            Premiados<strong>{state.summary.rewardedCount.toLocaleString("pt-MZ")}</strong>
          </span>
          <span>
            Pontos<strong>{state.summary.totalRewardPoints.toLocaleString("pt-MZ")}</strong>
          </span>
          <span>
            Equivalente<strong>{formatMznMinor(state.summary.totalRewardValueMznMinor)}</strong>
          </span>
        </div>
      </section>

      <section className="referral-section" aria-labelledby="customer-referral-actions-title">
        <SectionHeading
          eyebrow="Códigos"
          title="Gerir convites"
          id="customer-referral-actions-title"
        />
        <CustomerReferralForms programs={state.programs} />
      </section>

      <section className="referral-section" aria-labelledby="customer-referral-programs-title">
        <SectionHeading
          eyebrow="Regras"
          title="Programas ativos"
          id="customer-referral-programs-title"
        />
        <CustomerProgramList programs={state.programs} />
      </section>

      <section className="referral-section" aria-labelledby="customer-referral-history-title">
        <SectionHeading
          eyebrow="Histórico"
          title="As suas indicações"
          id="customer-referral-history-title"
        />
        <ReferralHistory items={state.referrals} />
      </section>
    </div>
  );
}

function CustomerProgramList({ programs }: { programs: CustomerReferralProgram[] }) {
  if (programs.length === 0) {
    return <EmptyState title="Sem programas ativos" body="Os programas ativos aparecem aqui." />;
  }

  return (
    <div className="referral-program-list">
      {programs.map((program) => (
        <article className="referral-program-row" key={program.id}>
          <div>
            <span className="customer-dashboard-eyebrow">{program.cardNumber}</span>
            <h3>{program.businessName}</h3>
            <p>Compra mínima {formatMznMinor(program.qualifyingPurchaseMinimumMznMinor)}</p>
          </div>
          <dl>
            <ReferralFact
              label="Indicador"
              value={`${program.referrerRewardPoints.toLocaleString("pt-MZ")} pts`}
              detail={formatMznMinor(
                calculatePointsValueMznMinor(
                  program.referrerRewardPoints,
                  program.pointValueMznMinor
                )
              )}
            />
            <ReferralFact
              label="Convidado"
              value={`${program.referredRewardPoints.toLocaleString("pt-MZ")} pts`}
              detail={formatMznMinor(
                calculatePointsValueMznMinor(
                  program.referredRewardPoints,
                  program.pointValueMznMinor
                )
              )}
            />
            <ReferralFact label="Validade" value={`${program.inviteValidDays} dias`} />
            <ReferralFact
              label="Limite"
              value={`${program.rewardLimitCount}/${program.rewardLimitPeriodDays} dias`}
            />
          </dl>
        </article>
      ))}
    </div>
  );
}

function ReferralHistory({ items }: { items: ReferralHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState title="Sem indicações" body="Os convites criados ou aceites aparecem aqui." />
    );
  }

  return (
    <div className="referral-history-list">
      {items.map((item) => {
        const rewardPoints =
          item.role === "referrer" ? item.referrerRewardPoints : item.referredRewardPoints;

        return (
          <article className="referral-history-row" key={item.id}>
            <div className="referral-history-primary">
              <span className={`referral-status referral-status--${item.status}`}>
                {getReferralStatusLabel(item.status)}
              </span>
              <h3>{item.businessName}</h3>
              <p>
                {item.referralCode} · {getReferralRoleLabel(item.role)}
              </p>
            </div>
            <dl>
              <ReferralFact label="Criado" value={formatDate(item.createdAt)} />
              <ReferralFact label="Expira" value={formatDate(item.expiresAt)} />
              <ReferralFact
                label="Prémio"
                value={
                  rewardPoints > 0 ? `${rewardPoints.toLocaleString("pt-MZ")} pts` : "Pendente"
                }
                detail={
                  rewardPoints > 0
                    ? formatMznMinor(
                        calculatePointsValueMznMinor(rewardPoints, item.pointValueMznMinor)
                      )
                    : undefined
                }
              />
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div className="customer-dashboard-section-heading">
      <span className="customer-dashboard-eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function ReferralFact({
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="referral-empty" role="status">
      <Link2 size={22} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
      <span className="referral-empty-icons" aria-hidden="true">
        <Clock3 size={16} />
        <Gift size={16} />
        <ShieldCheck size={16} />
      </span>
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
