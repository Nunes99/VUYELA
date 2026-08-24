-- NEW PHAS operational data foundation.
-- This migration adds the durable records required by the approved customer,
-- business, POS and administration flows. It does not change wallet balances,
-- append point ledger entries or process provider payments.

create type public.profile_account_status as enum (
  'active',
  'suspended',
  'closed'
);

create type public.catalog_item_kind as enum (
  'service',
  'product'
);

create type public.pos_terminal_status as enum (
  'provisioning',
  'active',
  'suspended',
  'revoked'
);

create type public.pos_device_type as enum (
  'browser',
  'camera',
  'printer',
  'card_terminal',
  'other'
);

create type public.pos_device_status as enum (
  'pending',
  'active',
  'revoked'
);

create type public.payment_channel_mode as enum (
  'manual',
  'provider'
);

create type public.payment_channel_status as enum (
  'unconfigured',
  'testing',
  'active',
  'suspended'
);

create type public.payment_attempt_status as enum (
  'initiated',
  'pending',
  'authorized',
  'declined',
  'cancelled',
  'expired',
  'reconciled'
);

create type public.business_invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create type public.offer_claim_status as enum (
  'activated',
  'redeemed',
  'expired',
  'cancelled'
);

create type public.support_message_author_type as enum (
  'requester',
  'operator',
  'system'
);

create type public.support_message_delivery_status as enum (
  'internal',
  'queued',
  'sent',
  'delivered',
  'failed'
);

alter table public.profiles
add column date_of_birth date,
add column account_status public.profile_account_status not null default 'active',
add column suspended_at timestamptz,
add column suspension_reason text,
add constraint profiles_date_of_birth_reasonable check (
  date_of_birth is null or date_of_birth >= date '1900-01-01'
),
add constraint profiles_suspension_state_consistent check (
  (
    account_status = 'suspended'
    and suspended_at is not null
    and nullif(btrim(suspension_reason), '') is not null
  )
  or (
    account_status <> 'suspended'
    and suspended_at is null
    and suspension_reason is null
  )
);

create index profiles_account_status_idx on public.profiles(account_status);

alter table public.customer_cards
add constraint customer_cards_id_business_profile_unique
unique (id, business_id, customer_profile_id);

create table public.business_catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid,
  kind public.catalog_item_kind not null default 'service',
  sku text,
  name text not null,
  description text,
  price_mzn_minor integer not null default 0,
  is_available boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_catalog_items_id_business_unique unique (id, business_id),
  constraint business_catalog_items_branch_business_fk foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint business_catalog_items_name_length check (
    char_length(btrim(name)) between 2 and 120
  ),
  constraint business_catalog_items_sku_format check (
    sku is null or sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
  ),
  constraint business_catalog_items_price_non_negative check (price_mzn_minor >= 0),
  constraint business_catalog_items_sort_order_non_negative check (sort_order >= 0)
);

create index business_catalog_items_business_id_idx
on public.business_catalog_items(business_id);
create index business_catalog_items_branch_id_idx
on public.business_catalog_items(branch_id);
create index business_catalog_items_available_idx
on public.business_catalog_items(business_id, is_available, sort_order);
create unique index business_catalog_items_business_sku_unique_idx
on public.business_catalog_items(business_id, lower(sku))
where sku is not null;

create trigger business_catalog_items_set_updated_at
before update on public.business_catalog_items
for each row execute function public.set_updated_at();

create table public.pos_terminals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null,
  code text not null,
  name text not null,
  status public.pos_terminal_status not null default 'provisioning',
  registered_by uuid references public.profiles(id) on delete set null,
  activated_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pos_terminals_id_business_unique unique (id, business_id),
  constraint pos_terminals_branch_business_fk foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint pos_terminals_business_code_unique unique (business_id, code),
  constraint pos_terminals_code_format check (code ~ '^POS-[0-9A-Z-]{4,32}$'),
  constraint pos_terminals_name_length check (char_length(btrim(name)) between 2 and 100),
  constraint pos_terminals_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint pos_terminals_status_timestamps check (
    (status <> 'active' or activated_at is not null)
    and (status <> 'suspended' or suspended_at is not null)
    and (status <> 'revoked' or revoked_at is not null)
  )
);

