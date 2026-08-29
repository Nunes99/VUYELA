import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  BusinessCatalogItem,
  BusinessOperationBranch,
  BusinessOperationCard,
  BusinessOperationInvitation,
  BusinessOperationMember,
  BusinessOperationOffer,
  BusinessOperations
} from "./model";

interface BusinessOperationsRpcRow {
  branches: unknown;
  members: unknown;
  invitations: unknown;
  catalog_items: unknown;
  cards: unknown;
  offers: unknown;
}

interface CatalogDiscountRow {
  id: string;
  loyalty_discount_percent: number | string;
}

export type BusinessOperationsState =
  | { status: "restricted"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; operations: BusinessOperations };

export async function getBusinessOperations(
  businessId: string,
  hasManagerScope: boolean
): Promise<BusinessOperationsState> {
  if (!hasManagerScope) {
    return {
      status: "restricted",
      message: "A gestão operacional exige a função de administrador ou proprietário do negócio."
    };
  }

  const supabase = await createSupabaseServerClient();
  const [operationsResult, discountsResult] = await Promise.all([
    supabase.rpc("get_business_operations", {
      p_business_id: businessId
    }),
    supabase
      .from("business_catalog_items")
      .select("id, loyalty_discount_percent")
      .eq("business_id", businessId)
  ]);
  const { data, error } = operationsResult;

  if (error || discountsResult.error) {
    return { status: "error", message: "Não foi possível carregar a gestão operacional." };
  }

  const row = Array.isArray(data) ? (data[0] as BusinessOperationsRpcRow | undefined) : undefined;

  if (!row) {
    return { status: "error", message: "A gestão operacional está temporariamente indisponível." };
  }

  const discounts = new Map(
    arrayFrom<CatalogDiscountRow>(discountsResult.data).map((item) => [
      item.id,
      Number(item.loyalty_discount_percent)
    ])
  );
  const catalogItems = arrayFrom<Omit<BusinessCatalogItem, "loyaltyDiscountPercent">>(
    row.catalog_items
  ).map((item) => ({
    ...item,
    loyaltyDiscountPercent: discounts.get(item.id) ?? 0
  }));

  return {
    status: "ready",
    operations: {
      branches: arrayFrom<BusinessOperationBranch>(row.branches),
      members: arrayFrom<BusinessOperationMember>(row.members),
      invitations: arrayFrom<BusinessOperationInvitation>(row.invitations),
      catalogItems,
      cards: arrayFrom<BusinessOperationCard>(row.cards),
      offers: arrayFrom<BusinessOperationOffer>(row.offers)
    }
  };
}

function arrayFrom<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
