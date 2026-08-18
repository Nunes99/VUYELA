-- VUYELA initial schema.
-- RLS policies are implemented in FASE 04; this migration prepares tenant keys,
-- constraints, indexes, and immutable point history.

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_point_ledger_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'point_ledger is append-only; create a compensating entry instead';
end;
$$;

create type public.profile_role as enum (
  'customer',
  'support_agent',
  'platform_admin',
  'super_admin'
);

create type public.business_status as enum (
  'draft',
  'pending_review',
  'active',
  'suspended',
  'archived'
);

create type public.business_member_role as enum (
  'cashier',
  'branch_manager',
  'business_admin',
  'business_owner'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'suspended',
  'removed'
);

create type public.loyalty_program_status as enum (
  'draft',
  'active',
  'paused',
  'archived'
);

create type public.card_status as enum (
  'active',
  'blocked',
  'archived'
);

create type public.point_ledger_type as enum (
  'earn',
  'bonus',
  'referral',
  'birthday',
  'redeem',
  'expire',
  'reversal',
  'manual_adjustment',
  'refund_reversal'
);

create type public.transaction_status as enum (
  'draft',
  'pending_customer_confirmation',
  'completed',
  'cancelled',
  'refunded'
);

create type public.transaction_payment_method as enum (
  'cash',
  'card',
  'mpesa',
  'emola',
  'mkesh',
  'bank_transfer',
  'points',
  'other'
);

create type public.campaign_status as enum (
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled'
);

create type public.notification_channel as enum (
  'in_app',
  'sms',
  'email',
  'whatsapp'
);

create type public.notification_status as enum (
  'queued',
  'sent',
  'delivered',
  'failed',
  'cancelled'
);

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled'
);

create type public.audit_action as enum (
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'points_adjustment',
  'points_redemption',
  'refund',
  'rule_change',
  'permission_change',
  'suspension',
  'export'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  email citext,
  role public.profile_role not null default 'customer',
  locale text not null default 'pt-MZ',
  marketing_consent_at timestamptz,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_format check (phone is null or phone ~ '^\+?[0-9 ]{8,20}$')
);

create unique index profiles_phone_unique_idx on public.profiles (phone) where phone is not null;
create unique index profiles_email_unique_idx on public.profiles (email) where email is not null;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger business_categories_set_updated_at
before update on public.business_categories
for each row execute function public.set_updated_at();

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.business_categories(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  slug text not null unique,
  name text not null,
  legal_name text,
  nuit text,
  description text,
  status public.business_status not null default 'draft',
  phone text,
  email citext,
  website_url text,
  logo_url text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint businesses_nuit_format check (nuit is null or nuit ~ '^[0-9]{9,12}$')
);

create index businesses_category_id_idx on public.businesses(category_id);
create index businesses_status_idx on public.businesses(status);
create index businesses_owner_profile_id_idx on public.businesses(owner_profile_id);

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  slug text not null,
  name text not null,
  phone text,
  email citext,
  address_line text,
  city text not null,
  province text,
  country_code char(2) not null default 'MZ',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint branches_id_business_unique unique (id, business_id),
  constraint branches_unique_slug_per_business unique (business_id, slug),
  constraint branches_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint branches_longitude_range check (longitude is null or longitude between -180 and 180)
);

create index branches_business_id_idx on public.branches(business_id);
create index branches_city_idx on public.branches(city);
create unique index branches_single_primary_idx on public.branches(business_id) where is_primary;

create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.business_member_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_members_id_business_unique unique (id, business_id),
  constraint business_members_unique_profile unique (business_id, profile_id),
  constraint business_members_branch_business_fk foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint branch_managers_need_branch check (role <> 'branch_manager' or branch_id is not null)
);

create index business_members_profile_id_idx on public.business_members(profile_id);
create index business_members_business_id_idx on public.business_members(business_id);
create index business_members_branch_id_idx on public.business_members(branch_id);

create trigger business_members_set_updated_at
before update on public.business_members
for each row execute function public.set_updated_at();

