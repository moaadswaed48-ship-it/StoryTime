# A04 "Slow, Slow, Together": character designs and sheet prompts

Age group 2–3. Cast from `content/stories/a04/cast.json` (colours and builds below come from it; anything added is
marked **added**). Look: `STYLE-BIBLE.md`. Nothing here is generated until the owner approves (see the box at the
top of the style bible).

**Cultural neutrality, both characters:** no head covering, no religious or national symbol, no writing on
clothes. Names (Sami, Grandpa) and the anemone hill are shared by Arab and Jewish families in Israel: the red
anemone is loved as *kalanit* in Hebrew and *shaqa'iq al-nu'man* in Arabic.

## How every sheet is made (same for all characters in all films)

1. **Hero front image** (4 attempts): the identity block + the style block + "full body, front view, standing,
   plain light warm-grey background `#d9d4cc`". Pick one. This picked image is the character's **anchor**.
2. **Turnaround** (4 attempts, anchor attached): the turnaround prompt. Pick one.
3. **Expression sheet** (4 attempts, anchor and turnaround attached): the expression prompt. Pick one.
4. Save as `a04-<name>-anchor.png`, `a04-<name>-turn.png`, `a04-<name>-faces.png` and store them as one saved
   reference set (Higgsfield calls this an Element) so every shot attaches the same three images.
5. Record the model name, the seed (if shown) and the final prompt next to the files. About 12 images per character.

The **identity block** is pasted word for word into every image and video prompt where the character appears.
Changing one word in it is a new character.

---

## Sami (`a04-sami`), toddler, about 2½ to 3 years old

**Design idea:** a small round bundle of energy: big head, big eyes, curls that bounce, always on his toes.

| Feature | Value |
|---|---|
| Height | half of Grandpa's height (cast build height 0.48 against Grandpa 0.96) |
| Proportions | 3.5 heads tall; head almost as wide as his shoulders; short legs (about 1.2 heads); chubby arms; round tummy |
| Skin | `#c98b5f` warm medium brown, rosy cheeks `#d9876a` (**added**) |
| Hair | tight springy curls `#2b1a14`, short on the sides, a soft round mop on top; **one curl always falls on his forehead** (**added**, his recognition mark) |
| Eyes | very large, round, dark brown `#3b2618` (cast eye size 0.95: the largest in the film), two catchlights |
| Brows | thin, soft `#2b1a14` (weight 0.5), very mobile |
| Top | short-sleeved crew-neck T-shirt, sky blue `#5aa7d6`, white ribbed collar and sleeve hems `#ffffff`, plain (no print) |
| Bottom | knee-length shorts, mustard yellow `#e8b84a`, soft elastic waist |
| Shoes | brown sandals `#8a5a3a`, two straps with a buckle, toes visible |
| Marks | the forehead curl; dimples when he smiles (**added**) |

**Personality and acting** (from his manner): runs everywhere on his toes with arms out like a little plane; when
something catches his eye he stops **completely**, mouth a small open "o", and stares; when happy he leans his whole
body against Grandpa. He never looks frightened: at most a small worried brow (shot A04-S06).

**Identity block (paste unchanged):**
```
SAMI: a toddler boy about two and a half years old, 3.5 heads tall, half the height of his grandfather,
round chubby body, big round head, warm medium-brown skin (#c98b5f) with rosy cheeks, short tight springy
dark-brown curls (#2b1a14) with one curl always falling on his forehead, very large round dark-brown eyes,
thin soft dark brows, dimples when he smiles, sky-blue short-sleeved plain T-shirt (#5aa7d6) with white collar
and sleeve hems, mustard-yellow knee-length shorts (#e8b84a), brown two-strap sandals (#8a5a3a).
No hat, no jewellery, no print or writing on clothes.
```

**Hero front prompt:**
```
[STYLE BLOCK with LIGHT KEY (A04) replaced by: soft even studio light from front left, gentle fill, soft contact shadow]
[SAMI identity block]
Full-body character design, front view, standing straight on both feet, arms relaxed a little away from the body,
hands open and relaxed with five fingers each, happy small smile, looking at the camera,
centred, whole figure visible with space around it, plain light warm-grey seamless background (#d9d4cc).
No text, no labels.
```

