"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function updateCustomerProfileAction(formData: FormData): Promise<void> {
  const principal = await requireAuthenticatedUser("/cliente#perfil");
  const displayName = value(formData, "displayName");
  const phone = value(formData, "phone");

  if (displayName.length < 2 || displayName.length > 100) {
    redirect("/cliente?perfil=erro#perfil");
  }

  if (phone && !/^\+?[0-9 ]{8,20}$/.test(phone)) {
    redirect("/cliente?perfil=erro#perfil");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      phone: phone || null,
      locale: "pt-MZ",
      marketing_consent_at:
        value(formData, "marketingConsent") === "on" ? new Date().toISOString() : null
    })
    .eq("id", principal.profileId);

  if (error) {
    redirect("/cliente?perfil=erro#perfil");
  }

  revalidatePath("/cliente");
  redirect("/cliente?perfil=guardado#perfil");
}
