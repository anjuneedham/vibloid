alter table analytics_snapshots add column if not exists estimated_minutes_watched numeric;
alter table publish_queue add column if not exists published_at timestamptz;
