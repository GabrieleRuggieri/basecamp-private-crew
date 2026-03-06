-- ============================================
-- 1. TABELLE — Crea tutte le tabelle
-- Esegui per primo nel SQL Editor di Supabase
-- ============================================

-- Members
create table members (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  name text not null,
  emoji text default '👤',
  role text default 'member' check (role in ('admin', 'member')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Admin config
create table admin_config (
  id int primary key default 1,
  admin_token text unique not null default encode(gen_random_bytes(32), 'hex')
);

-- TRAINING: Sessions (gym, tricking, calisthenics, running)
create table gym_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  type text default 'gym' check (type in ('gym', 'tricking', 'calisthenics', 'running')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_minutes int,
  mood int check (mood between 1 and 5),
  note text
);

-- GYM: Sets
create table gym_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references gym_sessions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  exercise_name text not null,
  weight_kg numeric(5,2),
  reps int,
  set_number int,
  km_distance numeric(6,3),
  pace_min_km numeric(5,2),
  created_at timestamptz default now()
);

-- TRAINING: Personal Records (per type: gym, tricking, calisthenics, running)
create table gym_prs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  exercise_name text not null,
  type text default 'gym' check (type in ('gym', 'tricking', 'calisthenics', 'running')),
  weight_kg numeric(5,2),
  reps int,
  achieved_at timestamptz default now(),
  session_id uuid references gym_sessions(id),
  unique(member_id, exercise_name, type)
);

-- TRAVELS
create table travels (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  title text not null,
  location text not null,
  country_emoji text,
  status text default 'visited' check (status in ('visited', 'wishlist')),
  year int,
  note text,
  created_at timestamptz default now()
);

-- THOUGHTS
create table thoughts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  content text not null,
  mood_tag text,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- THOUGHT_TAGS: side_quest, riflessione, proposta (uno o più per pensiero)
create table thought_tags (
  id uuid primary key default gen_random_uuid(),
  thought_id uuid references thoughts(id) on delete cascade,
  tag text not null check (tag in ('side_quest', 'riflessione', 'proposta')),
  unique(thought_id, tag)
);

-- WATCHLIST
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  title text not null,
  type text check (type in ('movie', 'series', 'book', 'podcast', 'other')),
  status text default 'want' check (status in ('want', 'doing', 'done')),
  rating int check (rating between 1 and 5),
  note text,
  added_at timestamptz default now(),
  completed_at timestamptz
);

-- MOMENT_ALBUMS: cartelle per raggruppare più foto (es. vacanza)
create table moment_albums (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  title text,
  created_at timestamptz default now()
);

-- MOMENTS
create table moments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  album_id uuid references moment_albums(id) on delete cascade,
  position int,
  caption text,
  storage_path text not null,
  taken_at timestamptz default now(),
  location text
);

create index idx_moments_album_id on moments(album_id);

-- REACTIONS (emoji o commento, uno per membro per target)
create table reactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  emoji text,
  comment text,
  created_at timestamptz default now(),
  check ((emoji is not null and comment is null) or (emoji is null and comment is not null)),
  unique(member_id, target_type, target_id)
);
