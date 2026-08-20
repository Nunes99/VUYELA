-- VUYELA referral programs.
-- Invitations never award points. Rewards are issued atomically only after a
-- qualifying purchase and are reversed with the qualifying transaction.

create table public.referral_programs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  is_active boolean not null default false,
  qualifying_purchase_minimum_mzn_minor integer not null default 50000,
  referrer_reward_points integer not null default 500,
  referred_reward_points integer not null default 250,
  invite_valid_days integer not null default 14,
  max_open_invites_per_referrer integer not null default 5,
  reward_limit_count integer not null default 10,
  reward_limit_period_days integer not null default 30,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_programs_business_unique unique (business_id),
  constraint referral_programs_minimum_purchase_non_negative check (
    qualifying_purchase_minimum_mzn_minor >= 0
  ),
  constraint referral_programs_referrer_reward_positive check (
    referrer_reward_points > 0 and referrer_reward_points <= 1000000
  ),
  constraint referral_programs_referred_reward_range check (
    referred_reward_points >= 0 and referred_reward_points <= 1000000
  ),
  constraint referral_programs_invite_valid_days_range check (
    invite_valid_days between 1 and 90
  ),
  constraint referral_programs_open_invites_range check (
    max_open_invites_per_referrer between 1 and 100
  ),
  constraint referral_programs_reward_limit_range check (
    reward_limit_count between 1 and 1000
  ),
  constraint referral_programs_reward_period_range check (
    reward_limit_period_days between 1 and 365
  )
);

create index referral_programs_active_business_idx
on public.referral_programs(business_id)
where is_active;

create trigger referral_programs_set_updated_at
before update on public.referral_programs
for each row execute function public.set_updated_at();

alter table public.referrals
  add column referral_code text,
  add column status text not null default 'pending',
  add column accepted_at timestamptz,
  add column expires_at timestamptz,
  add column rewarded_at timestamptz,
  add column reversed_at timestamptz,
  add column referred_reward_points integer not null default 0,
  add column qualifying_transaction_id uuid,
  add column blocked_reason text,
  add column updated_at timestamptz not null default now();

update public.referrals
set
  referral_code = 'VY-' || upper(substr(replace(id::text, '-', ''), 1, 8)),
  status = case
    when completed_at is not null then 'blocked'
    when referred_card_id is not null then 'accepted'
    else 'pending'
  end,
  accepted_at = case when referred_card_id is not null then created_at else null end,
  expires_at = created_at + interval '14 days',
  rewarded_at = completed_at,
  blocked_reason = case
    when completed_at is not null then 'legacy_referral_requires_review'
    else null
  end,
  updated_at = now();

alter table public.referrals
  alter column referral_code set not null,
  alter column expires_at set not null,
  add constraint referrals_code_format check (referral_code ~ '^VY-[A-Z0-9]{8}$'),
  add constraint referrals_status_valid check (
    status in ('pending', 'accepted', 'rewarded', 'reversed', 'expired', 'blocked', 'cancelled')
  ),
  add constraint referrals_referred_reward_points_non_negative check (
    referred_reward_points >= 0
  ),
  add constraint referrals_distinct_cards check (
    referred_card_id is null or referrer_card_id <> referred_card_id
  ),
  add constraint referrals_expiry_after_creation check (expires_at > created_at),
  add constraint referrals_acceptance_fields check (
    status not in ('accepted', 'rewarded', 'reversed')
    or (
      referred_profile_id is not null
      and referred_card_id is not null
      and accepted_at is not null
    )
  ),
  add constraint referrals_reward_fields check (
    status not in ('rewarded', 'reversed')
    or (
      qualifying_transaction_id is not null
      and rewarded_at is not null
      and reward_points > 0
    )
  ),
  add constraint referrals_qualifying_transaction_business_fk
    foreign key (qualifying_transaction_id, business_id)
    references public.transactions(id, business_id)
    on delete restrict;

create unique index if not exists referrals_code_unique_idx
on public.referrals(referral_code);

