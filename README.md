# asit.space

Personal event device — a one-post-at-a-time timeline of outings, movies, design events, and moments.

## Stack

- Next.js (App Router) + Tailwind CSS
- Supabase (Postgres + Storage)
- GSAP + Motion
- Cloudflare Workers via `@opennextjs/cloudflare`
- Telegram Bot for publishing (your account only)

## Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - Supabase URL + anon key
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `TELEGRAM_BOT_TOKEN` (from [@BotFather](https://t.me/BotFather))
   - `TELEGRAM_ALLOWED_USER_ID` (your numeric ID from [@userinfobot](https://t.me/userinfobot))
   - `TELEGRAM_WEBHOOK_SECRET` (long random string; used in the webhook URL path)
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` locally)
2. `npm install && npm run dev`

## Telegram bot

Anyone can find the bot; only your Telegram user ID can publish.

**Commands:** `/start` `/help` `/cancel` `/skip` `/delete last`

**Flow:** send a photo (File preferred for EXIF GPS) → if no GPS, share a location pin or Google Maps link → list people (one per line: `Name | @twitter | linkedin-url`) or `/skip`.

After the site is live, set the webhook once:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<your-host>/api/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>"
```

Local tip: use a tunnel (e.g. Cloudflare Tunnel / ngrok) so Telegram can reach your machine.

## Cloudflare deploy

Worker name is `asit-dot-space` (must match `WORKER_SELF_REFERENCE` in `wrangler.jsonc`).

In Cloudflare Workers Builds:

- **Build command:** `npx @opennextjs/cloudflare build`
- **Deploy command:** `npx @opennextjs/cloudflare deploy`

Set the same keys as `.env.example` under **Build variables and secrets** and **Variables and Secrets** (runtime). Prefer secrets for `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `TELEGRAM_ALLOWED_USER_ID`.

Local Workers preview: `npm run preview` · Deploy: `npm run deploy`

## Routes

- `/` — public device feed
- `/archive` — month archive
- `/api/telegram/webhook/[secret]` — Telegram webhook (not for browsers)

## Notes

- Desktop like button increments a sticky visitor-keyed counter.
- Phone/tablet QR button is a visual shell for a future feature.
- Location: EXIF GPS when present; otherwise Telegram pin or Google Maps link.
