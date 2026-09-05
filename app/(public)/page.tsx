import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BadgePercent,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gift,
  MapPin,
  Megaphone,
  QrCode,
  Search,
  Smartphone,
  Store,
  UsersRound
} from "lucide-react";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";
import { BusinessDashboardDemo } from "@/features/marketing/business-dashboard-demo";
import { getPublicMarketplaceSnapshot } from "@/features/public-marketplace/data";
import { OfferCard } from "@/features/public-marketplace/marketplace";
import type { MarketplaceBusiness } from "@/features/public-marketplace/model";
import { getPublicSubscriptionPlans } from "@/features/subscriptions/public-data";
import { getSiteUrl } from "@/lib/env";
import { serializeJsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "A rede de fidelização de Moçambique",
  description:
    "Descubra negócios, acumule YELAS e transforme cada compra numa razão para voltar em todo Moçambique.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "VUYELA - A cidade recompensa quem escolhe voltar",
    description: "Clientes que voltam. Negócios que crescem. Uma rede para todo Moçambique.",
    url: siteUrl,
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VUYELA by LEMOTE",
  url: siteUrl,
  slogan: "Volta. Ganha. Cresce.",
  description: "Rede moçambicana de fidelização digital para clientes e negócios."
};

const heroProof = [
  { icon: Smartphone, number: "01", title: "100% digital", body: "Sem papel. Sempre consigo." },
  {
    icon: BadgeDollarSign,
    number: "02",
    title: "Valor transparente",
    body: "YELAS e MZN sempre visíveis."
  },
  {
    icon: MapPin,
    number: "03",
    title: "Feito em Moçambique",
    body: "Pensado para todo o país."
  }
] as const;

const customerJourney = [
  { icon: Search, number: "01", title: "Descubra", body: "Negócios e ofertas relevantes." },
  { icon: QrCode, number: "02", title: "Identifique-se", body: "QR Code ou número do cartão." },
  {
    icon: Gift,
    number: "03",
    title: "Ganhe e use",
    body: "YELAS com equivalente em MZN."
  }
] as const;

const businessActions = [
  {
    icon: UsersRound,
    number: "01",
    title: "Conheça os seus clientes",
    body: "Comportamento útil, sem ruído."
  },
  {
    icon: Megaphone,
    number: "02",
    title: "Crie razões para voltar",
    body: "Ofertas ligadas ao consumo real."
  },
  {
    icon: ChartNoAxesCombined,
    number: "03",
    title: "Meça o que mudou",
    body: "Indicadores claros para decidir."
  }
] as const;

const platformBenefits = [
  "Descontos exclusivos",
  "YELAS que valem",
  "Válido em vários lugares",
  "Ofertas personalizadas"
] as const;

function formatPlanPrice(valueMznMinor: number | null): string {
  if (valueMznMinor === null) return "Sob consulta";
  if (valueMznMinor === 0) return "0 MZN";
  return `${Math.round(valueMznMinor / 100).toLocaleString("pt-MZ")} MZN/mês`;
}

function getBusinessPlace(business: MarketplaceBusiness): string {
  const branch = business.branches.find((item) => item.isPrimary) ?? business.branches[0];
  return branch?.city ?? branch?.province ?? "Moçambique";
}

function getBusinessInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-MZ");
}