create unique index if not exists referrals_active_referred_card_unique_idx
on public.referrals(business_id, referred_card_id)
where referred_card_id is not null
  and status in ('accepted', 'rewarded', 'reversed');

create unique index if not exists referrals_qualifying_transaction_unique_idx
on public.referrals(qualifying_transaction_id)
where qualifying_transaction_id is not null;

create index if not exists referrals_referred_profile_id_idx
on public.referrals(referred_profile_id);

create index if not exists referrals_referred_card_id_idx
on public.referrals(referred_card_id);

create index if not exists referrals_business_status_created_idx
on public.referrals(business_id, status, created_at desc);

create index if not exists referrals_referrer_reward_limit_idx
on public.referrals(referrer_card_id, status, rewarded_at desc);

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

alter table public.referral_programs enable row level security;

grant select on public.referral_programs to authenticated;

create policy referral_programs_select_customer_or_manager
on public.referral_programs
for select
to authenticated
using (
  public.can_manage_business(business_id)
  or (
    is_active
    and exists (
      select 1
      from public.customer_cards cc
      where cc.business_id = referral_programs.business_id
        and cc.customer_profile_id = auth.uid()
        and cc.status = 'active'
    )
  )
);

drop policy if exists referrals_select_customer_or_manager on public.referrals;

create policy referrals_select_customer_or_manager
on public.referrals
for select
to authenticated
using (
  referred_profile_id = auth.uid()
  or public.owns_customer_card(referrer_card_id)
  or public.owns_customer_card(referred_card_id)
  or public.can_manage_customers(business_id)
);

