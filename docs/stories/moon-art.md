# «نزهة على القمر» — director's shot list

For the code-made cartoon (SVG / canvas / three.js, rendered to stills and video). Story text: `src/content/stories/moon.ts`
(StoryTime's own draft, not the author's). One entry per scene, plus the cover. Scene numbers match `moon.scenes`.

Everything in this first part is decided **once** and holds for every shot.

## 1. Format

- Scenes: 16:9. Design at 1920×1080; export the book still at 1344×752 and a 640px thumbnail (same sizes as `public/story/k01.webp`).
- Cover: portrait, 880×1168 (design at 2×).
- Output names (already reserved in `moon.ts`; none of these files exists yet): `public/stories/moon/k01.webp … k12.webp`, `k01-sm.webp … k12-sm.webp`, `cover.webp`, `cover-sm.webp`. No clip paths are set in `moon.ts` yet.
- **No letters, digits or writing of any kind inside a picture** — not on the rocket, the basket, the classroom walls or Wameed. Children's painted decoration is shapes only (stripes, dots, stars, handprints). The countdown is shown with raised fingers. The face Sari draws in the dust is a circle, two dots and a curve.
- Every scene has one **key pose**: the frame that is exported as the book page and shown when motion is reduced. It must read as a finished picture on its own.
- **Captions.** The book lays the text over the bottom of the picture (its shade pools from the bottom-right corner in Arabic) and the film sets the cue line bottom-centre. So in every shot the **bottom quarter** carries no faces, hands or key props and stays one quiet tone. Each entry says what fills it.

## 2. Look

Bold flat shapes with a paper-cut feel, strong silhouettes, very few colours. The flat sheet `assets-src/story/sheet.png` is the drawing reference (big round head, dot eyes, round blush cheeks, simple hands); `assets-src/film/sheet3d.png` and `assets-src/film/k01…k12.png` are the colour and warmth reference. The Moon's emptiness is the design: large calm areas of dust and black sky, small bright people.

**Palette**

| Use | Colour |
| --- | --- |
| Space / lunar sky | `#0b0f24` |
| Night ground, every shadow on the Moon (shelf navy) | `#1d2447` |
| Dust: near / middle / far | `#d9d4c7` / `#b3aea4` / `#918e8b` |
| Cream: helmet rims, Wameed's body, rocket paper, highlights | `#f3ecdf` |
| Gold: sun rim-light, Wameed's eye, lamp beam, paper flame | `#e9d58a` |
| Earth: sea / cloud / land / night half | `#3b78c2` / `#f3ecdf` / `#6fae7a` / `#141a3a` |
| Sari: hoodie / jeans / sneakers / backpack / hair | `#e0a526` / `#2f6f7e` / `#c8442f` / `#9a4a33` / `#5a3320` |
| Amir: jumper / collar / trousers / hair | `#6f7f3c` / `#c8612e` / `#7a4a26` / `#1c1c22` |
| Layla: cardigan / blouse / skirt / hair | `#b5522d` / `#f3ecdf` / `#27305c` / `#4a2b1e` |
| Skin / cheeks | `#f6cfa8` / `#f0977a` |
| Picnic blanket (cream with terracotta checks), orange | `#f3ecdf` + `#b5522d`, `#f08a24` |

On the Moon the three characters' clothes, the blanket and the orange are the **only** warm colours in frame. Earth scenes (1, 2, 12) use the warm honey light of the author's story: classroom `#f2d9a6`, afternoon sky `#8fc4e8`, dusk from `#f4b183` through `#6c5a9c` to `#1d2447`.

## 3. Cast and costume

Faces, hair and clothes exactly as on the sheet, in every shot:

