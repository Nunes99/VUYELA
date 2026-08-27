import type { Metadata } from "next";

import { getPosNextPath, PosSignInView } from "@/features/auth/portal-sign-in";

export const metadata: Metadata = {
  title: "Entrar no VUYELA POS",
  robots: { index: false, follow: false }
};

export default async function PosSignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <PosSignInView nextPath={getPosNextPath(params.next)} />;
}
