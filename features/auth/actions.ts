"use server";

import { redirect } from "next/navigation";

import { getDefinePasswordPath, getPortalNextPath, parseAuthPortal } from "@/features/auth/portal";
import type { AuthActionState } from "@/features/auth/state";
import { getSiteUrl, isPhoneAuthEnabled, isSupabaseConfigured } from "@/lib/env";
import { clearSupabaseAuthCookies, createSupabaseServerClient } from "@/lib/supabase/server";

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
        message: `${label} é obrigatório.`
      }
    };
  }

  return {
    ok: true as const,
    value
  };
}

function getSafeNextPath(formData: FormData, fallback = "/conta") {
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
      "A autenticação ainda não está configurada neste ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
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

function getOptionalNuit(formData: FormData) {
  const value = getFormString(formData, "nuit").replace(/\s+/g, "");

  if (!value) {
    return { ok: true as const, value: null };
  }

  if (!/^\d{9,12}$/.test(value)) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "O NUIT deve ter entre 9 e 12 algarismos, sem letras ou símbolos."
      }
    };
  }

  return { ok: true as const, value };
}

export async function signInWithEmailAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const email = getRequiredFormString(formData, "email", "E-mail");
  if (!email.ok) {
    return email.state;
  }

  const password = getRequiredFormString(formData, "password", "Palavra-passe");
  if (!password.ok) {
    return password.state;
  }

  // A login always starts a new local session. Removing an obsolete cookie first
  // prevents Supabase from attempting a failed refresh before password validation.
  await clearSupabaseAuthCookies();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível entrar. Confirme o e-mail e a palavra-passe."
    };
  }

  const portal = getFormString(formData, "portal");
  if (portal === "customer" || portal === "business" || portal === "pos" || portal === "admin") {
    const [profileResult, membershipResult] = await Promise.all([
      supabase.from("profiles").select("account_type").eq("id", data.user.id).maybeSingle(),
      portal === "pos"
        ? supabase
            .from("business_members")
            .select("id", { count: "exact", head: true })
            .eq("profile_id", data.user.id)
            .eq("status", "active")
            .in("role", ["cashier", "branch_manager", "business_admin", "business_owner"])
        : Promise.resolve({ count: null, error: null })
    ]);
    const profile = profileResult.data;
    const accountType = profile?.account_type;
    let isAllowed =
      portal === "business" || portal === "pos"
        ? accountType === "business"
        : portal === "admin"
          ? accountType === "platform"
          : accountType === "customer";

    if (portal === "pos" && isAllowed) {
      isAllowed = !membershipResult.error && (membershipResult.count ?? 0) > 0;
    }

    if (!isAllowed) {
      await supabase.auth.signOut({ scope: "local" });
      return {
        status: "error",
        message:
          portal === "business"
            ? "Estas credenciais não pertencem a uma conta de negócio."
            : portal === "pos"
              ? "Estas credenciais não têm uma função ativa para operar o POS."
              : portal === "admin"
                ? "Estas credenciais não pertencem à Administração VUYELA."
                : "Estas credenciais não pertencem a uma conta de cliente."
      };
    }
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
      message: "A autenticação por telefone ainda não está disponível."
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
      message: "Não foi possível enviar o código. Confirme o telefone."
    };
  }

  return {
    status: "success",
    message: "Código enviado. Introduza o código recebido por SMS para continuar."
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
      message: "A autenticação por telefone ainda não está disponível."
    };
  }

  const phone = getRequiredFormString(formData, "phone", "Telefone");
  if (!phone.ok) {
    return phone.state;
  }

  const token = getRequiredFormString(formData, "token", "Código");
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
      message: "Código inválido ou expirado."
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

  const email = getRequiredFormString(formData, "email", "E-mail");
  if (!email.ok) {
    return email.state;
  }

  const password = getRequiredFormString(formData, "password", "Palavra-passe");
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
        display_name: displayName.value,
        account_type: "customer"
      }
    }
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível criar a conta. Tente novamente."
    };
  }

  if (data.session) {
    redirect(next);
  }

  return {
    status: "success",
    message: "Conta criada. Confirme o e-mail para terminar a entrada."
  };
}

export async function signUpBusinessWithEmailAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const representativeName = getRequiredFormString(
    formData,
    "representativeName",
    "Nome do responsável"
  );
  if (!representativeName.ok) return representativeName.state;

  const businessName = getRequiredFormString(formData, "businessName", "Nome do negócio");
  if (!businessName.ok) return businessName.state;

  const representativePhone = getRequiredFormString(
    formData,
    "representativePhone",
    "Número de telefone"
  );
  if (!representativePhone.ok) return representativePhone.state;

  const businessType = getRequiredFormString(formData, "businessType", "Tipo de negócio");
  if (!businessType.ok) return businessType.state;

  const businessSector = getRequiredFormString(formData, "businessSector", "Sector de atividade");
  if (!businessSector.ok) return businessSector.state;

  const branchName = getRequiredFormString(formData, "branchName", "Nome da filial");
  if (!branchName.ok) return branchName.state;

  const province = getRequiredFormString(formData, "province", "Província");
  if (!province.ok) return province.state;

  const city = getRequiredFormString(formData, "city", "Distrito");
  if (!city.ok) return city.state;

  const branchPhone = getRequiredFormString(formData, "branchPhone", "Telefone da filial");
  if (!branchPhone.ok) return branchPhone.state;

  const addressLine = getRequiredFormString(formData, "addressLine", "Endereço completo");
  if (!addressLine.ok) return addressLine.state;

  const openingTime = getRequiredFormString(formData, "openingTime", "Hora de abertura");
  if (!openingTime.ok) return openingTime.state;

  const closingTime = getRequiredFormString(formData, "closingTime", "Hora de encerramento");
  if (!closingTime.ok) return closingTime.state;

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(openingTime.value) || !timePattern.test(closingTime.value)) {
    return { status: "error", message: "Indique um horário válido para a filial." };
  }
  if (openingTime.value >= closingTime.value) {
    return {
      status: "error",
      message: "A hora de encerramento deve ser posterior à hora de abertura."
    };
  }

  if (getFormString(formData, "termsAccepted") !== "on") {
    return {
      status: "error",
      message: "Aceite os Termos e Condições e a Política de Privacidade para continuar."
    };
  }

  const email = getRequiredFormString(formData, "email", "E-mail de acesso");
  if (!email.ok) return email.state;

  const password = getRequiredFormString(formData, "password", "Palavra-passe");
  if (!password.ok) return password.state;
  if (password.value.length < 8) {
    return { status: "error", message: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }

  const passwordConfirmation = getRequiredFormString(
    formData,
    "passwordConfirmation",
    "Confirmação da palavra-passe"
  );
  if (!passwordConfirmation.ok) return passwordConfirmation.state;
  if (password.value !== passwordConfirmation.value) {
    return { status: "error", message: "As palavras-passe introduzidas não coincidem." };
  }

  const nuit = getOptionalNuit(formData);
  if (!nuit.ok) return nuit.state;

  const slug = `${slugifyBusinessName(businessName.value)}-${crypto.randomUUID().slice(0, 8)}`;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/negocio")}`,
      data: {
        display_name: representativeName.value,
        phone: representativePhone.value,
        account_type: "business",
        business_registration: {
          slug,
          name: businessName.value,
          legal_name: getFormString(formData, "legalName") || businessName.value,
          nuit: nuit.value,
          description: getFormString(formData, "description") || null,
          phone: branchPhone.value,
          email: email.value,
          business_type: businessType.value,
          business_sector: businessSector.value,
          branch_name: branchName.value,
          branch_phone: branchPhone.value,
          address_line: addressLine.value,
          city: city.value,
          province: province.value,
          opening_time: openingTime.value,
          closing_time: closingTime.value
        }
      }
    }
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível criar a conta de negócio. Reveja os dados e tente novamente."
    };
  }

  if (data.session) {
    redirect("/negocio");
  }

  return {
    status: "success",
    message: "Conta de negócio criada. Confirme o e-mail para entrar no Portal de Negócio."
  };
}

export async function signUpBusinessMemberWithEmailAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const token = getRequiredFormString(formData, "token", "Convite");
  if (!token.ok || !/^[0-9a-f]{48}$/.test(token.value)) {
    return { status: "error", message: "O convite é inválido ou expirou." };
  }

  const displayName = getRequiredFormString(formData, "displayName", "Nome");
  if (!displayName.ok) return displayName.state;

  const email = getRequiredFormString(formData, "email", "E-mail de acesso");
  if (!email.ok) return email.state;

  const phone = getFormString(formData, "phone");
  const password = getRequiredFormString(formData, "password", "Palavra-passe");
  if (!password.ok) return password.state;
  if (password.value.length < 8) {
    return { status: "error", message: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }

  const passwordConfirmation = getRequiredFormString(
    formData,
    "passwordConfirmation",
    "Confirmação da palavra-passe"
  );
  if (!passwordConfirmation.ok) return passwordConfirmation.state;
  if (password.value !== passwordConfirmation.value) {
    return { status: "error", message: "As palavras-passe introduzidas não coincidem." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: invitationIsValid, error: invitationError } = await supabase.rpc(
    "validate_business_member_invitation",
    {
      p_token: token.value,
      p_email: email.value,
      p_phone: phone || null
    }
  );

  if (invitationError || invitationIsValid !== true) {
    return {
      status: "error",
      message: "O convite não corresponde a estes contactos, é inválido ou expirou."
    };
  }

  const destination = getFormString(formData, "destination") === "pos" ? "pos" : "business";
  const invitationPath =
    destination === "pos"
      ? `/pos/convite?token=${encodeURIComponent(token.value)}`
      : `/negocio/convite?token=${encodeURIComponent(token.value)}`;
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(invitationPath)}`,
      data: {
        display_name: displayName.value,
        phone: phone || null,
        account_type: "business"
      }
    }
  });

  if (error) {
    return {
      status: "error",
      message:
        "Não foi possível criar as credenciais de equipa. Confirme os dados e tente novamente."
    };
  }

  if (data.session) {
    redirect(invitationPath);
  }

  return {
    status: "success",
    message:
      "Credenciais criadas. Confirme o e-mail e depois aceite o convite para entrar na equipa."
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const email = getRequiredFormString(formData, "email", "E-mail");
  if (!email.ok) {
    return email.state;
  }

  const portal = parseAuthPortal(getFormString(formData, "portal"));
  const next = getPortalNextPath(portal, getFormString(formData, "next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(
      getDefinePasswordPath(portal, next)
    )}`
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível enviar o link de recuperação."
    };
  }

  return {
    status: "success",
    message: "Enviamos as instruções de recuperação para o e-mail indicado."
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const password = getRequiredFormString(formData, "password", "Nova palavra-passe");
  if (!password.ok) {
    return password.state;
  }

  if (password.value.length < 8) {
    return {
      status: "error",
      message: "A nova palavra-passe deve ter pelo menos 8 caracteres."
    };
  }

  const passwordConfirmation = getRequiredFormString(
    formData,
    "passwordConfirmation",
    "Confirmação da palavra-passe"
  );
  if (!passwordConfirmation.ok) {
    return passwordConfirmation.state;
  }

  if (password.value !== passwordConfirmation.value) {
    return {
      status: "error",
      message: "As palavras-passe introduzidas não coincidem."
    };
  }

  const portal = parseAuthPortal(getFormString(formData, "portal"));
  const next = getPortalNextPath(portal, getFormString(formData, "next"));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "O link de recuperação expirou. Solicite um novo link."
    };
  }

  const { error } = await supabase.auth.updateUser({ password: password.value });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível atualizar a palavra-passe. Solicite um novo link."
    };
  }

  redirect(next);
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
      message: "Não foi possível guardar o perfil."
    };
  }

  return {
    status: "success",
    message: "Perfil guardado. Já pode avançar para os cartões digitais."
  };
}

export async function submitBusinessOnboardingAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return getSupabaseNotConfiguredState();
  }

  const businessName = getRequiredFormString(formData, "businessName", "Nome do negócio");
  if (!businessName.ok) {
    return businessName.state;
  }

  const city = getRequiredFormString(formData, "city", "Cidade");
  if (!city.ok) {
    return city.state;
  }

  const nuit = getOptionalNuit(formData);
  if (!nuit.ok) {
    return nuit.state;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Entre na sua conta para registar um negócio."
    };
  }

  const slug = `${slugifyBusinessName(businessName.value)}-${user.id.slice(0, 8)}`;
  const { error } = await supabase.rpc("submit_business_onboarding", {
    p_slug: slug,
    p_name: businessName.value,
    p_legal_name: getFormString(formData, "legalName") || null,
    p_nuit: nuit.value,
    p_description: getFormString(formData, "description") || null,
    p_phone: getFormString(formData, "phone") || null,
    p_email: getFormString(formData, "email") || user.email || null,
    p_city: city.value,
    p_province: getFormString(formData, "province") || null
  });

  if (error) {
    if (error.code === "23514" && error.message.includes("businesses_nuit_format")) {
      return {
        status: "error",
        message: "O NUIT deve ter entre 9 e 12 algarismos. Confirme o número e tente novamente."
      };
    }

    if (error.code === "23505") {
      return {
        status: "error",
        message:
          "Já existe um pedido para este negócio nesta conta. Aguarde a validação da equipa VUYELA."
      };
    }

    return {
      status: "error",
      message: "Não foi possível registar o negócio agora. Reveja os dados e tente novamente."
    };
  }

  return {
    status: "success",
    message: "Pedido recebido. O negócio ficou pendente de validação da equipa VUYELA."
  };
}

export async function signOutAction(formData?: FormData) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  const returnTo = formData ? getFormString(formData, "returnTo") : null;
  const allowedReturnPaths = new Set([
    "/cliente/entrar",
    "/negocio/entrar",
    "/pos/entrar",
    "/admin/entrar"
  ]);
  redirect(returnTo && allowedReturnPaths.has(returnTo) ? returnTo : "/");
}
