-- Cart-first POS checkout.
-- Prices and loyalty benefits are always recalculated in PostgreSQL before a
-- payment is reconciled. The existing loyalty RPCs remain the only writers of
-- wallet balances and point ledger entries.

alter table public.business_catalog_items
add column loyalty_discount_percent numeric(5, 2) not null default 0,
add constraint business_catalog_items_loyalty_discount_range check (
  loyalty_discount_percent >= 0
  and loyalty_discount_percent <= 100
);

create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  transaction_id uuid not null,
  catalog_item_id uuid,
  sku text,
  name text not null,
  description text,
  quantity integer not null,
  unit_price_mzn_minor integer not null,
  gross_amount_mzn_minor integer not null,
  loyalty_discount_percent numeric(5, 2) not null default 0,
  discount_amount_mzn_minor integer not null default 0,
  net_amount_mzn_minor integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint transaction_items_transaction_business_fk
    foreign key (transaction_id, business_id)
    references public.transactions(id, business_id)
    on delete cascade,
  constraint transaction_items_catalog_business_fk
    foreign key (catalog_item_id, business_id)
    references public.business_catalog_items(id, business_id)
    on delete restrict,
  constraint transaction_items_name_length check (
    char_length(btrim(name)) between 2 and 120
  ),
  constraint transaction_items_quantity_positive check (quantity > 0),
  constraint transaction_items_unit_price_non_negative check (unit_price_mzn_minor >= 0),
  constraint transaction_items_gross_non_negative check (gross_amount_mzn_minor >= 0),
  constraint transaction_items_discount_percent_range check (
    loyalty_discount_percent >= 0
    and loyalty_discount_percent <= 100
  ),
  constraint transaction_items_discount_non_negative check (discount_amount_mzn_minor >= 0),
  constraint transaction_items_net_non_negative check (net_amount_mzn_minor >= 0),
  constraint transaction_items_gross_math check (
    gross_amount_mzn_minor = unit_price_mzn_minor * quantity
  ),
  constraint transaction_items_net_math check (
    net_amount_mzn_minor = gross_amount_mzn_minor - discount_amount_mzn_minor
  ),
  constraint transaction_items_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index transaction_items_transaction_id_idx
on public.transaction_items(transaction_id);

create index transaction_items_business_created_at_idx
on public.transaction_items(business_id, created_at desc);

create index transaction_items_catalog_item_id_idx
on public.transaction_items(catalog_item_id)
where catalog_item_id is not null;

alter table public.transaction_items enable row level security;

revoke all on table public.transaction_items from public, anon, authenticated;
grant select on table public.transaction_items to authenticated;

create policy transaction_items_select_transaction_access
on public.transaction_items
for select
to authenticated
using (public.can_access_transaction_id(transaction_id));

