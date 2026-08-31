import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  BusinessCatalogCategory,
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
  category_id: string | null;
  image_url: string | null;
  loyalty_discount_percent: number | string;
}

interface CatalogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
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
  const [operationsResult, catalogMediaResult, catalogCategoriesResult] = await Promise.all([
    supabase.rpc("get_business_operations", {
      p_business_id: businessId
    }),
    supabase
      .from("business_catalog_items")
      .select("id, category_id, image_url, loyalty_discount_percent")
      .eq("business_id", businessId),
    supabase
      .from("business_catalog_categories")
      .select("id, name, slug, description, is_active, sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
  ]);
  const { data, error } = operationsResult;

  if (error || catalogMediaResult.error || catalogCategoriesResult.error) {
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
        categoryId: item.category_id,
        imageUrl: item.image_url,
        loyaltyDiscountPercent: Number(item.loyalty_discount_percent)
      }
    ])
  );
  const catalogItems = arrayFrom<
    Omit<BusinessCatalogItem, "categoryId" | "categoryName" | "imageUrl" | "loyaltyDiscountPercent">
  >(row.catalog_items).map((item) => ({
    ...item,
    categoryId: catalogMedia.get(item.id)?.categoryId ?? null,
    categoryName: null,
    imageUrl: catalogMedia.get(item.id)?.imageUrl ?? null,
    loyaltyDiscountPercent: catalogMedia.get(item.id)?.loyaltyDiscountPercent ?? 0
  }));
  const categoryRows = arrayFrom<CatalogCategoryRow>(catalogCategoriesResult.data);
  const categoryNames = new Map(categoryRows.map((category) => [category.id, category.name]));
  const resolvedCatalogItems = catalogItems.map((item) => ({
    ...item,
    categoryName: item.categoryId ? (categoryNames.get(item.categoryId) ?? null) : null
  }));
  const catalogCategories: BusinessCatalogCategory[] = categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.is_active,
    sortOrder: category.sort_order,
    itemCount: resolvedCatalogItems.filter((item) => item.categoryId === category.id).length
  }));

  return {
    status: "ready",
    operations: {
      branches: arrayFrom<BusinessOperationBranch>(row.branches),
      members: arrayFrom<BusinessOperationMember>(row.members),
      invitations: arrayFrom<BusinessOperationInvitation>(row.invitations),
      catalogCategories,
      catalogItems: resolvedCatalogItems,
      cards: arrayFrom<BusinessOperationCard>(row.cards),
      offers: arrayFrom<BusinessOperationOffer>(row.offers)
    }
  };
}

function arrayFrom<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
