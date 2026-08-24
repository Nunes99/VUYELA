"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Check } from "lucide-react";

import {
  formatEntitlementLimit,
  getAnalyticsLabel,
  type SubscriptionPlan
} from "@/features/subscriptions/model";

interface PricingSelectorProps {
  plans: SubscriptionPlan[];
}

function formatMonthlyPrice(valueMznMinor: number): string {
  return Math.round(valueMznMinor / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function PricingSelector({ plans }: PricingSelectorProps) {
  const [annual, setAnnual] = useState(false);

  if (plans.length === 0) {
    return (
      <div className="marketing-empty-state">
        <strong>Os planos serão apresentados assim que o catálogo estiver disponível.</strong>
        <p>Fale com a equipa VUYELA para preparar o programa adequado ao seu negócio.</p>
        <Link className="marketing-button marketing-button--dark" href="/onboarding/negocio">
          Registar o meu negócio
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="pricing-period" aria-label="Período de apresentação dos preços">
        <button aria-pressed={!annual} onClick={() => setAnnual(false)} type="button">
          Mensal
        </button>
        <button aria-pressed={annual} onClick={() => setAnnual(true)} type="button">
          Anual <span>Poupe 15%</span>
        </button>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const recommended = plan.slug === "growth" || plan.slug === "crescimento";
          const monthlyPrice =
            plan.monthlyPriceMznMinor === null
              ? null
              : annual
                ? Math.round(plan.monthlyPriceMznMinor * 0.85)
                : plan.monthlyPriceMznMinor;

          return (
            <article
              className={recommended ? "pricing-card pricing-card--featured" : "pricing-card"}
              key={plan.id}
            >
              {recommended ? <span className="pricing-card__badge">Recomendado</span> : null}
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <strong className="pricing-card__price">
                {monthlyPrice === null ? "Sob consulta" : `${formatMonthlyPrice(monthlyPrice)} MZN`}
              </strong>
              <small>{monthlyPrice === null ? "Plano personalizado" : "/mês"}</small>
              <ul>
                <li>
                  <Check aria-hidden="true" size={15} />
                  {formatEntitlementLimit(plan.branchLimit)} filiais
                </li>
                <li>
                  <Check aria-hidden="true" size={15} />
                  {formatEntitlementLimit(plan.staffLimit)} utilizadores
                </li>
                <li>
                  <Check aria-hidden="true" size={15} />
                  {formatEntitlementLimit(plan.campaignLimit)} campanhas
                </li>
                <li>
                  <Check aria-hidden="true" size={15} />
                  Analítica {getAnalyticsLabel(plan.analyticsLevel).toLowerCase()}
                </li>
              </ul>
              <Link
                className={
                  recommended
                    ? "marketing-button marketing-button--dark"
                    : "marketing-button marketing-button--soft"
                }
                href="/onboarding/negocio"
              >
                {plan.monthlyPriceMznMinor === 0 ? "Começar grátis" : "Começar agora"}
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