create or replace function public.manage_business_catalog_item_checkout(
  p_business_id uuid,
  p_item_id uuid,
  p_action text,
  p_branch_id uuid,
  p_kind public.catalog_item_kind,
  p_sku text,
  p_name text,
  p_description text,
  p_price_mzn_minor integer,
  p_loyalty_discount_percent numeric,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_item_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_audit_action public.audit_action;
begin
  if p_business_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to manage catalog';
  end if;

  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action in ('create', 'update') then
    if char_length(btrim(coalesce(p_name, ''))) not between 2 and 120
      or coalesce(p_price_mzn_minor, -1) < 0
      or coalesce(p_loyalty_discount_percent, -1) < 0
      or coalesce(p_loyalty_discount_percent, 101) > 100
      or coalesce(p_sort_order, -1) < 0
    then
      raise exception 'Invalid catalog item';
    end if;

    if p_branch_id is not null and not exists (
      select 1
      from public.branches br
      where br.id = p_branch_id
        and br.business_id = p_business_id
        and br.is_active
    ) then
      raise exception 'Active branch not found';
    end if;
  end if;

  if p_action = 'create' then
    insert into public.business_catalog_items (
      business_id,
      branch_id,
      kind,
      sku,
      name,
      description,
      price_mzn_minor,
      loyalty_discount_percent,
      sort_order,
      created_by
    ) values (
      p_business_id,
      p_branch_id,
      p_kind,
      nullif(upper(btrim(p_sku)), ''),
      btrim(p_name),
      nullif(btrim(p_description), ''),
      p_price_mzn_minor,
      p_loyalty_discount_percent,
      p_sort_order,
      v_actor
    )
    returning id into v_item_id;
    v_audit_action := 'create';
  else
    select to_jsonb(item.*)
    into v_before
    from public.business_catalog_items item
    where item.id = p_item_id
      and item.business_id = p_business_id
    for update;

    if v_before is null then
      raise exception 'Catalog item not found';
    end if;

    if p_action = 'update' then
      update public.business_catalog_items
      set
        branch_id = p_branch_id,
        kind = p_kind,
        sku = nullif(upper(btrim(p_sku)), ''),
        name = btrim(p_name),
        description = nullif(btrim(p_description), ''),
        price_mzn_minor = p_price_mzn_minor,
        loyalty_discount_percent = p_loyalty_discount_percent,
        sort_order = p_sort_order
      where id = p_item_id
        and business_id = p_business_id;
      v_audit_action := 'update';
    elsif p_action in ('activate', 'suspend') then
      update public.business_catalog_items
      set is_available = p_action = 'activate'
      where id = p_item_id
        and business_id = p_business_id;
      v_audit_action := case
        when p_action = 'suspend' then 'suspension'::public.audit_action
        else 'update'::public.audit_action
      end;
    elsif p_action = 'delete' then
      delete from public.business_catalog_items
      where id = p_item_id
        and business_id = p_business_id;
      v_audit_action := 'delete';
    else
      raise exception 'Unsupported catalog action';
    end if;

    v_item_id := p_item_id;
  end if;

  if p_action <> 'delete' then
    select to_jsonb(item.*)
    into v_after
    from public.business_catalog_items item
    where item.id = v_item_id;
  end if;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    context
  ) values (
    p_business_id,
    v_actor,
    v_audit_action,
    'business_catalog_items',
    v_item_id,
    v_before,
    v_after,
    jsonb_build_object('source', 'business_operations', 'operation', p_action, 'version', 2)
  );

  return v_item_id;
end;
$$;

