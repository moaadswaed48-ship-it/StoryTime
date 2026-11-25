# Batch A2 notes: stories A09 to A15 (ages 2 to 3), 25 Nov 2026

**Result.** Seven stories are written in full in four languages: book, film script with shot list, activity, and
character sheets. They follow the reviewed outlines and the pilot format. `storytool.py check` reports **no errors**
for all seven. They are a writer's draft. No native speaker has read any language yet, and the lists in §4 say
which lines I trust least.

**Files.** `content/stories/a09/` to `a15/` (`story.json`, `cast.json`, `ar.json`, `he.json`, `en.json`,
`da.json`) and `docs/story-room/pilots/src/a09.ar.json` … `a15.he.json`. The Arabic and Hebrew files in
`content/` were generated from those sources by the tool, never typed.

---

## 1. Counts (from the check tool)

Words are counted on the book pages. The brief's limits (40 to 150 words, 3 to 15 a spread, 8 words a sentence,
8 words a caption) bind English and Danish; Arabic and Hebrew must stay under the cap and the sentence limit.

| Story | Spreads | Film | ar | he | en | da | Longest sentence (en / da / ar / he) |
|---|---|---|---|---|---|---|---|
| A09 Hot, Hot, Hands Back! | 11 | 148 s, 16 shots | 108 | 108 | 129 | 121 | 7 / 6 / 7 / 7 |
| A10 Soft Hand, Slow Hand | 11 | 145 s, 15 shots | 118 | 120 | 131 | 133 | 8 / 8 / 8 / 7 |
| A11 Round and Round | 11 | 145 s, 15 shots | 87 | 81 | 113 | 103 | 7 / 7 / 6 / 4 |
| A12 Teddy Needs a Wee Too | 10 | 128 s, 13 shots | 91 | 87 | 101 | 95 | 8 / 7 / 7 / 6 |
| A13 Where Is Little Hedgehog? | 11 | 145 s, 15 shots | 93 | 89 | 117 | 118 | 7 / 7 / 6 / 6 |
| A14 Everything Has a Home | 10 | 130 s, 13 shots | 91 | 81 | 115 | 94 | 8 / 7 / 7 / 6 |
| A15 My Turn, Your Turn | 11 | 137 s, 14 shots | 90 | 92 | 103 | 98 | 8 / 8 / 5 / 6 |

Every film ends on a still image held about 6 s, with no autoplay, and has at least one shot with no words.
Every activity is 10 minutes, one action repeated, 5 picture steps, with the general emergency line (not numbers).

## 2. Choices I made, with the reason

- **Animals and a toy have character sheets** (`a10-cloud`, `a13-little-hedgehog`, `a13-mama-hedgehog`,
  `a12-teddy`). They act and need names in four languages, and the tool requires a sheet for every name. The
  `Sheet` type has no animal or toy. I filled the human fields as placeholders (colours mapped to fur, chest and
  spines), added an `animal` or `toy` key, and wrote "NOT A HUMAN FIGURE" in `manner`. **The Studio needs an
  animal and toy sheet type before drawing them.** The beetle, snail, owl (A13), jay (A14) and crab (A15) are
  background and have no sheet.
- **Translated names** (ledger asks for them to be recorded): Cloud = غَيْمة, **עֲנָנָה** (not the suggested עָנָן:
  the cat is female and the verbs agree with her), Cloud, Sky. Little Hedgehog = القُنْفُذ الصَّغير, קִפּוֹד קָטָן,
  Lille Pindsvin; Mama Hedgehog = ماما قُنْفُذة, אִמָּא קִפּוֹדָה, Mor Pindsvin. Teddy = دُبْدوب, דֻּבִּי, Teddy, Bamse.
- **Uncle in Arabic** must name a side of the family. A09 uses عَمّ (father's side), A11 خال (mother's side); the
  outlines do not say. Danish uses the neutral "onkel".
