# Double Check — Project Log

> Durable reference for the Double Check codebase: what exists, why it exists, what we fixed, and how to run it. Read alongside `double-check-prd.md` (feature source of truth) and `.cursorrules` (coding conventions).

**Last updated:** 2026-04-29
**Next.js:** 16.2.4 (App Router, webpack dev, Turbopack build)
**React:** 19.2.4
**Tailwind:** v4 (via `@import "tailwindcss"`)
**Shadcn:** style `base-nova` (Base UI primitives, not Radix)

---

## 1. Product snapshot

**Double Check** is a premium, mobile-first, single-page web app. It treats "accuracy" as a virtue. The user picks dietary standards ("Vegan", "No Shellfish", etc.), hits a stark `SCAN` button, chooses or captures a menu image, and receives a structured item-by-item analysis categorized into `Okay to Eat`, `Ask Waitstaff`, or `Avoid`.

- **Aesthetic:** Strict pure black (`#000000`) / pure white (`#FFFFFF`). No grays outside a single hairline token.
- **Motion:** Framer Motion with an Apple-style cubic-bezier `[0.22, 1, 0.36, 1]`.
- **Typography:** Inter (next/font), `tracking-tight` body, uppercase display.
- **Tone (UI copy):** Declarative, concise, confident, slightly witty.
- **Perceived speed:** Enforced **3.0s** minimum per scan to project expertise.
- **Safety posture:** Avoid false `SAFE` verdicts. Ambiguity returns `VERIFY`, not reassurance.

---

## 2. Timeline of work

All entries describe the project at `/Users/shivamkothari/Documents/VibeCoding/PICKY`.

### Phase 0 — Scaffolding (previous session)

