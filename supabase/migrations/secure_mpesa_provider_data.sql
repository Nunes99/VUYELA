-- Make the service-only intent explicit to the database linter and cover the
-- composite provider foreign keys used during reconciliation.

create index payment_provider_contexts_attempt_business_idx
on public.payment_provider_contexts(payment_attempt_id, business_id);

create index payment_provider_events_attempt_business_idx
on public.payment_provider_events(payment_attempt_id, business_id);

create policy payment_provider_contexts_service_role_all
on public.payment_provider_contexts
for all
to service_role
using (true)
with check (true);

create policy payment_provider_events_service_role_all
on public.payment_provider_events
for all
to service_role
using (true)
with check (true);
