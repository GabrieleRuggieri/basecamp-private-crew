# Supabase — Setup BASECAMP

Script SQL numerati per inizializzazione, reset e manutenzione.

## File (ordine di esecuzione)

| File | Cosa fa |
|------|---------|
| **01-schema.sql** | Crea tutte le tabelle |
| **02-seed.sql** | Admin + primo utente (modifica `TuoNome` se serve) |
| **03-storage-public.sql** | Rende il bucket `moments` pubblico (opzionale) |
| **04-reset-and-seed.sql** | Reset completo: svuota e ricrea 1 membro (Gabriele) |
| **05-cleanup.sql** | Svuota dati utente, mantiene members e admin_config |

## Flussi

**Init (progetto nuovo):**  
`01-schema.sql` → `02-seed.sql` → crea bucket `moments` da Dashboard → (opzionale) `03-storage-public.sql`

**Reset completo:**  
`04-reset-and-seed.sql` → copia i token nel `.env` e nei tag NFC

**Cleanup (solo dati):**  
`05-cleanup.sql` → elimina file Storage manualmente
