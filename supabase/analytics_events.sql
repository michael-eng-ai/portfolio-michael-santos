create table if not exists public.analytics_events (
  id bigserial primary key,
  event_id text not null unique,
  event_name text not null,
  session_id text not null,
  occurred_at timestamptz not null,
  page text,
  locale text check (locale in ('en', 'pt')),
  page_type text,
  source_type text,
  source_slug text,
  target_type text,
  target_slug text,
  location text,
  depth integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_name_occurred_at_idx
  on public.analytics_events (event_name, occurred_at desc);

create index if not exists analytics_events_page_occurred_at_idx
  on public.analytics_events (page, occurred_at desc);

create index if not exists analytics_events_locale_page_type_idx
  on public.analytics_events (locale, page_type, occurred_at desc);

create index if not exists analytics_events_source_idx
  on public.analytics_events (source_type, source_slug, occurred_at desc);
