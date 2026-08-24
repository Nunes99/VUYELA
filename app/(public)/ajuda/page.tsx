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
    category: "Clientes",
    question: "Como posso acumular pontos?",
    answer:
      "Ao pagar num estabelecimento parceiro, apresente o QR Code no seu telemóvel para o operador fazer a leitura rápida."
  },
  {
    category: "Clientes",
    question: "Os pontos têm valor monetário fora da rede?",
    answer:
      "Não. Os pontos representam descontos promocionais exclusivos e benefícios em compras futuras nos parceiros."
  },
  {
    category: "Clientes",
    question: "Posso transferir pontos para outro número?",
    answer:
      "Não. Os pontos acumulados são de gestão direta e pessoal, associados ao número de telefone registado."
  },
  {
    category: "Clientes",
    question: "Como funciona o resgate de recompensas?",
    answer:
      "Basta indicar ao operador que deseja descontar os seus pontos disponíveis no momento do pagamento."
  },
  {
    category: "Negócios",
    question: "É possível gerir múltiplas lojas como negócio?",
    answer:
      "Sim, o nosso painel corporativo permite gerir várias filiais físicas com relatórios unificados."
  },
  {
    category: "Negócios",
    question: "Onde posso integrar a API de vendas?",
    answer: "A equipa VUYELA apoia a preparação de integrações com sistemas de faturação digital."
  }
];

export default function HelpPage() {
  return (
    <PublicSiteShell active="help">
      <FaqExplorer items={faqItems} pageLayout />

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
              <h3>Email de suporte</h3>
              <a href="mailto:suporte@vuyela.co.mz">suporte@vuyela.co.mz</a>
              <p>Resposta rápida no prazo de 24 horas.</p>
            </article>
            <article>
              <MessageSquareText size={22} />
              <h3>WhatsApp</h3>
              <a href="https://wa.me/258841234567">+258 84 123 4567</a>
              <p>Disponível todos os dias das 8h às 18h.</p>
            </article>
            <article>
              <Clock3 size={22} />
              <h3>Horário</h3>
              <strong>Seg a Sex, 8h às 18h</strong>
              <p>Fins de semana encerrados.</p>
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
            <h2 id="resources-title">Recursos para programadores</h2>
          </div>
          <div className="marketing-resource-links">
            <Link href="/como-funciona">
              <BookOpen size={19} />
              Documentação da API
            </Link>
            <Link href="/precos">
              <FileText size={19} />
              Termos e condições
            </Link>
            <Link href="/estabelecimentos">
              <ShieldCheck size={19} />
              Políticas de privacidade
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
