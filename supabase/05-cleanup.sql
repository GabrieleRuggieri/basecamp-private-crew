-- ============================================
-- 5. CLEANUP — Rimuove tutti i dati utente
-- Mantiene: members, admin_config
-- Storage moments: elimina i file manualmente da Dashboard
-- ============================================

-- 1. Reactions
DELETE FROM reactions;

-- 2. Gym sets
DELETE FROM gym_sets;

-- 3. Gym PRs
DELETE FROM gym_prs;

-- 4. Gym sessions
DELETE FROM gym_sessions;

-- 5. Thoughts
DELETE FROM thoughts;

-- 6. Travels
DELETE FROM travels;

-- 7. Watchlist
DELETE FROM watchlist;

-- 8. Moments
DELETE FROM moments;

-- Poi: Dashboard → Storage → bucket "moments" → elimina tutti i file manualmente
