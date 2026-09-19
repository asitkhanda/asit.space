# asit.space

Personal event device — a one-post-at-a-time timeline of outings, movies, design events, and moments.

## Stack

- Next.js (App Router) + Tailwind CSS
- Supabase (Postgres, Auth magic link, Storage)
- GSAP + Motion
- Cloudflare Workers via `@opennextjs/cloudflare`

## Setup

1. Copy `.env.example` to `.env.local` and fill in Supabase URL + anon key.
2. Set `ADMIN_EMAIL` to your email (must match the magic-link inbox).
3. In Supabase Auth → URL configuration, add:
   - Site URL: `http://localhost:3000` (and later `https://asit.space`)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://asit.space/auth/callback`
4. `npm install && npm run dev`

## Cloudflare deploy

Worker name is `asit-dot-space` (must match `WORKER_SELF_REFERENCE` in `wrangler.jsonc`).

In Cloudflare Workers Builds, use:

- **Build command:** `npm run build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`

Do **not** use bare `npx wrangler deploy` — that re-runs interactive migrate and can bind the wrong worker name.

Set production secrets in the Cloudflare dashboard (same keys as `.env.example`).

Local Workers preview: `npm run preview` · Deploy: `npm run deploy`

## Routes

- `/` — public device feed
- `/archive` — month archive
- `/studio` — private compose (unlisted; magic-link only)

## Notes

- Photos are client-compressed to WebP (~1600px) before upload.
- Desktop like button increments a sticky visitor-keyed counter.
- Phone/tablet QR button is a visual shell for a future feature.
