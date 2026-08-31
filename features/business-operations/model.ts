export const businessMemberRoles = ["cashier", "branch_manager", "business_admin"] as const;
export type ManageableBusinessMemberRole = (typeof businessMemberRoles)[number];

export const catalogItemKinds = ["service", "product"] as const;
export type CatalogItemKind = (typeof catalogItemKinds)[number];

export interface BusinessOperationBranch {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string;
  province: string | null;
  isPrimary: boolean;
  isActive: boolean;
  transactionCount: number;
  revenueMznMinor: number;
  memberCount: number;
}

export interface BusinessOperationMember {
  id: string;
  profileId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  branchId: string | null;
  branchName: string | null;
  joinedAt: string | null;
}

export interface BusinessOperationInvitation {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  branchId: string | null;
  branchName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface BusinessCatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
}

export interface BusinessCatalogItem {
  id: string;
  branchId: string | null;
  branchName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  kind: CatalogItemKind;
  sku: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMznMinor: number;
  loyaltyDiscountPercent: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface BusinessOperationCard {
  id: string;
  profileId: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  cardNumber: string;
  status: string;
  availablePoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  liabilityMznMinor: number;
  joinedAt: string;
  lastTransactionAt: string | null;
  transactionCount: number;
  totalSpentMznMinor: number;
}

export interface BusinessOperationOffer {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isPublic: boolean;
  isActive: boolean;
  claimCount: number;
}

export interface BusinessOperations {
  branches: BusinessOperationBranch[];
  members: BusinessOperationMember[];
  invitations: BusinessOperationInvitation[];
  catalogCategories: BusinessCatalogCategory[];
  catalogItems: BusinessCatalogItem[];
  cards: BusinessOperationCard[];
  offers: BusinessOperationOffer[];
}

export interface BusinessInvitationActionState {
  status: "idle" | "success" | "error";
  message: string;
  invitePath?: string | undefined;
}

export interface PosOperatorProvisionActionState {
  status: "idle" | "success" | "error";
  message: string;
  credentials?:
    | {
        login: string;
        password: string;
        signInPath: string;
      }
    | undefined;
}

export function isManageableBusinessMemberRole(
  value: string
): value is ManageableBusinessMemberRole {
  return businessMemberRoles.includes(value as ManageableBusinessMemberRole);
}

export function isCatalogItemKind(value: string): value is CatalogItemKind {
  return catalogItemKinds.includes(value as CatalogItemKind);
}

export function getBusinessMemberRoleLabel(value: string): string {
  const labels: Record<string, string> = {
    cashier: "Operador de caixa",
    branch_manager: "Gestor de filial",
    business_admin: "Administrador",
    business_owner: "Proprietário"
  };

  return labels[value] ?? value;
}

export function getMembershipStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    invited: "Convidado",
    active: "Ativo",
    suspended: "Suspenso",
    removed: "Removido",
    pending: "Pendente",
    accepted: "Aceite",
    revoked: "Revogado",
    expired: "Expirado"
  };

  return labels[value] ?? value;
}
