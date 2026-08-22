-- Atomic manager-owned configuration for the public business profile, loyalty
-- rules and the selected branch. Sensitive changes remain tenant-scoped.

create or replace function public.update_business_configuration(
  p_business_id uuid,
  p_category_id uuid,
  p_name text,
  p_description text,
  p_phone text,
  p_email text,
  p_website_url text,
  p_program_name text,
  p_earn_percent numeric,
  p_point_value_mzn_minor integer,
  p_maximum_redemption_percent numeric,
  p_points_expire_after_days integer,
  p_program_terms text,
  p_branch_id uuid,
  p_branch_name text,
  p_branch_phone text,
  p_branch_email text,
  p_branch_address_line text,
  p_branch_city text,
  p_branch_province text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_profile_id uuid := auth.uid();
  v_program_id uuid;
begin
  if v_actor_profile_id is null or p_business_id is null then
    raise exception 'Authentication and business scope are required';
  end if;

  if not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to configure this business';
  end if;

  if nullif(btrim(p_name), '') is null or length(btrim(p_name)) > 120 then
    raise exception 'Invalid business name';
  end if;

  if nullif(btrim(p_description), '') is null or length(btrim(p_description)) > 1200 then
    raise exception 'Invalid business description';
  end if;

  if p_earn_percent < 0 or p_earn_percent > 100 then
    raise exception 'Invalid earn percentage';
  end if;

  if p_point_value_mzn_minor <= 0 then
    raise exception 'Invalid point value';
  end if;

  if p_maximum_redemption_percent < 0 or p_maximum_redemption_percent > 100 then
    raise exception 'Invalid maximum redemption percentage';
  end if;

  if p_points_expire_after_days is not null and p_points_expire_after_days <= 0 then
    raise exception 'Invalid points expiry';
  end if;

  perform 1
  from public.businesses b
  where b.id = p_business_id
  for update;

  if not found then
    raise exception 'Business not found';
  end if;

  perform 1
  from public.business_categories bc
  where bc.id = p_category_id
    and bc.is_active;

  if not found then
    raise exception 'Active business category not found';
  end if;

  update public.businesses
  set
    category_id = p_category_id,
    name = btrim(p_name),
    description = btrim(p_description),
    phone = nullif(btrim(p_phone), ''),
    email = nullif(btrim(p_email), ''),
    website_url = nullif(btrim(p_website_url), '')
  where id = p_business_id;

  insert into public.loyalty_programs (
    business_id,
    name,
    status,
    earn_rate,
    point_value_mzn_minor,
    maximum_redemption_percent,
    points_expire_after_days,
    terms
  )
  values (
    p_business_id,
    coalesce(nullif(btrim(p_program_name), ''), 'Pontos ' || btrim(p_name)),
    'active',
    p_earn_percent / 100,
    p_point_value_mzn_minor,
    p_maximum_redemption_percent,
    p_points_expire_after_days,
    nullif(btrim(p_program_terms), '')
  )
  on conflict (business_id) do update
  set
    name = excluded.name,
    earn_rate = excluded.earn_rate,
    point_value_mzn_minor = excluded.point_value_mzn_minor,
    maximum_redemption_percent = excluded.maximum_redemption_percent,
    points_expire_after_days = excluded.points_expire_after_days,
    terms = excluded.terms
  returning id into v_program_id;

  if p_branch_id is not null then
    update public.branches
    set
      name = btrim(p_branch_name),
      phone = nullif(btrim(p_branch_phone), ''),
      email = nullif(btrim(p_branch_email), ''),
      address_line = nullif(btrim(p_branch_address_line), ''),
      city = btrim(p_branch_city),
      province = nullif(btrim(p_branch_province), '')
    where id = p_branch_id
      and business_id = p_business_id;

    if not found then
      raise exception 'Business branch not found';
    end if;
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
    v_actor_profile_id,
    'update',
    'business_configuration',
    p_business_id,
    jsonb_build_object(
      'categoryId', p_category_id,
      'programId', v_program_id,
      'branchId', p_branch_id,
      'earnPercent', p_earn_percent,
      'pointValueMznMinor', p_point_value_mzn_minor,
      'maximumRedemptionPercent', p_maximum_redemption_percent
    ),
    jsonb_build_object('source', 'business_settings')
  );
end;
$$;

revoke all on function public.update_business_configuration(
  uuid, uuid, text, text, text, text, text, text, numeric, integer,
  numeric, integer, text, uuid, text, text, text, text, text, text
) from public, anon;
grant execute on function public.update_business_configuration(
  uuid, uuid, text, text, text, text, text, text, numeric, integer,
  numeric, integer, text, uuid, text, text, text, text, text, text
) to authenticated;