1. Ran `create-next-app@latest` (TS, App Router, Tailwind, ESLint, `src/`, alias `@/*`, Turbopack). Worked around a sandbox issue by scaffolding into `picky-app/` and rsyncing to repo root (preserving the existing PRD generator script).
2. Installed runtime deps: `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.
3. Initialized Shadcn UI (`style: base-nova`) and added primitives: `button`, `switch`, `card`, `separator`.
4. Authored a strict monochrome theme in `globals.css` **(initially broken — see §5 Issue A)**.
5. Forced `className="dark"` on `<html>` so Shadcn dark-branch styles still resolve to the mono palette.
6. Replaced the starter `page.tsx` with a minimal centered "PICKY" wordmark to verify the theme.

### Phase 1 — Main page build (previous session)

Author files via ApplyPatch:

- `src/lib/criteria.ts` — typed `Criterion[]` source of truth, each with `negativePrompt`.
- `src/lib/motion.ts` — `appleEase`, `fadeUp`, `stagger` variants.
- `src/components/picky/picky-header.tsx` — scroll-reactive large wordmark.
- `src/components/picky/criteria-list.tsx` — Shadcn `Switch` list, staggered fade-in.
- `src/components/picky/scan-panel.tsx` — `idle → scanning → result` state machine driving the Labor Illusion.
- `src/components/picky/verdict-card.tsx` — deterministic mock SAFE/VETOED verdict.
- `src/app/page.tsx` — composes header + criteria + scanner; scroll progress bar.
- `src/app/layout.tsx` — Inter variable font, metadata (`title: "Picky"`), `antialiased`, `tracking-tight`.
- `.cursorrules` — coding/design/tone guardrails referencing `@double-check-prd.md`.
- `double-check-prd.md` — materialised from the one-shot generator `gemini-code-1776972778711.py`.

### Phase 2 — Stabilization loop (previous session)

- **404 at `/`**: file-watcher `EMFILE` in Turbopack dev. Fixed by switching `dev` to webpack + polling watcher (`package.json` dev script).
- **Lint violation** `react-hooks/set-state-in-effect` in `scan-panel.tsx`: extracted `startScan()` so the initial index set happens outside the effect.
- **`_not-found/page/build-manifest.json` ENOENT**: stale `.next/dev` cache from the earlier Turbopack run. Fixed by `rm -rf .next` and forcing `--webpack` in `dev`.
- Stopped all Node dev listeners on `3000/3001/3004/3005/3010`.

### Phase 3 — Full audit (this session)

Identified and fixed the three remaining correctness issues, added the missing PRD feature D (Interrogator), and drove every verification step green. See §5 for details.

### Phase 4 — Real scan intelligence foundation (2026-04-28)

Built the real end-to-end scan pipeline while keeping a conservative safety fallback:

1. Added a shared scan contract in `src/lib/scan.ts` with `SAFE | VETOED | VERIFY`, confidence, evidence arrays, hidden risks, missing evidence, triggered criteria, and a waitstaff question.
2. Extended `src/lib/criteria.ts` so every criterion now carries `hiddenRisks`, `unsafeIfPresent`, and `uncertainIfPossible` in addition to `negativePrompt` and bilingual scripts.
3. Added client-side image preparation in `src/lib/image-prep.ts`: validates image files, rejects oversized sources, resizes to max 1080px, converts to JPEG at quality `0.82`, and falls back from `createImageBitmap` to an `Image` element path for stricter mobile browsers.
4. Added `POST /api/scan` in `src/app/api/scan/route.ts`, using Next.js 16 App Router route-handler conventions after checking `node_modules/next/dist/docs/`.
5. Added `src/lib/gemini-scan.ts`, a server-only Gemini REST adapter that sends inline image data, requests JSON structured output, validates the response, applies a high-confidence-only rule for `SAFE`, and degrades to `VERIFY` on missing API key, API failure, timeout, malformed output, or low-confidence safety.
6. Rewired `src/components/picky/scan-panel.tsx` to compress the chosen image, call `/api/scan`, preserve the exact 3.0s Labor Illusion, and render the returned structured verdict.
7. Replaced mock verdict logic in `src/components/picky/verdict-card.tsx` with a pure display component for structured scan output.
8. Added `.env.example` with `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash-lite`.
9. Fixed an existing React lint issue in `src/app/page.tsx` by deferring `localStorage` state restoration out of the synchronous effect body.

---

## 3. Final architecture

### File tree (project-specific)

```
Double Check/
├─ double-check-prd.md           # PRD (feature source of truth)
├─ .cursorrules                  # coding/design/tone guardrails
├─ .env.example                  # server env template for Gemini
├─ AGENTS.md                     # "This is NOT the Next.js you know"
├─ PROJECT_LOG.md                # ← this file
├─ README.md                     # quickstart, points here
├─ components.json               # Shadcn (style: base-nova, baseColor: neutral)
├─ next.config.ts
├─ package.json                  # dev = next dev --webpack + polling
├─ tsconfig.json                 # strict, paths @/* → src/*
├─ eslint.config.mjs
├─ postcss.config.mjs
└─ src/
   ├─ app/
   │  ├─ api/
   │  │  └─ scan/route.ts        # POST /api/scan, validates request + returns ScanVerdict
   │  ├─ globals.css             # monochrome tokens (hex) + base layer
   │  ├─ layout.tsx              # Inter, metadata, title: "Double Check"
   │  └─ page.tsx                # tab controller, criteria sync, history state
   ├─ components/
   │  ├─ double-check/
   │  │  ├─ top-nav.tsx          # streamlined wordmark (icons removed)
   │  │  ├─ bottom-nav.tsx       # tab switcher + global camera trigger
   │  │  ├─ home-tab.tsx         # welcome, scan button (direct camera), history/standards shortcuts
   │  │  ├─ standards-tab.tsx    # criteria selection list
   │  │  ├─ scanner-tab.tsx      # image prep + /api/scan + dot-loading sequence
   │  │  ├─ image-cropper.tsx    # free-form rectangular crop (react-image-crop)
   │  │  └─ verdict-card.tsx     # item-by-item safety analysis display
   │  ├─ providers/
   │  │  └─ motion-provider.tsx  # Framer Motion wrapper
   │  └─ ui/                     # Shadcn primitives
   │     ├─ button.tsx
   │     ├─ card.tsx
   │     ├─ separator.tsx
   │     └─ switch.tsx
   └─ lib/
      ├─ criteria.ts             # Criterion[] policy source + scripts
      ├─ gemini-scan.ts          # server Gemini REST adapter (temperature: 0.0)
      ├─ image-prep.ts           # client image resize/grayscale/compress
      ├─ motion.ts               # Variants: fadeUp, stagger, crossfade
      ├─ scan.ts                 # ScanRequest / ScanVerdict contract + validators
      └─ utils.ts                # cn()
