-- News table for portfolio content (replaces JSON files)
-- Stores bilingual news references with metadata

create table if not exists public.news (
  id bigserial primary key,
  slug text not null unique,
  published_at timestamptz not null,
  source_name text not null,
  source_url text not null unique,
  image_url text,
  category jsonb,
  tags text[] not null default '{}',
  related_project_slugs text[] not null default '{}',
  locales jsonb not null,
  editorial_analysis jsonb,
  is_active boolean not null default true,
  posted_to_x_at timestamptz,
  posted_to_linkedin_at timestamptz,
  x_post_status text not null default 'pending' check (x_post_status in ('pending', 'publishing', 'retry', 'posted', 'dead_letter')),
  x_attempt_count integer not null default 0,
  x_last_attempt_at timestamptz,
  x_next_retry_at timestamptz,
  x_last_error text,
  x_external_post_id text,
  linkedin_post_status text not null default 'pending' check (linkedin_post_status in ('pending', 'publishing', 'retry', 'posted', 'dead_letter')),
  linkedin_attempt_count integer not null default 0,
  linkedin_last_attempt_at timestamptz,
  linkedin_next_retry_at timestamptz,
  linkedin_last_error text,
  linkedin_external_post_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_published_at_idx
  on public.news (published_at desc);

create index if not exists news_slug_idx
  on public.news (slug);

create index if not exists news_active_published_idx
  on public.news (is_active, published_at desc);

create index if not exists news_x_delivery_idx
  on public.news (x_post_status, x_next_retry_at, published_at)
  where posted_to_x_at is null;

create index if not exists news_linkedin_delivery_idx
  on public.news (linkedin_post_status, linkedin_next_retry_at, published_at)
  where posted_to_linkedin_at is null;

-- Trigger to auto-update updated_at on row changes
create or replace function public.update_news_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger news_updated_at_trigger
  before update on public.news
  for each row
  execute function public.update_news_updated_at();
