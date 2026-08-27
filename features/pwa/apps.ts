import type { Metadata, MetadataRoute, Viewport } from "next";

export const pwaAreas = ["cliente", "negocio", "pos", "admin"] as const;

export type PwaArea = (typeof pwaAreas)[number];

interface PwaApplication {
  area: PwaArea;
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  themeColor: string;
  backgroundColor: string;
  categories: string[];
  shortcuts: NonNullable<MetadataRoute.Manifest["shortcuts"]>;
}

export const pwaApplications: Record<PwaArea, PwaApplication> = {
  cliente: {
    area: "cliente",
    name: "VUYELA Cliente by LEMOTE",
    shortName: "VUYELA Cliente",
    description: "Cartões digitais, YELAS e benefícios VUYELA em Moçambique.",
    startUrl: "/cliente",
    scope: "/cliente",
    themeColor: "#073b4c",
    backgroundColor: "#f0f4f8",
    categories: ["shopping", "lifestyle"],
    shortcuts: [
      { name: "Os meus cartões", short_name: "Cartões", url: "/cliente?vista=cartoes" },
      { name: "Explorar ofertas", short_name: "Ofertas", url: "/cliente?vista=ofertas" }
    ]
  },
  negocio: {
    area: "negocio",
    name: "VUYELA Negócio by LEMOTE",
    shortName: "VUYELA Negócio",
    description: "Gestão de fidelização, clientes, campanhas e POS do negócio.",
    startUrl: "/negocio",
    scope: "/negocio",
    themeColor: "#021e28",
    backgroundColor: "#f4f8f9",
    categories: ["business", "productivity"],
    shortcuts: [
      { name: "Painel do negócio", short_name: "Painel", url: "/negocio" },
      { name: "Gerir equipa", short_name: "Equipa", url: "/negocio?vista=equipa" },
      { name: "Gerir catálogo", short_name: "Catálogo", url: "/negocio?vista=catalogo" }
    ]
  },
  pos: {
    area: "pos",
    name: "VUYELA POS by LEMOTE",
    shortName: "VUYELA POS",
    description: "Aplicação de caixa VUYELA para vendas, YELAS e pagamentos.",
    startUrl: "/pos",
    scope: "/pos",
    themeColor: "#021e28",
    backgroundColor: "#f4f8f9",
    categories: ["business", "finance"],
    shortcuts: [
      { name: "Nova transação", short_name: "Transação", url: "/pos" },
      { name: "Definições do POS", short_name: "Definições", url: "/pos/definicoes" }
    ]
  },
  admin: {
    area: "admin",
    name: "VUYELA Administração",
    shortName: "VUYELA Admin",
    description: "Administração protegida da plataforma VUYELA.",
    startUrl: "/admin",
    scope: "/admin",
    themeColor: "#031f29",
    backgroundColor: "#eef4f6",
    categories: ["business", "productivity"],
    shortcuts: [
      { name: "Gerir negócios", short_name: "Negócios", url: "/admin?view=businesses" },
      { name: "Fila de suporte", short_name: "Suporte", url: "/admin?view=support" }
    ]
  }
};

export function isPwaArea(value: string): value is PwaArea {
  return pwaAreas.includes(value as PwaArea);
}

export function getPwaManifest(area: PwaArea): MetadataRoute.Manifest {
  const application = pwaApplications[area];

  return {
    id: application.startUrl,
    name: application.name,
    short_name: application.shortName,
    description: application.description,
    start_url: application.startUrl,
    scope: application.scope,
    display: "standalone",
    orientation: area === "cliente" ? "portrait-primary" : "any",
    background_color: application.backgroundColor,
    theme_color: application.themeColor,
    lang: "pt-MZ",
    categories: application.categories,
    shortcuts: application.shortcuts,
    icons: [
      {
        src: "/icons/vuyela-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/vuyela-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/vuyela-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}

export function getPwaMetadata(area: PwaArea): Metadata {
  const application = pwaApplications[area];

  return {
    applicationName: application.shortName,
    manifest: `/pwa/${area}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: application.shortName
    },
    icons: {
      apple: [{ url: "/icons/vuyela-192.png", sizes: "192x192", type: "image/png" }]
    }
  };
}

export function getPwaViewport(area: PwaArea): Viewport {
  return {
    themeColor: pwaApplications[area].themeColor,
    colorScheme: "light"
  };
}