```

### Component responsibilities

| File | Role | Client? | Key dependencies |
|---|---|---|---|
| `app/page.tsx` | Owns `active: Set<string>` toggle state, scroll-progress bar, composes sections | Yes (state + `useScroll`) | `framer-motion`, picky components |
| `picky-header.tsx` | Giant "PICKY" wordmark with `useScroll` → `useTransform` on opacity/scale | Yes | `framer-motion` |
| `criteria-list.tsx` | Renders `CRITERIA` as Shadcn `Switch` list, stagger-in on view | Yes | `@/components/ui/switch`, `@/lib/criteria`, `@/lib/motion` |
| `scan-panel.tsx` | `idle → scanning → result` machine. Opens camera/file picker, compresses the image, calls `/api/scan`, and keeps the Labor Illusion on screen for at least 3.0s. | Yes | `@/lib/image-prep`, `@/lib/scan`, `VerdictCard` |
| `verdict-card.tsx` | Pure structured verdict renderer for `SAFE`, `VETOED`, and `VERIFY` results | No | `@/components/ui/card`, `@/lib/scan` |
| `interrogator.tsx` | Renders EN/FR waitstaff scripts for each active criterion, language tabs, copy-to-clipboard | Yes | `@/lib/criteria`, `@/lib/motion` |
| `app/api/scan/route.ts` | Validates scan request JSON, rejects bad input, delegates to Gemini adapter, returns `ScanVerdict` | No | `@/lib/gemini-scan`, `@/lib/scan` |
| `lib/criteria.ts` | Typed single source of truth. `Criterion = { id, label, negativePrompt, hiddenRisks, unsafeIfPresent, uncertainIfPossible, script }`. Exports `CRITERIA` (readonly) + `getCriterionById()` | N/A | — |
| `lib/scan.ts` | Shared API contract, Gemini response schema, request validation, verdict normalization, `VERIFY` fallback helpers | N/A | `@/lib/criteria` |
| `lib/gemini-scan.ts` | Server-side Gemini REST adapter with structured output, timeout, prompt rules, and conservative safety fallback | N/A | `fetch`, `process.env`, `@/lib/scan` |
| `lib/image-prep.ts` | Browser-only image validation, resize, JPEG compression, base64 extraction | N/A | Canvas APIs |
| `lib/motion.ts` | Shared `Variants` presets, `appleEase` bezier | N/A | `framer-motion` types |

### Criteria taxonomy (order matches UI)

1. Vegan
2. Vegetarian
3. Kosher
4. No Meat
5. No Dairy
6. No Peanuts
7. No Shellfish
8. No Gluten

Each entry carries a `negativePrompt`, `hiddenRisks`, `unsafeIfPresent`, `uncertainIfPossible`, and a bilingual `script` for the Interrogator. **Do not hardcode dietary logic in UI components** — extend `criteria.ts`.

### Scan verdict contract

All scan results must satisfy `ScanVerdict` from `src/lib/scan.ts`:

```ts
type ScanVerdict = {
  status: "SAFE" | "VETOED" | "VERIFY";
  dishName: string;
  confidence: "low" | "medium" | "high";
  summary: string;
  primaryReason: string;
  selectedCriteria: string[];
  triggeredCriteria: string[];
  hiddenRisks: string[];
  visibleEvidence: string[];
  missingEvidence: string[];
  waitstaffQuestion: string;
};
```

Safety rule: `SAFE` is allowed only when Gemini returns high confidence. Any low/medium-confidence `SAFE` is downgraded to `VERIFY`. API errors, missing API key, invalid model output, timeout, or ambiguity also return `VERIFY`.

### Gemini integration

- Route: `POST /api/scan`
- Runtime: Node.js route handler (`export const runtime = "nodejs"`)
- Request body: `{ imageBase64, mimeType, criteriaIds, imageMeta? }`
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max base64 payload: `7_000_000` characters
- Server env:
  - `GEMINI_API_KEY` preferred
  - `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_API_KEY` accepted as fallbacks
  - `GEMINI_MODEL` optional; default `gemini-2.5-flash-lite`
- Adapter: direct REST call to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Structured output: `responseMimeType: "application/json"` + `scanVerdictResponseSchema`
- Timeout: `22_000ms`

The PRD names Gemini 3.1 Flash-Lite, but the implementation keeps the model configurable because public Gemini model names change. Update `GEMINI_MODEL` rather than hardcoding model strings in UI or route code.

### Labor Illusion spec (enforced by `scan-panel.tsx`)

```text
t=0ms     Ingesting menu data...
t=600ms   Applying your exact standards...
t=1200ms  Hunting for hidden non-compliances...
t=1800ms  Verifying culinary integrity...
t=2400ms  Selection curated.
t=3000ms  → verdict
```

One message on screen at a time with `AnimatePresence mode="wait"` cross-fade.

---

## 4. PRD compliance matrix

PRD reference: `double-check-prd.md`.

| PRD section | Requirement | Status | Where |
|---|---|---|---|
| §2 | Pure `#000` bg, `#fff` fg, no grays beyond subtle border | ✅ | `globals.css` `--border: #242424` only |
| §2 | Single-page vertical scroll, continuous transitions | ✅ | `page.tsx`, Framer Motion throughout |
| §2 | Large bold headings, no generic food icons | ✅ | `picky-header.tsx`, UI avoids food glyphs |
| §2 | Labor Illusion 2.5–3.5s | ✅ (3.0s exact) | `scan-panel.tsx` `STEP_MS=600` × 5 |
| §3.A | Toggle list with Apple-style switches | ✅ | `criteria-list.tsx` + Shadcn `Switch` |
| §3.B | Meticulous scanner (Gemini multimodal) | ✅ wired via server route; needs `GEMINI_API_KEY` at runtime | `app/api/scan/route.ts`, `lib/gemini-scan.ts` |
| §3.B | Image resize to 1080p JPEG before API | ✅ | `lib/image-prep.ts` |
| §3.C | High-impact SAFE / VETOED verdict with concise "Why" | ✅ structured real verdict rendering; also supports conservative VERIFY | `verdict-card.tsx`, `lib/scan.ts` |
| §3.D | **Interrogator** — one-tap EN/FR scripts | ✅ | `interrogator.tsx` + `script` field on every criterion |
| §4 | Next.js App Router + Tailwind + Shadcn + Framer Motion | ✅ | — |
| §4 | Google AI / Gemini integration | ✅ direct REST adapter; SDK dependency intentionally avoided for now | `lib/gemini-scan.ts` |
| §5 | Exact 5-message sequence, in order | ✅ | `scan-panel.tsx` `MESSAGES` literal array |
| §6 | Perceived speed 3.0s | ✅ | `scan-panel.tsx` |

