# StoryTime — project rules for Claude

Preview site for a children's storybook service (ages 3–6). Arabic (RTL) is the default; English is a one-tap switch.
Vite 8 + React 19 + TS + Tailwind 4 · R3F 9 + drei 10 + three · GSAP (ScrollTrigger, SplitText) + Lenis · zustand.

## Hard rules
1. **The author's Arabic story text in `src/content/story.ts` is hers.** Never edit, "fix" or re-vowel it without the owner's say-so. The English column is our draft translation and is labelled as such.
2. **One canvas, one clock.** A single fixed transparent `<Canvas>` (`src/three/Scene.tsx`); every 3D moment is a drei `<View>` (hero butterflies, `MascotView`, `GameView`) mounted through `src/three/Lazy3D.tsx`. Lenis runs on the GSAP ticker; no second rAF loop for 3D, no GSAP `pin:` (use CSS sticky — see `BookStage`).
3. **View elements** carry `.view-target` (position:relative; z-index:10) — size them with `h-full w-full` inside a positioned parent, never `absolute inset-0` (it collapses to height 0).
4. **The book is DOM/CSS 3D, not WebGL** (`src/components/reader/*`, `.book/.leaf/.sheet/.popup` in `src/index.css`) so Arabic text stays crisp and it works without WebGL. Wide screens: two-page leaves; phones: one turning sheet.
5. **Locale** is resolved once per load in `src/i18n/locale.ts` (`?lang=`, localStorage); switching reloads. All copy lives in `src/i18n/copy.ts` (both languages must keep the same shape). Use logical CSS (`start/end`, `ms/me`), `dirSign` for mirrored motion.
6. **Arabic typography:** never split text by characters, no letter-spacing, generous line-height; canvas text uses `direction='rtl'` after the font has loaded.
7. Fast values stay in refs read in `useFrame`; clamp `delta` to 1/30. Motion tiers (`useMotionTier`) and the reduce-motion toggle must keep working.
8. No invented prices, reviews or credentials. The login is a demo: prefilled, read-only, nothing is sent.
9. Illustrations in `public/story/` were generated with Higgsfield from one character sheet (`assets-src/story/sheet.png`, not committed); regenerate with that sheet as the reference to keep faces consistent.

## Commands
`npm run dev` · `npm run build && npm run preview` · `npm run typecheck` · `npm test` · `npm run qa:e2e` · `node scripts/qa/shots.mjs ar|en` (screenshots into `qa/out`)