- **Sari** — curly brown hair, mustard hoodie with two white drawstrings, teal jeans with rolled cuffs, red sneakers, small red-brown backpack. His stick stays in the classroom (leaning by the window in scene 1); he does not carry it on this trip.
- **Amir** — straight black fringe, olive-green knitted jumper with a rust collar, brown trousers with rolled cuffs, brown shoes.
- **Teacher Layla** — long wavy dark-brown hair in a low side ponytail, terracotta cardigan over a cream blouse, long navy skirt, cream socks, brown strap shoes. She carries a wicker picnic basket with one handle in every scene; in scenes 7 and 8 it hangs on her arm and she also holds a small hand lamp.
- **Moon kit (scenes 4–9 and 11, and the cover):** their own clothes, unchanged, plus a **clear round bubble helmet** — a circle about one and a half heads wide, thin cream outline, one white highlight arc on the sunward side, a cream collar ring on the shoulders with a small gold dot (the earpiece). Hair sits still inside it. Inside the rocket they are off and stack like bowls: in scene 3 they are just being handed out (only Sari has his on), in scene 10 all three are off.
- **Wameed (وميض), the new friend** — a rover the size of a shoebox: rounded cream box body, six small dark wheels (three a side), one round eye-lamp on a short neck (dark when asleep, gold when awake), and one wing on his back. Folded, the wing is a flat grey-dusted slab; open, it is a half-circle fan of seven navy petals with thin gold veins, always turned toward the Sun. He has no mouth and makes no sound: he speaks in blinks of his eye and little wheel wiggles.
- **Paper rocket** — about three children tall: cardboard tube body with visible tape strips, cream paper cone nose, three stubby fins, one round porthole, a hatch with a short paper ladder; painted by children in stripes, dots and handprints. Its flame is layered paper triangles in gold, orange and cream, never realistic fire. Inside: corrugated cardboard walls, the same porthole.
- **Classmates** (scenes 2 and 12) — six to eight simple child figures seen mostly from behind; no one is named.
- **Footprints** — three treads, used consistently: Sari's oval with three bars, Amir's plain oval with a heel line, Layla's narrow oval with a heel dot. Wameed leaves two thin parallel tracks.

## 4. The Moon: fixed geometry (keep it true)

The story happens at a **half Moon** (first quarter: visible in the afternoon sky, high at sunset). They land on the daylight side close to the line where day meets night.

- **Sun:** always low and off-frame to screen **right**. Lit sides face right; every shadow falls to the **left** and is about five times as long as the thing that casts it.
- **Night:** always to the **left**. The walk to the line goes right-to-left (forward in an Arabic book); the way back to the rocket goes left-to-right.
- **Rocket:** parked right of centre.
- **Sky:** black in full daylight. **No stars in sunlit shots** (the bright ground hides them, and the empty black is stronger). Stars appear only through the porthole in scene 3 and inside the night in scene 7, and they never twinkle (no air).
- **Earth:** hangs in one place and never rises or sets — high in the upper-left of the sky in every wide Moon shot, about a tenth of the frame's height across. It is **half lit, lit half on the right** (toward the Sun), the dark half only just lighter than the sky. It turns slowly; its position never changes. Only the camera makes it larger (scene 9).
- **The half Moon seen from Earth** (scenes 1 and 12): **right half lit**, straight edge near vertical. Pale white on blue in scene 1, bright cream at dusk in scene 12.

## 5. How things move

- **Low gravity.** Every jump is a clean arc with long hang-time: a child's hop stays up about 2 seconds, a big leap about 3. Quick squash at take-off, one wide open pose in the air, a soft landing. Thrown things rise high and come back slowly.
- **Dust.** Each grain flies its own little arc and drops. A fan of 8–14 dots per step or landing. Never a cloud, never a haze, nothing lingers in the air.
- **No wind.** Nothing flutters, sways or drifts. Cloth moves only when touched, then stops dead. Deliberate stillness is part of the comedy (scene 5).
- **Shadows.** Hard-edged, one flat colour, no soft falloff. No atmospheric fade: far hills are as crisp as near ones; depth comes from overlap and size. The horizon is close and gently curved.
- **Crossing the line.** Whatever part of a figure is past the line switches at once to night colours (flat navy with a thin gold rim on the sunward edge) — a hard mask, no gradient.
- **Footprints stay.** One persistent layer: every print made from scene 4 onward is still there in scenes 5–11.
- **Wind exists only on Earth** (scenes 2 and 12): hair, skirt and paper scraps move there, so coming home is felt.
- **Camera:** one simple move per shot, 6–10 seconds, eased at both ends; at most three parallax layers (foreground dust, figures, horizon and sky).

