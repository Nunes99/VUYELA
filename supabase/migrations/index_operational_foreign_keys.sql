-- Cover Phase 26 foreign-key lookup paths used by PostgreSQL referential
-- integrity checks and the upcoming operational queries.

create index if not exists business_catalog_items_branch_business_fk_idx
on public.business_catalog_items(branch_id, business_id);
create index if not exists business_catalog_items_created_by_fk_idx
on public.business_catalog_items(created_by);

create index if not exists business_member_invitations_accepted_by_fk_idx
on public.business_member_invitations(accepted_by);
create index if not exists business_member_invitations_branch_business_fk_idx
on public.business_member_invitations(branch_id, business_id);
create index if not exists business_member_invitations_invited_by_fk_idx
on public.business_member_invitations(invited_by);

create index if not exists business_payment_channels_branch_business_fk_idx
on public.business_payment_channels(branch_id, business_id);
create index if not exists business_payment_channels_created_by_fk_idx
on public.business_payment_channels(created_by);

create index if not exists customer_business_preferences_branch_business_fk_idx
on public.customer_business_preferences(preferred_branch_id, business_id);

create index if not exists offer_claims_card_business_profile_fk_idx
on public.offer_claims(customer_card_id, business_id, profile_id);
create index if not exists offer_claims_offer_business_fk_idx
on public.offer_claims(offer_id, business_id);
create index if not exists offer_claims_transaction_business_card_fk_idx
on public.offer_claims(transaction_id, business_id, customer_card_id);

create index if not exists payment_attempts_branch_business_fk_idx
on public.payment_attempts(branch_id, business_id);
create index if not exists payment_attempts_channel_business_method_fk_idx
on public.payment_attempts(payment_channel_id, business_id, method);
create index if not exists payment_attempts_requested_by_fk_idx
on public.payment_attempts(requested_by);
create index if not exists payment_attempts_terminal_business_fk_idx
on public.payment_attempts(terminal_id, business_id);
create index if not exists payment_attempts_transaction_business_fk_idx
on public.payment_attempts(transaction_id, business_id);

create index if not exists platform_settings_updated_by_fk_idx
on public.platform_settings(updated_by);

create index if not exists pos_terminal_devices_terminal_business_fk_idx
on public.pos_terminal_devices(terminal_id, business_id);
create index if not exists pos_terminal_settings_terminal_business_fk_idx
on public.pos_terminal_settings(terminal_id, business_id);
create index if not exists pos_terminals_branch_business_fk_idx
on public.pos_terminals(branch_id, business_id);
create index if not exists pos_terminals_registered_by_fk_idx
on public.pos_terminals(registered_by);

create index if not exists support_ticket_messages_author_profile_fk_idx
on public.support_ticket_messages(author_profile_id);

create index if not exists transaction_payments_attempt_business_method_fk_idx
on public.transaction_payments(payment_attempt_id, business_id, method);
create index if not exists transaction_payments_transaction_business_fk_idx
on public.transaction_payments(transaction_id, business_id);
