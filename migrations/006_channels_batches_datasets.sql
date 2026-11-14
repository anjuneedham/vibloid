alter table channels
  add column slug text,
  add column kind text not null default 'attention' check (kind in ('attention','brand')),
  add column disclosure jsonb not null default '{}',
  add column voice jsonb not null default '{}';
create unique index channels_slug_idx on channels (slug) where slug is not null;

create table batches (
  id uuid primary key default gen_random_uuid(),
  plan jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table projects add column batch_id uuid references batches(id) on delete set null;
alter table projects add column pipeline jsonb not null default '{}';

-- Real data behind every on-screen chart. The app never invents numbers: charts only render from rows here.
create table datasets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('ohlc','series')),
  source text not null,
  source_url text,
  as_of date,
  points jsonb not null,
  notes text,
  created_at timestamptz not null default now()
);
