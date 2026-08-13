import type { Metadata } from "next";

import { getCitiesList } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, MarketplaceListPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildMarketplaceListMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const viewModel = await getCitiesList();

  return buildMarketplaceListMetadata(viewModel);
}

export default async function CitiesPage() {
  const viewModel = await getCitiesList();
  const itemListJsonLd = buildItemListJsonLd(viewModel);

  return (
    <>
      <MarketplaceJsonLd data={buildBreadcrumbJsonLd(viewModel.breadcrumbs)} />
      {itemListJsonLd ? <MarketplaceJsonLd data={itemListJsonLd} /> : null}
      <MarketplaceListPage viewModel={viewModel} />
    </>
  );
}
