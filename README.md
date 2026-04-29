# Double Check

> Precision-driven dining for the uncompromising.

Double Check is a premium, mobile-first web app that audits menus against a user's exact dietary standards. Pick your standards (Vegan, Kosher, No Peanuts, …), scan a dish, and receive an item-by-item analysis categorized as `Okay to Eat`, `Ask Waitstaff`, or `Avoid`.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind v4
- Shadcn UI (`base-nova` style, Base UI primitives)
- Framer Motion
- Inter (next/font)

Pure `#000` / `#fff`. No grays outside a single hairline border token.

## Quickstart

```bash
rm -rf .next
npm run dev -- --port 3000
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

If `3000` is busy, pick another port (e.g. `--port 3010`).

## Scripts

```bash
npm run dev       # next dev --webpack, polling watcher, 127.0.0.1
npm run build     # next build (Turbopack production)
npm run start     # next start
npm run lint      # eslint
npx tsc --noEmit  # type-check
```

## Reference docs (in repo)

- **`double-check-prd.md`** — product requirements (feature source of truth)
- **`.cursorrules`** — coding/design/tone guardrails
- **`PROJECT_LOG.md`** — architecture, audit history, issues + fixes, runbook, roadmap
- **`AGENTS.md`** — note on working with Next.js 16 APIs

When in doubt, start with `PROJECT_LOG.md`.

## Conventions (short)

- All dietary data lives in `src/lib/criteria.ts`. Never hardcode dietary logic in UI.
- All design tokens live in `src/app/globals.css` as hex. No ad-hoc grays.
- Server Components by default; `"use client"` only where interaction or browser APIs are required.
- Labor Illusion: exactly 5 status messages, exact wording, 3.0s total.
- Dev runs on webpack (not Turbopack) to avoid a manifest race; keep it that way unless you've verified the regression is gone.

## Deploy

Target: Vercel. Gemini SDK wiring, image upload, and real verdict generation are tracked in `PROJECT_LOG.md` §9.
