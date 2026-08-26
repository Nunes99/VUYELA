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
  const requestedReturnTo = getFormString(formData, "returnTo");
  const customerReturnTo =
    requestedReturnTo === "/cliente?vista=negocios" ? requestedReturnTo : null;
  const businessPath = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(businessSlug)
    ? `/estabelecimentos/${businessSlug}`
    : "/estabelecimentos";
  const failurePath = customerReturnTo
    ? `${customerReturnTo}&adesao=erro`
    : `${businessPath}?adesao=erro`;

  if (!isSupabaseConfigured()) {
    redirect(
      customerReturnTo
        ? `${customerReturnTo}&adesao=indisponivel`
        : `${businessPath}?adesao=indisponivel`
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent(customerReturnTo ?? businessPath)}`);
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)
  ) {
    redirect(
      customerReturnTo ? `${customerReturnTo}&adesao=invalida` : `${businessPath}?adesao=invalida`
    );
  }

  const { error } = await supabase.rpc("join_business_loyalty_program", {
    p_business_id: businessId
  });

  if (error) {
    redirect(failurePath);
  }

  revalidatePath("/cliente");
  redirect(customerReturnTo ? `${customerReturnTo}&adesao=sucesso` : "/cliente#cartoes");
}
