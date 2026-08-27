import type { Metadata } from "next";

import { CustomerSignInView, getCustomerNextPath } from "@/features/auth/portal-sign-in";
import { isPhoneAuthEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar como cliente",
  robots: { index: false, follow: false }
};

export default async function CustomerSignInPage({
  searchParams
}: {
  searchParams: Promise<{
    erro?: string | string[] | undefined;
    next?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;

  return (
    <CustomerSignInView
      callbackError={params.erro === "link-invalido"}
      nextPath={getCustomerNextPath(params.next)}
      phoneAuthEnabled={isPhoneAuthEnabled()}
    />
  );
}
