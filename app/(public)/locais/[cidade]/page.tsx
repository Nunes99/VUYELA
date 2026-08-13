import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCityPage } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, MarketplaceListPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildMarketplaceListMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

interface CityPageProps {
  params: Promise<{ cidade: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { cidade } = await params;
  const viewModel = await getCityPage(cidade);

  if (!viewModel) {
    return {
      title: "Local nao encontrado",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return buildMarketplaceListMetadata(viewModel);
}

export default async function CityPage({ params }: CityPageProps) {
  const { cidade } = await params;
  const viewModel = await getCityPage(cidade);

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
