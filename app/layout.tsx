import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@lemote/vuyela-design-system/styles.css";
import "./globals.css";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VUYELA by LEMOTE",
    template: "%s | VUYELA"
  },
  description:
    "Plataforma de fidelizacao digital para negocios em Mocambique criarem razoes reais para clientes voltarem.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "VUYELA by LEMOTE",
    description: "Clientes que voltam. Negocios que crescem. Fidelizacao digital para Mocambique.",
    url: siteUrl,
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#073B4C",
  colorScheme: "light"
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-MZ">
      <body>{children}</body>
    </html>
  );
}
