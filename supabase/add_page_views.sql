-- Total-visit counter, shown as a stat in /admin. One row per Home page
-- load — a plain count, not unique visitors. Run this once in the
-- Supabase SQL editor (same place schema.sql was run).

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on public.page_views to anon, authenticated;

grant usage on schema public to service_role;
grant select on public.page_views to service_role;

-- Anyone can log a visit; nobody but the service-role admin client can
-- read them back (no public select policy is defined).
create policy "Public can log a page view"
  on public.page_views for insert
  to anon, authenticated
  with check (true);