create index pos_terminals_business_id_idx on public.pos_terminals(business_id);
create index pos_terminals_branch_id_idx on public.pos_terminals(branch_id);
create index pos_terminals_status_idx on public.pos_terminals(status);

create trigger pos_terminals_set_updated_at
before update on public.pos_terminals
for each row execute function public.set_updated_at();

create table public.pos_terminal_settings (
  terminal_id uuid primary key,
  business_id uuid not null,
  locale text not null default 'pt-MZ',
  currency char(3) not null default 'MZN',
  timezone text not null default 'Africa/Maputo',
  require_customer_authorization boolean not null default true,
  print_receipt_automatically boolean not null default false,
  show_points_balance boolean not null default true,
  show_mzn_equivalent boolean not null default true,
  inactivity_timeout_minutes integer not null default 30,
  allowed_lookup_methods text[] not null default array['qr', 'card', 'phone']::text[],
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pos_terminal_settings_terminal_business_fk
    foreign key (terminal_id, business_id)
    references public.pos_terminals(id, business_id)
    on delete cascade,
  constraint pos_terminal_settings_currency_mzn check (currency = 'MZN'),
  constraint pos_terminal_settings_timezone_format check (
    timezone ~ '^[A-Za-z_]+/[A-Za-z_]+(?:/[A-Za-z_]+)?$'
  ),
  constraint pos_terminal_settings_timeout_range check (
    inactivity_timeout_minutes between 5 and 480
  ),
  constraint pos_terminal_settings_lookup_methods check (
    cardinality(allowed_lookup_methods) > 0
    and allowed_lookup_methods <@ array['qr', 'card', 'phone']::text[]
  ),
  constraint pos_terminal_settings_object check (jsonb_typeof(settings) = 'object')
);

create index pos_terminal_settings_business_id_idx
on public.pos_terminal_settings(business_id);

create trigger pos_terminal_settings_set_updated_at
before update on public.pos_terminal_settings
for each row execute function public.set_updated_at();

create table public.pos_terminal_devices (
  id uuid primary key default gen_random_uuid(),
  terminal_id uuid not null,
  business_id uuid not null,
  device_type public.pos_device_type not null,
  label text not null,
  device_reference text not null,
  status public.pos_device_status not null default 'pending',
  capabilities jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  activated_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pos_terminal_devices_terminal_business_fk
    foreign key (terminal_id, business_id)
    references public.pos_terminals(id, business_id)
    on delete cascade,
  constraint pos_terminal_devices_reference_unique unique (terminal_id, device_reference),
  constraint pos_terminal_devices_label_length check (
    char_length(btrim(label)) between 2 and 100
  ),
  constraint pos_terminal_devices_reference_length check (
    char_length(btrim(device_reference)) between 8 and 200
  ),
  constraint pos_terminal_devices_capabilities_object check (
    jsonb_typeof(capabilities) = 'object'
  ),
  constraint pos_terminal_devices_status_timestamps check (
    (status <> 'active' or activated_at is not null)
    and (status <> 'revoked' or revoked_at is not null)
  )
);

create index pos_terminal_devices_terminal_id_idx
on public.pos_terminal_devices(terminal_id);
create index pos_terminal_devices_business_id_idx
on public.pos_terminal_devices(business_id);

create trigger pos_terminal_devices_set_updated_at
before update on public.pos_terminal_devices
for each row execute function public.set_updated_at();

