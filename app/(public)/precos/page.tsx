import type { Metadata } from "next";
import Link from "next/link";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";
import { PricingSelector } from "@/features/marketing/pricing-selector";
import { getPublicSubscriptionPlans } from "@/features/subscriptions/public-data";
import { formatEntitlementLimit, getAnalyticsLabel } from "@/features/subscriptions/model";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Preços",
  description: "Compare os planos VUYELA para negócios de diferentes dimensões.",
  alternates: { canonical: "/precos" }
};

export default async function PricingPage() {
  const plans = await getPublicSubscriptionPlans();

  return (
    <PublicSiteShell active="pricing">
      <section className="marketing-page-hero marketing-pattern" aria-labelledby="prices-title">
        <div className="marketing-container marketing-heading marketing-heading--center marketing-heading--inverse">
          <span>Preçário inteligente</span>
          <h1 id="prices-title">Planos para começar pequeno e crescer com controlo.</h1>
          <p>
            Escolha o plano ideal para a escala atual do seu negócio. Pode subir de nível à medida
            que o número de clientes fidelizados aumenta na rede VUYELA.
          </p>
        </div>
      </section>

      <section className="marketing-section marketing-section--soft marketing-pricing-plans">
        <div className="marketing-container">
          <PricingSelector plans={plans} />
        </div>
      </section>

      {plans.length > 0 ? (
        <section
          className="marketing-section marketing-section--light"
          aria-labelledby="comparison-title"
        >
          <div className="marketing-container">
            <div className="marketing-ornament" aria-hidden="true" />
            <div className="marketing-heading">
              <h2 id="comparison-title">Comparação rápida de recursos</h2>
            </div>
            <div className="pricing-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Recurso</th>
                    {plans.map((plan) => (
                      <th scope="col" key={plan.id}>
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Filiais</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>{formatEntitlementLimit(plan.branchLimit)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Utilizadores</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>{formatEntitlementLimit(plan.staffLimit)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Campanhas</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>{formatEntitlementLimit(plan.campaignLimit)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Analítica</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>{getAnalyticsLabel(plan.analyticsLevel)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section
        className="marketing-section marketing-section--plain"
        aria-labelledby="pricing-faq-title"
      >
        <div className="marketing-container marketing-pricing-faq">
          <div className="marketing-heading">
            <span>FAQ de preços</span>
            <h2 id="pricing-faq-title">Dúvidas sobre os nossos planos</h2>
          </div>
          <details open>
            <summary>Posso mudar de plano?</summary>
            <p>
              Sim. A atribuição do plano respeita a utilização atual do negócio e os limites
              configurados.
            </p>
          </details>
          <details>
            <summary>Como é feita a cobrança?</summary>
            <p>
              A recolha automática de pagamentos ainda não está ativa. A equipa VUYELA confirma as
              condições aplicáveis durante a configuração.
            </p>
          </details>
          <details>
            <summary>Existe um período de teste?</summary>
            <p>
              O período de teste é definido no catálogo de planos e apresentado durante a adesão.
            </p>
          </details>
        </div>
      </section>

      <section className="marketing-cta marketing-pattern">
        <div className="marketing-container">
          <h2>Precisa de ajuda para escolher?</h2>
          <p>A nossa equipa desenha planos à medida da realidade moçambicana.</p>
          <Link
            className="marketing-button marketing-button--teal"
            href="https://wa.me/258841234567"
          >
            Conversar no WhatsApp
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
