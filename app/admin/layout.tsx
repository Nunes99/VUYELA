import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getPwaMetadata, getPwaViewport } from "@/features/pwa/apps";

export const metadata: Metadata = getPwaMetadata("admin");
export const viewport: Viewport = getPwaViewport("admin");

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
