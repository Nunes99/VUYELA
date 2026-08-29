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

interface CatalogMediaRow {
  id: string;
  image_url: string | null;
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
  const [operationsResult, catalogMediaResult] = await Promise.all([
    supabase.rpc("get_business_operations", {
      p_business_id: businessId
    }),
    supabase
      .from("business_catalog_items")
      .select("id, image_url, loyalty_discount_percent")
      .eq("business_id", businessId)
  ]);
  const { data, error } = operationsResult;

  if (error || catalogMediaResult.error) {
    return { status: "error", message: "Não foi possível carregar a gestão operacional." };
  }

  const row = Array.isArray(data) ? (data[0] as BusinessOperationsRpcRow | undefined) : undefined;

  if (!row) {
    return { status: "error", message: "A gestão operacional está temporariamente indisponível." };
  }

  const catalogMedia = new Map(
    arrayFrom<CatalogMediaRow>(catalogMediaResult.data).map((item) => [
      item.id,
      {
        imageUrl: item.image_url,
        loyaltyDiscountPercent: Number(item.loyalty_discount_percent)
      }
    ])
  );
  const catalogItems = arrayFrom<
    Omit<BusinessCatalogItem, "imageUrl" | "loyaltyDiscountPercent">
  >(
    row.catalog_items
  ).map((item) => ({
    ...item,
    imageUrl: catalogMedia.get(item.id)?.imageUrl ?? null,
    loyaltyDiscountPercent: catalogMedia.get(item.id)?.loyaltyDiscountPercent ?? 0
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
