import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock3, FileText, Mail, MessageSquareText, ShieldCheck } from "lucide-react";

import { PublicSiteShell } from "@/components/marketing/public-site-shell";
import { FaqExplorer, type MarketingFaqItem } from "@/features/marketing/faq-explorer";

export const metadata: Metadata = {
  title: "Ajuda e perguntas frequentes",
  description: "Respostas sobre cartões, pontos, POS, negócios e segurança na VUYELA.",
  alternates: { canonical: "/ajuda" }
};

const faqItems: MarketingFaqItem[] = [
  {
    category: "Geral",
    question: "Os pontos podem ser levantados em dinheiro?",
    answer:
      "Não. Os pontos representam valor promocional no negócio emissor e não são saldo bancário, numerário ou moeda eletrónica."
  },
  {
    category: "Clientes",
    question: "Posso usar pontos noutro negócio?",
    answer:
      "Não. Cada carteira pertence ao negócio que atribuiu os pontos e só pode ser utilizada nesse mesmo programa."
  },
  {
    category: "Geral",
    question: "A VUYELA assume a responsabilidade financeira pelos pontos?",
    answer:
      "Não. A responsabilidade promocional pertence ao negócio emissor. A VUYELA calcula, valida e regista os movimentos."
  },
  {
    category: "Negócios",
    question: "Como configuro o POS VUYELA?",
    answer:
      "Depois da aprovação do negócio, os utilizadores autorizados podem aceder ao POS e selecionar a filial atribuída."
  },
  {
    category: "Pagamentos",
    question: "Que métodos existem para pagar a subscrição?",
    answer:
      "A recolha automática ainda não está ativa. As condições são confirmadas diretamente pela equipa VUYELA durante a adesão."
  },
  {
    category: "Técnico",
    question: "Como é identificado o cliente no POS?",
    answer:
      "O POS aceita um QR válido, o número do cartão ou, quando disponível, o telefone associado ao cliente."
  },
  {
    category: "Negócios",
    question: "Posso gerir várias filiais?",
    answer:
      "Sim, desde que o plano ativo permita a capacidade necessária. As permissões podem ser limitadas por filial."
  },
  {
    category: "Técnico",
    question: "Como funciona a segurança dos saldos?",
    answer:
      "As alterações de saldo são executadas no servidor, dentro de transações PostgreSQL, e criam sempre movimentos no ledger."
  }
];

export default function HelpPage() {
  return (
    <PublicSiteShell active="help">
      <section className="marketing-help-hero marketing-pattern" aria-labelledby="help-title">
        <div className="marketing-container marketing-heading marketing-heading--center marketing-heading--inverse">
          <span>Centro de ajuda</span>
          <h1 id="help-title">Perguntas frequentes e suporte.</h1>
          <p>Encontre respostas sobre pontos, segurança, cartões e operação do negócio.</p>
        </div>
      </section>

      <section className="marketing-section marketing-section--plain">
        <div className="marketing-container">
          <FaqExplorer items={faqItems} />
        </div>
      </section>

      <section
        className="marketing-section marketing-section--soft"
        aria-labelledby="support-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center">
            <span>Suporte humano</span>
            <h2 id="support-title">Ainda tem dúvidas? Fale connosco.</h2>
          </div>
          <div className="marketing-support-grid">
            <article>
              <Mail size={22} />
              <h3>E-mail de suporte</h3>
              <a href="mailto:suporte@vuyela.co.mz">suporte@vuyela.co.mz</a>
              <p>Resposta nos dias úteis.</p>
            </article>
            <article>
              <MessageSquareText size={22} />
              <h3>Suporte ao cliente</h3>
              <Link href="/conta">Abrir a área da conta</Link>
              <p>Consulte primeiro a sua sessão e os dados da conta.</p>
            </article>
            <article>
              <Clock3 size={22} />
              <h3>Horário de atendimento</h3>
              <strong>Segunda a sexta-feira</strong>
              <p>Pedidos críticos de segurança são priorizados.</p>
            </article>
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-section--light"
        aria-labelledby="resources-title"
      >
        <div className="marketing-container">
          <div className="marketing-heading marketing-heading--center">
            <h2 id="resources-title">Recursos úteis</h2>
          </div>
          <div className="marketing-resource-links">
            <Link href="/como-funciona">
              <BookOpen size={19} />
              Como funciona
            </Link>
            <Link href="/precos">
              <FileText size={19} />
              Planos e preços
            </Link>
            <Link href="/estabelecimentos">
              <ShieldCheck size={19} />
              Negócios publicados
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