`.cursorrules` compliance:

- Branding / tone: ✅
- Inter from next/font: ✅ (`layout.tsx`)
- Pure B&W with subtle border only: ✅
- Framer Motion for transitions: ✅
- Single typed criteria source of truth with `id/label/negativePrompt` plus risk metadata: ✅
- Gemini prompts assembled from selected `Criterion` policy data: ✅ (`lib/gemini-scan.ts`)
- No hardcoded dietary logic in UI: ✅
- TypeScript strict, no `any`: ✅ (`Variants`-typed motion, `readonly Criterion[]`)
- Server Components by default; `"use client"` only where needed: ✅ (`verdict-card.tsx` stays non-client; interactive components opt in)
- Labor Illusion ≥ 2500ms with exact 5-message order, one-at-a-time cross-fade: ✅

---

## 5. Issues encountered — root causes — fixes

### A. Tailwind v4 color tokens silently no-op'd

**Symptom:** Shadcn utilities (`bg-card`, `border-border`, `ring-foreground/10`, `bg-muted`, etc.) produced no color. Page only looked black because of a direct `html, body { background: #000 }` rule.

**Root cause:** `globals.css` defined tokens as bare HSL numbers:

```css
--background: 0 0% 0%;
```

Tailwind v4's `@theme inline { --color-background: var(--background); }` passes the value straight through. The rule `.bg-background { background-color: var(--color-background); }` then resolves to `background-color: 0 0% 0%`, which is **not** a valid CSS color — browsers drop the declaration.

