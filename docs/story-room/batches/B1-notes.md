# Batch B1: stories B01, B03, B04, B05, B06, B07, B08 (ages 4 to 5), 25 Nov 2026

**Result.** Seven stories are written in full in Arabic, Hebrew, English and Danish: book (13 spreads each), film script
with shot list, activity with the adult's explanation and a class version, and character sheets. The check tool reports
**no errors** for all seven. This is a writer's draft by a language model: **no native speaker has read any of it**, and
the Arabic marks and Hebrew pointing follow the pilots' conventions, which still wait for their editors.

**Files.** `content/stories/{b01,b03,b04,b05,b06,b07,b08}/` hold `story.json`, `cast.json`, `ar.json`, `he.json`,
`en.json`, `da.json`. The Arabic and Hebrew sources are `docs/story-room/pilots/src/<id>.ar.json` and `<id>.he.json`;
the display layers were generated from them by `storytool.py build`, never typed by hand.

**How the check was run.** `storytool.py` has its story list fixed to the three pilots (`STORIES = ['a04', 'b02',
'c01']`). I did not edit the tool. I loaded it unchanged from a small wrapper that sets that list to my seven ids and
then calls its own `build` and `check`. Suggested change for the tool's owner: take the story ids from the command line
(`storytool.py check b01 b03 …`), or find them from the files in `src/`.

---

## 1. Counts (from the check tool, last run: no errors)

Book words are the page `text`. The 200 to 450 word range is set on English only; Arabic and Hebrew carry prefixes and
endings inside words, so their counts run lower (age brief §2). Film seconds are estimates until a real voice reads them.

| Story | Title (en) | ar | he | en | da | Longest sentence (ar / he / en / da) | Film | Film words (ar / he / en / da) |
|---|---|---|---|---|---|---|---|---|
| B01 | Ten Goats Home | 254 | 243 | 290 | 289 | 12 / 11 / 14 / 14 | 249 s, 30 shots | 93 / 77 / 88 / 92 |
| B03 | The Chalk Sun | 236 | 240 | 311 | 294 | 12 / 13 / 13 / 13 | 252 s, 28 shots | 76 / 71 / 88 / 84 |
| B04 | The Clay Bird | 229 | 240 | 316 | 297 | 13 / 13 / 13 / 14 | 244 s, 31 shots | 88 / 89 / 108 / 115 |
| B05 | The Basket Moved | 204 | 238 | 300 | 295 | 11 / 11 / 13 / 13 | 246 s, 32 shots | 83 / 82 / 107 / 103 |
| B06 | Stand Still, Wave High | 246 | 247 | 311 | 319 | 13 / 13 / 14 / 14 | 242 s, 31 shots | 84 / 86 / 109 / 105 |
| B07 | Snow Day | 224 | 232 | 278 | 274 | 11 / 13 / 13 / 13 | 246 s, 29 shots | 69 / 69 / 80 / 86 |
| B08 | The Soap Song | 199 | 224 | 278 | 254 | 9 / 12 / 12 / 11 | 244 s, 27 shots | 71 / 68 / 79 / 65 |

Every story: 13 spreads (brief 12 to 14), words per spread 15 to 35 in English and Danish, sentences at most 14 words,
one exclamation mark per spread at most, one "why / what would you do / what happens next" question to the child,
3 activity steps (brief 2 or 3), 10 to 15 minutes (brief 10 to 20), captions of 12 words or fewer. Every film has
wordless shots and a held closing image with no autoplay. The films land near the bottom of the 4-to-5-minute range
(240 to 300 s), so a slower voice has room.

## 2. Choices made while writing (please check)

- **Names that are ordinary words** (the ledger says to record them): B01's Speckle is **نُقْطَة** (Dot), **נְקֻדָּה**
  (Dot), **Speckle**, **Prik**. I did not edit `outlines.md`; the ledger keeper should copy these in.
- **Which side of the family.** B01's aunt is the mother's sister in every language: خالَتُه, הַדּוֹדָה, Auntie,
  moster. B05's uncle is the father's brother: عَمّ ياسمين, הַדּוֹד, Yasmin's uncle, farbror (the cousin is his son).
- **New background characters, named by role only:** B05 Yasmin's mum and uncle (one line each; the brief's limit of
  four characters who speak is kept). B04's potter is a man (Lara and Grandma are both women). No new proper names.
