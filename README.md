# asit.space

Personal event device — a one-post-at-a-time timeline of outings, movies, design events, and moments.

## Stack

- Next.js (App Router) + Tailwind CSS
- Supabase (Postgres, Auth magic link, Storage)
- GSAP + Motion

## Setup

1. Copy `.env.example` to `.env.local` and fill in Supabase URL + anon key.
2. Set `ADMIN_EMAIL` to your email (must match the magic-link inbox).
3. In Supabase Auth → URL configuration, add:
   - Site URL: `http://localhost:3000` (and later `https://asit.space`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://asit.space/auth/callback`
4. `npm install && npm run dev`

## Routes

- `/` — public device feed
- `/archive` — month archive
- `/studio` — private compose (unlisted; magic-link only)

## Notes

- Photos are client-compressed to WebP (~1600px) before upload.
- Desktop like button increments a sticky visitor-keyed counter.
- Phone/tablet QR button is a visual shell for a future feature.
