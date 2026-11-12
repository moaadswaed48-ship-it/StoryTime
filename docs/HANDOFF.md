# StoryTime: hand-off (12 Nov 2026)

Read this first, then `CLAUDE.md` (project rules), `docs/PLAN-current.md` (the plan the owner approved today)
and `docs/SPEC.md` (the original build spec; parts of it are now out of date, this file wins).

## Who and why
- **Owner:** Moaad. Not a developer. Wants short, plain answers, the conclusion first, at most one question at
  a time, and to be told when he is wrong or when a better approach exists.
- **The site:** a surprise preview of a storybook service for **Sari's mother**, an educator with a doctorate
  who writes Arabic children's stories (ages 3–6). If she likes it and pays, Moaad manages the site and later
  ships iOS/Android apps. He has a **meeting with her on 12 Nov** and must not be embarrassed.
- **Never** contact her, edit her Arabic text (`src/content/story.ts`), or invent prices, reviews or credentials.

## Where things are
- **Repository:** `moaadswaed48-ship-it/StoryTime`, working branch **`claude/hopeful-fermat-0tr54y`**
  (all work is here; `main` only has a README). No pull request unless the owner asks.
- **Live site (GitHub Pages, branch `gh-pages`):**
  - https://moaadswaed48-ship-it.github.io/StoryTime/ = **version A** (yesterday's build, before today's work)
  - https://moaadswaed48-ship-it.github.io/StoryTime/b/ = version B (A + polish). The owner chose B.
  - **Nothing from today's session is published yet.** `gh-pages` has a local-only tag idea
    `rollback-before-meeting` at commit `2ed1913` (the current live state).
- **Publish:** `git worktree add ../storytime-pages gh-pages` once, then
  `node scripts/deploy/site.mjs --out=../storytime-pages`, commit and push in that folder. The script keeps the
  `b/` folder; delete `b/` there when version B is no longer needed for comparison.

## State of the working branch (today's work, all committed)
Everything below typechecks and the 61 unit tests pass. **The full browser suite has NOT been run on this state**
(the cloud machine was overloaded). Run it before publishing: `ST_DEV=1 npx playwright test --trace off`.

