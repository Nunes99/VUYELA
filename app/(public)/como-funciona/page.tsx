import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Conheça o ciclo completo da fidelização digital VUYELA para clientes e negócios.",
  alternates: { canonical: "/como-funciona" }
};

const journey = [
  {
    action: { href: "/cadastrar", label: "Registar agora" },
    body: "Crie gratuitamente a sua conta e tenha acesso ao primeiro cartão digital quando aderir a um negócio.",
    title: "Crie a sua conta em poucos minutos"
  },
  {
    action: { href: "/estabelecimentos", label: "Ver parceiros" },
    body: "Descubra restaurantes, lojas, farmácias, serviços e outros estabelecimentos publicados na VUYELA.",
    title: "Faça compras no comércio local"
  },
  {
    action: { href: "/clientes", label: "Ver o cartão" },
    body: "Apresente o QR, o número do cartão ou o telefone associado para o negócio identificar a sua conta.",
    title: "Identifique o cartão no pagamento"
  },
  {
    action: { href: "/ofertas", label: "Conhecer recompensas" },
    body: "Use os pontos numa compra futura no mesmo negócio, respeitando as regras do programa emissor.",
    title: "Troque pontos por benefícios"
  }
];

export default function HowItWorksPage() {
  return (
    <PublicSiteShell active="how">
      <section className="marketing-page-hero marketing-pattern" aria-labelledby="how-title">
        <div className="marketing-container marketing-heading marketing-heading--center marketing-heading--inverse">
          <span>Guia do utilizador</span>
          <h1 id="how-title">Como funciona a VUYELA?</h1>
          <p>
            Descubra o ciclo completo, desde o primeiro registo até ao momento em que utiliza os
            pontos acumulados.
          </p>
        </div>
      </section>

      <section className="marketing-section marketing-section--soft marketing-pattern marketing-pattern--light">
        <div className="marketing-container marketing-journey">
          {journey.map((step, index) => (
            <article key={step.title}>
              <strong className="marketing-journey__number">0{index + 1}</strong>
              <div>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </div>
              <Link
                className="marketing-button marketing-button--gold-outline"
                href={step.action.href}
              >
                {step.action.label} <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        className="marketing-section marketing-section--navy marketing-pattern"
        aria-labelledby="perspectives-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center marketing-heading--inverse">
            <span>Vantagem mútua</span>
            <h2 id="perspectives-title">Duas perspetivas para o mesmo ecossistema.</h2>
          </div>
          <div className="marketing-perspectives">
            <article>
              <h3>Para os clientes</h3>
              <p>Uma forma clara de valorizar compras recorrentes sem cartões físicos.</p>
              <ul>
                <li>
                  <Check size={16} />
                  Registo gratuito e imediato.
                </li>
                <li>
                  <Check size={16} />
                  Vários cartões numa única área.
                </li>
                <li>
                  <Check size={16} />
                  Pontos e equivalente promocional em MZN.
                </li>
                <li>
                  <Check size={16} />
                  Histórico de movimentos.
                </li>
              </ul>
            </article>
            <article>
              <h3>Para os negócios</h3>
              <p>Ferramentas para criar relações duradouras e acompanhar o programa.</p>
              <ul>
                <li>
                  <Check size={16} />
                  Configuração do programa próprio.
                </li>
                <li>
                  <Check size={16} />
                  Regras de pontos e utilização.
                </li>
                <li>
                  <Check size={16} />
                  Painel e histórico auditável.
                </li>
                <li>
                  <Check size={16} />
                  POS, campanhas e gestão da equipa.
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="marketing-quote marketing-pattern marketing-pattern--light">
        <div className="marketing-container">
          <span aria-hidden="true">“</span>
          <blockquote>
            Cada movimento de pontos permanece ligado ao cliente, ao negócio emissor e à transação
            que lhe deu origem.
          </blockquote>
          <p>Clareza para o cliente. Controlo para o negócio.</p>
        </div>
      </section>
    </PublicSiteShell>
  );
}
