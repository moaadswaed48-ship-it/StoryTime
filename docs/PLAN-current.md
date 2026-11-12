# StoryTime: fixes before the meeting (about 5 hours)

## Context

You tested the site on your iPhone, chose **version B**, and found it still falls short in several places.
The meeting with Sari's mother is in about 5 hours. This plan fixes what you listed, in order of how
much each item helps the meeting, and says plainly what cannot be done today.

**Your answers just now:** use the free Microsoft voice; the scroll effect should be her paintings floating
in 3D depth, one scene per scroll step.

**What I found when I investigated (so the fixes are aimed at real causes):**
- **Book pages:** the picture is drawn in a box at the top, then a hairline, then text. That is the "generic" look.
- **No narration exists.** The ▷ button in the book opens the film; the speaker only plays a synth tune.
- **Blurry landing pictures:** her paintings are small files (1344×752; the cover is 880×1168). The landing
  page stretches the middle 40% of a video frame across the phone, 2–3 times its real size. That is the blur.
- **Shelf "glitches and elevates":** inside the app, the opened book's panel is positioned against the whole
  home page instead of the shelf, so the book flies far up and the page scrolls after it. The lag comes from
  the shine and shadows being repainted on every frame for all 12 books.
- **Landing length:** about 15–18 phone screens, 7 of them in two sticky scroll tracks.
- **Paid generation is not available:** the Higgsfield account has 1.5 credits left.

## What cannot honestly be done today

- **A true cartoon film** (characters acting with emotion, lip-synced voices) needs new animation. That takes
  paid AI video generation or animators; it cannot be made from code in a few hours. Today I can make the film
  a **told story**: a calm storyteller reads her own sentences over the six animated clips and her paintings,
  with music and sound. Character voices for the two boys would need child voices, which the free voices do
  not have; fake ones would embarrass you. I suggest presenting real character animation and cast voices as
  the first paid milestone.
- **The open-world game** is a multi-week project. Today it gets a design document, not a build (section at the end).
- **`/advisor`:** I cannot run that command myself in this session. I get the same effect with an independent
  reviewer at two points: now (it is checking this plan) and before publishing (fresh-eyes audit of the result).

## The work, in priority order

### 1. Make version B the main build (5 min)
Apply `docs/versions/version-b.patch`, run typecheck and unit tests, commit.

### 2. The storyteller's voice (start first; you hear a sample within ~20 min)
- Install the free `edge-tts` package; voice: a calm Arabic woman (`ar-SA-ZariyahNeural`, slowed about 10%;
  I will send you 2 short samples to choose from, since I cannot hear).
- Generate one file per paragraph (37 Arabic, 37 English with a calm English voice) and one per scene "cue"
  line for the film. Save under `public/audio/story/` with a small `index.json` of durations.
- Her text is read exactly as written. Nothing is edited or re-vowelled.
- New script: `scripts/audio/narrate.mjs` (re-runnable).

### 3. Book reader: page design and "listen" (`src/features/reader/*`, then `src/features/book/*`)
- **Page design** (`paint.ts` `paintScene`): remove the hairline; the painting's lower third melts into the
  paper (the same gradient the title page already uses, `paint.ts:166-173`); a soft warm vignette at the top
  under the controls. The moving clips must melt the same way: feather the bottom of the "live window" in
  `curl/shader.ts` (`inside()` → `smoothstep`) and paint the same fade in `frameOf` before `engine.patch`.
  Page geometry and page breaks stay exactly as they are (tests in `tests/reader.test.ts` pin them).
- **Listen button** (`Chrome.tsx`, `Reader.tsx`, new `src/features/reader/narration.ts`):
  - A headphones button in the top bar. Tap: the voice reads the paragraphs on the open page, then the page
    turns by itself and the reading continues. Tap again, turn a page by hand, or close: it stops.
  - One reused `<audio>` element started inside the tap (iPhone rule). Paragraphs are matched to pages with
    the existing `lines[].para / opens`; a paragraph split over two pages turns the page part-way through.
  - Music/sfx tune pauses while the voice reads. New words go in `src/i18n/copy.ts`.
  - Same hook in the simple (reduced-motion) book if time allows; otherwise the button is hidden there.

### 4. Bookshelf: the glitch and the lag (`src/features/library/*`)
- **Glitch:** `.lib { position: relative }` (`library.css`); run `reveal()` after the panel has rendered and,
  on phones, only make sure the book is visible; keep animating while a book is flying even if the shelf
  leaves the screen (`controller.ts` `tick`); smaller forward swoop on phones.
- **Lag (phones only):** freeze the moving shine and remove the sheen layer; drop the drop-shadow filters and
  the large blurred shadow layers (keep one small contact shadow); hide the back face that can never be seen;
  stop re-rendering React on every book crossed during a drag (commit the selection on release);
  replace the entrance mask with a paper-coloured gradient strip.
- QA hooks and `tests/e2e/library.spec.ts` behaviour stay the same.

