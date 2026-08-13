import "server-only";

import type { AuthPrincipal, BusinessMemberRole, BusinessMembership } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { buildBusinessDashboardViewModel } from "./model";
import type {
  BusinessDashboardBranch,
  BusinessDashboardBusiness,
  BusinessDashboardCampaign,
  BusinessDashboardCustomer,
  BusinessDashboardEmployee,
  BusinessDashboardProgram,
  BusinessDashboardSettings,
  BusinessDashboardTransaction,
  BusinessDashboardViewModel
} from "./model";

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface BranchRow {
  id: string;
  business_id: string;
  name: string;
  city: string;
  is_primary: boolean;
}

interface BusinessDashboardRpcRow {
  business: unknown;
  program: unknown;
  customers: unknown;
  transactions: unknown;
  campaigns: unknown;
  branches: unknown;
  employees: unknown;
  settings: unknown;
  scope_label: string;
  has_manager_scope: boolean;
}

export interface BusinessDashboardBranchOption {
  id: string;
  name: string;
  city: string;
}

export interface BusinessDashboardBusinessOption {
  id: string;
  name: string;
  branches: BusinessDashboardBranchOption[];
  allowWholeBusiness: boolean;
  defaultBranchId: string;
}

export type BusinessDashboardState =
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      dashboard: BusinessDashboardViewModel;
      businesses: BusinessDashboardBusinessOption[];
      selectedBusinessId: string;
      selectedBranchId: string;
    };

const dashboardRoles = new Set<BusinessMemberRole>([
  "branch_manager",
  "business_admin",
  "business_owner"
]);

const businessWideRoles = new Set<BusinessMemberRole>(["business_admin", "business_owner"]);

export async function getBusinessDashboard(
  principal: AuthPrincipal,
  params: { businessId?: string | undefined; branchId?: string | undefined } = {}
): Promise<BusinessDashboardState> {
  const memberships = principal.businessMemberships.filter(
    (membership) => membership.status === "active" && dashboardRoles.has(membership.role)
  );

  if (memberships.length === 0) {
    return {
      status: "empty",
      message: "Esta conta ainda nao tem permissao activa para o dashboard do negocio."
    };
  }

  const supabase = await createSupabaseServerClient();
  const businessIds = uniqueValues(memberships.map((membership) => membership.businessId));
  const [{ data: businessData, error: businessError }, { data: branchData, error: branchError }] =
    await Promise.all([
      supabase.from("businesses").select("id, name, slug, status").in("id", businessIds),
      supabase
        .from("branches")
        .select("id, business_id, name, city, is_primary")
        .in("business_id", businessIds)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("name", { ascending: true })
    ]);

  if (businessError || branchError) {
    return { status: "error", message: "Nao foi possivel carregar o contexto do negocio." };
  }

  const businesses = buildBusinessOptions(
    rowsFrom<BusinessRow>(businessData),
    rowsFrom<BranchRow>(branchData),
    memberships
  );

  if (businesses.length === 0) {
    return {
      status: "empty",
      message: "Nao ha negocios ou filiais activos disponiveis para este dashboard."
    };
  }

  const selectedBusiness =
    businesses.find((business) => business.id === params.businessId) ?? businesses[0];
  const selectedBranchId = getSelectedBranchId(selectedBusiness, params.branchId);
  const { data, error } = await supabase.rpc("get_business_dashboard", {
    p_business_id: selectedBusiness.id,
    p_branch_id: selectedBranchId || null,
    p_window_days: 90
  });

  if (error) {
    return { status: "error", message: "Nao foi possivel carregar o dashboard do negocio." };
  }

  const row = Array.isArray(data) ? (data[0] as BusinessDashboardRpcRow | undefined) : undefined;

  if (!row) {
    return { status: "error", message: "Dashboard do negocio indisponivel." };
  }

  const business = objectFrom<BusinessDashboardBusiness>(row.business);
  const settings = objectFrom<BusinessDashboardSettings>(row.settings);

  if (!business || !settings) {
    return { status: "error", message: "Dashboard do negocio incompleto." };
  }

  return {
    status: "ready",
    selectedBusinessId: selectedBusiness.id,
    selectedBranchId,
    businesses,
    dashboard: buildBusinessDashboardViewModel({
      business,
      program: objectFrom<BusinessDashboardProgram>(row.program),
      customers: arrayFrom<BusinessDashboardCustomer>(row.customers),
      transactions: arrayFrom<BusinessDashboardTransaction>(row.transactions),
      campaigns: arrayFrom<BusinessDashboardCampaign>(row.campaigns),
      branches: arrayFrom<BusinessDashboardBranch>(row.branches),
      employees: arrayFrom<BusinessDashboardEmployee>(row.employees),
      settings,
      scopeLabel: row.scope_label,
      hasManagerScope: row.has_manager_scope
    })
  };
}

function buildBusinessOptions(
  businesses: BusinessRow[],
  branches: BranchRow[],
  memberships: BusinessMembership[]
): BusinessDashboardBusinessOption[] {
  const branchesByBusinessId = groupBranches(branches);
  const membershipsByBusinessId = groupMemberships(memberships);

  return businesses
    .map((business): BusinessDashboardBusinessOption | null => {
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
      const visibleBranches = hasBusinessWideAccess
        ? allBranches
        : allBranches.filter((branch) => allowedBranchIds.has(branch.id));

      if (!hasBusinessWideAccess && visibleBranches.length === 0) {
        return null;
      }

      return {
        id: business.id,
        name: business.name,
        branches: visibleBranches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          city: branch.city
        })),
        allowWholeBusiness: hasBusinessWideAccess,
        defaultBranchId: hasBusinessWideAccess ? "" : (visibleBranches[0]?.id ?? "")
      };
    })
    .filter((business): business is BusinessDashboardBusinessOption => business !== null);
}

function getSelectedBranchId(
  business: BusinessDashboardBusinessOption,
  requestedBranchId?: string | undefined
): string {
  if (business.allowWholeBusiness && !requestedBranchId) {
    return "";
  }

  if (requestedBranchId && business.branches.some((branch) => branch.id === requestedBranchId)) {
    return requestedBranchId;
  }

  return business.defaultBranchId;
}

function rowsFrom<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? (rows as T[]) : [];
}

function arrayFrom<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function objectFrom<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : null;
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
  const groups = new Map<string, BranchRow[]>();

  for (const branch of branches) {
    groups.set(branch.business_id, [...(groups.get(branch.business_id) ?? []), branch]);
  }

  return groups;
}
