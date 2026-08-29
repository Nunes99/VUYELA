import { timingSafeEqual } from "node:crypto";

import { reconcileMpesaCallback } from "@/features/payments/mpesa/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_CALLBACK_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const configuredToken = process.env.MPESA_CALLBACK_TOKEN?.trim();
  if (!configuredToken) {
    return Response.json({ error: "Callback M-Pesa não configurado." }, { status: 503 });
  }

  const suppliedToken = callbackToken(request);
  if (!suppliedToken || !secureEqual(suppliedToken, configuredToken)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CALLBACK_BYTES) {
    return Response.json({ error: "Pedido demasiado grande." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_CALLBACK_BYTES) {
      return Response.json({ error: "Pedido demasiado grande." }, { status: 413 });
    }
    payload = JSON.parse(body) as unknown;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    const result = await reconcileMpesaCallback(payload);
    return Response.json(
      { ok: true, paymentAttemptId: result.paymentAttemptId, status: result.paymentStatus },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const invalidReference = error instanceof RangeError;
    return Response.json(
      { error: invalidReference ? "Referência M-Pesa inválida." : "Falha na reconciliação." },
      { status: invalidReference ? 400 : 500 }
    );
  }
}

function callbackToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();

  return new URL(request.url).searchParams.get("token")?.trim() || null;
}

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
