import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Megaphone,
  QrCode,
  Star,
  UsersRound
} from "lucide-react";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";

export const metadata: Metadata = {
  title: "Para negócios",
  description: "Crie e gira um programa de fidelização digital VUYELA para o seu negócio.",
  alternates: { canonical: "/negocios" }
};

const capabilities = [
  {
    body: "Personalize completamente as regras de atribuição de YELAS, campanhas exclusivas e datas especiais como aniversários dos seus clientes.",
    icon: Star,
    title: "Programa próprio de fidelização"
  },
  {
    body: "Atribua YELAS de forma rápida e segura. Basta ler o código QR único do cliente através do telemóvel do operador.",
    icon: QrCode,
    title: "Regras simples para atribuir YELAS"
  },
  {
    body: "Mantenha um registo limpo e transparente de todas as transações, YELAS emitidas e resgatados para uma reconciliação contabilística diária impecável.",
    icon: ClipboardList,
    title: "Histórico preparado para auditoria"
  },
  {
    body: "Integre de forma fluida com os seus sistemas de faturação POS existentes e lance campanhas segmentadas para os seus clientes.",
    icon: Megaphone,
    title: "Base para POS e campanhas"
  }
];

export default function BusinessesPage() {
  return (
    <PublicSiteShell active="business">
      <section
        className="marketing-business-hero marketing-pattern"
        aria-labelledby="businesses-title"
      >
        <div className="marketing-container marketing-business-hero__inner">
          <div className="marketing-heading marketing-heading--inverse">
            <span>VUYELA para empresas</span>
            <h1 id="businesses-title">
              Clientes que voltam. Negócios que <em>crescem.</em>
            </h1>
            <p>
              Crie o seu próprio programa de fidelização em minutos. Configure regras de YELAS
              personalizadas, conheça as preferências dos seus clientes e automatize campanhas com
              base em dados de consumo reais.
            </p>
            <div className="marketing-actions">
              <Link className="marketing-button marketing-button--teal" href="/cadastrar/negocio">
                Criar programa gratuito <ArrowRight size={16} />
              </Link>
              <Link className="marketing-button marketing-button--outline" href="#demonstracao">
                Ver demonstração
              </Link>
            </div>
          </div>
          <div
            className="marketing-dashboard-visual"
            aria-label="Exemplo do painel de desempenho VUYELA"
          >
            <div className="marketing-dashboard-visual__top">
              <strong>Painel de Gestão</strong>
              <span>Live</span>
            </div>
            <dl>
              <div>
                <dt>Clientes</dt>
                <dd>1.240</dd>
              </div>
              <div>
                <dt>Retorno</dt>
                <dd>+35%</dd>
              </div>
            </dl>
            <div className="marketing-chart" id="demonstracao" aria-hidden="true">
              {[38, 61, 82, 49, 96].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--navy marketing-pattern"
        aria-labelledby="capabilities-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center marketing-heading--inverse">
            <span>Proposta de valor</span>
            <h2 id="capabilities-title">Tudo o que precisa para fidelizar e reter clientes.</h2>
          </div>
          <div className="marketing-capability-grid">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <article key={capability.title}>
                  <Icon size={20} />
                  <h3>{capability.title}</h3>
                  <p>{capability.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--light"
        aria-labelledby="analytics-title"
      >
        <div className="marketing-container marketing-feature-row">
          <div className="marketing-heading">
            <span>Painel intuitivo</span>
            <h2 id="analytics-title">Gira o seu programa com analítica robusta.</h2>
            <p>
              Aceda a um painel de administração completo e desenhado para uma utilização diária sem
              complicações técnicas. Conheça as métricas que guiam as decisões do seu negócio.
            </p>
            <ul className="marketing-check-list">
              <li>
                <Check size={16} />
                Analítica em tempo real de clientes e transações.
              </li>
              <li>
                <Check size={16} />
                Gestão de campanhas e ofertas promocionais.
              </li>
              <li>
                <Check size={16} />
                Controlo rigoroso e auditoria de YELAS ativos.
              </li>
              <li>
                <Check size={16} />
                Relatórios automáticos de poupança e desempenho de vendas.
              </li>
            </ul>
          </div>
          <div className="marketing-metrics-panel">
            <div>
              <BarChart3 size={20} />
              <span>YELAS emitidas</span>
              <strong>158.300</strong>
            </div>
            <div>
              <UsersRound size={20} />
              <span>Novos registos</span>
              <strong>+342</strong>
            </div>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--plain"
        aria-labelledby="integration-title"
      >
        <div className="marketing-container marketing-feature-row marketing-feature-row--reverse">
          <div className="marketing-integration-panel">
            <QrCode size={24} />
            <strong>Sistema VUYELA integrado</strong>
            <span>QR Code</span>
            <span>Número do cartão</span>
            <span>Telefone opcional</span>
          </div>
          <div className="marketing-heading">
            <span>Integração simples</span>
            <h2 id="integration-title">Compatível com o seu sistema de vendas.</h2>
            <p>
              Não precisa de investir em novos terminais. A VUYELA funciona no navegador e pode
              integrar-se com o seu software de faturação atual, mantendo todas as operações de
              YELAS validadas no servidor.
            </p>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--soft marketing-success-section"
        aria-labelledby="success-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center">
            <span>Casos de sucesso</span>
            <h2 id="success-title">Histórias de crescimento em Moçambique</h2>
          </div>
          <div className="marketing-success-grid">
            <article>
              <h3>“Crescimento real de 35%”</h3>
              <p>
                “Com o programa da VUYELA, conseguimos crescer a taxa de retorno dos clientes em
                mais de 35% nos primeiros três meses.”
              </p>
              <strong>Délio Manjate</strong>
              <small>Proprietário, Restaurante Marés</small>
            </article>
            <article>
              <h3>“Mais saúde, mais fidelidade”</h3>
              <p>
                “Os clientes adoram acumular YELAS na nossa farmácia para descontar em produtos de
                higiene. O sistema é simples para a equipa usar diariamente.”
              </p>
              <strong>Dra. Amina Isa</strong>
              <small>Diretora, Farmácia Mais Saúde</small>
            </article>
          </div>
        </div>
      </section>

      <section className="marketing-cta marketing-pattern">
        <div className="marketing-container">
          <h2>Comece hoje — primeiro mês grátis</h2>
          <p>Transforme clientes casuais em visitas recorrentes. Cancele quando quiser.</p>
          <form action="/cadastrar/negocio" method="get">
            <label className="sr-only" htmlFor="business-email">
              E-mail corporativo
            </label>
            <input
              id="business-email"
              name="email"
              placeholder="O seu e-mail corporativo"
              type="email"
            />
            <button className="marketing-button marketing-button--teal" type="submit">
              Criar programa de fidelização
            </button>
          </form>
        </div>
      </section>
    </PublicSiteShell>
  );
}
