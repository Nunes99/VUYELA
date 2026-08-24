"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

export type FaqCategory = "Geral" | "Clientes" | "Negócios" | "Pagamentos" | "Técnico";

export interface MarketingFaqItem {
  answer: string;
  category: FaqCategory;
  question: string;
}

const categories: FaqCategory[] = ["Geral", "Clientes", "Negócios", "Pagamentos", "Técnico"];

interface FaqExplorerProps {
  items: MarketingFaqItem[];
  pageLayout?: boolean;
}

export function FaqExplorer({ items, pageLayout = false }: FaqExplorerProps) {
  const [category, setCategory] = useState<FaqCategory>("Geral");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-MZ");
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const categoryMatches = category === "Geral" || item.category === category;
        const textMatches =
          normalizedQuery.length === 0 ||
          `${item.question} ${item.answer}`.toLocaleLowerCase("pt-MZ").includes(normalizedQuery);

        return categoryMatches && textMatches;
      }),
    [category, items, normalizedQuery]
  );

  const visibleCategories = pageLayout ? categories.slice(0, 3) : categories;
  const search = (
    <label className="faq-browser__search">
      <Search aria-hidden="true" size={18} />
      <span className="sr-only">Pesquisar perguntas frequentes</span>
      <input
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pesquise por pontos, cartões ou negócios"
        type="search"
        value={query}
      />
    </label>
  );
  const content = (
    <>
      <div className="faq-browser__filters" aria-label="Filtrar perguntas por tema">
        {visibleCategories.map((item) => (
          <button
            aria-pressed={category === item}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="faq-browser__items">
        {visibleItems.map((item) => (
          <details key={item.question} open={pageLayout || undefined}>
            <summary>
              <span>{item.question}</span>
              <ChevronRight aria-hidden="true" size={18} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
        {visibleItems.length === 0 ? (
          <p className="faq-browser__empty">Não encontrámos uma resposta com esses filtros.</p>
        ) : null}
      </div>
    </>
  );

  if (pageLayout) {
    return (
      <div className="faq-browser faq-browser--page">
        <section className="marketing-help-hero marketing-pattern" aria-labelledby="help-title">
          <div className="marketing-container marketing-heading marketing-heading--center marketing-heading--inverse">
            <span>Centro de ajuda</span>
            <h1 id="help-title">Perguntas Frequentes &amp; Suporte</h1>
            <p>Encontre respostas rápidas sobre pontos, segurança e gestão do seu negócio.</p>
            {search}
          </div>
        </section>
        <section className="marketing-section marketing-section--plain">
          <div className="marketing-container faq-browser__body">{content}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="faq-browser">
      {search}
      {content}
    </div>
  );
}
