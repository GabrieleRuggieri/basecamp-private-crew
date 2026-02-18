-- ============================================
-- BASECAMP DB init — esegui nel SQL Editor di Supabase
-- Tabelle: members (token NFC), admin_config, gym, travels, thoughts, watchlist, moments, reactions
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

-- GYM: Sessions
create table gym_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
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
  created_at timestamptz default now()
);

-- GYM: Personal Records
create table gym_prs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  exercise_name text not null,
  weight_kg numeric(5,2),
  reps int,
  achieved_at timestamptz default now(),
  session_id uuid references gym_sessions(id),
  unique(member_id, exercise_name)
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

-- MOMENTS
create table moments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  caption text,
  storage_path text not null,
  taken_at timestamptz default now(),
  location text
);

-- REACTIONS
create table reactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(member_id, target_type, target_id)
);
