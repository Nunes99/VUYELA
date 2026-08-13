-- VUYELA loyalty engine RPC.
-- Sensitive balance-changing operations stay server-side and transactional.

create or replace function public.calculate_loyalty_points(
  eligible_amount_mzn_minor integer,
  earn_rate numeric
)
returns integer
language sql
immutable
set search_path = public
as $$
  select greatest(
    floor((greatest(eligible_amount_mzn_minor, 0)::numeric / 100) * greatest(earn_rate, 0))::integer,
    0
  );
$$;

create or replace function public.calculate_points_value_mzn_minor(
  points integer,
  point_value_mzn_minor integer
)
returns integer
language sql
immutable
set search_path = public
as $$
  select greatest(points, 0) * greatest(point_value_mzn_minor, 0);
$$;

create or replace function public.calculate_max_redeemable_points(
  gross_amount_mzn_minor integer,
  discount_amount_mzn_minor integer,
  available_balance integer,
  point_value_mzn_minor integer,
  maximum_redemption_percent numeric
)
returns integer
language sql
immutable
set search_path = public
as $$
  select least(
    greatest(available_balance, 0),
    floor(
      floor(
        greatest(gross_amount_mzn_minor - discount_amount_mzn_minor, 0)::numeric
        * least(greatest(maximum_redemption_percent, 0), 100)
        / 100
      )
      / greatest(point_value_mzn_minor, 1)
    )::integer
  );
$$;

create or replace function public.record_purchase_points(
  p_business_id uuid,
  p_branch_id uuid,
  p_customer_card_id uuid,
  p_gross_amount_mzn_minor integer,
  p_discount_amount_mzn_minor integer default 0,
  p_cashier_member_id uuid default null,
  p_external_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  transaction_id uuid,
  wallet_id uuid,
  points_earned integer,
  points_redeemed integer,
  points_redeemed_value_mzn_minor integer,
  available_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_wallet public.point_wallets%rowtype;
  v_transaction_id uuid;
  v_eligible_amount_mzn_minor integer;
  v_net_amount_mzn_minor integer;
  v_points_earned integer;
  v_available_balance integer;
  v_expires_at timestamptz;
begin
  if p_business_id is null
    or p_customer_card_id is null
    or p_gross_amount_mzn_minor is null
  then
    raise exception 'Missing required loyalty transaction fields';
  end if;

  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to record loyalty transactions for this business or branch';
  end if;

  if p_cashier_member_id is not null
    and not exists (
      select 1
      from public.business_members bm
      where bm.id = p_cashier_member_id
        and bm.business_id = p_business_id
        and bm.profile_id = auth.uid()
        and bm.status = 'active'
        and (
          bm.role = any(array['business_admin', 'business_owner']::public.business_member_role[])
          or (
            p_branch_id is not null
            and bm.branch_id = p_branch_id
            and bm.role = any(array['branch_manager', 'cashier']::public.business_member_role[])
          )
        )
    )
  then
    raise exception 'Invalid cashier member for this transaction';
  end if;

  if p_gross_amount_mzn_minor < 0
    or coalesce(p_discount_amount_mzn_minor, 0) < 0
    or coalesce(p_discount_amount_mzn_minor, 0) > p_gross_amount_mzn_minor
  then
    raise exception 'Invalid transaction amount';
  end if;

  select lp.*
  into v_program
  from public.loyalty_programs lp
  where lp.business_id = p_business_id
    and lp.status = 'active'
  for share;

  if not found then
    raise exception 'Active loyalty program not found';
  end if;

  if not exists (
    select 1
    from public.customer_cards cc
    where cc.id = p_customer_card_id
      and cc.business_id = p_business_id
      and cc.loyalty_program_id = v_program.id
      and cc.status = 'active'
  ) then
    raise exception 'Active customer card not found for this business';
  end if;

  select pw.*
  into v_wallet
  from public.point_wallets pw
  where pw.customer_card_id = p_customer_card_id
    and pw.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Point wallet not found';
  end if;

  v_eligible_amount_mzn_minor :=
    p_gross_amount_mzn_minor - coalesce(p_discount_amount_mzn_minor, 0);
  v_net_amount_mzn_minor := v_eligible_amount_mzn_minor;

  if v_eligible_amount_mzn_minor >= v_program.minimum_earn_amount_mzn_minor then
    v_points_earned := public.calculate_loyalty_points(
      v_eligible_amount_mzn_minor,
      v_program.earn_rate
    );
  else
    v_points_earned := 0;
  end if;

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
  )
  values (
    p_business_id,
    p_branch_id,
    p_customer_card_id,
    p_cashier_member_id,
    p_external_reference,
    'completed',
    'MZN',
    p_gross_amount_mzn_minor,
    coalesce(p_discount_amount_mzn_minor, 0),
    0,
    0,
    v_net_amount_mzn_minor,
    v_points_earned,
    now(),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_transaction_id;

  v_available_balance := v_wallet.available_balance;

  if v_points_earned > 0 then
    update public.point_wallets as pw
    set
      available_balance = pw.available_balance + v_points_earned,
      lifetime_earned = pw.lifetime_earned + v_points_earned,
      updated_at = now()
    where pw.id = v_wallet.id
    returning pw.available_balance into v_available_balance;

    v_expires_at := case
      when v_program.points_expire_after_days is null then null
      else now() + make_interval(days => v_program.points_expire_after_days)
    end;

    insert into public.point_ledger (
      business_id,
      wallet_id,
      customer_card_id,
      transaction_id,
      type,
      amount,
      reason,
      created_by,
      expires_at,
      metadata
    )
    values (
      p_business_id,
      v_wallet.id,
      p_customer_card_id,
      v_transaction_id,
      'earn',
      v_points_earned,
      'purchase_earn',
      auth.uid(),
      v_expires_at,
      jsonb_build_object('eligible_amount_mzn_minor', v_eligible_amount_mzn_minor)
    );
  end if;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    after_data,
    context
  )
  values (
    p_business_id,
    auth.uid(),
    'create',
    'transactions',
    v_transaction_id,
    jsonb_build_object(
      'points_earned', v_points_earned,
      'available_balance', v_available_balance
    ),
    jsonb_build_object('source', 'record_purchase_points')
  );

  return query select
    v_transaction_id,
    v_wallet.id,
    v_points_earned,
    0,
    0,
    v_available_balance;
