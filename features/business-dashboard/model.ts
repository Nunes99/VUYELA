export interface BusinessDashboardBusiness {
  id: string;
  name: string;
  slug: string;
  status: string;
  city: string | null;
}

export interface BusinessDashboardProgram {
  name: string;
  status: string;
  earnRate: string;
  pointValueMznMinor: number;
  maximumRedemptionPercent: string;
  pointsExpireAfterDays: number | null;
}

export interface BusinessDashboardTransaction {
  id: string;
  customerCardId: string;
  branchName: string;
  customerName: string;
  grossAmountMznMinor: number;
  netAmountMznMinor: number;
  pointsEarned: number;
  pointsRedeemed: number;
  occurredAt: string;
}

export interface BusinessDashboardCustomer {
  id: string;
  customerName: string;
  cardNumber: string;
  availablePoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  liabilityMznMinor: number;
  joinedAt: string;
  lastTransactionAt: string | null;
}

export interface BusinessDashboardCampaign {
  id: string;
  name: string;
  status: string;
  campaignType: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface BusinessDashboardBranch {
  id: string;
  name: string;
  city: string;
  isPrimary: boolean;
  transactionCount: number;
  revenueMznMinor: number;
}

export interface BusinessDashboardEmployee {
  id: string;
  displayName: string;
  role: string;
  branchName: string;
  status: string;
}

export interface BusinessDashboardReport {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface BusinessDashboardSettings {
  businessStatus: string;
  programStatus: string;
  subscriptionStatus: string;
  activeOffers: number;
}

export interface BusinessDashboardViewModel {
  business: BusinessDashboardBusiness;
  program: BusinessDashboardProgram | null;
  overview: {
    revenueMznMinor: number;
    transactionCount: number;
    customerCount: number;
    activeCustomerCount: number;
    averageTicketMznMinor: number;
  };
  points: {
    availablePoints: number;
    liabilityMznMinor: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    redemptionRate: number;
  };
  retention: {
    retainedCustomerCount: number;
    retentionRate: number;
    inactiveCustomerCount: number;
  };
  customers: BusinessDashboardCustomer[];
  transactions: BusinessDashboardTransaction[];
  campaigns: BusinessDashboardCampaign[];
  branches: BusinessDashboardBranch[];
  employees: BusinessDashboardEmployee[];
  reports: BusinessDashboardReport[];
  settings: BusinessDashboardSettings;
  scopeLabel: string;
  hasManagerScope: boolean;
}

export function buildBusinessDashboardViewModel(input: {
  business: BusinessDashboardBusiness;
  program: BusinessDashboardProgram | null;
  customers: BusinessDashboardCustomer[];
  transactions: BusinessDashboardTransaction[];
  campaigns: BusinessDashboardCampaign[];
  branches: BusinessDashboardBranch[];
  employees: BusinessDashboardEmployee[];
  settings: BusinessDashboardSettings;
  scopeLabel: string;
  hasManagerScope: boolean;
}): BusinessDashboardViewModel {
  const revenueMznMinor = sumBy(input.transactions, (transaction) => transaction.netAmountMznMinor);
  const transactionCount = input.transactions.length;
  const activeCustomerIds = new Set(
    input.transactions.map((transaction) => transaction.customerCardId)
  );
  const customerCount = input.customers.length;
  const activeCustomerCount = input.customers.filter((customer) =>
    activeCustomerIds.has(customer.id)
  ).length;
  const averageTicketMznMinor =
    transactionCount > 0 ? Math.floor(revenueMznMinor / transactionCount) : 0;
  const availablePoints = sumBy(input.customers, (customer) => customer.availablePoints);
  const liabilityMznMinor = sumBy(input.customers, (customer) => customer.liabilityMznMinor);
  const lifetimeEarned = sumBy(input.customers, (customer) => customer.lifetimeEarned);
  const lifetimeRedeemed = sumBy(input.customers, (customer) => customer.lifetimeRedeemed);
  const retainedCustomerCount = input.customers.filter((customer) =>
    isRetainedCustomer(customer, input.transactions)
  ).length;
  const retentionRate = customerCount > 0 ? retainedCustomerCount / customerCount : 0;

  return {
    business: input.business,
    program: input.program,
    overview: {
      revenueMznMinor,
      transactionCount,
      customerCount,
      activeCustomerCount,
      averageTicketMznMinor
    },
    points: {
      availablePoints,
      liabilityMznMinor,
      lifetimeEarned,
      lifetimeRedeemed,
      redemptionRate: getRatio(lifetimeRedeemed, lifetimeEarned)
    },
    retention: {
      retainedCustomerCount,
      retentionRate,
      inactiveCustomerCount: Math.max(customerCount - activeCustomerCount, 0)
    },
    customers: input.customers,
    transactions: input.transactions,
    campaigns: input.campaigns,
    branches: input.branches,
    employees: input.employees,
    reports: buildReports({
      revenueMznMinor,
      transactionCount,
      liabilityMznMinor,
      retentionRate,
      campaignCount: input.campaigns.length
    }),
    settings: input.settings,
    scopeLabel: input.scopeLabel,
    hasManagerScope: input.hasManagerScope
  };
}

export function formatMznMinor(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("MZN minor value must be a non-negative integer");
  }

  return `${Math.floor(value / 100).toLocaleString("pt-MZ")},${String(value % 100).padStart(
    2,
    "0"
  )} MZN`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0%";
  }

  return `${Math.round(value * 100).toLocaleString("pt-MZ")}%`;
}

export function getLiabilityMznMinor(availablePoints: number, pointValueMznMinor: number): number {
  if (!Number.isSafeInteger(availablePoints) || availablePoints < 0) {
    return 0;
  }

  if (!Number.isSafeInteger(pointValueMznMinor) || pointValueMznMinor < 0) {
    return 0;
  }

  return availablePoints * pointValueMznMinor;
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

function getRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function isRetainedCustomer(
  customer: BusinessDashboardCustomer,
  transactions: BusinessDashboardTransaction[]
): boolean {
  return (
    transactions.filter((transaction) => transaction.customerCardId === customer.id).length > 1
  );
}

function buildReports(input: {
  revenueMznMinor: number;
  transactionCount: number;
  liabilityMznMinor: number;
  retentionRate: number;
  campaignCount: number;
}): BusinessDashboardReport[] {
  return [
    {
      id: "sales",
      label: "Vendas",
      value: formatMznMinor(input.revenueMznMinor),
      detail: `${input.transactionCount.toLocaleString("pt-MZ")} transações registadas`
    },
    {
      id: "liability",
      label: "Responsabilidade",
      value: formatMznMinor(input.liabilityMznMinor),
      detail: "Valor promocional ainda em aberto"
    },
    {
      id: "retention",
      label: "Retenção",
      value: formatPercent(input.retentionRate),
      detail: "Clientes com mais de uma compra"
    },
    {
      id: "campaigns",
      label: "Campanhas",
      value: input.campaignCount.toLocaleString("pt-MZ"),
      detail: "Campanhas no negócio"
    }
  ];
}
