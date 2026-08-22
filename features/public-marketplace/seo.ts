import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/env";

import {
  getBusinessCityLabel,
  getBusinessPrimaryCity,
  getPointValueLabel,
  isIndexableBusiness,
  isIndexableOffer
} from "./model";
import type {
  MarketplaceBreadcrumb,
  MarketplaceBusiness,
  MarketplaceListViewModel,
  MarketplaceOffer,
  MarketplaceOfferViewModel
} from "./model";

export function buildMarketplaceListMetadata(viewModel: MarketplaceListViewModel): Metadata {
  return buildMetadata({
    title: viewModel.title,
    description: viewModel.description,
    canonicalPath: viewModel.canonicalPath,
    indexable: viewModel.indexable
  });
}

export function buildBusinessMetadata(business: MarketplaceBusiness): Metadata {
  const cityLabel = getBusinessCityLabel(business);

  return buildMetadata({
    title: `${business.name} - pontos e benefícios em ${cityLabel}`,
    description: business.description
      ? `${business.description} Veja pontos, filiais, regras e ofertas públicas de ${business.name}.`
      : `Conheça ${business.name}, as suas filiais e o programa de benefícios VUYELA.`,
    canonicalPath: `/estabelecimentos/${business.slug}`,
    indexable: isIndexableBusiness(business),
    imageUrl: business.coverUrl ?? business.logoUrl
  });
}

export function buildOfferMetadata(viewModel: MarketplaceOfferViewModel): Metadata {
  return buildMetadata({
    title: `${viewModel.offer.title} - ${viewModel.business.name}`,
    description: `${viewModel.offer.description} Oferta pública VUYELA de ${viewModel.business.name}.`,
    canonicalPath: `/ofertas/${viewModel.offer.slug}`,
    indexable: isIndexableOffer(viewModel.offer),
    imageUrl: viewModel.business.coverUrl ?? viewModel.business.logoUrl
  });
}

export function buildBreadcrumbJsonLd(items: MarketplaceBreadcrumb[]): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`
    }))
  };
}

export function buildItemListJsonLd(
  viewModel: MarketplaceListViewModel
): Record<string, unknown> | null {
  if (viewModel.businesses.length === 0 && viewModel.offers.length === 0) {
    return null;
  }

  const siteUrl = getSiteUrl();
  const businesses = viewModel.businesses.map((business, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${siteUrl}/estabelecimentos/${business.slug}`,
    name: business.name
  }));
  const offers = viewModel.offers.slice(0, 12).map((offer, index) => ({
    "@type": "ListItem",
    position: businesses.length + index + 1,
    url: `${siteUrl}${offer.uniquePublicSlug ? `/ofertas/${offer.slug}` : `/estabelecimentos/${offer.businessSlug}`}`,
    name: offer.title
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: viewModel.title,
    itemListElement: [...businesses, ...offers]
  };
}

export function buildLocalBusinessJsonLd(business: MarketplaceBusiness): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const primaryCity = getBusinessPrimaryCity(business);
  const primaryBranch =
    business.branches.find((branch) => branch.isPrimary) ?? business.branches[0];
  const geo =
    primaryBranch?.latitude !== null &&
    primaryBranch?.latitude !== undefined &&
    primaryBranch.longitude !== null &&
    primaryBranch.longitude !== undefined
      ? {
          "@type": "GeoCoordinates",
          latitude: primaryBranch.latitude,
          longitude: primaryBranch.longitude
        }
      : undefined;

  return omitUndefined({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: `${siteUrl}/estabelecimentos/${business.slug}`,
    description: business.description || undefined,
    image: business.coverUrl ?? business.logoUrl ?? undefined,
    logo: business.logoUrl ?? undefined,
    telephone: business.phone ?? primaryBranch?.phone ?? undefined,
    email: business.email ?? primaryBranch?.email ?? undefined,
    address: primaryBranch
      ? omitUndefined({
          "@type": "PostalAddress",
          streetAddress: primaryBranch.addressLine ?? undefined,
          addressLocality: primaryCity ?? undefined,
          addressRegion: primaryBranch.province ?? undefined,
          addressCountry: "MZ"
        })
      : undefined,
    geo,
    makesOffer: business.offers.map((offer) => buildOfferJsonLd(offer, business))
  });
}

export function buildOfferJsonLd(
  offer: MarketplaceOffer,
  business: MarketplaceBusiness
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return omitUndefined({
    "@type": "Offer",
    name: offer.title,
    description: offer.description,
    url: `${siteUrl}${offer.uniquePublicSlug ? `/ofertas/${offer.slug}` : `/estabelecimentos/${business.slug}`}`,
    validFrom: offer.startsAt ?? undefined,
    validThrough: offer.endsAt ?? undefined,
    offeredBy: {
      "@type": "LocalBusiness",
      name: business.name,
      url: `${siteUrl}/estabelecimentos/${business.slug}`
    }
  });
}

export function buildBusinessFaqJsonLd(business: MarketplaceBusiness): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Onde posso usar pontos de ${business.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Os pontos podem ser usados no próprio negócio emissor. ${getPointValueLabel(business.program)}.`
        }
      },
      {
        "@type": "Question",
        name: "Os pontos VUYELA podem ser levantados em dinheiro?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Não. Os pontos são benefícios promocionais do negócio emissor e não representam dinheiro, saldo bancário ou valor transferível."
        }
      }
    ]
  };
}

function buildMetadata({
  title,
  description,
  canonicalPath,
  indexable,
  imageUrl
}: {
  title: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
  imageUrl?: string | null;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath
    },
    robots: indexable
      ? {
          index: true,
          follow: true
        }
      : {
          index: false,
          follow: false
        },
    openGraph: {
      title,
      description,
      url,
      siteName: "VUYELA",
      locale: "pt_MZ",
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined
    }
  };
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}
