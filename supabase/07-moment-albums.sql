-- 7. MOMENT ALBUMS — Cartelle per raggruppare più foto (es. vacanza)
-- Esegui dopo 01-schema.sql se hai già il progetto attivo

-- Tabella album (cartella)
create table if not exists moment_albums (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade not null,
  title text,
  created_at timestamptz default now()
);

-- Colonna album_id su moments (nullable: foto singole restano senza album)
alter table moments add column if not exists album_id uuid references moment_albums(id) on delete cascade;

-- Colonna position per ordine foto nell'album (0 = prima)
alter table moments add column if not exists position int;

-- Indice per query per album
create index if not exists idx_moments_album_id on moments(album_id);
