-- FASE 17 subscription plans and entitlement enforcement.
-- Payment collection remains outside this migration; platform admins assign plans manually.

alter table public.plans
  add column trial_days integer not null default 0,
  add constraint plans_trial_days_range check (trial_days between 0 and 365);

create table public.plan_entitlements (
  plan_id uuid primary key references public.plans(id) on delete cascade,
  branch_limit integer,
  staff_limit integer,
  campaign_limit integer,
  analytics_level text not null default 'basic',
  feature_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_entitlements_branch_limit_positive check (
    branch_limit is null or branch_limit > 0
  ),
  constraint plan_entitlements_staff_limit_positive check (
    staff_limit is null or staff_limit > 0
  ),
  constraint plan_entitlements_campaign_limit_non_negative check (
    campaign_limit is null or campaign_limit >= 0
  ),
  constraint plan_entitlements_analytics_level check (
    analytics_level in ('none', 'basic', 'standard', 'advanced')
  ),
  constraint plan_entitlements_feature_flags_array check (
    jsonb_typeof(feature_flags) = 'array'
  )
);

create trigger plan_entitlements_set_updated_at
before update on public.plan_entitlements
for each row execute function public.set_updated_at();

insert into public.plans (
  slug,
  name,
  description,
  monthly_price_mzn_minor,
  is_public,
  is_active,
  sort_order,
  trial_days
)
values
  (
    'teste',
    'Teste',
    'Plano inicial para validar a operacao de fidelizacao.',
    0,
    true,
    true,
    10,
    30
  ),
  (
    'essencial',
    'Essencial',
    'Operacao de fidelizacao para negocios com uma equipa pequena.',
    150000,
    true,
    true,
    20,
    14
  ),
  (
    'crescimento',
    'Crescimento',
    'Mais capacidade para filiais, equipa e campanhas.',
    350000,
    true,
    true,
    30,
    14
  ),
  (
    'profissional',
    'Profissional',
    'Operacao alargada com analitica avancada.',
    750000,
    true,
    true,
    40,
    14
  ),
  (
    'empresarial',
    'Empresarial',
    'Capacidade configurada para operacoes empresariais.',
    null,
    true,
    true,
    50,
    0
  )
on conflict (slug) do nothing;

insert into public.plan_entitlements (
  plan_id,
  branch_limit,
  staff_limit,
  campaign_limit,
  analytics_level,
  feature_flags
)
select
  p.id,
  configured.branch_limit,
  configured.staff_limit,
  configured.campaign_limit,
  configured.analytics_level,
  configured.feature_flags
from (
  values
    ('teste', 1, 3, 2, 'basic', '["loyalty", "pos"]'::jsonb),
    (
      'essencial',
      2,
      8,
      5,
      'basic',
      '["loyalty", "pos", "referrals", "campaign_delivery"]'::jsonb
    ),
    (
      'crescimento',
      5,
      25,
      20,
      'standard',
      '["loyalty", "pos", "referrals", "campaign_delivery"]'::jsonb
    ),
    (
      'profissional',
      20,
      100,
      null,
      'advanced',
      '["loyalty", "pos", "referrals", "campaign_delivery", "priority_support"]'::jsonb
    ),
    (
      'empresarial',
      null,
      null,
      null,
      'advanced',
      '["loyalty", "pos", "referrals", "campaign_delivery", "priority_support"]'::jsonb
    )
) as configured(
  slug,
  branch_limit,
  staff_limit,
  campaign_limit,
  analytics_level,
  feature_flags
)
join public.plans p on p.slug = configured.slug
on conflict (plan_id) do nothing;

insert into public.subscriptions (
  business_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  trial_ends_at
)
select
  b.id,
  p.id,
  'trialing',
  now(),
  now() + make_interval(days => p.trial_days),
  now() + make_interval(days => p.trial_days)
from public.businesses b
join public.plans p on p.slug = 'teste'
where not exists (
  select 1
  from public.subscriptions s
  where s.business_id = b.id
    and s.status in ('trialing', 'active', 'past_due', 'paused')
);

create or replace function public.resolve_business_entitlements(
  p_business_id uuid
)
returns public.plan_entitlements
language sql
stable
security definer
set search_path = ''
as $$
  select pe
  from public.subscriptions s
  join public.plan_entitlements pe on pe.plan_id = s.plan_id
  where s.business_id = p_business_id
    and s.status in ('trialing', 'active', 'past_due', 'paused')
  order by case s.status
    when 'active' then 1
    when 'trialing' then 2
    when 'past_due' then 3
    else 4
  end
  limit 1;
$$;

