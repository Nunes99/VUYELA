import { NextRequest } from "next/server";

import { getAdminDashboardState } from "@/features/admin/data";
import { normalizeAdminFilter, normalizeAdminQuery, parseAdminView } from "@/features/admin/model";
import type { AdminDashboardReadyState, AdminView } from "@/features/admin/model";
import { getProtectedRouteState } from "@/lib/auth/session";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

const exportableViews = new Set<AdminView>([
  "businesses",
  "categories",
  "users",
  "subscriptions",
  "support",
  "fraud",
  "audit"
]);

export async function GET(request: NextRequest) {
  const authState = await getProtectedRouteState("/admin", "/admin");
  if (authState.status !== "authorized") {
    return new Response("Acesso negado.", { status: 403 });
  }

  const view = parseAdminView(request.nextUrl.searchParams.get("view") ?? undefined);
  if (!exportableViews.has(view)) {
    return new Response("Exportação não suportada.", { status: 400 });
  }

  const query = normalizeAdminQuery(request.nextUrl.searchParams.get("q") ?? undefined);
  const filter = normalizeAdminFilter(request.nextUrl.searchParams.get("filter") ?? undefined);
  const state = await getAdminDashboardState(
    authState.principal,
    view,
    query,
    "",
    filter,
    1,
    false
  );

  if (state.status !== "ready") {
    return new Response("Não foi possível preparar a exportação.", { status: 403 });
  }

  const rows = exportRows(state);
  const csv = toCsv(rows);
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_profile_id: authState.principal.profileId,
    action: "export",
    entity_table: view,
    after_data: { query, filter, rowCount: rows.length },
    context: { operation: "admin_csv_export" }
  });

  if (error) {
    return new Response("Não foi possível auditar a exportação.", { status: 500 });
  }

  const filename = `vuyela-${view}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store"
    }
  });
}

function exportRows(state: AdminDashboardReadyState): Array<Record<string, unknown>> {
  if (state.view === "businesses") {
    return state.businesses.map((item) => ({
      nome: item.name,
      identificador: item.slug,
      estado: item.status,
      proprietario: item.ownerName,
      criado_em: item.createdAt,
      revisto_em: item.reviewedAt
    }));
  }
  if (state.view === "categories") {
    return state.categories.map((item) => ({
      nome: item.name,
      identificador: item.slug,
      ativa: item.isActive,
      negocios: item.businessCount,
      ordem: item.sortOrder
    }));
  }
  if (state.view === "users") {
    return state.users.map((item) => ({
      nome: item.displayName,
      email: item.email,
      telefone: item.phone,
      funcao: item.role,
      estado: item.accountStatus,
      criado_em: item.createdAt
    }));
  }
  if (state.view === "subscriptions") {
    return state.subscriptions.map((item) => ({
      negocio: item.businessName,
      plano: item.planName,
      estado: item.status,
      preco_mzn: item.monthlyPriceMznMinor === null ? null : item.monthlyPriceMznMinor / 100,
      fim_periodo: item.currentPeriodEnd,
      fim_teste: item.trialEndsAt
    }));
  }
  if (state.view === "support") {
    return state.tickets.map((item) => ({
      assunto: item.subject,
      estado: item.status,
      prioridade: item.priority,
      requerente: item.requesterName,
      negocio: item.businessName,
      responsavel: item.assignedToName,
      mensagens: item.messages.length,
      criado_em: item.createdAt
    }));
  }
  if (state.view === "fraud") {
    return state.fraudEvents.map((item) => ({
      tipo: item.eventType,
      gravidade: item.severity,
      triagem: item.triageStatus,
      negocio: item.businessName,
      utilizador: item.profileName,
      responsavel: item.assignedToName,
      criado_em: item.createdAt
    }));
  }

  return state.auditEntries.map((item) => ({
    acao: item.action,
    operacao: item.operation,
    recurso: item.entityTable,
    utilizador: item.actorName,
    negocio: item.businessName,
    alteracao: item.changeSummary,
    ip: item.ipAddress,
    criado_em: item.createdAt
  }));
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  if (keys.length === 0) {
    return "sem_resultados\n";
  }

  return [
    keys.map(csvCell).join(","),
    ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(","))
  ].join("\n");
}

function csvCell(value: unknown): string {
  const serialized = value === null || value === undefined ? "" : String(value);
  return `"${serialized.replaceAll('"', '""')}"`;
}
