import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "../vuyela-design-system/src/styles/tokens.css";
import "../vuyela-design-system/src/styles/base.css";
import "../vuyela-design-system/src/styles/components.css";
import "../vuyela-design-system/src/styles/utilities.css";
import "./globals.css";
import { PwaRegistration } from "@/features/pwa/pwa-registration";
import { getSiteUrl } from "@/lib/env";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VUYELA by LEMOTE",
    template: "%s | VUYELA"
  },
  description:
    "Plataforma de fidelização digital para negócios em Moçambique criarem razões reais para clientes voltarem.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "VUYELA by LEMOTE",
    description: "Clientes que voltam. Negócios que crescem. Fidelização digital para Moçambique.",
    url: siteUrl,
    siteName: "VUYELA",
    locale: "pt_MZ",
    type: "website"
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VUYELA"
  },
  icons: {
    icon: [
      { url: "/icons/vuyela-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/vuyela-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/vuyela-192.png", sizes: "192x192", type: "image/png" }]
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
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