create or replace function public.enforce_business_resource_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entitlements public.plan_entitlements;
  v_business_id uuid := new.business_id;
  v_current_count integer;
  v_limit integer;
  v_is_counted boolean;
  v_resource text;
begin
  if tg_table_name = 'branches' then
    v_is_counted := new.is_active;
    v_resource := 'branch';
  elsif tg_table_name = 'business_members' then
    v_is_counted := new.status = 'active';
    v_resource := 'staff';
  elsif tg_table_name = 'campaigns' then
    v_is_counted := new.status in ('draft', 'scheduled', 'active', 'paused');
    v_resource := 'campaign';
  else
    raise exception 'Unsupported subscription resource';
  end if;

  if not v_is_counted then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_business_id::text, 1701));
  v_entitlements := public.resolve_business_entitlements(v_business_id);

  if v_entitlements.plan_id is null then
    raise exception 'Active subscription required for business resource';
  end if;

  if tg_table_name = 'branches' then
    v_limit := v_entitlements.branch_limit;
    select count(*)::integer
    into v_current_count
    from public.branches b
    where b.business_id = v_business_id
      and b.is_active
      and b.id <> new.id;
  elsif tg_table_name = 'business_members' then
    v_limit := v_entitlements.staff_limit;
    select count(*)::integer
    into v_current_count
    from public.business_members bm
    where bm.business_id = v_business_id
      and bm.status = 'active'
      and bm.id <> new.id;
  else
    v_limit := v_entitlements.campaign_limit;
    select count(*)::integer
    into v_current_count
    from public.campaigns c
    where c.business_id = v_business_id
      and c.status in ('draft', 'scheduled', 'active', 'paused')
      and c.id <> new.id;
  end if;

  if v_limit is not null and v_current_count >= v_limit then
    raise exception '% limit reached for subscription plan', initcap(v_resource);
  end if;

  return new;
end;
$$;

create trigger branches_enforce_subscription_limit
before insert or update of business_id, is_active on public.branches
for each row execute function public.enforce_business_resource_limit();

create trigger business_members_enforce_subscription_limit
before insert or update of business_id, status on public.business_members
for each row execute function public.enforce_business_resource_limit();

create trigger campaigns_enforce_subscription_limit
before insert or update of business_id, status on public.campaigns
for each row execute function public.enforce_business_resource_limit();

