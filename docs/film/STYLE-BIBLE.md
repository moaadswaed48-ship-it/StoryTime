# StoryTime film style bible (draft for the owner's approval, 25 Nov 2026)

**What this is:** the look of the owner's reference cartoon, taken apart into terms we can repeat in every
generated picture and shot, then adapted to children aged 2 to 8.

> **Before anything is generated: two of the owner's decisions are needed.**
> 1. `CLAUDE.md` hard rule 1 says every picture, film and figure is drawn and animated in code, with no AI image
>    or video tools. This plan uses AI image and video models through Higgsfield. The owner must change rule 1 in
>    writing first (for example "films and book pictures may be made with AI models from our own character
>    sheets"). Until then this is paperwork only.
> 2. Credits: no generation until the owner approves an amount (see `BUDGET.md`).
>
> The reference video belongs to another creator (an Instagram account; its handle is burned into every frame).
> We copy the **look**, never its characters, shots or frames. Its frames are never uploaded to a generator as a
> reference image. They are kept only in `docs/film/ref/` for our eyes.

Reference files: `docs/film/ref/reference-contact-sheet-2fps.jpg` (the whole 11 s, two frames a second),
`reference-key-frames.jpg` (four frames at full size), `reference-palette.png` (the sampled colours below).
Source: a 1080 × 608 video, 30 frames a second, 11.1 s long, with eight shots.

---

## 1. The reference, shot by shot (measured with ffmpeg scene detection)

| # | Time | Length | What we see | Camera |
|---|---|---|---|---|
| 1 | 0.0–2.9 s | 2.9 s | Platypus pops out of its burrow and stretches; the wolf's head rises over the bank top, centre frame. The platypus does not see it. | Wide, locked, lens at ground level, bank fills the frame |
| 2 | 2.9–3.4 s | 0.6 s | Over the platypus's head: sand, then water beyond. | Insert, high-ish point of view |
| 3 | 3.4–5.0 s | 1.6 s | Platypus scratches its head, glances sideways, waves a paw. | Medium close-up, lens at its eye level |
| 4 | 5.0–5.4 s | 0.4 s | Platypus foot huge in the foreground; the wolf small on the bank top against blue sky. | Extreme low angle, wide lens, deep perspective |
| 5 | 5.4–5.8 s | 0.4 s | Wolf's face over the bank edge, grinning. | Close-up, low angle against sky |
| 6 | 5.8–6.4 s | 0.6 s | Platypus's shock "take": eyes up, bill wide open. | Medium close-up, same set-up as 3 |
| 7 | 6.4–9.2 s | 2.8 s | The chase: platypus scoots left to right; the wolf leaps off the bank; the wolf's head intrudes huge into the frame's left edge. | Side-on tracking shot at ground level, motion blur |
| 8 | 9.2–11.1 s | 1.9 s | Platypus dives into the water with a big white splash; the wolf skids to a stop at the edge. | Wide side-on, locked |

Average shot: **1.4 s** (from 0.4 to 2.9 s). That is far faster than any of our age groups (section 9).
The sound track was not analysed for content (the clip has an audio stream; we did not transcribe it).

**What makes it look expensive** (in order of weight):
1. **Light.** One low, warm sun as the only key, a cool sky fill, and black shadows that are allowed to stay black.
2. **Lens.** Very shallow depth of field in every close shot; the background melts into warm blur.
3. **Camera height.** The lens sits at the character's eye level or lower, never above an adult's head.
4. **Materials.** Soft fur with fine strands and light going through the edges; smooth, slightly glossy beak/nose.
5. **Acting.** Big, clear facial poses held for a beat (the shock take), and one clear action per shot.
6. **Composition.** One subject, one idea, clean background, nothing small and busy.

**What is weak in it** (and we should not copy): a stray "gem" artefact on the platypus's head, odd finger
counts on its paws, the wolf's glowing eyes and bared teeth (frightening for our ages), and the burned-in social
handle and icon.

---

## 2. Rendering and materials

- **Render look:** stylised 3D animated feature film. Smooth subdivided shapes, no hard polygon edges, no visible
  texture tiling. Not clay, not plastic toys, not anime, not 2D.
- **Shapes:** rounded and simplified. Heads large, hands and feet soft and slightly chunky, noses and ears rounded.
  Exaggeration lives in proportion (head, eyes), not in distortion.
- **Fur and hair:** soft, dense, individually readable strands that clump gently; bright translucent edges where
  the sun comes from behind (the "peach-fuzz" rim). Human hair is grouped into smooth clumps (curls read as
  separate springs), never photo-real strands.
- **Skin:** soft subsurface glow (warm red light in ears and fingertips against the sun), even tone, no pores, no
  wrinkles except a few soft lines on elders.
- **Cloth:** knitted jumpers show a soft large knit; cotton is matte with soft folds; aprons are crisp. No logos,
  no letters, no patterns with symbols.
- **Eyes:** large, glossy, a clear iris colour, one bright catchlight from the key light and a soft second one.
  Pupils stay round and calm (no slit pupils, no glowing irises).
- **Ground and props:** fine grain (dust, pebbles, grass blades) in the foreground in focus, melting quickly into
  blur. Props are slightly oversized and simple (a pomegranate is a clean red sphere with a crown).

## 3. Light

| Element | Reference value | Rule for us |
|---|---|---|
| Key | Low sun, 10–20° above the horizon, from frame right or behind-right | One warm key, low, from the side or behind. Long soft shadows. |
| Key colour | Deep gold to orange | Warm gold (about 3,200–3,800 K look). |
| Fill | Cool sky blue bounce on the shadow side and rim | Always a cool fill, so warm and cool sit side by side. |
| Rim | Bright edge on fur and on the bank crest (`#e3f3fd`) | A rim on every character's head and shoulders. |
| Bounce | Orange light reflected up from the ground onto bellies and chins | Keep it: it makes the scene feel warm. |
| Shadows | Allowed to go almost black (burrow `#010301`) | Deep but soft; never pure black on a face. For the 2–3 group, lift shadows a little. |
| Air | Haze and floating dust in sunbeams; light bloom | A little haze and dust specks in sunlit air. |

**Per-story light key (the rule that keeps the site from having one season as its brand):** the look above stays
the same in every film (render, lens, camera height, acting). Only the light key changes with the story:

| Story | Light key |
|---|---|
| A04 | Spring morning: low warm sun from the side, pale clear sky, cool green shadows. |
| B02 | Rainy winter morning: cool blue-grey window light from one side, warm yellow lamp light inside as the key. Same contrast of warm and cool, turned indoors. |
| C01 | Late autumn afternoon: the reference light almost exactly (low golden sun, long shadows), going redder toward the end. |

## 4. Colour palette

Sampled from the reference frames (median of a small patch; screen colours, so a guide, not a paint chip):

| Role | Hex | Where sampled |
|---|---|---|
| Sky, high | `#a2d7ef` | wolf close-up, top left |
| Sky at the horizon | `#e3f4fe` | wolf close-up, right edge |
| Cool rim on edges | `#e3f3fd` | bank crest against the sky |
| Foliage, sunlit | `#a09d5d` | trees in the wide |
| Earth, sunlit floor | `#cd855a` | close-up, lower right |
| Earth, warm highlight | `#da8b54` | chase floor |
| Earth, mid tone | `#8d5337` | wide, bank in sun |
| Earth, shade | `#3e342c` | wide, bank in shade |
| Deepest shadow | `#010301` | inside the burrow |
| Fur, lit | `#cc6d36` | platypus head, sun side |
| Fur, mid | `#814522` | platypus shoulder |
| Fur, shadow | `#2c231d` | platypus body, shade side |
| Bill, slate teal | `#223f40` | platypus bill top |
| Bill, lit tip | `#fbdbc7` | platypus bill tip in sun |
| Grey fur, mid | `#777981` | wolf cheek |
| Grey fur, dark | `#212832` | wolf brow |
| Amber eye | `#fba679` | wolf iris (we will not use glowing eyes) |
| Water | `#646357` | splash shot |

**How it works:** a warm earth range (terracotta, ochre, burnt orange) fills most of the frame; one cool colour
(sky blue or teal) sits against it; saturation peaks only on the subject. Our characters' clothes (hex values in the
`CHARACTERS-*.md` files) are chosen to sit in or against this range so each child reads clearly from the ground.

