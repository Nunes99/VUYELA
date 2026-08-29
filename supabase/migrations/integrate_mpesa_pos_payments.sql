-- M-Pesa C2B checkout for the POS.
-- Provider requests remain pending until an authenticated provider result is
-- reconciled. YELAS used as partial payment are reserved through the ledger and
-- are returned through a reversal entry when the provider declines the charge.

create table public.payment_provider_contexts (
  payment_attempt_id uuid primary key,
  business_id uuid not null,
  provider_request jsonb not null default '{}'::jsonb,
  checkout_snapshot jsonb not null default '{}'::jsonb,
  latest_provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_provider_contexts_attempt_business_fk
    foreign key (payment_attempt_id, business_id)
    references public.payment_attempts(id, business_id)
    on delete cascade,
  constraint payment_provider_contexts_request_object check (
    jsonb_typeof(provider_request) = 'object'
  ),
  constraint payment_provider_contexts_checkout_object check (
    jsonb_typeof(checkout_snapshot) = 'object'
  ),
  constraint payment_provider_contexts_response_object check (
    jsonb_typeof(latest_provider_response) = 'object'
  )
);

create trigger payment_provider_contexts_set_updated_at
before update on public.payment_provider_contexts
for each row execute function public.set_updated_at();

create table public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  payment_attempt_id uuid not null,
  business_id uuid not null,
  event_key text not null,
  provider_status text not null,
  provider_reference text,
  response_code text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  constraint payment_provider_events_attempt_business_fk
    foreign key (payment_attempt_id, business_id)
    references public.payment_attempts(id, business_id)
    on delete cascade,
  constraint payment_provider_events_key_format check (event_key ~ '^[0-9a-f]{64}$'),
  constraint payment_provider_events_status check (
    provider_status in ('authorized', 'pending', 'declined', 'cancelled', 'expired')
  ),
  constraint payment_provider_events_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint payment_provider_events_attempt_key_unique unique (payment_attempt_id, event_key)
);

create index payment_provider_events_attempt_received_idx
on public.payment_provider_events(payment_attempt_id, received_at desc);

alter table public.payment_provider_contexts enable row level security;
alter table public.payment_provider_events enable row level security;

revoke all on table
  public.payment_provider_contexts,
  public.payment_provider_events
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.payment_provider_contexts,
  public.payment_provider_events
to service_role;

create or replace function public.configure_mpesa_payment_channel(
  p_business_id uuid,
  p_channel_id uuid,
  p_public_settings jsonb,
  p_credentials jsonb default '{}'::jsonb
)
returns public.payment_channel_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_channel public.business_payment_channels%rowtype;
  v_secret_id uuid;
  v_secret_name text;
  v_next_status public.payment_channel_status;
  v_endpoint text;