create or replace function public.assert_plan_supports_business_usage(
  p_business_id uuid,
  p_plan_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entitlements public.plan_entitlements;
  v_branch_count integer;
  v_staff_count integer;
  v_campaign_count integer;
begin
  select pe.*
  into v_entitlements
  from public.plan_entitlements pe
  where pe.plan_id = p_plan_id;

  if not found then
    raise exception 'Plan entitlements not found';
  end if;

  select count(*)::integer
  into v_branch_count
  from public.branches b
  where b.business_id = p_business_id
    and b.is_active;

  select count(*)::integer
  into v_staff_count
  from public.business_members bm
  where bm.business_id = p_business_id
    and bm.status = 'active';

  select count(*)::integer
  into v_campaign_count
  from public.campaigns c
  where c.business_id = p_business_id
    and c.status in ('draft', 'scheduled', 'active', 'paused');

  if v_entitlements.branch_limit is not null
    and v_branch_count > v_entitlements.branch_limit then
    raise exception 'Plan branch limit is below current usage';
  end if;

  if v_entitlements.staff_limit is not null
    and v_staff_count > v_entitlements.staff_limit then
    raise exception 'Plan staff limit is below current usage';
  end if;

  if v_entitlements.campaign_limit is not null
    and v_campaign_count > v_entitlements.campaign_limit then
    raise exception 'Plan campaign limit is below current usage';
  end if;
end;
$$;

create or replace function public.get_business_subscription_overview(
  p_business_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_subscription record;
  v_entitlements public.plan_entitlements;
  v_branch_count integer;
  v_staff_count integer;
  v_campaign_count integer;
  v_available_plans jsonb;
begin
  if p_business_id is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to read business subscription';
  end if;

  select
    s.id,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.trial_ends_at,
    p.id as plan_id,
    p.slug as plan_slug,
    p.name as plan_name,
    p.description as plan_description,
    p.monthly_price_mzn_minor
  into v_subscription
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.business_id = p_business_id
    and s.status in ('trialing', 'active', 'past_due', 'paused')
  order by case s.status
    when 'active' then 1
    when 'trialing' then 2
    when 'past_due' then 3
    else 4
  end
  limit 1;

  if found then
    select pe.*
    into v_entitlements
    from public.plan_entitlements pe
    where pe.plan_id = v_subscription.plan_id;
  end if;

  select count(*)::integer
  into v_branch_count
  from public.branches b
  where b.business_id = p_business_id
    and b.is_active;

  select count(*)::integer
  into v_staff_count
  from public.business_members bm
  where bm.business_id = p_business_id
    and bm.status = 'active';

  select count(*)::integer
  into v_campaign_count
  from public.campaigns c
  where c.business_id = p_business_id
    and c.status in ('draft', 'scheduled', 'active', 'paused');

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', available.id::text,
        'slug', available.slug,
        'name', available.name,
        'description', available.description,
        'monthlyPriceMznMinor', available.monthly_price_mzn_minor,
        'trialDays', available.trial_days,
        'branchLimit', ent.branch_limit,
        'staffLimit', ent.staff_limit,
        'campaignLimit', ent.campaign_limit,
        'analyticsLevel', ent.analytics_level,
        'featureFlags', ent.feature_flags
      )
      order by available.sort_order, available.name
    ),
    '[]'::jsonb
  )
  into v_available_plans
  from public.plans available
  join public.plan_entitlements ent on ent.plan_id = available.id
  where available.is_public
    and available.is_active;

  return jsonb_build_object(
    'businessId', p_business_id::text,
    'subscription', case
      when v_subscription.id is null then null
      else jsonb_build_object(
        'id', v_subscription.id::text,
        'status', v_subscription.status::text,
        'currentPeriodStart', v_subscription.current_period_start,
        'currentPeriodEnd', v_subscription.current_period_end,
        'trialEndsAt', v_subscription.trial_ends_at,
        'plan', jsonb_build_object(
          'id', v_subscription.plan_id::text,
          'slug', v_subscription.plan_slug,
          'name', v_subscription.plan_name,
          'description', v_subscription.plan_description,
          'monthlyPriceMznMinor', v_subscription.monthly_price_mzn_minor
        )
      )
    end,
    'entitlements', case
      when v_entitlements.plan_id is null then null
      else jsonb_build_object(
        'branchLimit', v_entitlements.branch_limit,
        'staffLimit', v_entitlements.staff_limit,
        'campaignLimit', v_entitlements.campaign_limit,
        'analyticsLevel', v_entitlements.analytics_level,
        'featureFlags', v_entitlements.feature_flags
      )
    end,
    'usage', jsonb_build_object(
      'branches', v_branch_count,
      'staff', v_staff_count,
      'campaigns', v_campaign_count
    ),
    'availablePlans', v_available_plans
  );
end;
$$;

create or replace function public.start_business_trial_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
  v_subscription_id uuid;
begin
  select p.*
  into v_plan
  from public.plans p
  where p.slug = 'teste'
    and p.is_active
  limit 1;

  if not found then
    raise exception 'Default trial plan is not configured';
  end if;

  insert into public.subscriptions (
    business_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at
  )
  values (
    new.id,
    v_plan.id,
    'trialing',
    now(),
    now() + make_interval(days => v_plan.trial_days),
    now() + make_interval(days => v_plan.trial_days)
  )
  returning id into v_subscription_id;

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
    new.id,
    auth.uid(),
    'create',
    'subscriptions',
    v_subscription_id,
    jsonb_build_object(
      'planId', v_plan.id,
      'status', 'trialing',
      'trialEndsAt', now() + make_interval(days => v_plan.trial_days)
    ),
    jsonb_build_object('operation', 'automatic_trial_provisioning')
  );

  return new;
end;
$$;

create trigger businesses_start_trial_subscription
after insert on public.businesses
for each row execute function public.start_business_trial_subscription();

