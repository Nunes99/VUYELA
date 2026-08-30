"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { businessSettingsRoutes } from "@/features/business-settings/routes";
import { posAppRoutes } from "@/features/pos/routes";
import { requireRouteAccess } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const terminalActions = new Set(["create", "update", "activate", "suspend", "revoke"]);
const deviceActions = new Set(["create", "update", "activate", "revoke", "delete"]);
const deviceTypes = new Set(["browser", "camera", "printer", "card_terminal", "other"]);
const posSettingsSections = new Set(["general", "devices", "printer", "network", "security"]);
const paymentMethods = new Set(["mpesa", "emola", "mkesh", "cash", "card"]);

export async function updatePosTerminalSectionAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/pos", posAppRoutes.settings);
  const businessId = field(formData, "businessId");
  const terminalId = field(formData, "terminalId");
  const section = field(formData, "section");
  const view = field(formData, "view") || "geral";

  if (!businessId || !terminalId || !posSettingsSections.has(section)) {
    redirectToSettings(view, terminalId, "dados-invalidos");
  }

  const settings = terminalSectionPayload(section, formData);
  if (!settings) redirectToSettings(view, terminalId, "dados-invalidos");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("configure_pos_terminal_section", {
    p_business_id: businessId,
    p_terminal_id: terminalId,
    p_section: section,
    p_settings: settings
  });

  if (error) redirectToSettings(view, terminalId, "erro");
  revalidatePos();
  redirectToSettings(view, terminalId, "guardado");
}

export async function configureBusinessPaymentChannelAction(formData: FormData): Promise<void> {
  await requireRouteAccess("/negocio", businessSettingsRoutes.payments);
  const businessId = field(formData, "businessId");
  const branchId = field(formData, "branchId");
  const channelId = field(formData, "channelId");
  const method = field(formData, "method");

  if (!businessId || !branchId || !channelId || !paymentMethods.has(method)) {
    redirectToPayments(method, "dados-invalidos", businessId, branchId);
  }

  const payload = paymentConfigurationPayload(method, formData);
  if (!payload) redirectToPayments(method, "dados-invalidos", businessId, branchId);

  const supabase = await createSupabaseServerClient();
  const rpcName =
    method === "mpesa" ? "configure_mpesa_payment_channel" : "configure_business_payment_channel";
  const { data, error } = await supabase.rpc(rpcName, {
    p_business_id: businessId,
    p_channel_id: channelId,
    p_public_settings: payload.publicSettings,
    p_credentials: payload.credentials
  });

  if (error) redirectToPayments(method, "erro", businessId, branchId);
  if (method === "mpesa" && checked(formData, "activateAfterSave")) {
    const { error: activationError } = await supabase.rpc("manage_business_payment_channel", {
      p_business_id: businessId,
      p_channel_id: channelId,
      p_action: "activate"
    });
    if (activationError) {
      redirectToPayments(method, "nao-configurado", businessId, branchId);
    }
  }
  revalidatePos();
  redirectToPayments(
    method,
    method === "mpesa" && checked(formData, "activateAfterSave")
      ? "guardado"
      : data === "testing"
        ? "aguarda-teste"
        : "guardado",
    businessId,
    branchId
  );
}

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

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

function integerField(
  formData: FormData,
  name: string,
  minimum: number,
  maximum: number
): number | null {
  const value = Number(field(formData, name));
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value : null;
}

function decimalField(
  formData: FormData,
  name: string,
  minimum: number,
  maximum: number
): number | null {
  const value = Number(field(formData, name).replace(",", "."));
  return Number.isFinite(value) && value >= minimum && value <= maximum ? value : null;
}

