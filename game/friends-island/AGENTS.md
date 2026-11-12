> This folder is now **Friends Island**, a remix of Wigglewild for the StoryTime site (see the note at the top of
> README.md). Checks that still exist: `npm run typecheck`, `npm run build`, and the three Node tests. The browser
> scripts, the `?patch-test=1` self-checks, the Editor, the Lab and the Meadow were removed with the fighting.
> Never run `pch publish` here. The rest of this file describes the original.

# Working on Wigglewild

A three.js browser game on [Patch](https://patch.gg), in TypeScript, bundled by Vite. Start with `npm ci`. What the person asks for comes first: nothing here says what to make.

## Run

- `npm run dev`: Vite on port 5173, with the game host's isolation headers.
- `npm run build`: makes `dist/`, which is the whole release. `npm run preview` serves it with the game host's headers on port 8080.
- URL flags (`src/config.ts`): `?mode=play` (the default) or `?mode=meadow`, `?seed=`, `?creature=<seed or code>`, `?count=`, `?autostart=1`, `?nowelcome=1`, `?skiptutorial=1`, `?time=0..1`, `?lab=1`, `?debug=1`, `?quality=`.

## Check

The browser scripts use `PATCH_CHROME` if it's set, otherwise Playwright's Chromium (`npx playwright install chromium`). They always run muted, and `scripts/no-pointer-lock.mjs` fakes the mouse lock, so a test never takes the real mouse. Keep both in any new script by importing `scripts/lib.mjs`.

| Command | What it checks |
| --- | --- |
| `pch check` (after a build) | Patch's own look at the game, as its host serves it |
| `pch validate` | `patch.json`, its recipe and its files |
| `npm run typecheck` | Types |
| `npm run check` | `dist/` against Patch's submit-time file checks |
| `npm run smoke`, `npm run smoke:meadow` | Each mode's `?patch-test=1` self-checks (Play: boot, render, hatch, walk, planted-feet, drawn, trample, eat, encounter, combat, dex, audio) |
| `npm run bot`, `npm run play-bot` | Long playtests with real keyboard and mouse |
| `npm run player-course`, `npm run gamepad-test` | The player's body on a course, and a virtual pad |
| `npm run anim` | Many seeds on the lab course. Foot slide, penetration and belly-in-ground must stay 0 after any change to how creatures move |
| `npm run mesh-test`, `npm run design-test`, `npm run mutation-test` | Node tests of the mesher, editor builds and mutation |
| `npm run verify` | Most of the above in a row |

Screenshots and clips go in `shots/`, which git ignores.

## Change

- This game only runs on the WebGL path (`src/render/webgl.ts`): its materials patch three's GLSL chunks.
- Everything in `public/` ships as it is. `public/CREDITS.md` and `public/LICENSE` are copies of the files at the top, so change both.
- New sounds go in `public/audio/` as `.ogg` and `.m4a`, listed in `manifest.json` with their credit, and in `CREDITS.md`. Anything added has to be open enough to ship in a repo anyone can fork: CC0 or CC-BY, credited.
- `three.quarks` and Rapier are installed but not used by this game, so they aren't in the build.
- To publish: put the next version in `patch.json`, commit, then `pch publish`, which says what comes next. A fork's `patch.json` has to name the fork.

## Where things live

| Path | What |
| --- | --- |
| `src/creature/` | `genome.ts` genes, codes, mutation, breeding; `build.ts` body-plan rules; `design.ts` editor designs; `sdf.ts` and `mesher.ts` the mesh (run in `mesh.worker.ts`); `creature.ts` walking, IK, pose, chains, eyes, mouths; `herd.ts` brains and metrics; `evolve.ts`, `stats.ts` |
| `src/play/` | The island: `play.ts` player, stamina, combat, pack, tutorial; `ai.ts` one brain per temperament; `encounter.ts` social encounters on a beat; `abilities.ts` parts to abilities; `species.ts` the starter, species and giant; `island.ts` day and night, nests, food; `camera.ts`, `input.ts`, `hud.ts` |
| `src/world/` | Island, grass, water, sky, scenery, the contact map |
| `src/look/` | `materials.ts` the stylised shading; `creature-skin.ts` patterns drawn per pixel |
| `src/editor/`, `src/lab/` | The Editor and the Lab |
| `src/audio/mixer.ts` | Sound and mix. `public/audio/manifest.json` has each sound's loudness and credit |
| `src/harness/` | The `?patch-test=1` self-checks |
| `src/game.ts`, `src/config.ts` | The game loop and URL flags |
| `scripts/`, `tests/` | Test scripts and Node tests |