---

## Cover (portrait)

- **Staging:** the lower two-fifths is one big curved arc of pale dust. On it, centre, the checked blanket lies flat with the basket on its right corner. Layla kneels at the right of the blanket, smiling up. Amir stands at the left holding the orange above his head, looking at it. Sari floats high above the blanket in mid-leap, arms and legs spread like a star, laughing. Far left on the horizon, small: Wameed with his wing open. Far right on the horizon, small: the paper rocket. The half Earth sits left of centre, a little above the middle of the page. Moon kit on all three.
- **Camera:** wide, level, straight on; the still is the cover. For a living cover: a very slow drift upward.
- **Light and palette:** Sun from the right, gold rims on helmets, long navy shadows to the left; black sky.
- **Moves:** Sari rising and sinking slowly, the orange turning in Amir's hand, Earth turning, Wameed blinking.
- **Captions:** the top third is empty black sky for the title; the bottom tenth is plain dust.

## 1. قمر في النهار — the question (classroom)

- **Staging:** a large classroom window fills the left half; through it, blue afternoon sky with the pale half Moon high in the pane, and, low in the yard outside, the top of the paper rocket. Sari stands on tiptoe at the window, right arm pointing up at the Moon, head turned back to the room, mouth open mid-question. Amir stands centre-right, one finger on his chin, eyes rolled up, thinking. Layla sits on a small chair at the right, chin on her hand, delighted. Sari's stick leans by the window. Everyday clothes, no helmets.
- **Camera:** medium-wide at a child's eye level; slow push-in toward the window until the Moon is centred.
- **Light and palette:** honey light through the window, warm patches on a wooden floor. The Moon is the one cool thing in the room.
- **Moves:** Sari bounces on his toes and jabs his finger at the sky; Amir's eyes travel up, then his head tilts with an idea; dust motes in the sunbeam; one small cloud slides past the Moon.
- **Captions:** bottom quarter is plain wooden floor.

## 2. صاروخ من ورق — lift-off (yard)

- **Staging:** the kindergarten yard, low angle. The rocket stands centre, tall. In its porthole: Sari's and Amir's faces pressed side by side, Layla's hand and the basket just visible behind them. In the foreground, left and right, classmates seen from behind in a loose half-circle, arms up, fingers raised for the count. Key pose: the rocket one child-height off the ground, paper flame beneath it, every head tipped back.
- **Camera:** low and wide from behind the children; tilt up with the rocket as it leaves.
- **Light and palette:** warm afternoon, long soft shadows; the paper flame in gold, orange and cream.
- **Moves:** fingers go three, two, one; the rocket shivers; it lifts slowly, then faster; scraps of coloured paper skitter outward along the ground instead of smoke; hair and clothes are pushed back; the rocket's shadow slides off the yard.
- **Captions:** bottom quarter is yard paving in shade; the children stand at the far left and right edges, clear of the middle.

## 3. كرة زرقاء — the blue ball (inside the rocket)

- **Staging:** cardboard interior. A big round porthole left of centre: black space, steady stars, and the Earth as a blue ball. Amir kneels at the glass, nose to it, holding his helmet in both hands and frowning at it. Sari, beside him, already wears his helmet and makes a fish mouth, cheeks puffed, hands flapping like fins. Layla kneels at the right by the open basket, lifting the third helmet out; the orange has drifted up out of the basket.
- **Camera:** medium, level; slow push-in to the porthole with a slight roll, as if afloat.
- **Light and palette:** cool blue earthlight from the porthole on their faces, one small warm lamp behind; cardboard browns kept dull so the blue ball wins.
- **Moves:** in the porthole the yard becomes a town, a coast, then the whole Earth shrinking to a ball; the orange turns slowly in mid-air; Layla's ponytail and Sari's drawstrings float upward; Sari's fish mouth opens and closes.
- **Captions:** bottom quarter is the cardboard floor.

