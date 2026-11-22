## Studio (2D): the flat-drawing art engine (Stage 3 art engine + first style test)

Status: BUILT, proofs rendered and looked at (22 Nov 2026). Not committed. Provisional look, waiting for the
owner's reference cartoon. All drawing is code: no AI image tools.

### What exists
- **The look as data:** `src/studio/style/profile.ts`. A `StyleProfile` holds line weight and colour, the shading
  model, texture, exaggeration (head, eyes, hands) and palette rules; `MOODS` hold the light of a scene. `GOUACHE`
  is the provisional house look. `INK` exists only to prove that the look swaps without touching a figure
  (`--style=ink`). Tune the look here when the reference arrives.
- **The Painter:** `src/studio/kit/core.ts`. `shape()` is the one way a solid thing is drawn (contour, fill, paint
  texture, form shadow, lit edge, all from the profile). `castShadow`, `groundShadow`, `far(depth)` for air,
  `parallax`, `layer`, `held(t)` for drawings on twos, plus `track`, easing, `hopArc`, `limbPath`.
- **Character builder:** `src/studio/figure/`. `drawFigure(P, sheet, pose, opts)` draws any `Sheet`: five life
  stages, every hair style, top, bottom, shoe and extra of the contract. `pose.ts` (the `Pose`, in the figure's
  own proportions; `FACES`: 14 expressions), `rig.ts` (proportions and joints, pure maths), `face.ts`, `draw.ts`
  (hands: relaxed, point, count 2 to 4, open, grip with a held thing), `gestures.ts` (all 11 `GESTURES`).
- **Animals:** `src/studio/animals.ts` (cat, dog, bird, sheep, fish; re-colourable coats).
- **Places and props:** `src/studio/places/nature.ts` (sky, sun, moon, stars, clouds, rain, hills, ground, grass,
  path, sea, surf, tree, bush, flower, leaf spray, pot plant), `things.ts` (house, fence, stone wall, stall,
  bunting, room, window, sun patch, rug, table, chair, bench, shelf, bed, lamp, fruit, bread, melon, bowl, cup,
  basket, crate, ball, block, teddy, kite, toy car, bucket, book, open book, watering can, umbrella, clock,
  pinned drawing), `places.ts` (garden, kindergarten corner, bedroom at night, market street, sea shore, hills).
- **Cast:** `src/cast/cast.ts`, 13 sheets (teacher, mother, father, two grandparents, four children, two
  toddlers, two teenagers). `src/cast/sheet.ts` gained one optional field, `extraColors`.
- **Scenes:** `src/studio/scene.ts` (a scene is a pure function of time; `words` = real text over a book page,
  `captions` = film captions, also written as WebVTT), `src/studio/mount.ts` (canvas + HTML text; mirrors the
  layout for Arabic and Hebrew, never the art; `page: 1|2` shows one page of a spread as a phone does),
  `src/studio/scenes/` (`spread-oranges`, `shot-tower`, `cast-sheet`, `gesture-sheet`, `face-sheet`, `places`,
  `loop-clap`).
- **Export:** `studio/scripts/export.mjs` (`list`, `still`, `sheet`, `video` shot by shot, `loop`), through the
  Studio's own page (`studio/index.html`, `studio/main.ts`, `studio/vite.config.ts`), so a render never depends
  on the app's routes. `studio/scripts/proofs.sh` renders the whole style test.
- **Lab pages:** `/lab/kit` (character builder: any sheet, any gesture, either profile) and `/lab/studio`
  (every scene with its text and captions, four languages). Route added in `src/routes.ts` (`lab/studio.tsx`).
- **Tests:** `npx vitest run --config studio/vitest.config.ts` (12 tests: rigs, every gesture on every sheet at
  every drawing, pose blending, the export script end to end).
- **Removed:** `kit/people.ts` (three hard-coded puppets), `kit/world.ts` (Moon set leftovers), the old palette.
  `kit/stage.ts` was rewritten for the builder (`blinkAt`, `addHops`, `addWalk`, `smoothBends`, caption phrases).