**Turnaround prompt** (attach: Sami anchor):
```
[STYLE BLOCK, studio light version as above]
[SAMI identity block]
Character turnaround model sheet of the same boy as in the reference image, four full-body views side by side in one
row at exactly the same scale and height: front view, three-quarter front view turned to his left, side profile
facing left, back view. Same neutral standing pose in every view, arms slightly away from the body, hands relaxed with
five fingers each, calm small smile. Even soft studio light, plain light warm-grey seamless background (#d9d4cc),
soft contact shadow under each view, equal spacing. Identical face, hair, clothes and colours in all four views.
No text, no labels, no numbers, no arrows.
```

**Expression sheet prompt** (attach: anchor + turnaround):
```
[STYLE BLOCK, studio light version]
[SAMI identity block]
Expression sheet of the same boy as in the reference images: nine head-and-shoulders portraits in a 3 by 3 grid,
same size, same three-quarter angle, same lighting, plain light warm-grey background (#d9d4cc).
Row 1: calm neutral; big happy grin with dimples; excited, mouth open, eyes bright (about to run).
Row 2: wonder, mouth a small round "o", eyes wide, eyebrows up; small worried look, brows tilted up, lips pressed (not scared);
calling out with both hands cupped around his mouth.
Row 3: giggling, eyes squeezed into happy curves; whispering, finger to his lips; sleepy contented smile, eyes half closed.
Identical face, curls and T-shirt in every portrait. No text, no labels, no grid lines.
```

**Video notes:** in every shot he runs or stands with toes visible; his forehead curl must be present (check it in
the face comparison); he stays half Grandpa's height (write "half the height of his grandfather" when both appear).

---

## Grandpa (`a04-grandpa`), elder, about 70

**Design idea:** a tall, thin, unhurried man whose rhythm is the film's rhythm: stick, then foot.

| Feature | Value |
|---|---|
| Height | the tallest figure (cast height 0.96); twice Sami's height |
| Proportions | 6 heads tall; long legs; narrow body (girth 0.42) with broad, slightly rounded shoulders (1.4); a slight forward stoop at the upper back (**added**) |
| Skin | `#b47a52` warm brown; soft laugh lines at the eyes, two soft forehead lines (**added**) |
| Hair | short, neat, white `#eeeae4`; thinner on top (**added**) |
| Beard | short, trimmed, full white beard `#eeeae4`, rounded shape, the mouth visible above it |
| Eyes | small, kind, dark brown `#4a3526` (eye size 0.5), always a little crinkled at the corners |
| Brows | thick, soft, off-white `#e2ddd6` (weight 0.8) |
| Glasses | round frames, thin, dark brown `#3a2a20`, always on |
| Top | crew-neck knitted jumper, rust `#b8643c`, a cream shirt collar showing at the neck `#f2e6cf`, cream ribbed cuffs `#f2e6cf`; sleeves pushed up a little (**added**) |
| Bottom | straight trousers, light stone `#d9cdb4` |
| Shoes | brown leather lace-up walking shoes `#5a3a2a` |
| Stick | plain wooden walking stick `#7a5236` with a rounded crook handle and a dark rubber tip; **always in his LEFT hand** |
| Marks | the rust jumper (it makes him easy to find on the green hill, as page 3 needs) and the round glasses |

**Personality and acting:** plants the stick, then the foot, always in that order; never hurried or out of breath;
when he sees something small and lovely he stops, bends slowly and nods at it as if saying hello. His smile is in
his eyes. He bends toward Sami rather than lifting him.

**Identity block (paste unchanged):**
```
GRANDPA: a tall thin grandfather about seventy years old, 6 heads tall, twice the height of the small boy,
long legs, narrow body with broad slightly rounded shoulders and a gentle stoop, warm brown skin (#b47a52) with soft
laugh lines, short neat white hair and a short trimmed rounded white beard (#eeeae4), thick soft off-white eyebrows,
small kind dark-brown eyes crinkled at the corners, round thin dark-brown glasses (#3a2a20) always on,
rust-coloured knitted crew-neck jumper (#b8643c) with a cream shirt collar and cream cuffs (#f2e6cf),
light stone trousers (#d9cdb4), brown leather walking shoes (#5a3a2a), a plain wooden walking stick (#7a5236)
with a rounded crook handle, always held in his LEFT hand. No hat, no jewellery, no beads, no symbols.
```

**Hero front prompt:** as Sami's, with the GRANDPA identity block and "standing tall with a slight stoop, the
walking stick planted beside his left foot in his left hand, right hand relaxed with five fingers, gentle smile".

**Turnaround prompt** (attach: Grandpa anchor): as Sami's, with the GRANDPA identity block, plus: "In every view the
walking stick is in his LEFT hand, planted on the ground beside his left foot. Glasses visible in every view."

