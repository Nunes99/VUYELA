import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getDefaultAuthenticatedPath } from "@/lib/auth/rbac";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "A minha conta",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function AccountRouterPage() {
  const principal = await requireAuthenticatedUser("/conta");

  redirect(getDefaultAuthenticatedPath(principal));
}
