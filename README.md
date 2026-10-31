# StoryTime

A 3D, scroll-driven storefront for a family-run collection of illustrated children's story books.

**What it does**
- A photographic hero with a depth-parallax plate and a flock of flapping monarch butterflies rendered in WebGL, laid out after the client's reference (badge, italic accent headline, pill CTA, stat row, glass callout with a leader line to the book stack, 360° button, thumbnail card).
- A 3D bookshelf that *lands* when you scroll to it: the books drop in, bump each other and settle (a deterministic, physics-engine-free rail model). Once settled the row is a carousel: drag or flick it (mouse, touch, pen), use a horizontal wheel/trackpad, arrow keys, or the prev/next buttons.
- Tap a book and it lifts off the shelf, turns to face you and opens its front cover on the first page; a native dialog shows the same page as selectable text with *Read more*, *Order* and *Copy link*. Deep links: `#book=<id>`.
- Search and age/theme chips filter the shelf live (non-matches sink away and the row re-packs); the same filter drives the DOM catalogue grid.
- Everything degrades: no WebGL → a scroll-snap rack of covers; `prefers-reduced-motion` or the site's *Reduce motion* toggle → no shuffle, no scrub, instant snaps; keyboard and screen-reader users get a real list of buttons and live announcements.

**Stack**: Vite 8 · React 19 · TypeScript · Tailwind 4 · React Three Fiber 9 + drei 10 (`View` on one fixed canvas) · three 0.186 · maath · @use-gesture · Lenis + GSAP (ScrollTrigger, SplitText) · zustand · zod.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build && npm run preview   # production build on :4173 (all QA runs against this)
```

## Content

All books live in `content/books.json` and all copy in `content/site.json`. See `content/README.md` for the three-step "add a book" guide. `npm run validate` explains any mistake in plain words (it also runs before `dev` and `build`). Covers are generated in the browser from each book's palette/pattern/motif — drop a real image into `public/covers/` and set `cover.image` when artwork arrives.

## Assets (all licence-clean, self-hosted)

- `npm run assets:hero` — responsive AVIF/WebP/JPG set + blur-up from `assets-src/hero.jpg`
- `npm run assets:depth` — depth map for the hero parallax (Depth-Anything-V2-Small, Apache-2.0, runs on CPU in ~2 s)
- `npm run assets:wings` — procedural monarch wing atlas (drawn in code)
- `npm run assets:fetch` — Poly Haven CC0 HDRI + wood/cloth textures

## Quality gates

```bash
npm test               # rail-model determinism / contact / settle tests (vitest)
npm run qa:screens     # Playwright screenshots at 390 / 768 / 1440 (qa/out)
npm run qa:budget      # bundle sizes, draw calls, resident textures
npm run qa:e2e         # Playwright: hero, shelf interaction, filters, deep links, touch pan, no-WebGL, reduced motion, axe, keyboard
```

Lighthouse: `CHROME_PATH=/usr/bin/google-chrome npx lighthouse http://localhost:4173/ --form-factor=mobile --chrome-flags="--headless --no-sandbox"`.

## Architecture rules

See `CLAUDE.md` — one canvas, one clock (Lenis on the GSAP ticker), drei `View` invariants, fast values outside React, DOM as the source of truth, seeded randomness, motion tiers.
