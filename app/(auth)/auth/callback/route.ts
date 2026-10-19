import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) {
    return "/cliente";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const isRecovery = requestUrl.searchParams.get("type") === "recovery";
  const requestedNext = getSafeNextPath(requestUrl.searchParams.get("next"));
  const next =
    isRecovery && new URL(requestedNext, requestUrl.origin).pathname !== "/definir-senha"
      ? "/definir-senha"
      : requestedNext;

  if (code || (tokenHash && isRecovery)) {
    const supabase = await createSupabaseServerClient();
    const { error } =
      tokenHash && isRecovery
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        : await supabase.auth.exchangeCodeForSession(code!);

    if (error) {
      return NextResponse.redirect(new URL("/entrar?erro=link-invalido", requestUrl.origin));
    }
  } else {
    return NextResponse.redirect(new URL("/entrar?erro=link-invalido", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
