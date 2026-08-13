-- VUYELA business dashboard read boundary.
-- Returns scoped dashboard data after server-side business/branch permission checks.

create or replace function public.get_business_dashboard(
  p_business_id uuid,
  p_branch_id uuid default null,
  p_window_days integer default 90
)
returns table (
  business jsonb,
  program jsonb,
  customers jsonb,
  transactions jsonb,
  campaigns jsonb,
  branches jsonb,
  employees jsonb,
  settings jsonb,
  scope_label text,
  has_manager_scope boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_manager_scope boolean;
  v_has_branch_access boolean;
  v_window_start timestamptz;
begin
  if p_business_id is null then
    raise exception 'Missing business dashboard scope';
  end if;

  p_window_days := least(greatest(coalesce(p_window_days, 90), 1), 365);
  v_window_start := now() - make_interval(days => p_window_days);
  v_has_manager_scope := public.can_manage_business(p_business_id);
  v_has_branch_access := public.can_access_branch(p_business_id, p_branch_id);

  if not v_has_manager_scope and not v_has_branch_access then
    raise exception 'Not authorized to read this business dashboard';
  end if;

  if not v_has_manager_scope and p_branch_id is null then
    raise exception 'Branch scope is required for branch dashboard access';
  end if;

  return query
  with scoped_tx as (
    select
      tx.id::text as id,
      tx.customer_card_id,
      tx.branch_id,
      tx.gross_amount_mzn_minor,
      tx.net_amount_mzn_minor,
      tx.points_earned,
      tx.points_redeemed,
      tx.occurred_at,
      coalesce(br.name, 'Sede') as branch_name,
      coalesce(
        nullif(cc.display_name, ''),
        nullif(p.display_name, ''),
        p.email::text,
        p.phone,
        'Cliente VUYELA'
      ) as customer_name
    from public.transactions tx
    left join public.branches br
      on br.id = tx.branch_id
      and br.business_id = tx.business_id
    left join public.customer_cards cc
      on cc.id = tx.customer_card_id
      and cc.business_id = tx.business_id
    left join public.profiles p on p.id = cc.customer_profile_id
    where tx.business_id = p_business_id
      and tx.status = 'completed'
      and tx.occurred_at >= v_window_start
      and (p_branch_id is null or tx.branch_id = p_branch_id)
  ),
  customer_scope as (
    select
      cc.id::text as id,
      coalesce(
        nullif(cc.display_name, ''),
        nullif(p.display_name, ''),
        p.email::text,
        p.phone,
        'Cliente VUYELA'
      ) as customer_name,
      cc.card_number,
      pw.available_balance,
      pw.lifetime_earned,
      pw.lifetime_redeemed,
      pw.available_balance * lp.point_value_mzn_minor as liability_mzn_minor,
      cc.joined_at::text as joined_at,
      max(st.occurred_at)::text as last_transaction_at
    from public.customer_cards cc
    join public.point_wallets pw
      on pw.customer_card_id = cc.id
      and pw.business_id = cc.business_id
    join public.loyalty_programs lp
      on lp.id = cc.loyalty_program_id
      and lp.business_id = cc.business_id
    left join public.profiles p on p.id = cc.customer_profile_id
    left join scoped_tx st on st.customer_card_id = cc.id
    where cc.business_id = p_business_id
      and cc.status = 'active'
      and (
        p_branch_id is null
        or exists (
          select 1
          from scoped_tx tx2
          where tx2.customer_card_id = cc.id
        )
      )
    group by
      cc.id,
      cc.display_name,
      p.display_name,
      p.email,
      p.phone,
      cc.card_number,
      pw.available_balance,
      pw.lifetime_earned,
      pw.lifetime_redeemed,
      lp.point_value_mzn_minor,
      cc.joined_at
  ),
  branch_rows as (
    select
      br.id::text as id,
      br.name,
      br.city,
      br.is_primary,
      count(st.id)::integer as transaction_count,
      coalesce(sum(st.net_amount_mzn_minor), 0)::integer as revenue_mzn_minor
    from public.branches br
    left join scoped_tx st on st.branch_id = br.id
    where br.business_id = p_business_id
      and br.is_active
      and (p_branch_id is null or br.id = p_branch_id)
    group by br.id, br.name, br.city, br.is_primary
  ),
  employee_rows as (
    select
      bm.id::text as id,
      coalesce(nullif(p.display_name, ''), p.email::text, p.phone, 'Membro VUYELA') as display_name,
      bm.role::text as role,
      coalesce(br.name, 'Sede') as branch_name,
      bm.status::text as status
    from public.business_members bm
    left join public.profiles p on p.id = bm.profile_id
    left join public.branches br
      on br.id = bm.branch_id
      and br.business_id = bm.business_id
    where bm.business_id = p_business_id
      and bm.status = 'active'
      and (
        v_has_manager_scope
        or (
          p_branch_id is not null
          and bm.branch_id = p_branch_id
        )
      )
  )
  select
    (
      select jsonb_build_object(
        'id', b.id::text,
        'name', b.name,
        'slug', b.slug,
        'status', b.status::text,
        'city', primary_branch.city
      )
      from public.businesses b
      left join lateral (
        select br.city
        from public.branches br
        where br.business_id = b.id
        order by br.is_primary desc, br.name asc
        limit 1
      ) primary_branch on true
      where b.id = p_business_id
    ) as business,
    (
      select jsonb_build_object(
        'name', lp.name,
        'status', lp.status::text,
        'earnRate', lp.earn_rate::text,
        'pointValueMznMinor', lp.point_value_mzn_minor,
        'maximumRedemptionPercent', lp.maximum_redemption_percent::text,
        'pointsExpireAfterDays', lp.points_expire_after_days
      )
      from public.loyalty_programs lp
      where lp.business_id = p_business_id
      order by lp.created_at desc
      limit 1
    ) as program,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', cs.id,
            'customerName', cs.customer_name,
            'cardNumber', cs.card_number,
            'availablePoints', cs.available_balance,
            'lifetimeEarned', cs.lifetime_earned,
            'lifetimeRedeemed', cs.lifetime_redeemed,
            'liabilityMznMinor', cs.liability_mzn_minor,
            'joinedAt', cs.joined_at,
            'lastTransactionAt', cs.last_transaction_at
          )
          order by cs.last_transaction_at desc nulls last, cs.joined_at desc
        ),
        '[]'::jsonb
      )
      from customer_scope cs
    ) as customers,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', st.id,
            'customerCardId', st.customer_card_id::text,
            'branchName', st.branch_name,
            'customerName', st.customer_name,
            'grossAmountMznMinor', st.gross_amount_mzn_minor,
            'netAmountMznMinor', st.net_amount_mzn_minor,
            'pointsEarned', st.points_earned,
            'pointsRedeemed', st.points_redeemed,
            'occurredAt', st.occurred_at::text
          )
          order by st.occurred_at desc
        ),
        '[]'::jsonb
      )
      from scoped_tx st
    ) as transactions,
    case
      when v_has_manager_scope then (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', c.id::text,
              'name', c.name,
              'status', c.status::text,
              'campaignType', c.campaign_type,
            'startsAt', c.starts_at::text,
            'endsAt', c.ends_at::text
            )
            order by c.created_at desc
          ),
          '[]'::jsonb
        )
        from public.campaigns c
        where c.business_id = p_business_id
      )
      else '[]'::jsonb
    end as campaigns,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', br.id,
            'name', br.name,
            'city', br.city,
            'isPrimary', br.is_primary,
            'transactionCount', br.transaction_count,
            'revenueMznMinor', br.revenue_mzn_minor
          )
          order by br.is_primary desc, br.name asc
        ),
        '[]'::jsonb
      )
      from branch_rows br
    ) as branches,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', er.id,
            'displayName', er.display_name,
            'role', er.role,
            'branchName', er.branch_name,
            'status', er.status
          )
          order by er.role asc, er.display_name asc
        ),
        '[]'::jsonb
      )
      from employee_rows er
    ) as employees,
    jsonb_build_object(
      'businessStatus', (
        select b.status::text
        from public.businesses b
        where b.id = p_business_id
      ),
      'programStatus', coalesce((
        select lp.status::text
        from public.loyalty_programs lp
        where lp.business_id = p_business_id
        order by lp.created_at desc
        limit 1
      ), 'draft'),
      'subscriptionStatus', case
        when v_has_manager_scope then coalesce((
          select s.status::text
          from public.subscriptions s
          where s.business_id = p_business_id
          order by s.created_at desc
          limit 1
        ), 'none')
        else 'restrito'
      end,
      'activeOffers', case
        when v_has_manager_scope then (
          select count(*)::integer
          from public.offers o
          where o.business_id = p_business_id
            and o.is_active
        )
        else 0
      end
    ) as settings,
    coalesce((
      select concat(br.name, ' - ', br.city)
      from public.branches br
      where br.id = p_branch_id
        and br.business_id = p_business_id
    ), 'Todo o negocio') as scope_label,
    v_has_manager_scope as has_manager_scope;
end;
$$;

revoke all on function public.get_business_dashboard(uuid, uuid, integer) from public;
grant execute on function public.get_business_dashboard(uuid, uuid, integer) to authenticated;