create or replace function public.quote_pos_cart(
  p_business_id uuid,
  p_branch_id uuid,
  p_terminal_id uuid,
  p_customer_card_id uuid,
  p_items jsonb,
  p_points_to_redeem integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_requested record;
  v_item public.business_catalog_items%rowtype;
  v_lines jsonb := '[]'::jsonb;
  v_line_gross bigint;
  v_line_discount bigint;
  v_line_net bigint;
  v_gross bigint := 0;
  v_discount bigint := 0;
  v_available_balance integer := 0;
  v_earn_rate numeric := 0;
  v_point_value_mzn_minor integer := 1;
  v_minimum_earn_amount_mzn_minor integer := 0;
  v_maximum_redemption_percent numeric := 0;
  v_maximum_redeemable_points integer := 0;
  v_points_to_redeem integer := greatest(coalesce(p_points_to_redeem, 0), 0);
  v_points_redeemed_value_mzn_minor integer := 0;
  v_points_earned integer := 0;
  v_net_amount_mzn_minor integer;
begin
  if (select auth.uid()) is null
    or p_business_id is null
    or p_branch_id is null
    or p_terminal_id is null
  then
    raise exception 'Required POS quote fields are missing';
  end if;

  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to operate this branch';
  end if;

  if not exists (
    select 1
    from public.pos_terminals terminal
    where terminal.id = p_terminal_id
      and terminal.business_id = p_business_id
      and terminal.branch_id = p_branch_id
      and terminal.status = 'active'
  ) then
    raise exception 'An active POS terminal is required';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 100
  then
    raise exception 'The POS cart must contain between 1 and 100 lines';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) entry(value)
    where jsonb_typeof(entry.value) <> 'object'
      or not entry.value ? 'catalogItemId'
      or not entry.value ? 'quantity'
      or coalesce(entry.value ->> 'catalogItemId', '') !~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
      or coalesce(entry.value ->> 'quantity', '') !~ '^[1-9][0-9]{0,2}$'
  ) then
    raise exception 'The POS cart contains an invalid line';
  end if;

  if p_customer_card_id is not null then
    select
      wallet.available_balance,
      program.earn_rate,
      program.point_value_mzn_minor,
      program.minimum_earn_amount_mzn_minor,
      program.maximum_redemption_percent
    into
      v_available_balance,
      v_earn_rate,
      v_point_value_mzn_minor,
      v_minimum_earn_amount_mzn_minor,
      v_maximum_redemption_percent
    from public.customer_cards card
    join public.point_wallets wallet
      on wallet.customer_card_id = card.id
      and wallet.business_id = card.business_id
    join public.loyalty_programs program
      on program.id = card.loyalty_program_id
      and program.business_id = card.business_id
    where card.id = p_customer_card_id
      and card.business_id = p_business_id
      and card.status = 'active'
      and program.status = 'active';

    if not found then
      raise exception 'Active customer card not found for this business';
    end if;
  elsif v_points_to_redeem > 0 then
    raise exception 'A customer card is required to use YELAS';
  end if;

  for v_requested in
    select
      (entry.value ->> 'catalogItemId')::uuid as catalog_item_id,
      sum((entry.value ->> 'quantity')::integer)::integer as quantity,
      min(entry.ordinality) as first_position
    from jsonb_array_elements(p_items) with ordinality as entry(value, ordinality)
    group by (entry.value ->> 'catalogItemId')::uuid
    order by min(entry.ordinality)
  loop
    if v_requested.quantity > 999 then
      raise exception 'The POS cart exceeds the maximum quantity for one item';
    end if;

    select item.*
    into v_item
    from public.business_catalog_items item
    where item.id = v_requested.catalog_item_id
      and item.business_id = p_business_id
      and item.is_available
      and (item.branch_id is null or item.branch_id = p_branch_id);

    if not found then
      raise exception 'A catalog item is unavailable for this branch';
    end if;

    v_line_gross := v_item.price_mzn_minor::bigint * v_requested.quantity::bigint;
    v_line_discount := case
      when p_customer_card_id is null then 0
      else floor(v_line_gross::numeric * v_item.loyalty_discount_percent / 100)::bigint
    end;
    v_line_net := v_line_gross - v_line_discount;
    v_gross := v_gross + v_line_gross;
    v_discount := v_discount + v_line_discount;

    if v_gross > 2147483647 or v_discount > 2147483647 then
      raise exception 'The POS cart total is too large';
    end if;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'catalogItemId', v_item.id::text,
      'sku', v_item.sku,
      'name', v_item.name,
      'description', v_item.description,
      'quantity', v_requested.quantity,
      'unitPriceMznMinor', v_item.price_mzn_minor,
      'grossAmountMznMinor', v_line_gross,
      'loyaltyDiscountPercent', v_item.loyalty_discount_percent,
      'discountAmountMznMinor', v_line_discount,
      'netAmountMznMinor', v_line_net
    ));
  end loop;

  if v_gross <= 0 then
    raise exception 'The POS cart total must be greater than zero';
  end if;

  if p_customer_card_id is not null then
    v_maximum_redeemable_points := public.calculate_max_redeemable_points(
      v_gross::integer,
      v_discount::integer,
      v_available_balance,
      v_point_value_mzn_minor,
      v_maximum_redemption_percent
    );
  end if;

  if v_points_to_redeem > v_maximum_redeemable_points then
    raise exception 'Requested YELAS exceed the maximum redeemable balance';
  end if;

  v_points_redeemed_value_mzn_minor := public.calculate_points_value_mzn_minor(
    v_points_to_redeem,
    v_point_value_mzn_minor
  );
  v_net_amount_mzn_minor :=
    v_gross::integer
    - v_discount::integer
    - v_points_redeemed_value_mzn_minor;

  if p_customer_card_id is not null
    and v_net_amount_mzn_minor >= v_minimum_earn_amount_mzn_minor
  then
    v_points_earned := public.calculate_loyalty_points(
      v_net_amount_mzn_minor,
      v_earn_rate
    );
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'grossAmountMznMinor', v_gross,
    'discountAmountMznMinor', v_discount,
    'availableBalance', v_available_balance,
    'maximumRedeemablePoints', v_maximum_redeemable_points,
    'pointsToRedeem', v_points_to_redeem,
    'pointsRedeemedValueMznMinor', v_points_redeemed_value_mzn_minor,
    'pointsEarned', v_points_earned,
    'netAmountMznMinor', v_net_amount_mzn_minor
  );
