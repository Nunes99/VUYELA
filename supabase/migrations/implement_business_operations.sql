-- FASE 27: complete business operations.
-- All privileged writes validate the active business membership and create an audit record.

create or replace function public.get_business_operations(p_business_id uuid)
returns table (
  branches jsonb,
  members jsonb,
  invitations jsonb,
  catalog_items jsonb,
  cards jsonb,
  offers jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_business_id is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to read business operations';
  end if;

  return query
  select
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', br.id::text,
            'slug', br.slug,
            'name', br.name,
            'phone', br.phone,
            'email', br.email::text,
            'addressLine', br.address_line,
            'city', br.city,
            'province', br.province,
            'isPrimary', br.is_primary,
            'isActive', br.is_active,
            'transactionCount', (
              select count(*)::integer
              from public.transactions tx
              where tx.business_id = br.business_id
                and tx.branch_id = br.id
                and tx.status = 'completed'
            ),
            'revenueMznMinor', coalesce((
              select sum(tx.net_amount_mzn_minor)::integer
              from public.transactions tx
              where tx.business_id = br.business_id
                and tx.branch_id = br.id
                and tx.status = 'completed'
            ), 0),
            'memberCount', (
              select count(*)::integer
              from public.business_members bm
              where bm.business_id = br.business_id
                and bm.branch_id = br.id
                and bm.status = 'active'
            )
          )
          order by br.is_primary desc, br.is_active desc, br.name asc
        ),
        '[]'::jsonb
      )
      from public.branches br
      where br.business_id = p_business_id
    ),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', bm.id::text,
            'profileId', bm.profile_id::text,
            'displayName', coalesce(nullif(p.display_name, ''), p.email::text, p.phone, 'Membro VUYELA'),
            'email', p.email::text,
            'phone', p.phone,
            'role', bm.role::text,
            'status', bm.status::text,
            'branchId', bm.branch_id::text,
            'branchName', br.name,
            'joinedAt', bm.joined_at::text
          )
          order by
            case bm.status when 'active' then 0 when 'invited' then 1 else 2 end,
            bm.role asc,
            coalesce(p.display_name, p.email::text, p.phone) asc
        ),
        '[]'::jsonb
      )
      from public.business_members bm
      left join public.profiles p on p.id = bm.profile_id
      left join public.branches br
        on br.id = bm.branch_id
        and br.business_id = bm.business_id
      where bm.business_id = p_business_id
    ),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', bmi.id::text,
            'email', bmi.email::text,
            'phone', bmi.phone,
            'role', bmi.role::text,
            'status', case
              when bmi.status = 'pending' and bmi.expires_at <= now() then 'expired'
              else bmi.status::text
            end,
            'branchId', bmi.branch_id::text,
            'branchName', br.name,
            'expiresAt', bmi.expires_at::text,
            'createdAt', bmi.created_at::text
          )
          order by bmi.created_at desc
        ),
        '[]'::jsonb
      )
      from public.business_member_invitations bmi
      left join public.branches br
        on br.id = bmi.branch_id
        and br.business_id = bmi.business_id
      where bmi.business_id = p_business_id
    ),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', bci.id::text,
            'branchId', bci.branch_id::text,
            'branchName', br.name,
            'kind', bci.kind::text,
            'sku', bci.sku,
            'name', bci.name,
            'description', bci.description,
            'priceMznMinor', bci.price_mzn_minor,
            'isAvailable', bci.is_available,
            'sortOrder', bci.sort_order
          )
          order by bci.is_available desc, bci.sort_order asc, bci.name asc
        ),
        '[]'::jsonb
      )
      from public.business_catalog_items bci
      left join public.branches br
        on br.id = bci.branch_id
        and br.business_id = bci.business_id
      where bci.business_id = p_business_id
    ),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', cc.id::text,
            'profileId', cc.customer_profile_id::text,
            'customerName', coalesce(nullif(cc.display_name, ''), nullif(p.display_name, ''), p.email::text, p.phone, 'Cliente VUYELA'),
            'email', p.email::text,
            'phone', p.phone,
            'cardNumber', cc.card_number,
            'status', cc.status::text,
            'availablePoints', coalesce(pw.available_balance, 0),
            'lifetimeEarned', coalesce(pw.lifetime_earned, 0),
            'lifetimeRedeemed', coalesce(pw.lifetime_redeemed, 0),
            'liabilityMznMinor', coalesce(pw.available_balance * lp.point_value_mzn_minor, 0),
            'joinedAt', cc.joined_at::text,
            'lastTransactionAt', (
              select max(tx.occurred_at)::text
              from public.transactions tx
              where tx.business_id = cc.business_id
                and tx.customer_card_id = cc.id
                and tx.status = 'completed'
            ),
            'transactionCount', (
              select count(*)::integer
              from public.transactions tx
              where tx.business_id = cc.business_id
                and tx.customer_card_id = cc.id
                and tx.status = 'completed'
            ),
            'totalSpentMznMinor', coalesce((
              select sum(tx.net_amount_mzn_minor)::integer
              from public.transactions tx
              where tx.business_id = cc.business_id
                and tx.customer_card_id = cc.id
                and tx.status = 'completed'
            ), 0)
          )
          order by cc.joined_at desc
        ),
        '[]'::jsonb
      )
      from public.customer_cards cc
      left join public.profiles p on p.id = cc.customer_profile_id
      left join public.point_wallets pw
        on pw.customer_card_id = cc.id
        and pw.business_id = cc.business_id
      left join public.loyalty_programs lp
        on lp.id = cc.loyalty_program_id
        and lp.business_id = cc.business_id
      where cc.business_id = p_business_id
    ),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', o.id::text,
            'campaignId', o.campaign_id::text,
            'campaignName', c.name,
            'slug', o.slug,
            'title', o.title,
            'description', o.description,
            'startsAt', o.starts_at::text,
            'endsAt', o.ends_at::text,
            'isPublic', o.is_public,
            'isActive', o.is_active,
            'claimCount', (
              select count(*)::integer
              from public.offer_claims oc
              where oc.business_id = o.business_id
                and oc.offer_id = o.id
            )
          )
          order by o.created_at desc
        ),
        '[]'::jsonb
      )
      from public.offers o
      left join public.campaigns c
        on c.id = o.campaign_id
        and c.business_id = o.business_id
      where o.business_id = p_business_id
    );
