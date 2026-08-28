import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return healthResponse(503, "configuration_missing", checkedAt);
  }

  const { error } = await createSupabasePublicClient()
    .from("plans")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return error
    ? healthResponse(503, "database_unavailable", checkedAt)
    : healthResponse(200, "ready", checkedAt);
}

function healthResponse(status: number, state: string, checkedAt: string) {
  return NextResponse.json(
    { service: "vuyela-web", state, checkedAt },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
