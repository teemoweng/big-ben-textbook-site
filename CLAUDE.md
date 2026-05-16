# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js 16 Breaking Changes

@AGENTS.md

This project runs **Next.js 16.2.6** with **React 19** and **Tailwind CSS v4** — all have breaking changes from common training data:

- Dynamic route `params` is now a **Promise**: use `params: Promise<{ id: string }>` and `await params`
- Tailwind v4 uses `@import "tailwindcss"` — not `@tailwind base/components/utilities`
- Viewport config is a separate export: `export const viewport = { ... }` not inside `metadata`

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build (run before deploy)
npm run test:run     # run all unit tests once
npm run test         # watch mode
```

Run a single test file:
```bash
npx vitest run tests/lib/identity.test.ts
```

## Infrastructure

- **Database + Storage**: Supabase (project `ldrjejzlcvfqngqzqmbj`, region eu-west-1)
- **Deployment**: Vercel (auto-deploys from `main` branch via `vercel --prod`)
- **Supabase MCP**: available — use `mcp__supabase__*` tools for schema changes instead of raw SQL
- **Direct DB access**: `psql "postgresql://postgres:<pw>@db.ldrjejzlcvfqngqzqmbj.supabase.co:5432/postgres"`

## Architecture

Mobile-first PWA-style app (max-width 480px). No auth — device identity via `localStorage`.

**Data flow**: User uploads photo → `POST /api/upload` → Supabase Storage `photos` bucket → insert row to `posts` table with `photo_url` (first/primary) + `photo_urls[]` (all photos).

**Identity**: `lib/identity.ts` generates a random Chinese animal nickname (e.g. 「温柔松鼠」) and UUID stored in `localStorage` under `bb_nickname` / `bb_device_id`. Use `getOrCreateIdentity()` on client side only.

**Key patterns**:
- Server components fetch from Supabase directly (no API layer)
- Client components use `supabase` singleton from `lib/supabase.ts`
- `useIdentity` hook wraps `getOrCreateIdentity()` in `useEffect` to avoid SSR mismatch
- CSS variables for theming (`--bg`, `--primary`, `--text`, `--border`, `--nav-bg`, `--card`) defined in `globals.css`

## Database Schema

```
posts: id, short_code (5-char unique), device_id, animal_nickname,
       photo_url (first photo), photo_urls[] (all photos), message, created_at
comments: id, post_id→posts, device_id, animal_nickname, content (≤200), created_at
likes: id, post_id→posts, device_id, created_at — unique(post_id, device_id)
```

RLS enabled on all tables (public read + insert). Storage bucket `photos` is public.

## Short Code

`lib/shortcode.ts` generates 5-char codes from charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes 0/O/1/I). Used to retrieve posts cross-device via the "我的" page.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Use `?? 'placeholder'` fallback (not `!` assertions) to avoid build errors during static prerendering.
