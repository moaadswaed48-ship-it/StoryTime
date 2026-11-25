# Batch B2: stories B09 to B15 (ages 4 to 5), writer's notes, 25 Nov 2026

**Result.** B09 to B15 are written in full in four languages, in the pilots' format: book, film script with shot
list, activity and character sheets. The check tool reports **no errors** for all seven. This is a writer's draft:
no native speaker has read any language yet, and the lists in §4 say where I am least sure.

**Files.** `content/stories/{b09…b15}/` (`story.json`, `cast.json`, `ar.json`, `he.json`, `en.json`, `da.json`) and
`docs/story-room/pilots/src/{b09…b15}.ar.json`, `.he.json`. Arabic and Hebrew display text was generated from the
fully marked sources by `storytool.py build`, never typed. Nothing was committed by me.

---

## 1. How the checks were run

`storytool.py` lists only the pilot ids in `STORIES`, so I ran it unchanged through a small wrapper in my scratchpad
that imports the tool and sets `STORIES` to the B2 ids before calling `build` and `check`. Last run: **Errors: none**.
Extra checks by script, beyond the tool: at most one `!` per spread in all four languages (none over); every Arabic
word ending in ـتُ ـتَ ـتِ ـكَ ـكِ without `^` reviewed (all are feminine verb endings with a helping vowel, nouns, or
أنتَ, which L8 handles); Danish scanned for optional start commas (four removed); Hebrew audited against the pilots'
vocal-shva convention (prefixes and initial י ל מ נ ר marked; after the article only י and מ; identical letters; the
second of two shvas) and for missing stress marks on segolates, ‑ayim, hifil past and hollow-verb past forms (one
fixed: אוֹהֶ֫בֶת).

**Suggested tool changes (not made; the tool is not mine to edit):**
1. Let `check` and `build` take story ids on the command line, or find every `src/*.ar.json`, instead of the fixed
   `STORIES` list, so batch writers do not need a wrapper.
2. Add the one-`!`-per-spread rule to `check`.
3. Hebrew word splitting stops at the geresh (׳), so `פִּיגָ׳מָה` is checked as two words. Harmless today.

## 2. Counts (from the check tool)

Book words are for the English and Danish limits (200 to 450 in total, 15 to 40 a spread, sentences of 14 at most);
Arabic and Hebrew must only stay under the cap and the sentence limit. All films are 4 to 5 minutes as briefed.

| Story | Lang | Words | Per spread | Longest sentence | Film words / longest caption |
|---|---|---|---|---|---|
| B09 The Kite That Kept Falling | en | 343 | 24-39 | 12 | 84 / 9 |
| | da | 326 | 21-39 | 12 | 75 / 9 |
| | ar | 250 | 16-32 | 9 | 63 / 7 |
| | he | 266 | 17-32 | 9 | 66 / 7 |
| B10 The Big Brother Song | en | 295 | 20-30 | 13 | 96 / 12 |
| | da | 288 | 19-31 | 14 | 97 / 11 |
| | ar | 231 | 14-27 | 14 | 78 / 8 |
| | he | 230 | 13-25 | 14 | 78 / 10 |
| B11 Drum My Name | en | 271 | 16-30 | 11 | 55 / 9 |
| | da | 255 | 16-32 | 11 | 53 / 8 |
| | ar | 220 | 13-26 | 13 | 49 / 10 |
| | he | 241 | 16-28 | 10 | 50 / 6 |
| B12 Ball, Box, Tube, Cone | en | 317 | 17-40 | 14 | 92 / 10 |
| | da | 289 | 16-39 | 14 | 90 / 12 |
| | ar | 234 | 11-31 | 12 | 63 / 8 |
| | he | 249 | 12-30 | 12 | 68 / 8 |
| B13 The Blue-White Path | en | 279 | 17-34 | 12 | 89 / 12 |
| | da | 276 | 15-35 | 11 | 90 / 12 |
| | ar | 223 | 12-26 | 13 | 72 / 9 |
| | he | 232 | 12-29 | 9 | 70 / 8 |
| B14 The Window Seat | en | 339 | 19-35 | 14 | 94 / 11 |
| | da | 314 | 16-34 | 14 | 87 / 11 |
| | ar | 240 | 12-26 | 12 | 74 / 8 |
| | he | 256 | 15-29 | 14 | 73 / 10 |
| B15 The Seed That Took Its Time | en | 323 | 21-34 | 14 | 75 / 11 |
| | da | 312 | 19-31 | 13 | 76 / 12 |
| | ar | 264 | 17-30 | 13 | 69 / 8 |
| | he | 270 | 14-29 | 12 | 67 / 9 |

