import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Check,
  CircleDollarSign,
  Compass,
  CreditCard,
  Gift,
  MapPin,
  Megaphone,
  QrCode,
  RefreshCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UsersRound
} from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { PublicSiteShell } from "@/components/marketing/public-site-shell";
import { PricingSelector } from "@/features/marketing/pricing-selector";
import { getPublicMarketplaceSnapshot } from "@/features/public-marketplace/data";
import { OfferCard } from "@/features/public-marketplace/marketplace";
import { getPublicSubscriptionPlans } from "@/features/subscriptions/public-data";
import { getSiteUrl } from "@/lib/env";
import { serializeJsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Fidelização digital em Moçambique",
  description:
    "Cada compra cria uma razão para voltar com cartões digitais, YELAS e benefícios VUYELA.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "VUYELA - Cada compra cria uma razão para voltar",
    description: "Fidelização digital simples para clientes e negócios em Moçambique.",
    url: siteUrl,
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  }
};

const steps = [
  {
    body: "Faça as suas compras diárias nos estabelecimentos parceiros aderentes.",
    icon: CreditCard,
    title: "Compre"
  },
  {
    body: "Apresente o seu QR Code no telemóvel para acumular YELAS instantaneamente.",
    icon: Gift,
    title: "Acumule YELAS"
  },
  {
    body: "Quanto mais regressa aos seus locais favoritos, mais valor acumula na sua conta.",
    icon: RefreshCcw,
    title: "Volte"
  },
  {
    body: "Desconte as YELAS em novos serviços, compras ou receba benefícios diretos.",
    icon: CircleDollarSign,
    title: "Use e economize"
  }
];

const benefits = [
  {
    body: "Aceda a promoções criadas pelos negócios onde já compra.",
    icon: Sparkles,
    title: "Descontos exclusivos"
  },
  {
    body: "1 YELA equivale, por defeito, a 1 MZN promocional.",
    icon: CircleDollarSign,
    title: "YELAS que valem"
  },
  {
    body: "Descubra parceiros e vantagens em diferentes categorias.",
    icon: MapPin,
    title: "Válido em vários lugares"
  },
  {
    body: "Receba campanhas relevantes dos negócios que acompanha.",
    icon: Megaphone,
    title: "Ofertas personalizadas"
  }
];

const discoveryLinks = [
  {
    body: "Conheça os negócios que já fazem parte da rede.",
    href: "/estabelecimentos",
    icon: Store,
    label: "Encontrar negócios"
  },
  {
    body: "Veja benefícios válidos e campanhas em destaque.",
    href: "/ofertas",
    icon: BadgePercent,
    label: "Explorar ofertas"
  },
  {
    body: "Navegue por atividade, serviço ou produto.",
    href: "/categorias",
    icon: Compass,
    label: "Ver categorias"
  },
  {
    body: "Procure pelo nome, cidade ou categoria.",
    href: "/pesquisar",
    icon: Search,
    label: "Pesquisar na VUYELA"
  }
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VUYELA by LEMOTE",
  url: siteUrl,
  slogan: "Volte. Ganhe. Cresça.",
  description: "Plataforma de fidelização digital para Moçambique."
};

