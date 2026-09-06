import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gift,
  QrCode,
  Store,
  UserPlus,
  UsersRound,
  WalletCards
} from "lucide-react";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Conheça o ciclo completo da fidelização digital VUYELA para clientes e negócios.",
  alternates: { canonical: "/como-funciona" }
};

const journey = [
  {
    action: { href: "/cadastrar", label: "Registar agora" },
    body: "Faça o registo no navegador, confirme o seu contacto e reúna os seus cartões digitais numa única área.",
    icon: UserPlus,
    title: "Crie a sua conta em poucos minutos"
  },
  {
    action: { href: "/estabelecimentos", label: "Ver estabelecimentos" },
    body: "Encontre restaurantes, lojas, clínicas e serviços aderentes em todo o território moçambicano.",
    icon: Store,
    title: "Escolha um negócio parceiro"
  },
  {
    action: { href: "/clientes", label: "Conhecer o cartão" },
    body: "Apresente o QR Code do cartão no pagamento. O negócio identifica a compra e credita as suas YELAS.",
    icon: QrCode,
    title: "Use o cartão no pagamento"
  },
  {
    action: { href: "/ofertas", label: "Explorar benefícios" },
    body: "Acompanhe o saldo, consulte o equivalente em MZN e use as YELAS nas condições definidas pelo negócio.",
    icon: Gift,
    title: "Volte e transforme fidelidade em valor"
  }
];

const customerBenefits = [
  "Registo gratuito e uma carteira para vários cartões.",
  "YELAS e equivalente promocional sempre visíveis.",
  "Histórico completo de créditos, débitos e compras.",
  "Ofertas relevantes dos negócios que escolheu."
];

const businessBenefits = [
  "Programa configurado de acordo com cada operação.",
  "Regras claras para emissão e utilização de YELAS.",
  "POS, campanhas, equipa e catálogo no mesmo fluxo.",
  "Dados auditáveis para compreender e reter clientes."
];

export default function HowItWorksPage() {
  return (
    <PublicSiteShell active="how">
      <main className="rv-how">
        <section className="rv-how__hero" aria-labelledby="how-title">
          <div className="rv-how__texture" aria-hidden="true" />
          <div className="rv-container rv-how__hero-content">
            <p className="rv-eyebrow">O ciclo VUYELA</p>
            <h1 id="how-title">Como funciona a VUYELA?</h1>
            <p className="rv-how__hero-lead">
              Uma compra deixa de ser apenas uma transação. Torna-se o início de uma relação que
              recompensa o cliente e ajuda o negócio a crescer.
            </p>
            <div className="rv-actions">
              <Link className="rv-button rv-button--primary" href="/cadastrar">
                Criar conta gratuita <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="rv-button rv-button--secondary" href="/estabelecimentos">
                Descobrir estabelecimentos
              </Link>
            </div>
            <p className="rv-how__hero-note">
              <strong>04 etapas.</strong> Um percurso simples, do primeiro registo ao próximo
              regresso.
            </p>
          </div>
          <div className="rv-how__hero-product" aria-hidden="true">
            <Image
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 34rem, 54vw"
              src="/images/vuyela-product-yl.png"
            />
          </div>
        </section>

        <section className="rv-how__journey" aria-labelledby="journey-title">
          <div className="rv-container">
            <header className="rv-how__section-heading">
              <div>
                <p className="rv-eyebrow rv-eyebrow--teal">Da adesão ao benefício</p>
                <h2 id="journey-title">Começa numa compra. Cresce em cada regresso.</h2>
              </div>
              <p>
                Cada etapa conduz naturalmente à seguinte. Sem cartões físicos, processos opacos ou
                tarefas desnecessárias.
              </p>
            </header>

            <div className="rv-how__journey-grid">
              {journey.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article key={step.title}>
                    <div className="rv-how__step-head">
                      <span>0{index + 1}</span>
                      <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    <Link href={step.action.href}>
                      {step.action.label} <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rv-how__network" aria-labelledby="perspectives-title">
          <div className="rv-container rv-how__network-layout">
            <header>
              <p className="rv-eyebrow">Dois percursos, uma plataforma</p>
              <h2 id="perspectives-title">O cliente vê valor. O negócio constrói relação.</h2>
              <p>
                A VUYELA liga os dois percursos sem os confundir. Cada pessoa encontra apenas as
                ferramentas de que precisa, no momento certo.
              </p>
            </header>

            <div className="rv-how__audiences">
              <article>
                <div className="rv-how__audience-title">
                  <span>01</span>
                  <WalletCards aria-hidden="true" size={25} />
                </div>
                <h3>Para clientes</h3>
                <p>Uma carteira digital para descobrir, acompanhar e aproveitar benefícios.</p>
                <ul>
                  {customerBenefits.map((benefit) => (
                    <li key={benefit}>
                      <Check aria-hidden="true" size={15} /> {benefit}
                    </li>
                  ))}
                </ul>
                <Link href="/clientes">
                  Conhecer a experiência <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </article>

              <article>
                <div className="rv-how__audience-title">
                  <span>02</span>
                  <UsersRound aria-hidden="true" size={25} />
                </div>
                <h3>Para negócios</h3>
                <p>Uma operação integrada para transformar visitas em relações duradouras.</p>
                <ul>
                  {businessBenefits.map((benefit) => (
                    <li key={benefit}>
                      <Check aria-hidden="true" size={15} /> {benefit}
                    </li>
                  ))}
                </ul>
                <Link href="/negocios">
                  Explorar as soluções <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="rv-how__proof" aria-labelledby="proof-title">
          <div className="rv-container rv-how__proof-layout">
            <div>
              <p className="rv-eyebrow rv-eyebrow--teal">Impacto que se mede</p>
              <strong aria-hidden="true">35%</strong>
            </div>
            <figure>
              <blockquote id="proof-title">
                “Com o programa da VUYELA, conseguimos aumentar o regresso dos clientes em mais de
                35% nos primeiros três meses. Por ser digital e estar no telemóvel, a adesão foi
                imediata.”
              </blockquote>
              <figcaption>
                <strong>Délio Manjate</strong>
                <span>Proprietário, Restaurante Marés</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="rv-how__next" aria-labelledby="next-title">
          <div className="rv-container rv-how__next-layout">
            <div>
              <p className="rv-eyebrow">Próximo passo</p>
              <h2 id="next-title">Escolha como quer usar a VUYELA.</h2>
            </div>
            <div className="rv-actions">
              <Link className="rv-button rv-button--primary" href="/cadastrar">
                Quero aderir como cliente <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="rv-button rv-button--secondary" href="/cadastrar/negocio">
                Quero registar um negócio
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