**Expression sheet prompt** (attach: anchor + turnaround):
```
[STYLE BLOCK, studio light version]
[GRANDPA identity block]
Expression sheet of the same grandfather as in the reference images: nine head-and-shoulders portraits in a 3 by 3 grid,
same size, same three-quarter angle, same lighting, plain light warm-grey background (#d9d4cc), glasses on in every portrait.
Row 1: calm neutral, kind eyes; warm smile with crinkled eyes; pointing ahead with his right hand, inviting look.
Row 2: whispering "shh" with a finger to his lips, eyes delighted; looking down tenderly at a small child; a slow nod with eyes closed.
Row 3: long contented sigh, eyes half closed; soft laugh; waving his right hand, smiling.
Identical face, beard, glasses and jumper in every portrait. No text, no labels, no grid lines.
```

---

## Small creatures and props (one sheet each, 4 attempts, about 4 images each)

| Item | Design | Identity line (paste unchanged) |
|---|---|---|
| Ladybird | round, glossy, simple; six round black spots; tiny friendly face suggestion only (no mouth) | `LADYBIRD: a small round glossy red ladybird (#d42a20) with six round black spots and a black head, simple and cute, six short legs` |
| Butterfly | lemon-yellow wings with a small orange dot on each, soft rounded wing shapes | `BUTTERFLY: a small lemon-yellow butterfly (#f2d03b) with one small orange dot on each wing, soft rounded wings` |
| Bee | round and fuzzy, gold and brown bands, small clear wings, no visible stinger | `BEE: a round fuzzy friendly bumblebee, golden (#f2b632) and dark brown (#3a2a1e) bands, small clear wings, no stinger visible` |
| Red anemone | five to six broad petals, red with a dark centre | `ANEMONE: a red anemone flower (#c8202c) with a dark purple-black centre (#2a1a2a), five to six broad soft petals, thin green stem` |
| Flat rock | big, smooth, warm grey-ochre, sun-warmed | `ROCK: a big flat smooth sun-warmed rock, warm grey with ochre patches (#b9a385)` |

## Location plates (no characters; 4 attempts each; also the book page backgrounds)

| Plate | Content |
|---|---|
| `a04-loc-hillfoot` | The green hill from its foot: three soft layered bands of green (`#7fa35a`, `#9cbd6b`, `#bcd48a`, lighter toward the top), a small red patch at the very top, pale morning sky (`#cfe6f2`), a flat path of beaten earth (`#c9a274`) leading up. Low camera. |
| `a04-loc-slope` | Mid-slope, side view, a small grassy bump, the path, the hill falling away to frame left (downhill = frame left in every shot). |
| `a04-loc-top` | Hilltop covered in red anemones (one flower shape repeated, two or three reds), seen from behind at child height; the big flat rock to one side. |
| `a04-loc-leaf` | Macro: one big green leaf, soft green and red blur behind. |

## Reference images each shot needs (shot numbers from `SHOTS-A04.md`)

| Shot | Sami sheets | Grandpa sheets | Other references |
|---|---|---|---|
| S01 | – | – | hillfoot plate |
| S02 | anchor + turn | anchor + turn | hillfoot plate |
| S03 | anchor + faces | anchor + faces | hillfoot plate |
| S04 | anchor + turn | anchor | slope plate |
| S05 | turn | – | slope plate |
| S06 | anchor + faces | – | slope plate |
| S07 | anchor (top band, small) | turn (bottom band, small) | slope plate |
| S08 | faces | – | slope plate |
| S09 | – | anchor + faces | slope plate |
| S10 | – | turn (feet, stick, shoes) | slope plate |
| S11 | turn | anchor | slope plate |
| S12 | anchor (hand, sleeve) | anchor (hand, cuff) | – |
| S13 | turn | turn | slope plate |
| S14 | anchor + faces | anchor | slope plate, butterfly |
| S15 | faces (blurred) | faces (blurred, glasses) | leaf plate, ladybird |
| S16 | anchor + faces | anchor | slope plate, anemone, bee |
| S17 | turn (back view) | turn (back view) | top plate |
| S18 | turn (back view) | turn (back view) | top plate |
| S19 | anchor + faces | anchor + faces | top plate, rock |
| S20 | anchor (hand) | anchor (hand, cuff) | rock, ladybird |
| S21 | anchor (hand) | – | ladybird |
| S22 | turn | turn | top plate, rock |

Most video models accept a limited number of reference images per shot; if the limit is lower than this list, keep
the start frame plus the anchors, and drop the expression sheet first.
