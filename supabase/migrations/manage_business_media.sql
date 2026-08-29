-- Public business media used by the POS, offers, marketplace and receipts.

alter table public.business_catalog_items
  add column image_url text;

alter table public.offers
  add column image_url text;

alter table public.business_catalog_items
  add constraint business_catalog_items_image_url_check
  check (
    image_url is null
    or (
      char_length(image_url) <= 2048
      and image_url ~ '^https://'
    )
  );

alter table public.offers
  add constraint offers_image_url_check
  check (
    image_url is null
    or (
      char_length(image_url) <= 2048
      and image_url ~ '^https://'
    )
  );

comment on column public.business_catalog_items.image_url is
  'Public promotional image for product or service selection in the business portal and POS.';

comment on column public.offers.image_url is
  'Public promotional image uploaded by the managing business.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'business-media',
  'business-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy business_media_manager_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'business-media'
  and coalesce((storage.foldername(name))[1], '') ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.can_manage_business(((storage.foldername(name))[1])::uuid)
);

create policy business_media_manager_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-media'
  and coalesce((storage.foldername(name))[1], '') ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and coalesce((storage.foldername(name))[2], '') in ('catalog', 'offers', 'profile', 'logo')
  and public.can_manage_business(((storage.foldername(name))[1])::uuid)
);

create policy business_media_manager_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'business-media'
  and coalesce((storage.foldername(name))[1], '') ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.can_manage_business(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'business-media'
  and coalesce((storage.foldername(name))[1], '') ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and coalesce((storage.foldername(name))[2], '') in ('catalog', 'offers', 'profile', 'logo')
  and public.can_manage_business(((storage.foldername(name))[1])::uuid)
);

create policy business_media_manager_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-media'
  and coalesce((storage.foldername(name))[1], '') ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.can_manage_business(((storage.foldername(name))[1])::uuid)
);

create or replace function public.set_business_media_url(
  p_business_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_media_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_entity_type text := lower(btrim(coalesce(p_entity_type, '')));
  v_media_url text := nullif(btrim(coalesce(p_media_url, '')), '');
  v_before jsonb;
  v_after jsonb;
  v_entity_table text;
begin
  if p_business_id is null
    or p_entity_id is null
    or v_actor is null
    or not public.can_manage_business(p_business_id)
  then
    raise exception 'Not authorized to manage business media';
  end if;

  if v_media_url is not null and (
    char_length(v_media_url) > 2048
    or v_media_url !~ '^https://[^/]+/storage/v1/object/public/business-media/'
    or position('/business-media/' || p_business_id::text || '/' in v_media_url) = 0
  ) then
    raise exception 'Invalid business media URL';
  end if;

  if v_entity_type = 'catalog' then
    select to_jsonb(item.*)
    into v_before
    from public.business_catalog_items item
    where item.id = p_entity_id
      and item.business_id = p_business_id
    for update;

    if v_before is null then raise exception 'Catalog item not found'; end if;

    update public.business_catalog_items
    set image_url = v_media_url
    where id = p_entity_id
      and business_id = p_business_id;

    select to_jsonb(item.*)
    into v_after
    from public.business_catalog_items item
    where item.id = p_entity_id;
    v_entity_table := 'business_catalog_items';
  elsif v_entity_type = 'offer' then
    select to_jsonb(offer.*)
    into v_before
    from public.offers offer
    where offer.id = p_entity_id
      and offer.business_id = p_business_id
    for update;

    if v_before is null then raise exception 'Offer not found'; end if;

    update public.offers
    set image_url = v_media_url
    where id = p_entity_id
      and business_id = p_business_id;

    select to_jsonb(offer.*)
    into v_after
    from public.offers offer
    where offer.id = p_entity_id;
    v_entity_table := 'offers';
  elsif v_entity_type = 'business_logo' then
    if p_entity_id <> p_business_id then raise exception 'Business media mismatch'; end if;

    select to_jsonb(business.*)
    into v_before
    from public.businesses business
    where business.id = p_business_id
    for update;

    if v_before is null then raise exception 'Business not found'; end if;

    update public.businesses
    set logo_url = v_media_url
    where id = p_business_id;

    select to_jsonb(business.*)
    into v_after
    from public.businesses business
    where business.id = p_business_id;
    v_entity_table := 'businesses';
  elsif v_entity_type = 'business_cover' then
    if p_entity_id <> p_business_id then raise exception 'Business media mismatch'; end if;

    select to_jsonb(business.*)
    into v_before
    from public.businesses business
    where business.id = p_business_id
    for update;

    if v_before is null then raise exception 'Business not found'; end if;

    update public.businesses
    set cover_url = v_media_url
    where id = p_business_id;

    select to_jsonb(business.*)
    into v_after
    from public.businesses business
    where business.id = p_business_id;
    v_entity_table := 'businesses';
  else
    raise exception 'Unsupported business media entity';
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
    'update',
    v_entity_table,
    p_entity_id,
    v_before,
    v_after,
    jsonb_build_object('source', 'business_media', 'mediaType', v_entity_type)
  );
end;
$$;

revoke all on function public.set_business_media_url(uuid, text, uuid, text)
from public, anon;

grant execute on function public.set_business_media_url(uuid, text, uuid, text)
to authenticated;
