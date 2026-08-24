import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Megaphone,
  QrCode,
  ShieldCheck,
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
    body: "Personalize regras, campanhas e benefícios sem alterar a lógica financeira do seu negócio.",
    icon: Star,
    title: "Programa próprio de fidelização"
  },
  {
    body: "Atribua pontos através do POS com identificação por QR, cartão ou telefone.",
    icon: QrCode,
    title: "Regras simples para atribuir pontos"
  },
  {
    body: "Consulte movimentos e mantenha o ledger preparado para reconciliação e auditoria.",
    icon: ClipboardList,
    title: "Histórico preparado para auditoria"
  },
  {
    body: "Segmente públicos, publique ofertas e acompanhe a entrega das campanhas.",
    icon: Megaphone,
    title: "Base para POS e campanhas"
  }
];

export default function BusinessesPage() {
  return (
    <PublicSiteShell active="business">
      <section className="marketing-business-hero" aria-labelledby="businesses-title">
        <div className="marketing-container marketing-business-hero__inner">
          <div className="marketing-heading marketing-heading--inverse">
            <span>VUYELA para empresas</span>
            <h1 id="businesses-title">
              Clientes que voltam. Negócios que <em>crescem.</em>
            </h1>
            <p>
              Crie o seu programa, configure regras de pontos e acompanhe os hábitos dos clientes
              através de dados reais do seu próprio negócio.
            </p>
            <div className="marketing-actions">
              <Link className="marketing-button marketing-button--teal" href="/onboarding/negocio">
                Registar o meu negócio <ArrowRight size={16} />
              </Link>
              <Link className="marketing-button marketing-button--outline" href="/ajuda">
                Falar com a equipa
              </Link>
            </div>
          </div>
          <div
            className="marketing-dashboard-visual"
            aria-label="Exemplo do painel de desempenho VUYELA"
          >
            <div className="marketing-dashboard-visual__top">
              <strong>VUYELA Business Portal</strong>
              <span>Atualizado em tempo real</span>
            </div>
            <dl>
              <div>
                <dt>Clientes fidelizados</dt>
                <dd>2.480</dd>
              </div>
              <div>
                <dt>Volume acompanhado</dt>
                <dd>450.000 MZN</dd>
              </div>
            </dl>
            <div className="marketing-chart" aria-hidden="true">
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
            <h2 id="analytics-title">Gira o programa com analítica clara.</h2>
            <p>Consulte indicadores sem perder o contexto de cada filial e de cada movimento.</p>
            <ul className="marketing-check-list">
              <li>
                <Check size={16} />
                Clientes, transações e pontos.
              </li>
              <li>
                <Check size={16} />
                Campanhas e públicos elegíveis.
              </li>
              <li>
                <Check size={16} />
                Responsabilidade promocional em MZN.
              </li>
              <li>
                <Check size={16} />
                Relatórios e histórico auditável.
              </li>
            </ul>
          </div>
          <div className="marketing-metrics-panel">
            <div>
              <BarChart3 size={20} />
              <span>Pontos emitidos</span>
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
            <strong>POS VUYELA</strong>
            <span>QR Code</span>
            <span>Número do cartão</span>
            <span>Telefone opcional</span>
          </div>
          <div className="marketing-heading">
            <span>Integração simples</span>
            <h2 id="integration-title">Compatível com a operação diária do seu negócio.</h2>
            <p>
              Utilize o POS VUYELA no navegador ou prepare integrações com os sistemas que já usa,
              mantendo todas as operações de pontos validadas no servidor.
            </p>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--soft"
        aria-labelledby="control-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center">
            <span>Controlo operacional</span>
            <h2 id="control-title">Cresça sem perder segurança nem contexto.</h2>
          </div>
          <div className="marketing-control-grid">
            <article>
              <ShieldCheck size={22} />
              <h3>Permissões por função</h3>
              <p>Proprietários, administradores, gestores de filial e operadores de caixa.</p>
            </article>
            <article>
              <UsersRound size={22} />
              <h3>Gestão de equipa</h3>
              <p>Acesso limitado ao negócio e à filial atribuída.</p>
            </article>
            <article>
              <ClipboardList size={22} />
              <h3>Auditoria completa</h3>
              <p>Operações sensíveis registadas com identidade, data e contexto.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="marketing-cta marketing-pattern">
        <div className="marketing-container">
          <h2>Comece hoje com o plano adequado ao seu negócio.</h2>
          <p>Crie a conta, configure o programa e acompanhe a operação num único lugar.</p>
          <Link className="marketing-button marketing-button--teal" href="/onboarding/negocio">
            Criar programa de fidelização
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
