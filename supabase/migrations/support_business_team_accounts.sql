-- Keep invited team members inside the business identity boundary without
-- provisioning an unrelated business for their account.

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

create or replace function public.validate_business_member_invitation(
  p_token text,
  p_email text,
  p_phone text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    char_length(coalesce(p_token, '')) = 48
    and exists (
      select 1
      from public.business_member_invitations as invitation
      where invitation.token_hash = encode(
          extensions.digest(convert_to(p_token, 'utf8'), 'sha256'),
          'hex'
        )
        and invitation.status = 'pending'
        and invitation.expires_at > now()
        and (
          (
            invitation.email is not null
            and lower(invitation.email::text) = lower(nullif(btrim(p_email), ''))
          )
          or (
            invitation.phone is not null
            and invitation.phone = nullif(btrim(p_phone), '')
          )
        )
    );
$$;

revoke all on function public.validate_business_member_invitation(text, text, text) from public;
grant execute on function public.validate_business_member_invitation(text, text, text)
to anon, authenticated;

create or replace function public.accept_business_member_invitation(p_token text)
returns table (business_id uuid, member_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_invitation public.business_member_invitations%rowtype;
  v_profile public.profiles%rowtype;
  v_member_id uuid;
begin
  if v_actor is null or char_length(coalesce(p_token, '')) <> 48 then
    raise exception 'Invalid invitation';
  end if;

  select * into v_invitation
  from public.business_member_invitations as invitation
  where invitation.token_hash = encode(
    extensions.digest(convert_to(p_token, 'utf8'), 'sha256'),
    'hex'
  )
  for update;

  if not found or v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    raise exception 'Invitation is invalid or expired';
  end if;

  select * into v_profile from public.profiles where id = v_actor;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.account_type <> 'business' then
    raise exception 'Business account required';
  end if;
  if not (
    (v_invitation.email is not null and lower(v_profile.email::text) = lower(v_invitation.email::text))
    or (v_invitation.phone is not null and v_profile.phone = v_invitation.phone)
  ) then
    raise exception 'Invitation does not belong to this account';
  end if;

  insert into public.business_members (
    business_id, branch_id, profile_id, role, status, invited_by, invited_at, joined_at
  ) values (
    v_invitation.business_id,
    v_invitation.branch_id,
    v_actor,
    v_invitation.role,
    'active',
    v_invitation.invited_by,
    v_invitation.created_at,
    now()
  )
  on conflict (business_id, profile_id) do update
  set
    branch_id = excluded.branch_id,
    role = excluded.role,
    status = 'active',
    invited_by = excluded.invited_by,
    joined_at = now()
  returning id into v_member_id;

  update public.business_member_invitations
  set status = 'accepted', accepted_by = v_actor, accepted_at = now()
  where id = v_invitation.id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, after_data, context
  ) values (
    v_invitation.business_id,
    v_actor,
    'permission_change',
    'business_members',
    v_member_id,
    jsonb_build_object('role', v_invitation.role, 'branchId', v_invitation.branch_id),
    jsonb_build_object('source', 'business_invitation', 'invitationId', v_invitation.id)
  );

  return query select v_invitation.business_id, v_member_id;
end;
$$;

revoke all on function public.accept_business_member_invitation(text) from public, anon;
grant execute on function public.accept_business_member_invitation(text) to authenticated;
