-- ============================================
-- 6. AGGIUNGI MEMBRO (non admin)
-- Esegui dopo 01-schema.sql e 02-seed.sql
-- Modifica nome ed emoji prima di eseguire
-- ============================================

INSERT INTO members (name, emoji, role)
VALUES ('NomeMembro', '👤', 'member');

-- Recupera il token del membro appena creato
SELECT token as member_token, name, emoji
FROM members
WHERE name = 'NomeMembro'
ORDER BY created_at DESC
LIMIT 1;

-- Risultato: member_token → URL app: tuodominio.com/enter/[token]
