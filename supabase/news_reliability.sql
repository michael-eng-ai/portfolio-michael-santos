alter table public.news
  alter column published_at type timestamptz
  using case
    when published_at::text ~ '^\d{4}-\d{2}-\d{2}$'
      then (published_at::text || 'T00:00:00Z')::timestamptz
    else published_at::timestamptz
  end;

alter table public.news add column if not exists editorial_analysis jsonb;
alter table public.news add column if not exists posted_to_x_at timestamptz;
alter table public.news add column if not exists posted_to_linkedin_at timestamptz;
alter table public.news add column if not exists x_post_status text not null default 'pending';
alter table public.news add column if not exists x_attempt_count integer not null default 0;
alter table public.news add column if not exists x_last_attempt_at timestamptz;
alter table public.news add column if not exists x_next_retry_at timestamptz;
alter table public.news add column if not exists x_last_error text;
alter table public.news add column if not exists x_external_post_id text;
alter table public.news add column if not exists linkedin_post_status text not null default 'pending';
alter table public.news add column if not exists linkedin_attempt_count integer not null default 0;
alter table public.news add column if not exists linkedin_last_attempt_at timestamptz;
alter table public.news add column if not exists linkedin_next_retry_at timestamptz;
alter table public.news add column if not exists linkedin_last_error text;
alter table public.news add column if not exists linkedin_external_post_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'news_x_post_status_check'
  ) then
    alter table public.news
      add constraint news_x_post_status_check
      check (x_post_status in ('pending', 'publishing', 'retry', 'posted', 'dead_letter'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'news_linkedin_post_status_check'
  ) then
    alter table public.news
      add constraint news_linkedin_post_status_check
      check (linkedin_post_status in ('pending', 'publishing', 'retry', 'posted', 'dead_letter'));
  end if;
end $$;

update public.news
set
  x_post_status = case
    when posted_to_x_at is not null then 'posted'
    when x_post_status is null then 'pending'
    else x_post_status
  end,
  linkedin_post_status = case
    when posted_to_linkedin_at is not null then 'posted'
    when linkedin_post_status is null then 'pending'
    else linkedin_post_status
  end;

create index if not exists news_active_published_idx
  on public.news (is_active, published_at desc);

create index if not exists news_x_delivery_idx
  on public.news (x_post_status, x_next_retry_at, published_at)
  where posted_to_x_at is null;

create index if not exists news_linkedin_delivery_idx
  on public.news (linkedin_post_status, linkedin_next_retry_at, published_at)
  where posted_to_linkedin_at is null;