end;
$$;

create or replace function public.redeem_purchase_points(
  p_business_id uuid,
  p_branch_id uuid,
  p_customer_card_id uuid,
  p_gross_amount_mzn_minor integer,
  p_discount_amount_mzn_minor integer default 0,
  p_points_to_redeem integer default 0,
  p_cashier_member_id uuid default null,
  p_external_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  transaction_id uuid,
  wallet_id uuid,
  points_earned integer,
  points_redeemed integer,
  points_redeemed_value_mzn_minor integer,
  available_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_wallet public.point_wallets%rowtype;
  v_transaction_id uuid;
  v_max_redeemable_points integer;
  v_points_redeemed_value_mzn_minor integer;
  v_eligible_amount_mzn_minor integer;
  v_net_amount_mzn_minor integer;
  v_points_earned integer;
  v_available_balance integer;
  v_expires_at timestamptz;
begin
  if p_business_id is null
    or p_customer_card_id is null
    or p_gross_amount_mzn_minor is null
  then
    raise exception 'Missing required loyalty redemption fields';
  end if;

  if not public.can_access_transaction(p_business_id, p_branch_id) then
    raise exception 'Not authorized to redeem loyalty points for this business or branch';
  end if;

  if p_cashier_member_id is not null
    and not exists (
      select 1
      from public.business_members bm
      where bm.id = p_cashier_member_id
        and bm.business_id = p_business_id
        and bm.profile_id = auth.uid()
        and bm.status = 'active'
        and (
          bm.role = any(array['business_admin', 'business_owner']::public.business_member_role[])
          or (
            p_branch_id is not null
            and bm.branch_id = p_branch_id
            and bm.role = any(array['branch_manager', 'cashier']::public.business_member_role[])
          )
        )
    )
  then
    raise exception 'Invalid cashier member for this redemption';
  end if;

  if p_gross_amount_mzn_minor < 0
    or coalesce(p_discount_amount_mzn_minor, 0) < 0
    or coalesce(p_discount_amount_mzn_minor, 0) > p_gross_amount_mzn_minor
    or coalesce(p_points_to_redeem, 0) <= 0
  then
    raise exception 'Invalid redemption request';
  end if;

  select lp.*
  into v_program
  from public.loyalty_programs lp
  where lp.business_id = p_business_id
    and lp.status = 'active'
  for share;

  if not found then
    raise exception 'Active loyalty program not found';
  end if;

  if not exists (
    select 1
    from public.customer_cards cc
    where cc.id = p_customer_card_id
      and cc.business_id = p_business_id
      and cc.loyalty_program_id = v_program.id
      and cc.status = 'active'
  ) then
    raise exception 'Active customer card not found for this business';
  end if;

  select pw.*
  into v_wallet
  from public.point_wallets pw
  where pw.customer_card_id = p_customer_card_id
    and pw.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Point wallet not found';
  end if;

  v_max_redeemable_points := public.calculate_max_redeemable_points(
    p_gross_amount_mzn_minor,
    coalesce(p_discount_amount_mzn_minor, 0),
    v_wallet.available_balance,
    v_program.point_value_mzn_minor,
    v_program.maximum_redemption_percent
  );

  if p_points_to_redeem > v_max_redeemable_points then
    raise exception 'Requested points exceed maximum redeemable points';
  end if;

  v_points_redeemed_value_mzn_minor := public.calculate_points_value_mzn_minor(
    p_points_to_redeem,
    v_program.point_value_mzn_minor
  );
  v_eligible_amount_mzn_minor :=
    p_gross_amount_mzn_minor
    - coalesce(p_discount_amount_mzn_minor, 0)
    - v_points_redeemed_value_mzn_minor;
  v_net_amount_mzn_minor := v_eligible_amount_mzn_minor;

  if v_eligible_amount_mzn_minor >= v_program.minimum_earn_amount_mzn_minor then
    v_points_earned := public.calculate_loyalty_points(
      v_eligible_amount_mzn_minor,
      v_program.earn_rate
    );
  else
    v_points_earned := 0;
  end if;

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
  )
  values (
    p_business_id,
    p_branch_id,
    p_customer_card_id,
    p_cashier_member_id,
    p_external_reference,
    'completed',
    'MZN',
    p_gross_amount_mzn_minor,
    coalesce(p_discount_amount_mzn_minor, 0),
    p_points_to_redeem,
    v_points_redeemed_value_mzn_minor,
    v_net_amount_mzn_minor,
    v_points_earned,
    now(),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_transaction_id;

  update public.point_wallets as pw
  set
    available_balance = pw.available_balance - p_points_to_redeem + v_points_earned,
    lifetime_earned = pw.lifetime_earned + v_points_earned,
    lifetime_redeemed = pw.lifetime_redeemed + p_points_to_redeem,
    updated_at = now()
  where pw.id = v_wallet.id
  returning pw.available_balance into v_available_balance;

  insert into public.point_ledger (
    business_id,
    wallet_id,
    customer_card_id,
    transaction_id,
    type,
    amount,
    reason,
    created_by,
    metadata
  )
  values (
    p_business_id,
    v_wallet.id,
    p_customer_card_id,
    v_transaction_id,
    'redeem',
    -p_points_to_redeem,
    'purchase_redemption',
    auth.uid(),
    jsonb_build_object(
      'points_redeemed_value_mzn_minor', v_points_redeemed_value_mzn_minor,
      'maximum_redeemable_points', v_max_redeemable_points
    )
  );

  if v_points_earned > 0 then
    v_expires_at := case
      when v_program.points_expire_after_days is null then null
      else now() + make_interval(days => v_program.points_expire_after_days)
    end;

    insert into public.point_ledger (
      business_id,
      wallet_id,
      customer_card_id,
      transaction_id,
      type,
      amount,
      reason,
      created_by,
      expires_at,
      metadata
    )
    values (
      p_business_id,
      v_wallet.id,
      p_customer_card_id,
      v_transaction_id,
      'earn',
      v_points_earned,
      'purchase_earn_after_redemption',
      auth.uid(),
      v_expires_at,
      jsonb_build_object('eligible_amount_mzn_minor', v_eligible_amount_mzn_minor)
    );
  end if;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    after_data,
    context
  )
  values (
    p_business_id,
    auth.uid(),
    'points_redemption',
    'transactions',
    v_transaction_id,
    jsonb_build_object(
      'points_redeemed', p_points_to_redeem,
      'points_earned', v_points_earned,
      'available_balance', v_available_balance
    ),
    jsonb_build_object('source', 'redeem_purchase_points')
  );

  return query select
    v_transaction_id,
    v_wallet.id,
    v_points_earned,
    p_points_to_redeem,
    v_points_redeemed_value_mzn_minor,
    v_available_balance;