## 5. Lenses, depth of field, camera height

| Shot | Lens look (35 mm equivalent) | Focus | Camera height |
|---|---|---|---|
| Establishing wide | 24–28 mm | deep-ish; far background soft | at the lowest character's knee or eye level, close to the ground |
| Medium / two-shot | 35–40 mm | subject sharp, background clearly soft | the child's eye level |
| Close-up | 50–85 mm | very shallow (about f/1.8 look); only the eyes are sharp | the subject's eye level |
| Macro insert (ladybird, shell, seeds) | 100 mm macro look | paper-thin; the faces behind are blur shapes | at the object |
| Hero low angle (used once per film at most) | 18–24 mm | foreground huge, background small | almost on the ground |

**Camera moves we use:** locked-off (most shots), slow push-in, slow sideways truck at walking pace, a slow rise
(crane up) for reveals, and one fast pan per film for the fastest action. **We do not use:** handheld shake, whip
pans, fast orbiting, zooms, dutch tilts.

## 6. Composition

- One subject, one idea per shot. The subject sits on a third; the eyes in the upper third.
- Leave the **lower fifth of the frame calm** (plain ground, rug or table front) in every shot so captions never
  cover art that matters (our story files already ask for this).
- Clean backgrounds: big simple shapes (a bank, a hill, a wall) rather than many small objects.
- Use **depth staging** for jokes and suspense: one thing sharp in front, the surprise soft behind (the wolf rising
  behind the platypus). Then cut, rather than rack focus, because AI focus pulls are unreliable.
