import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getPwaMetadata, getPwaViewport } from "@/features/pwa/apps";

export const metadata: Metadata = getPwaMetadata("negocio");
export const viewport: Viewport = getPwaViewport("negocio");

export default function PosLayout({ children }: { children: ReactNode }) {
  return children;
}