create table public.business_payment_channels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid,
  method public.transaction_payment_method not null,
  mode public.payment_channel_mode not null default 'manual',
  status public.payment_channel_status not null default 'unconfigured',
  provider_key text,
  masked_identifier text,
  credentials_configured_at timestamptz,
  public_settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_payment_channels_id_business_unique unique (id, business_id),
  constraint business_payment_channels_id_business_method_unique
    unique (id, business_id, method),
  constraint business_payment_channels_branch_business_fk foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint business_payment_channels_points_excluded check (method <> 'points'),
  constraint business_payment_channels_provider_key_format check (
    provider_key is null or provider_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'
  ),
  constraint business_payment_channels_public_settings_object check (
    jsonb_typeof(public_settings) = 'object'
  ),
  constraint business_payment_channels_public_settings_no_secrets check (
    not public_settings ?| array[
      'api_key',
      'client_secret',
      'password',
      'private_key',
      'secret',
      'token'
    ]
  ),
  constraint business_payment_channels_provider_consistency check (
    (
      mode = 'provider'
      and provider_key is not null
    )
    or (
      mode = 'manual'
      and provider_key is null
      and credentials_configured_at is null
    )
  ),
  constraint business_payment_channels_active_consistency check (
    status <> 'active'
    or mode = 'manual'
    or credentials_configured_at is not null
  )
);

create index business_payment_channels_business_id_idx
on public.business_payment_channels(business_id);
create index business_payment_channels_branch_id_idx
on public.business_payment_channels(branch_id);
create unique index business_payment_channels_scope_method_unique_idx
on public.business_payment_channels(
  business_id,
  coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid),
  method
);

create trigger business_payment_channels_set_updated_at
before update on public.business_payment_channels
for each row execute function public.set_updated_at();

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  branch_id uuid not null,
  terminal_id uuid,
  payment_channel_id uuid,
  transaction_id uuid,
  method public.transaction_payment_method not null,
  status public.payment_attempt_status not null default 'initiated',
  amount_mzn_minor integer not null,
  currency char(3) not null default 'MZN',
  idempotency_key text not null,
  provider_reference text,
  failure_code text,
  requested_by uuid references public.profiles(id) on delete set null,
  authorized_at timestamptz,
  reconciled_at timestamptz,
  expires_at timestamptz,
  public_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_attempts_id_business_unique unique (id, business_id),
  constraint payment_attempts_id_business_method_unique unique (id, business_id, method),
  constraint payment_attempts_branch_business_fk foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint payment_attempts_terminal_business_fk foreign key (terminal_id, business_id)
    references public.pos_terminals(id, business_id)
    on delete restrict,
  constraint payment_attempts_channel_business_fk foreign key (payment_channel_id, business_id)
    references public.business_payment_channels(id, business_id)
    on delete restrict,
  constraint payment_attempts_channel_business_method_fk
    foreign key (payment_channel_id, business_id, method)
    references public.business_payment_channels(id, business_id, method)
    on delete restrict,
  constraint payment_attempts_transaction_business_fk foreign key (transaction_id, business_id)
    references public.transactions(id, business_id)
    on delete restrict,
  constraint payment_attempts_method_points_excluded check (method <> 'points'),
  constraint payment_attempts_amount_positive check (amount_mzn_minor > 0),
  constraint payment_attempts_currency_mzn check (currency = 'MZN'),
  constraint payment_attempts_idempotency_length check (
    char_length(btrim(idempotency_key)) between 12 and 200
  ),
  constraint payment_attempts_public_metadata_object check (
    jsonb_typeof(public_metadata) = 'object'
  ),
  constraint payment_attempts_authorized_timestamp check (
    status not in ('authorized', 'reconciled') or authorized_at is not null
  ),
  constraint payment_attempts_reconciled_timestamp check (
    status <> 'reconciled' or reconciled_at is not null
  ),
  constraint payment_attempts_expiry_after_creation check (
    expires_at is null or expires_at > created_at
  )
);

