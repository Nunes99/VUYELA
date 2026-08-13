import "server-only";

import type { AuthPrincipal, BusinessMemberRole, BusinessMembership } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface BusinessRow {
  id: string;
  name: string;
}

interface BranchRow {
  id: string;
  business_id: string;
  name: string;
  city: string;
  is_primary: boolean;
}

export interface PosBranchContext {
  id: string;
  businessId: string;
  name: string;
  city: string;
}

export interface PosBusinessContext {
  id: string;
  name: string;
  branches: PosBranchContext[];
  defaultBranchId: string;
  requiresBranch: boolean;
  roleLabels: string[];
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
  business_admin: "Admin do negocio",
  business_owner: "Owner"
};

export async function getPosContext(principal: AuthPrincipal): Promise<PosContextState> {
  const memberships = principal.businessMemberships.filter(
    (membership) => membership.status === "active" && posRoles.has(membership.role)
  );

  if (memberships.length === 0) {
    return {
      status: "empty",
      message: "Esta conta ainda nao tem um papel activo para operar o POS."
    };
  }

  const businessIds = uniqueValues(memberships.map((membership) => membership.businessId));
  const supabase = await createSupabaseServerClient();
  const [{ data: businessData, error: businessError }, { data: branchData, error: branchError }] =
    await Promise.all([
      supabase.from("businesses").select("id, name").in("id", businessIds).eq("status", "active"),
      supabase
        .from("branches")
        .select("id, business_id, name, city, is_primary")
        .in("business_id", businessIds)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("name", { ascending: true })
    ]);

  if (businessError || branchError) {
    return { status: "error", message: "Nao foi possivel carregar negocios e filiais do POS." };
  }

  const branchesByBusinessId = groupBranches(rowsFrom<BranchRow>(branchData));
  const membershipsByBusinessId = groupMemberships(memberships);
  const businesses = rowsFrom<BusinessRow>(businessData)
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
        branches,
        defaultBranchId,
        requiresBranch: !hasBusinessWideAccess,
        roleLabels: uniqueValues(
          businessMemberships.map((membership) => roleLabels[membership.role])
        )
      };
    })
    .filter((business): business is PosBusinessContext => business !== null);

  if (businesses.length === 0) {
    return {
      status: "empty",
      message: "Nao ha filiais activas disponiveis para esta conta de POS."
    };
  }

  return { status: "ready", businesses };
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
        city: branch.city
      }
    ]);
  }

  return groups;
}
