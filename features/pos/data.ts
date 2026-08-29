import "server-only";

import type { AuthPrincipal, BusinessMemberRole, BusinessMembership } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface BusinessRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

interface BranchRow {
  id: string;
  business_id: string;
  name: string;
  city: string;
  phone: string | null;
  address_line: string | null;
  is_primary: boolean;
}

interface CatalogRow {
  id: string;
  business_id: string;
  branch_id: string | null;
  kind: "service" | "product";
  sku: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price_mzn_minor: number;
  loyalty_discount_percent: number | string;
  sort_order: number;
}

export interface PosBranchContext {
  id: string;
  businessId: string;
  name: string;
  city: string;
  phone: string | null;
  addressLine: string | null;
}

export type PosTerminalStatus = "provisioning" | "active" | "suspended" | "revoked";
export type PosDeviceStatus = "pending" | "active" | "revoked";
export type PosPaymentChannelStatus = "unconfigured" | "testing" | "active" | "suspended";

export interface PosTerminalSettingsContext {
  locale: string;
  currency: string;
  timezone: string;
  requireCustomerAuthorization: boolean;
  printReceiptAutomatically: boolean;
  showPointsBalance: boolean;
  showMznEquivalent: boolean;
  inactivityTimeoutMinutes: number;
  allowedLookupMethods: Array<"qr" | "card" | "phone">;
  configuration: Record<string, unknown>;
}

export interface PosDeviceContext {
  id: string;
  type: "browser" | "camera" | "printer" | "card_terminal" | "other";
  label: string;
  deviceReference: string;
  status: PosDeviceStatus;
  lastSeenAt: string | null;
}

export interface PosTerminalContext {
  id: string;
  businessId: string;
  branchId: string;
  code: string;
  name: string;
  status: PosTerminalStatus;
  lastSeenAt: string | null;
  settings: PosTerminalSettingsContext;
  devices: PosDeviceContext[];
}

export interface PosPaymentChannelContext {
  id: string;
  businessId: string;
  branchId: string | null;
  method: "cash" | "card" | "mpesa" | "emola" | "mkesh";
  mode: "manual" | "provider";
  status: PosPaymentChannelStatus;
  providerKey: string | null;
  maskedIdentifier: string | null;
  credentialsConfigured: boolean;
  publicSettings: Record<string, unknown>;
}

export interface PosCatalogItemContext {
  id: string;
  branchId: string | null;
  kind: "service" | "product";
  sku: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMznMinor: number;
  loyaltyDiscountPercent: number;
  sortOrder: number;
}

export interface PosBusinessContext {
  id: string;
  name: string;
  nuit: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  branches: PosBranchContext[];
  defaultBranchId: string;
  requiresBranch: boolean;
  roleLabels: string[];
  canManage: boolean;
  terminals: PosTerminalContext[];
  paymentChannels: PosPaymentChannelContext[];
  catalogItems: PosCatalogItemContext[];
}

export type PosContextState =
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; businesses: PosBusinessContext[] };

const posRoles = new Set<BusinessMemberRole>([
  "cashier",
  "branch_manager",
  "business_admin",
  "business_owner"
]);

const businessWideRoles = new Set<BusinessMemberRole>(["business_admin", "business_owner"]);

const roleLabels: Record<BusinessMemberRole, string> = {
  cashier: "Caixa",
  branch_manager: "Gestor de filial",
  business_admin: "Admin do negócio",
  business_owner: "Proprietário"
};

