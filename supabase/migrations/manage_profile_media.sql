begin;

alter table public.profiles
  add column if not exists avatar_path text;

comment on column public.profiles.avatar_path is
  'Private profile-media object path. Signed delivery URLs are generated on demand.';

do $$
begin
  alter table public.profiles
    add constraint profiles_avatar_path_contract check (
      avatar_path is null
      or (
        split_part(avatar_path, '/', 1) = id::text
        and split_part(avatar_path, '/', 2) = 'avatar'
        and avatar_path ~ '^[0-9a-f-]{36}/avatar/[0-9a-f-]{36}\.(jpg|png|webp)$'
      )
    );
exception
  when duplicate_object then null;
end
$$;

grant update (avatar_path)
on public.profiles
to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-media',
  'profile-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_media_owner_select on storage.objects;
create policy profile_media_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-media'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and coalesce((storage.foldername(name))[2], '') = 'avatar'
);

drop policy if exists profile_media_owner_insert on storage.objects;
create policy profile_media_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and coalesce((storage.foldername(name))[2], '') = 'avatar'
  and owner_id = (select auth.uid())::text
);

drop policy if exists profile_media_owner_update on storage.objects;
create policy profile_media_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-media'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and coalesce((storage.foldername(name))[2], '') = 'avatar'
)
with check (
  bucket_id = 'profile-media'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and coalesce((storage.foldername(name))[2], '') = 'avatar'
  and owner_id = (select auth.uid())::text
);

drop policy if exists profile_media_owner_delete on storage.objects;
create policy profile_media_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-media'
  and coalesce((storage.foldername(name))[1], '') = (select auth.uid())::text
  and coalesce((storage.foldername(name))[2], '') = 'avatar'
);

commit;