begin
  if p_business_id is null
    or p_channel_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to configure M-Pesa';
  end if;

  select channel.*
  into v_channel
  from public.business_payment_channels channel
  where channel.id = p_channel_id
    and channel.business_id = p_business_id
    and channel.method = 'mpesa'
    and channel.mode = 'provider'
  for update;

  if not found then raise exception 'M-Pesa payment channel not found'; end if;

  if p_public_settings is null
    or jsonb_typeof(p_public_settings) <> 'object'
    or octet_length(p_public_settings::text) > 16384
    or p_credentials is null
    or jsonb_typeof(p_credentials) <> 'object'
    or octet_length(p_credentials::text) > 16384
  then
    raise exception 'Invalid M-Pesa configuration payload';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_public_settings) setting(key_name)
    where key_name <> all(array[
      'autoReconciliation', 'c2bResourceUrl', 'confirmationNumber', 'environment',
      'merchantId', 'maximumAmount', 'minimumAmount', 'reconciliationFrequency',
      'reportEmail', 'requestOrigin', 'smsNotifications', 'timeoutSeconds',
      'ussdShortcode'
    ]::text[])
  ) or exists (
    select 1
    from jsonb_object_keys(p_credentials) credential(key_name)
    where key_name <> all(array['apiKey', 'publicKey']::text[])
  ) then
    raise exception 'Unsupported M-Pesa configuration field';
  end if;

  if p_public_settings ?| array[
    'apiKey', 'apiSecret', 'clientSecret', 'password', 'privateKey',
    'publicKey', 'secret', 'token'
  ] then
    raise exception 'M-Pesa credentials cannot be stored in public settings';
  end if;

  v_endpoint := btrim(coalesce(p_public_settings ->> 'c2bResourceUrl', ''));
  if v_endpoint !~ '^https://[^[:space:]]+$'
    or char_length(btrim(coalesce(p_public_settings ->> 'merchantId', ''))) not between 2 and 80
    or coalesce((p_public_settings ->> 'minimumAmount')::integer, 0) <= 0
    or coalesce((p_public_settings ->> 'maximumAmount')::integer, 0)
      < coalesce((p_public_settings ->> 'minimumAmount')::integer, 0)
    or coalesce((p_public_settings ->> 'timeoutSeconds')::integer, 0) not between 30 and 600
  then
    raise exception 'Invalid M-Pesa operational settings';
  end if;

  if p_credentials <> '{}'::jsonb then
    if not (p_credentials ? 'apiKey' and p_credentials ? 'publicKey')
      or char_length(btrim(coalesce(p_credentials ->> 'apiKey', ''))) < 8
      or char_length(regexp_replace(coalesce(p_credentials ->> 'publicKey', ''), '\s', '', 'g')) < 128
    then
      raise exception 'M-Pesa API key and public key are required';
    end if;

    v_secret_name := 'vuyela_payment_' || replace(v_channel.id::text, '-', '_');

    select secret.id into v_secret_id
    from vault.secrets secret
    where secret.name = v_secret_name;

    if v_secret_id is null then
      select vault.create_secret(
        p_credentials::text,
        v_secret_name,
        'VUYELA M-Pesa credentials for channel ' || v_channel.id::text
      ) into v_secret_id;
    else
      perform vault.update_secret(
        v_secret_id,
        p_credentials::text,
        v_secret_name,
        'VUYELA M-Pesa credentials for channel ' || v_channel.id::text
      );
    end if;
  end if;

  if p_credentials <> '{}'::jsonb then
    v_next_status := 'testing';
  elsif v_channel.credentials_configured_at is null then
    v_next_status := 'unconfigured';
  else
    v_next_status := v_channel.status;
  end if;

  update public.business_payment_channels channel
  set
    public_settings = jsonb_strip_nulls(p_public_settings),
    masked_identifier = case
      when char_length(p_public_settings ->> 'merchantId') <= 4
        then '••••' || (p_public_settings ->> 'merchantId')
      else repeat('•', least(char_length(p_public_settings ->> 'merchantId') - 4, 12))
        || right(p_public_settings ->> 'merchantId', 4)
    end,
    credentials_configured_at = case
      when p_credentials <> '{}'::jsonb then now()
      else channel.credentials_configured_at
    end,
    status = v_next_status
  where channel.id = v_channel.id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id,
    before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'update',
    'business_payment_channels',
    v_channel.id,
    to_jsonb(v_channel),
    (select to_jsonb(channel) from public.business_payment_channels channel where channel.id = v_channel.id),
    jsonb_build_object(
      'source', 'mpesa_payment_settings',
      'credentials_updated', p_credentials <> '{}'::jsonb
    )
  );

  return v_next_status;
end;
$$;

