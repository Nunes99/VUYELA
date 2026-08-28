"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import React, { useMemo, useState } from "react";

import { CustomerCardVisual } from "@/features/customer-cards/customer-card-visual";
import type { DigitalCustomerCard } from "@/features/customer-cards/model";

type CardFilter = "all" | "active" | "blocked" | "favorites";

const filters: Array<{ id: CardFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "blocked", label: "Bloqueados" },
  { id: "favorites", label: "Favoritos" }
];

export function CustomerCardHub({ cards }: { cards: DigitalCustomerCard[] }) {
  const [filter, setFilter] = useState<CardFilter>("all");
  const visibleCards = useMemo(
    () =>
      cards.filter((card) => {
        if (filter === "active") return card.status === "active";
        if (filter === "blocked") return card.status !== "active";
        if (filter === "favorites") return Boolean(card.isFavorite);
        return true;
      }),
    [cards, filter]
  );

  return (
    <>
      <div className="customer-card-filters" aria-label="Filtrar cartões">
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.id}
            className={filter === item.id ? "is-active" : undefined}
            key={item.id}
            onClick={() => setFilter(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="customer-cards-hub-grid">
        {visibleCards.map((card) => (
          <Link
            aria-label={`Abrir cartão ${card.businessName}`}
            className="customer-card-hub-item"
            href={`/cliente?vista=cartoes&cartao=${encodeURIComponent(card.id)}`}
            key={card.id}
          >
            <CustomerCardVisual card={card} compact />
            <div className="customer-card-hub-item__content">
              <span>{card.currentTierName}</span>
              <h3>{card.businessName}</h3>
              <strong>{card.availablePoints.toLocaleString("pt-MZ")} YL</strong>
            </div>
            <ChevronRight aria-hidden="true" size={18} />
          </Link>
        ))}
        {visibleCards.length === 0 ? (
          <div
            className={[
              "customer-dashboard-section-empty",
              "customer-dashboard-section-empty--compact"
            ].join(" ")}
          >
            <h3>Sem cartões neste filtro</h3>
            <p>Escolha outro filtro ou adira ao cartão de um novo negócio.</p>
          </div>
        ) : null}
        <Link className="customer-add-card" href="/cliente?vista=negocios">
          <Plus aria-hidden="true" size={16} /> Adicionar novo cartão digital
        </Link>
      </div>
    </>
  );
}
