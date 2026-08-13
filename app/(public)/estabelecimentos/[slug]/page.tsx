import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBusinessPage } from "@/features/public-marketplace/data";
import { BusinessDetailPage, MarketplaceJsonLd } from "@/features/public-marketplace/marketplace";
import {
  buildBreadcrumbJsonLd,
  buildBusinessFaqJsonLd,
  buildBusinessMetadata,
  buildLocalBusinessJsonLd
} from "@/features/public-marketplace/seo";

export const revalidate = 3600;

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const viewModel = await getBusinessPage(slug);

  if (!viewModel) {
    return {
      title: "Estabelecimento nao encontrado",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return buildBusinessMetadata(viewModel.business);
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const viewModel = await getBusinessPage(slug);

  if (!viewModel) {
    notFound();
  }

  return (
    <>
      <MarketplaceJsonLd data={buildBreadcrumbJsonLd(viewModel.breadcrumbs)} />
      <MarketplaceJsonLd data={buildLocalBusinessJsonLd(viewModel.business)} />
      <MarketplaceJsonLd data={buildBusinessFaqJsonLd(viewModel.business)} />
      <BusinessDetailPage viewModel={viewModel} />
    </>
  );
}
