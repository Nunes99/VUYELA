-- FASE 16 post-deployment hardening.
-- Align the aggregate with the point_ledger.amount schema column.

create or replace function public.admin_get_platform_metrics(
  p_actor_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_platform_actor(
    p_actor_profile_id,
    array['support_agent', 'platform_admin', 'super_admin']::public.profile_role[]
  );

  return jsonb_build_object(
    'totalBusinesses', (select count(*) from public.businesses),
    'pendingBusinesses', (
      select count(*) from public.businesses where status = 'pending_review'
    ),
    'activeBusinesses', (select count(*) from public.businesses where status = 'active'),
    'totalProfiles', (select count(*) from public.profiles),
    'activeSubscriptions', (
      select count(*)
      from public.subscriptions
      where status in ('trialing', 'active')
    ),
    'openSupportTickets', (
      select count(*)
      from public.support_tickets
      where status in ('open', 'in_progress')
    ),
    'unresolvedFraudEvents', (
      select count(*) from public.fraud_events where resolved_at is null
    ),
    'completedTransactions', (
      select count(*) from public.transactions where status = 'completed'
    ),
    'grossVolumeMznMinor', (
      select coalesce(sum(gross_amount_mzn_minor), 0)
      from public.transactions
      where status = 'completed'
    ),
    'pointsIssued', (
      select coalesce(sum(amount), 0)
      from public.point_ledger
      where amount > 0
    ),
    'businessesCreatedLast30Days', (
      select count(*)
      from public.businesses
      where created_at >= now() - interval '30 days'
    ),
    'transactionsLast30Days', (
      select count(*)
      from public.transactions
      where status = 'completed'
        and completed_at >= now() - interval '30 days'
    )
  );
end;
$$;

revoke all privileges on function public.admin_get_platform_metrics(uuid)
from public, anon, authenticated;
grant execute on function public.admin_get_platform_metrics(uuid) to service_role;
