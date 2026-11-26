# Brief: a 30-second animated film, "Where Is Little Hedgehog?"

Read this whole file before you start. Nobody can answer questions while you work. Where something is not decided
here, decide it yourself and note the decision in your README. This brief is complete: you do not need the project's
general plan or handoff files for this job.

Words used below: **your workspace** is the folder you were given (it contains `repo/`, `out/`, `gate/`, `logs/`).
**Your copy of the project** is `repo/` inside it. Every project path in this brief (`docs/...`, `src/...`,
`studio/...`, `content/...`) means that path inside your copy of the project.

## 1. What you are making, and who judges it

A complete 30-second 3D animated film for children aged 2 to 3, made entirely in code: pictures drawn by Blender 5.2.5
from your own Python, sound made by your own Node code. The project's owner will judge it on a phone. He is a physician,
not a programmer; he judges only what he sees and hears.

**His reference** is a short film-studio-quality clip of a furry platypus and a wolf (not ours; we copy the level of
quality, never its characters or shots):
- `docs/previews/reference/owner-reference-sheet.jpg`, `docs/previews/reference/owner-reference-frame.jpg`
- `docs/film/ref/reference-contact-sheet-2fps.jpg`, `docs/film/ref/reference-key-frames.jpg`, `docs/film/ref/reference-palette.png`
- A written analysis of why that clip looks expensive: `docs/film/STYLE-BIBLE.md`, sections 1 to 9 only. Ignore that
  file's header box and its sections 10 to 13 (they belong to a cancelled plan that used AI generators).

**Yesterday's test** by an earlier team: an 11-second shot with two human characters.
- Film `docs/previews/studio3d/a04-hill-test.mp4`, comparison `docs/previews/studio3d/comparison-sheet.jpg`,
  write-up with its flaw list `docs/previews/studio3d/README.md`, code `src/studio3d/blender/`.

**The owner's verdict on it, in his own words:**
> "the camera view and the effects, like the depth effect and the environment. I like it, it's good. Maybe it could have
> some improvement, but the characters, they are creepy as hell and they look very trash."

He then asked for a new film that tries as many film-making features as possible, with animals this time:
> "for now try to practice on animals to see from now if you nailed it or not"

So the camera, depth-of-field and environment quality are the floor, and **the characters are the test**: whether your
animals are charming or creepy is the first thing he will judge.

## 2. The story and the cast

Source: `content/stories/a13/story.json`, `en.json` and `cast.json`. Read them. It is a hide-and-seek game in a small
garden behind a house, on a summer evening that turns into night. This film is a 30-second cut of it.

Facts you must not contradict:
- **Little Hedgehog** and **Mama Hedgehog**: southern white-breasted hedgehogs. Pale face and white chest, brown spines,
  tiny dark paws. Mama is bigger, rounder, with darker spines. Colours, sizes and manner are in `cast.json`
  (Little: bouncy and giggly, scurries in quick little runs, curls into a tight ball to hide. Mama: slow and patient,
  her long nose twitches and leads the way).
- **The owl**: small and round, two big round eyes, sits on the low stone wall. "Friendly, not spooky."
- **The snail**: on a stone, turns its eye-stalks.
- **The garden**: the house with a warm-lit window, a low stone wall, a bush, a green watering can, an old boot lying
  on its side in the grass. A hot day has just ended.

Everything else about how they look, are built and move is yours to design.

## 3. The seven shots

The film is 720 frames at 24 frames a second, 1280 x 720. Frame numbers are those of the whole film. The machine-readable
table is `docs/film/bakeoff/shots.json`.

| Shot | Frames | What happens | Camera |
|---|---|---|---|
| S1 Evening | 1-108 | Dusk, the last golden light. From the dusk sky and the house's warm-lit window, down past the low stone wall where the owl sleeps, to Mama and Little under the bush. | Crane down. Wide lens (about 28 mm), deep focus. |
| S2 Counting | 109-204 | Close on Mama: she covers her eyes with her front paws, her nose twitches, and at **frame 168** one eye peeks between her paws. Behind her, out of focus, Little bounces and slips away out of the picture. | Long lens (about 85 mm, about f/2), nearly still. |
| S3 Scurry | 205-324 | Little runs through the grass from screen left to screen right, stops with a little overshoot, sniffs the air twice, holds still. | Ground-level camera travelling beside him (about 40 mm), grass passing in front of the lens. Motion blur belongs in this shot. |
| S4 Not here | 325-420 | Very close: a snail on a stone beside the watering can turns its eye-stalks. From **frame 372 to 396** the focus pulls from the snail to the background, where Little's back is slipping into the old boot. | Still camera, macro look (about 100 mm). |
| S5 Night comes | 421-528 | One continuous shot in which evening becomes night: the sun's light fades, the sky deepens, stars come out one by one, the window becomes the warm light of the scene, the first fireflies appear. On the wall the owl wakes, turns its head, and at **frame 492** blinks. | Hedgehog height, looking up; slow tilt up (about 35 mm). |
| S6 Found you | 529-624 | Night. Over Mama's shoulder towards the old boot: the boot wobbles with a giggle, a small nose and bright eyes peep out, Mama's nose reaches in, and at **frame 600** the two noses touch. | Slow push-in (about 50 mm, about f/2). |
| S7 Goodnight | 625-720 | Night. Both hedgehogs curled up beside the boot; the owl half asleep on the wall; stars; the warm window. From **frame 684** nothing moves. | High angle, rising up and back. |

