# StoryTime — project rules for Claude

Vite 8 + React 19 + TypeScript 5.9 + Tailwind 4 · @react-three/fiber 9.8 + @react-three/drei 10.7 + three 0.186 · maath · @use-gesture/react · Lenis + GSAP (ScrollTrigger, SplitText) · zustand · zod.
Not used on purpose: physics engines (rapier/cannon), drei ScrollControls, motion/framer-motion, WebGPU, CDN assets at runtime.

## Hard rules
1. **One canvas, one clock.** A single fixed, transparent `<Canvas>` (`eventSource` = `#page`, `eventPrefix="client"`, `frameloop="always"`) is lazy-mounted after the hero image decodes. Lenis runs on the prioritized GSAP ticker (`src/app/Providers.tsx`); never start a second rAF loop, never `ScrollTrigger.normalizeScroll`/`scrollerProxy`, never GSAP `pin:`. If `frameloop="never"` + `advance()` is ever used, pass SECONDS.
2. **drei View invariants.** Every 3D moment is an inline `<View>` whose DOM element is EMPTY, has `position:relative; z-index:10`, and is the gesture target. Lights, `<Environment>`, shadows live INSIDE each View. Never `preserveDrawingBuffer`, never `scene.background`.
3. **Fast values never touch React.** Scroll progress, pointer, the shelf sim, camera targets are mutable refs read in `useFrame`. Zustand holds phase/selection/filters only. Clamp `delta` to 1/30 in every `useFrame`.
4. **DOM is the source of truth.** The hero `<picture>` in `index.html` is the LCP (it lives OUTSIDE `#root`); the shelf has a sr-only mirror list that becomes the visible no-WebGL fallback; page one is readable in a native `<dialog>`.
5. **Seeded randomness only** (`src/lib/seeded.ts`); `maath/random` has no mulberry32.
6. **Motion tiers** (`useMotionTier`): `full` | `low` | `reduced`. Reduced = no shuffle, no scrub, instant snaps, 200 ms opacity reveals. Create ScrollTriggers inside `useGSAP({ scope, dependencies: [tier] })`.
7. Animate only transform/opacity/uniforms; max two `backdrop-filter` surfaces on desktop, none animated.
8. Content lives in `content/books.json` + `content/site.json` (zod-validated in predev/prebuild). Never hard-code book data in components.

## Which skill for what (vendored in .claude/skills)
- Visual direction / tokens → `frontend-design` (the italic accent word and uppercase badge are mandated by the client reference — keep them)
- Scroll choreography → `gsap-scrolltrigger`, `gsap-react`, `cinematic-gsap-lenis-motion-system`
- R3F / three → `threejs-react-three-fiber`, `threejs-performance`, `r3f-interaction`, `webgl-landing-steering`
- Micro-interaction timing → `emil-design-eng`; review passes → `review-animations`, `web-design-guidelines`, `build-awwwards-quality-sites`

## Commands
`npm run dev` · `npm run build && npm run preview` (QA always on the preview build) · `npm run validate` · `npm test` · `npm run qa:screens` · `npm run qa:e2e`
