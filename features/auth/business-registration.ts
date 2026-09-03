export type PhoneNormalizationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export interface AuthSignUpErrorLike {
  code?: string | undefined;
  message?: string | undefined;
  status?: number | undefined;
}

const existingBusinessAccountMessage =
  "Não foi possível usar este e-mail. Se a conta já existir, entre no Portal de Negócio ou use outro e-mail exclusivo.";

export function normalizeBusinessPhone(
  input: string,
  label: string
): PhoneNormalizationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, message: `${label} é obrigatório.` };
  }

  let compact = trimmed.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) {
    compact = `+${compact.slice(2)}`;
  } else if (/^258\d{8,9}$/.test(compact)) {
    compact = `+${compact}`;
  } else if (/^\d{8,9}$/.test(compact)) {
    compact = `+258${compact}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(compact)) {
    return {
      ok: false,
      message: `${label} não é válido. Use, por exemplo, +258 84 123 4567.`
    };
  }

  return { ok: true, value: compact };
}

export function businessSignUpErrorMessage(error: AuthSignUpErrorLike): string {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return existingBusinessAccountMessage;
    case "weak_password":
      return "A palavra-passe não cumpre os requisitos de segurança. Use uma combinação mais forte.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "rate_limit_exceeded":
      return "Foram efetuadas demasiadas tentativas. Aguarde alguns minutos antes de voltar a submeter.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "O registo por e-mail está temporariamente indisponível. Contacte o suporte VUYELA.";
    case "email_address_not_authorized":
      return "O serviço de e-mail ainda não está autorizado a enviar a confirmação para este endereço.";
    case "unexpected_failure":
      return "Não foi possível gravar a conta de negócio. Confirme os dados e tente novamente.";
    default:
      if (error.status === 429) {
        return "Foram efetuadas demasiadas tentativas. Aguarde alguns minutos antes de voltar a submeter.";
      }
      if (error.status && error.status >= 500) {
        return "O serviço de registo está temporariamente indisponível. Tente novamente dentro de instantes.";
      }
      return "Não foi possível criar a conta de negócio. Reveja os dados e tente novamente.";
  }
}

export function businessSignUpExistingIdentityMessage(): string {
  return existingBusinessAccountMessage;
}
