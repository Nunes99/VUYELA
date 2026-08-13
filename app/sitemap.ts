import type { MetadataRoute } from "next";

import { getPublicMarketplaceSnapshot } from "@/features/public-marketplace/data";
import {
  isIndexableCategory,
  isIndexableCity,
  isIndexableCityCategory,
  isIndexableOffer
} from "@/features/public-marketplace/model";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const marketplace = await getPublicMarketplaceSnapshot();
  const snapshot = marketplace.snapshot;
  const now = new Date();
  const publicRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    }
  ];

  if (snapshot.businesses.length > 0) {
    publicRoutes.push({
      url: `${siteUrl}/estabelecimentos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    });
  }

  if (snapshot.categories.length > 0) {
    publicRoutes.push({
      url: `${siteUrl}/categorias`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    });
  }

  if (snapshot.cities.length > 0) {
    publicRoutes.push({
      url: `${siteUrl}/locais`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    });
  }

  if (snapshot.offers.length > 0) {
    publicRoutes.push({
      url: `${siteUrl}/ofertas`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8
    });
  }

  return [
    ...publicRoutes,
    ...snapshot.businesses.map((business) => ({
      url: `${siteUrl}/estabelecimentos/${business.slug}`,
      lastModified: business.activatedAt ? new Date(business.activatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.85
    })),
    ...snapshot.categories.filter(isIndexableCategory).map((category) => ({
      url: `${siteUrl}/categorias/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...snapshot.cities.filter(isIndexableCity).map((city) => ({
      url: `${siteUrl}/locais/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...snapshot.cityCategories.filter(isIndexableCityCategory).map((item) => ({
      url: `${siteUrl}/locais/${item.city.slug}/${item.category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6
    })),
    ...snapshot.offers.filter(isIndexableOffer).map((offer) => ({
      url: `${siteUrl}/ofertas/${offer.slug}`,
      lastModified: offer.startsAt ? new Date(offer.startsAt) : now,
      changeFrequency: "daily" as const,
      priority: 0.75
    }))
  ];
}