Every story has 12 spreads. Films: B09 254 s in 29 shots; B10 254 s in 28; B11 246 s in 29; B12 249 s in 28; B13
253 s in 28; B14 254 s in 27; B15 255 s in 27. Each has wordless shots, a viewer's pause after the story's question,
a breathing moment and a held closing image with no autoplay. Activities: 3 steps each; 15 minutes (B14 20; B15 15 to
set up, then a few minutes a day for one or two weeks).

## 3. Choices made, and things for the coordinator

- **Facts kept as the review corrected them.** B09: Rita launches with her back to the sea wind and does not run; the
  grass bends away from the sea. B15: the dark cup sprouts too, long, thin and pale, and greens in the light.
- **B10 safe sleep.** The activity ends with the doll on its back, "because babies sleep on their backs". This is
  standard public-health advice I know well, but it is not in our research files: tag it [U] until a source is added.
- **B13 colours (please decide).** In Hebrew, "כחול-לבן" (blue-white) is the fixed phrase for the Israeli flag and
  national identity; in English for Israeli readers it can carry the same echo. That clashes with the neutrality
  rule. I kept the outline's blue and white tiles, but gave the Hebrew and Arabic books neutral titles ("שביל
  המרצפות", "ممرّ البلاط"). If the owner agrees, a second colour pair (for example blue and yellow) is a two-minute
  change in all four files and the art notes.
- **B14 crab became a seagull.** Hebrew סרטן and Arabic سرطان both also mean cancer; a seagull keeps the sea memory
  without that word. The picture is shared, so all four languages changed.
- **"Old city".** Hebrew "העיר העתיקה" points to one real place, so every language says "the old part of a city".
- **Cast added beyond the outlines, as background sheets:** B11 a boy who answers twice and Tala's mother (a child of
  five should not walk home alone at night); B15 a classmate who shouts "Look!". The pigeons, the cat and the snail
  have no sheets (not humanoid), as with the pilot's ladybird.
- **B10 baby.** The Sheet type has no baby stage; her sheet uses `toddler` with smaller proportions and a note that the
  Studio must add a baby stage or draw her swaddled. She is never shown walking or sitting.
- **Name clash outside my files.** `src/cast/cast.ts` already has activity-cast characters called Noor and Dana, and
  the ledger also gives those names to B15 and B12. My sheet ids are `b15-noor` and `b12-dana`, so nothing breaks, but
  the ledger's "no name used twice" is not true across the whole site.
