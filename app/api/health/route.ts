import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return healthResponse(request, 503, "configuration_missing", checkedAt, startedAt);
  }

  const { error } = await createSupabasePublicClient()
    .from("plans")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return error
    ? healthResponse(request, 503, "database_unavailable", checkedAt, startedAt)
    : healthResponse(request, 200, "ready", checkedAt, startedAt);
}

function healthResponse(
  request: Request,
  status: number,
  state: string,
  checkedAt: string,
  startedAt: number
) {
  const durationMs = Date.now() - startedAt;
  const log = JSON.stringify({
    level: status === 200 ? "info" : "error",
    message: "health_check",
    route: "/api/health",
    requestId: request.headers.get("x-vercel-id") ?? request.headers.get("x-request-id"),
    status,
    state,
    durationMs
  });

  if (status === 200) {
    console.info(log);
  } else {
    console.error(log);
  }

  return NextResponse.json(
    { service: "vuyela-web", state, checkedAt, durationMs },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
