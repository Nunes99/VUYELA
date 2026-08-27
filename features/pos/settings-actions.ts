"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { posAppRoutes } from "@/features/pos/routes";
import { requireRouteAccess } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const terminalActions = new Set(["create", "update", "activate", "suspend", "revoke"]);
const deviceActions = new Set(["create", "update", "activate", "revoke", "delete"]);
const deviceTypes = new Set(["browser", "camera", "printer", "card_terminal", "other"]);

export async function managePosTerminalAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/pos", posAppRoutes.settings);
  const businessId = field(formData, "businessId");
  const operation = field(formData, "operation");
  const name = field(formData, "name");
  const branchId = field(formData, "branchId");

  if (
    !businessId ||
    !terminalActions.has(operation) ||
    ((operation === "create" || operation === "update") && (!branchId || name.length < 2))
  ) {
    redirectToSettings("geral", field(formData, "terminalId"), "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("manage_pos_terminal", {
    p_business_id: businessId,
    p_terminal_id: nullableField(formData, "terminalId"),
    p_action: operation,
    p_branch_id: branchId || null,
    p_name: name || null,
    p_code: field(formData, "code") || null
  });

  if (error) redirectToSettings("geral", field(formData, "terminalId"), "erro");
  revalidatePos();
  redirectToSettings(
    "geral",
    typeof data === "string" ? data : field(formData, "terminalId"),
    "guardado"
  );
}

export async function updatePosTerminalSettingsAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/pos", posAppRoutes.settings);
  const businessId = field(formData, "businessId");
  const terminalId = field(formData, "terminalId");
  const timeout = Number(field(formData, "inactivity_timeout_minutes"));
  const allowedLookupMethods = [
    field(formData, "lookupQr") === "on" ? "qr" : null,
    field(formData, "lookupCard") === "on" ? "card" : null,
    field(formData, "lookupPhone") === "on" ? "phone" : null
  ].filter((value): value is string => value !== null);

  if (
    !businessId ||
    !terminalId ||
    !Number.isInteger(timeout) ||
    timeout < 5 ||
    timeout > 480 ||
    allowedLookupMethods.length === 0
  ) {
    redirectToSettings("geral", terminalId, "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_pos_terminal_settings", {
    p_business_id: businessId,
    p_terminal_id: terminalId,
    p_require_customer_authorization: field(formData, "requireCustomerAuthorization") === "on",
    p_print_receipt_automatically: field(formData, "printReceiptAutomatically") === "on",
    p_show_points_balance: field(formData, "showPointsBalance") === "on",
    p_show_mzn_equivalent: field(formData, "showMznEquivalent") === "on",
    p_inactivity_timeout_minutes: timeout,
    p_allowed_lookup_methods: allowedLookupMethods
  });

  if (error) redirectToSettings("geral", terminalId, "erro");
  revalidatePos();
  redirectToSettings("geral", terminalId, "guardado");
}

export async function managePosTerminalDeviceAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/pos", posAppRoutes.settings);
  const businessId = field(formData, "businessId");
  const terminalId = field(formData, "terminalId");
  const operation = field(formData, "operation");
  const deviceType = field(formData, "deviceType");

  if (!businessId || !terminalId || !deviceActions.has(operation) || !deviceTypes.has(deviceType)) {
    redirectToSettings("dispositivos", terminalId, "dados-invalidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_pos_terminal_device", {
    p_business_id: businessId,
    p_terminal_id: terminalId,
    p_device_id: nullableField(formData, "deviceId"),
    p_action: operation,
    p_device_type: deviceType,
    p_label: field(formData, "label") || null,
    p_device_reference: field(formData, "deviceReference") || null
  });

  if (error) redirectToSettings("dispositivos", terminalId, "erro");
  revalidatePos();
  redirectToSettings("dispositivos", terminalId, "guardado");
}

export async function managePosPaymentChannelAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/pos", posAppRoutes.payments);
  const businessId = field(formData, "businessId");
  const channelId = field(formData, "channelId");
  const operation = field(formData, "operation");
  const method = field(formData, "method");

  if (!businessId || !channelId || (operation !== "activate" && operation !== "suspend")) {
    redirectToPayments(method, "erro");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_business_payment_channel", {
    p_business_id: businessId,
    p_channel_id: channelId,
    p_action: operation
  });

  if (error) redirectToPayments(method, "nao-configurado");
  revalidatePos();
  redirectToPayments(method, "guardado");
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function nullableField(formData: FormData, name: string): string | null {
  return field(formData, name) || null;
}

function revalidatePos() {
  revalidatePath("/pos");
  revalidatePath("/pos/definicoes");
  revalidatePath("/pos/definicoes/pagamentos");
  revalidatePath(posAppRoutes.root);
  revalidatePath(posAppRoutes.settings);
  revalidatePath(posAppRoutes.payments);
}

function redirectToSettings(view: string, terminalId: string, result: string): never {
  const params = new URLSearchParams({ vista: view, resultado: result });
  if (terminalId) params.set("terminal", terminalId);
  redirect(`${posAppRoutes.settings}?${params.toString()}`);
}

function redirectToPayments(method: string, result: string): never {
  const methodMap: Record<string, string> = {
    cash: "dinheiro",
    card: "cartao",
    mpesa: "mpesa",
    emola: "emola",
    mkesh: "mkesh"
  };
  const params = new URLSearchParams({
    metodo: methodMap[method] ?? "mpesa",
    resultado: result
  });
  redirect(`${posAppRoutes.payments}?${params.toString()}`);
}
