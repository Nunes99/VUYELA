import type { Metadata } from "next";

import { getEstablishmentsList } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, MarketplaceListPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildMarketplaceListMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const viewModel = await getEstablishmentsList();

  return buildMarketplaceListMetadata(viewModel);
}

export default async function EstablishmentsPage() {
  const viewModel = await getEstablishmentsList();
  const itemListJsonLd = buildItemListJsonLd(viewModel);

  return (
    <>
      <MarketplaceJsonLd data={buildBreadcrumbJsonLd(viewModel.breadcrumbs)} />
      {itemListJsonLd ? <MarketplaceJsonLd data={itemListJsonLd} /> : null}
      <MarketplaceListPage viewModel={viewModel} />
    </>
  );
}
