# Brief: a 30-second animated film, "Where Is Little Hedgehog?"

Read this whole file before you start. Nobody can answer questions while you work. Where something is not decided
here, decide it yourself and note the decision in your README.

**This brief is complete and it overrides the project's general instruction files** (`CLAUDE.md` and the plan and
handoff files it points to) wherever they differ. For this job: do not read or update the master plan or the handoff,
do not look for a reviewer, do not commit, push or change branches, do not write a report for the owner.

Words used below:
- **WS**, your workspace: the folder you were given. It contains `repo/`, `out/`, `gate/` and `logs/`.
- **REPO**, your copy of the project: `WS/repo`. Every project path in this brief (`docs/...`, `src/...`,
  `studio/...`, `content/...`) means that path inside REPO.

## 1. What you are making, and who judges it

A complete 30-second 3D animated film for children aged 2 to 3, made entirely in code: pictures drawn by Blender 5.2.5
from your own Python, sound made by your own Node code. The project's owner will judge it on a phone. He is a physician,
not a programmer; he judges only what he sees and hears.

**His reference** is a short film-studio-quality clip of a furry platypus and a wolf (not ours; we aim at its level of
quality and never copy its characters or shots). Only still frames of it exist here:
- `docs/previews/reference/owner-reference-sheet.jpg`, `docs/previews/reference/owner-reference-frame.jpg`
- `docs/film/ref/reference-contact-sheet-2fps.jpg`, `docs/film/ref/reference-key-frames.jpg`, `docs/film/ref/reference-palette.png`
- A written analysis of why that clip looks expensive (it also describes its movement): `docs/film/STYLE-BIBLE.md`,
  sections 1 to 9 only. Ignore that file's header box, its sections 10 to 13, and anything in sections 1 to 9 about
  voices, captions, prompts or generators (they belong to a cancelled plan).

**Yesterday's test** by an earlier team: an 11-second shot with two human characters.
- Film `docs/previews/studio3d/a04-hill-test.mp4` (to look at it, pull frames out with `ffmpeg`, which is installed and
  not charged), comparison `docs/previews/studio3d/comparison-sheet.jpg`, write-up with its flaw list
  `docs/previews/studio3d/README.md`, code `src/studio3d/blender/`.

**The owner's verdict on it, in his own words:**
> "the camera view and the effects, like the depth effect and the environment. I like it, it's good. Maybe it could have
> some improvement, but the characters, they are creepy as hell and they look very trash."

He then asked for a new film that tries as many film-making features as possible, with animals this time:
> "for now try to practice on animals to see from now if you nailed it or not"

So the camera, depth-of-field and environment quality are the floor, and **the characters are the test**: whether your
animals are charming or creepy is the first thing he will judge.

## 2. The story and the cast

Source: `content/stories/a13/story.json`, `en.json` and `cast.json`. It is a hide-and-seek game in a small garden behind
a house, on a summer evening that turns into night. This film is a 30-second cut of it. **Where the story files and
this brief differ, the brief wins**: this film starts at dusk, has no bench, no beetle, no captions, no spoken lines
and no counting aloud, and ends as section 3 says.

Facts you must not contradict:
- **Little Hedgehog** and **Mama Hedgehog**: southern white-breasted hedgehogs. Pale face and white chest, brown spines,
  tiny dark paws. Mama is bigger (about one and a half times Little), rounder, with darker spines. Little is bouncy
  and giggly, scurries in quick little runs, curls into a tight ball to hide. Mama is slow and patient; her long nose
  twitches and leads the way.
- `cast.json` was written on a form made for human characters. Read it like this: `skin` is the face colour, `top.color`
  the chest, `hair.color` the spines, `shoes.color` the paws, `eyes.color` the eyes. Its `height` values only give the
  size of one hedgehog against the other; the real size and every other number on the form are yours to choose. Ignore
  its closing sentence about a "sheet type".
- **The owl**: small and round, two big round eyes, sits on the low stone wall. "Friendly, not spooky."
- **The snail**: on a stone, turns its eye-stalks.
- **The garden**: the house with a warm-lit window, a low stone wall, a bush, a green watering can, an old boot lying
  on its side in the grass. A hot day has just ended.

Everything else about how they look, are built and move is yours to design.

