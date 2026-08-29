"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, BellOff, CheckCircle2, Heart, X } from "lucide-react";
import React, { useMemo, useState } from "react";

import {
  activateCustomerOfferAction,
  cancelCustomerOfferClaimAction,
  updateCustomerBusinessPreferenceAction
} from "./actions";
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
        {visibleOffers.map((offer) => (
          <article className="customer-offer-card" key={offer.id}>
            <div className="customer-offer-card__image">
              <Image
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 32vw"
                src={offer.imageUrl ?? "/images/offer-prawns.jpg"}
                unoptimized={Boolean(offer.imageUrl)}
              />
              <span>{offer.categoryName ?? "Oferta"}</span>
            </div>
            <div>
              <div className="customer-offer-card__heading">
                <small>{offer.businessName}</small>
                {offer.customerCardId ? (
                  <div className="customer-offer-card__preferences">
                    <PreferenceForm
                      icon={Heart}
                      label={offer.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      offer={offer}
                      nextFavorite={!offer.isFavorite}
                      nextNotifications={offer.offerNotificationsEnabled}
                      pressed={offer.isFavorite}
                    />
                    <PreferenceForm
                      icon={offer.offerNotificationsEnabled ? Bell : BellOff}
                      label={
                        offer.offerNotificationsEnabled
                          ? "Desativar avisos deste negócio"
                          : "Ativar avisos deste negócio"
                      }
                      offer={offer}
                      nextFavorite={offer.isFavorite}
                      nextNotifications={!offer.offerNotificationsEnabled}
                      pressed={offer.offerNotificationsEnabled}
                    />
                  </div>
                ) : null}
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              {offer.claimStatus === "activated" && offer.claimId ? (
                <div className="customer-offer-claim">
                  <span>
                    <CheckCircle2 aria-hidden="true" size={16} /> Oferta ativa
                  </span>
                  <strong>{offer.claimCode}</strong>
                  <small>
                    {offer.claimExpiresAt
                      ? `Válida até ${formatDate(offer.claimExpiresAt)}`
                      : "Sem data limite"}
                  </small>
                  <form action={cancelCustomerOfferClaimAction}>
                    <input name="claimId" type="hidden" value={offer.claimId} />
                    <input name="offerId" type="hidden" value={offer.id} />
                    <button type="submit">
                      <X aria-hidden="true" size={14} /> Cancelar
                    </button>
                  </form>
                </div>
              ) : (
                <div className="customer-offer-card__actions">
                  <Link href={offer.href ?? "/ofertas"}>Ver oferta</Link>
                  {offer.customerCardId && offer.claimStatus !== "redeemed" ? (
                    <form action={activateCustomerOfferAction}>
                      <input name="offerId" type="hidden" value={offer.id} />
                      <input name="customerCardId" type="hidden" value={offer.customerCardId} />
                      <button type="submit">Ativar benefício</button>
                    </form>
                  ) : null}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function PreferenceForm({
  icon: Icon,
  label,
  nextFavorite,
  nextNotifications,
  offer,
  pressed
}: {
  icon: typeof Heart;
  label: string;
  nextFavorite: boolean;
  nextNotifications: boolean;
  offer: CustomerExploreOffer;
  pressed: boolean;
}) {
  return (
    <form action={updateCustomerBusinessPreferenceAction}>
      <input name="businessId" type="hidden" value={offer.businessId} />
      <input name="offerId" type="hidden" value={offer.id} />
      <input name="isFavorite" type="hidden" value={String(nextFavorite)} />
      <input name="offerNotificationsEnabled" type="hidden" value={String(nextNotifications)} />
      <button aria-label={label} aria-pressed={pressed} title={label} type="submit">
        <Icon aria-hidden="true" size={16} />
      </button>
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium" }).format(new Date(value));
}
