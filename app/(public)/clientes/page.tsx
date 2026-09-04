import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";
import { getPublicMarketplaceSnapshot } from "@/features/public-marketplace/data";
import { OfferCard } from "@/features/public-marketplace/marketplace";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Para clientes",
  description: "Todos os cartões, YELAS, ofertas e movimentos VUYELA numa área digital simples.",
  alternates: { canonical: "/clientes" }
};

export default async function CustomersPage() {
  const marketplace = await getPublicMarketplaceSnapshot();
  const offers = marketplace.snapshot.offers.slice(0, 3);

  return (
    <PublicSiteShell active="customers">
      <section className="marketing-page-hero marketing-pattern" aria-labelledby="customers-title">
        <div className="marketing-container marketing-heading marketing-heading--center marketing-heading--inverse">
          <span>Aplicação de fidelização</span>
          <h1 id="customers-title">O seu cartão digital de fidelização</h1>
          <p>
            Todos os seus negócios favoritos de Moçambique reunidos numa única aplicação leve e
            fácil de utilizar no dia a dia.
          </p>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--light"
        aria-labelledby="rewards-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading">
            <span>Vantagens no seu bolso</span>
            <h2 id="rewards-title">Consiga recompensas reais em cada compra</h2>
          </div>
          <article className="marketing-alert-banner">
            <div>
              <h3>Alertas de ofertas</h3>
              <p>Saiba no momento quando as suas lojas favoritas lançam campanhas.</p>
              <Link className="marketing-button marketing-button--teal" href="/cadastrar">
                <Bell size={17} /> Ativar alertas
              </Link>
            </div>
            <div className="marketing-alert-banner__signal" aria-hidden="true">
              <Bell size={26} />
              <span>Nova oferta</span>
            </div>
          </article>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--navy marketing-pattern"
        aria-labelledby="offers-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--inverse">
            <span>Campanhas ativas</span>
            <h2 id="offers-title">Poupe hoje mesmo nestes parceiros</h2>
          </div>
          {offers.length > 0 ? (
            <div className="marketplace-offer-grid marketing-public-offers__grid">
              {offers.map((offer) => (
                <OfferCard offer={offer} key={offer.id} />
              ))}
            </div>
          ) : (
            <div className="marketing-empty-state marketing-empty-state--dark">
              <strong>Ainda não existem ofertas públicas ativas.</strong>
              <p>Consulte o diretório para conhecer os negócios disponíveis.</p>
              <Link className="marketing-button marketing-button--teal" href="/estabelecimentos">
                Ver estabelecimentos
              </Link>
            </div>
          )}
          <div className="marketing-centered-action marketing-centered-action--inverse">
            <Link className="marketing-text-link" href="/ofertas">
              Explorar todas as ofertas <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
