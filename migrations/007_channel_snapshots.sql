-- Channel-level numbers for the YouTube Partner Program (YPP) progress tracker. One row per channel per (Pacific) day.
create table channel_snapshots (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  snapshot_date date not null,
  subscribers int,                         -- null when the channel hides its subscriber count
  long_watch_minutes_365 numeric not null default 0,   -- long-form + live watch time, trailing 365 days (Shorts watch time does not count toward the 4,000 hours)
  shorts_views_90 bigint not null default 0,           -- Shorts views, trailing 90 days
  long_avg_view_duration_s numeric,                    -- long-form average view duration, trailing 28 days
  long_watch_minutes_28 numeric not null default 0,    -- long-form watch time, trailing 28 days (pace)
  subs_gained_28 int not null default 0,               -- net subscribers gained, trailing 28 days (pace)
  created_at timestamptz not null default now(),
  unique (channel_id, snapshot_date)
);
