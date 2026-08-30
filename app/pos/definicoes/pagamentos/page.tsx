import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { businessSettingsRoutes } from "@/features/business-settings/routes";

export const metadata: Metadata = {
  title: "Pagamentos do POS",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";

export default async function LegacyPosPaymentSettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const targetParams = new URLSearchParams();

  for (const key of ["metodo", "businessId", "branchId", "resultado"] as const) {
    const value = singleParam(params?.[key]);
    if (value) targetParams.set(key, value);
  }

  redirect(
    `${businessSettingsRoutes.payments}${targetParams.size ? `?${targetParams.toString()}` : ""}`
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
