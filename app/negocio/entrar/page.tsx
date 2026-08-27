import type { Metadata } from "next";

import { BusinessSignInView, getBusinessNextPath } from "@/features/auth/portal-sign-in";

export const metadata: Metadata = {
  title: "Entrar no Portal de Negócio",
  robots: { index: false, follow: false }
};

export default async function BusinessSignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <BusinessSignInView nextPath={getBusinessNextPath(params.next)} />;
}
