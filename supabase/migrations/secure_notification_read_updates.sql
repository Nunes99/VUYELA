-- Keep customer read-state updates inside normal RLS instead of a definer boundary.

alter function public.mark_notification_read(uuid) security invoker;

grant update (read_at) on public.notifications to authenticated;

create policy notifications_recipient_update_read_at
on public.notifications
for update
to authenticated
using (
  channel = 'in_app'
  and status in ('sent', 'delivered')
  and (
    profile_id = (select auth.uid())
    or public.owns_customer_card(customer_card_id)
  )
)
with check (
  channel = 'in_app'
  and status in ('sent', 'delivered')
  and (
    profile_id = (select auth.uid())
    or public.owns_customer_card(customer_card_id)
  )
);
