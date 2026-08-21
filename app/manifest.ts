import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/cliente",
    name: "VUYELA by LEMOTE",
    short_name: "VUYELA",
    description: "Cartões digitais e benefícios VUYELA em Moçambique.",
    start_url: "/cliente",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f4f8f9",
    theme_color: "#073b4c",
    lang: "pt-MZ",
    categories: ["business", "shopping"],
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
