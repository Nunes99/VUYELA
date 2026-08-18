-- FASE 12 search support: optional public branch opening hours.
-- Empty opening_hours means open status is unknown and search must not infer it.

alter table public.branches
add column opening_hours jsonb not null default '{}'::jsonb,
add column timezone text not null default 'Africa/Maputo',
add constraint branches_opening_hours_object check (jsonb_typeof(opening_hours) = 'object'),
add constraint branches_timezone_format check (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+(?:/[A-Za-z_]+)?$');

comment on column public.branches.opening_hours is
  'Optional public weekly opening hours keyed by weekday, with periods such as [{"open":"08:00","close":"18:00"}]. Empty object means unknown.';

comment on column public.branches.timezone is
  'IANA timezone used to evaluate opening_hours for public search.';
