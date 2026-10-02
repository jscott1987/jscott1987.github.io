create table if not exists pd_events (
  event_id text primary key,
  event_name text not null,
  anonymous_id text not null,
  occurred_at timestamptz not null,
  path text not null,
  title text,
  properties jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pd_events_occurred_at_idx on pd_events (occurred_at desc);
create index if not exists pd_events_event_name_idx on pd_events (event_name, occurred_at desc);
create index if not exists pd_events_path_idx on pd_events (path, occurred_at desc);

create table if not exists pd_leads (
  lead_id text primary key,
  created_at timestamptz not null default now(),
  name text,
  phone text,
  email text,
  breed text,
  puppy_key text,
  puppy_name text,
  timing text,
  notes text,
  source_path text not null,
  anonymous_id text,
  attribution jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed','lost','spam'))
);
create index if not exists pd_leads_created_at_idx on pd_leads (created_at desc);
create index if not exists pd_leads_status_idx on pd_leads (status, created_at desc);
create index if not exists pd_leads_breed_idx on pd_leads (breed, created_at desc);