export default async function HomePage() {
  const [plans, marketplace] = await Promise.all([
    getPublicSubscriptionPlans(),
    getPublicMarketplaceSnapshot()
  ]);
  const businesses = marketplace.snapshot.businesses.slice(0, 6);
  const offers = marketplace.snapshot.offers.slice(0, 3);
  const publicMetric = (value: number) =>
    marketplace.status === "error" ? "-" : value.toLocaleString("pt-MZ");
  const publicFacts = [
    {
      value: publicMetric(marketplace.snapshot.businesses.length),
      label: "Negócios publicados"
    },
    {
      value: publicMetric(marketplace.snapshot.offers.length),
      label: "Ofertas ativas"
    },
    {
      value: publicMetric(marketplace.snapshot.categories.length),
      label: "Categorias disponíveis"
    },
    {
      value: publicMetric(marketplace.snapshot.cities.length),
      label: "Locais abrangidos"
    }
  ];

  return (
    <PublicSiteShell active="home">
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        type="application/ld+json"
      />

      <section className="marketing-home-hero marketing-pattern" aria-labelledby="home-title">
        <div className="marketing-container marketing-home-hero__inner">
          <div className="marketing-home-hero__copy">
            <div className="marketing-proof" aria-label="Características principais">
              <span>
                <Smartphone size={14} />
                100% Digital
              </span>
              <span>
                <ShieldCheck size={14} />
                Seguro &amp; Confiável
              </span>
              <span>
                <MapPin size={14} />
                Feito em Moçambique
              </span>
            </div>
            <h1 id="home-title">
              Cada compra cria uma razão para <em>voltar.</em>
            </h1>
            <p>
              Acumule YELAS em cada visita a restaurantes, farmácias e lojas locais parceiras.
              Converta o seu consumo diário em recompensas digitais e benefícios reais em MZN.
            </p>
            <div className="marketing-actions">
              <Link className="marketing-button marketing-button--teal" href="/cadastrar/negocio">
                Sou um negócio <ArrowRight size={17} />
              </Link>
              <Link className="marketing-button marketing-button--outline" href="/cadastrar">
                Quero um cartão
              </Link>
            </div>
          </div>

          <div className="marketing-home-hero__visual">
            <Image
              alt="Aplicação móvel e cartão digital VUYELA com código QR"
              className="marketing-product-image"
              height={1086}
              priority
              sizes="(max-width: 767px) 100vw, 52vw"
              src="/images/vuyela-hero-product-figma.png"
              width={1448}
            />
          </div>
        </div>
      </section>

      <section className="marketing-facts" aria-label="Diretório VUYELA em números">
        <div className="marketing-container marketing-facts__grid">
          {publicFacts.map((fact) => (
            <div key={fact.label}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <nav className="marketing-quick-access" aria-label="Acesso rápido à rede VUYELA">
        <div className="marketing-container marketing-quick-access__grid">
          {discoveryLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link href={item.href} key={item.href}>
                <Icon aria-hidden="true" size={20} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.body}</small>
                </span>
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            );
          })}
        </div>
      </nav>

      <section
        className="marketing-section marketing-section--light marketing-public-offers"
        aria-labelledby="public-offers-title"
      >
        <div className="marketing-container">
          <div className="marketing-section-lead">
            <div className="marketing-heading">
              <span>Agora na rede</span>
              <h2 id="public-offers-title">Benefícios preparados pelos negócios para si.</h2>
            </div>
            <div className="marketing-section-lead__aside">
              <p>Promoções ativas, com o estabelecimento responsável e a respetiva validade.</p>
              <Link className="marketing-text-link" href="/ofertas">
                Ver todas as ofertas <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          {offers.length > 0 ? (
            <div className="marketplace-offer-grid marketing-public-offers__grid">
              {offers.map((offer) => (
                <OfferCard offer={offer} key={offer.id} />
              ))}
            </div>
          ) : (
            <div className="marketing-empty-state">
              <strong>
                {marketplace.status === "error"
                  ? "Não foi possível carregar as ofertas neste momento."
                  : "Ainda não existem ofertas públicas ativas."}
              </strong>
              <p>Entretanto, pode conhecer os estabelecimentos já publicados.</p>
            </div>
          )}
        </div>
      </section>

      <section
        className="marketing-section marketing-section--soft marketing-how-section"
        aria-labelledby="steps-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center">
            <span>Como funciona a VUYELA</span>
            <h2 id="steps-title">Simples para clientes, rentável para negócios.</h2>
          </div>
          <ol className="marketing-step-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title}>
                  <span className="marketing-step-grid__number">0{index + 1}</span>
                  <span className="marketing-icon">
                    <Icon size={19} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              );
            })}
          </ol>
          <div className="marketing-centered-action">
            <Link className="marketing-text-link" href="/como-funciona">
              Ver o funcionamento completo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--navy marketing-pattern marketing-mobile-omit"
        aria-labelledby="benefits-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--inverse">
            <span>Vantagens exclusivas</span>
            <h2 id="benefits-title">Muito mais do que YELAS, uma experiência completa.</h2>
          </div>
          <div className="marketing-benefit-grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title}>
                  <Icon aria-hidden="true" size={21} />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="marketing-partners marketing-mobile-omit"
        aria-labelledby="partners-title"
      >
        <div className="marketing-container">
          <div className="marketing-ornament" aria-hidden="true" />
          <h2 id="partners-title">Negócios disponíveis na VUYELA</h2>
          {businesses.length > 0 ? (
            <div className="marketing-partners__list">
              {businesses.map((business) => (
                <Link href={`/estabelecimentos/${business.slug}`} key={business.id}>
                  {business.name}
                </Link>
              ))}
            </div>
          ) : (
            <p>
              {marketplace.status === "error"
                ? "O diretório está temporariamente indisponível. Tente novamente dentro de alguns instantes."
                : "O diretório de parceiros será apresentado quando existirem negócios publicados."}
            </p>
          )}
        </div>
      </section>

      <section
        className="marketing-section marketing-customer-preview"
        aria-labelledby="customer-title"
      >
        <div className="marketing-container marketing-split">
          <div className="marketing-heading">
            <span>Para os clientes</span>
            <h2 id="customer-title">Um cartão digital para benefícios que fazem sentido.</h2>
            <p>
              Chega de cartões de papel acumulados na carteira que se perdem facilmente. Com a
              VUYELA, o seu cartão digital vive no seu telemóvel, seguro e sempre pronto a usar.
            </p>
            <ul className="marketing-check-list">
              <li>
                <Check size={17} />
                Cartões digitais sempre disponíveis.
              </li>
              <li>
                <Check size={17} />
                YELAS associadas ao negócio emissor.
              </li>
              <li>
                <Check size={17} />
                Campanhas e ofertas ativas.
              </li>
              <li>
                <Check size={17} />
                Identificação rápida através de QR.
              </li>
            </ul>
            <Link className="marketing-text-link" href="/clientes">
              Conhecer a experiência do cliente <ArrowRight size={16} />
            </Link>
          </div>

          <article className="marketing-loyalty-card" aria-label="Exemplo de cartão VUYELA">
            <div>
              <VuyelaLogo inverse />
              <span>Moçambique</span>
            </div>
            <small>Saldo disponível</small>
            <strong>3.750,00 MZN</strong>
            <div className="marketing-loyalty-card__bottom">
              <span>
                Cliente fidelizado
                <br />
                <strong>Mário de Lemos</strong>
              </span>
              <QRCodeSVG
                aria-label="Exemplo de QR de identificação VUYELA"
                bgColor="#ffffff"
                fgColor="#032b38"
                level="M"
                marginSize={1}
                role="img"
                size={64}
                value="VY-DEMO-250"
              />
            </div>
          </article>
        </div>
      </section>

      <section
        className="marketing-section marketing-business-preview marketing-pattern marketing-mobile-omit"
        aria-labelledby="business-title"
      >
        <div className="marketing-container">
          <div className="marketing-business-preview__top">
            <div className="marketing-heading marketing-heading--inverse">
              <span>Para negócios</span>
              <h2 id="business-title">Clientes que voltam. Negócios que crescem.</h2>
              <p>
                Configure regras próprias, opere compras no POS e acompanhe o desempenho do seu
                programa com clareza.
              </p>
            </div>
            <div className="marketing-actions">
              <Link className="marketing-button marketing-button--teal" href="/cadastrar/negocio">
                Criar programa
              </Link>
              <Link className="marketing-button marketing-button--outline" href="/negocios">
                Saber mais
              </Link>
            </div>
          </div>
          <div className="marketing-business-grid">
            <article>
              <UsersRound size={20} />
              <h3>Programa próprio</h3>
              <p>Regras e identidade para cada negócio.</p>
            </article>
            <article>
              <QrCode size={20} />
              <h3>POS simples</h3>
              <p>Identificação por QR, cartão ou telefone.</p>
            </article>
            <article>
              <BarChart3 size={20} />
              <h3>Painel de gestão</h3>
              <p>Indicadores de clientes, YELAS e transações.</p>
            </article>
            <article>
              <Store size={20} />
              <h3>Gestão operacional</h3>
              <p>Filiais, equipa, campanhas e subscrição.</p>
            </article>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--light"
        aria-labelledby="pricing-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center">
            <span>Preços VUYELA</span>
            <h2 id="pricing-title">Planos para começar pequeno e crescer com controlo.</h2>
            <p>Escolha o plano adequado ao número de filiais, utilizadores e campanhas.</p>
          </div>
          <PricingSelector hidePeriod plans={plans} />
          <div className="marketing-centered-action">
            <Link className="marketing-text-link" href="/precos">
              Comparar todos os recursos <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--faq marketing-mobile-omit"
        aria-labelledby="faq-title"
      >
        <div className="marketing-container marketing-faq-preview">
          <div className="marketing-heading">
            <span>Perguntas frequentes</span>
            <h2 id="faq-title">Esclareça as suas dúvidas mais comuns.</h2>
          </div>
          <div>
            <details open>
              <summary>As YELAS VUYELA expiram?</summary>
              <p>Cada negócio pode configurar a validade das YELAS do seu programa.</p>
            </details>
            <details>
              <summary>Posso usar YELAS noutro estabelecimento?</summary>
              <p>Não. As YELAS são utilizadas apenas no negócio que as atribuiu.</p>
            </details>
            <details>
              <summary>A VUYELA assume o valor das YELAS?</summary>
              <p>Não. O valor promocional é responsabilidade do negócio emissor.</p>
            </details>
          </div>
          <Link className="marketing-text-link" href="/ajuda">
            Consultar toda a ajuda <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
