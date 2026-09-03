"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  ProfileMediaError,
  profileMediaFile,
  removeProfileAvatar,
  uploadProfileAvatar
} from "@/lib/profile-media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function updateCustomerProfileAction(formData: FormData): Promise<void> {
  const principal = await requireAuthenticatedUser("/cliente?vista=perfil&editar=1");
  const displayName = value(formData, "displayName");
  const phone = value(formData, "phone");
  const dateOfBirth = normalizeDateOfBirth(value(formData, "dateOfBirth"));
  const avatarFile = profileMediaFile(formData, "profileImage");
  const removeAvatar = value(formData, "removeProfileImage") === "on";

  if (displayName.length < 2 || displayName.length > 100) {
    redirect("/cliente?vista=perfil&editar=1&perfil=erro");
  }

  if (phone && !/^\+?[0-9 ]{8,20}$/.test(phone)) {
    redirect("/cliente?vista=perfil&editar=1&perfil=erro");
  }

  if (dateOfBirth === undefined) {
    redirect("/cliente?vista=perfil&editar=1&perfil=erro");
  }

  const supabase = await createSupabaseServerClient();
  const { data: currentProfileData, error: currentProfileError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", principal.profileId)
    .maybeSingle();

  if (currentProfileError) {
    redirect("/cliente?vista=perfil&editar=1&perfil=erro");
  }

  const currentProfile = currentProfileData as { avatar_path: string | null } | null;
  const previousAvatarPath = currentProfile?.avatar_path ?? null;
  let nextAvatarPath = previousAvatarPath;
  let uploadedAvatarPath: string | null = null;

  if (avatarFile) {
    try {
      uploadedAvatarPath = await uploadProfileAvatar(supabase, principal.profileId, avatarFile);
      nextAvatarPath = uploadedAvatarPath;
    } catch (error) {
      if (error instanceof ProfileMediaError && error.code === "invalid-file") {
        redirect("/cliente?vista=perfil&editar=1&perfil=imagem-invalida");
      }
      redirect("/cliente?vista=perfil&editar=1&perfil=imagem-erro");
    }
  } else if (removeAvatar) {
    nextAvatarPath = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      phone: phone || null,
      avatar_path: nextAvatarPath,
      date_of_birth: dateOfBirth,
      locale: "pt-MZ",
      marketing_consent_at:
        value(formData, "marketingConsent") === "on" ? new Date().toISOString() : null
    })
    .eq("id", principal.profileId);

  if (error) {
    if (uploadedAvatarPath) {
      await removeProfileAvatar(supabase, principal.profileId, uploadedAvatarPath);
    }
    redirect("/cliente?vista=perfil&editar=1&perfil=erro");
  }

  if (previousAvatarPath !== nextAvatarPath) {
    await removeProfileAvatar(supabase, principal.profileId, previousAvatarPath);
  }

  revalidatePath("/cliente");
  redirect("/cliente?vista=perfil&editar=1&perfil=guardado");
}

function normalizeDateOfBirth(input: string): string | null | undefined {
  if (!input) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return undefined;

  const parsed = new Date(`${input}T00:00:00.000Z`);
  const today = new Date();
  const minimum = new Date("1900-01-01T00:00:00.000Z");

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== input ||
    parsed < minimum ||
    parsed > today
  ) {
    return undefined;
  }

  return input;
}

export async function updateCustomerBusinessPreferenceAction(formData: FormData): Promise<void> {
  await requireAuthenticatedUser("/cliente?vista=ofertas");
  const businessId = value(formData, "businessId");
  const offerId = value(formData, "offerId");

  if (!businessId) redirectToOffers("erro", offerId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_customer_business_preference", {
    p_business_id: businessId,
    p_preferred_branch_id: value(formData, "preferredBranchId") || null,
    p_is_favorite: value(formData, "isFavorite") === "true",
    p_offer_notifications_enabled: value(formData, "offerNotificationsEnabled") === "true"
  });

  if (error) redirectToOffers("erro", offerId);
  revalidatePath("/cliente");
  revalidatePath("/estabelecimentos");
  redirectToOffers("preferencia-guardada", offerId);
}

export async function activateCustomerOfferAction(formData: FormData): Promise<void> {
  await requireAuthenticatedUser("/cliente?vista=ofertas");
  const offerId = value(formData, "offerId");
  const customerCardId = value(formData, "customerCardId");

  if (!offerId || !customerCardId) redirectToOffers("cartao-necessario", offerId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("activate_customer_offer", {
    p_offer_id: offerId,
    p_customer_card_id: customerCardId
  });

  if (error) redirectToOffers("erro", offerId);
  revalidatePath("/cliente");
  redirectToOffers("oferta-ativada", offerId);
}

export async function cancelCustomerOfferClaimAction(formData: FormData): Promise<void> {
  await requireAuthenticatedUser("/cliente?vista=ofertas");
  const claimId = value(formData, "claimId");
  const offerId = value(formData, "offerId");
  if (!claimId) redirectToOffers("erro", offerId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_customer_offer_claim", {
    p_claim_id: claimId
  });

  if (error) redirectToOffers("erro", offerId);
  revalidatePath("/cliente");
  redirectToOffers("oferta-cancelada", offerId);
}

function redirectToOffers(result: string, offerId: string): never {
  const params = new URLSearchParams({ vista: "ofertas", oferta: result });
  if (offerId) params.set("destaque", offerId);
  redirect(`/cliente?${params.toString()}`);
}
