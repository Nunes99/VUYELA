import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import {
  canAccessRoute,
  getDefaultAuthenticatedPath,
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
  user: User | null;
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

function buildSignInPath(nextPath: string) {
  return `/entrar?next=${encodeURIComponent(nextPath)}`;
}

export async function getAuthContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      user: null,
      principal: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isConfigured: true,
      user: null,
      principal: null
    };
  }

  const [{ data: profileData }, { data: membershipData }, assurance] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, account_type, account_status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select("business_id, branch_id, role, status")
      .eq("profile_id", user.id)
      .eq("status", "active"),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  ]);

  const profile = profileData as ProfileRow | null;

  if (!profile || profile.account_status !== "active") {
    return {
      isConfigured: true,
      user,
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
    user,
    principal: {
      profileId: user.id,
      profileRole,
      accountType,
      mfaVerified: isMfaVerifiedAssuranceLevel(assurance.data?.currentLevel),
      businessMemberships
    }
  };
}

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
      signInPath: buildSignInPath(currentPath)
    };
  }

  if (requiresMfa(authContext.principal.profileRole) && !authContext.principal.mfaVerified) {
    return {
      status: "mfa_required",
      mfaPath: `/mfa?next=${encodeURIComponent(currentPath)}`,
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
    redirect(buildSignInPath(nextPath));
  }

  return authContext.principal;
}

export async function requireRouteAccess(route: ProtectedRoute, currentPath: string) {
  const state = await getProtectedRouteState(route, currentPath);

  if (state.status === "auth_not_configured" || state.status === "unauthenticated") {
    redirect(buildSignInPath(currentPath));
  }

  if (state.status === "mfa_required") {
    redirect(state.mfaPath);
  }

  if (state.status === "forbidden") {
    redirect(getDefaultAuthenticatedPath(state.principal));
  }

  return state.principal;
}
