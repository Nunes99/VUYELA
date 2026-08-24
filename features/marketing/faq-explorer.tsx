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

export function FaqExplorer({ items }: { items: MarketingFaqItem[] }) {
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

  return (
    <div className="faq-browser">
      <label className="faq-browser__search">
        <Search aria-hidden="true" size={18} />
        <span className="sr-only">Pesquisar perguntas frequentes</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquise por pontos, POS ou cartões"
          type="search"
          value={query}
        />
      </label>

      <div className="faq-browser__filters" aria-label="Filtrar perguntas por tema">
        {categories.map((item) => (
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
          <details key={item.question}>
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
    </div>
  );
}
