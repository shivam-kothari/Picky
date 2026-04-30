# Double Check — Project Log

> Single source of truth for the Double Check codebase: architecture, recent work, and operational guidelines. Read alongside `double-check-prd.md`.

**Last updated:** 2026-05-01
**Framework:** Next.js 16.2.4 (App Router)
**Styling:** Tailwind v4 + Shadcn (Base UI)
**Model:** Gemini 2.5 Flash (via REST)

---

## 1. Product Snapshot

**Double Check** is a premium, mobile-first web app for users with strict dietary standards. It provides two core functions:
- **Menu Scanner:** Uses Gemini Multimodal to analyze photos of menus and identify safe dishes.
- **Restaurant Finder:** Uses a hybrid approach (OpenStreetMap + Gemini) to find and verify nearby restaurants matching user standards.

**Core Aesthetics:**
- **Palette:** Strict pure black (#000000) and pure white (#FFFFFF). No grays except for hairline borders (#242424) and muted text.
- **Motion:** Apple-style cubic-bezier [0.22, 1, 0.36, 1] for all transitions.
- **Speed:** Enforced "Labor Illusion" (3.0s minimum) for scanning to communicate precision.

---

## 2. Current Architecture

### File Tree
```
src/
├─ app/
│  ├─ api/
│  │  ├─ restaurants/route.ts    # OSM + Gemini hybrid search
│  │  └─ scan/route.ts           # Menu analysis endpoint
│  ├─ globals.css                # Monochrome theme tokens
│  ├─ layout.tsx                 # Root layout & providers
│  └─ page.tsx                   # Main tab controller & history state
├─ components/
│  ├─ double-check/              # Feature components
│  │  ├─ home-tab.tsx            # Welcome & shortcuts
│  │  ├─ scanner-tab.tsx         # Image prep & analysis
│  │  ├─ standards-tab.tsx       # Dietary criteria toggles
│  │  ├─ nearby-tab.tsx          # Geolocation & finder
│  │  ├─ history-view.tsx        # Persistent scan results
│  │  ├─ image-cropper.tsx       # Crop isolation
│  │  ├─ interrogator-panel.tsx  # Inline waitstaff question UI
│  │  ├─ interrogator-fullscreen.tsx # Full-screen waiter mode
│  │  ├─ top-nav.tsx             # Clickable brand navigation
│  │  ├─ bottom-nav.tsx          # Tab switcher & camera trigger
│  │  └─ verdict-card.tsx        # Results display
│  └─ ui/                        # Shadcn primitives
│     └─ switch.tsx              # Base UI switch
├─ lib/
│  ├─ criteria.ts                # Policy source of truth (7 languages)
│  ├─ gemini-scan.ts             # Menu analysis AI adapter (Temp 0.0)
│  ├─ gemini-restaurants.ts      # Restaurant advisor AI adapter (Temp 0.0)
│  ├─ interrogator.ts            # Deterministic Interrogator engine
│  ├─ interrogator-preferences.ts # Interrogator local preferences
│  ├─ interrogator.test.ts       # Deterministic engine unit tests
│  ├─ cuisine-filter.ts          # Algorithmic pre-filtering
│  ├─ overpass.ts                # OpenStreetMap client (with retries)
│  ├─ restaurant-cache.ts        # 30-min results cache
│  ├─ scan-history.ts            # LocalStorage persistence
│  ├─ retry.ts                   # Exponential backoff utility
│  ├─ image-prep.ts              # Browser-side resize/compress
│  ├─ nominatim.ts               # Reverse geocoding
│  └─ scan.ts                    # Schemas & types
├─ vitest.config.ts              # Vitest runner configuration
```

### Component Roles
- **`page.tsx`**: The central state manager. Handles active dietary criteria, scan history persistence, and tab navigation.
- **`gemini-scan.ts` / `gemini-restaurants.ts`**: Direct REST adapters for Gemini. Configured with **Temperature 0.0** and strict JSON schemas to ensure deterministic, safe results.
- **`overpass.ts`**: Interfaces with the Overpass API to fetch real map data. Includes a retry mechanism with exponential backoff to handle transient network failures.

---

## 3. Key Development Milestones

### Deterministic Interrogator Release (2026-05-01)
*   **Zero-LLM Interrogator UX:** Implemented a fully deterministic waitstaff verification flow with no additional Gemini calls.
*   **Inline + Full-Screen Actions:** Added compact in-card questions, one-tap copy, language switching, and full-screen "show waiter" mode.
*   **Outcome-Driven Reclassification:** Added local outcomes (`confirmed_safe`, `uncertain`, `confirmed_violation`) that immediately update dish guidance.
*   **History-Level Outcome Memory:** Extended `scan-history` persistence to store per-item interrogation outcomes for future reliability features.
*   **Deterministic Test Coverage:** Added Vitest and unit tests for ordering, language mapping/fallback, and outcome state transforms.

### Reliability & UX Hardening (2026-04-30)
*   **Zero-Results Glitch Fixed:** Set AI temperature to `0.0` and mandated results in the prompt. This prevents the AI from being overly cautious and returning empty lists.
*   **Caching Layer:** Implemented a 30-minute client-side cache for restaurant searches to save on API costs and provide instant results for repeated queries.
*   **Persistent History:** Added a session-based history mechanism stored in `localStorage` that survives page reloads.
*   **Retry Mechanism:** Added an exponential backoff wrapper (600ms → 1.2s → 2.4s) for all critical network calls to eliminate transient errors.
*   **Multilingual Support:** Expanded "Interrogator" scripts to 7 languages (EN, FR, ES, HI, ZH, JA, AR) for global utility.

### Foundation & Intelligence (2026-04-28 to 2026-04-29)
*   **Menu Scan Pipeline:** Built the multimodal Gemini integration with automatic image resizing (1080p) and JPEG compression.
*   **Restaurant Finder:** Built the OSM + AI hybrid engine that finds real-world locations first, then applies dietary logic to them.
*   **Custom UI:** Replaced generic components with a mobile-first, gesture-ready navigation system and a custom "Labor Illusion" scanning sequence.

---

## 4. Operational Runbook

### Environment Configuration
Create a `.env.local` file with:
```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Local Development
```bash
npm run dev
# Note: Dev is pinned to webpack to avoid Turbopack manifest issues.
```

### Verification
- `npx tsc --noEmit` (Type check)
- `npm run lint` (Lint check)
- `npm test` (Deterministic unit tests)

---

## 5. Coding Conventions

1.  **Safety First:** Any ambiguous AI result must return `VERIFY`, never a false `SAFE`.
2.  **No Hallucinations:** AI must only recommend restaurants provided in the OpenStreetMap candidate list.
3.  **Deterministic UI:** Use `temperature: 0.0` for all dietary analysis.
4.  **Privacy:** Scan history and restaurant results are stored locally only. No data is sent to Picky servers beyond the immediate API request.
5.  **Motion:** Always use the `appleEase` cubic-bezier for Framer Motion.