create or replace function public.configure_referral_program(
  p_business_id uuid,
  p_is_active boolean,
  p_qualifying_purchase_minimum_mzn_minor integer,
  p_referrer_reward_points integer,
  p_referred_reward_points integer,
  p_invite_valid_days integer,
  p_max_open_invites_per_referrer integer,
  p_reward_limit_count integer,
  p_reward_limit_period_days integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
  v_before jsonb;
begin
  if p_business_id is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to configure referrals for this business';
  end if;

  if p_qualifying_purchase_minimum_mzn_minor is null
    or p_qualifying_purchase_minimum_mzn_minor < 0
    or p_referrer_reward_points is null
    or p_referrer_reward_points <= 0
    or p_referrer_reward_points > 1000000
    or p_referred_reward_points is null
    or p_referred_reward_points < 0
    or p_referred_reward_points > 1000000
    or p_invite_valid_days is null
    or p_invite_valid_days not between 1 and 90
    or p_max_open_invites_per_referrer is null
    or p_max_open_invites_per_referrer not between 1 and 100
    or p_reward_limit_count is null
    or p_reward_limit_count not between 1 and 1000
    or p_reward_limit_period_days is null
    or p_reward_limit_period_days not between 1 and 365
  then
    raise exception 'Invalid referral program configuration';
  end if;

  if coalesce(p_is_active, false)
    and not exists (
      select 1
      from public.businesses b
      join public.loyalty_programs lp on lp.business_id = b.id
      where b.id = p_business_id
        and b.status = 'active'
        and lp.status = 'active'
    )
  then
    raise exception 'An active business and loyalty program are required';
  end if;

  select to_jsonb(rp.*)
  into v_before
  from public.referral_programs rp
  where rp.business_id = p_business_id;

  insert into public.referral_programs (
    business_id,
    is_active,
    qualifying_purchase_minimum_mzn_minor,
    referrer_reward_points,
    referred_reward_points,
    invite_valid_days,
    max_open_invites_per_referrer,
    reward_limit_count,
    reward_limit_period_days,
    created_by,
    updated_by
  )
  values (
    p_business_id,
    coalesce(p_is_active, false),
    p_qualifying_purchase_minimum_mzn_minor,
    p_referrer_reward_points,
    p_referred_reward_points,
    p_invite_valid_days,
    p_max_open_invites_per_referrer,
    p_reward_limit_count,
    p_reward_limit_period_days,
    auth.uid(),
    auth.uid()
  )
  on conflict (business_id) do update
  set
    is_active = excluded.is_active,
    qualifying_purchase_minimum_mzn_minor = excluded.qualifying_purchase_minimum_mzn_minor,
    referrer_reward_points = excluded.referrer_reward_points,
    referred_reward_points = excluded.referred_reward_points,
    invite_valid_days = excluded.invite_valid_days,
    max_open_invites_per_referrer = excluded.max_open_invites_per_referrer,
    reward_limit_count = excluded.reward_limit_count,
    reward_limit_period_days = excluded.reward_limit_period_days,
    updated_by = auth.uid(),
    updated_at = now()
  returning id into v_program_id;

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
  select
    p_business_id,
    auth.uid(),
    'rule_change',
    'referral_programs',
    rp.id,
    v_before,
    to_jsonb(rp.*),
    jsonb_build_object('source', 'configure_referral_program')
  from public.referral_programs rp
  where rp.id = v_program_id;

  return v_program_id;
end;
$$;

create or replace function public.create_customer_referral(
  p_referrer_card_id uuid
)
returns table (
  referral_id uuid,
  referral_code text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.customer_cards%rowtype;
  v_program public.referral_programs%rowtype;
  v_referral_id uuid;
  v_referral_code text;
  v_expires_at timestamptz;
  v_open_invites integer;
begin
  if auth.uid() is null or p_referrer_card_id is null then
    raise exception 'Authentication and a referrer card are required';
  end if;

  select cc.*
  into v_card
  from public.customer_cards cc
  where cc.id = p_referrer_card_id
    and cc.customer_profile_id = auth.uid()
    and cc.status = 'active'
  for share;

  if not found then
    raise exception 'Active customer card not found';
  end if;

  select rp.*
  into v_program
  from public.referral_programs rp
  join public.businesses b on b.id = rp.business_id
  join public.loyalty_programs lp on lp.business_id = rp.business_id
  where rp.business_id = v_card.business_id
    and rp.is_active
    and b.status = 'active'
    and lp.status = 'active'
  for share of rp;

  if not found then
    raise exception 'Active referral program not found';
  end if;

  update public.referrals r
  set status = 'expired', updated_at = now()
  where r.referrer_card_id = v_card.id
    and r.status = 'pending'
    and r.expires_at <= now();

  perform 1
  from public.customer_cards cc
  where cc.id = v_card.id
  for update;

  select count(*)::integer
  into v_open_invites
  from public.referrals r
  where r.referrer_card_id = v_card.id
    and r.status = 'pending'
    and r.expires_at > now();

  if v_open_invites >= v_program.max_open_invites_per_referrer then
    raise exception 'Open referral invitation limit reached';
  end if;

  loop
    v_referral_code := 'VY-' || upper(encode(gen_random_bytes(4), 'hex'));
    exit when not exists (
      select 1 from public.referrals r where r.referral_code = v_referral_code
    );
  end loop;

  v_expires_at := now() + make_interval(days => v_program.invite_valid_days);

  insert into public.referrals (
    business_id,
    referrer_card_id,
    referral_code,
    status,
    expires_at
  )
  values (
    v_card.business_id,
    v_card.id,
    v_referral_code,
    'pending',
    v_expires_at
  )
  returning id into v_referral_id;

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
    v_card.business_id,
    auth.uid(),
    'create',
    'referrals',
    v_referral_id,
    jsonb_build_object(
      'status', 'pending',
      'expires_at', v_expires_at
    ),
    jsonb_build_object('source', 'create_customer_referral')
  );

  return query select v_referral_id, v_referral_code, v_expires_at;
end;
$$;

create or replace function public.accept_customer_referral(
  p_referral_code text
)
returns table (
  referral_id uuid,
  outcome text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referral public.referrals%rowtype;
  v_referred_card public.customer_cards%rowtype;
  v_referrer_profile_id uuid;
  v_code text;
begin
  if auth.uid() is null or nullif(trim(p_referral_code), '') is null then
    raise exception 'Authentication and a referral code are required';
  end if;

  v_code := upper(trim(p_referral_code));

  select r.*
  into v_referral
  from public.referrals r
  where r.referral_code = v_code
  for update;

  if not found then
    raise exception 'Referral invitation not found';
  end if;

  if v_referral.status <> 'pending' then
    return query select v_referral.id, v_referral.status;
    return;
  end if;

  if v_referral.expires_at <= now() then
    update public.referrals
    set status = 'expired', updated_at = now()
    where id = v_referral.id;

    return query select v_referral.id, 'expired'::text;
    return;
  end if;

  if not exists (
    select 1
    from public.referral_programs rp
    join public.businesses b on b.id = rp.business_id
    join public.loyalty_programs lp on lp.business_id = rp.business_id
    where rp.business_id = v_referral.business_id
      and rp.is_active
      and b.status = 'active'
      and lp.status = 'active'
  ) then
    return query select v_referral.id, 'program_inactive'::text;
    return;
  end if;

  select cc.*
  into v_referred_card
  from public.customer_cards cc
  where cc.business_id = v_referral.business_id
    and cc.customer_profile_id = auth.uid()
    and cc.status = 'active'
  for update;

  if not found then
    return query select v_referral.id, 'card_required'::text;
    return;
  end if;

  select cc.customer_profile_id
  into v_referrer_profile_id
  from public.customer_cards cc
  where cc.id = v_referral.referrer_card_id;

  if v_referral.referrer_card_id = v_referred_card.id
    or v_referrer_profile_id = auth.uid()
  then
    update public.referrals
    set status = 'blocked', blocked_reason = 'self_referral', updated_at = now()
    where id = v_referral.id;

    insert into public.fraud_events (
      business_id,
      profile_id,
      customer_card_id,
      event_type,
      severity,
      details
    )
    values (
      v_referral.business_id,
      auth.uid(),
      v_referred_card.id,
      'referral_self_attempt',
      'high',
      jsonb_build_object('referral_id', v_referral.id)
    );

    return query select v_referral.id, 'blocked'::text;
    return;
  end if;

  if exists (
    select 1
    from public.referrals r
    where r.business_id = v_referral.business_id
      and r.referred_card_id = v_referred_card.id
      and r.status in ('accepted', 'rewarded', 'reversed')
  ) then
    return query select v_referral.id, 'already_referred'::text;
    return;
  end if;

  if exists (
    select 1
    from public.transactions tx
    where tx.business_id = v_referral.business_id
      and tx.customer_card_id = v_referred_card.id
      and tx.status in ('completed', 'refunded')
  ) then
    update public.referrals
    set status = 'blocked', blocked_reason = 'existing_customer', updated_at = now()
    where id = v_referral.id;

    insert into public.fraud_events (
      business_id,
      profile_id,
      customer_card_id,
      event_type,
      severity,
      details
    )
    values (
      v_referral.business_id,
      auth.uid(),
      v_referred_card.id,
      'referral_existing_customer_attempt',
      'medium',
      jsonb_build_object('referral_id', v_referral.id)
    );

    return query select v_referral.id, 'blocked'::text;
    return;
  end if;

  if exists (
    select 1
    from public.referrals r
    where r.business_id = v_referral.business_id
      and r.referrer_card_id = v_referred_card.id
      and r.referred_card_id = v_referral.referrer_card_id
      and r.status in ('accepted', 'rewarded', 'reversed')
  ) then
    update public.referrals
    set status = 'blocked', blocked_reason = 'reciprocal_referral', updated_at = now()
    where id = v_referral.id;

    insert into public.fraud_events (
      business_id,
      profile_id,
      customer_card_id,
      event_type,
      severity,
      details
    )
    values (
      v_referral.business_id,
      auth.uid(),
      v_referred_card.id,
      'referral_reciprocal_attempt',
      'high',
      jsonb_build_object('referral_id', v_referral.id)
    );

    return query select v_referral.id, 'blocked'::text;
    return;
  end if;

  update public.referrals
  set
    referred_profile_id = auth.uid(),
    referred_card_id = v_referred_card.id,
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  where id = v_referral.id;

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
    v_referral.business_id,
    auth.uid(),
    'update',
    'referrals',
    v_referral.id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'accepted', 'referred_card_id', v_referred_card.id),
    jsonb_build_object('source', 'accept_customer_referral')
  );

  return query select v_referral.id, 'accepted'::text;
