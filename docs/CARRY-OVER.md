# Carry-over from the old build

Source: git ref `origin/laptop/landing-v2`, copied with `git show <ref>:<path> > <new path>` on 22 Nov 2026
(never merged, never checked out). Every file the new app took from the old build is listed here.

| Old path | New path | What changed |
|---|---|---|
| `src/features/reader/curl/engine.ts` | `src/reader/curl/engine.ts` | Nothing. |
| `src/features/reader/curl/geometry.ts` | `src/reader/curl/geometry.ts` | Nothing. |
| `src/features/reader/curl/shader.ts` | `src/reader/curl/shader.ts` | Nothing. |
| `src/features/reader/layout.ts` | `src/reader/layout.ts` | Removed `lockedFrom()` (the paywall's "first locked page"). Everything else unchanged. |
| `src/features/moonfilm/kit/core.ts` | `src/studio/kit/core.ts` | Header comment only (no longer "the Moon kit"). Palette `C` kept as it was, so the puppets draw as before; Stage 3 replaces it. |
| `src/features/moonfilm/kit/people.ts` | `src/studio/kit/people.ts` | Nothing. Still the three fixed puppets (Sari, Amir, Teacher Layla); `helmet` still defaults to `true` (pass `helmet: false`). |
| `src/features/moonfilm/kit/stage.ts` | `src/studio/kit/stage.ts` | Removed the import of the Moon story and of the rover. `cuePhrases(n, counts)` now takes the line itself: `cuePhrases(line, counts)`. Removed `roverShadow` and the rover branch of `jointsOf`. |
| `src/features/moonfilm/kit/notes.ts` | `src/studio/kit/notes.ts` | Nothing. |
| `src/features/moonfilm/kit/world.ts` | `src/studio/kit/world.ts` | Kept only the generic helpers: day/night line and its clip regions, dust bursts, footprints, star field. `drawBursts` takes an optional `gravity` (default: the old Moon value). Left behind: black sky, Earth, cratered ground, rocks, paper rocket, picnic props, flame. |
| `src/features/moonfilm/kit/wameed.ts` | (not carried) | The Moon story's rover character. |
| `src/features/library/engine.ts` | `src/library/engine.ts` | Imports `ShelfBook` from the new `src/library/types.ts` instead of the old catalogue. |
| `src/features/library/emblems.ts` | `src/library/emblems.ts` | Same import change. Removed the maple-leaf emblem (autumn look, rule 2); 17 emblems remain. |
| (old `src/content/library.ts`, types only) | `src/library/types.ts` | New file: just the `ShelfBook` fields the engine and covers need (`id`, `ready`, `palette`, `emblem`). The old catalogue of story ideas was not carried. |
| `src/lib/seeded.ts` | `src/lib/seeded.ts` | Nothing (needed by the kit and the shelf). |
| `src/lib/clamp.ts` | `src/lib/clamp.ts` | Nothing (needed by the shelf). |
| `src/i18n/locale.ts` (`dirSign`, `num`) | `src/i18n/helpers.ts` | `num()` unchanged. `dirSign` is now a function of the language, `dirSign(lang)`, because one page load can show any of four languages. The rest of the old file (two-language detection, reload-to-switch) was not carried. |
| `src/features/sari/Acting.tsx` | `src/hero3d/legacy/Acting.tsx` | Reference only: header note added; excluded from the type check and the build. Its model (`@/design/SariModel`, the AI-made `.glb`) was NOT carried. |
| `src/features/sari/runtime.ts` | `src/hero3d/legacy/runtime.ts` | Reference only (Acting.tsx reads it); header note added. |
| `src/audio/synth.ts` | `src/audio/synth.ts` | Nothing. |
| `src/content/story.ts` | `content/author/autumn-story.ts` | Removed the picture, thumbnail, film-clip and cover fields (type and values) and the old `Locale` import (now a local type). No other line changed: the diff is removals only, and the 37 Arabic paragraphs are byte-identical (SHA-256 `fac7c6b3…cd49b295`, guarded by `tests/author-text.test.ts`). |
| `video/scripts/render.mjs` | `studio/scripts/render.mjs` | Targets now come from the command line (`<comp>`, `--still`, `--music`, `--max-mb`) and go to `studio/out/`. Removed the storyteller mix (it read the old ElevenLabs narration) and the old `story.json` export. The capture and encode pipeline is unchanged. Cannot run until the Stage 3 studio page exists. |
| `video/scripts/music.mjs` | `studio/scripts/music.mjs` | Usage lines only. Verified: `node studio/scripts/music.mjs demo` writes an 11.5 s, 48 kHz stereo WAV at −5.5 dBFS peak. |
| `video/scripts/scores/chords.mjs` | `studio/scripts/scores/chords.mjs` | Nothing. `scores/demo.mjs` is new: a four-bar test score. The old trailer and story scores were not carried. |
| `video/scripts/timeline.mjs` | `studio/scripts/timeline.mjs` | Input and output paths are now `--index`, `--shots`, `--out` (they pointed at the old story's files); defaults when no previous timeline exists. |
| `video/scripts/qa.mjs` | `studio/scripts/qa.mjs` | Takes one video path (`--timeline`, `--max-mb` optional) instead of the old fixed list. Verified on a test video: container facts, loudness, frames. |
| `video/scripts/sheet.sh` | `studio/scripts/sheet.sh` | Example line only. |
| `scripts/qa/shot.mjs` | `scripts/qa/shot.mjs` | Removed the old smooth-scroll (Lenis) hook; plain `window.scrollTo`. |
| `scripts/qa/eyes.mjs` | `scripts/qa/eyes.mjs` | Nothing. |

**Not carried (on purpose):** every picture, model, film clip and audio file; the game; the reward tree; the Moon
story scenes (`scene4.ts`…`scene11.ts`, `plates.ts`, `film.ts`); `video/scripts/prepare.mjs` (it extracted frames from
the AI-made film clips); the old app shell, landing, stores, `copy.ts`, sign-in and checkout; the old fonts.