function terminalSectionPayload(
  section: string,
  formData: FormData
): Record<string, string | number | boolean> | null {
  if (section === "general") {
    return {
      locale: field(formData, "locale") || "pt-MZ",
      timezone: field(formData, "timezone") || "Africa/Maputo",
      dateFormat: field(formData, "dateFormat") || "DD/MM/AAAA",
      receiptLogoEnabled: checked(formData, "receiptLogoEnabled"),
      thankYouMessage: field(formData, "thankYouMessage").slice(0, 160),
      receiptFooter: field(formData, "receiptFooter").slice(0, 240)
    };
  }

  if (section === "devices") {
    const sensitivity = integerField(formData, "scannerSensitivity", 1, 100);
    const timeout = integerField(formData, "readTimeoutSeconds", 1, 60);
    if (sensitivity === null || timeout === null) return null;
    return {
      qrCode: checked(formData, "qrCode"),
      ean13: checked(formData, "ean13"),
      code128: checked(formData, "code128"),
      pdf417: checked(formData, "pdf417"),
      dataMatrix: checked(formData, "dataMatrix"),
      aztec: checked(formData, "aztec"),
      scannerSensitivity: sensitivity,
      readTimeoutSeconds: timeout,
      soundConfirmation: checked(formData, "soundConfirmation"),
      vibration: checked(formData, "vibration"),
      continuousReading: checked(formData, "continuousReading")
    };
  }

  if (section === "printer") {
    const copies = integerField(formData, "receiptCopies", 1, 5);
    if (copies === null) return null;
    return {
      paperWidth: field(formData, "paperWidth") || "80mm",
      receiptCopies: copies,
      fontSize: field(formData, "fontSize") || "normal",
      printAutomatically: checked(formData, "printAutomatically"),
      printLogo: checked(formData, "printLogo")
    };
  }

  if (section === "network") {
    const interval = integerField(formData, "syncIntervalMinutes", 1, 120);
    const apiBaseUrl = field(formData, "apiBaseUrl");
    if (interval === null || !isHttpUrl(apiBaseUrl)) return null;
    return {
      allowOfflineSales: checked(formData, "allowOfflineSales"),
      syncIntervalMinutes: interval,
      apiBaseUrl
    };
  }

  const inactivity = integerField(formData, "inactivityTimeoutMinutes", 5, 480);
  const forcePinDays = integerField(formData, "forcePinChangeDays", 30, 365);
  if (inactivity === null || forcePinDays === null) return null;
  return {
    requireQuickAccessPin: checked(formData, "requireQuickAccessPin"),
    inactivityTimeoutMinutes: inactivity,
    forcePinChangeDays: forcePinDays,
    automaticCloudBackup: checked(formData, "automaticCloudBackup"),
    backupFrequency: field(formData, "backupFrequency") || "daily"
  };
}

