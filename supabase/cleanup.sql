-- ============================================
-- BASECAMP DB cleanup — rimuove tutti i dati utente
-- Mantiene: members, admin_config
-- Storage moments: pulire manualmente o usare npm run db:cleanup
-- ============================================

-- 1. Reactions (dipende da thoughts, moments, ecc)
DELETE FROM reactions;

-- 2. Gym sets (dipende da gym_sessions)
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

-- 8. Moments — elimina anche i file da Storage
-- Prima elimina i record dal DB
DELETE FROM moments;

-- Poi vai su Supabase Dashboard > Storage > bucket "moments" > elimina tutti i file manualmente
-- oppure usa l'API Storage per svuotare il bucket
