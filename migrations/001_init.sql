create table channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text not null default 'money-motivation',
  youtube_channel_id text,
  youtube_refresh_token text,
  brand jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  url text,
  storage_key text,
  type text not null check (type in ('upload','link')),
  title text,
  creator text,
  rights_status text not null check (rights_status in ('own','licensed','permissioned','commentary_fair_use','unknown')),
  license_note text,
  attribution text,
  status text not null default 'pending' check (status in ('pending','ingesting','ready','reference_only','failed')),
  duration_s numeric,
  error text,
  created_at timestamptz not null default now()
);

create table transcripts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  language text default 'en',
  text text not null,
  words jsonb not null,
  provider text,
  created_at timestamptz not null default now(),
  unique (source_id)
);

create table clips (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  start_s numeric not null,
  end_s numeric not null,
  score int,
  sub_scores jsonb not null default '{}',
  reason text,
  hook_text text,
  topic_tags text[] not null default '{}',
  risk_flags text[] not null default '{}',
  status text not null default 'candidate' check (status in ('candidate','accepted','rejected')),
  reject_feedback text,
  created_at timestamptz not null default now(),
  check (end_s > start_s)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id),
  title text not null,
  format text not null check (format in ('short','long')),
  topic text,
  status text not null default 'draft' check (status in ('draft','scripted','voiced','assembled','rendered','packaged','in_review','approved','scheduled','published','failed')),
  clip_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  version int not null,
  body jsonb not null,
  fact_check_items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text not null check (kind in ('audio','image','video','music','caption','thumbnail','timeline')),
  storage_key text not null,
  license jsonb not null default '{}',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null default 'final' check (kind in ('preview','final')),
  storage_key text not null,
  output_hash text,
  duration_s numeric,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table packaging (
  project_id uuid primary key references projects(id) on delete cascade,
  titles jsonb not null default '[]',
  chosen_title text,
  description text,
  tags text[] not null default '{}',
  thumbnail_concepts jsonb not null default '[]',
  promise_check jsonb,
  updated_at timestamptz not null default now()
);

create table publish_queue (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  render_id uuid references renders(id),
  checklist jsonb not null default '{}',
  approved_by text,
  approved_at timestamptz,
  scheduled_at timestamptz,
  youtube_video_id text,
  status text not null default 'pending' check (status in ('pending','approved','uploading','scheduled','published','failed')),
  error text,
  created_at timestamptz not null default now()
);

create table analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null,
  project_id uuid references projects(id),
  snapshot_date date not null,
  views int not null default 0,
  avg_view_duration_s numeric,
  ctr numeric,
  subs_gained int not null default 0,
  retention jsonb,
  created_at timestamptz not null default now(),
  unique (youtube_video_id, snapshot_date)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}',
  state text not null default 'queued' check (state in ('queued','running','done','failed','dead')),
  attempts int not null default 0,
  max_attempts int not null default 3,
  error text,
  result jsonb,
  locked_by text,
  locked_at timestamptz,
  run_after timestamptz not null default now(),
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index jobs_claim_idx on jobs (run_after) where state = 'queued';

create table job_costs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  provider text not null,
  unit text not null,
  quantity numeric not null,
  cost_usd numeric not null default 0,
  created_at timestamptz not null default now()
);

create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  report jsonb not null,
  created_at timestamptz not null default now()
);
