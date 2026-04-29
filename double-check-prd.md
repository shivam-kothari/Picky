# Product Requirements Document (PRD): Double Check

**Version:** 2.0
**Brand Identity:** "Double Check" — Precision-driven dining for the uncompromising.
**Core Goal:** A modular menu-intelligence tool that filters culinary reality based on specific user standards (Vegetarian, Vegan, Kosher, Allergens).

---

## 1. Product Overview
Double Check is a premium mobile-first web app designed for the intentional diner. It leverages high-speed AI to audit complex menus, identifying hidden ingredients that violate a user's specific dietary criteria. It treats "accuracy" as a virtue.

## 2. Design & UX Philosophy
* **Aesthetic:** Ultra-minimalist. High-contrast (Black & White). No generic food icons. Large, bold headings.
* **Experience:** Single-page vertical scroll. Continuous transitions.
* **Tone:** Professional, meticulous, and slightly witty.
* **The Labor Illusion:** Every scan must include a 2.5–3.5 second "Thinking Phase" where the app displays deep-analysis status messages to build trust and authority.

## 3. Core Features

### A. The Criteria Selector
* **Function:** A clean, high-contrast toggle list where users select their "Standard" (e.g., No Animal Products, No Gluten, Kosher, No Shellfish).
* **UI:** Apple-style switches with subtle haptic-like animations.

### B. Meticulous Menu Scanner
* **Engine:** Gemini 3.1 Flash-Lite.
* **Logic:** Multimodal analysis. The AI identifies the dish, cross-references traditional recipes, and flags "Hidden Triggers" (e.g., cross-contamination, non-obvious stock bases like fond de veau, or specific allergens).
* **Optimization:** Automatic image resizing to 1080p high-contrast JPEG before API transmission.

### C. The Veto Result
* **Function:** High-impact "Safe" or "Vetoed" verdicts.
* **Detail:** If vetoed, the app provides a concise "Why" (e.g., "Traditional preparation of this dish uses lardons/pork fat").

### D. The Interrogator (Scripts)
* **Function:** One-tap French/English scripts for waitstaff to verify high-risk ingredients.

---

## 4. Technical Stack
* **Frontend:** Next.js (App Router), Tailwind CSS.
* **UI/Motion:** Shadcn UI + Framer Motion.
* **AI Integration:** Google AI SDK (Gemini 3.1 Flash-Lite).
* **Hosting:** Vercel.
* **IDE:** Cursor.

## 5. Status Message Sequence (The Labor Illusion)
1.  `Ingesting menu data...`
2.  `Applying your exact standards...`
3.  `Hunting for hidden non-compliances...`
4.  `Verifying culinary integrity...`
5.  `Selection curated.`

---

## 6. Success Metrics
* **Perceived Speed:** 3.0s total (enforced by UI delay to maintain "Expert" feel).
* **Accuracy:** Zero false-positives for "Safe" verdicts in high-risk categories.
