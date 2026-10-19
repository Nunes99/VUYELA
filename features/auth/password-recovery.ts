type RecoveryError = {
  code?: string;
  status?: number;
};

export function passwordRecoveryErrorMessage(error: RecoveryError): string {
  if (error.code === "over_email_send_rate_limit") {
    return "O limite de envio de e-mails foi atingido. Aguarde antes de solicitar outro link.";
  }
  if (error.code === "over_request_rate_limit" || error.status === 429) {
    return "Foram efetuados demasiados pedidos. Aguarde alguns minutos e tente novamente.";
  }
  if (error.code === "email_address_invalid" || error.code === "validation_failed") {
    return "Introduza um endereço de e-mail válido.";
  }
  if (error.code === "email_address_not_authorized" || error.code === "email_provider_disabled") {
    return "O envio de e-mails de recuperação está indisponível. Contacte o suporte VUYELA.";
  }
  if (error.status && error.status >= 500) {
    return "O serviço de recuperação está temporariamente indisponível. Tente mais tarde ou contacte o suporte VUYELA.";
  }
  return "Não foi possível enviar o link de recuperação. Tente novamente dentro de instantes.";
}
