# Audit: asked vs. built (laptop, 12 Nov 2026)

Sources: `ReOrg.txt` (owner's notes), `docs/SPEC.md`, `docs/HANDOFF.md`, `docs/PLAN-current.md`, the code on
`claude/hopeful-fermat-0tr54y`, 179 commits. The cloud chat itself has not been read (not reachable from here).
Ledger IDs refer to `..\REQUIREMENTS.md`.

## Confirmed by looking at the code

| # | Finding | Evidence | Ledger |
|---|---|---|---|
| 1 | The owner's original hero picture (stack of books on a mossy mountain top, butterflies, green; a "TerraGrip" MotionSites-style layout) is in the repo but **used nowhere**. | `assets-src/reference-ui.jpg`; no reference in `src/`, `scripts/`, `index.html` | R11, R12 |
| 2 | A modified version (valley view, books pushed to the right edge) also exists and is also unused. The live hero is the autumn film of the two boys instead. | `assets-src/hero.jpg`; `src/features/hero/*` | R12 |
| 3 | The whole brand is the one story: the spec itself orders "a film-like autumn world", one accent colour named `maple`, falling leaves as the shared decoration. | `docs/SPEC.md` §2; `src/design/Leaves.tsx`; `src/index.css` | R10 |
| 4 | Landing and app share one design system (same tokens, glass, pills, fonts) on one page, so they read as the same site. | `CLAUDE.md` rule 4–5; `src/pages/Landing.tsx`, `src/pages/AppShell.tsx` | R5 |
| 5 | The shelf is on the landing page (and again inside the app home). | `src/pages/Landing.tsx` → `<Library />` | R6 |
| 6 | GSAP/Lenis/three are installed and used, but under self-imposed limits: "never use GSAP `pin:`", "the hero is film, not WebGL", "no new npm packages". These caps explain the weak scroll feel. | `CLAUDE.md` rules 6–7; `docs/SPEC.md` §1.2 | R7 |
| 7 | None of the UI libraries the owner named are used (gluestack, Lightswind, bencho). | `package.json`; `docs/HANDOFF.md` "Things only the owner can do" | R9 |
| 8 | 12 skills were vendored into `.claude/skills/`; only the MotionSites one is cited in the spec and rules. | `.claude/skills/*`; `docs/SPEC.md` | R8 |
| 9 | The "film" is her paintings + 6 five-second clips + a narrator. Voice is Google's free one. No character acting, no character voices. | `docs/HANDOFF.md` table; `scripts/audio/narrate.py` | R15, R16 |
| 10 | One story only. Other books on the shelf are placeholders. | `src/content/library.ts`, `src/content/story.ts` | R17 |
| 11 | The open-world game was never started; only a half-page outline exists. The built game is a small yard game the owner did not like. | `docs/PLAN-current.md` (end); `src/features/game/*` | R21 |
| 12 | Game poster, app tour, parents section and plans were removed from the landing page in the last session; their code is still in the repo, unused there. | comment in `src/pages/Landing.tsx` | R5, R18 |

## Listed as open by the cloud session itself (HANDOFF)

- "Words in the empty spaces" of book pages: not done.
- Listen button missing in the simple (reduced-motion) book.
- Paintings k02–k12 not upscaled (only the cover is sharp).
- Fresh-eyes audit of the new build: never run.
- Nobody has listened to the narration or the film. Nothing was ever tested on a real iPhone or on WebKit.
- Nothing from the last session is published; the live site is still the older version A / B.

## Wrong or different on this laptop

- **WebKit is installed but the test suite cannot use it:** `playwright.config.ts` has only two projects and both
  are Chromium (the "mobile" one is an iPhone-sized Chromium). The suite also forces software rendering
  (`--use-angle=swiftshader`), so the graphics card is not used in tests.
- **`ffmpeg` is not installed** → the film cannot be rebuilt here yet. **Blender is not installed.**
- The four sub-session branches and `feat/3d-site` hold nothing extra: every commit is already in the working branch.
- `npm install` reports 4 moderate advisories (not looked into).

## Still unknown (needs the owner or the cloud chat)

- Which skills and which reference websites he named in chat (R8, R9).
- What "the request" on the landing page is (R18).
- Whether "hex field" means Higgsfield (R13).
- Audience age: 3–6 (spec), 7–10 (game outline) or 3–12 (new notes) (R26).