create or replace function public.prepare_pos_mpesa_payment(
  p_business_id uuid,
  p_branch_id uuid,
  p_terminal_id uuid,
  p_customer_card_id uuid,
  p_items jsonb,
  p_points_to_redeem integer,
  p_expected_gross_amount_mzn_minor integer,
  p_expected_discount_amount_mzn_minor integer,
  p_expected_net_amount_mzn_minor integer,
  p_customer_msisdn text,
  p_idempotency_key text,
  p_customer_authorized boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  payment_attempt_id uuid,
  payment_status text,
  amount_mzn_minor integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_terminal public.pos_terminals%rowtype;
  v_channel public.business_payment_channels%rowtype;
  v_existing_attempt public.payment_attempts%rowtype;
  v_cashier_member_id uuid;
  v_quote jsonb;
  v_transaction_id uuid := gen_random_uuid();
  v_attempt_id uuid := gen_random_uuid();
  v_wallet public.point_wallets%rowtype;
  v_points_to_redeem integer;
  v_points_redeemed_value integer;
begin
  if v_actor is null
    or p_business_id is null
    or p_branch_id is null
    or p_terminal_id is null
  then
    raise exception 'Required M-Pesa checkout fields are missing';
  end if;

  if p_customer_msisdn !~ '^2588[45][0-9]{7}$' then
    raise exception 'Invalid M-Pesa customer number';
  end if;
  if char_length(btrim(coalesce(p_idempotency_key, ''))) not between 12 and 200 then
    raise exception 'Invalid idempotency key';
  end if;
  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'POS metadata must be an object';
  end if;
  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to operate this branch';
  end if;

  select attempt.*
  into v_existing_attempt
  from public.payment_attempts attempt
  where attempt.business_id = p_business_id
    and attempt.idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_existing_attempt.method <> 'mpesa' then
      raise exception 'The idempotency key belongs to another payment method';
    end if;
    return query select
      v_existing_attempt.id,
      v_existing_attempt.status::text,
      v_existing_attempt.amount_mzn_minor;
    return;
  end if;

  select terminal.*
  into v_terminal
  from public.pos_terminals terminal
  where terminal.id = p_terminal_id
    and terminal.business_id = p_business_id
    and terminal.branch_id = p_branch_id
    and terminal.status = 'active'
  for update;
  if not found then raise exception 'An active POS terminal is required'; end if;

  select member.id
  into v_cashier_member_id
  from public.business_members member
  where member.business_id = p_business_id
    and member.profile_id = v_actor
    and member.status = 'active'
    and (
      member.role in ('business_admin', 'business_owner')
      or (
        member.branch_id = p_branch_id
        and member.role in ('branch_manager', 'cashier')
      )
    )
  order by case when member.branch_id = p_branch_id then 0 else 1 end, member.joined_at
  limit 1;
  if v_cashier_member_id is null then raise exception 'Active POS operator not found'; end if;

  select channel.*
  into v_channel
  from public.business_payment_channels channel
  where channel.business_id = p_business_id
    and channel.method = 'mpesa'
    and channel.mode = 'provider'
    and channel.status = 'active'
    and channel.credentials_configured_at is not null
    and (channel.branch_id = p_branch_id or channel.branch_id is null)
  order by case when channel.branch_id = p_branch_id then 0 else 1 end
  limit 1;
  if not found then raise exception 'M-Pesa payment channel is not active for this branch'; end if;

  v_quote := public.quote_pos_cart(
    p_business_id,
    p_branch_id,
    p_terminal_id,
    p_customer_card_id,
    p_items,
    p_points_to_redeem
  );

  if (v_quote ->> 'grossAmountMznMinor')::integer <> p_expected_gross_amount_mzn_minor
    or (v_quote ->> 'discountAmountMznMinor')::integer <> p_expected_discount_amount_mzn_minor
    or (v_quote ->> 'netAmountMznMinor')::integer <> p_expected_net_amount_mzn_minor
    or p_expected_net_amount_mzn_minor <= 0
  then
    raise exception 'The POS cart changed and must be reviewed again';
  end if;

  v_points_to_redeem := (v_quote ->> 'pointsToRedeem')::integer;
  v_points_redeemed_value := (v_quote ->> 'pointsRedeemedValueMznMinor')::integer;
  if v_points_to_redeem > 0 and not coalesce(p_customer_authorized, false) then
    raise exception 'Customer authorization is required to use YELAS';
  end if;

  insert into public.transactions (
    id, business_id, branch_id, customer_card_id, cashier_member_id,
    external_reference, status, currency, gross_amount_mzn_minor,
    discount_amount_mzn_minor, points_redeemed,
    points_redeemed_value_mzn_minor, net_amount_mzn_minor, points_earned,
    metadata
  ) values (
    v_transaction_id,
    p_business_id,
    p_branch_id,
    p_customer_card_id,
    v_cashier_member_id,
    p_idempotency_key,
    'pending_customer_confirmation',
    'MZN',
    p_expected_gross_amount_mzn_minor,
    p_expected_discount_amount_mzn_minor,
    v_points_to_redeem,
    v_points_redeemed_value,
    p_expected_net_amount_mzn_minor,
    0,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'source', 'pos',
      'terminal_id', p_terminal_id,
      'payment_method', 'mpesa',
      'expected_points_earned', (v_quote ->> 'pointsEarned')::integer
    )
  );

  if v_points_to_redeem > 0 then
    select wallet.*
    into v_wallet
    from public.point_wallets wallet
    where wallet.business_id = p_business_id
      and wallet.customer_card_id = p_customer_card_id
    for update;

    if not found or v_wallet.available_balance < v_points_to_redeem then
      raise exception 'The YELAS balance is no longer available';
    end if;

    update public.point_wallets wallet
    set
      available_balance = wallet.available_balance - v_points_to_redeem,
      lifetime_redeemed = wallet.lifetime_redeemed + v_points_to_redeem,
      updated_at = now()
    where wallet.id = v_wallet.id;

    insert into public.point_ledger (
      business_id, wallet_id, customer_card_id, transaction_id, type,
      amount, reason, created_by, metadata
    ) values (
      p_business_id,
      v_wallet.id,
      p_customer_card_id,
      v_transaction_id,
      'redeem',
      -v_points_to_redeem,
      'mpesa_payment_reservation',
      v_actor,
      jsonb_build_object(
        'points_redeemed_value_mzn_minor', v_points_redeemed_value,
        'payment_state', 'pending'
      )
    );
  end if;

  insert into public.transaction_items (
    business_id, transaction_id, catalog_item_id, sku, name, description,
    quantity, unit_price_mzn_minor, gross_amount_mzn_minor,
    loyalty_discount_percent, discount_amount_mzn_minor, net_amount_mzn_minor,
    metadata
  )
  select
    p_business_id,
    v_transaction_id,
    (line.value ->> 'catalogItemId')::uuid,
    nullif(line.value ->> 'sku', ''),
    line.value ->> 'name',
    nullif(line.value ->> 'description', ''),
    (line.value ->> 'quantity')::integer,
    (line.value ->> 'unitPriceMznMinor')::integer,
    (line.value ->> 'grossAmountMznMinor')::integer,
    (line.value ->> 'loyaltyDiscountPercent')::numeric,
    (line.value ->> 'discountAmountMznMinor')::integer,
    (line.value ->> 'netAmountMznMinor')::integer,
    jsonb_build_object('source', 'mpesa_pos_quote')
  from jsonb_array_elements(v_quote -> 'lines') line(value);

  insert into public.payment_attempts (
    id, business_id, branch_id, terminal_id, payment_channel_id,
    transaction_id, method, status, amount_mzn_minor, idempotency_key,
    requested_by, expires_at, public_metadata
  ) values (
    v_attempt_id,
    p_business_id,
    p_branch_id,
    p_terminal_id,
    v_channel.id,
    v_transaction_id,
    'mpesa',
    'initiated',
    p_expected_net_amount_mzn_minor,
    p_idempotency_key,
    v_actor,
    now() + make_interval(secs => coalesce(
      (v_channel.public_settings ->> 'timeoutSeconds')::integer,
      120
    ) + 300),
    jsonb_build_object(
      'confirmation', 'provider',
      'provider', 'mpesa',
      'terminal_code', v_terminal.code,
      'customer_msisdn_suffix', right(p_customer_msisdn, 4)
    )
  );

  insert into public.payment_provider_contexts (
    payment_attempt_id, business_id, provider_request, checkout_snapshot
  ) values (
    v_attempt_id,
    p_business_id,
    jsonb_build_object(
      'customerMsisdn', p_customer_msisdn,
      'transactionReference', left(v_terminal.code || '-' || replace(v_transaction_id::text, '-', ''), 40)
    ),
    jsonb_build_object(
      'quote', v_quote,
      'items', p_items,
      'customerCardId', p_customer_card_id,
      'cashierMemberId', v_cashier_member_id,
      'customerAuthorized', p_customer_authorized
    )
  );

  update public.pos_terminals set last_seen_at = now() where id = p_terminal_id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'create',
    'payment_attempts',
    v_attempt_id,
    jsonb_build_object(
      'transaction_id', v_transaction_id,
      'method', 'mpesa',
      'amount_mzn_minor', p_expected_net_amount_mzn_minor,
      'status', 'initiated'
    ),
    jsonb_build_object('source', 'mpesa_pos_checkout', 'terminal_id', p_terminal_id)
  );

  return query select v_attempt_id, 'initiated'::text, p_expected_net_amount_mzn_minor;