## 4. قفزة عالية — the first jump (the Moon)

- **Staging:** very wide. Flat pale dust, close curved horizon at two-thirds height, black sky, the half Earth upper left. The rocket stands right of centre, hatch open, ladder down; Layla in the hatch with the basket, laughing; Amir on the last rung, about to hop. Key pose: Sari at the top of his jump in the centre of the frame, more than two of his own heights above the ground, limbs spread, mouth wide. His shadow lies far below and to the left, clearly separate from him. Moon kit on all three. Nothing else in the picture.
- **Camera:** wide and low, almost still; a small tilt up with Sari and back down.
- **Light and palette:** hard low Sun from the right, gold rim on the helmet, navy shadows; the mustard hoodie is the brightest thing on the Moon.
- **Moves:** Sari's jump (about 3 seconds in the air), a fan of dust at take-off and landing, the very first footprints. Then Amir's "small" hop that carries him right over Sari's head, arms wheeling, and his slow, surprised descent.
- **Captions:** bottom quarter is empty foreground dust.

## 5. طَق! — the picnic that cannot be eaten

- **Staging:** medium-wide. The checked blanket lies in the centre, perfectly flat, corners sharp. Basket on its right corner. Layla kneels at the right, one hand still on the blanket's edge, laughing. Amir stands at the left, arms a little out, looking around at the black sky in wonder. Sari sits cross-legged in the middle. Key pose: his sandwich squashed flat against the outside of his helmet at mouth height, eyes crossed, three short cream tick-marks around the bump. Moon kit on all three. Earth upper left, footprints leading back to the rocket at the right edge.
- **Camera:** medium; slow push-in to Sari, arriving at his helmet exactly on the bump.
- **Light and palette:** as scene 4; the blanket's terracotta checks are the warm centre of the frame.
- **Moves:** the blanket unrolls in one go and then does not move at all — hold a full second of stillness. The orange goes up and up, hangs, comes down slowly into Sari's hands. The sandwich bumps the glass: the helmet rocks once, a few crumbs fly out in little arcs and drop. Shoulders shake with laughter.
- **Captions:** bottom quarter is foreground dust in front of the blanket.

## 6. خطوة.. ليل! — the line between day and night