**Fix:** Rewrote tokens as hex and unified `:root` and `.dark` into one block. Added the `destructive` pair, `::selection`, and font-smoothing. Now every Shadcn class resolves to a real color.

```css
:root, .dark {
  --background: #000000;
  --foreground: #ffffff;
  --border: #242424;   /* sole permitted gray */
  --muted-foreground: #b3b3b3;
  --primary: #ffffff;
  --primary-foreground: #000000;
  /* … */
}
```

### B. Labor Illusion timing

**Symptom:** Total flow was 2500ms (`STEP_MS=500` × 5). Meets the PRD §2 range (2.5–3.5s) but misses the PRD §6 **3.0s** success metric.

**Fix:** `STEP_MS = 600` → exact 3000ms.

### C. Missing PRD feature D (Interrogator)

**Symptom:** No EN/FR scripts feature at all.

**Fix:** Added `src/components/picky/interrogator.tsx` and extended every `Criterion` with a `script: { en, fr }` field. The component:

- Renders only when ≥1 criterion is active (auto-hidden on an empty standards set).
- Exposes EN/FR tab toggles.
- Stagger-animates the list and cross-fades when language changes.
- Exposes a per-item `Copy` button (writes to `navigator.clipboard`, resets label after 1.6s).

Wired into `page.tsx` between `ScanPanel` and the footer.

### D. Dev-server instability (pre-audit, fully resolved)

| Failure | Root cause | Fix (now persistent in `package.json`) |
|---|---|---|
| `/` returns 404 | `EMFILE` in default file watcher under Turbopack dev | `WATCHPACK_POLLING=true WATCHPACK_POLLING_INTERVAL=1000` |
| `_not-found/page/build-manifest.json` ENOENT | Turbopack manifest race on cached dev builds | `next dev --webpack` (avoids Turbopack dev path) |
| Ambiguous host | Port/host resolution varied across Node versions | `--hostname 127.0.0.1` |
| Intermittent stale state | Leftover `.next/dev` across runs | Always `rm -rf .next` before first boot after major changes |

Final `dev` script:

```json
"dev": "WATCHPACK_POLLING=true WATCHPACK_POLLING_INTERVAL=1000 next dev --webpack --hostname 127.0.0.1"
```

**Note:** Production `build` still uses Turbopack (see `npm run build` output: "Next.js 16.2.4 (Turbopack)"). Only dev-mode is pinned to webpack.

### E. ESLint `react-hooks/set-state-in-effect` in `scan-panel.tsx`

**Symptom:** `setMessageIndex(0)` called synchronously inside `useEffect` on state transition.

**Fix:** Hoisted the init into a dedicated `startScan()` callback invoked by the button's `onClick`. The effect now only sets state from inside a `setInterval` callback, which is not flagged by the rule.

### F. Strict TypeScript inference on Framer Motion variants

