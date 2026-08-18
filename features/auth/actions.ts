"use server";

import { redirect } from "next/navigation";

import type { AuthActionState } from "@/features/auth/state";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredFormString(formData: FormData, key: string, label: string) {
  const value = getFormString(formData, key);

  if (!value) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: `${label} e obrigatorio.`
      }
    };
  }

  return {
    ok: true as const,
    value
  };
}

function getSafeNextPath(formData: FormData, fallback = "/cliente") {
  const next = getFormString(formData, "next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

function getSupabaseNotConfiguredState(): AuthActionState {
  return {
    status: "error",
    message:
      "A autenticacao ainda nao esta configurada neste ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  };
}

function slugifyBusinessName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function signInWithEmailAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const email = getRequiredFormString(formData, "email", "Email");
  if (!email.ok) {
    return email.state;
  }

  const password = getRequiredFormString(formData, "password", "Senha");
  if (!password.ok) {
    return password.state;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel entrar. Confirme o email e a senha."
    };
  }

  redirect(getSafeNextPath(formData));
}

export async function requestPhoneOtpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const phone = getRequiredFormString(formData, "phone", "Telefone");
  if (!phone.ok) {
    return phone.state;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.value
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel enviar o codigo. Confirme o telefone."
    };
  }

  return {
    status: "success",
    message: "Codigo enviado. Introduza o codigo recebido por SMS para continuar."
  };
}

export async function verifyPhoneOtpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const phone = getRequiredFormString(formData, "phone", "Telefone");
  if (!phone.ok) {
    return phone.state;
  }

  const token = getRequiredFormString(formData, "token", "Codigo");
  if (!token.ok) {
    return token.state;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: phone.value,
    token: token.value,
    type: "sms"
  });

  if (error) {
    return {
      status: "error",
      message: "Codigo invalido ou expirado."
    };
  }

  redirect(getSafeNextPath(formData));
}

export async function signUpWithEmailAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const displayName = getRequiredFormString(formData, "displayName", "Nome");
  if (!displayName.ok) {
    return displayName.state;
  }

  const email = getRequiredFormString(formData, "email", "Email");
  if (!email.ok) {
    return email.state;
  }

  const password = getRequiredFormString(formData, "password", "Senha");
  if (!password.ok) {
    return password.state;
  }

  const next = getSafeNextPath(formData, "/onboarding/cliente");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        display_name: displayName.value
      }
    }
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel criar a conta. Tente novamente."
    };
  }

  if (data.session) {
    await supabase.from("profiles").upsert({
      id: data.user?.id,
      display_name: displayName.value,
      email: email.value
    });

    redirect(next);
  }

  return {
    status: "success",
    message: "Conta criada. Confirme o email para terminar a entrada."
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const email = getRequiredFormString(formData, "email", "Email");
  if (!email.ok) {
    return email.state;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/cliente")}`
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel enviar o link de recuperacao."
    };
  }

  return {
    status: "success",
    message: "Enviamos as instrucoes de recuperacao para o email indicado."
  };
}

export async function updateCustomerProfileAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const displayName = getRequiredFormString(formData, "displayName", "Nome");
  if (!displayName.ok) {
    return displayName.state;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para continuar."
    };
  }

  const phone = getFormString(formData, "phone");
  const email = getFormString(formData, "email") || user.email;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName.value,
      phone: phone || null,
      email: email || null,
      terms_accepted_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel guardar o perfil."
    };
  }

  return {
    status: "success",
    message: "Perfil guardado. Ja pode avancar para os cartoes digitais."
  };
}

export async function submitBusinessOnboardingAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const businessName = getRequiredFormString(formData, "businessName", "Nome do negocio");
  if (!businessName.ok) {
    return businessName.state;
  }

  const city = getRequiredFormString(formData, "city", "Cidade");
  if (!city.ok) {
    return city.state;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para cadastrar um negocio."
    };
  }

  const admin = createSupabaseServiceRoleClient();
  const slug = `${slugifyBusinessName(businessName.value)}-${user.id.slice(0, 8)}`;
  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      owner_profile_id: user.id,
      slug,
      name: businessName.value,
      legal_name: getFormString(formData, "legalName") || null,
      nuit: getFormString(formData, "nuit") || null,
      description: getFormString(formData, "description") || null,
      phone: getFormString(formData, "phone") || null,
      email: getFormString(formData, "email") || user.email || null,
      status: "pending_review"
    })
    .select("id")
    .single();

  if (businessError || !business) {
    return {
      status: "error",
      message: "Nao foi possivel cadastrar o negocio agora."
    };
  }

  await admin.from("branches").insert({
    business_id: business.id,
    slug: "principal",
    name: "Principal",
    city: city.value,
    province: getFormString(formData, "province") || null,
    is_primary: true
  });

  await admin.from("business_members").insert({
    business_id: business.id,
    profile_id: user.id,
    role: "business_owner",
    status: "active",
    joined_at: new Date().toISOString()
  });

  await admin.from("audit_logs").insert({
    business_id: business.id,
    actor_profile_id: user.id,
    action: "create",
    entity_table: "businesses",
    entity_id: business.id,
    context: {
      source: "business_onboarding"
    }
  });

  return {
    status: "success",
    message: "Pedido recebido. O negocio ficou pendente de validacao da equipa VUYELA."
  };
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