end;
$$;

create or replace function public.apply_qualifying_referral_reward(
  p_transaction_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transaction public.transactions%rowtype;
  v_referral public.referrals%rowtype;
  v_program public.referral_programs%rowtype;
  v_loyalty_program public.loyalty_programs%rowtype;
  v_referrer_wallet public.point_wallets%rowtype;
  v_referred_wallet public.point_wallets%rowtype;
  v_reward_count integer;
  v_expires_at timestamptz;
begin
  select tx.*
  into v_transaction
  from public.transactions tx
  where tx.id = p_transaction_id
    and tx.status = 'completed';

  if not found or v_transaction.customer_card_id is null then
    return;
  end if;

  select r.*
  into v_referral
  from public.referrals r
  where r.business_id = v_transaction.business_id
    and r.referred_card_id = v_transaction.customer_card_id
    and r.status = 'accepted'
  order by r.accepted_at asc
  limit 1
  for update;

  if not found then
    return;
  end if;

  select rp.*
  into v_program
  from public.referral_programs rp
  where rp.business_id = v_transaction.business_id
    and rp.is_active
  for share;

  if not found
    or v_referral.accepted_at is null
    or v_transaction.completed_at is null
    or v_transaction.completed_at < v_referral.accepted_at
    or v_transaction.completed_at > v_referral.expires_at
    or v_transaction.net_amount_mzn_minor < v_program.qualifying_purchase_minimum_mzn_minor
  then
    return;
  end if;

  if exists (
    select 1
    from public.transactions tx
    where tx.business_id = v_transaction.business_id
      and tx.customer_card_id = v_transaction.customer_card_id
      and tx.status = 'completed'
      and tx.id <> v_transaction.id
      and tx.completed_at >= v_referral.accepted_at
      and tx.completed_at < v_transaction.completed_at
      and tx.net_amount_mzn_minor >= v_program.qualifying_purchase_minimum_mzn_minor
  ) then
    update public.referrals
    set status = 'blocked', blocked_reason = 'missed_first_qualifying_purchase', updated_at = now()
    where id = v_referral.id;
    return;
  end if;

  perform 1
  from public.customer_cards cc
  where cc.id = v_referral.referrer_card_id
    and cc.business_id = v_transaction.business_id
    and cc.status = 'active'
  for update;

  if not found then
    update public.referrals
    set status = 'blocked', blocked_reason = 'inactive_referrer_card', updated_at = now()
    where id = v_referral.id;
    return;
  end if;

  if exists (
    select 1
    from public.referrals r
    where r.business_id = v_transaction.business_id
      and r.referrer_card_id = v_transaction.customer_card_id
      and r.referred_card_id = v_referral.referrer_card_id
      and r.status in ('accepted', 'rewarded', 'reversed')
  ) then
    update public.referrals
    set status = 'blocked', blocked_reason = 'reciprocal_referral', updated_at = now()
    where id = v_referral.id;

    insert into public.fraud_events (
      business_id,
      profile_id,
      customer_card_id,
      transaction_id,
      event_type,
      severity,
      details
    )
    values (
      v_transaction.business_id,
      v_referral.referred_profile_id,
      v_transaction.customer_card_id,
      v_transaction.id,
      'referral_reciprocal_reward_blocked',
      'high',
      jsonb_build_object('referral_id', v_referral.id)
    );
    return;
  end if;

  select count(*)::integer
  into v_reward_count
  from public.referrals r
  where r.referrer_card_id = v_referral.referrer_card_id
    and r.status in ('rewarded', 'reversed')
    and r.rewarded_at >= now() - make_interval(days => v_program.reward_limit_period_days);

  if v_reward_count >= v_program.reward_limit_count then
    update public.referrals
    set status = 'blocked', blocked_reason = 'reward_limit_reached', updated_at = now()
    where id = v_referral.id;

    insert into public.fraud_events (
      business_id,
      profile_id,
      customer_card_id,
      transaction_id,
      event_type,
      severity,
      details
    )
    select
      v_transaction.business_id,
      cc.customer_profile_id,
      v_referral.referrer_card_id,
      v_transaction.id,
      'referral_reward_limit_reached',
      'medium',
      jsonb_build_object(
        'referral_id', v_referral.id,
        'limit_count', v_program.reward_limit_count,
        'period_days', v_program.reward_limit_period_days
      )
    from public.customer_cards cc
    where cc.id = v_referral.referrer_card_id;
    return;
  end if;

  select lp.*
  into v_loyalty_program
  from public.loyalty_programs lp
  where lp.business_id = v_transaction.business_id
    and lp.status = 'active'
  for share;

  if not found then
    return;
  end if;

  select pw.*
  into v_referrer_wallet
  from public.point_wallets pw
  where pw.business_id = v_transaction.business_id
    and pw.customer_card_id = v_referral.referrer_card_id
  for update;

  if not found then
    raise exception 'Referrer point wallet not found';
  end if;

  select pw.*
  into v_referred_wallet
  from public.point_wallets pw
  where pw.business_id = v_transaction.business_id
    and pw.customer_card_id = v_transaction.customer_card_id
  for update;

  if not found then
    raise exception 'Referred point wallet not found';
  end if;

  update public.point_wallets pw
  set
    available_balance = pw.available_balance + v_program.referrer_reward_points,
    lifetime_earned = pw.lifetime_earned + v_program.referrer_reward_points,
    updated_at = now()
  where pw.id = v_referrer_wallet.id;

  if v_program.referred_reward_points > 0 then
    update public.point_wallets pw
    set
      available_balance = pw.available_balance + v_program.referred_reward_points,
      lifetime_earned = pw.lifetime_earned + v_program.referred_reward_points,
      updated_at = now()
    where pw.id = v_referred_wallet.id;
  end if;

  v_expires_at := case
    when v_loyalty_program.points_expire_after_days is null then null
    else now() + make_interval(days => v_loyalty_program.points_expire_after_days)
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
    v_transaction.business_id,
    v_referrer_wallet.id,
    v_referral.referrer_card_id,
    v_transaction.id,
    'referral',
    v_program.referrer_reward_points,
    'referral_referrer_reward',
    auth.uid(),
    v_expires_at,
    jsonb_build_object(
      'source', 'apply_qualifying_referral_reward',
      'referral_id', v_referral.id,
      'reward_role', 'referrer'
    )
  );

  if v_program.referred_reward_points > 0 then
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
      v_transaction.business_id,
      v_referred_wallet.id,
      v_transaction.customer_card_id,
      v_transaction.id,
      'referral',
      v_program.referred_reward_points,
      'referral_referred_reward',
      auth.uid(),
      v_expires_at,
      jsonb_build_object(
        'source', 'apply_qualifying_referral_reward',
        'referral_id', v_referral.id,
        'reward_role', 'referred'
      )
    );
  end if;

  update public.referrals
  set
    status = 'rewarded',
    reward_points = v_program.referrer_reward_points,
    referred_reward_points = v_program.referred_reward_points,
    qualifying_transaction_id = v_transaction.id,
    rewarded_at = now(),
    completed_at = now(),
    updated_at = now()
  where id = v_referral.id;

  update public.transactions tx
  set metadata = tx.metadata || jsonb_build_object(
    'referral_id', v_referral.id,
    'referrer_reward_points', v_program.referrer_reward_points,
    'referred_reward_points', v_program.referred_reward_points
  )
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
    'points_adjustment',
    'referrals',
    v_referral.id,
    jsonb_build_object('status', 'accepted'),
    jsonb_build_object(
      'status', 'rewarded',
      'qualifying_transaction_id', v_transaction.id,
      'referrer_reward_points', v_program.referrer_reward_points,
      'referred_reward_points', v_program.referred_reward_points
    ),
    jsonb_build_object('source', 'apply_qualifying_referral_reward')
  );