- **B04, a fact.** Fired clay cannot really be mended by pressing wet clay into it. So the birds on the low shelf are
  still drying, unbaked; the mend works, and the potter says the bird goes into the kiln tomorrow "to make it strong".
  The finished glazed bird he blows into on page 3 is a different one. [D, general pottery knowledge, not source-checked]
- **B06.** No family names are invented: the book says "his whole name", and in the film Karam's voice fades under the
  music as he starts his full name. The class version lets a child give only a first name.
- **B07.** The snowball stopping in mid-air on "Stop" (outline) is in the film only, as a playful device.
- **B08.** No pepper trick. The oil-and-cocoa test follows the reviewed outline; the activity names its allergens
  (cocoa can carry milk or nut traces; no peanut or sesame oil). Children are not shown eating anything in any story;
  in B05 the grown-ups eat the dates.
- **Safety lines** use the calm general line in all four languages, as in the reviewed pilots.
- **Arabic** never puts a one-letter prefix (وَ| بِ| لِ|) directly before «: the tool cannot handle a prefix with no
  letters after it, so those sentences were reworded.

## 3. Lines I am least sure of, for the native editors

### Arabic
1. **Sound words, none verified:** رِنْ (goat bells), مَاااءْ (a goat's bleat, three alifs and a final hamza), هِيهَا
   (donkey), طَاخْ (snowball on a tree), طَشّْ (snowball on a face), قَرْشْ (snow underfoot), حَكّْ (nails), دُقْ
   (heartbeat), فِيُو، فِيوِي (clay whistle), دِنْ، دُونْ (shop chime).
2. **Words:** عَنَزَات as the plural of عَنْزَة (B01; alternative مَعَز); نُقْطَة as a goat's name and its diptote
   endings (نُقْطَةُ، يَا نُقْطَةْ); سُكُوتَر with a damma on the first letter (B03; no settled Standard word); الفَخَّارِي
   (B04); مَرْيَلَة for the apron and الْمَتْجَرُ الْكَبِيرُ for the supermarket (B06); دُمْيَةُ ثَلْجٍ for the snow
   lady, بَرْدَانَة, تُثْلِجْ (B07); الْحَنَفِيَّة, رَغْوَة (B08).
3. **Counting (B01):** the counted list uses the abstract forms with sukun (وَاحِدْ… تِسْعَةْ، عَشَرَةْ), then the total
   switches to the feminine-noun form for the goats: «تِسْعَةْ. تِسْعُ عَنَزَاتْ.», «تِسْعْ؟ لَكِنْ عِنْدَنَا عَشْرُ
   عَنَزَاتٍ», f09 «…عِنْدَنَا عَشْرْ». This follows the pilot review (E5). Also «كَانَ آخِرُ رَقْمٍ تِسْعَةْ» (رَقْم or
   عَدَد?).
4. **Dual verbs,** which the guide wants rare in group B: B07 رَمَيَاهَا، ضَحِكَا، دَحْرَجَا، صَنَعَا، جَعَلَا; B08 غَنَّيَا،
   رَجَعَا. They read naturally to me, but they are many in B07.
5. **Pauses that drop a gender ending on screen:** «أُمِّكْ؟» (B06), «فِي رَأْيِكْ؟», «جِئْتْ؟» (adult text). In the
   adult text I chose these because the pause makes them gender-free.
6. **Lines:** B03 p5 «صَرَخَتْ بِمَا تَشْعُرُ بِهِ حَقًّا»; B04 p11 «أُغْنِيَةً عَوْجَاءَ سَعِيدَةْ» (a "crooked" song);
   B05 p7 «أَيْنَ تَظُنُّ يَاسْمِينُ أَنَّ سَلَّتَهَا مَوْجُودَةْ؟» (the false-belief question); B06 title and refrain
   «نَقِفُ فِي مَكَانِنَا، وَنُلَوِّحُ عَالِيًا»; B07 p7 «تَوَقَّفِي. أَنَا لَا أُحِبُّ هَذَا.»; B08 the song «كَفٌّ عَلَى
   كَفّْ، وَظَهْرٌ عَلَى ظَهْرْ… وَالْأَصَابِعُ تَتَشَابَكْ، وَالْإِبْهَامُ يَدُورْ، وَالْأَظَافِرْ: حَكّْ، حَكّْ، حَكّْ!»
   (pausal forms at each rhyme on purpose); B03 reuses the pilot's question «وَأَنْتُمْ، مَاذَا كُنْتُمْ سَتَفْعَلُونْ؟».

### Hebrew
1. **Sound words:** דִּינְג (goat bells), מֶהההה (goat), אִי אָה (donkey, written without a maqaf because H8 bans it),
   טְרַח, פְּלַאק, פְּלוֹפּ, חְרַק (snow), גְּרֵד (nails), פִיוּ (clay whistle, פ without dagesh), דִּינְג, דּוֹנְג (shop).
2. **Stress marks I am least sure of:** לַסּוּפֶּרְמַ֫רְקֶט (stress on "mar"), כֶּ֫רֶם, בָּ֫אָה, רָ֫צָה, הוֹרִ֫ידָה,
   הֶחֱלִ֫יקָה, נָסַ֫עְתָּ, שֶׁהִתְאַמַּ֫נּוּ. Past forms like שָׁקְעָה, יָרְדוּ are left final-stressed, as in the pilots.
3. **Kamatz katan:** הָאׇזְנַיִם (oznayim), צׇהֳרַיִם, כׇּל.
4. **Vocal shva:** marked in מְנַפְנְפִים (both), נִפְתְּחוּ, נִשְׁבְּרָה, צִלְצְלוּ, גִּלְגְּלוּ, נִשְׁלְחוּ, נִשְׁמְעוּ,
   מִשְׁקְפֵי, הַתְּאֵנָה, הַתְּאוּרָה, הַבְּאֵר. Left silent on purpose, as modern speech says them: מֵאִצְטְרֻבָּל,
   הַלְּחָיַיִם, הָרְחוֹב, מִלְּאָה, לְדַעְתְּכֶם, וּבְכָל.
5. **Words:** קוֹרְקִינֶט (B03); בָּעֲרוּ for a hot, angry face and קָמְצָה אֶגְרוֹפִים (B03); בֻּבַּת שֶׁלֶג for the snow
   lady (B07); דּוֹחֲפִים וְטוֹפְחִים (B08 planting chant); נִגְּשָׁה לָרַמְקוֹל, כָּרְעָה (B06); כַּפִּית for Tamir's
   spoon, so that כַּף in the soap song means only the palm (B08).
6. **Lines:** B06 title and refrain עוֹמְדִים בַּמָּקוֹם, וּמְנַפְנְפִים לְמַעְלָה; B07 p7 "דַּי. אֲנִי לֹא אוֹהֵב אֶת
   זֶה." (דַּי for "Stop"); B08 song "כַּף עַל כַּף, גַּב עַל גַּב… אֶצְבָּעוֹת שְׁלוּבוֹת, אֲגוּדָל מִסְתּוֹבֵב, וְצִפָּרְנַיִם:
   גְּרֵד, גְּרֵד, גְּרֵד!"; B05 p7 אֵיפֹה יַסְמִין חוֹשֶׁבֶת שֶׁהַסַּל נִמְצָא?; B01 p9 עָמַד בְּלִי לָזוּז (I avoided עָמַד
   דּוּם, which sounds military).

