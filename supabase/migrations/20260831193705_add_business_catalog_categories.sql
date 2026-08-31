create table public.business_catalog_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_catalog_categories_id_business_unique unique (id, business_id),
  constraint business_catalog_categories_name_length check (
    char_length(btrim(name)) between 2 and 80
  ),
  constraint business_catalog_categories_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint business_catalog_categories_description_length check (
    description is null or char_length(description) <= 240
  ),
  constraint business_catalog_categories_sort_order_non_negative check (sort_order >= 0)
);

create unique index business_catalog_categories_business_slug_unique_idx
on public.business_catalog_categories(business_id, slug);

create index business_catalog_categories_business_active_order_idx
on public.business_catalog_categories(business_id, is_active, sort_order, name);

create trigger business_catalog_categories_set_updated_at
before update on public.business_catalog_categories
for each row execute function public.set_updated_at();

alter table public.business_catalog_items
add column category_id uuid;

alter table public.business_catalog_items
add constraint business_catalog_items_category_business_fk
foreign key (category_id, business_id)
references public.business_catalog_categories(id, business_id)
on delete restrict;

create index business_catalog_items_category_id_idx
on public.business_catalog_items(category_id);

insert into public.business_catalog_categories (
  business_id,
  name,
  slug,
  description,
  sort_order
)
select distinct
  item.business_id,
  case item.kind
    when 'product'::public.catalog_item_kind then 'Produtos'
    else 'Serviços'
  end,
  case item.kind
    when 'product'::public.catalog_item_kind then 'produtos'
    else 'servicos'
  end,
  'Categoria inicial criada a partir do catálogo existente.',
  case item.kind
    when 'product'::public.catalog_item_kind then 200
    else 100
  end
from public.business_catalog_items item
on conflict (business_id, slug) do nothing;

update public.business_catalog_items item
set category_id = category.id
from public.business_catalog_categories category
where category.business_id = item.business_id
  and category.slug = case item.kind
    when 'product'::public.catalog_item_kind then 'produtos'
    else 'servicos'
  end
  and item.category_id is null;

alter table public.business_catalog_categories enable row level security;

revoke all on table public.business_catalog_categories from public, anon, authenticated;
grant select on table public.business_catalog_categories to authenticated;

create policy business_catalog_categories_select_members
on public.business_catalog_categories
for select
to authenticated
using (public.is_business_member(business_id));

create or replace function public.manage_business_catalog_category(
  p_business_id uuid,
  p_category_id uuid,
  p_action text,
  p_name text,
  p_slug text,
  p_description text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_category_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_audit_action public.audit_action;
begin
  if p_business_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to manage catalog categories';
  end if;

  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action in ('create', 'update') then
    p_name := btrim(coalesce(p_name, ''));
    p_slug := lower(btrim(coalesce(p_slug, '')));
    p_description := nullif(btrim(coalesce(p_description, '')), '');

    if char_length(p_name) not between 2 and 80
      or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or char_length(coalesce(p_description, '')) > 240
      or coalesce(p_sort_order, -1) < 0
    then
      raise exception 'Invalid catalog category';
    end if;
  end if;

  if p_action = 'create' then
    insert into public.business_catalog_categories (
      business_id,
      name,
      slug,
      description,
      sort_order,
      created_by
    ) values (
      p_business_id,
      p_name,
      p_slug,
      p_description,
      p_sort_order,
      v_actor
    )
    returning id into v_category_id;
    v_audit_action := 'create';
  else
    select to_jsonb(category.*)
    into v_before
    from public.business_catalog_categories category
    where category.id = p_category_id
      and category.business_id = p_business_id
    for update;

    if v_before is null then
      raise exception 'Catalog category not found';
    end if;

    if p_action = 'update' then
      update public.business_catalog_categories
      set
        name = p_name,
        slug = p_slug,
        description = p_description,
        sort_order = p_sort_order
      where id = p_category_id
        and business_id = p_business_id;
      v_audit_action := 'update';
    elsif p_action in ('activate', 'suspend') then
      update public.business_catalog_categories
      set is_active = p_action = 'activate'
      where id = p_category_id
        and business_id = p_business_id;
      v_audit_action := case
        when p_action = 'suspend' then 'suspension'::public.audit_action
        else 'update'::public.audit_action
      end;
    elsif p_action = 'delete' then
      if exists (
        select 1
        from public.business_catalog_items item
        where item.category_id = p_category_id
          and item.business_id = p_business_id
      ) then
        raise exception 'Catalog category has items';
      end if;

      delete from public.business_catalog_categories
      where id = p_category_id
        and business_id = p_business_id;
      v_audit_action := 'delete';
    else
      raise exception 'Unsupported catalog category action';
    end if;

    v_category_id := p_category_id;
  end if;

  if p_action <> 'delete' then
    select to_jsonb(category.*)
    into v_after
    from public.business_catalog_categories category
    where category.id = v_category_id;
  end if;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    context
  ) values (
    p_business_id,
    v_actor,
    v_audit_action,
    'business_catalog_categories',
    v_category_id,
    v_before,
    v_after,
    jsonb_build_object('source', 'business_operations', 'operation', p_action)
  );

  return v_category_id;
