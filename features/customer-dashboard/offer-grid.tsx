"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import type { CustomerExploreOffer } from "./model";

interface CustomerOfferGridProps {
  offers: CustomerExploreOffer[];
  limit?: number;
  showFilters?: boolean;
}

export function CustomerOfferGrid({ offers, limit, showFilters = false }: CustomerOfferGridProps) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => {
    const unique = new Map<string, string>();

    for (const offer of offers) {
      if (offer.categorySlug && offer.categoryName) {
        unique.set(offer.categorySlug, offer.categoryName);
      }
    }

    return Array.from(unique, ([slug, name]) => ({ slug, name }));
  }, [offers]);
  const filteredOffers =
    category === "all" ? offers : offers.filter((offer) => offer.categorySlug === category);
  const visibleOffers = typeof limit === "number" ? filteredOffers.slice(0, limit) : filteredOffers;

  if (offers.length === 0) {
    return (
      <div className="customer-dashboard-section-empty" role="status">
        <h3>Sem ofertas públicas</h3>
        <p>As campanhas dos estabelecimentos parceiros aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <>
      {showFilters ? (
        <nav className="customer-offer-filters" aria-label="Categorias de ofertas">
          <button
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            type="button"
          >
            Todas
          </button>
          {categories.map((item) => (
            <button
              aria-pressed={category === item.slug}
              key={item.slug}
              onClick={() => setCategory(item.slug)}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="customer-offer-grid">
        {visibleOffers.map((offer, index) => (
          <article className="customer-offer-card" key={offer.id}>
            <div className="customer-offer-card__image">
              <Image
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 32vw"
                src={index % 2 === 0 ? "/images/offer-prawns.jpg" : "/images/offer-bakery.jpg"}
              />
              <span>{offer.categoryName ?? "Oferta"}</span>
            </div>
            <div>
              <small>{offer.businessName}</small>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <Link href={offer.href ?? "/ofertas"}>Ver oferta</Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