| Area | What changed today | Checked | Still open |
|---|---|---|---|
| Base | Version B (press feedback, timing, hover fixes) is now the main build | typecheck, unit tests | — |
| Fonts, digits | IBM Plex Sans Arabic for Arabic UI (owner's choice), Western digits everywhere | seen on phone profile | — |
| Sign-in, checkout | Accept any text; gate and Family plan → pay sheet → printed receipt | e2e passed yesterday | — |
| Book reader (`src/features/reader`) | Painting fades into the paper (no hairline); **listen** button reads the story and turns pages | screenshots; unit tests; narration e2e 3 of 4 | re-run `reader.spec` + `book.spec`; no listen button in the simple (reduced-motion) book; never tried on a real iPhone |
| Narration audio (`public/audio/story`, `scripts/audio/narrate.py`) | Whole story in Arabic and English, one file per scene + per paragraph + per cue line; **Google's free voice** | durations only | **Owner has not approved the voice by ear.** Microsoft voices were unreachable from the cloud (WebSockets blocked); they should work from a laptop (`pip install edge-tts`). Per-paragraph files are probably unused now and can be dropped from the site |
| Film (`video/`, `public/film/story.mp4`) | Re-timed to the storyteller: each scene lasts as long as its spoken line (1 min 57 s), voice over lowered music, paving shots replaced by her paintings | stills looked at; length and loudness measured | **Nobody has listened to it.** `tests/e2e/film.spec.ts` was updated for the new length but not re-run |
| Shelf (`src/features/library`) | Fixed "glitches and elevates" (panel was positioned against the whole app page); phone performance work | library + home specs passed before the last test was added | the newly added in-app test fails on desktop under software rendering (see its report in the commit history); verify lag on a real iPhone |
| Landing (`src/pages/Landing.tsx`) | Now Hero → 3D scroll scene → Shelf → Meet Sari → Author → Footer; plans moved into the app's grown-ups "plan" tab | screenshots | edited specs (hero, nav, footer, grownups, pricing…) never completed a run |
| Scroll scene (`src/features/scrollstory`) | The owner's choice "pictures in 3D depth": 12 paintings as cards in depth, leaves, reacts to the finger; old video frames deleted | its spec passed 10/10 | real-phone smoothness unknown |
| Hero | Phones (portrait) show a sharp still (cover upscaled 2× with Real-ESRGAN, `public/story/hero-phone.webp`); no video | screenshots at 4 phone sizes | k02–k12 not upscaled (`scripts/assets/upscale.py`) |

### Film file
`public/film/story.mp4` is the finished narrated cut: 117.5 s, 23 MB, voice over lowered music (checked by tool:
length, loudness −17.7 dB mean; not listened to). To rebuild it: `cd video && npm ci && node scripts/prepare.mjs &&
node scripts/render.mjs story` (needs `ffmpeg` and Chromium; a few minutes on a laptop).

## What the owner asked for today (his words, condensed) and where each stands
1. Book pages: picture and text joined creatively, not a box and a line. → fade done; "words in the empty
   spaces" not done (needs per-scene art direction).
2. Audio button: a calm woman's voice reads the story, free/open voice. → built; voice awaiting his approval.
3. Films must be cinematic cartoon films with emotion and character voices that tell a story, not "live
   photos". → today only a narrated film was possible. Real character animation needs paid AI video or
   animators (the Higgsfield account has 1.5 credits). Proposed as the first paid milestone. Not accepted yet.
4. Landing page is too much; scroll effect not as imagined; landing images low resolution; wants reactive 3D
   instead of video. → shorter page, 3D depth scene, sharp hero built; he has not seen them.
5. Shelf lag and the open glitch. → fixed in code, unverified on his phone.
6. "Investigate every bad part and fix it." → a fresh-eyes audit of the new build has not been run yet.
7. A big open-world educational game for ages 7–10 (quests, progress, difficulty; not tied only to stories).
   → plan only; outline at the end of `docs/PLAN-current.md`; write `docs/GAME-WORLD.md` when he asks.
8. He keeps the small games but did not like them much.

**Before resuming any build:** the owner wants to **discuss changes to the plan first**. Ask him what they are.

## Things only the owner can do
- Listen to the narration and the film (no assistant session has heard them).
- Try the site on his real iPhone (Safari). No session has tested on real WebKit.
- Decide: the dedication line «إلى كل طفل يحبّ أن يسأل» (ours, not hers); UI libraries he likes
  (gluestack v5 is for native apps; Lightswind and bencho are web libraries; none are used).

## Working on a laptop: setup
```bash
git clone https://github.com/moaadswaed48-ship-it/StoryTime.git && cd StoryTime
git checkout claude/hopeful-fermat-0tr54y
npm install
npx playwright install chromium webkit   # webkit = Safari's engine: use it for tests and screenshots
npm run dev                              # http://localhost:5173
```
- Checks: `npm run typecheck` · `npx vitest run` · `ST_DEV=1 npx playwright test --trace off`
- Look at it like a person: `node scripts/qa/eyes.mjs "<url>" qa/out/x --steps='[…]'` (iPhone profile by default).
- One feature alone: `http://localhost:5173/demo.html?f=<feature>&qa=1`.
- What a laptop adds over the cloud session: a real browser to watch while editing, Safari/WebKit testing,
  a GPU (3D scenes ran at 1–3 frames a second in the cloud), speakers, Microsoft's voices, faster film renders.

## Model and working rules the owner set
- Visual, animation and video work: the strongest model at medium effort; other work: high effort.
- Never switch models on your own when a limit is hit; tell him.
- Sub-agents: give each its own folders; the lead commits. Do not publish anything half-done.
- Commit messages end with the co-author line used in this repository; never put model names in the code.
