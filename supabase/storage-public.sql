-- Rendi il bucket "moments" pubblico così le foto si vedono senza auth
-- Esegui nel SQL Editor di Supabase (Dashboard → SQL Editor)

UPDATE storage.buckets SET public = true WHERE id = 'moments';
