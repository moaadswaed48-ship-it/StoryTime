# Code-built 3D test shot: A04 "Where is Grandpa?"

**What this is:** one 11-second shot from our youngest pilot story (A04), built and animated entirely in code, rendered
on this cloud machine, to answer one question: *can a code-only route make films in the look of the owner's reference
cartoon?*

- Film: `a04-hill-test.mp4` (1280 x 720, 24 fps, 11 s, H.264, no sound)
- Side by side with the reference: `comparison-sheet.jpg`
- Code: `src/studio3d/blender/` (characters, hillside, shot); scripts `studio/scripts/studio3d-render.sh` and
  `studio3d-encode.sh`

## The verdict, plainly

**Closer than the paper-cut style in light and lens, still clearly below the reference in characters, cloth and
acting.** As a strict art director I would score it about **4 out of 10 against the reference** (the reference itself
is a 9). It looks like a careful indie or TV-budget 3D test, not a feature-film frame.

| Area | How close | What still separates it from the reference |
|---|---|---|
| Light | Closest part. One low warm sun, cool sky fill, soft long shadows, warm bounce, haze in the distance. | The reference has deeper blacks, richer bounce colour and visible sunbeams in dusty air. Ours is a little flat in the shadows. |
| Lens | Good. Low camera, real depth of field, a rack focus from a ladybird to Sami, slow push-in. | Fine. The reference's bokeh is creamier; ours is close. |
| Faces | Sami reads as a likeable toddler: big glossy eyes with two catchlights, blinks, brows, an open smile with teeth, rosy cheeks. | No squash and stretch of the face, few mouth shapes, eyes do not narrow or bulge with emotion. The reference's "shock take" is far beyond this rig. |
| Shape appeal | Sami's head and hair (real curl strands, his forehead curl) are the best part. | Bodies are smooth rounded parts joined at the joints: no muscles, no squash, toy-like limbs. Grandpa still reads as a stiff, thin figure from a distance. |
| Materials | Skin with soft glow, knit jumper, fuzzy beard, glossy ladybird, translucent petals and grass. | No cloth folds or wrinkles (no cloth simulation), no fur. The reference's soft fur with light shining through its edges is the biggest visible gap. |
| Motion | Clear beats: run in, stop with follow-through, look round, turn, Grandpa waves, Sami beams and waves back. | Motion is computed from curves, not hand-keyed. It is readable but stiff; the reference has snappy timing, overshoot and squash and stretch in every move. |

**What the code route does well:** everything is ours, repeatable, editable as text, with no AI tools and no bought or
downloaded art. Changing a colour, a shot or a character's age is a code change, and every frame comes out the same each time.

**What it cannot reach without much more work:** feature-level character sculpting, cloth, fur and hand-keyed acting.
Those are months of specialist work in any tool, code or not.

## Timing on this machine (4 CPU cores, no graphics card)

Blender 5.2.5 Cycles path tracing on the CPU, 16 samples per pixel plus OpenImageDenoise, motion blur on.
(Tested: 24 and 64 samples look the same after denoising; 64 takes twice as long.)

| | Measured or computed |
|---|---|
| One frame at 1280 x 720 | **TIMING_FRAME** (measured over all 264 frames; first frame slower while the scene loads) |
| This 11-second shot (264 frames) | **TIMING_SHOT** |
| One 2.5-minute film (3,600 frames) | **TIMING_FILM** of non-stop rendering |
| About 3 hours of films (259,200 frames) | **TIMING_3H** of non-stop rendering: not practical on this machine |

What would change the maths (estimates, not measured; any paid option needs the owner's yes first):
- **A graphics card** renders this kind of scene in Cycles roughly 20 to 50 times faster than these 4 CPU cores, which
  would bring 3 hours of films down to days instead of months.
- **Simpler frames:** fewer grass blades and no motion blur cut about a third (grass is about half of each frame's cost,
  measured).
- **Blender's real-time renderer (EEVEE)** needs a graphics card; it would render in seconds per frame with softer,
  less accurate light.

## How it was made

- **No downloaded models, textures or art; no AI tools.** Blender is used only as the rendering engine: it is the
  official Linux build 5.2.5 from blender.org, its download checked against the published SHA-256
  (`6a93f131...a204`), kept in the session's scratch folder, not in the project.
- **Heads** are sculpted as mathematical shapes (cranium, cheeks, chin, button nose, eye sockets), turned into a dense
  mesh. The mouth states (closed smile, small "o", big open smile) are the same mesh, so they blend smoothly; the mouth
  darkens with its depth, with teeth and tongue painted by position.
- **Eyes:** glossy eyeballs that follow a look target, iris and pupil painted by angle, upper and lower lids that blink
  and squint, a lash line, and a soft catchlight card beside the lens.
- **Hair:** about 6,500 real hair strands in springy ringlets for Sami (with his forehead curl); short white strands
  over a soft shell for Grandpa's hair and beard.
- **Bodies:** rounded parts on a joint tree; legs placed by a small two-joint solver so feet plant on the slope.
- **The hillside:** a shaped terrain; about 300,000 grass blades and about 2,500 red anemones (six cupped petals, pale
  base ring, dark centre with stamens) scattered by Geometry Nodes; a ladybird on a leaf; layered distant hills with
  haze; a physical sky for the light and an art-directed sky gradient for what the lens sees.
- **Shot:** 40 mm lens at f/2, camera about 35 cm above the grass, slow push-in; focus pulls from the ladybird to Sami as
  he stops. Grade: AgX "Punchy" in the render, then a light bloom and vignette in the encode.

**Checks run:** three-plus rounds of stills and contact sheets (flat light fixed to golden hour; a straight-ramp hill
made rounder; Sami's eyes no longer roll to the whites; the wave moved to the near arm so it does not hide his face;
the ladybird brought into frame and into focus; a flower-joining bug that left a stray stem in the sky fixed;
Grandpa's glasses no longer read as sunglasses; his body proportions improved); a full low-resolution motion preview
of all 264 frames; the final frames looked at on a contact sheet (`qa/out/studio3d/contact-sheet.jpg`).

## If the owner likes this direction: the next step

1. **Decide the render machine first.** On this machine a 2.5-minute film takes days. Approve a graphics-card machine
   (cloud or local) before planning the film library. That is a money decision for the owner.
2. **One character-quality sprint on Sami** (still all code): smooth skinned body instead of joined parts, sculpted
   clothing folds, a richer face rig (squash and stretch, more mouth shapes, eye-shape changes), then a 75 mm close-up
   test judged next to the reference's close-ups.
3. **Hand-tuned acting curves** for one 30-second scene of A04, with sound, before building more shots.

## Rebuild it

```
# Blender 5.2.5 (official build; check its sha256 against blender-5.2.5.sha256 on download.blender.org)
BLENDER=/path/to/blender bash studio/scripts/studio3d-render.sh 1-264 16 1280x720   # resumable, one PNG per frame
"$BLENDER" -b --factory-startup --python src/studio3d/blender/shot_a04_hill.py -- \
  --out qa/out/studio3d/closeup --frames 200 --closeup --samples 24                 # the close-up for the sheet
REF_VIDEO=/path/to/owner-reference.mov bash studio/scripts/studio3d-encode.sh       # MP4, contact sheet, comparison
```