create unique index payment_attempts_business_idempotency_unique_idx
on public.payment_attempts(business_id, idempotency_key);
create index payment_attempts_transaction_id_idx on public.payment_attempts(transaction_id);
create index payment_attempts_terminal_id_idx on public.payment_attempts(terminal_id);
create index payment_attempts_status_created_at_idx
on public.payment_attempts(status, created_at desc);
create unique index payment_attempts_provider_reference_unique_idx
on public.payment_attempts(payment_channel_id, provider_reference)
where provider_reference is not null;

create trigger payment_attempts_set_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

alter table public.transaction_payments
add column business_id uuid,
add column payment_attempt_id uuid,
add column reconciled_at timestamptz;

update public.transaction_payments tp
set business_id = t.business_id
from public.transactions t
where t.id = tp.transaction_id;

alter table public.transaction_payments
alter column business_id set not null,
drop constraint if exists transaction_payments_transaction_id_fkey,
add constraint transaction_payments_transaction_business_fk
  foreign key (transaction_id, business_id)
  references public.transactions(id, business_id)
  on delete cascade,
add constraint transaction_payments_attempt_business_fk
  foreign key (payment_attempt_id, business_id)
  references public.payment_attempts(id, business_id)
  on delete restrict,
add constraint transaction_payments_attempt_business_method_fk
  foreign key (payment_attempt_id, business_id, method)
  references public.payment_attempts(id, business_id, method)
  on delete restrict;

create index transaction_payments_business_id_idx
on public.transaction_payments(business_id);
create unique index transaction_payments_payment_attempt_unique_idx
on public.transaction_payments(payment_attempt_id)
where payment_attempt_id is not null;

create table public.business_member_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid,
  email extensions.citext,
  phone text,
  role public.business_member_role not null,
  status public.business_invitation_status not null default 'pending',
  token_hash text not null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_member_invitations_branch_business_fk
    foreign key (branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict,
  constraint business_member_invitations_recipient_present check (
    email is not null or phone is not null
  ),
  constraint business_member_invitations_phone_format check (
    phone is null or phone ~ '^\+?[0-9 ]{8,20}$'
  ),
  constraint business_member_invitations_owner_excluded check (role <> 'business_owner'),
  constraint business_member_invitations_branch_role check (
    role <> 'branch_manager' or branch_id is not null
  ),
  constraint business_member_invitations_token_hash_format check (
    token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint business_member_invitations_expiry_future check (expires_at > created_at),
  constraint business_member_invitations_status_timestamps check (
    (
      status <> 'accepted'
      or (accepted_at is not null and accepted_by is not null)
    )
    and (status <> 'revoked' or revoked_at is not null)
  )
);

create index business_member_invitations_business_id_idx
on public.business_member_invitations(business_id);
create index business_member_invitations_status_idx
on public.business_member_invitations(status, expires_at);
create unique index business_member_invitations_pending_email_unique_idx
on public.business_member_invitations(business_id, lower(email::text))
where status = 'pending' and email is not null;
create unique index business_member_invitations_pending_phone_unique_idx
on public.business_member_invitations(business_id, phone)
where status = 'pending' and phone is not null;

create trigger business_member_invitations_set_updated_at
before update on public.business_member_invitations
for each row execute function public.set_updated_at();

create table public.customer_business_preferences (
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  preferred_branch_id uuid,
  is_favorite boolean not null default false,
  offer_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, profile_id),
  constraint customer_business_preferences_branch_business_fk
    foreign key (preferred_branch_id, business_id)
    references public.branches(id, business_id)
    on delete restrict
);

create index customer_business_preferences_profile_id_idx
on public.customer_business_preferences(profile_id);
create index customer_business_preferences_favorites_idx
on public.customer_business_preferences(profile_id, is_favorite)
where is_favorite;

create trigger customer_business_preferences_set_updated_at
before update on public.customer_business_preferences
for each row execute function public.set_updated_at();

