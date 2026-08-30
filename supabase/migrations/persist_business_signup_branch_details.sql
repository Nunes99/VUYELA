-- Persist the full four-step business registration in the same transaction
-- that creates the Supabase Auth identity.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_type text := case
    when new.raw_user_meta_data ->> 'account_type' = 'business' then 'business'
    else 'customer'
  end;
  v_registration jsonb := case
    when jsonb_typeof(new.raw_user_meta_data -> 'business_registration') = 'object'
      then new.raw_user_meta_data -> 'business_registration'
    else '{}'::jsonb
  end;
  v_business_name text;
  v_business_slug text;
  v_branch_name text;
  v_city text;
  v_opening_time text;
  v_closing_time text;
  v_opening_hours jsonb;
  v_business_id uuid;
begin
  insert into public.profiles (
    id,
    display_name,
    phone,
    email,
    account_type
  )
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    coalesce(new.phone, nullif(btrim(new.raw_user_meta_data ->> 'phone'), '')),
    new.email,
    v_account_type
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    email = coalesce(public.profiles.email, excluded.email),
    updated_at = now();

  if v_account_type <> 'business' or v_registration = '{}'::jsonb then
    return new;
  end if;

  v_business_name := nullif(btrim(v_registration ->> 'name'), '');
  v_business_slug := nullif(btrim(v_registration ->> 'slug'), '');
  v_branch_name := nullif(btrim(v_registration ->> 'branch_name'), '');
  v_city := nullif(btrim(v_registration ->> 'city'), '');
  v_opening_time := nullif(btrim(v_registration ->> 'opening_time'), '');
  v_closing_time := nullif(btrim(v_registration ->> 'closing_time'), '');

  if
    v_business_name is null
    or v_business_slug is null
    or v_branch_name is null
    or v_city is null
    or nullif(btrim(v_registration ->> 'province'), '') is null
    or nullif(btrim(v_registration ->> 'branch_phone'), '') is null
    or nullif(btrim(v_registration ->> 'address_line'), '') is null
    or nullif(btrim(v_registration ->> 'business_type'), '') is null
    or nullif(btrim(v_registration ->> 'business_sector'), '') is null
  then
    raise exception 'Incomplete business registration';
  end if;

  if v_business_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid business slug';
  end if;

  if
    v_opening_time is null
    or v_closing_time is null
    or v_opening_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or v_closing_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or v_opening_time >= v_closing_time
  then
    raise exception 'Invalid branch opening hours';
  end if;

  v_opening_hours := jsonb_build_object(
    'monday', jsonb_build_array(jsonb_build_object('open', v_opening_time, 'close', v_closing_time)),
    'tuesday', jsonb_build_array(jsonb_build_object('open', v_opening_time, 'close', v_closing_time)),
    'wednesday', jsonb_build_array(jsonb_build_object('open', v_opening_time, 'close', v_closing_time)),
    'thursday', jsonb_build_array(jsonb_build_object('open', v_opening_time, 'close', v_closing_time)),
    'friday', jsonb_build_array(jsonb_build_object('open', v_opening_time, 'close', v_closing_time)),
    'saturday', jsonb_build_array(jsonb_build_object('open', v_opening_time, 'close', v_closing_time))
  );

  insert into public.businesses (
    owner_profile_id,
    slug,
    name,
    legal_name,
    nuit,
    description,
    phone,
    email,
    status
  )
  values (
    new.id,
    v_business_slug,
    v_business_name,
    nullif(btrim(v_registration ->> 'legal_name'), ''),
    nullif(btrim(v_registration ->> 'nuit'), ''),
    nullif(btrim(v_registration ->> 'description'), ''),
    nullif(btrim(v_registration ->> 'phone'), ''),
    coalesce(nullif(btrim(v_registration ->> 'email'), ''), new.email),
    'pending_review'
  )
  returning id into v_business_id;

  insert into public.branches (
    business_id,
    slug,
    name,
    phone,
    email,
    address_line,
    city,
    province,
    is_primary,
    opening_hours,
    timezone
  )
  values (
    v_business_id,
    'principal',
    v_branch_name,
    nullif(btrim(v_registration ->> 'branch_phone'), ''),
    coalesce(nullif(btrim(v_registration ->> 'email'), ''), new.email),
    nullif(btrim(v_registration ->> 'address_line'), ''),
    v_city,
    nullif(btrim(v_registration ->> 'province'), ''),
    true,
    v_opening_hours,
    'Africa/Maputo'
  );

  insert into public.business_members (
    business_id,
    profile_id,
    role,
    status,
    joined_at
  )
  values (
    v_business_id,
    new.id,
    'business_owner',
    'active',
    now()
  );

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    context
  )
  values (
    v_business_id,
    new.id,
    'create',
    'businesses',
    v_business_id,
    jsonb_build_object(
      'source', 'business_account_signup',
      'business_type', nullif(btrim(v_registration ->> 'business_type'), ''),
      'business_sector', nullif(btrim(v_registration ->> 'business_sector'), '')
    )
  );

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