create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  status public.loyalty_program_status not null default 'draft',
  earn_rate numeric(8, 4) not null default 0.0500,
  point_value_mzn_minor integer not null default 100,
  minimum_earn_amount_mzn_minor integer not null default 0,
  maximum_redemption_percent numeric(5, 2) not null default 100.00,
  points_expire_after_days integer,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_programs_id_business_unique unique (id, business_id),
  constraint loyalty_programs_one_per_business unique (business_id),
  constraint loyalty_programs_earn_rate_non_negative check (earn_rate >= 0),
  constraint loyalty_programs_point_value_positive check (point_value_mzn_minor > 0),
  constraint loyalty_programs_minimum_earn_non_negative check (minimum_earn_amount_mzn_minor >= 0),
  constraint loyalty_programs_redemption_percent_range check (
    maximum_redemption_percent >= 0
    and maximum_redemption_percent <= 100
  ),
  constraint loyalty_programs_expiry_positive check (
    points_expire_after_days is null
    or points_expire_after_days > 0
  )
);

create index loyalty_programs_business_id_idx on public.loyalty_programs(business_id);
create index loyalty_programs_status_idx on public.loyalty_programs(status);

create trigger loyalty_programs_set_updated_at
before update on public.loyalty_programs
for each row execute function public.set_updated_at();

create table public.loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  loyalty_program_id uuid not null references public.loyalty_programs(id) on delete cascade,
  name text not null,
  minimum_lifetime_points integer not null default 0,
  earn_multiplier numeric(8, 4) not null default 1.0000,
  benefits jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_tiers_minimum_points_non_negative check (minimum_lifetime_points >= 0),
  constraint loyalty_tiers_multiplier_positive check (earn_multiplier > 0),
  constraint loyalty_tiers_unique_program_name unique (loyalty_program_id, name)
);

create index loyalty_tiers_program_id_idx on public.loyalty_tiers(loyalty_program_id);

create trigger loyalty_tiers_set_updated_at
before update on public.loyalty_tiers
for each row execute function public.set_updated_at();

create table public.customer_cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  loyalty_program_id uuid not null references public.loyalty_programs(id) on delete restrict,
  card_number text not null unique,
  status public.card_status not null default 'active',
  display_name text,
  joined_at timestamptz not null default now(),
  blocked_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_cards_id_business_unique unique (id, business_id),
  constraint customer_cards_unique_customer_business unique (business_id, customer_profile_id),
  constraint customer_cards_program_business_fk foreign key (loyalty_program_id, business_id)
    references public.loyalty_programs(id, business_id)
    on delete restrict,
  constraint customer_cards_number_format check (card_number ~ '^VY-[0-9A-Z-]{6,32}$')
);

create index customer_cards_customer_profile_id_idx on public.customer_cards(customer_profile_id);
create index customer_cards_business_id_idx on public.customer_cards(business_id);
create index customer_cards_loyalty_program_id_idx on public.customer_cards(loyalty_program_id);
create index customer_cards_status_idx on public.customer_cards(status);

create trigger customer_cards_set_updated_at
before update on public.customer_cards
for each row execute function public.set_updated_at();

create table public.point_wallets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_card_id uuid not null unique,
  available_balance integer not null default 0,
  pending_balance integer not null default 0,
  lifetime_earned integer not null default 0,
  lifetime_redeemed integer not null default 0,
  lifetime_expired integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint point_wallets_id_business_unique unique (id, business_id),
  constraint point_wallets_id_card_business_unique unique (id, customer_card_id, business_id),
  constraint point_wallets_card_business_fk foreign key (customer_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete cascade,
  constraint point_wallets_available_non_negative check (available_balance >= 0),
  constraint point_wallets_pending_non_negative check (pending_balance >= 0),
  constraint point_wallets_lifetime_earned_non_negative check (lifetime_earned >= 0),
  constraint point_wallets_lifetime_redeemed_non_negative check (lifetime_redeemed >= 0),
  constraint point_wallets_lifetime_expired_non_negative check (lifetime_expired >= 0)
);

create index point_wallets_business_id_idx on public.point_wallets(business_id);
create index point_wallets_customer_card_id_idx on public.point_wallets(customer_card_id);