- **B09 uncle.** Arabic needs a side of the family: I chose خال (mother's brother). Danish uses the neutral "onkel".
- **B11 beat words per language**, all in the shared pictures (a cat under a small tree, pigeons, a cart with
  watermelons and oranges, a lamp, a window, the moon, a door): English cat / pigeon / watermelon; Danish kat / due /
  appelsiner; Arabic قطّ / حمام / برتقالة; Hebrew עץ / יונה / אבטיח. Tala has two beats in all four.
- **Emergency line:** the calm general line from the pilot reviews, in all four languages. No numbers.

## 4. Lines I am least sure of, for the native editors

I am a language model. These are the places where my judgement is weakest; the rest still needs a native read.

### Arabic
1. **Recited lists with sukun before commas**, by analogy with the pilot's counting forms (REVIEW-ar D6): the colour
   chant زَرْقَاءْ، بَيْضَاءْ (B13), وَاحِدْ، اثْنَانْ، ثَلَاثَةْ (B15), and the syllable claps بُرْ، تُ، قَا، لَةْ and
   تَا، لَا (B11). On one-letter syllables (حَ، تُ) I used the `^` marker so the light layer keeps the vowel; otherwise
   it shows a bare letter. Also, «تا، لا» may be read as "no" for a moment.
2. **Word choices:** طَائِرَة وَرَقِيَّة (kite); الحافِلة rather than الباص; المسّاحات with زِيكْ، زَاكْ for the
   wipers; بَنَدورة rather than طَماطِم; الحَجْلة for hopscotch; طِنْجَرة; تَحْزِرون; مُدَوَّر; صَنانير for the hooked
   shoots; دُمْ (drum), وَاءْ (baby), طَبْ and طَاخْ (thuds), بِشْشْ (bus door), نَطّْ (hop), وُوشْ (wind).
3. **Lines:** the B10 lullaby «يَا قَمَرًا فِي السَّمَاءْ… فِي عَيْنِ الْقَمَرِ الْمُنِيرَةْ» (written as saj‘, addressed to the
   little fish so it suits a boy and a girl); «صِرْتِ عَامِلَةً فِي فَرِيقِي!» for "You're hired!" (B12); «رَكَضَتْ
   أَسْرَعْ» (B09); «أَخَذْتِ وَقْتَكِ كُلَّهْ» (B15); «أَنْتَ عَلَى حَقّْ. بَيْضَاءُ بَعْدَ بَيْضَاءْ!» (B13).
4. **Grammar to confirm:** نُور treated as a diptote (نُورُ, no tanwin; the other option is allowed too); أَمِين and
   زَكِيّ with tanwin; a few dual verbs (حَمَلَتَا، بَنَتَا، يَخْبِطَانِ), which group B allows rarely.
5. **"في إسرائيل"** in the plant warning (B13) and the hopscotch note (B14), following pilot A04.

### Hebrew
1. **Spelling:** גָּבֹהַּ (pointed spelling, not גָּבוֹהַּ); חֻמּוּס; עַגְבָנִיּוֹת with a soft ב; פִּיגָ׳מָה with geresh;
   קוֹנוּס next to the school word חָרוּט (B12); אֲרֻבָּה; מְתוֹפֵף as noun and verb (the pi‘el is מְתַפֵּף).
2. **Stress marks I added that the pilots never needed:** אִ֫מָּא, אַ֫בָּא; the names רִ֫יטָה, זַ֫כִּי, טָ֫לָה, דָּ֫נָה;
   אָחוֹ֫רָה, קוֹ֫נוּס, מִ֫ישֶׁהוּ. Past forms such as קָפְצָה, טִפְּסוּ are left with final stress, as in the pilots.
3. **Vocal shva and kamatz katan I marked:** זִמְזְמָה, שִׁחְרְרָה, נִדְלְקוּ, נִפְתְּחָה, נֶחְבְּטוּ, מִתְגַּלְגְּלִים,
   הִשְׁקְתָה, נִפְנְפָה; kamatz katan in בָּאׇזְנַיִם, בַּצׇּהֳרַיִם, לְמׇחֳרַת.
4. **Sound words:** אִנְגֶּה (baby), שׁוּף, שׁוּף (wipers), טַק (tile), טְרָאח, בּוּם for the kite's bumping, ווּשׁ, פְּשְׁשְׁשׁ.
5. **Lines:** B09 p1 «הִגִּיעַ יוֹם הָרוּחַ הָרִאשׁוֹן שֶׁל הַסְּתָו» and p7 «הַדֶּשֶׁא נָטָה הַרְחֵק מִן הַיָּם» (both may sound
   stiff); B10 lullaby «יָרֵחַ בַּשָּׁמַיִם… לַיְלָה טוֹב, אֲנִי כָּאן» (written without a gendered imperative so it
   fits a boy and a girl); B12 «אַתְּ מִתְקַבֶּלֶת לָעֲבוֹדָה!»; B13 the chant כָּחֹל, לָבָן (see §3); B15 «לָקַחְתָּ
   אֶת הַזְּמַן שֶׁלְּךָ».

### English
1. "You're hired!" (B12): is the joke clear to a four-year-old?
2. Sound words: "Psshh" (bus door), "Waaah" and "WAAAH!" (B10), "Swish, swish went the wipers".
3. B11 syllables written with hyphens ("Win-dow", "Ta-la") inside the story text, and "Boom-boom" counted as one word.
4. B09 "Up it went" and "the wind hummed in their ears"; B14 "little painter".

### Danish
1. Sound words: "Sus!" (wind, B09), "Bums" (crash), "Uææ" (baby), "Visk, visk" (wipers), "Pssst", "Bonk", "Klik".
2. Words: "fliselægger" (B13), "et fif" (B12), "Du er ansat!", "hinkerude", "Storebrorsangen", "Mit navn på trommen",
   "Frøet der tog sig god tid".
3. The B10 lullaby: «Lille måne, rund og stor. Lille fisk der i havet bor. Luk dine øjne, lille ven. Sov nu sødt,
   og sov igen.»
4. B15 "Man kan få dem i den gale hals" for a choking risk; B09 "Den vippede hid … og did"; B14 "Kom og stå her hos
   mig".

## 5. Not done

- No native read in any language, and no voice test of the Arabic full layer or the Hebrew speech marks.
- No pictures, films or audio: that is Studio work. Film timings are estimates until a real voice read.
- No fresh-context reviewer has read this batch yet.
