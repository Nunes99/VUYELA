-- Separate customer, business, and platform identities without changing the
-- existing profile role or loyalty storage contracts.

alter table public.profiles
add column account_type text not null default 'customer';

alter table public.profiles
add constraint profiles_account_type_valid
check (account_type in ('customer', 'business', 'platform'));

update public.profiles as profile
set account_type = case
  when profile.role <> 'customer' then 'platform'
  when exists (
    select 1
    from public.business_members as member
    where member.profile_id = profile.id
      and member.status in ('invited', 'active', 'suspended')
  ) then 'business'
  else 'customer'
end;

create index profiles_account_type_idx on public.profiles(account_type);

comment on column public.profiles.account_type is
  'Persistent portal identity. It never grants business or platform permissions by itself.';

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
  v_registration jsonb := coalesce(new.raw_user_meta_data -> 'business_registration', '{}'::jsonb);
  v_business_name text;
  v_business_slug text;
  v_city text;
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
    new.phone,
    new.email,
    v_account_type
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    email = coalesce(public.profiles.email, excluded.email),
    updated_at = now();

  if v_account_type <> 'business' then
    return new;
  end if;

  v_business_name := nullif(btrim(v_registration ->> 'name'), '');
  v_business_slug := nullif(btrim(v_registration ->> 'slug'), '');
  v_city := nullif(btrim(v_registration ->> 'city'), '');

  if v_business_name is null or v_business_slug is null or v_city is null then
    raise exception 'Incomplete business registration';
  end if;

  if v_business_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid business slug';
  end if;

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
    city,
    province,
    is_primary
  )
  values (
    v_business_id,
    'principal',
    'Principal',
    v_city,
    nullif(btrim(v_registration ->> 'province'), ''),
    true
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
    jsonb_build_object('source', 'business_account_signup')
  );

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create or replace function public.submit_business_onboarding(
  p_slug text,
  p_name text,
  p_legal_name text default null,
  p_nuit text default null,
  p_description text default null,
  p_phone text default null,
  p_email text default null,
  p_city text default null,
  p_province text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_business_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required for business onboarding';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_actor_id
      and account_type = 'business'
      and account_status = 'active'
  ) then
    raise exception 'A business account is required for business onboarding';
  end if;

  if exists (
    select 1
    from public.business_members
    where profile_id = v_actor_id
      and status <> 'removed'
  ) then
    raise exception 'Business account is already provisioned';
  end if;

  if nullif(btrim(p_slug), '') is null
    or nullif(btrim(p_name), '') is null
    or nullif(btrim(p_city), '') is null
  then
    raise exception 'Missing required business onboarding fields';
  end if;

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
    v_actor_id,
    btrim(p_slug),
    btrim(p_name),
    nullif(btrim(p_legal_name), ''),
    nullif(btrim(p_nuit), ''),
    nullif(btrim(p_description), ''),
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_email), ''),
    'pending_review'
  )
  returning id into v_business_id;

  insert into public.branches (business_id, slug, name, city, province, is_primary)
  values (
    v_business_id,
    'principal',
    'Principal',
    btrim(p_city),
    nullif(btrim(p_province), ''),
    true
  );

  insert into public.business_members (business_id, profile_id, role, status, joined_at)
  values (v_business_id, v_actor_id, 'business_owner', 'active', now());

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
    v_actor_id,
    'create',
    'businesses',
    v_business_id,
    jsonb_build_object('source', 'business_onboarding')
  );

  return v_business_id;
end;
$$;

revoke all on function public.submit_business_onboarding(text, text, text, text, text, text, text, text, text)
from public, anon;
grant execute on function public.submit_business_onboarding(text, text, text, text, text, text, text, text, text)
to authenticated;
