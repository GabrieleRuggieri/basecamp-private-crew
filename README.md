# BASECAMP

**Private crew space — mobile-first, NFC-only access.**

A shared app for a closed group: training logs, thoughts, travels, watchlist, and photo moments. Access is via NFC tap (or simulated token in development). No sign-up forms; each member has a unique token linked to an NFC tag.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & setup](#installation--setup)
- [Environment variables](#environment-variables)
- [Database (Supabase)](#database-supabase)
- [Development](#development)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Authentication & routing](#authentication--routing)
- [Deployment](#deployment)
- [Design system](#design-system)
- [Scripts](#scripts)
- [Related documentation](#related-documentation)

---

## Overview

BASECAMP is a private, mobile-first web app for a fixed crew. Members enter by tapping an NFC tag (or opening a magic link in dev). The app offers:

- **Training** — Gym, Tricking, Calisthenics, Running (with session timer, mood, notes; cancel without saving; single active session at a time).
- **Thoughts** — Posts with tags and optional anonymity; reactions and comments.
- **Travels** — Visited / Wishlist with location, country emoji, year, notes.
- **Watchlist** — Movies, series, books, podcasts (Want / Doing / Done).
- **Moments** — Single photos or albums; uploads go to Supabase Storage.
- **Unified feed** — Home shows recent items from all sections with “See all” per section.
- **Crew** — Per training type: members, PRs, sessions, comments and reactions.

The codebase uses **Next.js 14** (App Router), **TypeScript**, **Supabase** (PostgreSQL + Storage), **iron-session** (cookie auth), and **Tailwind CSS** with an Apple-like dark theme.

---

## Features

| Area | Description |
|------|--------------|
| **Training** | Four types: **Gym** (sets, reps, weight, PR tracking), **Tricking**, **Calisthenics**, **Running** (distance km, pace). Session timer survives refresh (persisted in `localStorage`). Finish flow: mood picker + optional note; Gym supports PR checkboxes. **Cancel session** discards without saving. Only one active session across types: starting another shows a block with “Go to session” or “Cancel” the other. |
| **Thoughts** | Create posts with tags: Side quest, Reflection, Proposal. Optional anonymous. Edit/delete own; react with emoji; one comment per user per thought. |
| **Travels** | Toggle Visited / Wishlist. Add/edit: title, location, country emoji, year, note. |
| **Watchlist** | Items with type (Movie, Series, Book, Podcast, Other) and status (Want, Doing, Done). Filter by type; add/edit via bottom sheet. |
| **Moments** | Upload single photo or multiple as album. Bucket `moments` in Supabase Storage; signed URLs for private read. Lightbox and add-photos-to-album flow. |
| **Feed** | Home aggregates latest from Thoughts, Training, Travels, Watchlist, Moments (configurable limit per section) with “See all” links. |
| **Crew** | Per training type (`/training/[type]/crew`): list members with PR count, session count, recent sessions; react and comment on sessions. |
| **Progress** | Per type: PRs list, history (sessions / volume chart), crew progress. Running: best km, best pace, km-per-session chart. |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Database & storage | Supabase (PostgreSQL, Storage bucket `moments`) |
| Auth | iron-session (encrypted cookie; no Supabase Auth) |
| Styling | Tailwind CSS, design tokens in `app/globals.css` |
| Charts | Recharts |
| Fonts | Geist (Vercel) — sans + mono |
| PWA / offline | Optional: `public/sw.js`, Workbox (see `next.config` if used) |

---

## Prerequisites

- **Node.js** 18+
- **npm** (or yarn/pnpm)
- **Supabase** account
- **NFC tags** (for production) or use `DEV_NFC_TOKEN` for local dev

---

## Installation & setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd basecamp-private-crew
cp .env.example .env
npm install
```

### 2. Configure environment

Edit `.env` and set (see [Environment variables](#environment-variables)):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BASECAMP_SESSION_SECRET` (min 32 characters; e.g. `openssl rand -base64 32`)
- Optionally `DEV_NFC_TOKEN` for local NFC simulation

### 3. Database (Supabase)

In the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), run the scripts in `supabase/` **in order**. See [Database (Supabase)](#database-supabase) for the full list and first-time seed.

### 4. Storage bucket

Create the **moments** bucket in Supabase (Dashboard → Storage → New bucket). If you use `supabase/03-storage-public.sql`, it may configure RLS; otherwise set policies so your app can read/write via the service role.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In dev, if `DEV_NFC_TOKEN` is set, use the “Simulate NFC” button or go to `/enter/[member_token]` to log in.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only; not the anon key) |
| `BASECAMP_SESSION_SECRET` | Yes | Secret for iron-session encryption (min 32 characters) |
| `DEV_NFC_TOKEN` | No | Member `token` for NFC simulation in development. Leave unset or empty in production. |

`.env.example` lists all of these. Never commit `.env`.

---

## Database (Supabase)

### Scripts (execution order)

Run in the Supabase SQL Editor in this order:

| Script | Purpose |
|--------|---------|
| `01-schema.sql` | Core tables: `members`, `admin_config`, `gym_sessions`, `gym_sets`, `gym_prs`, `travels`, `thoughts`, `thought_tags`, `watchlist`, `moment_albums`, `moments`, `reactions`. Includes running support (`km_distance`, `pace_min_km`) and album index. |
| `02-seed.sql` | Initial admin member + `admin_config` row; outputs `member_token` and `admin_token` |
| `03-storage-public.sql` | Optional: configures Storage bucket / RLS for moments |
| `04-reset-and-seed.sql` | Optional: full reset + seed (training, thoughts, etc.) |
| `05-cleanup.sql` | Optional: cleanup helpers / reference |
| `06-add-member.sql` | Optional: add member and token |

### First-time setup (after 01 and 02)

1. Run `01-schema.sql`, then `02-seed.sql` (or adapt the seed with your admin name).
2. From the seed query result, copy:
   - **member_token** → use as `/enter/[token]` or set as `DEV_NFC_TOKEN` in dev.
   - **admin_token** → use for `/api/admin/members?token=...` to list members and their entry URLs.
3. Create the **moments** bucket in Supabase if not already created.

### Main tables (summary)

- **members** — id, token (NFC), name, emoji, role, is_active
- **admin_config** — admin_token for API
- **gym_sessions** — member_id, type (gym | tricking | calisthenics | running), started_at, ended_at, duration_minutes, mood, note
- **gym_sets** — session_id, exercise_name, weight_kg, reps, set_number; for running: km_distance, pace_min_km
- **gym_prs** — member_id, exercise_name, type, weight_kg, reps, achieved_at
- **thoughts** — member_id, content, is_anonymous; **thought_tags** — thought_id, tag
- **travels** — member_id, title, location, country_emoji, status (visited | wishlist), year, note
- **watchlist** — member_id, title, type, status (want | doing | done)
- **moment_albums** — member_id, title; **moments** — member_id, album_id, position, caption, storage_path, taken_at
- **reactions** — member_id, target_type, target_id, emoji OR comment (one row per member per target)

See `supabase/README.md` for a short overview of the SQL files.

---

## Development

### NFC simulation

1. Set `DEV_NFC_TOKEN` in `.env` to a member’s `token` (from DB or from `/api/admin/members?token=ADMIN_TOKEN`).
2. On the app landing page, click “Simulate NFC” or open `http://localhost:3000/enter/[member_token]`.
3. You are logged in and redirected to `/home`.

### Backward compatibility

The middleware redirects `/gym` and `/gym/*` to `/training/gym` and `/training/gym/*`.

### Build and lint

```bash
npm run build
npm run lint
```

---

## Project structure

```
basecamp-private-crew/
├── app/
│   ├── layout.tsx                 # Root layout, metadata, viewport, Geist fonts
│   ├── page.tsx                   # Landing (NFC prompt; Simulate NFC in dev)
│   ├── globals.css                # Design tokens, Tailwind, utilities
│   ├── enter/
│   │   ├── [token]/route.ts       # GET: validate token, set session cookie, redirect to /enter/transition
│   │   └── transition/page.tsx    # NFC transition animation → redirect to /home
│   ├── (protected)/               # All require session cookie
│   │   ├── layout.tsx             # Session check, BottomTabBar, PageTransition
│   │   ├── home/page.tsx          # Feed by section (Thoughts, Training, Travels, Watchlist, Moments)
│   │   ├── training/
│   │   │   ├── page.tsx           # Hub: Gym, Tricking, Calisthenics, Running
│   │   │   └── [type]/
│   │   │       ├── page.tsx       # Type page: streak, Start Workout/Session/Run, leaderboard, Progress, Crew
│   │   │       ├── session/page.tsx  # Active session (RunningSessionLogger or TrainingSessionLogger)
│   │   │       ├── progress/page.tsx  # TrainingProgressView (PRs, History, Crew, Stats)
│   │   │       └── crew/page.tsx      # Crew list + CrewMemberCardWithSessions
│   │   ├── thoughts/page.tsx      # AddThoughtForm, ThoughtTagFilter, ThoughtsFeed
│   │   ├── travels/page.tsx       # TravelsView
│   │   ├── watchlist/page.tsx     # WatchlistView
│   │   └── moments/page.tsx       # MomentsGrid (upload, albums, lightbox)
│   └── api/
│       ├── logout/route.ts        # POST/GET: clear session, redirect to /
│       ├── whoami/route.ts        # GET: return session user (for debugging)
│       └── admin/
│           └── members/route.ts   # GET ?token=ADMIN_TOKEN: list members + entry URLs
├── components/
│   ├── BottomTabBar.tsx           # Nav: Home, Training, Travels, Thoughts, Watchlist, Moments
│   ├── PageTransition.tsx         # Layout transition wrapper
│   ├── BackButton.tsx
│   ├── BottomSheet.tsx
│   ├── FeedItem.tsx               # Single feed item (thought, gym, travel, watchlist, moment)
│   ├── MemberAvatar.tsx
│   ├── LogoutButton.tsx
│   ├── NfcIcon.tsx
│   ├── RunningSessionLogger.tsx   # Running: timer, km, pace, finish/cancel, blocked-by-other-session
│   ├── TrainingSessionLogger.tsx  # Gym/Tricking/Calisthenics: sets, timer, finish/cancel, blocked-by-other-session
│   ├── TrainingProgressView.tsx  # Tabs: PRs, History, Crew, Stats; charts
│   ├── CrewMemberCard.tsx        # Member card with reactions/comments (Progress)
│   ├── CrewMemberCardWithSessions.tsx  # Member + recent sessions + comments (Crew)
│   ├── SkeletonCard.tsx
│   └── icons/
│       ├── TrickingIcon.tsx
│       └── CalisthenicsIcon.tsx
├── lib/
│   ├── supabase.ts               # Supabase client (service role)
│   ├── session.ts                # iron-session options
│   ├── session-storage.ts        # Client: persisted session (running/gym) for timer + “other session” block
│   ├── types.ts                  # BasecampSession, Member, GymSession, Thought, etc.
│   ├── constants.ts              # VALID_TRAINING_TYPES, isValidTrainingType
│   ├── utils.ts                  # cn() etc.
│   ├── image-utils.ts            # Resize for upload
│   ├── validate-token.ts         # NFC token validation (DB + DEV_NFC_TOKEN)
│   └── actions/
│       ├── auth.ts               # getSession (cached)
│       ├── feed.ts               # getUnifiedFeed
│       ├── thoughts.ts           # getThoughts, addThought, updateThought
│       ├── training.ts           # addGymSession, addGymSet, finishGymSession, cancelGymSession, checkForPr
│       ├── running.ts            # addRunningSession, finishRunningSession, cancelRunningSession, getRunningHistory
│       ├── training-progress.ts  # getGymPrs, getGymHistory, getCrewProgress
│       ├── training-crew.ts      # getCrewMembers, getCrewMembersWithSessions
│       ├── travels.ts            # getTravels, addTravel, updateTravel
│       ├── watchlist.ts          # getWatchlist, addWatchlistItem, updateWatchlistStatus, updateWatchlistItem
│       ├── moments.ts            # getMoments, uploadMoment, uploadMomentAlbum, addPhotosToAlbum
│       ├── reactions.ts          # getReactionsForTargets, addReaction, addComment, removeReaction
│       ├── admin.ts              # addMember, regenerateToken, deactivateMember, deleteMember
│       └── crew-active-today.ts   # getCrewActiveToday
├── supabase/                     # SQL migrations and seeds (see Database section)
├── scripts/
│   └── cleanup-db.mjs            # Empties user data tables + moments bucket; keeps members & admin_config
├── public/
│   ├── sw.js                     # Service worker (if PWA enabled)
│   └── workbox-*.js
├── middleware.ts                  # Protects /home, /training, etc.; redirects /gym → /training/gym; bypasses /enter, /admin
├── .env.example
├── DEPLOY-NFC.md                 # Step-by-step Vercel deploy + NFC tag setup
└── README.md                     # This file
```

---

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/enter/[token]` | Token in URL | Validates NFC token, sets session cookie, redirects to `/enter/transition` then `/home`. Invalid token → HTML “This link isn’t valid.” |
| GET | `/api/logout` | — | Clears session cookie and redirects to `/`. |
| GET | `/api/whoami` | Session cookie | Returns `{ user: { memberId, name, emoji } }` or 401. |
| GET | `/api/admin/members?token=ADMIN_TOKEN` | Query param | Returns `{ members: [{ name, token, emoji, url }] }`. Use admin token from `admin_config`. |

All other app routes are server-rendered or use Server Actions; there are no additional REST endpoints for the main app features.

---

## Authentication & routing

- **Login:** Only via `/enter/[token]`. Token is validated against `members.token` (or `DEV_NFC_TOKEN` in dev). Session is stored in an encrypted cookie (`iron-session`).
- **Session:** Contains `memberId`, `name`, `emoji`, `role`. On each request to protected routes, `getSession()` verifies the member still exists and `is_active`; otherwise redirects to `/api/logout`.
- **Protected paths:** `/home`, `/training`, `/travels`, `/thoughts`, `/watchlist`, `/moments` (and all subpaths). **Bypass:** `/enter`, `/admin` (and `/api`). Defined in `middleware.ts`.
- **Server Actions:** Use `getSession()`; `memberId` is never taken from client input.

---

## Deployment

### Vercel (recommended)

1. Connect the repository to Vercel and set the environment variables (see [Environment variables](#environment-variables)). Do **not** set `DEV_NFC_TOKEN` in production (or leave it empty).
2. Deploy. The build command is `npm run build`.
3. Configure NFC tags with URL: `https://your-domain.vercel.app/enter/[token]`. Member tokens and entry URLs can be obtained from `GET /api/admin/members?token=ADMIN_TOKEN`.

For a step-by-step guide (repo setup, Vercel project, env, NFC, custom domain, CORS), see **DEPLOY-NFC.md**.

### Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `BASECAMP_SESSION_SECRET` set (32+ chars)
- [ ] `DEV_NFC_TOKEN` unset or empty in production
- [ ] Supabase Storage CORS and redirect URLs updated if using a custom domain
- [ ] Local build passes: `npm run build`

---

## Design system

- **Theme:** Apple-like dark. Backgrounds and surfaces in `app/globals.css` (`--bg-primary`, `--surface`, `--surface-elevated`, etc.).
- **Accents (section colors):** Training = red, Travels = blue, Thoughts = purple, Watchlist = orange, Moments = green (`--accent-*`).
- **Typography:** Geist Sans + Geist Mono; text levels `--text-primary`, `--text-secondary`, `--text-tertiary`.
- **Components:** `.card`, `.btn`, safe-area utilities, Tailwind config in `tailwind.config.ts`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (default port 3000). |
| `npm run build` | Production build. |
| `npm run start` | Start production server (after `build`). |
| `npm run lint` | Run ESLint. |
| `npm run db:cleanup` | Run `scripts/cleanup-db.mjs`: empties user data tables and `moments` bucket; keeps `members` and `admin_config`. Requires `.env` with Supabase URL and service role key. |

---

## Related documentation

- **DEPLOY-NFC.md** — Full Vercel deploy and NFC tag configuration (including custom domain and Supabase CORS).
- **supabase/README.md** — Short description and execution order of the SQL scripts in `supabase/`.

---

## License

See [LICENSE](LICENSE) in the repository root.
