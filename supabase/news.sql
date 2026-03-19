-- News table for portfolio content (replaces JSON files)
-- Stores bilingual news references with metadata

create table if not exists public.news (
  id bigserial primary key,
  slug text not null unique,
  published_at date not null,
  source_name text not null,
  source_url text not null unique,
  image_url text,
  category jsonb,
  tags text[] not null default '{}',
  related_project_slugs text[] not null default '{}',
  locales jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_published_at_idx
  on public.news (published_at desc);

create index if not exists news_slug_idx
  on public.news (slug);

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