end;
$$;

create or replace function public.manage_business_branch(
  p_business_id uuid,
  p_branch_id uuid,
  p_action text,
  p_name text,
  p_slug text,
  p_phone text,
  p_email text,
  p_address_line text,
  p_city text,
  p_province text,
  p_is_primary boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_branch_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_audit_action public.audit_action;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage branches';
  end if;

  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action in ('create', 'update') then
    if char_length(btrim(coalesce(p_name, ''))) not between 2 and 100
      or char_length(btrim(coalesce(p_city, ''))) not between 2 and 100
      or coalesce(p_slug, '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      raise exception 'Invalid branch details';
    end if;
  end if;

  if p_action = 'create' then
    if coalesce(p_is_primary, false)
      or not exists (select 1 from public.branches where business_id = p_business_id) then
      update public.branches set is_primary = false where business_id = p_business_id;
      p_is_primary := true;
    end if;

    insert into public.branches (
      business_id, slug, name, phone, email, address_line, city, province, is_primary, is_active
    )
    values (
      p_business_id,
      btrim(p_slug),
      btrim(p_name),
      nullif(btrim(p_phone), ''),
      nullif(btrim(p_email), ''),
      nullif(btrim(p_address_line), ''),
      btrim(p_city),
      nullif(btrim(p_province), ''),
      coalesce(p_is_primary, false),
      true
    )
    returning id into v_branch_id;
    v_audit_action := 'create';
  elsif p_action = 'update' then
    select to_jsonb(br.*) into v_before
    from public.branches br
    where br.id = p_branch_id and br.business_id = p_business_id
    for update;

    if v_before is null then raise exception 'Branch not found'; end if;

    if coalesce(p_is_primary, false) then
      update public.branches set is_primary = false where business_id = p_business_id;
    end if;

    update public.branches
    set
      slug = btrim(p_slug),
      name = btrim(p_name),
      phone = nullif(btrim(p_phone), ''),
      email = nullif(btrim(p_email), ''),
      address_line = nullif(btrim(p_address_line), ''),
      city = btrim(p_city),
      province = nullif(btrim(p_province), ''),
      is_primary = coalesce(p_is_primary, false)
    where id = p_branch_id and business_id = p_business_id
    returning id into v_branch_id;
    v_audit_action := 'update';
  elsif p_action in ('suspend', 'activate') then
    select to_jsonb(br.*) into v_before
    from public.branches br
    where br.id = p_branch_id and br.business_id = p_business_id
    for update;

    if v_before is null then raise exception 'Branch not found'; end if;
    if p_action = 'suspend' and coalesce((v_before ->> 'is_primary')::boolean, false) then
      raise exception 'Primary branch cannot be suspended';
    end if;

    update public.branches
    set is_active = p_action = 'activate'
    where id = p_branch_id and business_id = p_business_id
    returning id into v_branch_id;
    v_audit_action := case when p_action = 'suspend' then 'suspension' else 'update' end;
  elsif p_action = 'delete' then
    select to_jsonb(br.*) into v_before
    from public.branches br
    where br.id = p_branch_id and br.business_id = p_business_id
    for update;

    if v_before is null then raise exception 'Branch not found'; end if;
    if coalesce((v_before ->> 'is_primary')::boolean, false)
      or coalesce((v_before ->> 'is_active')::boolean, true) then
      raise exception 'Only inactive non-primary branches can be deleted';
    end if;
    if exists (select 1 from public.transactions where business_id = p_business_id and branch_id = p_branch_id)
      or exists (select 1 from public.business_members where business_id = p_business_id and branch_id = p_branch_id)
      or exists (select 1 from public.business_catalog_items where business_id = p_business_id and branch_id = p_branch_id)
      or exists (select 1 from public.pos_terminals where business_id = p_business_id and branch_id = p_branch_id) then
      raise exception 'Branch has operational records and cannot be deleted';
    end if;

    delete from public.branches where id = p_branch_id and business_id = p_business_id;
    v_branch_id := p_branch_id;
    v_audit_action := 'delete';
  else
    raise exception 'Unsupported branch action';
  end if;

  if p_action <> 'delete' then
    select to_jsonb(br.*) into v_after from public.branches br where br.id = v_branch_id;
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id, v_actor, v_audit_action, 'branches', v_branch_id, v_before, v_after,
    jsonb_build_object('source', 'business_operations', 'operation', p_action)
  );

  return v_branch_id;
end;
$$;

create or replace function public.create_business_member_invitation(
  p_business_id uuid,
  p_email text,
  p_phone text,
  p_role public.business_member_role,
  p_branch_id uuid
)
returns table (invitation_id uuid, invitation_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_token text;
  v_invitation_id uuid;
  v_expires_at timestamptz := now() + interval '7 days';
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to invite business members';
  end if;
  if v_email is null and v_phone is null then raise exception 'Invitation recipient is required'; end if;
  if p_role = 'business_owner' then raise exception 'Owner invitations are not supported'; end if;
  if p_role in ('cashier', 'branch_manager') and p_branch_id is null then
    raise exception 'This role requires a branch';
  end if;
  if p_role = 'business_admin' then p_branch_id := null; end if;
  if p_branch_id is not null and not exists (
    select 1 from public.branches
    where id = p_branch_id and business_id = p_business_id and is_active
  ) then
    raise exception 'Active branch not found';
  end if;
  if exists (
    select 1
    from public.business_members bm
    join public.profiles p on p.id = bm.profile_id
    where bm.business_id = p_business_id
      and bm.status <> 'removed'
      and ((v_email is not null and lower(p.email::text) = v_email) or (v_phone is not null and p.phone = v_phone))
  ) then
    raise exception 'Recipient already belongs to this business';
  end if;

  update public.business_member_invitations
  set status = 'revoked', revoked_at = now()
  where business_id = p_business_id
    and status = 'pending'
    and ((v_email is not null and lower(email::text) = v_email) or (v_phone is not null and phone = v_phone));

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.business_member_invitations (
    business_id, branch_id, email, phone, role, token_hash, invited_by, expires_at
  ) values (
    p_business_id,
    p_branch_id,
    v_email,
    v_phone,
    p_role,
    encode(extensions.digest(convert_to(v_token, 'utf8'), 'sha256'), 'hex'),
    v_actor,
    v_expires_at
  ) returning id into v_invitation_id;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, after_data, context
  ) values (
    p_business_id,
    v_actor,
    'create',
    'business_member_invitations',
    v_invitation_id,
    jsonb_build_object('email', v_email, 'phone', v_phone, 'role', p_role, 'branchId', p_branch_id),
    jsonb_build_object('source', 'business_operations')
  );

  return query select v_invitation_id, v_token, v_expires_at;
end;
$$;

create or replace function public.revoke_business_member_invitation(
  p_business_id uuid,
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to revoke invitations';
  end if;

  update public.business_member_invitations
  set status = 'revoked', revoked_at = now()
  where id = p_invitation_id and business_id = p_business_id and status = 'pending';
  if not found then raise exception 'Pending invitation not found'; end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, context
  ) values (
    p_business_id, v_actor, 'update', 'business_member_invitations', p_invitation_id,
    jsonb_build_object('source', 'business_operations', 'operation', 'revoke')
  );
end;
$$;

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
  from public.business_member_invitations bmi
  where bmi.token_hash = encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex')
  for update;

  if not found or v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    raise exception 'Invitation is invalid or expired';
  end if;

  select * into v_profile from public.profiles where id = v_actor;
  if not found then raise exception 'Profile not found'; end if;
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

create or replace function public.manage_business_member(
  p_business_id uuid,
  p_member_id uuid,
  p_action text,
  p_role public.business_member_role,
  p_branch_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_member public.business_members%rowtype;
  v_before jsonb;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage business members';
  end if;

  select * into v_member
  from public.business_members
  where id = p_member_id and business_id = p_business_id
  for update;
  if not found then raise exception 'Business member not found'; end if;
  if v_member.role = 'business_owner' then raise exception 'Business owner cannot be changed here'; end if;
  if v_member.profile_id = v_actor and lower(p_action) in ('suspend', 'remove') then
    raise exception 'You cannot remove your own active access';
  end if;

  v_before := to_jsonb(v_member);
  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action = 'update' then
    if p_role = 'business_owner' then raise exception 'Owner role cannot be assigned here'; end if;
    if p_role in ('cashier', 'branch_manager') and p_branch_id is null then
      raise exception 'This role requires a branch';
    end if;
    if p_role = 'business_admin' then p_branch_id := null; end if;
    if p_branch_id is not null and not exists (
      select 1 from public.branches
      where id = p_branch_id and business_id = p_business_id and is_active
    ) then raise exception 'Active branch not found'; end if;

    update public.business_members
    set role = p_role, branch_id = p_branch_id
    where id = p_member_id;
  elsif p_action = 'suspend' then
    update public.business_members set status = 'suspended' where id = p_member_id;
  elsif p_action = 'activate' then
    update public.business_members set status = 'active', joined_at = coalesce(joined_at, now())
    where id = p_member_id;
  elsif p_action = 'remove' then
    update public.business_members set status = 'removed' where id = p_member_id;
  else
    raise exception 'Unsupported member action';
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    case when p_action = 'suspend' then 'suspension'::public.audit_action else 'permission_change'::public.audit_action end,
    'business_members',
    p_member_id,
    v_before,
    (select to_jsonb(bm.*) from public.business_members bm where bm.id = p_member_id),
    jsonb_build_object('source', 'business_operations', 'operation', p_action)
  );
end;
$$;

create or replace function public.manage_business_catalog_item(
  p_business_id uuid,
  p_item_id uuid,
  p_action text,
  p_branch_id uuid,
  p_kind public.catalog_item_kind,
  p_sku text,
  p_name text,
  p_description text,
  p_price_mzn_minor integer,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_audit_action public.audit_action;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage catalog';
  end if;
  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action in ('create', 'update') then
    if char_length(btrim(coalesce(p_name, ''))) not between 2 and 120
      or coalesce(p_price_mzn_minor, -1) < 0
      or coalesce(p_sort_order, -1) < 0 then
      raise exception 'Invalid catalog item';
    end if;
    if p_branch_id is not null and not exists (
      select 1 from public.branches where id = p_branch_id and business_id = p_business_id and is_active
    ) then raise exception 'Active branch not found'; end if;
  end if;

  if p_action = 'create' then
    insert into public.business_catalog_items (
      business_id, branch_id, kind, sku, name, description, price_mzn_minor, sort_order, created_by
    ) values (
      p_business_id,
      p_branch_id,
      p_kind,
      nullif(upper(btrim(p_sku)), ''),
      btrim(p_name),
      nullif(btrim(p_description), ''),
      p_price_mzn_minor,
      p_sort_order,
      v_actor
    ) returning id into v_item_id;
    v_audit_action := 'create';
  else
    select to_jsonb(i.*) into v_before
    from public.business_catalog_items i
    where i.id = p_item_id and i.business_id = p_business_id
    for update;
    if v_before is null then raise exception 'Catalog item not found'; end if;

    if p_action = 'update' then
      update public.business_catalog_items
      set
        branch_id = p_branch_id,
        kind = p_kind,
        sku = nullif(upper(btrim(p_sku)), ''),
        name = btrim(p_name),
        description = nullif(btrim(p_description), ''),
        price_mzn_minor = p_price_mzn_minor,
        sort_order = p_sort_order
      where id = p_item_id and business_id = p_business_id;
      v_audit_action := 'update';
    elsif p_action in ('activate', 'suspend') then
      update public.business_catalog_items
      set is_available = p_action = 'activate'
      where id = p_item_id and business_id = p_business_id;
      v_audit_action := case when p_action = 'suspend' then 'suspension' else 'update' end;
    elsif p_action = 'delete' then
      delete from public.business_catalog_items where id = p_item_id and business_id = p_business_id;
      v_audit_action := 'delete';
    else
      raise exception 'Unsupported catalog action';
    end if;
    v_item_id := p_item_id;
  end if;

  if p_action <> 'delete' then
    select to_jsonb(i.*) into v_after from public.business_catalog_items i where i.id = v_item_id;
  end if;
  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id, v_actor, v_audit_action, 'business_catalog_items', v_item_id, v_before, v_after,
    jsonb_build_object('source', 'business_operations', 'operation', p_action)
  );
  return v_item_id;
end;
$$;

create or replace function public.manage_customer_card_status(
  p_business_id uuid,
  p_card_id uuid,
  p_action text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage customer cards';
  end if;
  p_action := lower(btrim(coalesce(p_action, '')));
  if p_action in ('block', 'archive') and char_length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A reason with at least five characters is required';
  end if;

  select to_jsonb(cc.*) into v_before
  from public.customer_cards cc
  where cc.id = p_card_id and cc.business_id = p_business_id
  for update;
  if v_before is null then raise exception 'Customer card not found'; end if;

  if p_action = 'block' then
    update public.customer_cards set status = 'blocked', blocked_at = now(), archived_at = null
    where id = p_card_id and business_id = p_business_id;
  elsif p_action = 'activate' then
    update public.customer_cards set status = 'active', blocked_at = null, archived_at = null
    where id = p_card_id and business_id = p_business_id;
  elsif p_action = 'archive' then
    update public.customer_cards set status = 'archived', archived_at = now()
    where id = p_card_id and business_id = p_business_id;
  else
    raise exception 'Unsupported card action';
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    case when p_action = 'block' then 'suspension'::public.audit_action else 'update'::public.audit_action end,
    'customer_cards',
    p_card_id,
    v_before,
    (select to_jsonb(cc.*) from public.customer_cards cc where cc.id = p_card_id),
    jsonb_build_object('source', 'business_operations', 'operation', p_action, 'reason', nullif(btrim(p_reason), ''))
  );
end;
$$;

create or replace function public.manage_campaign_state(
  p_business_id uuid,
  p_campaign_id uuid,
  p_action text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_campaign public.campaigns%rowtype;
  v_result_id uuid;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage campaigns';
  end if;
  select * into v_campaign from public.campaigns
  where id = p_campaign_id and business_id = p_business_id for update;
  if not found then raise exception 'Campaign not found'; end if;
  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action = 'duplicate' then
    insert into public.campaigns (
      business_id, name, status, campaign_type, starts_at, ends_at, rules, audience, created_by
    ) values (
      p_business_id,
      left('Cópia de ' || v_campaign.name, 120),
      'draft',
      v_campaign.campaign_type,
      null,
      null,
      v_campaign.rules,
      v_campaign.audience,
      v_actor
    ) returning id into v_result_id;

    insert into public.campaign_audiences (business_id, campaign_id, customer_card_id, segment_key)
    select business_id, v_result_id, customer_card_id, segment_key
    from public.campaign_audiences
    where business_id = p_business_id and campaign_id = p_campaign_id;
  elsif p_action = 'activate' and v_campaign.status in ('draft', 'scheduled', 'paused') then
    update public.campaigns set status = 'active' where id = p_campaign_id;
    v_result_id := p_campaign_id;
  elsif p_action = 'pause' and v_campaign.status in ('active', 'scheduled') then
    update public.campaigns set status = 'paused' where id = p_campaign_id;
    v_result_id := p_campaign_id;
  elsif p_action = 'resume' and v_campaign.status = 'paused' then
    update public.campaigns
    set status = case when starts_at is not null and starts_at > now() then 'scheduled' else 'active' end
    where id = p_campaign_id;
    v_result_id := p_campaign_id;
  elsif p_action = 'complete' and v_campaign.status in ('active', 'paused') then
    update public.campaigns set status = 'completed' where id = p_campaign_id;
    v_result_id := p_campaign_id;
  elsif p_action = 'cancel' and v_campaign.status not in ('completed', 'cancelled') then
    update public.campaigns set status = 'cancelled' where id = p_campaign_id;
    v_result_id := p_campaign_id;
  else
    raise exception 'Campaign action is not valid for the current status';
  end if;

  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id,
    v_actor,
    case when p_action = 'duplicate' then 'create'::public.audit_action else 'update'::public.audit_action end,
    'campaigns',
    v_result_id,
    to_jsonb(v_campaign),
    (select to_jsonb(c.*) from public.campaigns c where c.id = v_result_id),
    jsonb_build_object('source', 'business_operations', 'operation', p_action, 'sourceCampaignId', p_campaign_id)
  );
  return v_result_id;
end;
$$;

create or replace function public.manage_business_offer(
  p_business_id uuid,
  p_offer_id uuid,
  p_action text,
  p_campaign_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_is_public boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_offer_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_audit_action public.audit_action;
begin
  if p_business_id is null or v_actor is null or not public.can_manage_business(p_business_id) then
    raise exception 'Not authorized to manage offers';
  end if;
  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action in ('create', 'update') then
    if char_length(btrim(coalesce(p_title, ''))) not between 3 and 120
      or char_length(btrim(coalesce(p_description, ''))) < 10
      or coalesce(p_slug, '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or (p_starts_at is not null and p_ends_at is not null and p_ends_at <= p_starts_at) then
      raise exception 'Invalid offer details';
    end if;
    if p_campaign_id is not null and not exists (
      select 1 from public.campaigns where id = p_campaign_id and business_id = p_business_id
    ) then raise exception 'Campaign not found'; end if;
  end if;

  if p_action = 'create' then
    insert into public.offers (
      business_id, campaign_id, slug, title, description, starts_at, ends_at, is_public, is_active
    ) values (
      p_business_id,
      p_campaign_id,
      p_slug,
      btrim(p_title),
      btrim(p_description),
      p_starts_at,
      p_ends_at,
      coalesce(p_is_public, false),
      true
    ) returning id into v_offer_id;
    v_audit_action := 'create';
  else
    select to_jsonb(o.*) into v_before
    from public.offers o
    where o.id = p_offer_id and o.business_id = p_business_id
    for update;
    if v_before is null then raise exception 'Offer not found'; end if;

    if p_action = 'update' then
      update public.offers
      set
        campaign_id = p_campaign_id,
        slug = p_slug,
        title = btrim(p_title),
        description = btrim(p_description),
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        is_public = coalesce(p_is_public, false)
      where id = p_offer_id and business_id = p_business_id;
      v_audit_action := 'update';
    elsif p_action in ('activate', 'suspend') then
      update public.offers set is_active = p_action = 'activate'
      where id = p_offer_id and business_id = p_business_id;
      v_audit_action := case when p_action = 'suspend' then 'suspension' else 'update' end;
    elsif p_action = 'delete' then
      if exists (select 1 from public.offer_claims where business_id = p_business_id and offer_id = p_offer_id) then
        raise exception 'Offer with claims cannot be deleted';
      end if;
      delete from public.offers where id = p_offer_id and business_id = p_business_id;
      v_audit_action := 'delete';
    else
      raise exception 'Unsupported offer action';
    end if;
    v_offer_id := p_offer_id;
  end if;

  if p_action <> 'delete' then
    select to_jsonb(o.*) into v_after from public.offers o where o.id = v_offer_id;
  end if;
  insert into public.audit_logs (
    business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, context
  ) values (
    p_business_id, v_actor, v_audit_action, 'offers', v_offer_id, v_before, v_after,
    jsonb_build_object('source', 'business_operations', 'operation', p_action)
  );
  return v_offer_id;
end;
$$;

revoke all on function public.get_business_operations(uuid) from public, anon;
revoke all on function public.manage_business_branch(uuid, uuid, text, text, text, text, text, text, text, text, boolean) from public, anon;
revoke all on function public.create_business_member_invitation(uuid, text, text, public.business_member_role, uuid) from public, anon;
revoke all on function public.revoke_business_member_invitation(uuid, uuid) from public, anon;
revoke all on function public.accept_business_member_invitation(text) from public, anon;
revoke all on function public.manage_business_member(uuid, uuid, text, public.business_member_role, uuid) from public, anon;
revoke all on function public.manage_business_catalog_item(uuid, uuid, text, uuid, public.catalog_item_kind, text, text, text, integer, integer) from public, anon;
revoke all on function public.manage_customer_card_status(uuid, uuid, text, text) from public, anon;
revoke all on function public.manage_campaign_state(uuid, uuid, text) from public, anon;
revoke all on function public.manage_business_offer(uuid, uuid, text, uuid, text, text, text, timestamptz, timestamptz, boolean) from public, anon;

grant execute on function public.get_business_operations(uuid) to authenticated;
grant execute on function public.manage_business_branch(uuid, uuid, text, text, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.create_business_member_invitation(uuid, text, text, public.business_member_role, uuid) to authenticated;
grant execute on function public.revoke_business_member_invitation(uuid, uuid) to authenticated;
grant execute on function public.accept_business_member_invitation(text) to authenticated;
grant execute on function public.manage_business_member(uuid, uuid, text, public.business_member_role, uuid) to authenticated;
grant execute on function public.manage_business_catalog_item(uuid, uuid, text, uuid, public.catalog_item_kind, text, text, text, integer, integer) to authenticated;
grant execute on function public.manage_customer_card_status(uuid, uuid, text, text) to authenticated;
grant execute on function public.manage_campaign_state(uuid, uuid, text) to authenticated;
grant execute on function public.manage_business_offer(uuid, uuid, text, uuid, text, text, text, timestamptz, timestamptz, boolean) to authenticated;
