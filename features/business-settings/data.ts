import "server-only";

import type { AuthPrincipal } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface BusinessRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
}

interface BranchRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line: string | null;
  city: string;
  province: string | null;
  is_primary: boolean;
}

interface ProgramRow {
  name: string;
  earn_rate: number | string;
  point_value_mzn_minor: number;
  maximum_redemption_percent: number | string;
  points_expire_after_days: number | null;
  terms: string | null;
}

export interface BusinessSettingsViewModel {
  business: {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    phone: string;
    email: string;
    websiteUrl: string;
  };
  program: {
    name: string;
    earnPercent: number;
    pointValueMzn: number;
    maximumRedemptionPercent: number;
    pointsExpireAfterDays: number | null;
    terms: string;
  };
  branch: {
    id: string;
    name: string;
    phone: string;
    email: string;
    addressLine: string;
    city: string;
    province: string;
  } | null;
  categories: Array<{ id: string; name: string }>;
  businesses: Array<{ id: string; name: string }>;
}

export type BusinessSettingsState =
  | { status: "ready"; settings: BusinessSettingsViewModel }
  | { status: "empty" | "error"; message: string };

const managerRoles = new Set(["business_admin", "business_owner"]);

export async function getBusinessSettings(
  principal: AuthPrincipal,
  requestedBusinessId?: string
): Promise<BusinessSettingsState> {
  const businessIds = Array.from(
    new Set(
      principal.businessMemberships
        .filter((membership) => membership.status === "active" && managerRoles.has(membership.role))
        .map((membership) => membership.businessId)
    )
  );

  if (businessIds.length === 0) {
    return {
      status: "empty",
      message: "Apenas administradores e proprietários podem alterar as definições do negócio."
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: businessData, error: businessError }, { data: categoryData }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, category_id, name, description, phone, email, website_url")
      .in("id", businessIds)
      .order("name"),
    supabase
      .from("business_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
  ]);

  if (businessError) {
    return { status: "error", message: "Não foi possível carregar as definições do negócio." };
  }

  const businesses = rowsFrom<BusinessRow>(businessData);
  const selectedBusiness =
    businesses.find((business) => business.id === requestedBusinessId) ?? businesses[0];

  if (!selectedBusiness) {
    return { status: "empty", message: "Não existe um negócio configurável nesta conta." };
  }

  const [{ data: branchData, error: branchError }, { data: programData, error: programError }] =
    await Promise.all([
      supabase
        .from("branches")
        .select("id, name, phone, email, address_line, city, province, is_primary")
        .eq("business_id", selectedBusiness.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("name"),
      supabase
        .from("loyalty_programs")
        .select(
          "name, earn_rate, point_value_mzn_minor, maximum_redemption_percent, points_expire_after_days, terms"
        )
        .eq("business_id", selectedBusiness.id)
        .maybeSingle()
    ]);

  if (branchError || programError) {
    return { status: "error", message: "Não foi possível carregar a configuração operacional." };
  }

  const branch = rowsFrom<BranchRow>(branchData)[0] ?? null;
  const program = programData as ProgramRow | null;

  return {
    status: "ready",
    settings: {
      business: {
        id: selectedBusiness.id,
        categoryId: selectedBusiness.category_id ?? "",
        name: selectedBusiness.name,
        description: selectedBusiness.description ?? "",
        phone: selectedBusiness.phone ?? "",
        email: selectedBusiness.email ?? "",
        websiteUrl: selectedBusiness.website_url ?? ""
      },
      program: {
        name: program?.name ?? `YELAS ${selectedBusiness.name}`,
        earnPercent: Number(program?.earn_rate ?? 0.05) * 100,
        pointValueMzn: (program?.point_value_mzn_minor ?? 100) / 100,
        maximumRedemptionPercent: Number(program?.maximum_redemption_percent ?? 50),
        pointsExpireAfterDays: program?.points_expire_after_days ?? null,
        terms: program?.terms ?? ""
      },
      branch: branch
        ? {
            id: branch.id,
            name: branch.name,
            phone: branch.phone ?? "",
            email: branch.email ?? "",
            addressLine: branch.address_line ?? "",
            city: branch.city,
            province: branch.province ?? ""
          }
        : null,
      categories: rowsFrom<CategoryRow>(categoryData),
      businesses: businesses.map((business) => ({ id: business.id, name: business.name }))
    }
  };
}

function rowsFrom<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
