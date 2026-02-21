-- ============================================
-- 3. STORAGE — Rendi il bucket "moments" pubblico
-- Opzionale: l'app usa signed URLs, bucket privato va bene
-- Esegui nel SQL Editor (bucket deve esistere: Dashboard → Storage → New bucket)
-- ============================================

UPDATE storage.buckets SET public = true WHERE id = 'moments';