- **Refrains written natively, not translated.** Arabic A11 chants دَائِرَةٌ (circle) because an adjective would
  change gender with each round thing; Arabic A14 says «بَيْتُ الْأَكْوَابِ فِي السَّلَّةْ» ("the cups' home is the
  basket"); Hebrew and Arabic A15 use "once Maya, once Amir" (פַּעַם מָאיָה, פַּעַם אָמִיר / مَرَّةً مَايَا، وَمَرَّةً أَمِيرْ),
  which assumes no gender, and keep "my turn, your turn" only in the children's own film lines.
- **A09 activity** uses baked bread only, as the review required. The story itself still shows Dina patting the
  baker's raw dough, as the outline says; nobody eats it. The owner may want to know.
- **Safety additions beyond the outlines:** A09 says a flat taste only, sitting down, never a whole bread ball in
  the mouth; A10's bag has no drawstring, the sponge or pinecone is removed if chewed, and allergies are checked
  first (a pinecone is plant material); A12 trousers have no drawstring and the child sits on the floor; A13
  flaps are never closed over a child; A14 every object passes the tube test, no laces, no plastic bags.

## 3. For the coordinator: the tool

- `storytool.py` has `STORIES = ['a04', 'b02', 'c01']` built in, so it neither builds nor checks A09 to A15. I did
  not edit it. I ran it through a wrapper that imports the tool and sets `STORIES` to my ids. **Change needed:**
  add the new ids to `STORIES`, or let `build` and `check` take ids on the command line.
- `ar_light_word` crashes (IndexError) when a one-letter prefix marker sits right before a guillemet
  (`وَ|«…»`): the stem is empty. I wrote `وَ«` without the marker. A guard in the tool would help the next writer.
- The "sukun before hamzat al-wasl" check misses a diphthong waw followed by a silent alif (`يَرَوْا الْكِبَارَ`).
  I found one by hand and corrected it to `يَرَوُا`.
- The scratchpad is shared between writers. Early on I ran another writer's wrapper by mistake. It rebuilt
  `content/stories/b09/ar.json` from that writer's own source, which is what their build does anyway. I changed
  none of their sources or files after that.

## 4. Lines I am least sure of, per language (for the native editors)

I am a language model. I checked every Arabic mark and every Hebrew point by rule, word by word, but I do not have
a native ear, and I can be wrong about what sounds natural to a parent in Haifa, Rahat, Copenhagen or Leeds.

**Arabic**
1. Sound words: طَبْ (patting; in the light layer طَب could be misread as طِبّ), بُفْ, فُو (blowing), هُوبْ, طَشْ
   (splash), خُرْ (purr), تُوتْ (train), هِهِهْ (giggle; هِي would have shown as the pronoun هي).
2. Word choices: النُّونِيَّة (potty), الْبَانْيُو (bathtub, a loanword), الْجَزْمَة (boot), الْغُمَّيْضَة (hide-and-seek),
   أَبُو زُرَيْق (the jay's everyday name; the reference name is القِيق), سَلْطَعُون (crab; I avoided سَرَطَان, which
   also means cancer), الْمِرَشَّة (watering can), سَطْل (bucket), كُوزُ صَنَوْبَرٍ (pinecone).
3. Names declined as diptotes: دَانْيَالُ (foreign name), رَيَّانُ (فَعْلان), غَيْمَةُ and قُنْفُذَةُ (feminine names).
   أَمِيرٌ takes tanwin as a name, which may read like "a prince": the editor may prefer to avoid tanwin on it.
4. A12: «دُبْدُوبٌ يُرِيدُ الْحَمَّامَ أَيْضًا» for "needs a wee", and تُنَظِّفُ نَفْسَهَا for "wipe": polite, but are they
   what a parent says?
5. هَيَّا نَلْعَبُ with the indicative (as in the pilot); عَالِيًا، عَالِيًا for "up, up"; تُصْبِحُونَ عَلَى خَيْرْ as the
   narrator's goodnight (A13).
6. A10 activity: نَاعِمٌ and أَمْلَسُ overlap in Arabic; طَرِيّ for "squishy" is my choice.

**Hebrew**
1. A09 refrain יָדַיִם אָחוֹרָה ("hands back"): clear and chantable, but is it what a parent says? (Alternative:
   "חַם! לֹא נוֹגְעִים!")
2. Stress marks I am least sure of: פִּ@יפִּי, דֻּ@בִּי, נַ@דְיָה, אֵ@לָה, אַמְבַּ@טְיָה, פִּ@יקְנִיק.
3. Sound words: רַחְרַח (sniff), טִיף (wee), פוּ (blowing), הוֹפּ, טוּט, הִי הִי, הוּ הוּ.
4. Words: טוֹפַחַת (patting dough), מְכֻדָּר and דּוֹקְרָנִי (the curled hedgehog), לַשֵּׁרוּתִים for "into the bathroom",
   הַסִּיר for the potty, עוֹרְבָנִי (jay), הַשְּׁמֻשָׁה, אֲפֹרָה, וְרֻדִּים in pointed spelling.
5. Vocal shva before a guttural (יוֹצְ%אִים, נוֹסְ%עִים, קוֹרְ%אִים, וּטְ%עִימָה) and the second of two shvas
   (מְ%דַגְדְּ%גִים), following the pilot reviewer's convention.
6. Adult text: "קמח לא אפוי" for raw flour; "בצק משחק" for play dough.

**English**
1. "wee" and "pants" (A12, British); "Whoo-whooo!" for the train (a British reader may expect "Toot-toot!").
2. "The biggest round of all" and the chant "Round, round, round" (A11).
3. A14 pages 3 and 4 open with "Dad holds the basket / the bag" so each sentence stays within 8 words; the
   reader must infer that Dad speaks.

**Danish**
1. "Sky" as the cat's name (the ledger's suggestion) and "onkel" without a side of the family.
2. Sound words: Vups, Trip, trip, trip, Prrr, Plip, plip, Tuuut, Hiv, Hi hi, Uhu.
3. "lunt" against "varmt" as the A09 contrast; "Rundt, rundt, rundt" as a chant next to the adjective "rund".
4. "gemmeleg"; "Mor Pindsvin" and "Lille Pindsvin" with capitals as names; "Den største runde ting af alle".
5. Titles: "Bamse skal også tisse", "Bamse af og på" (activity), "Føleposen", "Kassetunnellen".

## 5. Not done

- No native read, no voice test, no pictures, no film, no audio.
- Film timings are estimates; each film has silent holds so a slower language can stretch.
