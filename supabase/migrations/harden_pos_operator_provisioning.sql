-- Remove POS operator provisioning from the browser-authenticated RPC surface.
-- The server-only service role invokes this function after authenticating the business manager.

drop function if exists public.provision_business_pos_operator(uuid, uuid, uuid);

create function public.provision_business_pos_operator(
  p_actor_profile_id uuid,
  p_business_id uuid,
  p_profile_id uuid,
  p_branch_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_member_id uuid;
begin
  if p_actor_profile_id is null
    or p_business_id is null
    or p_profile_id is null
    or p_branch_id is null
    or not exists (
      select 1
      from public.business_members
      where business_id = p_business_id
        and profile_id = p_actor_profile_id
        and status = 'active'
        and role in ('business_admin', 'business_owner')
    )
  then
    raise exception 'Not authorized to provision POS operators';
  end if;

  select * into v_profile
  from public.profiles
  where id = p_profile_id;

  if not found
    or v_profile.account_type <> 'business'
    or v_profile.account_status <> 'active'
    or v_profile.email is null
  then
    raise exception 'Active business profile required';
  end if;

  if not exists (
    select 1
    from public.branches
    where id = p_branch_id
      and business_id = p_business_id
      and is_active
  ) then
    raise exception 'Active branch not found';
  end if;

  if exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and profile_id = p_profile_id
      and status <> 'removed'
  ) then
    raise exception 'Profile already belongs to this business';
  end if;

  insert into public.business_members (
    business_id,
    branch_id,
    profile_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at
  ) values (
    p_business_id,
    p_branch_id,
    p_profile_id,
    'cashier',
    'active',
    p_actor_profile_id,
    now(),
    now()
  )
  on conflict (business_id, profile_id) do update
  set
    branch_id = excluded.branch_id,
    role = 'cashier',
    status = 'active',
    invited_by = p_actor_profile_id,
    invited_at = now(),
    joined_at = now()
  where public.business_members.status = 'removed'
  returning id into v_member_id;

  if v_member_id is null then
    raise exception 'POS operator could not be linked';
  end if;

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
    p_actor_profile_id,
    'permission_change',
    'business_members',
    v_member_id,
    jsonb_build_object(
      'profileId', p_profile_id,
      'role', 'cashier',
      'branchId', p_branch_id,
      'status', 'active'
    ),
    jsonb_build_object(
      'source', 'business_pos_operator_provisioning',
      'credentialsStored', false
    )
  );

  return v_member_id;
end;
$$;

revoke all on function public.provision_business_pos_operator(uuid, uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.provision_business_pos_operator(uuid, uuid, uuid, uuid)
to service_role;

comment on function public.provision_business_pos_operator(uuid, uuid, uuid, uuid) is
  'Service-only POS operator membership provisioning with explicit tenant-manager validation.';
