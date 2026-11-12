# Audit 2: the whole build, attacked (13 Nov 2026)

Method: the **live site** (https://moaadswaed48-ship-it.github.io/StoryTime/) walked as a parent on an iPhone 14
profile in **WebKit** (Safari's engine) and Chromium: landing → sign-up → enter → picker → home → the autumn story
(read + listen, watch, play) → tree → shelf → Moon book → Moon film → grown-ups → author's desk → back. Plus a read of the
code, the copy, the published folder and the vendors' terms. Evidence: walk logs and screenshots in the session scratchpad.

Ranking: **Broken** (does not work) · **False** (says something untrue) · **Incoherent** (works, but makes no sense
together) · **Risk** (legal/safety) · **Hygiene** (will hurt the next session).

## The core problem in one paragraph
The site promises *"one story, three ways, the same characters everywhere"*. Today that promise is broken in every
direction: the game has none of the story's characters, the new story is a film without a book, the three pieces are in
three different art styles, and the landing (green, daylight) and the app (brown, autumn) look like two products. Most
findings below are symptoms of building pieces in parallel without one rule tying them together.

## Broken
| # | Finding | Evidence | Fix |
|---|---|---|---|
| B1 | ~~The shelf's book covers are blank in Safari's engine.~~ **Corrected 13 Nov: a test-browser artefact, not an iPhone bug.** Playwright's WebKit on Windows cannot draw CSS 3D at all (`(-webkit-transform-3d)` reports false; a bare two-face card flip fails the same way), so the back board was painted over the cover. Real iOS Safari supports CSS 3D. | `qa/out/min-sheet.png`, `qa/out/sheet-webkit-phone-before/after.png` | Harmless fallback added (`library.css`: hide the back faces where 3D is unsupported); Chromium pixel-identical. Still worth one look on the owner's iPhone. |
| B2 | **The tree's "letters I learned" panel can never fill.** It says the letters come from the game; the game now in place (Friends Island) has no letters. | `src/features/tree/index.tsx:148,250`; copy «الحروف التي تعرفها في اللعبة تظهر هنا» | Hide the panel until a game feeds it. |
| B3 | **Deploy never type-checks.** `site.mjs` runs `vite build`, not `npm run build`; one publish went out while the type check was failing. | `scripts/deploy/site.mjs:12` | Run the type check first; stop on failure. |
| B4 | **The browser test suite has not run on any of the last day's work**, and its 5 earlier failures (checkout, film ×3, footer) were never diagnosed. The config has no WebKit project, though the owner shows the site on an iPhone. | `playwright.config.ts`; `qa/out/e2e-laptop.log` | Add a WebKit iPhone project; run the suite; fix or rewrite the specs for the new landing. |

## False (the site says something untrue)
| # | Claim | Reality | Where |
|---|---|---|---|
| F1 | "a game with the same heroes" / «لعبة ببطل الحكاية نفسه: اركض معه والعب» / «ثم لعبة من الحكاية نفسها» / «الشخصيات نفسها في الكتاب والفيلم واللعبة» | The game is Friends Island: build a creature, befriend creatures. No Sari, Amir, Layla, no story. | `copy.ts` landing hero sub, ways, parents answer 1, cast lede (≈ lines 273, 289, 296 + English) |
| F2 | Story page "Play" card: «اجمع أوراق الأسماء مع ساري» | The Play door opens Friends Island; the name-papers game is only at `?game=yard`. | story page copy; `src/App.tsx` |
| F3 | Landing "How it works": «لقطات حقيقية من التطبيق كما يعمل اليوم» | The screenshots are from 12 Nov morning: old shelf, old game card. | `public/app/shots/*`, `Steps.tsx`, `Closing.tsx` |
| F4 | Moon book: «فكرة منّا لحكاية قادمة، لم تُكتب بعد» right above "watch scenes from the film" | The story is written (our draft) and 7 film scenes exist. | shared coming-soon note, `library/index.tsx` |
| F5 | Landing kicker "ages 3 to 12" vs. her book card "3–6 سنوات" | Her story is for 3–6; the service is 3–12. Not false, but unexplained side by side. | `copy.ts:67,858` |

## Risk
| # | Finding | Evidence | Fix |
|---|---|---|---|
| R1 | **The narration's licence.** All 122 narration files were made on a **free** ElevenLabs account. ElevenLabs: *"The free plan does not include a commercial license… Content created outside of a paid subscription (before or after) cannot be used commercially and always requires attribution when shared non-commercially."* The site shows no attribution, and the service is meant to be paid. Upgrading later does **not** clear these files. | elevenlabs.io help centre, "Can I publish the content I generate on the platform?" (fetched 13 Nov) | Now: add "Voice: ElevenLabs" credit. Before any paid use: re-record on a paid plan (Starter $6/month, 30,000 credits — enough for this story ×3). Also the second free account was opened to get around the limit. |
| R2 | **An old public copy is still online** at `/StoryTime/b/` (version B, older film, missing audio). | live `/b/` returns 200; deploy script keeps `b/` | Delete `b/` from the published site. |
| R3 | **The hero picture was made with Google's Nano Banana Pro** (before the owner's "no Google or third-party AI" rule), from a MotionSites-style mock (`assets-src/reference-ui.jpg`, a "TerraGrip" product page). The spec forbids copying MotionSites media. | `assets-src/landing/hero-plate.jpg` | Owner decision: keep, or redraw in code. |
| R4 | The book's title page carries a dedication written by us, «إلى كل طفل يحبّ أن يسأل», inside **her** book. | `copy.ts:87` | Owner decision (HANDOFF flagged it on 12 Nov). |

## Incoherent (works, but makes no sense together)
| # | Finding |
|---|---|
| I1 | **Three art styles for the same characters**: AI-painted Pixar-like (her book, film, app), a 3D model (landing "Meet Sari"), and flat paper-cut code (the Moon film). Plus a fourth world, Friends Island's procedural creatures. |
| I2 | **Two films, two players**: her film is an mp4 in the cinema player (chips, scrubber, voice); the Moon film is a live canvas in another player (no voice, captions only, 7 of 12 scenes — starts on the Moon, ends at lift-off, so the question and the payoff are missing). |
| I3 | **The new story is a film without a book.** "Read" is the first of the three ways, but the Moon story cannot be read in the app. |
| I4 | **Two front doors.** Landing: light green, daylight. App, sign-in sheet, checkout, picker, favicon, boot background: dark brown and autumn. Moving from one to the other feels like changing websites — the owner's original complaint, now inverted. |
| I5 | **Two sign-ins.** A parent creates an account (name, email, password) → "the library is open" → then must type a child's name again in "who is reading today?". The account does nothing the picker doesn't. |
| I6 | **Plans in two places** (landing and the grown-ups tab), same component; harmless, but the landing is now ~15 phone screens after the owner asked for a shorter page (PLAN-current cut 15–18 screens). |
| I7 | The author's desk lists the Moon story as an "idea folder" while the shelf plays its film. |
| I8 | The author's desk (her manuscript) opens straight from the address `#studio`, skipping the grown-ups' gate. |

## Checked and fine
- Listen button: plays the new voice and turns pages by itself, in WebKit and Chromium, on the live site.
- Narration pace: Arabic ~575 words in 344 s ≈ 100 words a minute (the old voice was ≈ 68, very slow). Normal read-aloud pace for children.
- Moon film opens from the shelf, plays, closes back to the shelf, in both engines.
- Friends Island reaches its title screen in WebKit (≈ 20 s on software rendering).
- No API key leaked into the repo, the published site or the game folder.

## Hygiene
| # | Finding | Fix |
|---|---|---|
| H1 | `CLAUDE.md`, `docs/SPEC.md`, `docs/HANDOFF.md` still order an autumn world, the maple accent, "the hero is film, not WebGL", "never GSAP pin", ages 3–6, Google voice. The next session will "correct" the site back. | Rewrite `CLAUDE.md` and `HANDOFF.md` to the current state; mark SPEC.md as history. |
| H2 | The game's **modified source** lives outside the repo (`Desktop\Story time\game-src\wigglewild`), still pointing at Patch's git remote and `patch.json`. Only the built files are committed. | Copy the source into the repo (`game/friends-island/`), without `node_modules`, `.git` and `dist`. |
| H3 | `public/audio/story/` per-paragraph files are probably unused by the reader (HANDOFF said so). | Check, then drop from the published site. |

## Decisions only the owner can make
1. **The game:** re-skin Friends Island with Sari, Amir and Layla and story missions, *or* keep it as a standalone "friends" game and reword the promise. (Decides F1, F2, I1.)
2. **One art style going forward?** The Moon film is code-drawn paper-cut; her story is AI-painted. New stories can only be code-drawn now (owner's rule), so her story will always look different.
3. **Hero picture and dedication** (R3, R4).
4. **ElevenLabs:** pay for Starter and re-record, or remove the voice before any paid launch (R1).