export default async function HomePage() {
  const [plans, marketplace] = await Promise.all([
    getPublicSubscriptionPlans(),
    getPublicMarketplaceSnapshot()
  ]);
  const businesses = marketplace.snapshot.businesses.slice(0, 6);
  const movementBusinesses = businesses.slice(0, 3);
  const offers = marketplace.snapshot.offers.slice(0, 4);
  const publicMetric = (value: number) =>
    marketplace.status === "error" ? "-" : value.toLocaleString("pt-MZ");

  return (
    <PublicSiteShell active="home">
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        type="application/ld+json"
      />

      <div className="rv-home">
        <section className="rv-hero" aria-labelledby="home-title">
          <Image
            alt="Cliente a utilizar a VUYELA num negócio moçambicano"
            className="rv-hero__image"
            fill
            priority
            sizes="100vw"
            src="/images/maputo-vuyela-hero.png"
          />
          <div className="rv-hero__shade" />
          <div className="rv-container rv-hero__content">
            <p className="rv-eyebrow">A rede digital do comércio moçambicano</p>
            <h1 id="home-title">
              A cidade recompensa quem escolhe <em>voltar.</em>
            </h1>
            <p className="rv-hero__lead">
              Cada compra cria uma razão para voltar. Descubra negócios, receba valor e fortaleça
              relações que fazem Moçambique avançar.
            </p>
            <div className="rv-actions">
              <Link className="rv-button rv-button--primary" href="/cadastrar">
                Quero um cartão <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="rv-button rv-button--secondary" href="/cadastrar/negocio">
                Sou um negócio
              </Link>
            </div>
          </div>

          <div className="rv-container rv-hero__proof" aria-label="Princípios VUYELA">
            {heroProof.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number}>
                  <div>
                    <span>{item.number}</span>
                    <Icon aria-hidden="true" size={22} />
                  </div>
                  <p>
                    <strong>{item.title}</strong>
                    <small>{item.body}</small>
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rv-command" aria-label="Acesso rápido à rede VUYELA">
          <div className="rv-container rv-command__grid">
            <Link className="rv-command__search" href="/pesquisar">
              <small>ENCONTRE NA REDE</small>
              <strong>O que faz parte do seu dia?</strong>
              <span>
                <Search aria-hidden="true" size={18} />
                Pesquisar negócios, serviços ou ofertas
              </span>
            </Link>
            <div className="rv-command__metric">
              <i aria-hidden="true" />
              <p>
                <small>REDE AGORA</small>
                <strong>{publicMetric(marketplace.snapshot.offers.length)} ofertas ativas</strong>
              </p>
            </div>
            <div className="rv-command__metric">
              <CircleDollarSign aria-hidden="true" size={22} />
              <p>
                <small>VALOR CLARO</small>
                <strong>YELAS + MZN</strong>
              </p>
            </div>
          </div>
        </section>

        <section className="rv-section rv-movement" aria-labelledby="movement-title">
          <div className="rv-container">
            <p className="rv-eyebrow rv-eyebrow--teal">VUYELA EM MOVIMENTO</p>
            <div className="rv-section-heading">
              <h2 id="movement-title">
                Uma infraestrutura de relações. <span>Com rosto, lugar e retorno.</span>
              </h2>
              <p>
                A rede torna o valor visível e aproxima cada pessoa dos negócios que escolhe, de
                norte a sul de Moçambique.
              </p>
            </div>

            <div className="rv-movement__stream">
              <header>
                <small>REDE NACIONAL</small>
                <strong>Moçambique, agora</strong>
                <p>Negócios publicados e benefícios reais da rede VUYELA.</p>
              </header>
              <div className="rv-movement__events">
                {movementBusinesses.length > 0 ? (
                  movementBusinesses.map((business, index) => (
                    <Link href={`/estabelecimentos/${business.slug}`} key={business.id}>
                      <div className="rv-movement__meta">
                        <time>{index === 0 ? "AGORA" : `${index * 7 + 3} MIN`}</time>
                        <i aria-hidden="true" />
                      </div>
                      <div className="rv-business-identity">
                        {business.logoUrl ? (
                          <Image
                            alt={`Logótipo de ${business.name}`}
                            height={48}
                            src={business.logoUrl}
                            unoptimized
                            width={48}
                          />
                        ) : (
                          <span>{getBusinessInitials(business.name)}</span>
                        )}
                        <p>
                          <strong>{business.name}</strong>
                          <small>
                            {business.offers.length > 0
                              ? `${business.offers.length.toLocaleString("pt-MZ")} ofertas ativas`
                              : "Programa VUYELA publicado"}
                          </small>
                        </p>
                      </div>
                      <b>{getBusinessPlace(business)}</b>
                    </Link>
                  ))
                ) : (
                  <div className="rv-empty">
                    <Store aria-hidden="true" size={22} />
                    <strong>
                      {marketplace.status === "error"
                        ? "A rede está temporariamente indisponível."
                        : "Os negócios publicados aparecerão aqui."}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rv-offers" aria-labelledby="offers-title">
          <div className="rv-container">
            <div className="rv-section-heading rv-section-heading--inverse">
              <div>
                <p className="rv-eyebrow">SELECIONADO PARA SI</p>
                <h2 id="offers-title">Hoje, a rede tem isto para oferecer.</h2>
              </div>
              <Link href="/ofertas">
                Ver todas as ofertas <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            {offers.length > 0 ? (
              <div className="rv-offers__flow">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <div className="rv-empty rv-empty--inverse">
                <BadgePercent aria-hidden="true" size={22} />
                <strong>
                  {marketplace.status === "error"
                    ? "Não foi possível carregar as ofertas neste momento."
                    : "Ainda não existem ofertas públicas ativas."}
                </strong>
              </div>
            )}
          </div>
          {businesses.length > 0 ? (
            <div className="rv-partner-marquee" id="partners-title" aria-label="Negócios da rede">
              <div>
                {[...businesses, ...businesses].map((business, index) => (
                  <span aria-hidden={index >= businesses.length} key={`${business.id}-${index}`}>
                    {business.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className="vy-sr-only" id="partners-title">
              Negócios da rede VUYELA
            </span>
          )}
        </section>

        <div className="rv-capulana-line" aria-hidden="true" />

        <section className="rv-wallet" aria-labelledby="wallet-title">
          <div className="rv-wallet__copy">
            <p className="rv-eyebrow rv-eyebrow--teal">A SUA VUYELA</p>
            <h2 id="wallet-title">Não é um cartão. É a sua relação com cada negócio.</h2>
            <p>
              Saldo, movimentos, ofertas e identificação vivem no mesmo lugar. Cada YELA mostra o
              seu valor e o negócio que a atribuiu.
            </p>
            <ul className="rv-wallet__benefits" aria-label="Benefícios VUYELA">
              {platformBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <Link className="rv-button rv-button--dark" href="/clientes">
              Explorar a experiência <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="rv-wallet__visual">
            <Image
              alt="Aplicação VUYELA e cartão digital com saldo em YELAS"
              className="marketing-product-image rv-wallet__image"
              height={1086}
              sizes="(max-width: 800px) 100vw, 54vw"
              src="/images/vuyela-product-yl.png"
              width={1448}
            />
            <div className="rv-wallet__steps" id="steps-title">
              {customerJourney.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.number}>
                    <div>
                      <span>{item.number}</span>
                      <Icon aria-hidden="true" size={19} />
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rv-business" aria-labelledby="business-title">
          <div className="rv-container">
            <div className="rv-section-heading rv-section-heading--inverse">
              <div>
                <p className="rv-eyebrow">VUYELA BUSINESS OS</p>
                <h2 id="business-title">
                  O relacionamento com clientes deixa de ser uma suposição.
                </h2>
              </div>
              <p>Programa, catálogo, equipa, POS, campanhas e decisões num único sistema.</p>
            </div>
            <BusinessDashboardDemo />
            <div className="rv-business__actions">
              {businessActions.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.number}>
                    <div>
                      <span>{item.number}</span>
                      <Icon aria-hidden="true" size={20} />
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rv-scale" aria-labelledby="pricing-title">
          <div className="rv-container rv-scale__layout">
            <div className="rv-scale__number">2M+</div>
            <div className="rv-scale__copy">
              <p className="rv-eyebrow rv-eyebrow--teal">VALOR RECONHECIDO NA REDE</p>
              <h2 id="pricing-title">A tecnologia deve tornar o crescimento mais humano.</h2>
              <p>Comece com uma estrutura adequada à sua operação e evolua sem perder clareza.</p>
              <div className="rv-plan-list">
                {plans.slice(0, 4).map((plan, index) => (
                  <Link href="/cadastrar/negocio" key={plan.id}>
                    <span>0{index + 1}</span>
                    <strong>{plan.name}</strong>
                    <small>{formatPlanPrice(plan.monthlyPriceMznMinor)}</small>
                    <ArrowRight aria-hidden="true" size={17} />
                  </Link>
                ))}
              </div>
              <Link className="rv-button rv-button--dark" href="/precos">
                Comparar planos <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="rv-faq" aria-labelledby="faq-title">
          <div className="rv-container rv-faq__layout">
            <div>
              <p className="rv-eyebrow rv-eyebrow--teal">PERGUNTAS FREQUENTES</p>
              <h2 id="faq-title">Clareza antes de começar.</h2>
              <p>As regras da rede devem ser tão fáceis de entender quanto o valor que recebe.</p>
              <Link href="/ajuda">
                Consultar toda a ajuda <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div>
              <details open>
                <summary>As YELAS expiram?</summary>
                <p>Cada negócio determina e comunica a validade das YELAS do seu programa.</p>
              </details>
              <details>
                <summary>Posso usar YELAS noutro estabelecimento?</summary>
                <p>Não. As YELAS são utilizadas no negócio que as atribuiu.</p>
              </details>
              <details>
                <summary>Qual é o valor das YELAS em MZN?</summary>
                <p>O equivalente promocional aparece sempre no cartão e antes da confirmação.</p>
              </details>
            </div>
          </div>
        </section>
      </div>
    </PublicSiteShell>
  );
}
