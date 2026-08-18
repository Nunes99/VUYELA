import "server-only";

import type {
  NotificationDeliveryRequest,
  NotificationDeliveryResult,
  NotificationProvider
} from "./provider";

interface ResendResponse {
  id?: unknown;
  message?: unknown;
  name?: unknown;
}

export class ResendEmailNotificationProvider implements NotificationProvider {
  channel = "email" as const;

  async deliver(request: NotificationDeliveryRequest): Promise<NotificationDeliveryResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.NOTIFICATION_EMAIL_FROM?.trim();

    if (!apiKey || !from) {
      return {
        ok: false,
        message: "O canal de email ainda nao esta configurado.",
        retryable: true
      };
    }

    if (!request.recipientEmail) {
      return {
        ok: false,
        message: "O destinatario nao possui email valido.",
        retryable: false
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": request.idempotencyKey
        },
        body: JSON.stringify({
          from,
          to: [request.recipientEmail],
          subject: request.subject,
          text: request.body,
          html: buildEmailHtml(request)
        })
      });
      const payload = await readResendResponse(response);

      if (response.ok && typeof payload.id === "string") {
        return { ok: true, providerMessageId: payload.id, delivered: false };
      }

      return {
        ok: false,
        message: getSafeResendError(payload, response.status),
        retryable: response.status === 409 || response.status === 429 || response.status >= 500
      };
    } catch {
      return {
        ok: false,
        message: "O fornecedor de email nao respondeu.",
        retryable: true
      };
    }
  }
}

async function readResendResponse(response: Response): Promise<ResendResponse> {
  try {
    const value: unknown = await response.json();

    return value && typeof value === "object" ? (value as ResendResponse) : {};
  } catch {
    return {};
  }
}

function getSafeResendError(payload: ResendResponse, status: number): string {
  if (typeof payload.message === "string" && payload.message.length <= 240) {
    return payload.message;
  }

  return `O fornecedor de email respondeu com o estado ${status}.`;
}

function buildEmailHtml(request: NotificationDeliveryRequest): string {
  const businessName = escapeHtml(request.businessName || "VUYELA");
  const subject = escapeHtml(request.subject);
  const body = escapeHtml(request.body).replace(/\n/g, "<br />");

  return `<!doctype html><html lang="pt-MZ"><body style="margin:0;background:#f4f7f7;color:#16323a;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><p style="margin:0 0 12px;color:#007f7f;font-size:12px;font-weight:700;text-transform:uppercase">${businessName} · VUYELA</p><h1 style="margin:0 0 16px;color:#073b4c;font-size:24px">${subject}</h1><p style="margin:0;line-height:1.6">${body}</p><p style="margin:28px 0 0;color:#65777c;font-size:12px">Pontos VUYELA sao beneficios promocionais do estabelecimento emissor.</p></div></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character] ?? character;
  });
}
