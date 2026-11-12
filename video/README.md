# StoryTime film studio

Every video here is made from code. A page draws frame N; headless Chromium captures it; ffmpeg encodes it with music that is also synthesised in code. No AI image, video or music generators, no downloaded tracks, no screen recording.

The studio is separate from the website: its own `package.json`, nothing from here enters the site's bundle. It only **reads** the site's media (`../public/story`, `../public/models/sari.glb`, `../assets-src/film/master`, `../src/content/story.ts`) and only **writes** five files in `../public/film/`.

## Render

```bash
cd video
npm install            # once (three, vite, playwright-core, the two site fonts)
npm run prepare:media  # once: extracts the frames of the six master clips to .cache/ (needs ffmpeg)

npm run trailer        # → ../public/film/trailer-16x9.mp4, trailer-9x16.mp4, trailer-poster.jpg
npm run story          # → ../public/film/story.mp4, story.json
npm run qa             # facts, loudness, cut-vs-music table, one frame per second in out/qa/
```

One video at a time: `node scripts/render.mjs trailer-16x9` (or `trailer-9x16`, `trailer-poster`, `story`).

Drafts never overwrite the published files:

```bash
node scripts/render.mjs story --scale=0.5 --from=25 --to=33   # half-size excerpt → out/story-draft.mp4
node scripts/render.mjs trailer-9x16 --stills=2,12.5,22       # stills → out/trailer-9x16/stills/
scripts/sheet.sh story 4x2 480 out/sheet.jpg 26,27,28,29,30,31,32,33   # contact sheet
```

Chromium: the renderer uses `/opt/pw-browsers/chromium` when it exists, otherwise Playwright's own; set `CHROMIUM_PATH` to use another. WebGL runs in software (SwiftShader), about 0.5–2 s per frame; a trailer cut takes roughly 10 minutes, the story film roughly 20. One browser is the fastest setting (software GL already uses every core).

## What is where

```
scripts/render.mjs      Vite serves the page → seek(frame) → capture → ffmpeg (CRF, two-pass if over the size limit)
scripts/music.mjs       the synthesiser: plucked strings, celesta bells, harp, pad, bass, wind, echo, hall
scripts/scores/*.mjs    the two scores (bars of 3/4 in D major); bar lines = picture cuts
scripts/prepare.mjs     master clips → frames
scripts/qa.mjs          checks on the finished files
src/engine/             stage (WebGL canvas + DOM type layer), compositor (cuts, dissolves, grade, grain), maths
src/kit/                leaves, name papers, book, Sari, plates/footage, ground, light, type
src/shots/              one shot each: title, footage, gust, book, play, the story inserts, painting plates
src/comps/              trailer.ts (both cuts from one source), story.ts, and their timeline JSON
```

`src/comps/*.timeline.json` is the single source of timing: the page, the music and `story.json` all read it.

## Rules the code keeps

- **Deterministic.** Nothing reads a clock or `Math.random`; frame N is the same whenever it is rendered. Motion is closed-form in time (leaves, papers, page turns), so there is no simulation state.
- **Her words are hers.** Arabic story text is imported from `src/content/story.ts` (never retyped). Other words come from the site's copy (`src/i18n/copy.ts`). Names on the game papers are only names that appear in her story.
- **Arabic type** is real text shaped by the browser (DOM for titles and captions, canvas text for book pages and papers): right to left, joined, no letter-spacing, animated by word or by block, never by letter.
- **Footage is never re-timed.** The six clips play at their own 24 fps; code adds the camera move and real 3D leaves in front.
- **Paintings are never just zoomed.** A scene without footage shows its painting for one bar with a hand-drawn depth map (parallax), moving leaf-shade and 3D leaves, and a code-made 3D close-up for two bars.
- **No invented acting** for Amir or the teacher. Sari appears as the site's own rigged model (run, stand, raised hand).
- **Story film has no text on the picture**; the only letters are the names written on the game's papers, which are props.

## Files and limits

| File | Size | Limit |
| --- | --- | --- |
| `trailer-16x9.mp4` 1920×1080, 36 s | see `npm run qa` | 12 MB |
| `trailer-9x16.mp4` 1080×1920, 36 s | | 12 MB |
| `story.mp4` 1280×720, 80 s | | 14 MB |

All: H.264 High, `yuv420p`, BT.709, AAC 160 kb/s 48 kHz, `+faststart`, 24 fps. Music peaks at −4.5 dBFS before AAC (true peak after AAC under −3 dBFS).

`story.json`: `{ "duration": 80, "scenes": [{ "scene": 0, "start": 0, "end": 5 }, …] }` — `scene` is the 0-based index into `story.scenes`; boundaries are the middles of the 0.4 s dissolves between scenes.

## Licence notes

three.js (MIT), Vite (MIT), playwright-core (Apache-2.0), Rubik and Noto Naskh Arabic (SIL OFL, via Fontsource). Nothing else.