**Symptom:** Plain object literals for variants would infer narrower types than `Variants` expects once more complex transitions landed.

**Fix:** Annotated `fadeUp`, `stagger`, and new `crossfade` with the `Variants` type from `framer-motion`.

### G. Dead file

`gemini-code-1776972778711.py` was a one-shot generator that had already produced `double-check-prd.md`. Deleted to reduce clutter; the PRD Markdown is the canonical source.

### H. Real scan pipeline, without adding an SDK dependency

**Decision:** Use a direct Gemini REST adapter in `src/lib/gemini-scan.ts` instead of installing an SDK during this pass.

**Reason:** The network/package lookup hung under the local sandbox, and the app did not need a new dependency to establish a first-class architecture. The adapter is isolated behind `analyzeMenuImage()`, so swapping to `@google/genai` later is low-risk.

**Implementation details:**

- `POST /api/scan` validates JSON and criteria ids before calling Gemini.
- Client images are resized/compressed before upload.
- The prompt includes the selected criterion policy objects, not ad-hoc UI strings.
- The model is instructed to treat menu/image text as evidence, never as instructions.
- Gemini is asked for JSON structured output matching `scanVerdictResponseSchema`.
- Any failure mode returns `VERIFY`.

### I. Conservative third verdict: VERIFY

**Reason:** The PRD named only `SAFE` and `VETOED`, but real dietary/allergy use needs a separate state for ambiguity. A false-safe result is the highest-risk product failure.

**Behavior:**

- `VETOED`: likely violation of selected standards.
- `VERIFY`: missing or ambiguous evidence, no API key, model/API failure, invalid output, low confidence, or no standards selected.
- `SAFE`: allowed only for high-confidence, evidence-supported responses.

The UI still preserves the stark verdict feel, but the intelligence layer does not collapse uncertainty into false reassurance.

### J. React 19 lint issue in `page.tsx`

**Symptom:** `react-hooks/set-state-in-effect` flagged synchronous `setActive()` during `localStorage` restore.

**Fix:** Deferred localStorage restoration with `window.setTimeout(..., 0)` and cleaned the timeout on unmount. This keeps lint green while preserving persisted criteria selection.

---

## 6. Verification pipeline

All four must stay green.

```bash
# Type-check (no emit)
npx tsc --noEmit                           # → 0 errors

# ESLint
npm run lint                               # → 0 errors

# Production build
npm run build                              # → ✓ Compiled, / static + /api/scan dynamic

# Dev server smoke test
rm -rf .next && npm run dev -- --port 3010
curl -I http://127.0.0.1:3010/             # → HTTP/1.1 200 OK

# API smoke test
curl -s -X POST http://127.0.0.1:3010/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"imageBase64":"iVBORw0KGgo=","mimeType":"image/png","criteriaIds":["vegan"],"imageMeta":{"width":1,"height":1,"bytes":8}}'
# → structured VERIFY response when GEMINI_API_KEY is not configured
```

Latest pass (2026-04-28):

- `tsc --noEmit`: 0 errors
- `eslint`: 0 errors
- `next build`: compiled successfully; `/` and `/_not-found` static, `/api/scan` dynamic
- `next build` requires network access when Inter is not already cached because `next/font` fetches from Google Fonts.
- `next dev --webpack --port 3010`: `Ready in 283ms`
- `POST /api/scan`: 200 with structured `VERIFY` fallback when no Gemini key is configured

---

## 7. Operational runbook

### Start dev

```bash
cd /Users/shivamkothari/Documents/VibeCoding/PICKY
rm -rf .next
npm run dev -- --port 3000
# If 3000 is busy, pick any free port, e.g. --port 3010
```

### Stop dev and free ports

```bash
# Find listeners
lsof -nP -iTCP -sTCP:LISTEN | grep -E "node|3000|3010"

# Stop a specific pid
kill <pid>            # graceful
kill -9 <pid>         # force if graceful fails

# Verify free
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "free"
```