end;
$$;

create or replace function public.refund_loyalty_transaction(
  p_transaction_id uuid,
  p_reason text default null
)
returns table (
  transaction_id uuid,
  wallet_id uuid,
  points_removed integer,
  points_returned integer,
  available_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.transactions%rowtype;
  v_wallet public.point_wallets%rowtype;
  v_wallet_id uuid;
  v_points_removed integer;
  v_points_returned integer;
  v_available_balance integer;
begin
  if p_transaction_id is null then
    raise exception 'Missing required transaction id';
  end if;

  select tx.*
  into v_transaction
  from public.transactions tx
  where tx.id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  if not public.can_access_transaction(v_transaction.business_id, v_transaction.branch_id) then
    raise exception 'Not authorized to refund this loyalty transaction';
  end if;

  if v_transaction.status <> 'completed' then
    raise exception 'Only completed loyalty transactions can be refunded';
  end if;

  v_points_removed := v_transaction.points_earned;
  v_points_returned := v_transaction.points_redeemed;
  v_wallet_id := null;
  v_available_balance := 0;

  if v_transaction.customer_card_id is not null then
    select pw.*
    into v_wallet
    from public.point_wallets pw
    where pw.customer_card_id = v_transaction.customer_card_id
      and pw.business_id = v_transaction.business_id
    for update;

    if not found then
      raise exception 'Point wallet not found';
    end if;

    v_wallet_id := v_wallet.id;

    if v_wallet.available_balance + v_points_returned < v_points_removed then
      raise exception 'Refund would make the wallet balance negative';
    end if;

    update public.point_wallets as pw
    set
      available_balance = pw.available_balance + v_points_returned - v_points_removed,
      updated_at = now()
    where pw.id = v_wallet.id
    returning pw.available_balance into v_available_balance;

    if v_points_removed > 0 then
      insert into public.point_ledger (
        business_id,
        wallet_id,
        customer_card_id,
        transaction_id,
        type,
        amount,
        reason,
        created_by,
        metadata
      )
      values (
        v_transaction.business_id,
        v_wallet.id,
        v_transaction.customer_card_id,
        v_transaction.id,
        'refund_reversal',
        -v_points_removed,
        coalesce(p_reason, 'refund_remove_earned_points'),
        auth.uid(),
        jsonb_build_object('source', 'refund_loyalty_transaction')
      );
    end if;

    if v_points_returned > 0 then
      insert into public.point_ledger (
        business_id,
        wallet_id,
        customer_card_id,
        transaction_id,
        type,
        amount,
        reason,
        created_by,
        metadata
      )
      values (
        v_transaction.business_id,
        v_wallet.id,
        v_transaction.customer_card_id,
        v_transaction.id,
        'refund_reversal',
        v_points_returned,
        coalesce(p_reason, 'refund_return_redeemed_points'),
        auth.uid(),
        jsonb_build_object('source', 'refund_loyalty_transaction')
      );
    end if;
  end if;

  update public.transactions as tx
  set
    status = 'refunded',
    metadata = tx.metadata || jsonb_build_object(
      'refund_reason', p_reason,
      'refunded_at', now()
    ),
    updated_at = now()
  where tx.id = v_transaction.id;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    context
  )
  values (
    v_transaction.business_id,
    auth.uid(),
    'refund',
    'transactions',
    v_transaction.id,
    jsonb_build_object(
      'status', v_transaction.status,
      'points_earned', v_transaction.points_earned,
      'points_redeemed', v_transaction.points_redeemed
    ),
    jsonb_build_object(
      'status', 'refunded',
      'points_removed', v_points_removed,
      'points_returned', v_points_returned,
      'available_balance', v_available_balance
    ),
    jsonb_build_object('source', 'refund_loyalty_transaction')
  );

  return query select
    v_transaction.id,
    v_wallet_id,
    v_points_removed,
    v_points_returned,
    v_available_balance;
