import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import {
  canAccessRoute,
  isAccountType,
  isBusinessMemberRole,
  isMfaVerifiedAssuranceLevel,
  isProfileRole,
  requiresMfa
} from "@/lib/auth/rbac";
import type {
  AuthPrincipal,
  BusinessMembership,
  MembershipStatus,
  ProtectedRoute
} from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: string;
  role: string | null;
  account_type: string | null;
  account_status: string | null;
}

interface BusinessMembershipRow {
  business_id: string;
  branch_id: string | null;
  role: string;
  status: string;
}

export type ProtectedRouteState =
  | { status: "auth_not_configured" }
  | { status: "unauthenticated"; signInPath: string }
  | { status: "mfa_required"; mfaPath: string; principal: AuthPrincipal }
  | { status: "forbidden"; principal: AuthPrincipal }
  | { status: "authorized"; principal: AuthPrincipal };

export interface AuthContext {
  isConfigured: boolean;
  principal: AuthPrincipal | null;
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return value === "invited" || value === "active" || value === "suspended" || value === "removed";
}

function toBusinessMembership(row: BusinessMembershipRow): BusinessMembership | null {
  if (!isBusinessMemberRole(row.role) || !isMembershipStatus(row.status)) {
    return null;
  }

  return {
    businessId: row.business_id,
    branchId: row.branch_id,
    role: row.role,
    status: row.status
  };
}

function buildSignInPath(route: ProtectedRoute, nextPath: string) {
  const signInPath =
    route === "/admin"
      ? "/admin/entrar"
      : route === "/pos"
        ? "/pos/entrar"
        : route === "/negocio"
          ? "/negocio/entrar"
          : "/cliente/entrar";

  return `${signInPath}?next=${encodeURIComponent(nextPath)}`;
}

export const getAuthContext = cache(async function getAuthContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      principal: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const profileId = typeof claims?.sub === "string" ? claims.sub : null;

  if (claimsError || !profileId) {
    return {
      isConfigured: true,
      principal: null
    };
  }

  const [{ data: profileData }, { data: membershipData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, account_type, account_status")
      .eq("id", profileId)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select("business_id, branch_id, role, status")
      .eq("profile_id", profileId)
      .eq("status", "active")
  ]);

  const profile = profileData as ProfileRow | null;

  if (!profile || profile.account_status !== "active") {
    return {
      isConfigured: true,
      principal: null
    };
  }
  const membershipRows = (membershipData ?? []) as BusinessMembershipRow[];
  const businessMemberships = membershipRows
    .map((row) => toBusinessMembership(row))
    .filter((membership): membership is BusinessMembership => membership !== null);

  const profileRole = profile?.role && isProfileRole(profile.role) ? profile.role : "customer";
  const accountType =
    profile?.account_type && isAccountType(profile.account_type)
      ? profile.account_type
      : businessMemberships.length > 0
        ? "business"
        : profileRole === "customer"
          ? "customer"
          : "platform";

  return {
    isConfigured: true,
    principal: {
      profileId,
      profileRole,
      accountType,
      mfaVerified: isMfaVerifiedAssuranceLevel(claims?.aal),
      businessMemberships
    }
  };
});

export async function getProtectedRouteState(
  route: ProtectedRoute,
  currentPath: string
): Promise<ProtectedRouteState> {
  const authContext = await getAuthContext();

  if (!authContext.isConfigured) {
    return { status: "auth_not_configured" };
  }

  if (!authContext.principal) {
    return {
      status: "unauthenticated",
      signInPath: buildSignInPath(route, currentPath)
    };
  }

  if (requiresMfa(authContext.principal.profileRole) && !authContext.principal.mfaVerified) {
    return {
      status: "mfa_required",
      mfaPath: `/admin/mfa?next=${encodeURIComponent(currentPath)}`,
      principal: authContext.principal
    };
  }

  if (!canAccessRoute(authContext.principal, route)) {
    return {
      status: "forbidden",
      principal: authContext.principal
    };
  }

  return {
    status: "authorized",
    principal: authContext.principal
  };
}

export async function requireAuthenticatedUser(nextPath: string) {
  const authContext = await getAuthContext();

  if (!authContext.principal) {
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  }

  return authContext.principal;
}

export async function requireRouteAccess(route: ProtectedRoute, currentPath: string) {
  const state = await getProtectedRouteState(route, currentPath);

  if (state.status === "auth_not_configured" || state.status === "unauthenticated") {
    redirect(buildSignInPath(route, currentPath));
  }

  if (state.status === "mfa_required") {
    redirect(state.mfaPath);
  }

  if (state.status === "forbidden") {
    redirect(currentPath);
  }

  return state.principal;
}