### 5. Landing page: shorter, sharp, 3D (`src/pages/Landing.tsx`, `src/features/hero`, `src/features/scrollstory`)
- **Shorter:** Hero → the 3D scroll scene → Shelf → Meet Sari → her section → footer (about 7 screens).
  Removed from the landing page: the game poster, the app tour, the parents cards and the plans.
  The plans move into the app's grown-ups "plan" tab (reuse `PlanCard` and `Toggle`; `seePlans()` no longer
  jumps to the landing page). Nav and footer links are updated. The removed sections' code stays in the repo.
- **Scroll scene (your choice: pictures in 3D depth):** one WebGL scene in a `LazyCanvas`
  (`src/features/scrollstory/Depth.tsx`, new). Her paintings hang as large rounded cards in a warm, foggy
  space; each scroll step glides the camera to the next card; 3D leaves fall between them; the scene tilts
  with the finger or mouse. Cards show the whole painting at about 85% of the phone's width, so they are
  sharp without stretching. The three big words (Read / Watch / Play) and their buttons stay on top
  (`beats.ts` and the `.ss-ui` layer are reused); the old frame-scrubbing canvas and its 242 frame files are
  removed from the page (and from the published site). Track shortened to about 3 screens.
  Reduced motion or no WebGL: the existing still version (`StillStory`).
  Stretch goal only if time remains: depth inside each painting using the film studio's depth shader
  (`video/src/kit/plate.ts`, specs exist for six paintings).
- **Hero:** no video on phones. A sharp still instead: try a 2× AI upscale of the paintings on this machine
  (15-minute attempt; open-source upscaler from PyPI with weights from Hugging Face). If it works, the
  portrait cover fills the phone hero sharply. If it does not, the hero shows the cover as a large framed
  picture at its true sharpness on a soft blurred ground. The touch-reactive leaves (`Wind.tsx`) stay.
  Desktop keeps the film (it is sharp there).

### 6. The film as a told story (`video/*`, `src/features/film/*`)
- The storyteller reads each scene's cue line (her own sentence, already used as captions); music is lowered
  under the voice; each scene lasts as many music bars as its sentence needs; captions stay in sync.
  Expected length about 1.5–2 minutes. `video/scripts/render.mjs` gets a second audio input with ducking;
  `story.timeline.json` is generated from the audio lengths; `story.json` follows automatically.
- Render in the background (about 15–25 min), check frames and loudness, send you the file to listen to.
- Cut line: if the voice or the render slips, the current film stays and only the book gets the voice.

### 7. Sweep for other weak parts, then publish
- Fresh-eyes reviewer (independent) on the built site at iPhone, iPad and laptop sizes: list of what still
  looks cheap or broken; I fix the top items that fit the time.
- Full test suite once, update tests for the removed landing sections, publish to the main address
  (`node scripts/deploy/site.mjs`, `gh-pages`), remove the `/b/` copy, verify the live site, send you the link
  with at least 40 minutes to spare.

## How the time is used
- Three builders work in parallel on separate folders (reader, landing, shelf) while I do the voice, the film,
  the merge and the checks. The machine has 4 cores, so the film render and the full test run are scheduled
  after the builders' heavy work.
- **Cut lines if things slip (dropped first → last):** depth inside paintings → English narration → simple-book
  narration → narrated film → hero upscale (use the framed-picture fallback). The book voice, the page design,
  the shelf fix and the shorter landing page are not cut.
- Nothing half-done is published: each piece is merged only after I have looked at it on a phone-sized screen.

## How it is checked
- `npm run typecheck`, `npx vitest run`, `ST_DEV=1 npx playwright test` (full run once at the end).
- `node scripts/qa/eyes.mjs` on iPhone / sideways / iPad / laptop profiles: landing walk, shelf open (ready
  and coming-soon book, landing and in-app), reader pages with a live clip, listen → auto page turn, film.
- Audio: durations, loudness and silence checks by tool; **you** listen to the samples and the film
  (I cannot hear).
- Live site: load it after publishing and repeat the key flows.
- Not possible here: a real iPhone. Your own test remains the final check.

## After the meeting: the open-world game (plan only)
A design document `docs/GAME-WORLD.md`, written after the site is published. Outline:
- **Audience and bar:** ages 7–10, real challenge (the difficulty of a proper game, not a toddler toy), Arabic
  first.
- **World:** one hand-built open valley around the kindergarten town from the stories (school yard, olive
  grove, market, river, hill), seasons that change with progress. Third-person movement, stamina, a map.
- **Loop:** explore → take quests from characters → solve → earn tools and badges → unlock new areas.
- **Learning inside the play, by difficulty tier:** Arabic (reading clues, spelling to open gates, grammar
  riddles), maths (measuring, trading in the market, fractions to mix paint), science (seasons, plants, water,
  birds' migration routes), logic (lever and bridge puzzles, simple programming of a helper bird).
- **Story links:** every published story adds a place and a quest line; many quests are independent of stories.
- **Progress:** skills tree, journal for grown-ups (what the child practised), three difficulty settings.
- **Tech:** the site's own stack (three.js / React Three Fiber) with a physics engine, built as a separate
  app module so it can ship inside the future iOS/Android apps; first milestone is a 10-minute vertical slice
  (one area, five quests).
