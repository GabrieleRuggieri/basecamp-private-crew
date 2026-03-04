# BASECAMP

Private crew space — mobile-first, NFC-only access. A shared app for a closed group: training logs, thoughts, travels, watchlist, and photo moments.

## Features

- **Training** — Gym (sets/reps/weight), Tricking, Calisthenics, Running (km + pace). Session timer, finish with mood + notes. Cancel session without saving. Only one active session at a time (running or gym/tricking/calisthenics); starting another type shows a block with “Go to session” or “Cancel” the other.
- **Thoughts** — Posts with tags (Side quest, Reflection, Proposal), optional anonymous. Reactions and comments.
- **Travels** — Visited / Wishlist with title, location, country emoji, year, notes.
- **Watchlist** — Movies, series, books, podcasts. Want / Doing / Done tabs and type filter.
- **Moments** — Single photos or albums (folder). Upload to Supabase Storage.
- **Feed** — Unified feed on home (Thoughts, Training, Travels, Watchlist, Moments). “See all” per section.
- **Crew** — Per training type: members with PR count, sessions, comments and reactions.

## Stack

- **Next.js 14** App Router + TypeScript
- **Supabase** — PostgreSQL database + Storage (moments)
- **Tailwind CSS** — Apple-like dark design system
- **iron-session** — Cookie-based auth (no Supabase Auth)
- **Recharts** — Charts (e.g. training progress)

## Setup

### 1. Dependencies

```bash
cp .env.example .env
# Fill .env: Supabase URL, service role key, BASECAMP_SESSION_SECRET (min 32 chars)
# For dev: set DEV_NFC_TOKEN to a member_token to simulate NFC

npm install
npm run dev
```

### 2. Supabase database

Run the SQL scripts in order in the Supabase SQL Editor:

| Script | Purpose |
|--------|---------|
| `supabase/01-schema.sql` | Tables (members, admin_config, thoughts, gym_sessions, gym_sets, travels, watchlist, moments, albums, reactions, etc.) |
| `supabase/02-seed.sql` | Initial admin + admin_config row |
| `supabase/03-storage-public.sql` | Storage bucket and RLS for moments |
| `supabase/04-reset-and-seed.sql` | Optional: reset + seed (training, thoughts, etc.) |
| `supabase/05-cleanup.sql` | Optional: cleanup helpers |
| `supabase/06-add-member.sql` | Optional: add member + token |
| `supabase/07-moment-albums.sql` | Albums for grouping moments |
| `supabase/08-add-running.sql` | Running sessions support |

**First-time setup after 01 and 02:**

```sql
INSERT INTO members (name, emoji, role)
VALUES ('YourName', '👑', 'admin');

INSERT INTO admin_config DEFAULT VALUES;

SELECT 'member_token' AS type, token AS value FROM members WHERE role = 'admin'
UNION ALL
SELECT 'admin_token', admin_token FROM admin_config;
```

Copy both tokens from the result:

| type         | value     | Use |
|--------------|-----------|-----|
| member_token | `abc123...` | App entry: `/enter/abc123...` |
| admin_token  | `xyz789...` | Admin panel: `/admin/xyz789...` |

Create the Storage bucket **moments** in Supabase (Dashboard → Storage → New bucket) if not created by `03-storage-public.sql`.

### 3. Environment variables

- **NEXT_PUBLIC_SUPABASE_URL** — Supabase project URL  
- **SUPABASE_SERVICE_ROLE_KEY** — Service role key (server-only)  
- **BASECAMP_SESSION_SECRET** — Min 32 characters for iron-session  
- **DEV_NFC_TOKEN** — (Optional) Member token to simulate NFC in development. Leave unset or empty in production.

### 4. NFC simulation (dev)

Set `DEV_NFC_TOKEN` in `.env` to a `member_token`. On the landing page use the “Simulate NFC” link or go to `/enter/[member_token]`.

## Deploy (Vercel)

1. Connect the repo to Vercel.  
2. Add environment variables (no `DEV_NFC_TOKEN` in production, or leave it empty).  
3. Configure NFC tags with URL: `https://your-domain.vercel.app/enter/[token]`.

## Design system

- **Theme:** Apple-like dark. Variables in `app/globals.css`, extended in `tailwind.config.ts`.  
- **Section accents:** Training = red, Travels = blue, Thoughts = purple, Watchlist = orange, Moments = green.

## Project structure

- `app/` — App Router: landing (`/`), `/enter/[token]`, `/home`, `/training`, `/thoughts`, `/travels`, `/watchlist`, `/moments`, `/api/*`.  
- `components/` — UI: BottomTabBar, RunningSessionLogger, TrainingSessionLogger, FeedItem, BottomSheet, etc.  
- `lib/` — `actions/` (auth, training, thoughts, travels, watchlist, moments, feed, reactions, admin), `session-storage.ts`, `supabase.ts`, `session.ts`, `constants.ts`, `utils.ts`.  
- `supabase/` — SQL migrations and seeds.

## Scripts

- `npm run dev` — Development server  
- `npm run build` — Production build  
- `npm run start` — Start production server  
- `npm run lint` — ESLint  
- `npm run db:cleanup` — Run DB cleanup script (`scripts/cleanup-db.mjs`)