create trigger point_wallets_set_updated_at
before update on public.point_wallets
for each row execute function public.set_updated_at();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  branch_id uuid,
  customer_card_id uuid,
  cashier_member_id uuid,
  external_reference text,
  status public.transaction_status not null default 'draft',
  currency char(3) not null default 'MZN',
  gross_amount_mzn_minor integer not null,
  discount_amount_mzn_minor integer not null default 0,
  points_redeemed integer not null default 0,
  points_redeemed_value_mzn_minor integer not null default 0,
  net_amount_mzn_minor integer not null,
  points_earned integer not null default 0,
  occurred_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_id_business_unique unique (id, business_id),
  constraint transactions_branch_business_fk foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint transactions_card_business_fk foreign key (customer_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete restrict,
  constraint transactions_cashier_business_fk foreign key (cashier_member_id, business_id)
    references public.business_members(id, business_id)
    on delete restrict,
  constraint transactions_currency_mzn check (currency = 'MZN'),
  constraint transactions_gross_non_negative check (gross_amount_mzn_minor >= 0),
  constraint transactions_discount_non_negative check (discount_amount_mzn_minor >= 0),
  constraint transactions_points_redeemed_non_negative check (points_redeemed >= 0),
  constraint transactions_points_redeemed_value_non_negative check (points_redeemed_value_mzn_minor >= 0),
  constraint transactions_net_non_negative check (net_amount_mzn_minor >= 0),
  constraint transactions_points_earned_non_negative check (points_earned >= 0),
  constraint transactions_net_amount_math check (
    net_amount_mzn_minor = gross_amount_mzn_minor - discount_amount_mzn_minor - points_redeemed_value_mzn_minor
  )
);

create index transactions_business_id_idx on public.transactions(business_id);
create index transactions_branch_id_idx on public.transactions(branch_id);
create index transactions_customer_card_id_idx on public.transactions(customer_card_id);
create index transactions_status_idx on public.transactions(status);
create index transactions_occurred_at_idx on public.transactions(occurred_at desc);
create unique index transactions_external_reference_unique_idx
on public.transactions(business_id, external_reference)
where external_reference is not null;

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create table public.transaction_payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  method public.transaction_payment_method not null,
  amount_mzn_minor integer not null,
  provider_reference text,
  created_at timestamptz not null default now(),
  constraint transaction_payments_amount_positive check (amount_mzn_minor > 0)
);

create index transaction_payments_transaction_id_idx on public.transaction_payments(transaction_id);
create index transaction_payments_method_idx on public.transaction_payments(method);

create table public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  wallet_id uuid not null,
  customer_card_id uuid not null,
  transaction_id uuid,
  type public.point_ledger_type not null,
  amount integer not null,
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint point_ledger_wallet_card_business_fk foreign key (wallet_id, customer_card_id, business_id)
    references public.point_wallets(id, customer_card_id, business_id)
    on delete restrict,
  constraint point_ledger_transaction_business_fk foreign key (transaction_id, business_id)
    references public.transactions(id, business_id)
    on delete restrict,
  constraint point_ledger_amount_not_zero check (amount <> 0),
  constraint point_ledger_earn_positive_redeem_negative check (
    (
      type in ('earn', 'bonus', 'referral', 'birthday')
      and amount > 0
    )
    or (
      type in ('redeem', 'expire')
      and amount < 0
    )
    or type in ('reversal', 'manual_adjustment', 'refund_reversal')
  ),
  constraint point_ledger_expiry_future check (expires_at is null or expires_at > created_at)
);

create index point_ledger_business_id_idx on public.point_ledger(business_id);
create index point_ledger_wallet_id_idx on public.point_ledger(wallet_id);
create index point_ledger_customer_card_id_idx on public.point_ledger(customer_card_id);
create index point_ledger_transaction_id_idx on public.point_ledger(transaction_id);
create index point_ledger_created_at_idx on public.point_ledger(created_at desc);
create index point_ledger_expires_at_idx on public.point_ledger(expires_at) where expires_at is not null;

create trigger point_ledger_prevent_update
before update on public.point_ledger
for each row execute function public.prevent_point_ledger_mutation();

create trigger point_ledger_prevent_delete
before delete on public.point_ledger
for each row execute function public.prevent_point_ledger_mutation();

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  status public.campaign_status not null default 'draft',
  campaign_type text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  rules jsonb not null default '{}'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_id_business_unique unique (id, business_id),
  constraint campaigns_date_order check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint campaigns_type_format check (campaign_type ~ '^[a-z0-9_]+$')
);

create index campaigns_business_id_idx on public.campaigns(business_id);
create index campaigns_status_idx on public.campaigns(status);
create index campaigns_starts_at_idx on public.campaigns(starts_at);

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create table public.campaign_audiences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  campaign_id uuid not null,
  customer_card_id uuid,
  segment_key text,
  created_at timestamptz not null default now(),
  constraint campaign_audiences_campaign_business_fk foreign key (campaign_id, business_id)
    references public.campaigns(id, business_id)
    on delete cascade,
  constraint campaign_audiences_card_business_fk foreign key (customer_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete cascade,
  constraint campaign_audiences_target_present check (customer_card_id is not null or segment_key is not null)
);

