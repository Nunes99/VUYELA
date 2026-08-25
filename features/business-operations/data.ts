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
  const { data, error } = await supabase.rpc("get_business_operations", {
    p_business_id: businessId
  });

  if (error) {
    return { status: "error", message: "Não foi possível carregar a gestão operacional." };
  }

  const row = Array.isArray(data) ? (data[0] as BusinessOperationsRpcRow | undefined) : undefined;

  if (!row) {
    return { status: "error", message: "A gestão operacional está temporariamente indisponível." };
  }

  return {
    status: "ready",
    operations: {
      branches: arrayFrom<BusinessOperationBranch>(row.branches),
      members: arrayFrom<BusinessOperationMember>(row.members),
      invitations: arrayFrom<BusinessOperationInvitation>(row.invitations),
      catalogItems: arrayFrom<BusinessCatalogItem>(row.catalog_items),
      cards: arrayFrom<BusinessOperationCard>(row.cards),
      offers: arrayFrom<BusinessOperationOffer>(row.offers)
    }
  };
}

function arrayFrom<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
