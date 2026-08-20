import "server-only";

import type { AuthPrincipal, BusinessMemberRole } from "@/lib/auth/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { parseBusinessSubscriptionOverview } from "./model";
import type { BusinessSubscriptionOverview } from "./model";

interface BusinessRow {
  id: string;
  name: string;
  status: string;
}

export interface SubscriptionBusinessOption {
  id: string;
  name: string;
  status: string;
}

export type BusinessSubscriptionState =
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      businesses: SubscriptionBusinessOption[];
      selectedBusinessId: string;
      overview: BusinessSubscriptionOverview;
    };

const subscriptionManagerRoles = new Set<BusinessMemberRole>(["business_admin", "business_owner"]);

export async function getBusinessSubscription(
  principal: AuthPrincipal,
  params: { businessId?: string | undefined } = {}
): Promise<BusinessSubscriptionState> {
  const businessIds = [
    ...new Set(
      principal.businessMemberships
        .filter(
          (membership) =>
            membership.status === "active" && subscriptionManagerRoles.has(membership.role)
        )
        .map((membership) => membership.businessId)
    )
  ];

  if (businessIds.length === 0) {
    return {
      status: "empty",
      message: "A subscricao pode ser consultada por admins ou owners do negocio."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: businessData, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, status")
    .in("id", businessIds)
    .order("name", { ascending: true });

  if (businessError) {
    return { status: "error", message: "Nao foi possivel carregar os negocios." };
  }

  const businesses = (Array.isArray(businessData) ? (businessData as BusinessRow[]) : []).map(
    (business) => ({
      id: business.id,
      name: business.name,
      status: business.status
    })
  );

  if (businesses.length === 0) {
    return { status: "empty", message: "Nao ha negocios disponiveis para esta conta." };
  }

  const selectedBusiness =
    businesses.find((business) => business.id === params.businessId) ?? businesses[0];
  const { data, error } = await supabase.rpc("get_business_subscription_overview", {
    p_business_id: selectedBusiness.id
  });

  if (error) {
    return { status: "error", message: "Nao foi possivel carregar a subscricao." };
  }

  const overview = parseBusinessSubscriptionOverview(data);

  if (!overview) {
    return { status: "error", message: "Os dados da subscricao estao incompletos." };
  }

  return {
    status: "ready",
    businesses,
    selectedBusinessId: selectedBusiness.id,
    overview
  };
}