export async function getPosContext(principal: AuthPrincipal): Promise<PosContextState> {
  const memberships = principal.businessMemberships.filter(
    (membership) => membership.status === "active" && posRoles.has(membership.role)
  );

  if (memberships.length === 0) {
    return {
      status: "empty",
      message: "Esta conta ainda não tem um papel ativo para operar o POS."
    };
  }

  const businessIds = uniqueValues(memberships.map((membership) => membership.businessId));
  const supabase = await createSupabaseServerClient();
  const [
    { data: businessData, error: businessError },
    { data: branchData, error: branchError },
    { data: catalogData, error: catalogError }
  ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, phone, email, logo_url, cover_url")
        .in("id", businessIds)
        .eq("status", "active"),
      supabase
        .from("branches")
        .select("id, business_id, name, city, phone, address_line, is_primary")
        .in("business_id", businessIds)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("business_catalog_items")
        .select(
          "id, business_id, branch_id, kind, sku, name, description, image_url, price_mzn_minor, loyalty_discount_percent, sort_order"
        )
        .in("business_id", businessIds)
        .eq("is_available", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
    ]);

  if (businessError || branchError || catalogError) {
    return {
      status: "error",
      message: "Não foi possível carregar negócios, filiais e catálogo do POS."
    };
  }

  const branchesByBusinessId = groupBranches(rowsFrom<BranchRow>(branchData));
  const catalogByBusinessId = groupCatalogItems(rowsFrom<CatalogRow>(catalogData));
  const membershipsByBusinessId = groupMemberships(memberships);
  const businessShells = rowsFrom<BusinessRow>(businessData)
    .map((business): PosBusinessContext | null => {
      const businessMemberships = membershipsByBusinessId.get(business.id) ?? [];
      const hasBusinessWideAccess = businessMemberships.some((membership) =>
        businessWideRoles.has(membership.role)
      );
      const allowedBranchIds = new Set(
        businessMemberships
          .map((membership) => membership.branchId)
          .filter((branchId): branchId is string => Boolean(branchId))
      );
      const allBranches = branchesByBusinessId.get(business.id) ?? [];
      const branches = hasBusinessWideAccess
        ? allBranches
        : allBranches.filter((branch) => allowedBranchIds.has(branch.id));
      const membershipBranchId = businessMemberships
        .map((membership) => membership.branchId)
        .find((branchId) => branchId && branches.some((branch) => branch.id === branchId));
      const defaultBranchId =
        typeof membershipBranchId === "string" ? membershipBranchId : (branches[0]?.id ?? "");

      if (!hasBusinessWideAccess && branches.length === 0) {
        return null;
      }

      return {
        id: business.id,
        name: business.name,
        nuit: null,
        phone: business.phone,
        email: business.email,
        logoUrl: business.logo_url,
        coverUrl: business.cover_url,
        branches,
        defaultBranchId,
        requiresBranch: !hasBusinessWideAccess,
        canManage: businessMemberships.some((membership) => businessWideRoles.has(membership.role)),
        terminals: [],
        paymentChannels: [],
        catalogItems: catalogByBusinessId.get(business.id) ?? [],
        roleLabels: uniqueValues(
          businessMemberships.map((membership) => roleLabels[membership.role])
        )
      };
    })
    .filter((business): business is PosBusinessContext => business !== null);

  if (businessShells.length === 0) {
    return {
      status: "empty",
      message: "Não há filiais ativas disponíveis para esta conta de POS."
    };
  }

  const operationResults = await Promise.all(
    businessShells.map(async (business) => {
      const { data, error } = await supabase.rpc("get_pos_operations", {
        p_business_id: business.id
      });

      return { business, row: firstRow<PosOperationsRow>(data), error };
    })
  );

  if (operationResults.some((result) => result.error || !result.row)) {
    return {
      status: "error",
      message: "Não foi possível carregar os terminais e os canais de pagamento do POS."
    };
  }

  const businesses = operationResults.map(({ business, row }) => ({
    ...business,
    terminals: parseTerminals(row?.terminals),
    paymentChannels: parsePaymentChannels(row?.payment_channels)
  }));

  return { status: "ready", businesses };
}

interface PosOperationsRow {
  terminals: unknown;
  payment_channels: unknown;
  catalog_items: unknown;
}

const defaultTerminalSettings: PosTerminalSettingsContext = {
  locale: "pt-MZ",
  currency: "MZN",
  timezone: "Africa/Maputo",
  requireCustomerAuthorization: true,
  printReceiptAutomatically: false,
  showPointsBalance: true,
  showMznEquivalent: true,
  inactivityTimeoutMinutes: 30,
  allowedLookupMethods: ["qr", "card", "phone"],
  configuration: {}
};

function firstRow<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length > 0 ? (data[0] as T) : null;
}

