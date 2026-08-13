import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategoryPage } from "@/features/public-marketplace/data";
import { MarketplaceJsonLd, MarketplaceListPage } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildMarketplaceListMetadata
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const viewModel = await getCategoryPage(slug);

  if (!viewModel) {
    return {
      title: "Categoria nao encontrada",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return buildMarketplaceListMetadata(viewModel);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const viewModel = await getCategoryPage(slug);

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
