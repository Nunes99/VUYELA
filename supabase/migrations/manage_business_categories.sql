-- Platform-managed marketplace taxonomy with audited writes.

create or replace function public.admin_save_business_category(
  p_actor_profile_id uuid,
  p_category_id uuid,
  p_slug text,
  p_name text,
  p_description text,
  p_sort_order integer,
  p_is_active boolean,
  p_note text,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns public.business_categories
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.business_categories;
  v_after public.business_categories;
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['platform_admin', 'super_admin']::public.profile_role[]
  );

  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(btrim(p_name)) < 2
    or char_length(btrim(p_description)) < 10
    or p_sort_order < 0
    or p_sort_order > 9999
    or char_length(btrim(p_note)) < 4 then
    raise exception 'Invalid business category configuration';
  end if;

  if p_category_id is null then
    insert into public.business_categories (
      slug,
      name,
      description,
      sort_order,
      is_active
    )
    values (
      lower(btrim(p_slug)),
      left(btrim(p_name), 100),
      left(btrim(p_description), 500),
      p_sort_order,
      p_is_active
    )
    returning * into v_after;
  else
    select c.*
    into v_before
    from public.business_categories c
    where c.id = p_category_id
    for update;

    if not found then
      raise exception 'Business category not found';
    end if;

    if not p_is_active
      and v_before.is_active
      and exists (
        select 1
        from public.businesses b
        where b.category_id = p_category_id
      ) then
      raise exception 'Business category is assigned to businesses';
    end if;

    update public.business_categories
    set slug = lower(btrim(p_slug)),
        name = left(btrim(p_name), 100),
        description = left(btrim(p_description), 500),
        sort_order = p_sort_order,
        is_active = p_is_active
    where id = p_category_id
    returning * into v_after;
  end if;

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
    case when p_category_id is null then 'create' else 'update' end::public.audit_action,
    'business_categories',
    v_after.id,
    case when p_category_id is null then null else to_jsonb(v_before) end,
    to_jsonb(v_after),
    p_ip_address,
    left(p_user_agent, 500),
    jsonb_build_object(
      'operation', 'business_category_configuration',
      'note', left(btrim(p_note), 1000)
    )
  );

  return v_after;
end;
$$;

revoke all on function public.admin_save_business_category(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  boolean,
  text,
  inet,
  text
) from public, anon, authenticated;

grant execute on function public.admin_save_business_category(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  boolean,
  text,
  inet,
  text
) to service_role;
