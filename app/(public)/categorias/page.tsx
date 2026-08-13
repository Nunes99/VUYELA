import type { Metadata } from "next";

import { getCategoriesList } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, MarketplaceListPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildMarketplaceListMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const viewModel = await getCategoriesList();

  return buildMarketplaceListMetadata(viewModel);
}

export default async function CategoriesPage() {
  const viewModel = await getCategoriesList();
  const itemListJsonLd = buildItemListJsonLd(viewModel);

  return (
    <>
      <MarketplaceJsonLd data={buildBreadcrumbJsonLd(viewModel.breadcrumbs)} />
      {itemListJsonLd ? <MarketplaceJsonLd data={itemListJsonLd} /> : null}
      <MarketplaceListPage viewModel={viewModel} />
    </>
  );
}
