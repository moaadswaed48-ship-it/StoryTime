# Batch C2: stories C09 to C15 (ages 6 to 8), writer's notes, 25 Nov 2026

**Result.** C09, C10, C11, C12, C13, C14 and C15 are written in full in Arabic, Hebrew, English and Danish: book (14
spreads each), film script with shot list, activity, and character sheets. `storytool.py check c09 c10 c11 c12 c13
c14 c15` reports **no errors**. This is a writer's draft: no native speaker has read any of it, and the lists in §4
are the lines I am least sure of.

**Files.** `content/stories/c09/` to `c15/` each hold `story.json`, `cast.json`, `ar.json`, `he.json`, `en.json`,
`da.json`. The Arabic and Hebrew sources are `docs/story-room/pilots/src/c09.ar.json` … `c15.he.json`. The Arabic
light layer and the Hebrew display layer were generated with `storytool.py build`, never typed.

---

## 1. Counts (from the check tool)

| Story | Lang | Book words | Per spread | Longest sentence | Film words / longest caption |
|---|---|---|---|---|---|
| C09 Next Episode in Five, Four, Three… | en | 644 | 36-54 | 16 | 147 / 10 |
| | da | 598 | 33-54 | 15 | 142 / 11 |
| | ar | 486 | 28-44 | 14 | 118 / 9 |
| | he | 502 | 28-42 | 14 | 118 / 10 |
| C10 Long-Legs Flies South | en | 696 | 41-58 | 17 | 187 / 12 |
| | da | 666 | 39-53 | 19 | 184 / 11 |
| | ar | 514 | 31-44 | 14 | 152 / 9 |
| | he | 532 | 32-46 | 15 | 146 / 11 |
| C11 Meet Me at Four | en | 714 | 45-56 | 20 | 162 / 11 |
| | da | 674 | 41-55 | 18 | 175 / 12 |
| | ar | 539 | 32-46 | 13 | 129 / 10 |
| | he | 570 | 34-47 | 17 | 128 / 11 |
| C12 Words and Pictures | en | 698 | 40-60 | 20 | 136 / 11 |
| | da | 635 | 35-57 | 17 | 130 / 9 |
| | ar | 480 | 27-41 | 15 | 103 / 8 |
| | he | 533 | 31-47 | 13 | 118 / 8 |
| C13 After the Storm | en | 685 | 40-68 | 20 | 153 / 14 |
| | da | 630 | 36-61 | 17 | 150 / 13 |
| | ar | 469 | 25-49 | 14 | 122 / 11 |
| | he | 492 | 26-48 | 14 | 126 / 10 |
| C14 Two Ideas, One Raft | en | 666 | 35-59 | 20 | 141 / 11 |
| | da | 642 | 32-58 | 19 | 140 / 12 |
| | ar | 464 | 23-46 | 15 | 105 / 9 |
| | he | 523 | 25-51 | 14 | 117 / 8 |
| C15 The Bottle That Looked Like Juice | en | 614 | 31-52 | 19 | 144 / 11 |
| | da | 600 | 31-53 | 19 | 147 / 12 |
| | ar | 426 | 21-39 | 14 | 109 / 8 |
| | he | 476 | 24-45 | 15 | 115 / 9 |

Films: C09 383 s (43 shots), C10 377 s (40), C11 372 s (40), C12 365 s (42), C13 363 s (38), C14 367 s (36), C15
367 s (35); all inside the 6-to-8-minute proposal, each with silent shots and holds so a longer language can stretch,
and each ending on a still closing image with no autoplay. Activities: 20 to 30 minutes, 5 steps each.

Arabic and Hebrew spreads run below 30 words on some pages; the brief sets word counts on the English only, so this
is expected (the pilots show the same). Several English sentences sit exactly at the 20-word limit (C11 p12, C12 p13,
C13 p6, C14 p8): legal, but worth hearing aloud.

## 2. Checks run, besides the tool

- Exclamation marks: at most one per spread, all four languages (script).
- English: curly quotes only (script); British spelling; past tense throughout; effort praised, never "clever".
- Danish: a script listed every comma before a subordinating word; six start commas were removed (C09 forAdult x2,
  C11 p7, C12 inClass, C13 p6, C14 p3). Remaining hits are lists, comparisons and vocatives.