> `next dev` spawns a child worker (usually pid+24). You may need to kill the child explicitly — the parent won't always reap it.

### Full reset (if dev ever gets weird again)

```bash
rm -rf .next node_modules/.cache
npm run dev -- --port 3000
```

### Production build + serve locally

```bash
npm run build
npm run start -- --port 3000
```

### Configure live Gemini scans

Create `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

Accepted key variable fallbacks are `GOOGLE_GENERATIVE_AI_API_KEY` and `GOOGLE_API_KEY`, but prefer `GEMINI_API_KEY`.

If `GEMINI_API_KEY` is missing, `/api/scan` intentionally returns a structured `VERIFY` response instead of failing or pretending a dish is safe.

---

## 8. Conventions (source: `.cursorrules` + PRD)

1. **Design tokens:** Only use CSS variables from `globals.css`. Never introduce a gray value outside `--border`/`--input` (`#242424`) and `--muted-foreground` (`#b3b3b3`).
2. **Criteria:** Add or modify standards **only** in `src/lib/criteria.ts`. UI components must pull from `CRITERIA`.
3. **Gemini prompts:** Build from selected `Criterion` objects, including `negativePrompt`, `hiddenRisks`, `unsafeIfPresent`, and `uncertainIfPossible`. Do not hardcode dietary logic in components.
4. **Motion:** Reuse `appleEase`, `fadeUp`, `stagger`, `crossfade` from `@/lib/motion`. Do not invent bezier curves.
5. **Client boundary:** Keep `"use client"` as far down the tree as possible. `verdict-card.tsx` stays a server component unless it starts owning state.
6. **Comments:** Only explain non-obvious intent. No narrator comments.
7. **Dev script:** Never remove `--webpack` from `package.json` `dev` without first verifying Turbopack dev no longer regresses.
8. **Labor Illusion:** Exactly 5 status messages, exact wording, exact order, ≥ 2500ms total, target 3000ms. Any change requires updating `MESSAGES` and `STEP_MS` together.
9. **Ports:** Dev binds to `127.0.0.1` by default. Don't expose on `0.0.0.0` without an explicit reason.
10. **Verdict safety:** Never downgrade uncertainty into `SAFE`. Any ambiguous, failed, low-confidence, or malformed scan must become `VERIFY`.
11. **API keys:** Keep Gemini keys server-only. Never expose keys through `NEXT_PUBLIC_*`.
12. **PRD conflicts:** Flag before writing code.

---

## 9. Roadmap — next units of work

These are staged; each is a discrete next unit of work.

1. **Live Gemini QA with real key**
   - Add `GEMINI_API_KEY` to `.env.local`.
   - Test real menu/dish images across Vegan, No Dairy, No Gluten, No Shellfish, No Peanuts, Kosher.
   - Tune prompt/schema if Gemini returns overly broad or under-evidenced answers.
2. **Evaluation fixture harness**
   - Add small fixture cases for obvious-safe, obvious-vetoed, and ambiguous dishes.
   - Assert ambiguous cases never return `SAFE`.
   - Keep fixtures image-light where possible; use route-level mocked Gemini responses if needed.
3. **Optional SDK adapter**
   - Consider swapping direct REST for `@google/genai` once package install/network is available.
   - Keep the public interface as `analyzeMenuImage()` so UI and route code do not change.
4. **Better user feedback during image prep**
   - Distinguish "Preparing image", "Uploading", and "Analyzing" internally if needed while preserving the exact public Labor Illusion copy.
   - Add a concise file-type/too-large error display if image preparation fails.
5. **Accessibility polish**
   - Focus rings audit on pure black.
   - `prefers-reduced-motion` fallback for Labor Illusion.
   - Ensure `VERIFY` language is clear for screen readers.
6. **Haptic-like switch feedback**
   - Micro-`whileTap` scales on `Switch` if it can be done without fighting Base UI internals.
