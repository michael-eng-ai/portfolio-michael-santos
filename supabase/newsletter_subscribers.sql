create table if not exists public.newsletter_subscribers (
  id bigserial primary key,
  email text not null unique,
  locale text not null check (locale in ('en', 'pt')),
  source text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);