create index campaign_audiences_business_id_idx on public.campaign_audiences(business_id);
create index campaign_audiences_campaign_id_idx on public.campaign_audiences(campaign_id);
create index campaign_audiences_customer_card_id_idx on public.campaign_audiences(customer_card_id);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  campaign_id uuid,
  slug text not null,
  title text not null,
  description text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_public boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_id_business_unique unique (id, business_id),
  constraint offers_campaign_business_fk foreign key (campaign_id, business_id)
    references public.campaigns(id, business_id)
    on delete restrict,
  constraint offers_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint offers_unique_slug_per_business unique (business_id, slug),
  constraint offers_date_order check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index offers_business_id_idx on public.offers(business_id);
create index offers_campaign_id_idx on public.offers(campaign_id);
create index offers_public_active_idx on public.offers(is_public, is_active);

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  customer_card_id uuid,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'queued',
  subject text,
  body text not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_card_business_fk foreign key (customer_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete cascade,
  constraint notifications_card_requires_business check (
    customer_card_id is null
    or business_id is not null
  ),
  constraint notifications_recipient_present check (profile_id is not null or customer_card_id is not null)
);

create index notifications_business_id_idx on public.notifications(business_id);
create index notifications_profile_id_idx on public.notifications(profile_id);
create index notifications_customer_card_id_idx on public.notifications(customer_card_id);
create index notifications_status_idx on public.notifications(status);
create index notifications_scheduled_at_idx on public.notifications(scheduled_at);

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  monthly_price_mzn_minor integer,
  features jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint plans_monthly_price_non_negative check (
    monthly_price_mzn_minor is null
    or monthly_price_mzn_minor >= 0
  )
);

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_period_order check (
    current_period_end is null
    or current_period_start is null
    or current_period_end > current_period_start
  )
);

create index subscriptions_business_id_idx on public.subscriptions(business_id);
create index subscriptions_plan_id_idx on public.subscriptions(plan_id);
create index subscriptions_status_idx on public.subscriptions(status);
create unique index subscriptions_one_active_per_business_idx
on public.subscriptions(business_id)
where status in ('trialing', 'active', 'past_due', 'paused');

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  referrer_card_id uuid not null,
  referred_profile_id uuid references public.profiles(id) on delete set null,
  referred_card_id uuid,
  reward_points integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint referrals_referrer_card_business_fk foreign key (referrer_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete cascade,
  constraint referrals_referred_card_business_fk foreign key (referred_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete restrict,
  constraint referrals_reward_points_non_negative check (reward_points >= 0)
);

create index referrals_business_id_idx on public.referrals(business_id);
create index referrals_referrer_card_id_idx on public.referrals(referrer_card_id);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_status_format check (status ~ '^[a-z0-9_]+$'),
  constraint support_tickets_priority_format check (priority ~ '^[a-z0-9_]+$')
);

create index support_tickets_business_id_idx on public.support_tickets(business_id);
create index support_tickets_profile_id_idx on public.support_tickets(profile_id);
create index support_tickets_status_idx on public.support_tickets(status);

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action public.audit_action not null,
  entity_table text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_entity_table_format check (entity_table ~ '^[a-z_]+$')
);

create index audit_logs_business_id_idx on public.audit_logs(business_id);
create index audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id);
create index audit_logs_action_idx on public.audit_logs(action);
create index audit_logs_entity_idx on public.audit_logs(entity_table, entity_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

create table public.fraud_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  customer_card_id uuid,
  transaction_id uuid,
  event_type text not null,
  severity text not null default 'medium',
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint fraud_events_card_business_fk foreign key (customer_card_id, business_id)
    references public.customer_cards(id, business_id)
    on delete restrict,
  constraint fraud_events_transaction_business_fk foreign key (transaction_id, business_id)
    references public.transactions(id, business_id)
    on delete restrict,
  constraint fraud_events_card_requires_business check (
    customer_card_id is null
    or business_id is not null
  ),
  constraint fraud_events_transaction_requires_business check (
    transaction_id is null
    or business_id is not null
  ),
  constraint fraud_events_type_format check (event_type ~ '^[a-z0-9_]+$'),
  constraint fraud_events_severity_format check (severity in ('low', 'medium', 'high', 'critical'))
);

create index fraud_events_business_id_idx on public.fraud_events(business_id);
create index fraud_events_profile_id_idx on public.fraud_events(profile_id);
create index fraud_events_customer_card_id_idx on public.fraud_events(customer_card_id);
create index fraud_events_transaction_id_idx on public.fraud_events(transaction_id);
create index fraud_events_created_at_idx on public.fraud_events(created_at desc);
