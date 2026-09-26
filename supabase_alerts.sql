-- Part 2: live outage alerts. Run once after supabase.sql.
create extension if not exists pg_net with schema extensions;

-- Phones that want alerts, and which areas they follow. Only reachable through register_push().
create table if not exists public.push_tokens (
  token text primary key check (char_length(token) <= 300),
  areas text[] not null default '{}',
  lang text not null default 'bn' check (lang in ('bn', 'en')),
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;

create or replace function public.register_push(p_token text, p_areas text[], p_lang text)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 300 then
    raise exception 'bad token';
  end if;
  insert into push_tokens (token, areas, lang, updated_at)
  values (p_token, coalesce(p_areas[1:10], '{}'), case when p_lang = 'en' then 'en' else 'bn' end, now())
  on conflict (token) do update set areas = excluded.areas, lang = excluded.lang, updated_at = now();
end $fn$;
revoke all on function public.register_push(text, text[], text) from public;
grant execute on function public.register_push(text, text[], text) to anon, authenticated;

-- One row per confirmed outage / restoration. Written only by the trigger below.
create table if not exists public.alerts (
  id bigint generated always as identity primary key,
  area_id text not null,
  kind text not null check (kind in ('out', 'back')),
  phones int not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_count int
);
alter table public.alerts enable row level security;

create table if not exists public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;
insert into public.app_settings values ('notify_url', 'https://cnnextllqufknvhuppya.supabase.co/functions/v1/notify-area')
on conflict (key) do update set value = excluded.value;

-- After every report: 3+ phones say "out" (their latest report, last 30 min) -> outage alert.
-- After an outage alert: 2+ phones say "back" -> power-back alert. At most one outage alert per area every 3 hours.
create or replace function public.check_area_alert() returns trigger
language plpgsql security definer set search_path = public, extensions as $fn$
declare
  n_out int; n_back int; last_kind text; last_at timestamptz; new_id bigint;
begin
  with latest as (
    select distinct on (device_id) status from reports
    where area_id = new.area_id and created_at > now() - interval '30 minutes'
    order by device_id, created_at desc
  )
  select count(*) filter (where status = 'out'), count(*) filter (where status = 'back')
  into n_out, n_back from latest;

  select kind, created_at into last_kind, last_at from alerts
  where area_id = new.area_id order by created_at desc limit 1;

  if n_out >= 3 and n_out > n_back and (last_kind is distinct from 'out' or last_at < now() - interval '3 hours') then
    insert into alerts (area_id, kind, phones) values (new.area_id, 'out', n_out) returning id into new_id;
  elsif last_kind = 'out' and last_at > now() - interval '12 hours' and n_back >= 2 and n_back > n_out then
    insert into alerts (area_id, kind, phones) values (new.area_id, 'back', n_back) returning id into new_id;
  end if;

  if new_id is not null then
    perform net.http_post(
      url := (select value from app_settings where key = 'notify_url'),
      body := jsonb_build_object('alert_id', new_id),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end if;
  return null;
end $fn$;
drop trigger if exists reports_alert on public.reports;
create trigger reports_alert after insert on public.reports for each row execute function public.check_area_alert();
