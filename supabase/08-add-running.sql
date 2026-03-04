-- ============================================
-- 8. RUNNING — Aggiunge il tipo 'running' al training
-- Esegui nel SQL Editor di Supabase
-- ============================================

-- Aggiunge 'running' al check constraint di gym_sessions
ALTER TABLE gym_sessions
  DROP CONSTRAINT IF EXISTS gym_sessions_type_check,
  ADD CONSTRAINT gym_sessions_type_check
    CHECK (type IN ('gym', 'tricking', 'calisthenics', 'running'));

-- Aggiunge 'running' al check constraint di gym_prs
ALTER TABLE gym_prs
  DROP CONSTRAINT IF EXISTS gym_prs_type_check,
  ADD CONSTRAINT gym_prs_type_check
    CHECK (type IN ('gym', 'tricking', 'calisthenics', 'running'));

-- Colonne specifiche per running in gym_sets (nullable, usate solo dal tipo running)
ALTER TABLE gym_sets
  ADD COLUMN IF NOT EXISTS km_distance numeric(6,3),
  ADD COLUMN IF NOT EXISTS pace_min_km numeric(5,2);