end;
$$;

create or replace function public.confirm_pos_cart(
  p_business_id uuid,
  p_branch_id uuid,
  p_terminal_id uuid,
  p_customer_card_id uuid,
  p_items jsonb,
  p_points_to_redeem integer,
  p_expected_gross_amount_mzn_minor integer,
  p_expected_discount_amount_mzn_minor integer,
  p_expected_net_amount_mzn_minor integer,
  p_payment_method public.transaction_payment_method,
  p_payment_reference text,
  p_idempotency_key text,
  p_customer_authorized boolean default false,
  p_metadata jsonb default '{}'::jsonb
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
  v_actor uuid := (select auth.uid());
  v_terminal public.pos_terminals%rowtype;
  v_channel public.business_payment_channels%rowtype;
  v_existing_attempt public.payment_attempts%rowtype;
  v_existing_transaction public.transactions%rowtype;
  v_cashier_member_id uuid;
  v_quote jsonb;
  v_attempt_id uuid;
  v_provider_reference text;
  v_loyalty record;
  v_transaction public.transactions%rowtype;
  v_balance integer := 0;
begin
  if v_actor is null
    or p_business_id is null
    or p_branch_id is null
    or p_terminal_id is null
  then
    raise exception 'Required POS checkout fields are missing';
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

  select existing.*
  into v_existing_transaction
  from public.transactions existing
  where existing.business_id = p_business_id
    and existing.external_reference = p_idempotency_key;

  if found then
    if v_existing_transaction.customer_card_id is not null then
      select wallet.available_balance
      into v_balance
      from public.point_wallets wallet
      where wallet.business_id = p_business_id
        and wallet.customer_card_id = v_existing_transaction.customer_card_id;
    end if;

    select attempt.id, attempt.status::text
    into v_attempt_id, payment_status
    from public.payment_attempts attempt
    where attempt.business_id = p_business_id
      and attempt.transaction_id = v_existing_transaction.id
    order by attempt.created_at desc
    limit 1;

    return query select
      v_existing_transaction.id,
      coalesce(v_balance, 0),
      v_attempt_id,
      coalesce(payment_status, 'not_required'::text),
      'VY-' || upper(substr(replace(v_existing_transaction.id::text, '-', ''), 1, 10));
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

  if not found then
    raise exception 'An active POS terminal is required';
  end if;

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

  if v_cashier_member_id is null then
    raise exception 'Active POS operator not found';
  end if;

  v_quote := public.quote_pos_cart(
    p_business_id,
    p_branch_id,
    p_terminal_id,
    p_customer_card_id,
    p_items,
    p_points_to_redeem
  );

  if (v_quote ->> 'grossAmountMznMinor')::integer
      <> p_expected_gross_amount_mzn_minor
    or (v_quote ->> 'discountAmountMznMinor')::integer
      <> p_expected_discount_amount_mzn_minor
    or (v_quote ->> 'netAmountMznMinor')::integer
      <> p_expected_net_amount_mzn_minor
  then
    raise exception 'The POS cart changed and must be reviewed again';
  end if;

  if (v_quote ->> 'pointsToRedeem')::integer > 0
    and not coalesce(p_customer_authorized, false)
  then
    raise exception 'Customer authorization is required to use YELAS';
  end if;

  if p_expected_net_amount_mzn_minor = 0 then
    if p_payment_method <> 'points' then
      raise exception 'A zero-balance purchase must use YELAS';
    end if;
  else
    if p_payment_method not in ('cash', 'card') then
      raise exception 'This payment provider is not configured for server confirmation';
    end if;

    select channel.*
    into v_channel
    from public.business_payment_channels channel
    where channel.business_id = p_business_id
      and channel.method = p_payment_method
      and channel.mode = 'manual'
      and channel.status = 'active'
      and (channel.branch_id = p_branch_id or channel.branch_id is null)
    order by case when channel.branch_id = p_branch_id then 0 else 1 end
    limit 1;

    if not found then
      raise exception 'Payment channel is not active for this branch';
    end if;

    if p_payment_method = 'card'
      and char_length(btrim(coalesce(p_payment_reference, ''))) not between 4 and 100
    then
      raise exception 'Card terminal reference is required';
    end if;

    select attempt.*
    into v_existing_attempt
    from public.payment_attempts attempt
    where attempt.business_id = p_business_id
      and attempt.idempotency_key = p_idempotency_key
    for update;

    if found then
      raise exception 'Payment attempt already exists and requires review';
    end if;

    v_provider_reference := case
      when p_payment_method = 'card' then upper(btrim(p_payment_reference))
      else 'CASH-' || upper(substr(encode(
        extensions.digest(convert_to(p_idempotency_key, 'utf8'), 'sha256'),
        'hex'
      ), 1, 16))
    end;

    insert into public.payment_attempts (
      business_id,
      branch_id,
      terminal_id,
      payment_channel_id,
      method,
      status,
      amount_mzn_minor,
      idempotency_key,
      provider_reference,
      requested_by,
      authorized_at,
      public_metadata
    ) values (
      p_business_id,
      p_branch_id,
      p_terminal_id,
      v_channel.id,
      p_payment_method,
      'authorized',
      p_expected_net_amount_mzn_minor,
      p_idempotency_key,
      v_provider_reference,
      v_actor,
      now(),
      jsonb_build_object('confirmation', 'manual', 'terminal_code', v_terminal.code)
    )
    returning id into v_attempt_id;
  end if;

  if p_customer_card_id is null then
    insert into public.transactions (
      business_id,
      branch_id,
      customer_card_id,
      cashier_member_id,
      external_reference,
      status,
      currency,
      gross_amount_mzn_minor,
      discount_amount_mzn_minor,
      points_redeemed,
      points_redeemed_value_mzn_minor,
      net_amount_mzn_minor,
      points_earned,
      completed_at,
      metadata
    ) values (
      p_business_id,
      p_branch_id,
      null,
      v_cashier_member_id,
      p_idempotency_key,
      'completed',
      'MZN',
      p_expected_gross_amount_mzn_minor,
      0,
      0,
      0,
      p_expected_net_amount_mzn_minor,
      0,
      now(),
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'source', 'pos',
        'terminal_id', p_terminal_id,
        'payment_method', p_payment_method,
        'loyalty_applied', false
      )
    )
    returning * into v_transaction;
  elsif coalesce(p_points_to_redeem, 0) > 0 then
    select *
    into v_loyalty
    from public.redeem_purchase_points(
      p_business_id,
      p_branch_id,
      p_customer_card_id,
      p_expected_gross_amount_mzn_minor,
      p_expected_discount_amount_mzn_minor,
      p_points_to_redeem,
      v_cashier_member_id,
      p_idempotency_key,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'source', 'pos',
        'terminal_id', p_terminal_id,
        'payment_method', p_payment_method,
        'loyalty_applied', true
      )
    );

    select tx.*
    into v_transaction
    from public.transactions tx
    where tx.id = v_loyalty.transaction_id;
    v_balance := v_loyalty.available_balance;
  else
    select *
    into v_loyalty
    from public.record_purchase_points(
      p_business_id,
      p_branch_id,
      p_customer_card_id,
      p_expected_gross_amount_mzn_minor,
      p_expected_discount_amount_mzn_minor,
      v_cashier_member_id,
      p_idempotency_key,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'source', 'pos',
        'terminal_id', p_terminal_id,
        'payment_method', p_payment_method,
        'loyalty_applied', true
      )
    );

    select tx.*
    into v_transaction
    from public.transactions tx
    where tx.id = v_loyalty.transaction_id;
    v_balance := v_loyalty.available_balance;
  end if;

  if v_transaction.id is null
    or v_transaction.net_amount_mzn_minor <> p_expected_net_amount_mzn_minor
  then
    raise exception 'Payment amount does not match the loyalty transaction';
  end if;

  insert into public.transaction_items (
    business_id,
    transaction_id,
    catalog_item_id,
    sku,
    name,
    description,
    quantity,
    unit_price_mzn_minor,
    gross_amount_mzn_minor,
    loyalty_discount_percent,
    discount_amount_mzn_minor,
    net_amount_mzn_minor,
    metadata
  )
  select
    p_business_id,
    v_transaction.id,
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
    jsonb_build_object('source', 'pos_quote')
  from jsonb_array_elements(v_quote -> 'lines') line(value);

  if v_attempt_id is not null then
    update public.payment_attempts
    set
      transaction_id = v_transaction.id,
      status = 'reconciled',
      reconciled_at = now()
    where id = v_attempt_id;

    insert into public.transaction_payments (
      transaction_id,
      business_id,
      payment_attempt_id,
      method,
      amount_mzn_minor,
      provider_reference,
      reconciled_at
    ) values (
      v_transaction.id,
      p_business_id,
      v_attempt_id,
      p_payment_method,
      v_transaction.net_amount_mzn_minor,
      v_provider_reference,
      now()
    );
  end if;

  update public.pos_terminals
  set last_seen_at = now()
  where id = p_terminal_id;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    after_data,
    context
  ) values (
    p_business_id,
    v_actor,
    'create',
    'transactions',
    v_transaction.id,
    jsonb_build_object(
      'payment_attempt_id', v_attempt_id,
      'method', p_payment_method,
      'amount_mzn_minor', v_transaction.net_amount_mzn_minor,
      'payment_status', case when v_attempt_id is null then 'not_required' else 'reconciled' end,
      'line_count', jsonb_array_length(v_quote -> 'lines')
    ),
    jsonb_build_object('source', 'pos_cart', 'terminal_id', p_terminal_id)
  );

  return query select
    v_transaction.id,
    coalesce(v_balance, 0),
    v_attempt_id,
    case when v_attempt_id is null then 'not_required'::text else 'reconciled'::text end,
    'VY-' || upper(substr(replace(v_transaction.id::text, '-', ''), 1, 10));