end;
$$;

create or replace function public.reverse_qualifying_referral_reward(
  p_transaction_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_referral public.referrals%rowtype;
  v_referrer_wallet public.point_wallets%rowtype;
  v_referred_wallet public.point_wallets%rowtype;
begin
  select r.*
  into v_referral
  from public.referrals r
  where r.qualifying_transaction_id = p_transaction_id
    and r.status = 'rewarded'
  for update;

  if not found then
    return;
  end if;

  select pw.*
  into v_referrer_wallet
  from public.point_wallets pw
  where pw.business_id = v_referral.business_id
    and pw.customer_card_id = v_referral.referrer_card_id
  for update;

  if not found or v_referrer_wallet.available_balance < v_referral.reward_points then
    raise exception 'Referral refund would make the referrer wallet balance negative';
  end if;

  select pw.*
  into v_referred_wallet
  from public.point_wallets pw
  where pw.business_id = v_referral.business_id
    and pw.customer_card_id = v_referral.referred_card_id
  for update;

  if not found
    or v_referred_wallet.available_balance < v_referral.referred_reward_points
  then
    raise exception 'Referral refund would make the referred wallet balance negative';
  end if;

  update public.point_wallets pw
  set available_balance = pw.available_balance - v_referral.reward_points, updated_at = now()
  where pw.id = v_referrer_wallet.id;

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
    v_referral.business_id,
    v_referrer_wallet.id,
    v_referral.referrer_card_id,
    p_transaction_id,
    'refund_reversal',
    -v_referral.reward_points,
    coalesce(p_reason, 'refund_remove_referrer_reward'),
    auth.uid(),
    jsonb_build_object(
      'source', 'reverse_qualifying_referral_reward',
      'referral_id', v_referral.id,
      'reward_role', 'referrer'
    )
  );

  if v_referral.referred_reward_points > 0 then
    update public.point_wallets pw
    set
      available_balance = pw.available_balance - v_referral.referred_reward_points,
      updated_at = now()
    where pw.id = v_referred_wallet.id;

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
      v_referral.business_id,
      v_referred_wallet.id,
      v_referral.referred_card_id,
      p_transaction_id,
      'refund_reversal',
      -v_referral.referred_reward_points,
      coalesce(p_reason, 'refund_remove_referred_reward'),
      auth.uid(),
      jsonb_build_object(
        'source', 'reverse_qualifying_referral_reward',
        'referral_id', v_referral.id,
        'reward_role', 'referred'
      )
    );
  end if;

  update public.referrals
  set status = 'reversed', reversed_at = now(), updated_at = now()
  where id = v_referral.id;

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
    v_referral.business_id,
    auth.uid(),
    'refund',
    'referrals',
    v_referral.id,
    jsonb_build_object('status', 'rewarded'),
    jsonb_build_object('status', 'reversed', 'transaction_id', p_transaction_id),
    jsonb_build_object('source', 'reverse_qualifying_referral_reward')
  );
