-- FASE 13 campaign management support.
-- Campaigns stay private to the issuing business and communication sends are left for FASE 14.

alter table public.campaigns
  add constraint campaigns_rules_object check (jsonb_typeof(rules) = 'object'),
  add constraint campaigns_audience_object check (jsonb_typeof(audience) = 'object'),
  add constraint campaigns_supported_type check (
    campaign_type in (
      'welcome',
      'first_purchase',
      'second_purchase',
      'birthday',
      'inactive_customer',
      'double_points',
      'specific_product',
      'specific_time',
      'weekend',
      'referral',
      'expiring_points',
      'vip',
      'location'
    )
  );

create index campaigns_ends_at_idx on public.campaigns(ends_at) where ends_at is not null;
create unique index campaign_audiences_campaign_card_unique_idx
on public.campaign_audiences(campaign_id, customer_card_id)
where customer_card_id is not null;
create index campaign_audiences_segment_key_idx
on public.campaign_audiences(business_id, segment_key)
where segment_key is not null;

create or replace function public.calculate_campaign_eligibility(
  p_business_id uuid,
  p_campaign_type text,
  p_rules jsonb default '{}'::jsonb,
  p_audience jsonb default '{}'::jsonb,
  p_reference_at timestamptz default now()
)
returns table (
  customer_card_id uuid,
  customer_name text,
  purchase_count integer,
  total_spent_mzn_minor integer,
  last_purchase_at timestamptz,
  tier_name text,
  points_balance integer,
  city text,
  has_marketing_consent boolean,
  eligible boolean,
  consent_required boolean,
  segment_key text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_requires_consent boolean;
  v_city text;
  v_tier_name text;
  v_min_purchase_count integer;
  v_max_purchase_count integer;
  v_min_total_spent_mzn_minor integer;
  v_min_points_balance integer;
  v_max_points_balance integer;
  v_last_purchase_before_days integer;
begin
  if p_business_id is null then
    raise exception 'Missing campaign business scope';
  end if;

  if not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to calculate campaign eligibility';
  end if;

  if jsonb_typeof(coalesce(p_rules, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_audience, '{}'::jsonb)) <> 'object' then
    raise exception 'Campaign rules and audience must be JSON objects';
  end if;

  if p_campaign_type not in (
    'welcome',
    'first_purchase',
    'second_purchase',
    'birthday',
    'inactive_customer',
    'double_points',
    'specific_product',
    'specific_time',
    'weekend',
    'referral',
    'expiring_points',
    'vip',
    'location'
  ) then
    raise exception 'Unsupported campaign type';
  end if;

  v_requires_consent := coalesce((p_audience ->> 'requiresMarketingConsent')::boolean, true);
  v_city := nullif(lower(trim(p_audience ->> 'city')), '');
  v_tier_name := nullif(lower(trim(p_audience ->> 'tierName')), '');
  v_min_purchase_count := nullif(p_audience ->> 'minPurchaseCount', '')::integer;
  v_max_purchase_count := nullif(p_audience ->> 'maxPurchaseCount', '')::integer;
  v_min_total_spent_mzn_minor := nullif(p_audience ->> 'minTotalSpentMznMinor', '')::integer;
  v_min_points_balance := nullif(p_audience ->> 'minPointsBalance', '')::integer;
  v_max_points_balance := nullif(p_audience ->> 'maxPointsBalance', '')::integer;
  v_last_purchase_before_days := nullif(p_audience ->> 'lastPurchaseBeforeDays', '')::integer;

  if p_campaign_type = 'inactive_customer' and v_last_purchase_before_days is null then
    v_last_purchase_before_days := 30;
  end if;

  return query
  with customer_metrics as (
    select
      cc.id as customer_card_id,
      coalesce(
        nullif(cc.display_name, ''),
        nullif(p.display_name, ''),
        p.email::text,
        p.phone,
        'Cliente VUYELA'
      ) as customer_name,
      count(tx.id)::integer as purchase_count,
      coalesce(sum(tx.net_amount_mzn_minor), 0)::integer as total_spent_mzn_minor,
      max(tx.occurred_at) as last_purchase_at,
      pw.available_balance as points_balance,
      pw.lifetime_earned,
      p.marketing_consent_at is not null as has_marketing_consent,
      last_branch.city,
      tier.name as tier_name
    from public.customer_cards cc
    join public.point_wallets pw
      on pw.customer_card_id = cc.id
      and pw.business_id = cc.business_id
    left join public.profiles p on p.id = cc.customer_profile_id
    left join public.transactions tx
      on tx.customer_card_id = cc.id
      and tx.business_id = cc.business_id
      and tx.status = 'completed'
    left join lateral (
      select br.city
      from public.transactions recent_tx
      join public.branches br
        on br.id = recent_tx.branch_id
        and br.business_id = recent_tx.business_id
      where recent_tx.customer_card_id = cc.id
        and recent_tx.business_id = cc.business_id
        and recent_tx.status = 'completed'
      order by recent_tx.occurred_at desc
      limit 1
    ) last_branch on true
    left join lateral (
      select lt.name
      from public.loyalty_tiers lt
      where lt.loyalty_program_id = cc.loyalty_program_id
        and lt.minimum_lifetime_points <= pw.lifetime_earned
      order by lt.minimum_lifetime_points desc, lt.sort_order asc
      limit 1
    ) tier on true
    where cc.business_id = p_business_id
      and cc.status = 'active'
    group by
      cc.id,
      cc.display_name,
      p.display_name,
      p.email,
      p.phone,
      p.marketing_consent_at,
      pw.available_balance,
      pw.lifetime_earned,
      last_branch.city,
      tier.name
  ),
  evaluated as (
    select
      cm.*,
      (
        case
          when p_campaign_type in ('welcome', 'first_purchase') then cm.purchase_count = 0
          when p_campaign_type = 'second_purchase' then cm.purchase_count = 1
          when p_campaign_type = 'inactive_customer' then (
            cm.purchase_count > 0
            and cm.last_purchase_at is not null
            and cm.last_purchase_at <= p_reference_at - make_interval(days => v_last_purchase_before_days)
          )
          else true
        end
        and (v_city is null or lower(coalesce(cm.city, '')) = v_city)
        and (v_tier_name is null or lower(coalesce(cm.tier_name, '')) = v_tier_name)
        and (v_min_purchase_count is null or cm.purchase_count >= v_min_purchase_count)
        and (v_max_purchase_count is null or cm.purchase_count <= v_max_purchase_count)
        and (v_min_total_spent_mzn_minor is null or cm.total_spent_mzn_minor >= v_min_total_spent_mzn_minor)
        and (v_min_points_balance is null or cm.points_balance >= v_min_points_balance)
        and (v_max_points_balance is null or cm.points_balance <= v_max_points_balance)
        and (not v_requires_consent or cm.has_marketing_consent)
      ) as is_eligible
    from customer_metrics cm
  )
  select
    e.customer_card_id,
    e.customer_name,
    e.purchase_count,
    e.total_spent_mzn_minor,
    e.last_purchase_at,
    e.tier_name,
    e.points_balance,
    e.city,
    e.has_marketing_consent,
    e.is_eligible,
    v_requires_consent,
    concat_ws(
      '|',
      p_campaign_type,
      case when v_city is not null then concat('city:', v_city) end,
      case when v_tier_name is not null then concat('tier:', v_tier_name) end,
      case when v_min_purchase_count is not null then concat('min-purchases:', v_min_purchase_count) end,
      case when v_max_purchase_count is not null then concat('max-purchases:', v_max_purchase_count) end,
      case when v_last_purchase_before_days is not null then concat('inactive:', v_last_purchase_before_days) end,
      case when v_requires_consent then 'consented' end
    ) as segment_key
  from evaluated e;
end;
$$;

create or replace function public.create_campaign_with_audience(
  p_business_id uuid,
  p_name text,
  p_campaign_type text,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_rules jsonb default '{}'::jsonb,
  p_audience jsonb default '{}'::jsonb,
  p_save_as_draft boolean default false
)
returns table (
  campaign_id uuid,
  campaign_status public.campaign_status,
  eligible_count integer,
  consented_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_status public.campaign_status;
begin
  if p_business_id is null then
    raise exception 'Missing campaign business scope';
  end if;

  if not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to create campaign';
  end if;

  if length(trim(coalesce(p_name, ''))) < 3 then
    raise exception 'Campaign name is required';
  end if;

  if p_ends_at is not null and p_starts_at is not null and p_ends_at <= p_starts_at then
    raise exception 'Campaign end must be after start';
  end if;

  if jsonb_typeof(coalesce(p_rules, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_audience, '{}'::jsonb)) <> 'object' then
    raise exception 'Campaign rules and audience must be JSON objects';
  end if;

  if p_save_as_draft then
    v_status := 'draft';
  elsif p_starts_at is not null and p_starts_at > now() then
    v_status := 'scheduled';
  else
    v_status := 'active';
  end if;

  insert into public.campaigns (
    business_id,
    name,
    status,
    campaign_type,
    starts_at,
    ends_at,
    rules,
    audience,
    created_by
  )
  values (
    p_business_id,
    trim(p_name),
    v_status,
    p_campaign_type,
    p_starts_at,
    p_ends_at,
    coalesce(p_rules, '{}'::jsonb),
    coalesce(p_audience, '{}'::jsonb),
    auth.uid()
  )
  returning id into v_campaign_id;

  insert into public.campaign_audiences (
    business_id,
    campaign_id,
    customer_card_id,
    segment_key
  )
  select
    p_business_id,
    v_campaign_id,
    ce.customer_card_id,
    ce.segment_key
  from public.calculate_campaign_eligibility(
    p_business_id,
    p_campaign_type,
    p_rules,
    p_audience,
    now()
  ) ce
  where ce.eligible;

  return query
  select
    v_campaign_id,
    v_status,
    count(ca.id)::integer as eligible_count,
    count(ca.id) filter (where p.marketing_consent_at is not null)::integer as consented_count
  from public.campaigns c
  left join public.campaign_audiences ca
    on ca.campaign_id = c.id
    and ca.business_id = c.business_id
  left join public.customer_cards cc
    on cc.id = ca.customer_card_id
    and cc.business_id = ca.business_id
  left join public.profiles p on p.id = cc.customer_profile_id
  where c.id = v_campaign_id
  group by c.id;
end;
$$;

create or replace function public.get_business_campaigns(
  p_business_id uuid
)
returns table (
  campaigns jsonb,
  analytics jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_business_id is null then
    raise exception 'Missing campaign business scope';
  end if;

  if not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to read business campaigns';
  end if;

  return query
  with campaign_rows as (
    select
      c.id,
      c.business_id,
      c.name,
      c.status,
      c.campaign_type,
      c.starts_at,
      c.ends_at,
      c.rules,
      c.audience,
      c.created_at,
      count(ca.id)::integer as audience_count,
      count(ca.id) filter (where p.marketing_consent_at is not null)::integer as consented_audience_count
    from public.campaigns c
    left join public.campaign_audiences ca
      on ca.campaign_id = c.id
      and ca.business_id = c.business_id
    left join public.customer_cards cc
      on cc.id = ca.customer_card_id
      and cc.business_id = ca.business_id
    left join public.profiles p on p.id = cc.customer_profile_id
    where c.business_id = p_business_id
    group by c.id
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', cr.id::text,
          'businessId', cr.business_id::text,
          'name', cr.name,
          'status', cr.status::text,
          'campaignType', cr.campaign_type,
          'startsAt', cr.starts_at::text,
          'endsAt', cr.ends_at::text,
          'rules', cr.rules,
          'audience', cr.audience,
          'audienceCount', cr.audience_count,
          'consentedAudienceCount', cr.consented_audience_count,
          'createdAt', cr.created_at::text
        )
        order by cr.created_at desc
      ),
      '[]'::jsonb
    ) as campaigns,
    jsonb_build_object(
      'totalCampaigns', count(cr.id)::integer,
      'draftCampaigns', count(cr.id) filter (where cr.status = 'draft')::integer,
      'scheduledCampaigns', count(cr.id) filter (where cr.status = 'scheduled')::integer,
      'activeCampaigns', count(cr.id) filter (where cr.status = 'active')::integer,
      'completedCampaigns', count(cr.id) filter (where cr.status = 'completed')::integer,
      'totalAudienceCount', coalesce(sum(cr.audience_count), 0)::integer,
      'consentedAudienceCount', coalesce(sum(cr.consented_audience_count), 0)::integer,
      'averageAudienceCount', case
        when count(cr.id) = 0 then 0
        else round(coalesce(sum(cr.audience_count), 0)::numeric / count(cr.id))::integer
      end,
      'consentCoverageRate', case
        when coalesce(sum(cr.audience_count), 0) = 0 then 0
        else coalesce(sum(cr.consented_audience_count), 0)::numeric / sum(cr.audience_count)
      end
    ) as analytics
  from campaign_rows cr;
end;
$$;

revoke all on function public.calculate_campaign_eligibility(uuid, text, jsonb, jsonb, timestamptz) from public;
revoke all on function public.create_campaign_with_audience(uuid, text, text, timestamptz, timestamptz, jsonb, jsonb, boolean) from public;
revoke all on function public.get_business_campaigns(uuid) from public;

grant execute on function public.calculate_campaign_eligibility(uuid, text, jsonb, jsonb, timestamptz) to authenticated;
grant execute on function public.create_campaign_with_audience(uuid, text, text, timestamptz, timestamptz, jsonb, jsonb, boolean) to authenticated;
grant execute on function public.get_business_campaigns(uuid) to authenticated;
