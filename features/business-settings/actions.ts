"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mediaFile, updateBusinessMedia, validateBusinessMediaFile } from "@/lib/business-media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePublicMarketplacePaths } from "@/features/public-marketplace/revalidation";

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function numberValue(formData: FormData, key: string): number | null {
  const raw = value(formData, key).replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function settingsPath(
  businessId: string,
  status: "guardado" | "erro" | "imagem-invalida" | "imagem-erro"
): string {
  return `/negocio/definicoes?businessId=${encodeURIComponent(businessId)}&estado=${status}`;
}

export async function updateBusinessSettingsAction(formData: FormData): Promise<void> {
  const businessId = value(formData, "businessId");
  const categoryId = value(formData, "categoryId");
  const name = value(formData, "name");
  const description = value(formData, "description");
  const earnPercent = numberValue(formData, "earnPercent");
  const pointValueMzn = numberValue(formData, "pointValueMzn");
  const maximumRedemptionPercent = numberValue(formData, "maximumRedemptionPercent");
  const expiry = numberValue(formData, "pointsExpireAfterDays");
  const logo = mediaFile(formData, "logoImage");
  const cover = mediaFile(formData, "coverImage");

  if (
    !businessId ||
    !categoryId ||
    name.length < 2 ||
    description.length < 30 ||
    earnPercent === null ||
    pointValueMzn === null ||
    maximumRedemptionPercent === null
  ) {
    redirect(settingsPath(businessId, "erro"));
  }

  const phonePattern = /^\+?[0-9 ]{8,20}$/;
  const phone = value(formData, "phone");
  const branchPhone = value(formData, "branchPhone");
  if ((phone && !phonePattern.test(phone)) || (branchPhone && !phonePattern.test(branchPhone))) {
    redirect(settingsPath(businessId, "erro"));
  }

  const websiteUrl = value(formData, "websiteUrl");
  if (websiteUrl && !isHttpUrl(websiteUrl)) {
    redirect(settingsPath(businessId, "erro"));
  }

  try {
    await validateBusinessMediaFile(logo);
    await validateBusinessMediaFile(cover);
  } catch {
    redirect(settingsPath(businessId, "imagem-invalida"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_business_configuration", {
    p_business_id: businessId,
    p_category_id: categoryId,
    p_name: name,
    p_description: description,
    p_phone: phone,
    p_email: value(formData, "email"),
    p_website_url: websiteUrl,
    p_program_name: value(formData, "programName"),
    p_earn_percent: earnPercent,
    p_point_value_mzn_minor: Math.round(pointValueMzn * 100),
    p_maximum_redemption_percent: maximumRedemptionPercent,
    p_points_expire_after_days: expiry === null ? null : Math.round(expiry),
    p_program_terms: value(formData, "programTerms"),
    p_branch_id: value(formData, "branchId") || null,
    p_branch_name: value(formData, "branchName"),
    p_branch_phone: branchPhone,
    p_branch_email: value(formData, "branchEmail"),
    p_branch_address_line: value(formData, "branchAddressLine"),
    p_branch_city: value(formData, "branchCity"),
    p_branch_province: value(formData, "branchProvince")
  });

  if (error) {
    redirect(settingsPath(businessId, "erro"));
  }

  try {
    await updateBusinessMedia({
      supabase,
      businessId,
      entityType: "business_cover",
      entityId: businessId,
      file: cover,
      previousUrl: value(formData, "previousCoverUrl"),
      remove: value(formData, "removeCoverImage") === "on"
    });
    await updateBusinessMedia({
      supabase,
      businessId,
      entityType: "business_logo",
      entityId: businessId,
      file: logo,
      previousUrl: value(formData, "previousLogoUrl"),
      remove: value(formData, "removeLogoImage") === "on"
    });
  } catch {
    redirect(settingsPath(businessId, "imagem-erro"));
  }

  revalidatePath("/negocio");
  revalidatePath("/pos");
  revalidatePath("/cliente");
  revalidatePublicMarketplacePaths();
  redirect(settingsPath(businessId, "guardado"));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
