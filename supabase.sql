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

-- Anti-spam: at most 3 reports per phone every 5 minutes, and 30 per day.
create or replace function public.limit_reports() returns trigger language plpgsql as $fn$
begin
  if new.device_id is null then
    raise exception 'device_id required';
  end if;
  if (select count(*) from public.reports where device_id = new.device_id and created_at > now() - interval '5 minutes') >= 3
     or (select count(*) from public.reports where device_id = new.device_id and created_at > now() - interval '1 day') >= 30 then
    raise exception 'too many reports, try again later';
  end if;
  return new;
end $fn$;
drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit before insert on public.reports for each row execute function public.limit_reports();
create index if not exists reports_device_time on public.reports (device_id, created_at desc);
