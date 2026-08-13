import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Gift,
  MapPin,
  Menu,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  WalletCards
} from "lucide-react";

import { Badge } from "../../vuyela-design-system/src/components/Badge";
import {
  PointsBalance,
  QRDisplay,
  RewardBadge,
  TransactionItem
} from "../../vuyela-design-system/src/components/Loyalty";
import { LoyaltyCard } from "../../vuyela-design-system/src/components/LoyaltyCard";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Fidelizacao digital em Mocambique",
  description:
    "VUYELA by LEMOTE ajuda negocios em Mocambique a criarem programas de fidelizacao claros, digitais e simples para clientes voltarem.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "VUYELA by LEMOTE - Fidelizacao digital em Mocambique",
    description:
      "Cada compra cria uma razao para voltar. Clientes acumulam pontos e usam beneficios no mesmo estabelecimento emissor.",
    url: siteUrl,
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  }
};

const navLinks = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#clientes", label: "Para clientes" },
  { href: "#negocios", label: "Para negocios" },
  { href: "#precos", label: "Precos" },
  { href: "#faq", label: "FAQ" }
];

const trustIndicators = [
  { label: "100% digital", icon: <Smartphone size={16} /> },
  { label: "Regras claras", icon: <ShieldCheck size={16} /> },
  { label: "Feito para Mocambique", icon: <MapPin size={16} /> }
];

const steps = [
  {
    title: "Compre",
    body: "O cliente compra num estabelecimento participante.",
    icon: <CreditCard size={22} />
  },
  {
    title: "Acumule pontos",
    body: "A regra do negocio transforma a compra em pontos promocionais.",
    icon: <Gift size={22} />
  },
  {
    title: "Volte",
    body: "O saldo fica associado ao mesmo estabelecimento emissor.",
    icon: <Store size={22} />
  },
  {
    title: "Use e economize",
    body: "Os pontos podem reduzir o valor de uma compra futura nesse negocio.",
    icon: <WalletCards size={22} />
  }
];

const customerBenefits = [
  "Cartoes digitais sempre a mao.",
  "Pontos com valor claro em MZN promocional.",
  "Ofertas e beneficios do negocio que emitiu os pontos.",
  "Codigo QR para consultar ou usar saldo sem complicacao."
];

const businessBenefits = [
  "Programa proprio de fidelizacao.",
  "Regras simples para atribuir e usar pontos.",
  "Historico preparado para ledger e auditoria.",
  "Base pronta para POS, campanhas e relatorios nas proximas fases."
];

const pricingNotes = [
  "Teste a experiencia antes de escalar.",
  "Escolha um plano de acordo com o tamanho do negocio.",
  "Cresca para POS, campanhas e analitica quando estiver pronto."
];

const faqItems = [
  {
    question: "Os pontos podem ser levantados?",
    answer:
      "Nao. Os pontos sao valor promocional do estabelecimento que os emitiu e nao representam saldo bancario."
  },
  {
    question: "Posso usar pontos noutro negocio?",
    answer:
      "Nao. Cada saldo pertence ao estabelecimento emissor e so pode ser usado nesse mesmo negocio."
  },
  {
    question: "A VUYELA assume o valor dos pontos?",
    answer:
      "Nao. A VUYELA calcula, guarda e valida os pontos, mas a responsabilidade promocional pertence ao estabelecimento emissor."
  }
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VUYELA by LEMOTE",
  url: siteUrl,
  slogan: "Volte. Ganhe. Cresca.",
  description:
    "Plataforma de fidelizacao digital para negocios em Mocambique criarem razoes reais para clientes voltarem."
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <main className="home-page" id="top">
        <header className="home-header" aria-label="Navegacao principal">
          <div className="vy-container home-header__inner">
            <a className="home-logo" href="#top" aria-label="VUYELA by LEMOTE">
              <span>VUYELA</span>
              <small>by LEMOTE</small>
            </a>
            <nav className="home-nav" aria-label="Secoes da homepage">
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
                Cadastrar
              </a>
            </div>
            <details className="home-mobile-menu">
              <summary aria-label="Abrir menu">
                <Menu size={18} />
                <span>Menu</span>
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
              <Badge tone="reward">VUYELA by LEMOTE</Badge>
              <h1 id="home-title">Cada compra cria uma razao para voltar.</h1>
              <p>
                Acumule pontos, desbloqueie beneficios e aproveite vantagens exclusivas nos seus
                estabelecimentos preferidos.
              </p>
              <div className="home-hero__actions">
                <a className="home-link-button home-link-button--reward" href="/cadastrar">
                  <CreditCard size={18} />
                  Quero um cartao
                </a>
                <a
                  className="home-link-button home-link-button--outline"
                  href="/onboarding/negocio"
                >
                  <Store size={18} />
                  Sou um negocio
                </a>
              </div>
              <ul className="home-trust-list" aria-label="Indicadores de confianca">
                {trustIndicators.map((item) => (
                  <li key={item.label}>
                    {item.icon}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-product-visual" aria-label="Pre-visualizacao do produto VUYELA">
              <div className="home-phone" aria-hidden="true">
                <div className="home-phone__top">
                  <span>VUYELA</span>
                  <small>Hoje</small>
                </div>
                <PointsBalance businessName="Restaurante Mares" points={250} />
                <TransactionItem
                  title="Pontos recebidos"
                  description="Compra registada"
                  points={50}
                  timestamp="Agora"
                />
                <QRDisplay code="VY-8F2K-91M" expiresAt="02:00" />
              </div>
              <LoyaltyCard
                businessName="Restaurante Mares"
                points={250}
                valueMzn={250}
                customerName="Maria da Silva"
                cardNumber="VY-2408-0025"
                className="home-floating-card"
              />
              <div className="home-points-note">
                <QrCode size={18} />
                <span>QR pronto para consultar ou usar saldo</span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-section--steps" id="como-funciona">
          <div className="vy-container">
            <div className="home-section__header">
              <span>Como funciona</span>
              <h2>Voltar fica simples quando o beneficio e claro.</h2>
            </div>
            <ol className="home-step-grid">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="home-step-grid__number">{index + 1}</span>
                  <span className="home-step-grid__icon">{step.icon}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-section" id="clientes">
          <div className="vy-container home-audience">
            <div className="home-audience__copy">
              <span>Para clientes</span>
              <h2>Um cartao digital para beneficios que fazem sentido.</h2>
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
              <RewardBadge label="Beneficio activo" points={50} />
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
              <span>Para negocios</span>
              <h2>Clientes que voltam. Negocios que crescem.</h2>
              <p>
                Configure beneficios claros, acompanhe movimentos e prepare a sua equipa para operar
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
          </div>
        </section>

        <section className="home-section" id="precos">
          <div className="vy-container home-pricing">
            <div className="home-section__header">
              <span>Precos</span>
              <h2>Planos para comecar pequeno e crescer com controlo.</h2>
              <p>
                A VUYELA foi pensada para negocios que querem validar fidelizacao digital antes de
                escalar para POS, campanhas e relatorios.
              </p>
            </div>
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
          </div>
        </section>

        <section className="home-section home-section--faq" id="faq">
          <div className="vy-container home-faq">
            <div className="home-section__header">
              <span>FAQ</span>
              <h2>Pontos VUYELA sao promocionais, claros e locais ao negocio.</h2>
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
      </main>
    </>
  );
}
