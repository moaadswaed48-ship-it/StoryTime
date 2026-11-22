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

### Notes for the next Studio job
- Never leave a bare `cat >` without input in a shell command here: it hangs the session.
- The sample story lines in `spread-oranges` and `shot-tower` are StoryTime's own test text, not a story.
- The container has no Arabic or Hebrew book font (DejaVu Sans is used); the text is real HTML, so the Stage 2
  fonts drop in through `mount.ts` (`LATIN`, `ARABIC`, `HEBREW`).
- CDP screenshots ignore the device scale unless `clip.scale` is set: the export script sets it.
- This file is shared with other helpers: if this section goes missing, a copy of it is the comment block at the
  top of `studio/scripts/proofs.sh`'s neighbour `studio/README-HANDOFF.txt`.
