"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgePercent, Gift } from "lucide-react";
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MarketplaceOffer } from "@/features/public-marketplace/model";

type OfferCategory = "all" | "eat" | "care" | "shop" | "discover";

const FILTERS: ReadonlyArray<{ key: OfferCategory; label: string }> = [
  { key: "all", label: "Tudo" },
  { key: "eat", label: "Comer" },
  { key: "care", label: "Cuidar" },
  { key: "shop", label: "Comprar" },
  { key: "discover", label: "Descobrir" }
];

const CATEGORY_KEYWORDS: Record<Exclude<OfferCategory, "all" | "discover">, readonly string[]> = {
  eat: ["alimentacao", "cafe", "comida", "mercearia", "padaria", "restaurante"],
  care: ["barbearia", "beleza", "clinica", "farmacia", "salao", "saude", "spa"],
  shop: ["compras", "loja", "moda", "produto", "supermercado", "tecnologia"]
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-MZ");
}

function getOfferCategory(offer: MarketplaceOffer): Exclude<OfferCategory, "all"> {
  const searchable = normalize(
    [offer.categoryName, offer.categorySlug, offer.title, offer.description]
      .filter(Boolean)
      .join(" ")
  );

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [keyof typeof CATEGORY_KEYWORDS, readonly string[]]
  >) {
    if (keywords.some((keyword) => searchable.includes(keyword))) {
      return category;
    }
  }

  return "discover";
}

function getOfferHref(offer: MarketplaceOffer): string {
  return offer.uniquePublicSlug
    ? `/ofertas/${offer.slug}`
    : `/estabelecimentos/${offer.businessSlug}`;
}

function getOfferSignal(offer: MarketplaceOffer): string {
  const source = `${offer.title} ${offer.description}`;
  return (
    source.match(/\d+(?:[.,]\d+)?\s*%/i)?.[0]?.replace(/\s/g, "") ??
    source.match(/\d+(?:[.,]\d+)?\s*x/i)?.[0]?.replace(/\s/g, "") ??
    "YL"
  );
}

function getOfferValidity(offer: MarketplaceOffer): string {
  if (!offer.endsAt) return "Disponível agora";

  return `Até ${new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short"
  }).format(new Date(offer.endsAt))}`;
}

function scrollViewportTo(viewport: HTMLDivElement, left: number): void {
  if (typeof viewport.scrollTo === "function") {
    viewport.scrollTo({ left, behavior: "smooth" });
    return;
  }

  viewport.scrollLeft = left;
}

function OfferImage({ offer, sizes }: { offer: MarketplaceOffer; sizes: string }) {
  if (!offer.imageUrl) {
    return (
      <span className="rv-editorial-card__placeholder" aria-hidden="true">
        <Gift size={32} />
        VUYELA
      </span>
    );
  }

  return (
    <Image
      alt={`${offer.title}, por ${offer.businessName}`}
      fill
      sizes={sizes}
      src={offer.imageUrl}
      unoptimized
    />
  );
}

function OfferSlide({ offer, index }: { offer: MarketplaceOffer; index: number }) {
  const variants = ["featured", "gold", "photo", "teal"] as const;
  const variant = variants[index % variants.length];
  const signal = getOfferSignal(offer);
  const href = getOfferHref(offer);

  if (variant === "gold" || variant === "teal") {
    return (
      <article className={`rv-editorial-card rv-editorial-card--${variant}`}>
        <span className="rv-editorial-card__word" aria-hidden="true">
          {signal}
        </span>
        <p>{offer.categoryName ?? "Benefício VUYELA"}</p>
        <h3>{offer.title}</h3>
        <small>{offer.businessName}</small>
        <Link href={href}>
          Ver benefício <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </article>
    );
  }

  return (
    <article className={`rv-editorial-card rv-editorial-card--${variant}`}>
      <OfferImage
        offer={offer}
        sizes={variant === "featured" ? "(max-width: 800px) 100vw, 720px" : "300px"}
      />
      <span className="rv-editorial-card__shade" aria-hidden="true" />
      <div className="rv-editorial-card__content">
        <p>
          {offer.businessName} · {getOfferValidity(offer)}
        </p>
        <strong>{signal}</strong>
        <h3>{offer.title}</h3>
        <Link href={href}>
          Descobrir oferta <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  );
}

export function OfferEditorialCarousel({
  offers,
  unavailable = false
}: {
  offers: MarketplaceOffer[];
  unavailable?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<OfferCategory>("all");
  const viewportRef = useRef<HTMLDivElement>(null);
  const filteredOffers = useMemo(
    () =>
      activeFilter === "all"
        ? offers
        : offers.filter((offer) => getOfferCategory(offer) === activeFilter),
    [activeFilter, offers]
  );

  const move = useCallback((direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const firstOffer = viewport?.querySelector<HTMLElement>("article");
    if (!viewport || !firstOffer) return;

    const distance = firstOffer.getBoundingClientRect().width + 14;
    const reachedEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 8;
    const reachedStart = viewport.scrollLeft <= 8;

    if (direction > 0 && reachedEnd) {
      scrollViewportTo(viewport, 0);
      return;
    }

    if (direction < 0 && reachedStart) {
      scrollViewportTo(viewport, viewport.scrollWidth);
      return;
    }

    scrollViewportTo(viewport, viewport.scrollLeft + direction * distance);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) scrollViewportTo(viewport, 0);
  }, [activeFilter]);

  useEffect(() => {
    if (
      filteredOffers.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => move(1), 5200);
    return () => window.clearInterval(timer);
  }, [filteredOffers.length, move]);

  return (
    <>
      <div className="rv-container rv-offers__heading">
        <div>
          <p className="rv-eyebrow">SELECCIONADO PARA SI</p>
          <h2 id="offers-title">Hoje, a rede tem isto para oferecer.</h2>
        </div>
        <div className="rv-offers__tools">
          <div className="rv-offers__filters" aria-label="Filtrar ofertas" role="group">
            {FILTERS.map((filter) => (
              <button
                aria-pressed={activeFilter === filter.key}
                className={activeFilter === filter.key ? "is-active" : undefined}
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="rv-offers__controls" aria-label="Navegar pelas ofertas" role="group">
            <button
              aria-label="Oferta anterior"
              disabled={filteredOffers.length < 2}
              onClick={() => move(-1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
            <button
              aria-label="Oferta seguinte"
              disabled={filteredOffers.length < 2}
              onClick={() => move(1)}
              type="button"
            >
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="rv-container rv-offers__viewport" ref={viewportRef}>
        <div className="rv-offers__track">
          {filteredOffers.length > 0 ? (
            filteredOffers.map((offer, index) => (
              <OfferSlide index={index} key={offer.id} offer={offer} />
            ))
          ) : (
            <article className="rv-editorial-empty">
              <BadgePercent aria-hidden="true" size={28} />
              <div>
                <strong>
                  {unavailable
                    ? "A rede de ofertas está temporariamente indisponível."
                    : activeFilter === "all"
                      ? "As próximas ofertas estão a caminho."
                      : "Ainda não existem ofertas nesta categoria."}
                </strong>
                <p>Explore os negócios VUYELA enquanto preparamos novas vantagens para si.</p>
              </div>
              <Link href="/ofertas">
                Explorar a rede <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </article>
          )}
        </div>
      </div>
    </>
  );
}
