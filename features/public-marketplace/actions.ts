"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function joinBusinessLoyaltyProgramAction(formData: FormData): Promise<void> {
  const businessId = getFormString(formData, "businessId");
  const businessSlug = getFormString(formData, "businessSlug");
  const businessPath = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(businessSlug)
    ? `/estabelecimentos/${businessSlug}`
    : "/estabelecimentos";

  if (!isSupabaseConfigured()) {
    redirect(`${businessPath}?adesao=indisponivel`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent(businessPath)}`);
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)
  ) {
    redirect(`${businessPath}?adesao=invalida`);
  }

  const { error } = await supabase.rpc("join_business_loyalty_program", {
    p_business_id: businessId
  });

  if (error) {
    redirect(`${businessPath}?adesao=erro`);
  }

  revalidatePath("/cliente");
  redirect("/cliente#cartoes");
}