end;
$$;

revoke all on function public.manage_business_catalog_item_checkout(
  uuid,
  uuid,
  text,
  uuid,
  public.catalog_item_kind,
  text,
  text,
  text,
  integer,
  numeric,
  integer
) from public, anon;
grant execute on function public.manage_business_catalog_item_checkout(
  uuid,
  uuid,
  text,
  uuid,
  public.catalog_item_kind,
  text,
  text,
  text,
  integer,
  numeric,
  integer
) to authenticated;

revoke all on function public.quote_pos_cart(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  integer
) from public, anon;
grant execute on function public.quote_pos_cart(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  integer
) to authenticated;

revoke all on function public.confirm_pos_cart(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  integer,
  integer,
  integer,
  integer,
  public.transaction_payment_method,
  text,
  text,
  boolean,
  jsonb
) from public, anon;
grant execute on function public.confirm_pos_cart(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  integer,
  integer,
  integer,
  integer,
  public.transaction_payment_method,
  text,
  text,
  boolean,
  jsonb
) to authenticated;

comment on table public.transaction_items is
  'Immutable item snapshots for completed POS sales.';

comment on function public.quote_pos_cart(uuid, uuid, uuid, uuid, jsonb, integer) is
  'Builds a server-authoritative POS cart quote without mutating payment or loyalty records.';

comment on function public.confirm_pos_cart(
  uuid,
  uuid,
  uuid,
  uuid,
  jsonb,
  integer,
  integer,
  integer,
  integer,
  public.transaction_payment_method,
  text,
  text,
  boolean,
  jsonb
) is
  'Atomically re-prices a POS cart, records immutable lines, reconciles a manual payment and applies optional loyalty.';
