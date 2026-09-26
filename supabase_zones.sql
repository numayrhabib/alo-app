-- Part 3: street-level zones (squares about 150 m wide) and the charging sensor.
-- Run once after supabase.sql and supabase_alerts.sql.
-- A square is (gi, gj) = (round(lat / 0.0015), round(lng / 0.0015)). Exact GPS points are never stored.

alter table public.reports
  add column if not exists gi int,
  add column if not exists gj int,
  add column if not exists source text not null default 'manual',
  add column if not exists occurred_at timestamptz not null default now();
alter table public.reports drop constraint if exists reports_source_check;
alter table public.reports add constraint reports_source_check check (source in ('manual', 'sensor'));
alter table public.reports drop constraint if exists reports_cell_check;
alter table public.reports add constraint reports_cell_check check (
  (gi is null and gj is null) or (gi between 13000 and 18500 and gj between 58000 and 62500));
create index if not exists reports_cell_time on public.reports (gi, gj, created_at desc);

-- Anti-spam, now per source: 3 taps / 5 min, 6 sensor events / 5 min, 60 reports a day.
-- The sensor sends the time the charger lost power; it is trusted only if it is from the last 10 minutes.
create or replace function public.limit_reports() returns trigger language plpgsql as $fn$
begin
  if new.device_id is null then
    raise exception 'device_id required';
  end if;
  if new.occurred_at is null or new.occurred_at > now() + interval '1 minute' or new.occurred_at < now() - interval '10 minutes' then
    new.occurred_at := now();
  end if;
  if (select count(*) from public.reports where device_id = new.device_id and source = new.source
        and created_at > now() - interval '5 minutes') >= (case when new.source = 'sensor' then 6 else 3 end)
     or (select count(*) from public.reports where device_id = new.device_id and created_at > now() - interval '1 day') >= 60 then
    raise exception 'too many reports, try again later';
  end if;
  return new;
end $fn$;

alter table public.alerts
  add column if not exists gi int,
  add column if not exists gj int,
  add column if not exists started_at timestamptz;
create index if not exists alerts_cell_time on public.alerts (gi, gj, created_at desc);

alter table public.push_tokens
  add column if not exists cells text[] not null default '{}',
  add column if not exists last_sent_at timestamptz,
  add column if not exists last_kind text;
create index if not exists push_tokens_cells on public.push_tokens using gin (cells);

create or replace function public.register_push_v2(p_token text, p_areas text[], p_cells text[], p_lang text)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if p_token is null or char_length(p_token) < 20 or char_length(p_token) > 300 then
    raise exception 'bad token';
  end if;
  if exists (select 1 from unnest(coalesce(p_cells, '{}')) x where x !~ '^[0-9]{5}:[0-9]{5}$') then
    raise exception 'bad cell';
  end if;
  insert into push_tokens (token, areas, cells, lang, updated_at)
  values (p_token, coalesce(p_areas[1:10], '{}'), coalesce(p_cells[1:10], '{}'),
          case when p_lang = 'en' then 'en' else 'bn' end, now())
  on conflict (token) do update
    set areas = excluded.areas, cells = excluded.cells, lang = excluded.lang, updated_at = now();
end $fn$;
revoke all on function public.register_push_v2(text, text[], text[], text) from public;
grant execute on function public.register_push_v2(text, text[], text[], text) to anon, authenticated;

-- After every report. Street level: phones in the 3x3 squares around the report (about 450 m across).
-- A tap counts right away. A sensor "out" counts only if another phone nearby lost power within 3 minutes
-- (one person unplugging their phone is not a power cut). 3 phones = outage alert; then 2 "back" = restored.
create or replace function public.check_area_alert() returns trigger
language plpgsql security definer set search_path = public, extensions as $fn$
declare
  n_out int; n_back int; last_kind text; last_at timestamptz; new_id bigint; t_start timestamptz;
