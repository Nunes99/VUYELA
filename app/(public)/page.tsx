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
  Sparkles,
  Store,
  UsersRound
} from "lucide-react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { PublicSiteShell } from "@/components/marketing/public-site-shell";
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
    href: "/estabelecimentos",
    icon: Store,
    label: "Encontrar negócios"
  },
  {
    href: "/ofertas",
    icon: BadgePercent,
    label: "Explorar ofertas"
  },
  {
    href: "/categorias",
    icon: Compass,
    label: "Ver categorias"
  },
  {
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

function formatPlanPrice(valueMznMinor: number | null): string {
  if (valueMznMinor === null) {
    return "Sob consulta";
  }

  if (valueMznMinor === 0) {
    return "0 MZN";
  }

  return `${Math.round(valueMznMinor / 100).toLocaleString("pt-MZ")} MZN/mês`;
}

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
            <p className="marketing-home-hero__kicker">
              <span>VUYELA</span>
              Fidelização digital para Moçambique
            </p>
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
            <ul className="marketing-home-hero__assurances" aria-label="Características principais">
              <li>100% digital</li>
              <li>Dados protegidos</li>
              <li>Feito em Moçambique</li>
            </ul>
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

      <section className="home-network" aria-labelledby="network-title">
        <div className="marketing-container home-network__layout">
          <header className="home-chapter home-network__intro">
            <span>01 / A rede agora</span>
            <h2 id="network-title">A VUYELA começa onde a vida acontece.</h2>
            <p>
              Negócios moçambicanos, benefícios publicados e lugares para onde vale a pena voltar.
            </p>
          </header>
          <dl className="home-network__facts">
            {publicFacts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <nav className="home-network__routes" aria-label="Explorar a rede VUYELA">
            {discoveryLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link href={item.href} key={item.href}>
                  <Icon aria-hidden="true" size={19} />
                  <span>{item.label}</span>
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--light marketing-public-offers"
        aria-labelledby="public-offers-title"
      >
        <div className="marketing-container home-offers__layout">
          <header className="home-chapter home-offers__intro">
            <span>02 / Em destaque</span>
            <h2 id="public-offers-title">Benefícios com nome, lugar e validade.</h2>
            <p>
              Nada de promessas abstratas. Aqui encontra campanhas publicadas pelos próprios
              negócios da rede.
            </p>
            <Link className="marketing-text-link" href="/ofertas">
              Ver todas as ofertas <ArrowRight size={16} />
            </Link>
          </header>
          <div className="home-offers__content">
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
        </div>
      </section>

      <section
        className="marketing-section marketing-section--navy marketing-pattern home-loop"
        aria-labelledby="steps-title"
      >
        <div className="marketing-container home-loop__layout">
          <header className="home-chapter home-chapter--inverse home-loop__intro">
            <span>03 / O ciclo VUYELA</span>
            <h2 id="steps-title">Uma relação que cresce de cada vez que regressa.</h2>
            <p>
              A tecnologia fica em segundo plano. Para o cliente, tudo acontece num cartão; para o
              negócio, tudo fica registado.
            </p>
            <Link className="marketing-text-link" href="/como-funciona">
              Conhecer o percurso completo <ArrowRight size={16} />
            </Link>
          </header>
          <ol className="home-loop__steps">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.title}>
                  <span className="home-loop__number">0{index + 1}</span>
                  <Icon aria-hidden="true" size={20} />
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <ul className="home-loop__outcomes" aria-label="Vantagens da rede VUYELA">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <li key={benefit.title}>
                  <Icon aria-hidden="true" size={18} />
                  <div>
                    <strong>{benefit.title}</strong>
                    <p>{benefit.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="home-partners" aria-labelledby="partners-title">
        <div className="marketing-container home-partners__layout">
          <h2 id="partners-title">Já fazem parte da rede</h2>
          {businesses.length > 0 ? (
            <div className="home-partners__list">
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
        className="marketing-section marketing-customer-preview home-customer"
        aria-labelledby="customer-title"
      >
        <div className="marketing-container marketing-split">
          <div className="home-chapter home-customer__intro">
            <span>04 / Para clientes</span>
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
        className="marketing-section marketing-business-preview marketing-pattern"
        aria-labelledby="business-title"
      >
        <div className="marketing-container">
          <div className="home-business__layout">
            <div className="home-chapter home-chapter--inverse home-business__intro">
              <span>05 / Para negócios</span>
              <h2 id="business-title">Clientes que voltam. Negócios que crescem.</h2>
              <p>
                Uma operação completa, do balcão à gestão. Configure regras, processe compras no POS
                e acompanhe o desempenho sem perder o controlo.
              </p>
              <div className="marketing-actions">
                <Link className="marketing-button marketing-button--teal" href="/cadastrar/negocio">
                  Criar programa
                </Link>
                <Link className="marketing-text-link" href="/negocios">
                  Conhecer a solução <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <ol className="home-business__index">
              <li>
                <span>01</span>
                <UsersRound size={20} />
                <div>
                  <strong>Programa próprio</strong>
                  <p>Regras e identidade para cada negócio.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <QrCode size={20} />
                <div>
                  <strong>POS simples</strong>
                  <p>Identificação por QR, cartão ou telefone.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <BarChart3 size={20} />
                <div>
                  <strong>Painel de gestão</strong>
                  <p>Indicadores de clientes, YELAS e transações.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <Store size={20} />
                <div>
                  <strong>Gestão operacional</strong>
                  <p>Filiais, equipa, campanhas e subscrição.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--light home-plans"
        aria-labelledby="pricing-title"
      >
        <div className="marketing-container home-plans__layout">
          <header className="home-chapter home-plans__intro">
            <span>06 / Planos VUYELA</span>
            <h2 id="pricing-title">Planos para começar pequeno e crescer com controlo.</h2>
            <p>Escolha o plano adequado ao número de filiais, utilizadores e campanhas.</p>
            <Link className="marketing-text-link" href="/precos">
              Comparar todos os recursos <ArrowRight size={16} />
            </Link>
          </header>
          <div className="home-plans__list">
            {plans.length > 0 ? (
              plans.map((plan, index) => (
                <Link href="/cadastrar/negocio" key={plan.id}>
                  <span>0{index + 1}</span>
                  <div>
                    <strong>{plan.name}</strong>
                    <small>{plan.description}</small>
                  </div>
                  <b>{formatPlanPrice(plan.monthlyPriceMznMinor)}</b>
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              ))
            ) : (
              <div className="marketing-empty-state">
                <strong>O catálogo de planos está temporariamente indisponível.</strong>
                <p>Fale com a equipa VUYELA para preparar o seu programa.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-section--faq" aria-labelledby="faq-title">
        <div className="marketing-container marketing-faq-preview">
          <div className="home-chapter">
            <span>07 / Perguntas frequentes</span>
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
