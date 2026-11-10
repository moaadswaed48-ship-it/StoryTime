# StoryTime — project rules for Claude

A cinematic, scroll-driven preview site for a children's storybook service (ages 3–6). Arabic (RTL) by default, English with `?lang=en`.
**The full build spec is `docs/SPEC.md` — read it before changing anything.** Stack: Vite 8 · React 19 · TypeScript · Tailwind 4 · GSAP (ScrollTrigger) + Lenis · three / React-Three-Fiber / drei · zustand.

## Hard rules
1. **The author's Arabic story text in `src/content/story.ts` is hers.** Never edit, shorten, "fix" or re-vowel it. The English column is our draft translation and is labelled as such.
2. **All visible words live in `src/i18n/copy.ts`** (both languages, same shape). No hard-coded UI text, no invented prices/reviews/credentials. The login is a demo: prefilled, read-only, nothing is sent.
3. **Arabic typography:** never split text into letters, never letter-space it, generous line-height, logical CSS (`start/end`, `ms/me`), `dirSign` for mirrored motion, `num()` for digits.
4. **Design system:** tokens and the glass material are in `src/index.css`; primitives in `src/design/*` (`Pill`, `SectionHead`, `BlurWords`, `Reveal`, `LazyCanvas`, `SariModel`, `Leaves`). One accent colour (maple). The film carries the colour; UI stays quiet. Follow the MotionSites craft rules (`.claude/skills/motionsites-web-builder/references/craft.md`, local only).
5. **Structure:** one folder per section under `src/features/<name>/` exporting the component `src/App.tsx` mounts. Overlays (`book`, `film`) are driven by `useSiteStore().overlay`.
6. **Scroll:** Lenis runs on the GSAP ticker (`src/app/Providers.tsx`). Never use GSAP `pin:` — use CSS sticky. Fast values stay in refs; clamp `delta` in every `useFrame`.
7. **3D:** each 3D feature owns one `<LazyCanvas>` (mounts near the viewport, pauses off-screen, DOM fallback). The hero is film, not WebGL. Sari is only used through `<SariModel>`.
8. **Motion has a rest state:** everything visible with reduced motion, slow scripts or no WebGL; pause media and loops off-screen.
9. **Media** is generated once and committed under `public/`: `scripts/assets/build-media.mjs` (pictures, clips, hero loop, scroll frames), `scripts/assets/build-model.mjs` (Sari GLB), `scripts/film/*` (the film). Originals live in `assets-src/film/` (not committed). Regenerate pictures only with the same character sheet so faces stay consistent.

## Commands
`npm run dev` · `npm run build && npm run preview` · `npm run typecheck` · `npm test` · `npm run qa:e2e`
Feature in isolation: `/demo.html?f=<name>&qa=1` · screenshots: `node scripts/qa/shot.mjs "<url>" qa/out/<name>`