alter table public.transactions
add constraint transactions_id_business_card_unique
unique (id, business_id, customer_card_id);

create table public.offer_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  offer_id uuid not null,
  customer_card_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  transaction_id uuid,
  claim_code text not null unique,
  status public.offer_claim_status not null default 'activated',
  activated_at timestamptz not null default now(),
  redeemed_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offer_claims_offer_business_fk foreign key (offer_id, business_id)
    references public.offers(id, business_id)
    on delete restrict,
  constraint offer_claims_card_business_profile_fk
    foreign key (customer_card_id, business_id, profile_id)
    references public.customer_cards(id, business_id, customer_profile_id)
    on delete restrict,
  constraint offer_claims_transaction_business_card_fk
    foreign key (transaction_id, business_id, customer_card_id)
    references public.transactions(id, business_id, customer_card_id)
    on delete restrict,
  constraint offer_claims_offer_card_unique unique (offer_id, customer_card_id),
  constraint offer_claims_code_format check (claim_code ~ '^OF-[0-9A-Z-]{8,40}$'),
  constraint offer_claims_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint offer_claims_expiry_after_activation check (
    expires_at is null or expires_at > activated_at
  ),
  constraint offer_claims_status_timestamps check (
    (status <> 'redeemed' or (redeemed_at is not null and transaction_id is not null))
    and (status <> 'cancelled' or cancelled_at is not null)
  )
);

create index offer_claims_profile_id_idx on public.offer_claims(profile_id);
create index offer_claims_business_id_idx on public.offer_claims(business_id);
create index offer_claims_status_idx on public.offer_claims(status, expires_at);

create trigger offer_claims_set_updated_at
before update on public.offer_claims
for each row execute function public.set_updated_at();

create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  author_type public.support_message_author_type not null,
  body text not null,
  is_internal boolean not null default false,
  delivery_status public.support_message_delivery_status not null default 'internal',
  delivered_at timestamptz,
  provider_reference text,
  created_at timestamptz not null default now(),
  constraint support_ticket_messages_body_length check (
    char_length(btrim(body)) between 1 and 4000
  ),
  constraint support_ticket_messages_internal_consistency check (
    not is_internal or author_type <> 'requester'
  ),
  constraint support_ticket_messages_delivery_consistency check (
    (
      is_internal
      and delivery_status = 'internal'
    )
    or (
      not is_internal
      and delivery_status <> 'internal'
    )
  ),
  constraint support_ticket_messages_delivered_timestamp check (
    delivery_status <> 'delivered' or delivered_at is not null
  )
);

create index support_ticket_messages_ticket_id_idx
on public.support_ticket_messages(ticket_id, created_at);
create index support_ticket_messages_business_id_idx
on public.support_ticket_messages(business_id);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_settings_key_format check (key ~ '^[a-z][a-z0-9_.-]{2,99}$'),
  constraint platform_settings_value_no_secrets check (
    jsonb_typeof(value) <> 'object'
    or not value ?| array[
      'api_key',
      'client_secret',
      'password',
      'private_key',
      'secret',
      'token'
    ]
  )
);

create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();

comment on table public.business_catalog_items is
  'Business-owned service and product catalogue used by POS selection.';
comment on table public.pos_terminals is
  'Registered POS terminals; a web session is not active until a terminal record says so.';
comment on table public.business_payment_channels is
  'Non-secret payment channel state. Provider credentials remain outside browser-readable data.';
comment on column public.business_payment_channels.public_settings is
  'Browser-safe channel configuration only. Secrets and raw provider credentials are prohibited.';
comment on table public.payment_attempts is
  'Financial authorization state. It never changes loyalty balances or point ledger entries.';
comment on column public.payment_attempts.public_metadata is
  'Sanitized metadata only; raw provider payloads and secrets are prohibited.';
comment on table public.platform_settings is
  'Non-secret platform configuration. Secret values must remain in server-side secret storage.';
