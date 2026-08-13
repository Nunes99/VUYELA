import type { Metadata } from "next";

import { getMarketplaceSearchPage } from "@/features/public-marketplace/data";
import { MarketplaceSearchPage } from "@/features/public-marketplace/marketplace";
import type { SearchParamRecord } from "@/features/public-marketplace/search";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pesquisar estabelecimentos e ofertas",
  description:
    "Pesquise negocios, categorias, cidades e ofertas publicas VUYELA. URLs de busca sao partilháveis e ficam fora do indice.",
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
      "Encontre negocios e ofertas publicas VUYELA por texto, categoria, cidade, ofertas e localizacao permitida.",
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
