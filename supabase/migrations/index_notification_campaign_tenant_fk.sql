-- Cover the tenant-safe notification campaign foreign key used by campaign operations.

create index if not exists notifications_campaign_business_fk_idx
on public.notifications(campaign_id, business_id)
where campaign_id is not null;