### English
1. **Sound words:** "Clink, clank, clink" (goat bells), "Meh" (goat), "Fee-oo-wee" (clay whistle), "Thwack",
   "Splat", "Plop", "Ding-dong". "Snow lady" is the outline's word; "snowman" is more usual.
2. B03 p5 "She stamped her foot and shouted out exactly how she felt. “I’M ANGRY! You rode over my sun.”": do the
   capitals help the voice, or should the shout be shown only by the tag?
3. B06 uses "Dad" (style guide) where the outline says "Papa".
4. B05 p7 "Where does Yasmin think the basket is?" is the classic false-belief question; a parent may need the
   adult note to see why it is asked.

### Danish
1. **Sound words:** "Kling, klang", "Mæh", "Svisj", "Bump", "Splat", "Plump", "Knæk", "Fiu", "I-a", "knas", "Bank".
2. **Words:** "Prik" for Speckle; "moster" and "farbror" (chosen to match the Arabic family side); "johannesbrødtræ"
   (a long compound for group B, but the real word for carob); "snedame"; "tommeltot"; "ekspedienten"; "Karam fik en
   knude i maven"; "Hun gumlede på en tidsel"; "Kom, så laver vi den sammen" (laver = mends).
3. **Commas:** written without the optional start comma (style-da §6.2), with the end comma after a subordinate
   clause ("Den der leder, går og løber ikke"). Please confirm both.

## 4. Not done, and not checked

- No native read in any language; the voice marks are untested with the voice engine.
- No pictures, films or audio were made, so nothing could be checked on screen; film timings are estimates.
- Facts marked [D] above (pottery, dates picked in autumn, rare hill snow) were not source-checked in this batch.