function paymentConfigurationPayload(
  method: string,
  formData: FormData
): {
  publicSettings: Record<string, string | number | boolean>;
  credentials: Record<string, string>;
} | null {
  if (method === "mpesa") {
    const minimumAmount = integerField(formData, "minimumAmount", 1, 1_000_000);
    const maximumAmount = integerField(formData, "maximumAmount", 1, 10_000_000);
    const timeoutSeconds = integerField(formData, "timeoutSeconds", 30, 600);
    const c2bResourceUrl = field(formData, "c2bResourceUrl");
    if (
      minimumAmount === null ||
      maximumAmount === null ||
      timeoutSeconds === null ||
      maximumAmount < minimumAmount ||
      !isHttpUrl(c2bResourceUrl)
    )
      return null;
    return {
      publicSettings: {
        merchantId: field(formData, "merchantId").slice(0, 80),
        environment: field(formData, "environment") || "sandbox",
        c2bResourceUrl: c2bResourceUrl.slice(0, 500),
        requestOrigin: field(formData, "requestOrigin").slice(0, 300) || "*",
        minimumAmount,
        maximumAmount,
        timeoutSeconds,
        smsNotifications: checked(formData, "smsNotifications"),
        ussdShortcode: field(formData, "ussdShortcode").slice(0, 30),
        confirmationNumber: field(formData, "confirmationNumber").slice(0, 30),
        autoReconciliation: checked(formData, "autoReconciliation"),
        reconciliationFrequency: field(formData, "reconciliationFrequency") || "daily",
        reportEmail: field(formData, "reportEmail").slice(0, 254)
      },
      credentials: nonEmptySecrets(formData, ["apiKey", "publicKey"])
    };
  }

  if (method === "emola") {
    const minimumAmount = integerField(formData, "minimumAmount", 1, 1_000_000);
    const maximumAmount = integerField(formData, "maximumAmount", 1, 10_000_000);
    const dailyTransactionLimit = integerField(formData, "dailyTransactionLimit", 1, 100_000);
    const callbackUrl = field(formData, "callbackUrl");
    if (
      minimumAmount === null ||
      maximumAmount === null ||
      dailyTransactionLimit === null ||
      maximumAmount < minimumAmount ||
      !isHttpUrl(callbackUrl)
    )
      return null;
    return {
      publicSettings: {
        partnerCode: field(formData, "partnerCode").slice(0, 80),
        callbackUrl,
        minimumAmount,
        maximumAmount,
        dailyTransactionLimit,
        pushNotifications: checked(formData, "pushNotifications"),
        smsFallback: checked(formData, "smsFallback"),
        supportEmail: field(formData, "supportEmail").slice(0, 254)
      },
      credentials: nonEmptySecrets(formData, ["integrationToken"])
    };
  }

  if (method === "mkesh") {
    const qrValidityMinutes = integerField(formData, "qrValidityMinutes", 1, 1440);
    const maximumRetries = integerField(formData, "maximumRetries", 0, 10);
    const successUrl = field(formData, "successUrl");
    const failureUrl = field(formData, "failureUrl");
    if (
      qrValidityMinutes === null ||
      maximumRetries === null ||
      !isHttpUrl(successUrl) ||
      !isHttpUrl(failureUrl)
    )
      return null;
    return {
      publicSettings: {
        merchantId: field(formData, "merchantId").slice(0, 80),
        environment: field(formData, "environment") || "sandbox",
        staticQrCode: checked(formData, "staticQrCode"),
        qrValidityMinutes,
        referencePrefix: field(formData, "referencePrefix").slice(0, 12),
        successUrl,
        failureUrl,
        automaticRetry: checked(formData, "automaticRetry"),
        maximumRetries
      },
      credentials: nonEmptySecrets(formData, ["rsaPublicKey"])
    };
  }

  if (method === "cash") {
    const initialFloat = integerField(formData, "initialFloat", 0, 10_000_000);
    const lowFundAlert = integerField(formData, "lowFundAlert", 0, 10_000_000);
    const managerApprovalThreshold = integerField(
      formData,
      "managerApprovalThreshold",
      0,
      10_000_000
    );
    const maximumCashBalance = integerField(formData, "maximumCashBalance", 1, 100_000_000);
    const safeDepositThreshold = integerField(formData, "safeDepositThreshold", 1, 100_000_000);
    if (
      [
        initialFloat,
        lowFundAlert,
        managerApprovalThreshold,
        maximumCashBalance,
        safeDepositThreshold
      ].some((value) => value === null)
    )
      return null;
    return {
      publicSettings: {
        initialFloat: initialFloat as number,
        lowFundAlert: lowFundAlert as number,
        mandatoryCloseCount: checked(formData, "mandatoryCloseCount"),
        automaticRounding: checked(formData, "automaticRounding"),
        roundingUnit: integerField(formData, "roundingUnit", 1, 100) ?? 1,
        logChange: checked(formData, "logChange"),
        managerApprovalThreshold: managerApprovalThreshold as number,
        maximumCashBalance: maximumCashBalance as number,
        safeDepositThreshold: safeDepositThreshold as number,
        automaticClosingTime: field(formData, "automaticClosingTime") || "22:00",
        printClosingReport: checked(formData, "printClosingReport"),
        emailClosingReport: checked(formData, "emailClosingReport")
      },
      credentials: {}
    };
  }

  const processingRate = decimalField(formData, "processingRate", 0, 20);
  const fixedFee = integerField(formData, "fixedFee", 0, 100_000);
  const contactlessLimit = integerField(formData, "contactlessLimit", 0, 1_000_000);
  const pinThreshold = integerField(formData, "pinThreshold", 0, 1_000_000);
  if (
    processingRate === null ||
    fixedFee === null ||
    contactlessLimit === null ||
    pinThreshold === null
  )
    return null;
  return {
    publicSettings: {
      terminalModel: field(formData, "terminalModel").slice(0, 100),
      terminalSerialNumber: field(formData, "terminalSerialNumber").slice(0, 100),
      connectionType: field(formData, "connectionType") || "wifi_4g",
      visa: checked(formData, "visa"),
      mastercard: checked(formData, "mastercard"),
      maestro: checked(formData, "maestro"),
      americanExpress: checked(formData, "americanExpress"),
      unionPay: checked(formData, "unionPay"),
      contactless: checked(formData, "contactless"),
      contactlessLimit,
      pinThreshold,
      preAuthorization: checked(formData, "preAuthorization"),
      processingRate,
      fixedFee
    },
    credentials: {}
  };
}

function nonEmptySecrets(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(
    names.map((name) => [name, field(formData, name)]).filter((entry) => entry[1].length > 0)
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return false;
  }
}

function nullableField(formData: FormData, name: string): string | null {
  return field(formData, name) || null;
}

function revalidatePos() {
  revalidatePath("/pos");
  revalidatePath("/pos/definicoes");
  revalidatePath("/negocio/definicoes");
  revalidatePath(businessSettingsRoutes.payments);
  revalidatePath(posAppRoutes.root);
  revalidatePath(posAppRoutes.settings);
}

function redirectToSettings(view: string, terminalId: string, result: string): never {
  const params = new URLSearchParams({ vista: view, resultado: result });
  if (terminalId) params.set("terminal", terminalId);
  redirect(`${posAppRoutes.settings}?${params.toString()}`);
}

function redirectToPayments(
  method: string,
  result: string,
  businessId: string,
  branchId: string
): never {
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
  if (businessId) params.set("businessId", businessId);
  if (branchId) params.set("branchId", branchId);
  redirect(`${businessSettingsRoutes.payments}?${params.toString()}`);
}
