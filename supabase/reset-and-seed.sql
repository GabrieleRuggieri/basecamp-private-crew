-- ============================================
-- BASECAMP: svuota e ricrea
-- 1 utente (Gabriele) + 1 admin_token
-- Esegui nel SQL Editor di Supabase
-- ============================================

-- 1. Svuota (cascade pulisce le tabelle collegate)
DELETE FROM admin_config;
DELETE FROM members;

-- 2. Crea 1 membro
INSERT INTO members (name, emoji, role) VALUES
  ('Gabriele', '👑', 'admin');

-- 3. Crea admin_config
INSERT INTO admin_config DEFAULT VALUES;

-- 4. Mostra i token — COPIALI E SALVALI
SELECT 
  'admin_token' as tipo, 
  admin_token as valore,
  'URL admin: tuodominio.com/admin/' || admin_token as url
FROM admin_config
UNION ALL
SELECT 
  'member_token' as tipo, 
  token as valore,
  'URL NFC: tuodominio.com/enter/' || token as url
FROM members;
