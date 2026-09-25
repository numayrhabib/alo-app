-- Run once in the Supabase SQL editor to enable shared "Power's out / Power's back" reports.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  area_id text not null check (char_length(area_id) <= 40),
  status text not null check (status in ('out', 'back')),
  device_id text check (char_length(device_id) <= 64),
  created_at timestamptz not null default now()
);
create index if not exists reports_area_time on public.reports (area_id, created_at desc);

alter table public.reports enable row level security;
-- Anyone using the app can add a report and read recent ones; nobody can edit or delete.
create policy "read recent reports" on public.reports for select using (created_at > now() - interval '1 day');
create policy "add a report" on public.reports for insert with check (created_at > now() - interval '1 minute');