## 3. The seven shots

The film is 720 frames at 24 frames a second, 1280 x 720. Frame numbers are those of the whole film: frame 1 is the
first picture, and frame N starts at (N - 1) / 24 seconds of the sound. The machine-readable table is
`docs/film/bakeoff/shots.json`.

| Shot | Frames | What happens | Camera |
|---|---|---|---|
| S1 Evening | 1-108 | Dusk, the last golden light. From the dusk sky and the house's warm-lit window, down past the low stone wall where the owl sleeps, to Mama and Little under the bush. | Crane down. Wide lens (about 28 mm), deep focus. |
| S2 Counting | 109-204 | Close on Mama: she covers her eyes with her front paws, her nose twitches, and by **frame 168** one eye is clearly peeking between her paws. Behind her, out of focus, Little bounces and slips away out of the picture. | Long lens (about 85 mm, shallow focus), nearly still. |
| S3 Scurry | 205-324 | Little runs through the grass from screen left to screen right, stops with a little overshoot, sniffs the air twice, holds still. | Ground-level camera travelling beside him (about 40 mm), grass passing in front of the lens. Use motion blur in this shot. |
| S4 Not here | 325-420 | Very close: a snail on a stone beside the watering can turns its eye-stalks. The focus is on the snail until **frame 372**, then pulls, and from **frame 396** it is on the background, where Little's back is slipping into the old boot. | Still camera, macro look (about 100 mm). |
| S5 Night comes | 421-528 | One continuous shot in which evening becomes night: the sun's light fades, the sky deepens, stars come out one by one, the window becomes the warm light of the scene, the first fireflies appear. On the wall the owl wakes, turns its head and blinks once: its eyes are closed at **frame 492**. | Hedgehog height, looking up; slow tilt up (about 35 mm). |
| S6 Found you | 529-624 | Night. Over Mama's shoulder towards the old boot: the boot wobbles with a giggle, a small nose and two eyes peep out, Mama's nose reaches in, and at **frame 600** the two noses are touching. | Slow push-in (about 50 mm, shallow focus). |
| S7 Goodnight | 625-720 | Night. Both hedgehogs curled up beside the boot; the owl half asleep on the wall; stars; the warm window. From **frame 684** the camera and the characters are still: a held last picture (a star's twinkle or a firefly may go on). | High angle, rising up and back until it settles. |

**Fixed:** the order, the frame ranges, what happens, the frames in bold, and the kind of camera move in each shot.
S1 to S4 are dusk, S6 and S7 are night, S5 is the change. Lens numbers are guides: stay within about a third of them.
**Free:** all design, staging, colour, light, timing inside a shot, camera positions, apertures, motion blur outside
S3, and the sound.

Three things are done for you after you finish, by a shared step that is the same for every team: a fade in from
black over frames 1-12, a **dissolve from S6 to S7 over frames 619-630**, and a fade to black over frames 709-720. Do not
add your own fades or dissolve at those places. For the dissolve, both shots must exist over frames 619-630:
- S6 must draw frames 529 to 630: after frame 624 the shot simply carries on for six more frames (keep it alive).
- S7 must draw frames 619 to 720: its six frames before 625 are the start of the shot.
- `shots.json` and `ctx` give these as `render_first` and `render_last`. The harness asks your `build_shot` for those
  frames; animating them is your job. Key every shot over `ctx.render_first .. ctx.render_last`.

S5: if you cannot make the continuous change of light look right, you may build the change another way inside the
shot and say so in your README.

**Sound** (exactly 30 seconds, no voice, no words): music and effects made in code. Expected: an evening garden
(crickets), rustles and tiny footsteps in S3, sniffs, a small giggle-like sound in S6 (synthesised, not a human voice),
one soft owl hoot, a calm ending.

## 4. Rules

1. **Code only.** Everything is built by your code when it runs. No downloads of any kind. No external models, image
   files, sky pictures, fonts or sound samples. No AI-generated assets. Nothing from Blender's bundled asset libraries,
   and no add-ons beyond what Blender has switched on by default (Cycles is fine). Allowed: all of Blender's own
   Python API including its built-in procedural textures and Sky Texture, the Python standard library and numpy inside
   Blender; Node's standard library and the project's own files for sound.
2. **No network use at all.** No web tools.
3. **No words.** No text, letters, numbers or logos in the picture. No voice in the sound.
4. **Safe for ages 2 to 3.** Feelings allowed: joy, wonder, surprise, curiosity, mild worry, sleepy contentment,
   giggling. Never: teeth, eyes that give off light or are red, slit pupils, looming shadows, anything hunting,
   falling or hurt, a dark enclosed space filling the picture. (Eyes that catch the light with a normal highlight are
   good. The hide-and-seek is a game, not a chase. In S6 the boot stays an object in the garden: its dark opening must
   not fill the picture.) The owl is small, round, sleepy and friendly in every shot it appears in, and stays under
   15% of the picture's height in S5.
5. **Work alone.** Do not start helpers or sub-agents.
6. **Stay in your workspace.** Other teams are making the same film from this same brief. Do not look for their work,
   or for anything outside WS. Use absolute paths inside WS for every command and file: your shell may start in
   another folder each time.
7. **Change only `src/studio3d/bakeoff/entry/`** in REPO. Test pictures and scratch files go in `WS/out/`. Do not edit
   the shared tools or `common/`. (`__pycache__` folders that Python makes by itself anywhere are ignored.)
8. **Every Blender call goes through the wrapper** (section 5). Never run Blender directly, and do not use
   `studio/scripts/studio3d-render.sh` or the direct Blender commands shown in yesterday's write-up.
9. **Same code, same pictures.** Give every random choice a fixed seed. A picture must not depend on which pictures
   were drawn before it: the finished film is drawn shot by shot and may be stopped and restarted part-way.

## 5. Machine, tools and budgets

The machine: 4 processor cores, 15 GB of memory, **no graphics card**. Only the Cycles renderer works. Read
`docs/film/bakeoff/TECH-NOTES.md` before you design: it holds measured costs of pictures in a synthetic test scene on
this machine, the Blender 5.2 names that differ from older tutorials, and what does not work here. Blender scripts
written from memory of older versions will fail; the notes and the example save you test time.

The shared tools are in `REPO/studio/scripts/bakeoff/`:

- **`blender.sh LABEL [--max-seconds N] -- <blender arguments>`** runs Blender (background, factory settings, REPO as
  its working folder) and charges its running time to your **test budget: 9,000 seconds (2 h 30 min) in total**.
  - Every call is charged in full, including calls that fail, crash or are stopped. When the budget runs out, a
    running call is stopped and no further call starts, so plan it.
  - One call is stopped after 1,200 s unless you pass a different `--max-seconds` (it may be larger).
  - Only one Blender call runs on the machine at a time. A call may wait for the machine before it starts; it says
    so, and waiting is not charged.
  - Your own command tool may give up on a command after 2 to 10 minutes. For a call that may take longer, run it in
    the background and wait for it to finish. Never start the same pictures twice while a call is running.
  - Full output goes to a log file in `WS/logs/`; the wrapper prints its path. Example:

        bash REPO/studio/scripts/bakeoff/blender.sh look-S2 -- --python REPO/src/studio3d/bakeoff/entry/film.py -- \
            --out WS/out/look --frames 168 --shots S2 --quality preview --res 640x360

- **`status.sh`**: budget used and left, the last speed check and where its sheet is.
- **`sheet.sh OUT.jpg [--cols N] [--width W] IMAGE...`** tiles pictures into one labelled sheet (4 columns of 480 px
  unless you say otherwise). Look at sheets rather than at many single pictures: every picture you open uses up your
  working memory.
- **`gate.sh`**: the speed check. It draws 21 pictures with `--quality final` at 1280 x 720: frames 1, 54, 108 (S1);
  109, 156, 204 (S2); 205, 264, 324 (S3); 325, 372, 420 (S4); 421, 474, 528 (S5); 529, 576, 624 (S6); 625, 672, 720 (S7).
  - From them it predicts the drawing time of the whole film. Per shot: your build time, plus the extra time of the
    first picture, plus the average time of the middle and last pictures multiplied by the number of pictures the shot
    must draw (S6 and S7: 102 each). **It passes at a predicted total of 19,440 seconds (5 h 24 min) or less**, which
    is about 26 seconds a picture including builds.
  - It has its own budget, separate from the test budget: 2,700 s and at most 3 attempts. An attempt that fails or is
    cut off still counts. One attempt of a real film takes roughly 10 to 15 minutes.
  - It writes `WS/gate/bench.json` and a sheet of the 21 pictures, `WS/gate/sheet-N.jpg`. **The sheet of your last
    attempt is the first thing the owner sees**, so make your last attempt a complete one, run after your last change.
  - If you finish without a pass, your Cycles sample count is multiplied by a fixed factor when the film is drawn
    (19,440 divided by your predicted seconds, never below 0.4). That costs picture quality, so leave margin.

How the film is drawn after you finish: the organisers run your `film.py` with `--quality final` at 1280 x 720 for all
732 pictures (720 plus the 12 extra of the dissolve), one shot per Blender process. The limit is 6 hours of this
machine's time. A film that is still drawing at 7 h 30 min has the samples of its remaining pictures halved, and at
12 hours it is stopped unfinished. Then pictures and sound are joined. Nothing else is changed: no colour grade, no
glow, no fixes. What your `film.py` draws is what the owner sees. Your sound is only multiplied by one fixed gain to
reach a standard loudness (-16 LUFS), less if needed to keep its peaks under -1.5 dB; nothing is compressed or limited.

**The film contract** (`src/studio3d/bakeoff/common/harness.py` does the mechanics; read its top comment):
- `src/studio3d/bakeoff/entry/film.py` defines `build_shot(ctx)` and calls `harness.main(build_shot)`. For each shot the
  harness gives you an empty Blender file and a `ctx` (shot id, first and last frame, the frames it must draw, the bold
  sync frames, quality, size). You build everything that shot needs, key the animation with whole-film frame numbers,
  set the camera and your render settings. The harness then sets picture size, PNG output and the processor device,
  and draws the requested pictures.
- It must accept `--quality final` and `--quality preview` (what "preview" means is your choice: use it to test cheaply).
- A working example to copy from: `src/studio3d/bakeoff/common/example_film.py` (a grey box; mechanics only, not a
  design to follow).
- `src/studio3d/bakeoff/entry/sound.mjs`: `node sound.mjs --out FILE` writes a 16-bit stereo WAV at 48 kHz with exactly
  1,440,000 sample frames. Example: `src/studio3d/bakeoff/common/example_sound.mjs`. Running Node or ffmpeg is not
  charged to any budget.

**Existing code you may reuse, change or ignore** (copy what you want into your entry folder, or import it; the human
characters in it are what the owner rejected):
- `src/studio3d/blender/lib.py`: `lathe` (line 99), `ellipsoid` (135), `tube_path` (169), `sdf_mesh` with shape keys
  (268), `hair_curves` (294), `principled` (327), `hair_material` (358).
- `src/studio3d/blender/hill.py`: `blade_mesh` (139), `instancer` (282), `build_sky_and_sun` (410, one sky for the
  light and another for what the lens sees: part of the environment the owner liked). Its `add_haze` (31) and
  300,000 single grass blades were costly; see the cost table.
- `src/studio3d/blender/shot_a04_hill.py`: easing helpers, `keys`, `blink`, `spring_track` (lines 41-104), `leg_ik`
  (110), the camera with a tracked target (489-500), the focus pull (537-545), `render_settings` (549). Copy what you
  need from this file rather than importing it: importing it reads the command line and loads the old characters.
- `src/studio3d/blender/characters.py`: `eye_material` (149), `build_eye` (212; its eyelid seam was a known flaw).
- Sound: `src/audio/sfx.ts` (16 effects; none of them is a cricket, owl, sniff or chime), `src/audio/mix.ts`
  (`mixCues`, `loudness`, `wav`), `studio/scripts/music.mjs` (a score player to read and adapt; as it stands it loads
  scores from its own folder and writes outside your entry folder).
- `harness.add_paths()` makes `import lib` and `import hill` work from your `film.py`.

## 6. What you deliver

Files on disk in `REPO/src/studio3d/bakeoff/entry/` (no commit is needed):
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
- the speed-check result (pass or fail, predicted seconds; `status.sh` shows it) and the path of its sheet;
- test budget used;
- the three weakest points of your film, honestly;
- your five scores from section 7.
