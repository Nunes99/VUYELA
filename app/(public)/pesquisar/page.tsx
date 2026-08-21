import type { Metadata } from "next";

import { getMarketplaceSearchPage } from "@/features/public-marketplace/data";
import { MarketplaceSearchPage } from "@/features/public-marketplace/marketplace";
import type { SearchParamRecord } from "@/features/public-marketplace/search";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pesquisar estabelecimentos e ofertas",
  description:
    "Pesquise negócios, categorias, cidades e ofertas públicas VUYELA. URLs de busca são partilháveis e ficam fora do índice.",
  alternates: {
    canonical: "/pesquisar"
  },
  robots: {
    index: false,
    follow: true
  },
  openGraph: {
    title: "Pesquisar estabelecimentos e ofertas VUYELA",
    description:
      "Encontre negócios e ofertas públicas VUYELA por texto, categoria, cidade, ofertas e localização permitida.",
    url: "/pesquisar",
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  }
};

interface SearchPageProps {
  searchParams?: Promise<SearchParamRecord>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const viewModel = await getMarketplaceSearchPage((await searchParams) ?? {});

  return <MarketplaceSearchPage viewModel={viewModel} />;
}