- **Screen direction is fixed per film** (for example in A04 uphill is always toward frame right) and written into
  every prompt of that film.

## 7. Cut rhythm

The reference cuts every 1.4 s. We keep its **shape** (wide, close, reaction, wide) and slow it down per age:

| Age | Shot length | Cuts | Notes |
|---|---|---|---|
| 2–3 | 6–10 s on screen (holds up to 12 s done in assembly) | Cut only on a finished action. Never two cuts in 3 s. | One thing moves at a time. The fast run in A04 is the single fast moment. |
| 4–5 | 4–10 s | A quick 4–5 s "sound joke" insert is fine | Humour comes from movement and sound. |
| 6–8 | 3–10 s | Quick cuts (3–5 s) allowed in action and search scenes | The C01 search scene may use 4–6 s cuts, like a slowed-down reference. |

Every film opens and ends on a held, still image (our story files ask for it).

## 8. Acting and expression

- **Poses read in silhouette.** Arms away from the body, a clear lean, a clear head angle.
- **Held "takes".** A reaction is a pose held for at least 1 s at ages 4–8 and 2 s at 2–3 (the platypus holds its
  shock for 0.6 s; we hold longer).
- **Faces:** eyes and brows do most of the work; mouths stay small and soft (see section 10 on voices).
- **Expression range allowed:** joy, wonder, surprise, curiosity, mild worry, small sadness, sleepy contentment,
  giggling. **Not allowed:** fear, terror, anger, crying with tears, menace, sneering.