end;
$$;

create or replace function public.get_mpesa_payment_attempt_context(
  p_payment_attempt_id uuid
)
returns table (
  payment_attempt_id uuid,
  payment_status text,
  amount_mzn_minor integer,
  customer_msisdn text,
  transaction_reference text,
  public_settings jsonb,
  credentials jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_name text;
begin
  return query
  select
    attempt.id,
    attempt.status::text,
    attempt.amount_mzn_minor,
    context.provider_request ->> 'customerMsisdn',
    context.provider_request ->> 'transactionReference',
    channel.public_settings,
    coalesce((
      select decrypted.decrypted_secret::jsonb
      from vault.decrypted_secrets decrypted
      where decrypted.name = 'vuyela_payment_' || replace(channel.id::text, '-', '_')
      limit 1
    ), '{}'::jsonb)
  from public.payment_attempts attempt
  join public.business_payment_channels channel
    on channel.id = attempt.payment_channel_id
    and channel.business_id = attempt.business_id
  join public.payment_provider_contexts context
    on context.payment_attempt_id = attempt.id
    and context.business_id = attempt.business_id
  where attempt.id = p_payment_attempt_id
    and attempt.method = 'mpesa';
end;
$$;

create or replace function public.reconcile_mpesa_payment_attempt(
  p_payment_attempt_id uuid,
  p_provider_status text,
  p_provider_reference text,
  p_failure_code text,
  p_provider_payload jsonb,
  p_event_key text
)
returns table (
  transaction_id uuid,
  available_balance integer,
  payment_attempt_id uuid,
  payment_status text,
  receipt_number text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_transaction public.transactions%rowtype;
  v_context public.payment_provider_contexts%rowtype;
  v_wallet public.point_wallets%rowtype;
  v_points_earned integer := 0;
  v_balance integer := 0;
  v_provider_reference text;
begin
  if p_provider_status not in ('authorized', 'pending', 'declined', 'cancelled', 'expired')
    or p_provider_payload is null
    or jsonb_typeof(p_provider_payload) <> 'object'
    or octet_length(p_provider_payload::text) > 32768
    or p_event_key !~ '^[0-9a-f]{64}$'
  then
    raise exception 'Invalid M-Pesa provider result';
  end if;

  select attempt.* into v_attempt
  from public.payment_attempts attempt
  where attempt.id = p_payment_attempt_id
    and attempt.method = 'mpesa'
  for update;
  if not found then raise exception 'M-Pesa payment attempt not found'; end if;

  select context.* into v_context
  from public.payment_provider_contexts context
  where context.payment_attempt_id = v_attempt.id
  for update;
  if not found then raise exception 'M-Pesa private context not found'; end if;

  select tx.* into v_transaction
  from public.transactions tx
  where tx.id = v_attempt.transaction_id
    and tx.business_id = v_attempt.business_id
  for update;
  if not found then raise exception 'Pending M-Pesa transaction not found'; end if;

  insert into public.payment_provider_events (
    payment_attempt_id, business_id, event_key, provider_status,
    provider_reference, response_code, payload
  ) values (
    v_attempt.id,
    v_attempt.business_id,
    p_event_key,
    p_provider_status,
    nullif(btrim(coalesce(p_provider_reference, '')), ''),
    nullif(btrim(coalesce(p_failure_code, '')), ''),
    p_provider_payload
  ) on conflict (payment_attempt_id, event_key) do nothing;

  update public.payment_provider_contexts context
  set latest_provider_response = p_provider_payload
  where context.payment_attempt_id = v_attempt.id;

  if v_attempt.status = 'reconciled' then
    if v_transaction.customer_card_id is not null then
      select wallet.available_balance into v_balance
      from public.point_wallets wallet
      where wallet.business_id = v_transaction.business_id
        and wallet.customer_card_id = v_transaction.customer_card_id;
    end if;
    return query select
      v_transaction.id,
      coalesce(v_balance, 0),
      v_attempt.id,
      'reconciled'::text,
      'VY-' || upper(substr(replace(v_transaction.id::text, '-', ''), 1, 10));
    return;
  end if;

  v_provider_reference := coalesce(
    nullif(btrim(coalesce(p_provider_reference, '')), ''),
    v_attempt.provider_reference,
    'MPESA-' || upper(substr(replace(v_attempt.id::text, '-', ''), 1, 20))
  );

  if p_provider_status = 'pending' then
    if v_attempt.status in ('initiated', 'pending') then
      update public.payment_attempts attempt
      set status = 'pending', provider_reference = v_provider_reference
      where attempt.id = v_attempt.id;
    end if;
    return query select
      null::uuid,
      0,
      v_attempt.id,
      'pending'::text,
      null::text;
    return;
  end if;

  if p_provider_status in ('declined', 'cancelled', 'expired') then
    if v_transaction.status = 'pending_customer_confirmation' then
      if v_transaction.customer_card_id is not null and v_transaction.points_redeemed > 0 then
        select wallet.* into v_wallet
        from public.point_wallets wallet
        where wallet.business_id = v_transaction.business_id
          and wallet.customer_card_id = v_transaction.customer_card_id
        for update;
        if not found then raise exception 'Point wallet not found for M-Pesa reversal'; end if;

        update public.point_wallets wallet
        set
          available_balance = wallet.available_balance + v_transaction.points_redeemed,
          lifetime_redeemed = greatest(
            wallet.lifetime_redeemed - v_transaction.points_redeemed,
            0
          ),
          updated_at = now()
        where wallet.id = v_wallet.id
        returning wallet.available_balance into v_balance;

        insert into public.point_ledger (
          business_id, wallet_id, customer_card_id, transaction_id, type,
          amount, reason, created_by, metadata
        ) values (
          v_transaction.business_id,
          v_wallet.id,
          v_transaction.customer_card_id,
          v_transaction.id,
          'reversal',
          v_transaction.points_redeemed,
          'mpesa_payment_reservation_released',
          v_attempt.requested_by,
          jsonb_build_object('provider_status', p_provider_status)
        );
      end if;

      update public.transactions tx
      set
        status = 'cancelled',
        cancelled_at = now(),
        metadata = tx.metadata || jsonb_build_object('payment_status', p_provider_status)
      where tx.id = v_transaction.id;
    end if;

    update public.payment_attempts attempt
    set
      status = p_provider_status::public.payment_attempt_status,
      provider_reference = v_provider_reference,
      failure_code = left(coalesce(nullif(btrim(p_failure_code), ''), upper(p_provider_status)), 120)
    where attempt.id = v_attempt.id;

    return query select
      null::uuid,
      coalesce(v_balance, 0),
      v_attempt.id,
      p_provider_status,
      null::text;
    return;
  end if;

  if v_transaction.status <> 'pending_customer_confirmation'
    or v_attempt.status not in ('initiated', 'pending', 'authorized')
  then
    raise exception 'M-Pesa payment cannot be authorized from its current state';
  end if;

  v_points_earned := coalesce(
    (v_context.checkout_snapshot -> 'quote' ->> 'pointsEarned')::integer,
    0
  );

  if v_transaction.customer_card_id is not null then
    select wallet.* into v_wallet
    from public.point_wallets wallet
    where wallet.business_id = v_transaction.business_id
      and wallet.customer_card_id = v_transaction.customer_card_id
    for update;
    if not found then raise exception 'Point wallet not found for M-Pesa reconciliation'; end if;

    if v_points_earned > 0 then
      update public.point_wallets wallet
      set
        available_balance = wallet.available_balance + v_points_earned,
        lifetime_earned = wallet.lifetime_earned + v_points_earned,
        updated_at = now()
      where wallet.id = v_wallet.id
      returning wallet.available_balance into v_balance;

      insert into public.point_ledger (
        business_id, wallet_id, customer_card_id, transaction_id, type,
        amount, reason, created_by, metadata
      ) values (
        v_transaction.business_id,
        v_wallet.id,
        v_transaction.customer_card_id,
        v_transaction.id,
        'earn',
        v_points_earned,
        case
          when v_transaction.points_redeemed > 0 then 'purchase_earn_after_redemption'
          else 'purchase_earn'
        end,
        v_attempt.requested_by,
        jsonb_build_object(
          'payment_method', 'mpesa',
          'provider_reference', v_provider_reference
        )
      );
    else
      v_balance := v_wallet.available_balance;
    end if;
  end if;

  update public.transactions tx
  set
    status = 'completed',
    points_earned = v_points_earned,
    completed_at = now(),
    metadata = tx.metadata || jsonb_build_object(
      'payment_status', 'reconciled',
      'provider_reference', v_provider_reference
    )
  where tx.id = v_transaction.id;

  update public.payment_attempts attempt
  set
    status = 'reconciled',
    provider_reference = v_provider_reference,
    authorized_at = coalesce(attempt.authorized_at, now()),
    reconciled_at = now(),
    failure_code = null
  where attempt.id = v_attempt.id;

  insert into public.transaction_payments (
    transaction_id, business_id, payment_attempt_id, method,
    amount_mzn_minor, provider_reference, reconciled_at
  ) values (
    v_transaction.id,
    v_transaction.business_id,
    v_attempt.id,
    'mpesa',
    v_transaction.net_amount_mzn_minor,
    v_provider_reference,
    now()
  ) on conflict (payment_attempt_id) where payment_attempt_id is not null do nothing;

  perform public.apply_qualifying_referral_reward(v_transaction.id);

  if v_transaction.customer_card_id is not null then
    select wallet.available_balance into v_balance
    from public.point_wallets wallet
    where wallet.business_id = v_transaction.business_id
      and wallet.customer_card_id = v_transaction.customer_card_id;
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, after_data, context
  ) values (
    v_transaction.business_id,
    v_attempt.requested_by,
    'create',
    'transaction_payments',
    v_attempt.id,
    jsonb_build_object(
      'transaction_id', v_transaction.id,
      'method', 'mpesa',
      'amount_mzn_minor', v_transaction.net_amount_mzn_minor,
      'status', 'reconciled'
    ),
    jsonb_build_object('source', 'mpesa_provider_reconciliation')
  );

  return query select
    v_transaction.id,
    coalesce(v_balance, 0),
    v_attempt.id,
    'reconciled'::text,
    'VY-' || upper(substr(replace(v_transaction.id::text, '-', ''), 1, 10));
end;
$$;

create or replace function public.get_mpesa_payment_attempt_status(
  p_payment_attempt_id uuid
)
returns table (
  transaction_id uuid,
  available_balance integer,
  payment_attempt_id uuid,
  payment_status text,
  receipt_number text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_transaction public.transactions%rowtype;
  v_balance integer := 0;
begin
  select attempt.* into v_attempt
  from public.payment_attempts attempt
  where attempt.id = p_payment_attempt_id
    and attempt.method = 'mpesa';
  if not found then raise exception 'M-Pesa payment attempt not found'; end if;

  if (select auth.role()) <> 'service_role'
    and ((select auth.uid()) is null
      or not public.can_access_transaction(v_attempt.business_id, v_attempt.branch_id))
  then
    raise exception 'Not authorized to read this M-Pesa payment';
  end if;

  select tx.* into v_transaction
  from public.transactions tx
  where tx.id = v_attempt.transaction_id
    and tx.business_id = v_attempt.business_id;

  if v_transaction.customer_card_id is not null then
    select wallet.available_balance into v_balance
    from public.point_wallets wallet
    where wallet.business_id = v_transaction.business_id
      and wallet.customer_card_id = v_transaction.customer_card_id;
  end if;

  return query select
    case when v_attempt.status = 'reconciled' then v_transaction.id else null::uuid end,
    coalesce(v_balance, 0),
    v_attempt.id,
    v_attempt.status::text,
    case
      when v_attempt.status = 'reconciled'
        then 'VY-' || upper(substr(replace(v_transaction.id::text, '-', ''), 1, 10))
      else null::text
    end;
end;
$$;

revoke all on function public.configure_mpesa_payment_channel(uuid, uuid, jsonb, jsonb)
from public, anon;
grant execute on function public.configure_mpesa_payment_channel(uuid, uuid, jsonb, jsonb)
to authenticated;

revoke all on function public.prepare_pos_mpesa_payment(
  uuid, uuid, uuid, uuid, jsonb, integer, integer, integer, integer,
  text, text, boolean, jsonb
) from public, anon;
grant execute on function public.prepare_pos_mpesa_payment(
  uuid, uuid, uuid, uuid, jsonb, integer, integer, integer, integer,
  text, text, boolean, jsonb
) to authenticated;

revoke all on function public.get_mpesa_payment_attempt_context(uuid)
from public, anon, authenticated;
grant execute on function public.get_mpesa_payment_attempt_context(uuid)
to service_role;

revoke all on function public.reconcile_mpesa_payment_attempt(
  uuid, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.reconcile_mpesa_payment_attempt(
  uuid, text, text, text, jsonb, text
) to service_role;

revoke all on function public.get_mpesa_payment_attempt_status(uuid)
from public, anon;
grant execute on function public.get_mpesa_payment_attempt_status(uuid)
to authenticated, service_role;

comment on table public.payment_provider_contexts is
  'Server-only provider request and checkout snapshots. Never exposed to browser roles.';
comment on table public.payment_provider_events is
  'Idempotent, sanitized payment-provider events used for reconciliation and audit.';
comment on function public.prepare_pos_mpesa_payment(
  uuid, uuid, uuid, uuid, jsonb, integer, integer, integer, integer,
  text, text, boolean, jsonb
) is
  'Atomically creates a pending POS sale, provider attempt and any ledger-backed YELAS reservation.';
comment on function public.reconcile_mpesa_payment_attempt(
  uuid, text, text, text, jsonb, text
) is
  'Service-role-only M-Pesa reconciliation. Completes one sale or reverses its reserved YELAS exactly once.';