7. **Deploy target**
   - Vercel per PRD.
   - Configure server-only `GEMINI_API_KEY`.
   - Confirm route timeout behavior under Vercel limits.

---

## 10. Change log (audit session, 2026-04-23)

- **fix(css):** rewrote `src/app/globals.css` color tokens from bare HSL to hex; unified `:root` and `.dark`; added `destructive`, `::selection`, font-smoothing
- **perf(scan):** `STEP_MS` 500 → 600 to hit PRD §6 3.0s perceived-speed target
- **feat(interrogator):** new `src/components/picky/interrogator.tsx`; extended `Criterion` with `script: { en, fr }`; wired into `src/app/page.tsx`
- **refactor(motion):** typed variants with `Variants`; added `crossfade` preset
- **refactor(page):** switched `bg-black text-white` to token classes (`bg-background text-foreground`); memoized `handleToggle` with `useCallback`
- **chore:** deleted one-shot generator `gemini-code-1776972778711.py`
- **docs:** this file; refreshed `README.md`

## 11. Change log (AI scan foundation, 2026-04-28)

- **feat(scan):** added `src/lib/scan.ts` with `ScanRequest`, `ScanVerdict`, structured Gemini response schema, request validation, verdict normalization, and conservative fallback helpers
- **feat(criteria):** extended every `Criterion` with `hiddenRisks`, `unsafeIfPresent`, and `uncertainIfPossible`
- **feat(api):** added `POST /api/scan` route handler with Node runtime, request validation, no-standards handling, and Gemini delegation
- **feat(gemini):** added direct REST Gemini adapter with configurable model, structured JSON output, 22s timeout, prompt-injection guard, high-confidence-only `SAFE`, and `VERIFY` fallback behavior
- **feat(image):** added browser image preparation: image validation, source-size limit, max 1080px resize, JPEG compression at quality `0.82`, base64 extraction, and mobile fallback loader
- **refactor(scan-panel):** rewired scan flow to prepare images, call `/api/scan`, preserve the 3.0s Labor Illusion, and render API-backed verdicts
- **refactor(verdict):** replaced deterministic mock verdict generation with pure structured result rendering
- **fix(page):** deferred localStorage restoration to satisfy React 19 `react-hooks/set-state-in-effect`
- **chore(env):** added `.env.example` for `GEMINI_API_KEY` and `GEMINI_MODEL`
- **verify:** `tsc`, `eslint`, production build, and `/api/scan` smoke test passed; build needs network if Inter font is not cached

---

## 13. Change log (Finalization & UI Hardening, 2026-04-29)

- **feat(ai):** implemented two-layer culinary reasoning to eliminate universal over-caution bias. The AI now defaults to `SAFE` for obvious dishes (like Indian vegetarian) by leveraging its internal culinary knowledge as valid evidence.
- **feat(ui):** streamlined TopNav by removing unused menu/profile icons for a cleaner, centered branding.
- **feat(ui):** re-engineered Scanner flow to bypass intermediate screens. Clicking "Scanner" in the bottom nav or home tab now launches the native camera instantly.
- **feat(ui):** added free-form rectangular cropping via `react-image-crop`. Users can now adjust the crop box freely to isolate menu sections, improving analysis precision and speed.
- **fix(nav):** implemented a global hidden camera input in `page.tsx` to ensure synchronous, browser-trusted interaction across all scan buttons.
- **infra:** successfully deployed to Vercel with integrated GitHub CI/CD and configured `GEMINI_API_KEY`.
- **verify:** `tsc` and `eslint` clean; port 3000 terminated; workspace verified clean.

---

## 14. Pointers

- Feature scope / voice: `double-check-prd.md`
- Coding style / guardrails: `.cursorrules`
- Next.js 16 doc bundle (installed): `node_modules/next/dist/docs/01-app/`
- Shadcn registry config: `components.json`
- Scan contract: `src/lib/scan.ts`
- Gemini adapter: `src/lib/gemini-scan.ts`
- API route: `src/app/api/scan/route.ts`