end;
$$;

revoke all on function public.calculate_loyalty_points(integer, numeric) from public;
revoke all on function public.calculate_points_value_mzn_minor(integer, integer) from public;
revoke all on function public.calculate_max_redeemable_points(
  integer,
  integer,
  integer,
  integer,
  numeric
) from public;
revoke all on function public.record_purchase_points(
  uuid,
  uuid,
  uuid,
  integer,
  integer,
  uuid,
  text,
  jsonb
) from public;
revoke all on function public.redeem_purchase_points(
  uuid,
  uuid,
  uuid,
  integer,
  integer,
  integer,
  uuid,
  text,
  jsonb
) from public;
revoke all on function public.refund_loyalty_transaction(uuid, text) from public;

grant execute on function public.calculate_loyalty_points(integer, numeric) to authenticated;
grant execute on function public.calculate_points_value_mzn_minor(integer, integer) to authenticated;
grant execute on function public.calculate_max_redeemable_points(
  integer,
  integer,
  integer,
  integer,
  numeric
) to authenticated;
grant execute on function public.record_purchase_points(
  uuid,
  uuid,
  uuid,
  integer,
  integer,
  uuid,
  text,
  jsonb
) to authenticated;
grant execute on function public.redeem_purchase_points(
  uuid,
  uuid,
  uuid,
  integer,
  integer,
  integer,
  uuid,
  text,
  jsonb
) to authenticated;
grant execute on function public.refund_loyalty_transaction(uuid, text) to authenticated;
