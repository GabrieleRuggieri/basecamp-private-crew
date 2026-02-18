-- ============================================
-- Seed iniziale: primo membro admin, admin_config, recupera token
-- Esegui dopo schema.sql
-- ============================================

-- 1. Inserisci il primo membro (admin)
INSERT INTO members (name, emoji, role) 
VALUES ('TuoNome', '👑', 'admin');

-- 2. Crea la riga admin config
INSERT INTO admin_config DEFAULT VALUES;

-- 3. Recupera i token — COPIALI E SALVALI
SELECT 'member_token' as type, token as value FROM members WHERE role = 'admin'
UNION ALL
SELECT 'admin_token', admin_token FROM admin_config;

-- Risultato:
-- | type         | value      |
-- | member_token | abc123...  | → URL app: tuodominio.com/enter/abc123...
-- | admin_token  | xyz789...  | → Pannello admin: tuodominio.com/admin/xyz789...