end;
$$;

create or replace function public.manage_business_catalog_item_with_category(
  p_business_id uuid,
  p_item_id uuid,
  p_action text,
  p_branch_id uuid,
  p_category_id uuid,
  p_kind public.catalog_item_kind,
  p_sku text,
  p_name text,
  p_description text,
  p_price_mzn_minor integer,
  p_loyalty_discount_percent numeric,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_item_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_audit_action public.audit_action;
begin
  if p_business_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to manage catalog';
  end if;

  p_action := lower(btrim(coalesce(p_action, '')));

  if p_action in ('create', 'update') then
    if char_length(btrim(coalesce(p_name, ''))) not between 2 and 120
      or coalesce(p_price_mzn_minor, -1) < 0
      or coalesce(p_loyalty_discount_percent, -1) < 0
      or coalesce(p_loyalty_discount_percent, 101) > 100
      or coalesce(p_sort_order, -1) < 0
    then
      raise exception 'Invalid catalog item';
    end if;

    if p_branch_id is not null and not exists (
      select 1
      from public.branches branch
      where branch.id = p_branch_id
        and branch.business_id = p_business_id
        and branch.is_active
    ) then
      raise exception 'Active branch not found';
    end if;

    if p_category_id is not null and not exists (
      select 1
      from public.business_catalog_categories category
      where category.id = p_category_id
        and category.business_id = p_business_id
    ) then
      raise exception 'Catalog category not found';
    end if;
  end if;

  if p_action = 'create' then
    insert into public.business_catalog_items (
      business_id,
      branch_id,
      category_id,
      kind,
      sku,
      name,
      description,
      price_mzn_minor,
      loyalty_discount_percent,
      sort_order,
      created_by
    ) values (
      p_business_id,
      p_branch_id,
      p_category_id,
      p_kind,
      nullif(upper(btrim(p_sku)), ''),
      btrim(p_name),
      nullif(btrim(p_description), ''),
      p_price_mzn_minor,
      p_loyalty_discount_percent,
      p_sort_order,
      v_actor
    )
    returning id into v_item_id;
    v_audit_action := 'create';
  else
    select to_jsonb(item.*)
    into v_before
    from public.business_catalog_items item
    where item.id = p_item_id
      and item.business_id = p_business_id
    for update;

    if v_before is null then
      raise exception 'Catalog item not found';
    end if;

    if p_action = 'update' then
      update public.business_catalog_items
      set
        branch_id = p_branch_id,
        category_id = p_category_id,
        kind = p_kind,
        sku = nullif(upper(btrim(p_sku)), ''),
        name = btrim(p_name),
        description = nullif(btrim(p_description), ''),
        price_mzn_minor = p_price_mzn_minor,
        loyalty_discount_percent = p_loyalty_discount_percent,
        sort_order = p_sort_order
      where id = p_item_id
        and business_id = p_business_id;
      v_audit_action := 'update';
    elsif p_action in ('activate', 'suspend') then
      update public.business_catalog_items
      set is_available = p_action = 'activate'
      where id = p_item_id
        and business_id = p_business_id;
      v_audit_action := case
        when p_action = 'suspend' then 'suspension'::public.audit_action
        else 'update'::public.audit_action
      end;
    elsif p_action = 'delete' then
      delete from public.business_catalog_items
      where id = p_item_id
        and business_id = p_business_id;
      v_audit_action := 'delete';
    else
      raise exception 'Unsupported catalog action';
    end if;

    v_item_id := p_item_id;
  end if;

  if p_action <> 'delete' then
    select to_jsonb(item.*)
    into v_after
    from public.business_catalog_items item
    where item.id = v_item_id;
  end if;

  insert into public.audit_logs (
    business_id,
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    context
  ) values (
    p_business_id,
    v_actor,
    v_audit_action,
    'business_catalog_items',
    v_item_id,
    v_before,
    v_after,
    jsonb_build_object('source', 'business_operations', 'operation', p_action, 'version', 3)
  );

  return v_item_id;
end;
$$;

revoke all on function public.manage_business_catalog_category(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  integer
) from public, anon;
grant execute on function public.manage_business_catalog_category(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  integer
) to authenticated;

revoke all on function public.manage_business_catalog_item_with_category(
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  public.catalog_item_kind,
  text,
  text,
  text,
  integer,
  numeric,
  integer
) from public, anon;
grant execute on function public.manage_business_catalog_item_with_category(
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  public.catalog_item_kind,
  text,
  text,
  text,
  integer,
  numeric,
  integer
) to authenticated;