- Arabic: every word ending in ـتُ ـتَ ـتِ ـكَ ـكِ without the `^` marker was listed and read; all are case endings,
  verbs or nouns (ذَلِكَ، تَحْتَ، أَمْسَكَ، الْبِنْتُ), not person endings. Person endings at a pause were reworded
  so the gender is not lost (e.g. «سَأَقْرَأُ لَكَ الْقِصَّةْ», «احْكِي لِي عَنْ شِرَاعِكِ قَلِيلًا»).
- Hebrew: a script listed prefix and initial-letter shvas without the vocal mark (convention of REVIEW-he §3.4) and
  every כָּל without kamatz katan; one real miss was fixed (לְךָ → vocal shva, C11 and C12).
- Safety: every activity checked against `age-6-8.md` §7. Every safety line ends with the calm general line ("If
  there is an accident, call your local emergency number"), as the pilot reviews decided; no phone numbers anywhere.

## 3. Choices made, with the reason

- **C10, the storks have no character sheet.** The Sheet type is humanoid only, so Long-Legs and the big stork are
  described in the art notes (like the pilot's ladybird) and their film lines are spoken by the narrator, with the
  emotion field naming whom the narrator voices. Sheets exist for the girl and her grandfather. Long-Legs' name,
  translated by each writer (ledger asks for it to be recorded): **طَوِيلُ السَّاقَيْنِ, אֲרֹךְ רַגְלַיִם, Long-Legs,
  Langben.** The big stork is female in all four (Arabic لَقْلَقَة, Hebrew חֲסִידָה).
- **C10, a fact softened.** The outline ends "In spring he will come back the same way." Many young white storks do
  not return in their first spring [U, general knowledge; not source-checked]. The text now says storks fly back
  north the same way in spring, and "One spring, Long-Legs will come back too", which is true either way. All other
  stork facts follow the outline's checked list (thermals, no sea crossing, flying by day, fishpond valleys, first
  journey without parents, autumn passage from August); the forAdult text repeats only those.
- **C11.** The unnamed friend is a girl (a sheet "Felix's friend"). Grandpa teaches on an old wooden practice clock
  with movable hands, because the back of the real face would show the time mirrored. Danish uses "halv fire" for
  3.30 and the text and pictures agree (short hand halfway between three and four).
- **C12.** The book inside the story is about a tortoise. Each language chose its own "long word": somersault /
  kæmpekolbøtte / تَشَقْلَبَتْ / הִתְגַּלְגֵּל, and later celebration / festligheder / احْتِفَالًا / הַחֲגִיגָה.
  The Arabic is read in pieces separated by commas (احْ، تِ، فَا، لًا) because a short vowel before "…" breaks
  the pausal rule. The brother and the boy in the next bed are named by role; the brother's cast and the boy's sling
  are written into `manner` for the Studio.
- **C13.** The girl in the wheelchair is the caller; four children lift ("four pairs of hands"), so the five helpers
  of the outline are all there. The twins share one sheet, drawn twice. The Sheet type has no wheelchair (as in
  B02): it is described in `manner` and every art note. Diana's mother checks the wires before anyone touches the
  branch.
- **C14.** The pool is a still, ankle-deep widening of the stream, so a raft without a sail turns but does not drift;
  Rani's father reads on the bank and looks up "every few lines" (the water rule). Motif: it tipped / it turned / it
  sailed.
- **C15.** The outline's "together they move every bottle to the top shelf" became Grandma moving the bottles while
  Rose counts, so no child handles a cleaning product. The red-hand sign carries no words (the meaning is spoken).
  Motif: "ask first" (Rose, the sign, the cousin at the end). The bottle is never opened or touched on screen.
  Arabic needed a side of the family for "cousin": ابْنُ خَالَتِهَا (maternal aunt's son), so the grandmother is
  shared. Hebrew בֶּן הַדּוֹד, Danish fætter, English cousin are side-neutral.
- **C15 adult note, sources.** Sourced: CDC lists keeping harmful household products out of reach as a 6-to-8 goal
  (ages §J3.19); AAP says most poisonings happen when caregivers are home but not paying attention (safety §1.3).
  Not in our research files, written as advice not fact: keep products in their original containers, never in drink
  bottles; call the local poison information centre or emergency number at once if a child may have swallowed or
  touched a product; "many products carry warning pictures, often a black picture inside a red-edged diamond"
  [U: true for the EU's labelling; Israeli labelling rules were not checked].
- **C09.** The screen voice ("Next episode in five, four, three…") is spoken by the narrator. The cartoon is a cat in
  a space helmet, no brand. Max's own countdown for his rocket turns the screen's countdown into his.
- **Emotion directions** are English in all four files, as in the pilots.

## 4. Lines I am least sure of, for the native editors

**Arabic**
1. Spoken-word choices: الطَّمَاطِم (C09, Israeli speakers say بندورة); الْكُرَاتُ الزُّجَاجِيَّةُ for marbles (C11; كُلَل
   or بِلْي are local); تِكْ… تَاكْ and دَنْ for a clock (C11); مِرْوَحَةٌ وَرَقِيَّةٌ for a paper windmill (C11); طَوْف
   for raft (C14, Standard-only, pictured and repeated); يَعْسُوب for dragonfly (C14); لَقْلَقَة for the female stork
   (C10).
2. The name طَوِيلُ السَّاقَيْنِ (C10): is it natural, and is its declension (طَوِيلَ، طَوِيلِ) acceptable for a name?
3. The countdown «الْحَلْقَةُ التَّالِيَةُ بَعْدَ قَلِيلْ: خَمْسَةْ، أَرْبَعَةْ…» and the title «الْحَلْقَةُ التَّالِيَةْ:
   خَمْسَةْ، أَرْبَعَةْ، ثَلَاثَةْ…» (C09).
4. The clock chant «الطَّوِيلُ فَوْقْ: تَمَامًا. الطَّوِيلُ تَحْتْ: وَالنِّصْفْ.» (C11), and «كَبِيرٌ عَلَى وَاحِدْ»
   for "too big for one" (C13).
5. Hour words: «الثَّانِيَةَ عَشْرَةْ!», «الْعَاشِرَةْ», «الثَّالِثَةُ وَالنِّصْفْ» (C11).
6. Month and country in adult text: «شَهْرِ آبَ» and «فَوْقَ إِسْرَائِيلَ» (C10), following the pilot A04.
7. Lines that may sound bookish: «حَانَ الْوَقْتُ لِتَتَعَرَّفَ إِلَى السَّاعَةْ» (C11); «تَبَادَلَتْ سِيلِينُ وَرَانِي
   النَّظَرَاتْ» (C14); «انْفَتَحَتِ الْبَوَّابَةُ عَلَى مِصْرَاعَيْهَا» (C13); «وَكَانَ طَعْمُهُ طَعْمَ الْبُرْتُقَالِ
   وَالشَّمْسْ» (C15).
8. «احْكِ لِي» (masc.) shows as احك in the light layer, because L2 drops its final kasra; a reader may stumble.
9. Pausal forms that drop a gender ending in speech: «أَرَأَيْتْ؟» (C14), «بِفَضْلِكْ» (C13 adult text). Deliberate,
   but please confirm they read naturally.

**Hebrew**
1. Spelling: pointed (defective) spelling as decided in REVIEW-he §3.1, with participles in vav (שׁוֹמֵר, מוֹשֵׁךְ).
   Words to check: עָרְמוּ, אִצְטְרֻבָּלִים, מַטְאֲטֵא, מְעַרְבֹּלֶת, שְׁרַפְרַף, צָהֳרַיִם with kamatz katan.
2. Vocal shva left unmarked after the article on ר (הָרְחוֹב) and in initial clusters (בְּרֵכָה, קְטַנִּים); marked in
   identical-letter and second-of-two cases (חִמְּמָה, הִסְתּוֹבְבוּ, נִגְמְרוּ, הִתְנַדְנְדוּ).
3. Stress marks on forms I judged penultimate: הִסְתִּירָה, הֵרִימָה, הֶעֱבִירָה, מִתְנַשֶּׁפֶת, שָׁטָה, צָפָה, בָּאָה (past),
   דָּרוֹמָה, צָפוֹנָה, הֵבֵאתִי, סָחַטְתִּי, הִגַּעְתָּ.
4. Words: אֲרֹךְ רַגְלַיִם as a name (C10); גּוֹזָל שֶׁל חֲסִידָה for a young stork (masculine) beside the feminine
   חֲסִידָה; שְׁנָתוֹת for the twelve marks (C11); סָגוּר for "deal" (C12, colloquial); הָרִימוּ! as the lifting call
   (C13); רַבֵּי חוֹבְלִים (C14); דּוֹנְג for the clock (C11).
5. Counting aloud is feminine even for masculine objects (C15 bottles, C10 tally), following the C01 pilot; the
   totals use the noun's gender (שִׁבְעָה בַּקְבּוּקִים, חֲמִשָּׁה צִיּוּרִים).
6. Lines: «וְאֵין לוֹ מֻשָּׂג» (C11 refrain); «זֶה אוֹמֵר: לַעֲצֹר. לַעֲצֹר, וְלִשְׁאֹל קֹדֶם.» (C15 sign, infinitives
   to stay gender-free); «הֵנִיעָה בְּרֹאשָׁהּ לִשְׁלִילָה» (C10).

**English**
1. "Pins and needles" (C09 p6); "Long-Legs" hyphenated as a name (C10).
2. "It's time you met the clock" (C11): the pun should land; "Two hands, twelve marks, and no idea" as a refrain.
3. "the baker's boy" in narration vs. the role name "the boy from the bakery" (C13).
4. Sentences at exactly 20 words (see §1).

**Danish**
1. "juice" (C15) instead of "saft": saft is a cordial, and the story turns on fresh orange juice. A loanword the style
   guide would normally avoid; please rule on it.
2. "Langben" (C10; Swedish readers know "Långben" as Goofy); "Lige op er hel. Lige ned er halv." as the clock chant
   (C11); "pulterkammer" for the storeroom (C15); "dæk" for the raft's floor (C14).
3. "Fem ad gangen" for counting in fives (C10); "Det er på tide du hilser på uret" (C11).
4. "bedstefar"/"bedstemor" kept (no family side fixed by the outlines).

## 5. Not done, and what the tool and schema would need

- No native read; no voice test; film timings are estimates; no pictures or films made (Studio work).
- The C10 storks speak through the narrator because a cast sheet cannot describe an animal. Suggested change for the
  coordinator: let `cast.json` hold non-humanoid sheets (or let a film line name a speaker that is not a sheet), so
  an animal character can have its own voice.
- The tool now takes story names (`check c09 … c15`); I did not edit it. Five writers share one scratchpad folder:
  a helper script of mine was overwritten by another writer's file of the same name. Writers should use per-batch
  subfolders.

## 6. Review pass, English and Danish: facts checked (25 Nov 2026)

- **C10, young storks' first return.** NABU ("Störche auf Reisen", nabu.de): young storks "kehren erst nach einigen
  Jahren ins Brutgebiet zurück" (return to the breeding area only after some years) [S]. A study in an MDPI journal
  reports first breeding usually at three, peaking at four [U: found in search, page not opened]. The writer's
  ending ("One spring, Long-Legs would come back too") is true and stays. Grandpa's "In spring. Storks fly back
  north the same way" is true of the flock. The forAdult text (en, da) now adds: most young storks stay in the south
  for their first summers and come back north only after a few years, ready to nest. Arabic and Hebrew: please add
  the same sentence to the adult text; no story line changes.
- **C15, poison advice.** Safe Kids Worldwide "Poisoning Prevention Tips" (2015 PDF, safekids.org): store household
  products out of children's sight and reach; safety locks on cabinets; keep products in their original containers,
  never in something like a soda bottle; many incidents happen when adults are distracted [S]. Israel's National
  Poison Information Center at Rambam, as quoted in the Israeli press (Maariv; Kipa): store cleaners only in their
  original bottles, never in drink bottles or cups, in a high or locked cupboard; in any exposure call the centre;
  do not make the child vomit [S, secondary]. The story already matches (Rose leaves it and asks; Grandma moves every
  bottle up high and locks the cupboard; calm, no fear). The forAdult text (en, da) now adds after the poison-centre
  line: do not wait for signs, do not try to make the child sick, and keep the product to read out its label.
  Arabic and Hebrew: please add the same. "Warning pictures in a red-edged diamond" remains [U] for Israeli labels.
