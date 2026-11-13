# StoryTime — project rules for Claude

A preview site for an **Arabic-first** children's story service, **ages 3–12** (the author's first story is for 3–6).
Each story can be read (a living book), watched (a short film) and, beside it, there is a calm game.
Arabic (RTL) by default; English with `?lang=en` exists but **Arabic comes first: English waits** (owner, 12 Nov 2026).
Stack: Vite 8 · React 19 · TypeScript · Tailwind 4 · GSAP (ScrollTrigger) + Lenis · three / React-Three-Fiber / drei · zustand.

**Read first:** `docs/HANDOFF.md` (current state), then `docs/AUDIT-2.md` (what is wrong and what the owner must decide).
`docs/SPEC.md` is the build spec of the *first* version: its autumn art direction, maple accent, "hero is film" and
"never pin" rules are **history**, not instructions. The owner rejected theming the site around one story.

## Hard rules
1. **The author's Arabic story text in `src/content/story.ts` is hers.** Never edit, shorten, "fix" or re-vowel it. Never contact her. Our own stories (`src/content/stories/*.ts`) are labelled everywhere as StoryTime's, not hers.
2. **All visible words live in `src/i18n/copy.ts`** (both languages, same shape). No invented prices, reviews, credentials, user counts or popularity claims. **A claim on the site must be true of the build as it is today** (the game, the screenshots, "coming soon" notes). Sign-in, sign-up and checkout are demos: nothing is validated, sent or charged; prices stay labelled as samples.
3. **Arabic typography:** never split text into letters, never letter-space it, generous line-height, logical CSS (`start/end`, `ms/me`), `dirSign` for mirrored motion, `num()` for digits.
4. **No third-party AI for new pictures or films** (owner, 12 Nov 2026): new art and films are drawn and animated in code (`src/features/moonfilm` is the kit and the reference). The existing AI-made pictures of the first story and the landing hero (`public/landing/hero.webp`, made with Google's image model before the rule) stay until the owner decides.
5. **Voice:** the narrator is ElevenLabs, voice "Alice" on `eleven_v4` (`scripts/audio/narrate_eleven.py`, key in `..\keys.txt`, never in the repo). The Google voice is removed for good. Current files were made on a **free** plan: not licensed for commercial use, attribution required (footer credit). Re-record on a paid plan before any paid launch.
6. **Structure:** the landing page (`src/pages/Landing.tsx` + `src/features/landing/*`, its own light/green look scoped under `.lp`) and the app (`src/pages/AppShell.tsx`: library home with the shelf, story page, reward tree, grown-ups, author's desk). Change views only with `go()` / `enterApp()` from `src/app/router.ts`. Full-screen overlays (`book`, `film`, `game`, `moon`) are driven by `useSiteStore().overlay`. A child's name and progress live in `useProfileStore` (this browser only).
7. **The game** is Friends Island: source in `game/friends-island/` (a remix of Wigglewild by Patch, MIT/CC0 — keep its licence files and credit line), build in `public/play/friends-island/`, opened by `src/features/island`. The older yard game stays reachable with `?game=yard`. Never publish anything to Patch.
8. **Motion has a rest state:** everything visible with reduced motion, slow scripts or no WebGL; pause media and loops off-screen. Each 3D feature owns one `<LazyCanvas>`. Lenis runs on the GSAP ticker; prefer CSS sticky, use GSAP pin only where it clearly helps and test it on a phone.
9. **Safari matters:** the owner and his audience use iPhones. The `iphone-webkit` Playwright project (`PW_WEBKIT=1`) catches Safari script and layout bugs, but **this laptop's WebKit cannot draw CSS 3D** (the shelf, page curls): judge 3D in Chromium and confirm on a real iPhone.

## Commands
`npm run dev` · `npm run build && npm run preview` · `npm run typecheck` · `npm test` · `npm run qa:e2e` (`PW_WEBKIT=1 npx playwright test --project=iphone-webkit` for Safari's engine)
Feature in isolation: `/demo.html?f=<name>&qa=1` (dev only — not in the published build) · screenshots: `node scripts/qa/shot.mjs "<url>" qa/out/<name>` · drive it like a person: `node scripts/qa/eyes.mjs` · film (first story): `video/README.md`, timeline from narration: `node video/scripts/timeline.mjs`.
**Publish:** `node scripts/deploy/site.mjs --out=../storytime-pages` (type-checks first; replaces the whole published folder), then commit and push that folder to `gh-pages`. Live: https://moaadswaed48-ship-it.github.io/StoryTime/
This laptop has 8 GB of memory: one headless browser and one heavy job at a time.