**Fixed:** the order, the frame ranges, what happens, the frames in bold, the kind of camera move and lens in each shot.
S1 to S4 are dusk, S6 and S7 are night, S5 is the change. **Free:** all design, staging, colour, light, timing inside
a shot, exact lens and camera positions, and the sound.

Three things are done for you after you finish, by a shared step, the same for every team: a fade in from black over
frames 1-12, a **dissolve from S6 to S7 over frames 619-630**, and a fade to black over frames 709-720. For the dissolve,
S6 must draw until frame 630 and S7 must start drawing at frame 619 (`shots.json` gives these as `render_first` and
`render_last`; the harness handles it). Do not add your own fades or dissolve at those places.

S5 fallback: if you cannot make the continuous change of light look right, you may build it another way inside the
shot (for example your own cross-fade between an evening and a night version) and say so in your README.

**Sound** (exactly 30 seconds, no voice, no words): music and effects made in code. Expected: an evening garden
(crickets), rustles and tiny footsteps in S3, sniffs, a small giggle-like sound in S6 (synthesised, not a human voice),
one soft owl hoot, a calm ending. Sound should follow the picture's frames (frame N is at N/24 seconds).

## 4. Rules

1. **Code only.** Everything is built by your code when it runs. No downloads of any kind. No external models,
   textures, sky pictures, fonts or sound samples. No AI-generated assets. Nothing from Blender's bundled asset
   libraries or add-ons. Allowed: Blender's own Python API, the Python standard library and numpy inside Blender;
   Node's standard library and the project's own files for sound.
