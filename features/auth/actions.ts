"use server";

import { redirect } from "next/navigation";

import type { AuthActionState } from "@/features/auth/state";
import { getSiteUrl, isPhoneAuthEnabled, isSupabaseConfigured } from "@/lib/env";
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
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "negocio";
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

  if (!isPhoneAuthEnabled()) {
    return {
      status: "error",
      message: "A autenticacao por telefone ainda nao esta disponivel."
    };
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

  if (!isPhoneAuthEnabled()) {
    return {
      status: "error",
      message: "A autenticacao por telefone ainda nao esta disponivel."
    };
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
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/definir-senha")}`
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

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const password = getRequiredFormString(formData, "password", "Nova senha");
  if (!password.ok) {
    return password.state;
  }

  if (password.value.length < 8) {
    return {
      status: "error",
      message: "A nova senha deve ter pelo menos 8 caracteres."
    };
  }

  const passwordConfirmation = getRequiredFormString(
    formData,
    "passwordConfirmation",
    "Confirmacao da senha"
  );
  if (!passwordConfirmation.ok) {
    return passwordConfirmation.state;
  }

  if (password.value !== passwordConfirmation.value) {
    return {
      status: "error",
      message: "As senhas introduzidas nao coincidem."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "O link de recuperacao expirou. Solicite um novo link."
    };
  }

  const { error } = await supabase.auth.updateUser({ password: password.value });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel actualizar a senha. Solicite um novo link."
    };
  }

  redirect("/cliente");
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

  const slug = `${slugifyBusinessName(businessName.value)}-${user.id.slice(0, 8)}`;
  const { error } = await supabase.rpc("submit_business_onboarding", {
    p_slug: slug,
    p_name: businessName.value,
    p_legal_name: getFormString(formData, "legalName") || null,
    p_nuit: getFormString(formData, "nuit") || null,
    p_description: getFormString(formData, "description") || null,
    p_phone: getFormString(formData, "phone") || null,
    p_email: getFormString(formData, "email") || user.email || null,
    p_city: city.value,
    p_province: getFormString(formData, "province") || null
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel cadastrar o negocio agora."
    };
  }

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
