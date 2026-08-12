import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignSystemShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design System",
  robots: {
    index: false,
    follow: false
  }
};

export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return <DesignSystemShowcase />;
}