### The proofs (qa/out/studio/)
- (a) `spread-oranges.png`, `spread-oranges-ar.png`, `.webp` in four languages, `spread-oranges-page1-390.png`,
  `spread-oranges-ar-page1-390.png`, `spread-oranges-he-844.png`
- (b) `shot-tower.mp4` (10 s, 24 frames a second, characters on twos), `shot-tower-ar.mp4`, `shot-tower-sheet.jpg`,
  `shot-tower-390.jpg`, captions `shot-tower.<lang>.vtt`
- (c) `cast-sheet.png` (and `cast-sheet-ink-profile.png`: the same sheet under the second profile)
- (d) `gesture-sheet.png`; extra: `face-sheet.png`, `places-sheet.jpg`, `loop-clap-loop.mp4`

### How to run
- `node studio/scripts/export.mjs list` · `… still spread-oranges --lang=ar` · `… video shot-tower`
- `bash studio/scripts/proofs.sh` (about five minutes) · `npm run dev` then `/lab/studio`

### Checks run (22 Nov 2026)
- `npx tsc --noEmit`: 0 errors in the whole project. `npx vitest run --config studio/vitest.config.ts`: 12 pass.
- Every proof was rendered and looked at as an image, the film as a 12-frame contact sheet and at 390 px, the
  book page at 390 px in English and Arabic, the cast sheet at 390 px. `ffmpeg` found no black or frozen stretch.
- Three rounds of faults found and fixed (hair covering faces, hands hiding faces, elbow loops, tree drawn as
  discs, sitting pose, caption over a face, text wash larger than the words, export ignoring the 2x scale).
- `/lab/studio` and `/lab/kit` opened in the dev server at 390 and 1440 px with no page errors.

### What is still weak (honest list)
- It reads as a well-made digital paper-cut, not as a hand-painted book: edges are too even, there is one form
  shadow per shape and no brushwork that follows form. This is the ceiling the master plan names (risk 1).
- Figures face the viewer (front, three-quarter by sliding the face, and back). There is no true side view, so
  walking across the picture, kneeling and bending down to a child are faked or missing. `addWalk` is written
  but not yet judged in motion.
- A bow and a seated figure are foreshortened by rule of thumb; hands at rest are mittens; fingers cannot curl
  round anything except through the grip shape.
- Night and lamp light only tint the picture: a lamp does not light what is near it (the bedroom is the weakest
  place). Rain, moon and stars exist but are not proven in a scene.
- Animals have one view each and little acting (no walk cycle judged, no turned heads).
- Street houses are plain; the market needs people and goods to feel alive.
- Arabic and Hebrew are set in the container's fallback font (DejaVu Sans): correct, mirrored, but not beautiful.
- The film has no sound yet; the wobble is physics by formula, not by feel.

### What the next Studio job should do first
1. Tune `GOUACHE` against the owner's reference cartoon (line, shading, head size, palette) and re-render
   `bash studio/scripts/proofs.sh`: nothing else needs to change for a new look.
2. Add the side view (profile head, walking legs) to `figure/`, then the walk, run, sit-down and pick-up shots.
3. Start the shot library (about 40 reusable shots): each is a small function like `scenes/shot.ts`.
4. Local light: a lamp or window pool that re-draws what stands inside it under a warmer mood.
5. Three instruction-picture styles for the owner to choose from (Stage 3), using `loop-clap` as the base.

### Notes for the next Studio job
- Never leave a bare `cat >` without input in a shell command here: it hangs the session.
- The sample story lines in `spread-oranges` and `shot-tower` are StoryTime's own test text, not a story.
- The container has no Arabic or Hebrew book font (DejaVu Sans is used); the text is real HTML, so the Stage 2
  fonts drop in through `mount.ts` (`LATIN`, `ARABIC`, `HEBREW`).
- CDP screenshots ignore the device scale unless `clip.scale` is set: the export script sets it.
- This file is shared with other helpers: if this section goes missing, a copy of it is the comment block at the
  top of `studio/scripts/proofs.sh`'s neighbour `studio/README-HANDOFF.txt`.