- Each character has a **signature gesture** from its `cast.json` manner (Grandpa plants the stick before the foot;
  Liam folds his arms; the seller's laugh shakes her shoulders). Repeat it so children recognise the character.

## 9. Comedy and suspense: how the reference does it, and our version

| Device | In the reference | In our films |
|---|---|---|
| The audience knows first | Wolf rises behind the platypus, which keeps stretching | C01: Liam holds the "lost" pomegranate in plain view while everyone searches. B02: the boy with the drum stops before anyone else notices. |
| The reaction take | Platypus freezes, eyes up, bill open | Liam's face falls (C01); Dalia's small sad look down (B02, soft); Sami's open mouth at the butterfly (A04, wonder not fear). |
| Scale contrast | Huge foot in foreground, small wolf far back | Grandpa's big hand and Sami's small hand; the doctor's tiny bag in two hands. |
| Speed contrast | Slow stretch, then a sudden dash | Sami's run against Grandpa's step-tap (A04); the baker's rush against the doctor's calm (C01). |
| Release | Splash: the chase ends with the wolf stopped | Every tension ends in laughter or a warm hold within the same scene. |

**Threat, adapted per age:**
- **2–3:** no threat at all. The only "suspense" is a small separation (Sami cannot see Grandpa), solved in the
  next shot. No dark spaces, no sudden loud sound, no fast camera except one joyful run.
- **4–5:** social worry only (nobody hears Dalia), resolved inside the same scene. Sad faces are soft, never crying.
- **6–8:** comic alarm (a pomegranate "goes missing") with a comic sound, never a scary one.
- **Never, any age:** predators chasing, teeth, glowing or red eyes, looming shadows, angry adults, falls, injury.

## 10. Voices, captions and the picture (rules from the owner's requests H, I and J)

- **No words in the picture, ever.** Captions are added by the player in the voice's language, outside the art.
- **One picture, four voices.** The voice is recorded later in Arabic, Hebrew, English and Danish. So nothing is
  lip-synced. When a character speaks: the mouth is hidden (cupped hands, a shell, seen from behind), small in a
  wide shot, or moves softly for about as long as a short phrase. Narrator lines sit over pictures where nobody
  talks.
- **Breathing room:** each spoken line has at least 1 s of quiet before it and 1.5 s after it inside the shot (2 s
  for ages 2–3). Arabic and Hebrew lines can run longer than English, so every voice window is sized for about 1.6
  times the English length (section 2 of `PIPELINE.md`), and holds can be stretched in assembly without new
  generation.

---

## 11. The style block (paste into every generation, unchanged)

**Use the same words every time.** Change only the light key line (one of the three below) per story.

```
STYLE: high-end stylized 3D animated feature film still, appealing rounded character design,
soft simplified shapes, large expressive eyes with clear catchlights, soft subsurface skin,
fine soft hair and fur with gentle clumping and glowing rim-lit edges, matte knitted and cotton cloth,
clean uncluttered composition with one clear subject, camera at the character's eye level or lower,
cinematic shallow depth of field with creamy background blur, natural lens,
warm key light with cool sky fill, warm bounce light from the ground, soft deep shadows,
light atmospheric haze and a few dust motes in the sunbeams, rich warm palette of terracotta, ochre,
burnt orange and sage green against clear pale blue, gentle, warm and safe family film for young children.
LIGHT KEY (A04): spring morning, low warm sun from the side, pale clear sky, soft cool green shadows.
LIGHT KEY (B02): rainy winter morning indoors, warm yellow lamplight as key, cool blue-grey window light from one side.
LIGHT KEY (C01): late autumn afternoon, low golden sun, long soft shadows, sky warming toward evening.
No text, no letters, no numbers, no logos, no watermark anywhere in the image.
```

**Shot add-on for video prompts** (after the style block and the character identity blocks):

```
MOTION: [one action, said plainly]. Camera: [locked-off | slow push-in | slow truck left-to-right | slow rise].
Only [the named thing] moves; everything else stays calm. Smooth, gentle, natural motion, no sudden moves.
Faces stay exactly as in the reference images. No talking unless stated.
```

Do not name film studios, films or living artists in prompts: describe the look instead (the block above does).

## 12. The avoid list (negative prompt; where the model has no negative field, keep the last line of the style block)

```
text, letters, words, numbers, captions, subtitles, signs with writing, logos, brand names, watermark,
signature, username, social media icon, border, frame, split screen, collage, panels,
extra fingers, missing fingers, fused fingers, extra hands, extra arms, extra legs, extra limbs,
two heads, duplicated character, merged characters, deformed hands, hands melting together,
warped face, asymmetrical eyes, crossed eyes, face changing between frames, clothes changing colour,
hairstyle changing, flicker, morphing, jitter,
photorealistic human, realistic skin pores, uncanny, creepy, horror, scary face, menacing grin,
bared teeth, snarling, glowing eyes, red eyes, angry adult, crying with tears, blood, injury, weapon,
darkness, looming shadow, predator,
religious symbol, national flag, political symbol, jewellery with symbols,
adult makeup on children, revealing clothes, fisheye distortion, harsh flash, heavy motion blur on faces,
plastic toy look, clay look, anime, 2D flat illustration, low detail, blurry subject
```

## 13. What AI video still does badly, and how we stage around it

| Weak spot | What goes wrong | Our staging |
|---|---|---|
| Hands and fingers | Extra or fused fingers; hands melt when they touch | Start each hand shot from a **checked still** where the hands are already right; ask for "hands stay still"; let something else move (a ladybird, the camera). Keep hands small in wide shots. |
| Holding hands / passing objects | Two hands merge; objects jump between hands | Cut on the action: shot A ends as the hand reaches, shot B starts on hands already joined. Never show a hand-over in one generated move (B02's shell passing uses close-ups that start with the shell already in each hand). |
| Same face across shots | Faces drift (eye size, nose, age) | Same sheet images attached to every shot; the identity block pasted word for word; fixed seed where offered; a face check on every take (`PIPELINE.md` step 8). Fewer, longer shots of each face. |
| Text | Garbled letters on signs, books, boxes | Nothing with writing in any set; "no text" in every prompt; an automatic text check on sampled frames. |
| Long continuous action | After 5–8 s, limbs and props drift | Shots of 4–10 s with one action each; long holds are done in assembly by freezing or slowing the last good frame. |
| Counting | Numbers of objects change (ten pomegranates become eleven) | In C01, count-critical moments are built from a checked still with the fruit moved by us in assembly, not by the model. |
| Many characters at once | Children merge or swap clothes | Wide group shots are a checked still with tiny motion only (rain, a sway); the acting happens in singles and two-shots. |
| Wheels and thin structures | Wheelchair wheels wobble; walking sticks bend; glasses vanish | The wheelchair stays parked in generated shots; wheels move only small and off-centre. The stick is in a fixed hand (written in every prompt). Glasses are named in every prompt. |
| Insects and small animals | Wrong number of legs; spots change | Keep them small, slow, simple shapes; show them on a plain leaf or hand; avoid close leg detail. |
| Camera | The model adds moves you did not ask for | Write the camera move every time, including "locked-off camera". |
| Mouths | Characters "talk" when they should not | "Mouth closed, no talking" unless the shot is a speaking shot; speaking shots keep the mouth small or hidden. |