create or replace function public.admin_assign_subscription_plan(
  p_actor_profile_id uuid,
  p_business_id uuid,
  p_plan_id uuid,
  p_status text,
  p_note text,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
  v_before public.subscriptions;
  v_after public.subscriptions;
  v_status public.subscription_status;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  if nullif(btrim(p_note), '') is null then
    raise exception 'A subscription change note is required';
  end if;

  if p_status not in ('trialing', 'active', 'paused') then
    raise exception 'Unsupported subscription status';
  end if;
  v_status := p_status::public.subscription_status;

  perform 1
  from public.businesses b
  where b.id = p_business_id
  for update;
  if not found then
    raise exception 'Business not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text, 1701));

  select p.*
  into v_plan
  from public.plans p
  where p.id = p_plan_id
    and p.is_active
  for update;
  if not found then
    raise exception 'Active plan not found';
  end if;

  if v_status = 'trialing' and v_plan.trial_days = 0 then
    raise exception 'Selected plan has no trial period';
  end if;

  perform public.assert_plan_supports_business_usage(p_business_id, p_plan_id);

  select s.*
  into v_before
  from public.subscriptions s
  where s.business_id = p_business_id
    and s.status in ('trialing', 'active', 'past_due', 'paused')
  order by s.created_at desc
  limit 1
  for update;

  if v_before.id is null then
    insert into public.subscriptions (
      business_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      trial_ends_at
    )
    values (
      p_business_id,
      p_plan_id,
      v_status,
      now(),
      case
        when v_status = 'trialing' then now() + make_interval(days => v_plan.trial_days)
        else now() + interval '1 month'
      end,
      case
        when v_status = 'trialing' then now() + make_interval(days => v_plan.trial_days)
        else null
      end
    )
    returning * into v_after;
  else
    update public.subscriptions
    set plan_id = p_plan_id,
        status = v_status,
        current_period_start = now(),
        current_period_end = case
          when v_status = 'trialing' then now() + make_interval(days => v_plan.trial_days)
          else now() + interval '1 month'
        end,
        trial_ends_at = case
          when v_status = 'trialing' then now() + make_interval(days => v_plan.trial_days)
          else null
        end,
        cancelled_at = null
    where id = v_before.id
    returning * into v_after;
  end if;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent,
    context
  )
  values (
    p_business_id,
    p_actor_profile_id,
    'update',
    'subscriptions',
    v_after.id,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    to_jsonb(v_after),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'admin_assign_subscription_plan',
      'note', left(btrim(p_note), 1000)
    )
  );

  return v_after;
end;
$$;

create or replace function public.admin_update_plan_entitlements(
  p_actor_profile_id uuid,
  p_plan_id uuid,
  p_monthly_price_mzn_minor integer,
  p_branch_limit integer,
  p_staff_limit integer,
  p_campaign_limit integer,
  p_analytics_level text,
  p_feature_flags jsonb,
  p_is_public boolean,
  p_is_active boolean,
  p_trial_days integer,
  p_note text,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before_plan public.plans;
  v_after_plan public.plans;
  v_before_entitlements public.plan_entitlements;
  v_after_entitlements public.plan_entitlements;
  v_subscription record;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  if nullif(btrim(p_note), '') is null then
    raise exception 'A plan change note is required';
  end if;

  if p_monthly_price_mzn_minor is not null and p_monthly_price_mzn_minor < 0 then
    raise exception 'Plan price cannot be negative';
  end if;

  if (p_branch_limit is not null and p_branch_limit < 1)
    or (p_staff_limit is not null and p_staff_limit < 1)
    or (p_campaign_limit is not null and p_campaign_limit < 0)
    or (p_trial_days not between 0 and 365) then
    raise exception 'Invalid plan limits';
  end if;

  if p_analytics_level not in ('none', 'basic', 'standard', 'advanced') then
    raise exception 'Invalid analytics level';
  end if;

  if jsonb_typeof(coalesce(p_feature_flags, '[]'::jsonb)) <> 'array'
    or exists (
      select 1
      from jsonb_array_elements(coalesce(p_feature_flags, '[]'::jsonb)) flag
      where jsonb_typeof(flag) <> 'string'
    ) then
    raise exception 'Feature flags must be a JSON string array';
  end if;

  select p.*
  into v_before_plan
  from public.plans p
  where p.id = p_plan_id
  for update;
  if not found then
    raise exception 'Plan not found';
  end if;

  select pe.*
  into v_before_entitlements
  from public.plan_entitlements pe
  where pe.plan_id = p_plan_id
  for update;
  if not found then
    raise exception 'Plan entitlements not found';
  end if;

  update public.plans
  set monthly_price_mzn_minor = p_monthly_price_mzn_minor,
      is_public = p_is_public,
      is_active = p_is_active,
      trial_days = p_trial_days
  where id = p_plan_id
  returning * into v_after_plan;

  update public.plan_entitlements
  set branch_limit = p_branch_limit,
      staff_limit = p_staff_limit,
      campaign_limit = p_campaign_limit,
      analytics_level = p_analytics_level,
      feature_flags = coalesce(p_feature_flags, '[]'::jsonb)
  where plan_id = p_plan_id
  returning * into v_after_entitlements;

  for v_subscription in
    select s.business_id
    from public.subscriptions s
    where s.plan_id = p_plan_id
      and s.status in ('trialing', 'active', 'past_due', 'paused')
    order by s.business_id
  loop
    perform pg_advisory_xact_lock(
      hashtextextended(v_subscription.business_id::text, 1701)
    );
    perform public.assert_plan_supports_business_usage(
      v_subscription.business_id,
      p_plan_id
    );
  end loop;

  insert into public.audit_logs (
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent,
    context
  )
  values (
    p_actor_profile_id,
    'update',
    'plans',
    p_plan_id,
    jsonb_build_object(
      'plan', to_jsonb(v_before_plan),
      'entitlements', to_jsonb(v_before_entitlements)
    ),
    jsonb_build_object(
      'plan', to_jsonb(v_after_plan),
      'entitlements', to_jsonb(v_after_entitlements)
    ),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'admin_update_plan_entitlements',
      'note', left(btrim(p_note), 1000)
    )
  );

  return v_after_plan;