function parseTerminals(value: unknown): PosTerminalContext[] {
  return objectRows(value).map((item) => {
    const settings = isRecord(item.settings) ? item.settings : {};
    const configuration = isRecord(settings.settings) ? settings.settings : {};
    const lookupMethods = Array.isArray(settings.allowedLookupMethods)
      ? settings.allowedLookupMethods.filter(isLookupMethod)
      : defaultTerminalSettings.allowedLookupMethods;

    return {
      id: stringValue(item.id),
      businessId: stringValue(item.businessId),
      branchId: stringValue(item.branchId),
      code: stringValue(item.code),
      name: stringValue(item.name),
      status: terminalStatus(item.status),
      lastSeenAt: nullableString(item.lastSeenAt),
      settings: {
        locale: stringValue(settings.locale) || defaultTerminalSettings.locale,
        currency: stringValue(settings.currency) || defaultTerminalSettings.currency,
        timezone: stringValue(settings.timezone) || defaultTerminalSettings.timezone,
        requireCustomerAuthorization: booleanValue(settings.requireCustomerAuthorization, true),
        printReceiptAutomatically: booleanValue(settings.printReceiptAutomatically, false),
        showPointsBalance: booleanValue(settings.showPointsBalance, true),
        showMznEquivalent: booleanValue(settings.showMznEquivalent, true),
        inactivityTimeoutMinutes: numberValue(settings.inactivityTimeoutMinutes, 30),
        allowedLookupMethods: lookupMethods.length
          ? lookupMethods
          : defaultTerminalSettings.allowedLookupMethods,
        configuration
      },
      devices: parseDevices(item.devices)
    };
  });
}

function parseDevices(value: unknown): PosDeviceContext[] {
  return objectRows(value).map((item) => ({
    id: stringValue(item.id),
    type: deviceType(item.type),
    label: stringValue(item.label),
    deviceReference: stringValue(item.deviceReference),
    status: deviceStatus(item.status),
    lastSeenAt: nullableString(item.lastSeenAt)
  }));
}

function parsePaymentChannels(value: unknown): PosPaymentChannelContext[] {
  return objectRows(value).map((item) => ({
    id: stringValue(item.id),
    businessId: stringValue(item.businessId),
    branchId: nullableString(item.branchId),
    method: paymentMethod(item.method),
    mode: item.mode === "provider" ? "provider" : "manual",
    status: paymentChannelStatus(item.status),
    providerKey: nullableString(item.providerKey),
    maskedIdentifier: nullableString(item.maskedIdentifier),
    credentialsConfigured: booleanValue(item.credentialsConfigured, false),
    publicSettings: isRecord(item.publicSettings) ? item.publicSettings : {}
  }));
}

function objectRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isLookupMethod(value: unknown): value is "qr" | "card" | "phone" {
  return value === "qr" || value === "card" || value === "phone";
}

function terminalStatus(value: unknown): PosTerminalStatus {
  return value === "active" || value === "suspended" || value === "revoked"
    ? value
    : "provisioning";
}

function deviceType(value: unknown): PosDeviceContext["type"] {
  return value === "browser" ||
    value === "camera" ||
    value === "printer" ||
    value === "card_terminal"
    ? value
    : "other";
}

function deviceStatus(value: unknown): PosDeviceStatus {
  return value === "active" || value === "revoked" ? value : "pending";
}

function paymentMethod(value: unknown): PosPaymentChannelContext["method"] {
  return value === "card" || value === "mpesa" || value === "emola" || value === "mkesh"
    ? value
    : "cash";
}

function paymentChannelStatus(value: unknown): PosPaymentChannelStatus {
  return value === "testing" || value === "active" || value === "suspended"
    ? value
    : "unconfigured";
}

function rowsFrom<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

function groupMemberships(memberships: BusinessMembership[]) {
  const groups = new Map<string, BusinessMembership[]>();

  for (const membership of memberships) {
    groups.set(membership.businessId, [...(groups.get(membership.businessId) ?? []), membership]);
  }

  return groups;
}

function groupBranches(branches: BranchRow[]) {
  const groups = new Map<string, PosBranchContext[]>();

  for (const branch of branches) {
    groups.set(branch.business_id, [
      ...(groups.get(branch.business_id) ?? []),
      {
        id: branch.id,
        businessId: branch.business_id,
        name: branch.name,
        city: branch.city,
        phone: branch.phone,
        addressLine: branch.address_line
      }
    ]);
  }

  return groups;
}

function groupCatalogItems(items: CatalogRow[]) {
  const groups = new Map<string, PosCatalogItemContext[]>();

  for (const item of items) {
    groups.set(item.business_id, [
      ...(groups.get(item.business_id) ?? []),
      {
        id: item.id,
        branchId: item.branch_id,
        kind: item.kind,
        sku: item.sku,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        priceMznMinor: item.price_mzn_minor,
        loyaltyDiscountPercent: numberValue(item.loyalty_discount_percent, 0),
        sortOrder: item.sort_order
      }
    ]);
  }

  return groups;
}
