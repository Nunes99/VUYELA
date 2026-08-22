import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  CreditCard,
  Gift,
  MapPin,
  Menu,
  Percent,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Store,
  WalletCards
} from "lucide-react";

import { RewardBadge } from "../../vuyela-design-system/src/components/Loyalty";
import { LoyaltyCard } from "../../vuyela-design-system/src/components/LoyaltyCard";
import { VuyelaLogo } from "@/components/brand/vuyela-logo";
import { getPublicSubscriptionPlans } from "@/features/subscriptions/public-data";
import { formatEntitlementLimit, getAnalyticsLabel } from "@/features/subscriptions/model";
import { getSiteUrl } from "@/lib/env";
import { serializeJsonLd } from "@/lib/seo/json-ld";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Fidelização digital em Moçambique",
  description:
    "VUYELA by LEMOTE ajuda negócios em Moçambique a criarem programas de fidelização claros, digitais e simples para clientes voltarem.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "VUYELA by LEMOTE - Fidelização digital em Moçambique",
    description:
      "Cada compra cria uma razão para voltar. Clientes acumulam pontos e usam benefícios no mesmo estabelecimento emissor.",
    url: siteUrl,
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  }
};

const navLinks = [
  { href: "#top", label: "Início" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#clientes", label: "Para clientes" },
  { href: "#negocios", label: "Para negócios" },
  { href: "#precos", label: "Preços" },
  { href: "#recursos", label: "Recursos" },
  { href: "#blog", label: "Blog" }
];

const trustIndicators = [
  {
    label: "100% Digital",
    body: "Tudo no seu telemóvel",
    icon: <Smartphone size={22} />
  },
  {
    label: "Seguro & Confiável",
    body: "Os seus dados sempre protegidos",
    icon: <ShieldCheck size={22} />
  },
  {
    label: "Feito em Moçambique",
    body: "Tecnologia que valoriza o que é nosso",
    icon: <MapPin size={22} />
  }
];

const productBenefits = [
  {
    title: "Descontos exclusivos",
    body: "Benefícios criados pelos estabelecimentos onde já compra.",
    icon: <Percent size={22} />
  },
  {
    title: "Pontos que valem",
    body: "1 ponto equivale a 1 MZN promocional no negócio emissor.",
    icon: <Coins size={22} />
  },
  {
    title: "Válido em vários lugares",
    body: "Descubra estabelecimentos parceiros perto de si.",
    icon: <MapPin size={22} />
  },
  {
    title: "Ofertas personalizadas",
    body: "Acompanhe campanhas relevantes dos seus negócios preferidos.",
    icon: <Sparkles size={22} />
  }
];

const steps = [
  {
    title: "Compre",
    body: "Faça as suas compras nos estabelecimentos parceiros.",
    icon: <CreditCard size={22} />
  },
  {
    title: "Acumule pontos",
    body: "Ganhe pontos a cada compra realizada.",
    icon: <Gift size={22} />
  },
  {
    title: "Volte",
    body: "Regresse sempre que quiser aproveitar mais.",
    icon: <Store size={22} />
  },
  {
    title: "Use e economize",
    body: "Use os seus pontos como desconto e economize dinheiro.",
    icon: <WalletCards size={22} />
  }
];

const trustedBusinesses = [
  { name: "MARÉS", detail: "RESTAURANTE" },
  { name: "ENERGIA GINÁSIO", detail: "BEM-ESTAR" },
  { name: "MAIS SAÚDE", detail: "FARMÁCIA" },
  { name: "BELEZA & CIA", detail: "SALÃO" },
  { name: "Hotel VIP", detail: "MAPUTO" },
  { name: "techpoint", detail: "INFORMÁTICA" }
];

const customerBenefits = [
  "Cartões digitais sempre a mão.",
  "Pontos com valor claro em MZN promocional.",
  "Ofertas e benefícios do negócio que emitiu os pontos.",
  "Código QR para consultar ou usar saldo sem complicação."
];

const businessBenefits = [
  "Programa próprio de fidelização.",
  "Regras simples para atribuir e usar pontos.",
  "Histórico preparado para ledger e auditoria.",
  "Base pronta para POS, campanhas e relatórios nas próximas fases."
];

const pricingNotes = [
  "Teste a experiência antes de escalar.",
  "Escolha um plano de acordo com o tamanho do negócio.",
  "Cresca para POS, campanhas e analítica quando estiver pronto."
];

const faqItems = [
  {
    question: "Os pontos podem ser levantados?",
    answer:
      "Não. Os pontos são valor promocional do estabelecimento que os emitiu e não representam saldo bancário."
  },
  {
    question: "Posso usar pontos noutro negócio?",
    answer:
      "Não. Cada saldo pertence ao estabelecimento emissor e só pode ser usado nesse mesmo negócio."
  },
  {
    question: "A VUYELA assume o valor dos pontos?",
    answer:
      "Não. A VUYELA calcula, guarda e valida os pontos, mas a responsabilidade promocional pertence ao estabelecimento emissor."
  }
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VUYELA by LEMOTE",
  url: siteUrl,
  slogan: "Volte. Ganhe. Cresca.",
  description:
    "Plataforma de fidelização digital para negócios em Moçambique criarem razões reais para clientes voltarem."
};

export default async function HomePage() {
  const subscriptionPlans = await getPublicSubscriptionPlans();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
      />
      <main className="home-page" id="top">
        <header className="home-header" aria-label="Navegação principal">
          <div className="vy-container home-header__inner">
            <VuyelaLogo className="home-logo" href="#top" inverse />
            <nav className="home-nav" aria-label="Secções da página inicial">
              {navLinks.map((link) => (
                <a href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="home-header__actions">
              <a className="home-link-button home-link-button--ghost" href="/entrar">
                Entrar
              </a>
              <a className="home-link-button home-link-button--reward" href="/cadastrar">
                Registar
              </a>
            </div>
            <details className="home-mobile-menu">
              <summary aria-label="Abrir menu">
                <Menu size={18} />
              </summary>
              <nav aria-label="Menu mobile">
                {navLinks.map((link) => (
                  <a href={link.href} key={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </header>

        <section className="home-hero" aria-labelledby="home-title">
          <div className="vy-container home-hero__inner">
            <div className="home-hero__copy">
              <span className="home-hero__eyebrow">Plataforma de fidelização digital</span>
              <h1 id="home-title">
                <span>Cada compra</span>
                <span>
                  cria uma <em>razão</em>
                </span>
                <span>
                  para <strong>voltar.</strong>
                </span>
              </h1>
              <p>
                Acumule pontos, desbloqueie benefícios e aproveite vantagens exclusivas nos seus
                estabelecimentos preferidos.
              </p>
              <div className="home-hero__actions">
                <a className="home-link-button home-link-button--reward" href="/cadastrar">
                  Quero um cartão
                  <ArrowRight size={18} />
                </a>
                <a
                  className="home-link-button home-link-button--outline"
                  href="/onboarding/negocio"
                >
                  Sou um negócio
                </a>
              </div>
              <ul className="home-trust-list" aria-label="Indicadores de confiança">
                {trustIndicators.map((item) => (
                  <li key={item.label}>
                    <span className="home-trust-list__icon">{item.icon}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.body}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-product-visual" aria-label="Pré-visualização do produto VUYELA">
              <Image
                alt="Aplicação VUYELA num smartphone com cartão QR de fidelização e confirmação de pontos"
                className="home-product-visual__image"
                height={1024}
                priority
                sizes="(max-width: 639px) 135vw, (max-width: 1023px) 72vw, 55vw"
                src="/images/vuyela-hero-product.png"
                width={1536}
              />
            </div>
          </div>
        </section>

        <section className="home-section home-section--steps" id="como-funciona">
          <div className="vy-container">
            <div className="home-section__header home-section__header--centered">
              <h2>Como funciona?</h2>
            </div>
            <ol className="home-step-grid">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="home-step-grid__icon" data-step={index + 1}>
                    {step.icon}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <a className="home-section-link" href="#clientes">
              Ver como funciona
              <ArrowRight size={16} />
            </a>
          </div>
        </section>

        <section className="home-section home-section--benefits" id="recursos">
          <div className="vy-container">
            <div className="home-section__header home-section__header--centered">
              <h2>Vantagens para si</h2>
              <p>Muito mais que pontos, uma experiência completa.</p>
            </div>
            <div className="home-benefit-grid">
              {productBenefits.map((benefit) => (
                <article key={benefit.title}>
                  <span>{benefit.icon}</span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-partners" aria-labelledby="home-partners-title">
          <div className="vy-container">
            <h2 id="home-partners-title">Negócios que já confiam</h2>
            <div className="home-partners__list">
              {trustedBusinesses.map((business) => (
                <span key={business.name}>
                  <small>{business.detail}</small>
                  <strong>{business.name}</strong>
                </span>
              ))}
            </div>
            <Link href="/estabelecimentos">
              Ver todos os parceiros
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="home-section" id="clientes">
          <div className="vy-container home-audience">
            <div className="home-audience__copy">
              <span>Para clientes</span>
              <h2>Um cartão digital para benefícios que fazem sentido.</h2>
              <p>
                O cliente sabe onde ganhou pontos, quanto valem em MZN promocional e onde pode
                voltar para usar esse saldo.
              </p>
              <ul className="home-check-list">
                {customerBenefits.map((benefit) => (
                  <li key={benefit}>
                    <CheckCircle2 size={18} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="home-audience__panel">
              <RewardBadge label="Benefício ativo" points={50} />
              <LoyaltyCard
                businessName="Cafe Central"
                points={180}
                valueMzn={180}
                customerName="Amilcar M."
                cardNumber="VY-2408-0180"
              />
            </div>
          </div>
        </section>

        <section className="home-section home-section--dark" id="negocios">
          <div className="vy-container home-business">
            <div className="home-section__header">
              <span>Para negócios</span>
              <h2>Clientes que voltam. Negócios que crescem.</h2>
              <p>
                Configure benefícios claros, acompanhe movimentos e prepare a sua equipa para operar
                com pontos de forma organizada.
              </p>
            </div>
            <div className="home-business-grid">
              {businessBenefits.map((benefit) => (
                <article key={benefit}>
                  <CheckCircle2 size={20} />
                  <p>{benefit}</p>
                </article>
              ))}
            </div>
            <div className="home-marketplace-links" aria-label="Links de descoberta pública">
              <Link href="/estabelecimentos">Ver estabelecimentos</Link>
              <Link href="/categorias">Explorar categorias</Link>
              <Link href="/locais">Explorar locais</Link>
              <Link href="/ofertas">Ver ofertas ativas</Link>
              <Link href="/pesquisar">Pesquisar benefícios</Link>
            </div>
          </div>
        </section>

        <section className="home-section" id="precos">
          <div className="vy-container home-pricing">
            <div className="home-section__header">
              <span>Preços</span>
              <h2>Planos para começar pequeno e crescer com controlo.</h2>
              <p>
                A VUYELA foi pensada para negócios que querem validar fidelização digital antes de
                escalar para POS, campanhas e relatórios.
              </p>
            </div>
            {subscriptionPlans.length > 0 ? (
              <div className="home-pricing__plans">
                {subscriptionPlans.map((plan) => (
                  <article key={plan.id}>
                    <span>{plan.name}</span>
                    <strong>
                      {plan.monthlyPriceMznMinor === null
                        ? "Sob consulta"
                        : `${(plan.monthlyPriceMznMinor / 100).toLocaleString("pt-MZ")} MZN`}
                    </strong>
                    <p>{plan.description}</p>
                    <dl>
                      <div>
                        <dt>Filiais</dt>
                        <dd>{formatEntitlementLimit(plan.branchLimit)}</dd>
                      </div>
                      <div>
                        <dt>Equipa</dt>
                        <dd>{formatEntitlementLimit(plan.staffLimit)}</dd>
                      </div>
                      <div>
                        <dt>Campanhas</dt>
                        <dd>{formatEntitlementLimit(plan.campaignLimit)}</dd>
                      </div>
                      <div>
                        <dt>Analítica</dt>
                        <dd>{getAnalyticsLabel(plan.analyticsLevel)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="home-pricing__panel">
                {pricingNotes.map((note) => (
                  <p key={note}>
                    <CheckCircle2 size={18} />
                    {note}
                  </p>
                ))}
                <a className="home-link-button home-link-button--primary" href="#faq">
                  Ver perguntas frequentes
                  <ArrowRight size={18} />
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="home-section home-section--faq" id="faq">
          <div className="vy-container home-faq">
            <div className="home-section__header">
              <span>FAQ</span>
              <h2>Pontos VUYELA são promocionais, claros e locais ao negócio.</h2>
            </div>
            <div className="home-faq__items">
              {faqItems.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="home-journal" id="blog" aria-labelledby="home-journal-title">
          <div className="vy-container home-journal__inner">
            <div>
              <span>Recursos VUYELA</span>
              <h2 id="home-journal-title">Fidelização explicada com clareza.</h2>
              <p>
                Consulte estabelecimentos, ofertas e respostas práticas para clientes e negócios.
              </p>
            </div>
            <nav aria-label="Recursos VUYELA">
              <Link href="/estabelecimentos">Estabelecimentos</Link>
              <Link href="/ofertas">Ofertas ativas</Link>
              <a href="#faq">Perguntas frequentes</a>
            </nav>
          </div>
        </section>

        <footer className="home-footer">
          <div className="vy-container home-footer__inner">
            <VuyelaLogo inverse />
            <p>Volte. Ganhe. Cresca.</p>
            <small>VUYELA by LEMOTE. Tecnologia de fidelização para Moçambique.</small>
          </div>
        </footer>
      </main>
    </>
  );
}
