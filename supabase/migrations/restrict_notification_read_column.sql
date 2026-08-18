-- Remove Supabase default table-wide privileges before exposing recipient read state.

revoke all privileges on table public.notifications from anon, authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;