end;
$$;

alter function public.record_purchase_points(
  uuid, uuid, uuid, integer, integer, uuid, text, jsonb
) rename to record_purchase_points_without_referrals;

alter function public.redeem_purchase_points(
  uuid, uuid, uuid, integer, integer, integer, uuid, text, jsonb
) rename to redeem_purchase_points_without_referrals;

alter function public.refund_loyalty_transaction(uuid, text)
rename to refund_loyalty_transaction_without_referrals;

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
  v_result record;
  v_available_balance integer;
begin
  select * into v_result
  from public.record_purchase_points_without_referrals(
    p_business_id,
    p_branch_id,
    p_customer_card_id,
    p_gross_amount_mzn_minor,
    p_discount_amount_mzn_minor,
    p_cashier_member_id,
    p_external_reference,
    p_metadata
  );

  perform public.apply_qualifying_referral_reward(v_result.transaction_id);

  select pw.available_balance
  into v_available_balance
  from public.point_wallets pw
  where pw.id = v_result.wallet_id;

  return query select
    v_result.transaction_id::uuid,
    v_result.wallet_id::uuid,
    v_result.points_earned::integer,
    v_result.points_redeemed::integer,
    v_result.points_redeemed_value_mzn_minor::integer,
    v_available_balance;
end;
$$;

