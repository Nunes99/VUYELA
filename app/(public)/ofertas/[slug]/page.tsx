import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOfferPage } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, OfferDetailPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildOfferJsonLd,
  buildOfferMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

interface OfferPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const viewModel = await getOfferPage(slug);

  if (!viewModel) {
    return {
      title: "Oferta nao encontrada",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return buildOfferMetadata(viewModel);
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const viewModel = await getOfferPage(slug);

  if (!viewModel || !viewModel.indexable) {
    notFound();
  }

  return (
    <>
      <MarketplaceJsonLd data={buildBreadcrumbJsonLd(viewModel.breadcrumbs)} />
      <MarketplaceJsonLd data={buildOfferJsonLd(viewModel.offer, viewModel.business)} />
      <OfferDetailPage viewModel={viewModel} />
    </>
  );
}