- **Staging:** extreme wide, the strongest graphic frame of the story. The ground is cut in two by one long line running from the foreground to the horizon: bright dust on the right two-thirds, navy night on the left third. Sari and Amir stand at the line, small (a quarter of the frame's height). Sari has one leg stretched across it; that leg is in night colours with a gold rim. Amir hops beside him, arms out for balance, grinning. Their two long shadows run left and vanish into the night. Layla follows a little behind on the right, basket in hand. The rocket is tiny on the right horizon, with a trail of prints leading from it. Earth upper left, over the dark side. Moon kit on all three.
- **Camera:** wide, side-on; tracks right-to-left with the boys' bounds and stops when the line reaches its place.
- **Light and palette:** only three tones on the ground and sky — pale dust, navy night, black sky — plus the children.
- **Moves:** three long bounds, shadows racing ahead of them. At the line: foot in, foot out, in time with the chant, the crossing part flipping instantly between day and night colours. Then both boys hopping to and fro across it.
- **Captions:** bottom quarter is plain ground, bright on the right and dark on the left; the film cue reads best over the dark side.

## 7. ومضة في الظلام — a blink in the dark

- **Staging:** inside the night. Almost everything is navy and black; the daylight is one thin bright strip along the far right edge. Stars above, perfectly steady. Layla stands right of centre holding a small lamp, the basket on her other arm; its gold beam falls to the left across the ground. In the beam, between three rounded rocks, sits Wameed: asleep, eye dark, wing folded, grey with dust. Sari crouches by him, one hand reaching out; his other hand is held by Amir, who stands half a step behind, leaning in to look, brave and wary at once. Faces are lit by the lamp's spill and a cool blue rim from the Earth, upper left. Moon kit on all three.
- **Camera:** medium-wide and low; slow push-in along the beam toward Wameed.
- **Light and palette:** navy, black, one gold beam, a touch of earth-blue. The clothes are dimmed almost to silhouettes.
- **Moves:** it opens on black with a single faint gold blink far off. The lamp comes on and its beam sweeps across the rocks until it finds him. When Sari touches the wing, a little dust slides off and falls straight down.
- **Captions:** bottom quarter is dark ground — the calmest caption space in the film.

## 8. هوب! — into the sunshine

- **Staging:** at the line again, seen closer, this time moving left-to-right into the light. Key pose: Wameed set down on the bright dust in the centre, wing fully open in its seven-petal fan toward the Sun on the right, eye glowing gold. Amir on his right in full light, both arms thrown up. Sari on his left with his legs still in night colours and his top half in daylight, pointing at the wing. Layla behind them in the dark at the left edge, lamp lowered, smiling. Moon kit on all three.
- **Camera:** medium; slow push-in with a slight rise, ending on the open wing.
- **Light and palette:** the line crosses the frame; gold is used more here than anywhere else (eye, wing veins, rim light).
- **Moves:** the count, then the lift — he is so light he floats up out of their hands and they catch him, each with one hand. As they step over the line the daylight wipes across him. The wing opens petal by petal like a paper fan; dust shakes off in small arcs; the eye blinks once, twice, three times; his wheels wiggle.
- **Captions:** bottom quarter is ground, dark at the left and bright at the right.

## 9. نصف أرض — half an Earth

- **Staging:** seen from behind and below, all four looking up (a quiet echo of the last picture in the author's story). Left to right: Wameed with his eye tilted to the sky, Amir with his hand shading the front of his helmet, Sari in a slow jump with one arm pointing straight up, Layla with a hand on Amir's shoulder, basket on her arm. Around them in the dust, the circle of Wameed's wheel tracks. Above, larger than in any other shot because the camera is low and tilted: the Earth, right half bright with sea and cloud, left half dark with a few tiny gold points (towns where children are asleep). Moon kit on all three.
- **Camera:** low, behind the group; one tilt up from the tracks and footprints to the Earth, ending on the key pose.
- **Light and palette:** Sun from the right on their backs and helmets; the Earth's blue is the only saturated cool colour in the story — let it glow.
- **Moves:** the Earth turns slowly, cloud bands sliding toward its dark edge; a gold point or two appears as land passes into night; Sari's slow jump when he understands; Wameed's eye pulses gently.
- **Captions:** bottom quarter is dust and the lower part of the wheel-track circle; figures stand above it.

## 10. نزهة للجميع — the picnic at the window (inside the rocket)

- **Staging:** cardboard interior, the round porthole in the centre. Inside, on the blanket spread over the floor: Sari on the left, cheeks full, pointing at the window with half a sandwich; Amir in the middle, peeling the orange; Layla on the right, pouring juice from a flask into a paper cup. Helmets off, stacked beside the basket. Outside the glass, close: Wameed, wing open toward the Sun, eye bright, looking in. Behind him the pale plain with all the footprints, and the half Earth high in the porthole's upper left.
- **Camera:** medium, from inside, low over the blanket; slow push-in toward the porthole.
- **Light and palette:** the one warm-lit Moon scene — honey lamp light indoors, hard cold light outdoors. Cosy against empty.
- **Moves:** Wameed's eye lights three times; the juice pours in a slow, thick arc; crumbs fall slowly; Sari chews and gestures; Earth turns.
- **Captions:** bottom quarter is blanket and cardboard floor; food and hands stay above it.

## 11. آثار أقدامنا — footprints

- **Staging:** high angle, looking down at the dust as if at a drawing. The whole trip is written on the ground in prints: from the rocket to the square mark where the blanket lay, out to the line and back, and Wameed's circle. Centre: Sari crouching, finger in the dust, finishing the smiling face. Amir stands beside him pointing down at the prints. Wameed sits just left of the drawing, eye lit, looking at it. Layla is at the foot of the ladder on the right, basket on her arm, looking back at them. Long shadows to the left. Moon kit on all three.
- **Camera:** high angle; one long pull-back and rise as the rocket leaves through the top right of frame, ending on the empty ground: prints, drawn face, one small rover.
- **Light and palette:** pale dust, navy shadows, the three warm figures; after they go, no warm colour is left but Wameed's gold eye.
- **Moves:** the face draws on stroke by stroke; fingers count down; the paper flame pushes a neat ring of dust outward that lands and stops; Wameed blinks steadily as the rocket shrinks to a dot. Hold two seconds on the still, empty Moon.
- **Captions:** bottom quarter is dust with only faint prints.

## 12. صباح الخير يا وميض — home (yard at dusk)

- **Staging:** the kindergarten yard at sunset. The rocket has landed at the left, nose a little crumpled, grey dust on its fins. Classmates run in from the right, seen from behind and in profile. Centre, backs three-quarters to us: Sari waving one arm high at the sky, Amir beside him pointing up, Layla behind with the basket and a hand on Sari's shoulder. High in the upper right of the sky: the half Moon, right half bright cream. On its straight edge, one tiny gold point. The Sun is setting off-frame to the right, on the Moon's bright side. Everyday clothes, no helmets.
- **Camera:** wide and low behind the children; slow tilt and push up to the Moon, ending with it large in frame.
- **Light and palette:** the author's sunset warmth — peach low down, violet above, navy at the top, warm rims on hair and shoulders. The first rich, soft light since scene 2.
- **Moves:** air again — Layla's hair and skirt stir, a few leaves and paper scraps skitter across the paving. The Sun sinks and the Moon brightens. Three soft gold blinks on the Moon's straight edge. A pinch of grey dust falls from Sari's sneaker, quickly this time. Sari's wave turns from a goodnight into a good-morning.
- **Captions:** bottom quarter is yard paving in evening shade.

---

## The scenes that deserve the most animation

1. **Scene 4 — the first jump.** The whole promise of the Moon in one move: the long rise, the hang, the slow fall, the shadow far below, the first footprints, then Amir sailing over Sari's head.
2. **Scene 6 — the line.** The bounding run with shadows racing ahead, and feet flipping between day and night colours in time with «خطوة.. ليل! خطوة.. نهار!». The refrain children will copy.
3. **Scene 8 — Wameed wakes.** The too-light lift, daylight wiping across him, the wing opening petal by petal, the three blinks.
4. **Scene 9 — half an Earth.** One slow tilt from footprints to the turning Earth, with towns lighting up on its night side; the moment the idea lands.
5. **Scene 2 — lift-off.** Finger countdown, the shiver, the paper flame and the scatter of paper scraps: the only loud, windy scene, which makes the Moon's stillness felt afterwards.
6. **Scene 12 — home.** Wind returning, the Moon brightening as the sky darkens, three gold blinks and the wave.

Runners-up if there is time: scene 5 (the orange's slow rise and fall, then the bump on the helmet — the best gag) and scene 11 (the pull-back that leaves the prints and one small rover alone on the Moon).

## Build once, reuse everywhere

- Three character rigs with front, three-quarter, profile and back views; a helmet that clips on; day and night colour sets for each.
- Wameed in two states (asleep and dusty; awake with wing open), with a blink and a wheel wiggle.
- The rocket, outside and inside.
- A Moon ground kit: dust plain, curved horizon, the day–night line, the persistent footprint layer.
- One Earth disc: a turning sea-and-cloud texture under a fixed half-shadow mask, with optional gold town lights on the dark half.
- One half-Moon disc for scenes 1 and 12.
