-- Enable Row Level Security (RLS) on every public table.
--
-- These tables shipped with RLS disabled, so anyone holding the project URL +
-- anon key could read, edit, or delete their contents. Supabase flagged this as
-- a critical "Table publicly accessible" issue. newsletter_subscribers stores
-- email addresses (PII / LGPD), which makes closing this urgent.
--
-- Safe to apply: the application connects only with the SERVICE ROLE key
-- (see lib/supabase.ts), which bypasses RLS, and no anon/public Supabase key is
-- used anywhere client-side. Enabling RLS with NO policies therefore denies the
-- anon and authenticated roles by default while leaving the app unaffected.
--
-- Idempotent: `enable row level security` is a no-op when already enabled. Run
-- this in the Supabase SQL editor to fix the live project; it also documents the
-- intended state for the schema going forward.

alter table public.news enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.analytics_events enable row level security;
alter table public.bot_state enable row level security;
alter table public.worker_runs enable row level security;
