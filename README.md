# BASECAMP

Private crew space — mobile-first, NFC-only access.

## Stack

- Next.js 14 App Router + TypeScript
- Supabase (database + storage)
- Tailwind CSS + design system Apple-like Dark
- iron-session (cookie auth)
- Recharts (grafici)

## Setup

### 1. Dipendenze

```bash
cp .env.example .env
# Compila .env con Supabase URL, service role key, BASECAMP_SESSION_SECRET (min 32 chars)
# Per dev: aggiungi DEV_NFC_TOKEN con il member_token

npm install
npm run dev
```

### 2. Database Supabase

1. Esegui `supabase/01-schema.sql` nel SQL Editor di Supabase (crea le tabelle).
2. Esegui `supabase/02-seed.sql` per il primo setup:

```sql
INSERT INTO members (name, emoji, role) 
VALUES ('TuoNome', '👑', 'admin');

INSERT INTO admin_config DEFAULT VALUES;

SELECT 'member_token' as type, token as value FROM members WHERE role = 'admin'
UNION ALL
SELECT 'admin_token', admin_token FROM admin_config;
```

3. **Copia entrambi i token** dal risultato:

| type         | value     |
|--------------|-----------|
| member_token | `abc123...` → `/enter/abc123...` (app) |
| admin_token  | `xyz789...` → `/admin/xyz789...` (pannello) |

4. Crea il bucket Storage `moments` (Supabase Dashboard → Storage → New bucket).

### 3. .env

- `member_token` → `DEV_NFC_TOKEN` (per simulare NFC in dev)
- `admin_token` → usalo per accedere a `/admin/[admin_token]`

### 4. Simulazione NFC (dev)

Metti il `member_token` in `DEV_NFC_TOKEN` nel `.env`, poi usa il link "Simula NFC (dev)" sulla landing oppure vai a `/enter/[member_token]`.

## Deploy su Vercel

1. Collega il repo a Vercel
2. Imposta le variabili d'ambiente
3. **Rimuovi** `DEV_NFC_TOKEN` in produzione (o lascialo vuoto)
4. Configura i tag NFC con URL tipo: `https://tuo-dominio.vercel.app/enter/[token]`

## Design System

Apple-like Dark: variabili in `app/globals.css`, estese in `tailwind.config.ts`.

Sezioni: GYM=red / TRAVELS=blue / THOUGHTS=purple / WATCHLIST=orange / MOMENTS=green