end;
$$;

alter table public.plan_entitlements enable row level security;

create policy plan_entitlements_public_select
on public.plan_entitlements
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.plans p
    where p.id = plan_id
      and p.is_public
      and p.is_active
  )
);

revoke all privileges on table public.plan_entitlements from public;
revoke all privileges on table public.plan_entitlements from anon;
revoke all privileges on table public.plan_entitlements from authenticated;

grant select on table public.plan_entitlements to anon, authenticated;
grant all privileges on table public.plan_entitlements to service_role;
grant select on table public.plans to anon, authenticated, service_role;

revoke all privileges on function public.resolve_business_entitlements(uuid) from public;
revoke all privileges on function public.resolve_business_entitlements(uuid) from anon;
revoke all privileges on function public.resolve_business_entitlements(uuid) from authenticated;

revoke all privileges on function public.enforce_business_resource_limit() from public;
revoke all privileges on function public.enforce_business_resource_limit() from anon;
revoke all privileges on function public.enforce_business_resource_limit() from authenticated;

revoke all privileges on function public.assert_plan_supports_business_usage(uuid, uuid)
from public;
revoke all privileges on function public.assert_plan_supports_business_usage(uuid, uuid)
from anon;
revoke all privileges on function public.assert_plan_supports_business_usage(uuid, uuid)
from authenticated;

revoke all privileges on function public.start_business_trial_subscription() from public;
revoke all privileges on function public.start_business_trial_subscription() from anon;
revoke all privileges on function public.start_business_trial_subscription() from authenticated;

revoke all privileges on function public.get_business_subscription_overview(uuid) from public;
revoke all privileges on function public.get_business_subscription_overview(uuid) from anon;
grant execute on function public.get_business_subscription_overview(uuid) to authenticated;

revoke all privileges on function public.admin_assign_subscription_plan(
  uuid,
  uuid,
  uuid,
  text,
  text,
  inet,
  text
) from public;
revoke all privileges on function public.admin_assign_subscription_plan(
  uuid,
  uuid,
  uuid,
  text,
  text,
  inet,
  text
) from anon;
revoke all privileges on function public.admin_assign_subscription_plan(
  uuid,
  uuid,
  uuid,
  text,
  text,
  inet,
  text
) from authenticated;
grant execute on function public.admin_assign_subscription_plan(
  uuid,
  uuid,
  uuid,
  text,
  text,
  inet,
  text
) to service_role;

revoke all privileges on function public.admin_update_plan_entitlements(
  uuid,
  uuid,
  integer,
  integer,
  integer,
  integer,
  text,
  jsonb,
  boolean,
  boolean,
  integer,
  text,
  inet,
  text
) from public;
revoke all privileges on function public.admin_update_plan_entitlements(
  uuid,
  uuid,
  integer,
  integer,
  integer,
  integer,
  text,
  jsonb,
  boolean,
  boolean,
  integer,
  text,
  inet,
  text
) from anon;
revoke all privileges on function public.admin_update_plan_entitlements(
  uuid,
  uuid,
  integer,
  integer,
  integer,
  integer,
  text,
  jsonb,
  boolean,
  boolean,
  integer,
  text,
  inet,
  text
) from authenticated;
grant execute on function public.admin_update_plan_entitlements(
  uuid,
  uuid,
  integer,
  integer,
  integer,
  integer,
  text,
  jsonb,
  boolean,
  boolean,
  integer,
  text,
  inet,
  text
) to service_role;

comment on table public.plan_entitlements is
  'Configurable limits and feature access for each subscription plan.';
comment on column public.plan_entitlements.branch_limit is
  'Maximum active branches; null means unlimited.';
comment on column public.plan_entitlements.staff_limit is
  'Maximum active business members; null means unlimited.';
comment on column public.plan_entitlements.campaign_limit is
  'Maximum open campaigns; null means unlimited.';
