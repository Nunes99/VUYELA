import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCityCategoryPage } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, MarketplaceListPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildMarketplaceListMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

interface CityCategoryPageProps {
  params: Promise<{ cidade: string; categoria: string }>;
}

export async function generateMetadata({ params }: CityCategoryPageProps): Promise<Metadata> {
  const { cidade, categoria } = await params;
  const viewModel = await getCityCategoryPage(cidade, categoria);

  if (!viewModel) {
    return {
      title: "Pagina nao encontrada",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return buildMarketplaceListMetadata(viewModel);
}

export default async function CityCategoryPage({ params }: CityCategoryPageProps) {
  const { cidade, categoria } = await params;
  const viewModel = await getCityCategoryPage(cidade, categoria);

  if (!viewModel || !viewModel.indexable) {
    notFound();
  }

  const itemListJsonLd = buildItemListJsonLd(viewModel);

  return (
    <>
      <MarketplaceJsonLd data={buildBreadcrumbJsonLd(viewModel.breadcrumbs)} />
      {itemListJsonLd ? <MarketplaceJsonLd data={itemListJsonLd} /> : null}
      <MarketplaceListPage viewModel={viewModel} />
    </>
  );
}