create or replace function public.redeem_purchase_points(
  p_business_id uuid,
  p_branch_id uuid,
  p_customer_card_id uuid,
  p_gross_amount_mzn_minor integer,
  p_discount_amount_mzn_minor integer,
  p_points_to_redeem integer,
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
  v_result record;
  v_available_balance integer;
begin
  select * into v_result
  from public.redeem_purchase_points_without_referrals(
    p_business_id,
    p_branch_id,
    p_customer_card_id,
    p_gross_amount_mzn_minor,
    p_discount_amount_mzn_minor,
    p_points_to_redeem,
    p_cashier_member_id,
    p_external_reference,
    p_metadata
  );

  perform public.apply_qualifying_referral_reward(v_result.transaction_id);

  select pw.available_balance
  into v_available_balance
  from public.point_wallets pw
  where pw.id = v_result.wallet_id;

  return query select
    v_result.transaction_id::uuid,
    v_result.wallet_id::uuid,
    v_result.points_earned::integer,
    v_result.points_redeemed::integer,
    v_result.points_redeemed_value_mzn_minor::integer,
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
  v_result record;
  v_available_balance integer;
begin
  select * into v_result
  from public.refund_loyalty_transaction_without_referrals(p_transaction_id, p_reason);

  perform public.reverse_qualifying_referral_reward(p_transaction_id, p_reason);

  if v_result.wallet_id is not null then
    select pw.available_balance
    into v_available_balance
    from public.point_wallets pw
    where pw.id = v_result.wallet_id;
  else
    v_available_balance := v_result.available_balance;
  end if;

  return query select
    v_result.transaction_id::uuid,
    v_result.wallet_id::uuid,
    v_result.points_removed::integer,
    v_result.points_returned::integer,
    v_available_balance;
end;
$$;

revoke all on function public.configure_referral_program(
  uuid, boolean, integer, integer, integer, integer, integer, integer, integer
) from public, anon;
revoke all on function public.create_customer_referral(uuid) from public, anon;
revoke all on function public.accept_customer_referral(text) from public, anon;
revoke all on function public.apply_qualifying_referral_reward(uuid)
from public, anon, authenticated;
revoke all on function public.reverse_qualifying_referral_reward(uuid, text)
from public, anon, authenticated;

revoke all on function public.record_purchase_points_without_referrals(
  uuid, uuid, uuid, integer, integer, uuid, text, jsonb
) from public, anon, authenticated;
revoke all on function public.redeem_purchase_points_without_referrals(
  uuid, uuid, uuid, integer, integer, integer, uuid, text, jsonb
) from public, anon, authenticated;
revoke all on function public.refund_loyalty_transaction_without_referrals(uuid, text)
from public, anon, authenticated;

revoke all on function public.record_purchase_points(
  uuid, uuid, uuid, integer, integer, uuid, text, jsonb
) from public, anon;
revoke all on function public.redeem_purchase_points(
  uuid, uuid, uuid, integer, integer, integer, uuid, text, jsonb
) from public, anon;
revoke all on function public.refund_loyalty_transaction(uuid, text) from public, anon;

grant execute on function public.configure_referral_program(
  uuid, boolean, integer, integer, integer, integer, integer, integer, integer
) to authenticated;
grant execute on function public.create_customer_referral(uuid) to authenticated;
grant execute on function public.accept_customer_referral(text) to authenticated;
grant execute on function public.record_purchase_points(
  uuid, uuid, uuid, integer, integer, uuid, text, jsonb
) to authenticated;
grant execute on function public.redeem_purchase_points(
  uuid, uuid, uuid, integer, integer, integer, uuid, text, jsonb
) to authenticated;
grant execute on function public.refund_loyalty_transaction(uuid, text) to authenticated;
