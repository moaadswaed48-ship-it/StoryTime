# Status at pause (2026-11-12)

Paused on request of the parent session. Resume from here.

## Finished
- The studio itself (`video/`): deterministic renderer, 3D kit, Arabic type, music synthesiser, QA script, README.
- Trailer, **first render**, published and measured: `public/film/trailer-16x9.mp4` (36 s, 11.68 MB) and
  `public/film/trailer-9x16.mp4` (36 s, 11.73 MB), plus `trailer-poster.jpg`. H.264 yuv420p, AAC, faststart;
  −17.5 LUFS, true peak −5.0 dBFS; all detected cuts on bar lines.

## Half-done
- **Those trailer files are one revision behind the code.** After they were rendered, the opening and end card
  were reworked in code (sharp first frame with a focus pull; end card on the sunset / the cover, type moved
  into the sky). Checked in stills only; not re-rendered. The poster is also the old (blurred) one.
- **Trailer review not completed.** A fresh-eyes reviewer was started on the first render and stopped at the
  pause; no verdict exists.
- **Story film not rendered.** `src/comps/story.ts` and all shots exist and were checked in stills
  (twelve scenes, 80 s, 32 bars). A full render was 60% through when stopped. `story.mp4` / `story.json`
  do not exist yet. Not reviewed.
- Music has only been measured (loudness, peaks, spectrum), never listened to.
- Scratch files to remove before the final commit: `scripts/bench.mjs`, `scripts/debug.mjs`,
  `src/comps/lab.ts` (and its entry in `src/main.ts`), the timing `console.log`s in `src/main.ts`,
  the `msaa`/`rt` query switches are already gone from `src/engine/stage.ts`.

## Next step
`cd video && npm install && npm run prepare:media && npm run trailer` (≈ 25 min), then run the fresh-eyes
review on the two new trailer cuts; only after it says "proud": `npm run story`, `npm run qa`, review, report.
