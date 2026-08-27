import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getPwaMetadata, getPwaViewport } from "@/features/pwa/apps";

export const metadata: Metadata = getPwaMetadata("cliente");
export const viewport: Viewport = getPwaViewport("cliente");

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return children;
}