2. **No network use at all.** No web tools.
3. **No words.** No text, letters, numbers or logos in the picture. No voice in the sound.
4. **Safe for ages 2 to 3.** Feelings allowed: joy, wonder, surprise, curiosity, mild worry, sleepy contentment,
   giggling. Never: teeth, glowing or red eyes, slit pupils, looming shadows, anything chasing, falling or hurt,
   a dark enclosed space filling the picture. The owl stays small (under 15% of the picture's height in S5), round,
   sleepy and friendly.
5. **Work alone.** Do not start helpers or sub-agents.
6. **Stay in your workspace.** Other teams are making the same film from this same brief. Do not look for their work,
   or for anything outside your workspace. Use absolute paths inside your workspace for every command and file
   (your shell may start in another folder each time).
7. **Change only `src/studio3d/bakeoff/entry/`** in your copy of the project. Test pictures and scratch files go in
   your workspace's `out/` folder. Do not edit the shared tools or `common/`.
8. **Every Blender call goes through the wrapper** (section 5). Never run Blender directly.
9. **Same code, same pictures.** Give every random choice a fixed seed. A picture must not depend on which pictures
   were drawn before it (the finished film is drawn shot by shot, and may be stopped and restarted).

## 5. Machine, tools and budgets

The machine: 4 processor cores, 15 GB of memory, **no graphics card**. Only the Cycles renderer works. Read
`docs/film/bakeoff/TECH-NOTES.md` before you design: it holds measured costs of pictures on this machine, the Blender
5.2 names that differ from older tutorials, and what does not work here. Blender scripts written from memory of older
versions will fail; the notes and the example save you test time.

The shared tools are in `studio/scripts/bakeoff/` in your copy of the project:

- **`blender.sh LABEL [--max-seconds N] -- <blender arguments>`**: runs Blender (background, factory settings) and
  charges its running time to your **test budget: 9,000 seconds (2 h 30 min) in total**. When it is spent, the wrapper
  refuses and you can draw no more test pictures, so plan it. One call is stopped after 1,200 s unless you pass
  `--max-seconds`. Full output goes to a log file in your workspace's `logs/`; the wrapper prints the path. Example:

      bash <your copy>/studio/scripts/bakeoff/blender.sh look-S2 -- --python <your copy>/src/studio3d/bakeoff/entry/film.py -- \
          --out <your workspace>/out/look --frames 168 --shots S2 --quality preview --res 640x360

- **`status.sh`**: budget used and left.
- **`sheet.sh OUT.jpg [--cols N] [--width W] IMAGE...`**: tiles pictures into one labelled sheet. Look at sheets
  rather than at many single pictures: every picture you open uses up your working memory.
- **`gate.sh`**: the speed check. It draws 21 pictures (the first, middle and last frame of each shot) with
  `--quality final` at 1280 x 720 and predicts how long the whole film will take to draw. **It passes at a prediction of
  19,440 seconds (5 h 24 min) or less.** It has its own budget (2,700 s, at most 3 attempts), separate from the test
  budget. If you finish without a pass, your sample count is lowered by a fixed rule (19,440 divided by your predicted
  seconds, never below 0.4), which costs picture quality, so leave yourself margin. It also writes a sheet of the 21
  pictures: **that sheet from your last attempt is the first thing the owner sees.**

How the film is drawn after you finish: the organisers run your `film.py` with `--quality final` at 1280 x 720 for all
732 pictures (720 plus the 12 of the dissolve), one shot per Blender process, at most 6 hours on this machine, then
join pictures and sound. Nothing else is changed: no colour grade, no glow, no fixes. What your `film.py` draws is what
the owner sees. Your sound is only scaled by one fixed gain to a standard loudness (-16 LUFS).

**The film contract** (`src/studio3d/bakeoff/common/harness.py` does the mechanics; read its top comment):
- `src/studio3d/bakeoff/entry/film.py` defines `build_shot(ctx)` and calls `harness.main(build_shot)`. For each shot the
  harness gives you an empty Blender file and a `ctx` (shot id, first and last frame, the bold sync frames, quality,
  size). You build everything that shot needs, key the animation with whole-film frame numbers, set the camera and your
  render settings. The harness then sets picture size and PNG output and draws the requested pictures.
- It must accept `--quality final` and `--quality preview` (what "preview" means is your choice: use it to test cheaply).
- A working example to copy from: `src/studio3d/bakeoff/common/example_film.py` (a grey box; mechanics only, not a
  design to follow).
- `src/studio3d/bakeoff/entry/sound.mjs`: `node sound.mjs --out FILE` writes a 16-bit stereo WAV at 48 kHz with exactly
  1,440,000 sample frames. Example: `src/studio3d/bakeoff/common/example_sound.mjs`. Running Node is not charged to any
  budget.

**Existing code you may reuse, change or ignore** (copy what you want into your entry folder or import it; the human
characters in it are what the owner rejected):
- `src/studio3d/blender/lib.py`: `lathe` (line 99), `ellipsoid` (135), `tube_path` (169), `sdf_mesh` with shape keys
  (268), `hair_curves` (294), `principled` (327), `hair_material` (358).
- `src/studio3d/blender/hill.py`: `blade_mesh` (139), `instancer` (282), `build_sky_and_sun` (410, one sky for the
  light and another for what the lens sees: part of the environment the owner liked). Its `add_haze` (31) and
  300,000 single grass blades were costly; see the cost table.
- `src/studio3d/blender/shot_a04_hill.py`: easing helpers, `keys`, `blink`, `spring_track` (lines 41-104), `leg_ik`
  (110), the camera with a tracked target (489-500), the focus pull (537-545), `render_settings` (549).
- `src/studio3d/blender/characters.py`: `eye_material` (149), `build_eye` (212; its eyelid seam was a known flaw).
- Sound: `src/audio/sfx.ts` (16 effects; none of them is a cricket, owl, sniff or chime), `src/audio/mix.ts`
  (`mixCues`, `loudness`, `wav`), `studio/scripts/music.mjs` (a score player you can read and adapt).
- `harness.add_paths()` makes `import lib`, `import hill` work from your `film.py`.

## 6. What you deliver

In `src/studio3d/bakeoff/entry/` of your copy of the project:
- `film.py` and `sound.mjs` (the contract above), plus any helper files you need. Only `.py`, `.mjs`, `.json` and
  `.md` files are allowed in this folder. Leave `MARKER.md` in place.
- `README.md` (replace the placeholder): what you built and how, your design decisions, the known flaws, and an honest
  score from 1 to 10 against the reference under each of the five headings in section 7.
- `PROGRESS.md`: keep it current while you work (what is done, what is next, budget used, decisions made), so the work
  can be picked up from the folder if you are interrupted.

A complete film at modest quality beats a beautiful fragment: all seven shots must draw, the speed check should pass,
and the sound must run.

## 7. How the owner will judge

1. **Characters:** charming and alive, not creepy, not toy-like. Would a two-year-old love them?
2. **Materials and light:** fur, spines, feathers, the evening and night light, the lens and depth look he liked.
3. **Acting and movement:** clear, soft, readable feelings; weight and follow-through; nothing stiff.
4. **Film craft:** each shot reads at once on a phone; camera moves, focus, cuts and staging serve the story.
5. **Sound:** fits the picture, gentle, complete.

## 8. Your final report

When you are done (or cannot go further), reply with a short plain-text report:
- finished or not, and what is missing;
- the speed-check result (pass or fail, predicted seconds) and the path of its picture sheet;
- test budget used;
- the three weakest points of your film, honestly;
- your five scores from section 7.