begin
  if new.gi is null then
    -- older app versions: whole-area rule
    with latest as (
      select distinct on (device_id) status from reports
      where area_id = new.area_id and gi is null and created_at > now() - interval '30 minutes'
      order by device_id, created_at desc
    )
    select count(*) filter (where status = 'out'), count(*) filter (where status = 'back')
    into n_out, n_back from latest;

    select kind, created_at into last_kind, last_at from alerts
    where area_id = new.area_id and gi is null order by created_at desc limit 1;

    if n_out >= 3 and n_out > n_back and (last_kind is distinct from 'out' or last_at < now() - interval '3 hours') then
      insert into alerts (area_id, kind, phones, started_at) values (new.area_id, 'out', n_out, now()) returning id into new_id;
    elsif last_kind = 'out' and last_at > now() - interval '12 hours' and n_back >= 2 and n_back > n_out then
      insert into alerts (area_id, kind, phones, started_at) values (new.area_id, 'back', n_back, now()) returning id into new_id;
    end if;
  else
    with near as (
      select device_id, status, source, occurred_at from reports
      where gi between new.gi - 1 and new.gi + 1 and gj between new.gj - 1 and new.gj + 1
        and created_at > now() - interval '30 minutes'
    ), latest as (
      select distinct on (device_id) device_id, status, source, occurred_at from near
      order by device_id, occurred_at desc
    )
    select
      count(*) filter (where l.status = 'out' and (l.source = 'manual' or exists (
        select 1 from near n where n.device_id <> l.device_id and n.status = 'out'
          and abs(extract(epoch from n.occurred_at - l.occurred_at)) <= 180))),
      count(*) filter (where l.status = 'back'),
      min(l.occurred_at) filter (where l.status = 'out')
    into n_out, n_back, t_start from latest l;

    select kind, created_at into last_kind, last_at from alerts
    where gi between new.gi - 1 and new.gi + 1 and gj between new.gj - 1 and new.gj + 1
    order by created_at desc limit 1;

    if n_out >= 3 and n_out > n_back and (last_kind is distinct from 'out' or last_at < now() - interval '3 hours') then
      insert into alerts (area_id, kind, phones, gi, gj, started_at)
      values (new.area_id, 'out', n_out, new.gi, new.gj, t_start) returning id into new_id;
    elsif last_kind = 'out' and last_at > now() - interval '12 hours' and n_back >= 2 and n_back > n_out then
      insert into alerts (area_id, kind, phones, gi, gj, started_at)
      values (new.area_id, 'back', n_back, new.gi, new.gj, now()) returning id into new_id;
    end if;
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

-- Street groups, learned: squares (not next to each other) whose outages started within 3 minutes of
-- each other on 3 or more different days are almost certainly on the same line. Their people get each
-- other's alerts. Rebuilt every night at 3:10 AM Bangladesh time.
create table if not exists public.cell_links (
  a text not null,
  b text not null,
  days int not null,
  updated_at timestamptz not null default now(),
  primary key (a, b)
);
alter table public.cell_links enable row level security;

create or replace function public.refresh_cell_links() returns void
language plpgsql security definer set search_path = public as $fn$
begin
  delete from cell_links;
  insert into cell_links (a, b, days)
  select x.gi || ':' || x.gj, y.gi || ':' || y.gj, count(distinct (x.started_at at time zone 'Asia/Dhaka')::date)
  from alerts x
  join alerts y on y.kind = 'out' and y.gi is not null and y.id <> x.id
    and (abs(x.gi - y.gi) > 1 or abs(x.gj - y.gj) > 1)
    and abs(x.gi - y.gi) <= 30 and abs(x.gj - y.gj) <= 30
    and abs(extract(epoch from y.started_at - x.started_at)) <= 180
  where x.kind = 'out' and x.gi is not null and x.started_at > now() - interval '60 days'
  group by 1, 2
  having count(distinct (x.started_at at time zone 'Asia/Dhaka')::date) >= 3;
end $fn$;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('alo-cell-links', '10 21 * * *', 'select public.refresh_cell_links()');
